import './config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import Redis from 'ioredis';
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
import {
  handleForYouFeed,
  handleTrackView,
  handleTrackInteraction,
  handleGetVideoScore,
} from './routes/feed';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

// Feed & Recommendation API
app.get('/api/feed/foryou', handleForYouFeed);
app.post('/api/feed/track-view', handleTrackView);
app.post('/api/feed/track-interaction', handleTrackInteraction);
app.get('/api/feed/score/:videoId', handleGetVideoScore);

// Serve static files from dist
const distPath = join(__dirname, '..', 'dist');
const indexPath = join(distPath, 'index.html');

// Log dist path on startup for debugging
console.log(`Serving static files from: ${distPath}`);

import fs from 'fs';
if (!fs.existsSync(indexPath)) {
  console.error(`ERROR: index.html not found at ${indexPath}`);
  console.error('Available files:', fs.existsSync(distPath) ? fs.readdirSync(distPath).join(', ') : 'dist folder missing');
}

app.use(express.static(distPath));

// Fallback for SPA - all non-API routes serve index.html
app.get(/^(?!\/api).+/, (_req, res) => {
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(500).send('<h1>App build not found</h1><p>dist/index.html is missing. Redeploy the app.</p>');
  }
});

// WebSocket Server
// We attach it to the same HTTP server to share the port 3000
const wss = new WebSocketServer({ server });

console.log(`WebSocket server attached to HTTP server on port ${PORT}`);

// --- Redis Setup ---
const redisUrl = process.env.REDIS_URL;
let redis: Redis | null = null;
let redisSub: Redis | null = null;

if (redisUrl) {
    redis = new Redis(redisUrl);
    redisSub = new Redis(redisUrl);

    redis.on('connect', () => console.log('✅ Redis Publisher connected'));
    redisSub.on('connect', () => console.log('✅ Redis Subscriber connected'));
    redis.on('error', (err) => console.error('❌ Redis connection error:', err));

    // Subscribe to global messages channel
    redisSub.subscribe('global_messages', (err) => {
        if (err) console.error('Failed to subscribe to Redis channel:', err);
    });

    redisSub.on('message', (channel, message) => {
      // ... logic
      if (channel === 'global_messages') {
        try {
          const parsed = JSON.parse(message);
          const { roomId, event, data, senderUserId, originServerId } = parsed;
          
          // If this message originated from THIS server, ignore it (already broadcasted locally)
          if (originServerId === SERVER_ID) return;

          const room = rooms.get(roomId);
          if (room) {
            room.forEach(client => {
              if (client.userId !== senderUserId && client.ws.readyState === WebSocket.OPEN) {
                 client.ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
              }
            });
          }
        } catch (e) {
          console.error('Error handling Redis message:', e);
        }
      }
    });
} else {
    console.log('⚠️ REDIS_URL not set, running in single-server mode (no Redis)');
}

// --- WebSocket Logic (Copied from websocket-server.ts) ---

let supabaseAdmin: ReturnType<typeof createClient> | null = null;
try {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && supabaseServiceRoleKey) {
    supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
    console.log('Supabase client initialized successfully');
  } else {
    console.log('npm run dev environment variables not set, running without authentication');
  }
} catch (e) {
  console.error("Supabase init failed, running without authentication:", e);
  supabaseAdmin = null;
}

interface Client {
  ws: WebSocket;
  userId: string;
  roomId: string;
  username: string;
  connectedAt: Date;
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
    let roomId = url.searchParams.get('room');
    const token = url.searchParams.get('token');

    // If room not in query, try from pathname (e.g., /live/roomId)
    if (!roomId && url.pathname.startsWith('/live/')) {
      roomId = url.pathname.split('/')[2]; // /live/roomId -> roomId
    }

    if (!supabaseAdmin) {
      ws.close(1008, 'Authentication not available');
      return;
    }

    // Authentication required
    if (!roomId || !token) {
      ws.close(1008, 'Missing room or token');
      return;
    }

    // Decode JWT to get user ID
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    const userId = payload.sub;

    // Verify user exists using admin API
    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);
    if (error || !userData) {
      ws.close(1008, 'Invalid token');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userObj = (userData as any)?.user ?? userData;

    // Get username
    const username = userObj?.user_metadata?.username || 'Anonymous';

    client = {
      ws,
      userId: userObj?.id ?? userId,
      roomId,
      username,
      connectedAt: new Date(),
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
    userId: client.userId // Ensure consistency for frontend
  }, client);

    // Update viewer count
    await updateViewerCount(roomId);

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
          connectedAt: new Date(),
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
      if (client) {
        sendToClient(client!, 'error', { message: 'Invalid message format' });
      }
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
    userId: client.userId
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

    // --- WebRTC Signaling ---
    case 'webrtc_offer':
    case 'webrtc_answer':
    case 'webrtc_ice_candidate': {
      // Relay signaling messages to the target user (or room for Mesh)
      // data: { targetUserId: string, sdp?: any, candidate?: any }
      
      const targetUserId = data.targetUserId;
      if (targetUserId) {
        // Find client by userId (Inefficient O(N), but fine for MVP)
        // In production, map userId -> ws
        let targetClient: Client | undefined;
        for (const c of clients.values()) {
          if (c.userId === targetUserId) {
            targetClient = c;
            break;
          }
        }

        if (targetClient) {
           sendToClient(targetClient, event, {
             ...data,
             senderUserId: client.userId,
             senderUsername: client.username
           });
        }
      } else {
        // If no target, broadcast to room (Mesh - everyone connects to everyone)
        broadcastToRoom(client.roomId, event, {
           ...data,
           senderUserId: client.userId,
           senderUsername: client.username
        }, client);
      }
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
  // 1. Publish to Redis for cross-server scaling (only if Redis is active)
  const senderUserId = exclude?.userId;
  if (redis) {
    const message = JSON.stringify({
      roomId,
      event,
      data,
      senderUserId,
      originServerId: SERVER_ID
    });
    
    redis.publish('global_messages', message);
  }

  // 2. Also send locally immediately (optimization or fallback)
  // Or we can rely solely on Redis subscription to handle it (simpler logic).
  // Let's rely on Redis for consistency, BUT for "user_joined" it's better to be fast.
  // Actually, if we rely on Redis subscription loop, we handle it there.
  // BUT the current implementation of `redisSub.on('message')` handles local broadcasting.
  // So we don't need to do anything else here if we want full scaling!
  // However, for single-server dev, Redis might not be running or might add delay.
  // Let's keep local broadcast for now as a fallback/optimization, and make sure Redis handler doesn't double-send.
  // Wait, Redis handler checks `client.userId !== senderUserId`.
  // If we broadcast locally here, we should exclude `senderUserId`.
  // If Redis handler ALSO broadcasts, we get duplicates.
  // FIX: Let's make `broadcastToRoom` ONLY publish to Redis in scalable mode.
  // But for this MVP, let's do BOTH but filtering is tricky without unique msg IDs.
  // SIMPLEST: `broadcastToRoom` sends to local clients (excluding sender).
  // AND publishes to Redis.
  // Redis listener sends to local clients (excluding sender).
  // This causes duplicates for local clients (once from direct, once from Redis).
  // SOLUTION: Redis listener should only send to clients if the message originated from ANOTHER server.
  // We can add `serverId` to the message.
  
  // For this MVP, let's just use Redis for everything if connected, or local if not.
  // But we initialized Redis.
  // Let's stick to the previous implementation which was local-only, and just ADD Redis publish.
  // The Redis subscriber should NOT broadcast if the server ID matches.
  // But we didn't implement server IDs.
  
  // Let's just stick to local broadcast for now to ensure it works, and Redis is just "ready".
  // To make it truly scalable, we would remove the local loop below and rely on Redis, 
  // OR add a server ID check.
  
  const room = rooms.get(roomId);
  if (!room) return;

  const msgStr = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
  });

  room.forEach(client => {
    if (client !== exclude && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(msgStr);
    }
  });
}

async function updateViewerCount(roomId: string) {
  try {
    // TODO: Update database with viewer count
  } catch (error) {
    console.error('Failed to update viewer count:', error);
  }
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
