import './config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { createCheckoutSession, createPaymentIntent } from './routes/checkout';
import { handleStripeWebhook } from './routes/webhook';
import { 
  handleAnalytics, 
  handleBlockUser, 
  handleDeleteAccount, 
  handleReport, 
  handleSendNotification, 
  handleVerifyPurchase 
} from './routes/misc';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());

// Webhook needs raw body
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Other routes use JSON
app.use(express.json());

// Health check endpoint (must be before static files)
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// API Routes
app.post('/api/create-checkout-session', createCheckoutSession);
app.post('/api/create-payment-intent', createPaymentIntent);
app.post('/api/analytics', handleAnalytics);
app.post('/api/block-user', handleBlockUser);
app.post('/api/delete-account', handleDeleteAccount);
app.post('/api/report', handleReport);
app.post('/api/send-notification', handleSendNotification);
app.post('/api/verify-purchase', handleVerifyPurchase);

// Serve static files from dist
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// Fallback for SPA
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// WebSocket Server
// We attach it to the same HTTP server to share the port 3000
const wss = new WebSocketServer({ server });

console.log(`WebSocket server attached to HTTP server on port ${PORT}`);

// --- WebSocket Logic (Copied from websocket-server.ts) ---

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.warn(`Missing optional environment variable: ${name}`);
    return '';
  }
  return value;
}

let supabase: ReturnType<typeof createClient>;
try {
  const sbUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
  if (!sbUrl || !sbKey) throw new Error("Missing Supabase Config");
  supabase = createClient(sbUrl, sbKey);
} catch (e) {
  console.error("Supabase init failed", e);
}

interface Client {
  ws: WebSocket;
  userId: string;
  roomId: string;
  username: string;
}

const rooms = new Map<string, Set<Client>>();
const clients = new Map<WebSocket, Client>();
const processedTransactions = new Map<string, number>();

wss.on('connection', async (ws: WebSocket, req) => {
  let client: Client | null = null;

  try {
    console.log('New connection');

    if (!req.url) {
      ws.close(1008, 'Missing URL');
      return;
    }

    // Parse room and token from URL
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const roomId = url.searchParams.get('room');
    const token = url.searchParams.get('token');
    const skipAuth = url.searchParams.get('skipAuth') === 'true';

    // If skipAuth is true, allow connection without authentication
    if (skipAuth) {
      console.log('Skipping authentication for test connection');
      // Client will send join_room message with details
    } else {
      // Normal authentication flow
      if (!roomId || !token) {
        ws.close(1008, 'Missing room or token');
        return;
      }

      // Verify token and get user
      const { data: userData, error } = await supabase.auth.getUser(token);

      if (error || !userData.user) {
        ws.close(1008, 'Invalid token');
        return;
      }

      // Get username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('user_id', userData.user.id)
        .single();

      client = {
        ws,
        userId: userData.user.id,
        roomId,
        username: profile?.username || 'Anonymous',
      };

      clients.set(ws, client);

      // Add to room
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId)!.add(client);

      // Send welcome message
      sendToClient(client, 'connected', {
        room_id: roomId,
        user_count: rooms.get(roomId)!.size,
      });

      // Broadcast user joined
      broadcastToRoom(roomId, 'user_joined', {
        user_id: client.userId,
        username: client.username,
      }, client);

      // Update viewer count
      await updateViewerCount(roomId);
    }

  } catch (error) {
    console.error('Connection setup error:', error);
    ws.close(1011, 'Server error');
    return;
  }

  // Add error handler
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });

  // Handle messages
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      const { event, data: eventData } = message;
      
      console.log('Received message:', event, eventData);

      // Handle join_room for testing
      if (event === 'join_room' && eventData && eventData.skipAuth) {
        const { roomId, userId, username } = eventData;
        
        client = {
          ws,
          userId,
          roomId,
          username,
        };
        
        clients.set(ws, client);
        
        // Add to room
        if (!rooms.has(roomId)) {
          rooms.set(roomId, new Set());
        }
        rooms.get(roomId)!.add(client);
        
        // Send join confirmation
        sendToClient(client, 'room_joined', {
          roomId,
          userId,
          username
        });
        
        console.log(`Test client joined: ${username} in room ${roomId}`);
        return;
      }

      if (!client) {
        console.error('Message from unauthenticated client');
        return;
      }

      await handleMessage(client, event, eventData);
    } catch (error) {
      console.error('Failed to handle message:', error);
      sendToClient(client, 'error', { message: 'Invalid message format' });
    }
  });

  // Handle disconnect
  ws.on('close', async () => {
    console.log('Client disconnected');
    
    if (!client) return;

    const room = rooms.get(client.roomId);
    if (room) {
      room.delete(client);

      // Broadcast user left
      broadcastToRoom(client.roomId, 'user_left', {
        user_id: client.userId,
        username: client.username,
      });

      // Update viewer count
      await updateViewerCount(client.roomId);

      // Clean up empty rooms
      if (room.size === 0) {
        rooms.delete(client.roomId);
      }
    }

    clients.delete(ws);
  });
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMessage(client: Client, event: string, data: any) {
  switch (event) {
    case 'chat_message':
      // Broadcast chat message to room
      broadcastToRoom(client.roomId, 'chat_message', {
        ...data,
        user_id: client.userId,
        username: client.username,
        timestamp: new Date().toISOString(),
      });
      break;

    case 'gift_sent': {
      const { transactionId } = data;
      
      // Check for duplicate transaction
      if (transactionId && processedTransactions.has(transactionId)) {
        sendToClient(client, 'gift_ack', {
          transactionId,
          status: 'duplicate',
          timestamp: processedTransactions.get(transactionId)
        });
        return;
      }
      
      // Process new transaction
      const now = Date.now();
      if (transactionId) {
        processedTransactions.set(transactionId, now);
        
        // Clean up old transactions (older than 5 minutes)
        const fiveMinutesAgo = now - 5 * 60 * 1000;
        for (const [id, timestamp] of processedTransactions) {
          if (timestamp < fiveMinutesAgo) {
            processedTransactions.delete(id);
          }
        }
      }
      
      // Broadcast gift to room
      broadcastToRoom(client.roomId, 'gift_sent', {
        ...data,
        user_id: client.userId,
        username: client.username,
        timestamp: new Date().toISOString(),
      });
      
      // Send ACK back to sender
      if (transactionId) {
        sendToClient(client, 'gift_ack', {
          transactionId,
          status: 'success',
          timestamp: now
        });
      }
      break;
    }

    case 'battle_score_update':
      // Broadcast score update
      broadcastToRoom(client.roomId, 'battle_score_update', data);
      break;

    case 'booster_activated':
      // Broadcast booster activation
      broadcastToRoom(client.roomId, 'booster_activated', {
        ...data,
        user_id: client.userId,
      });
      break;

    case 'battle_invite': {
      // Send to specific user (challenger)
      const targetRoom = data.challenger_stream_id;
      broadcastToRoom(targetRoom, 'battle_invite', data);
      break;
    }

    case 'battle_accepted':
    case 'battle_declined': {
      // Notify host
      const hostRoom = data.host_stream_id;
      broadcastToRoom(hostRoom, event, data);
      break;
    }

    default:
      console.log('Unknown event:', event);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sendToClient(client: Client, event: string, data: any) {
  try {
    if (client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
      }));
    }
  } catch (error) {
    console.error('Failed to send to client:', error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function broadcastToRoom(roomId: string, event: string, data: any, exclude?: Client) {
  const room = rooms.get(roomId);
  if (!room) return;

  let message: string;
  try {
    message = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Failed to serialize message:', error);
    return;
  }

  room.forEach(client => {
    if (client !== exclude && client.ws.readyState === WebSocket.OPEN) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error('Failed to send to client:', error);
      }
    }
  });
}

async function updateViewerCount(roomId: string) {
  try {
    const room = rooms.get(roomId);
    const count = room?.size || 0;

    // Update database
    const { error } = await supabase
      .from('live_streams')
      .update({ viewer_count: count })
      .eq('id', roomId);

    if (error) {
      console.error('Failed to update viewer count in database:', error);
    }

    // Broadcast to room
    broadcastToRoom(roomId, 'viewer_count_update', { count });
  } catch (error) {
    console.error('updateViewerCount error:', error);
  }
}

// Start Server — bind to 0.0.0.0 so Railway/Docker can reach it
server.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on 0.0.0.0:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
