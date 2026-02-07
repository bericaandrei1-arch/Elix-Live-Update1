// WebSocket Server for Real-Time Features
// Run with: npm run ws:server

import { WebSocketServer, WebSocket } from 'ws';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const PORT = process.env.WS_PORT || 8080;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

let supabase: ReturnType<typeof createClient>;
try {
  supabase = createClient(
    requireEnv('VITE_SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY')
  );
} catch (e) {
  console.error(e);
  process.exit(1);
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

const wss = new WebSocketServer({ port: Number(PORT) });

console.log(`WebSocket server started on port ${PORT}`);

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

    case 'gift_sent':
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

    case 'battle_invite':
      // Send to specific user (challenger)
      const targetRoom = data.challenger_stream_id;
      broadcastToRoom(targetRoom, 'battle_invite', data);
      break;

    case 'battle_accepted':
    case 'battle_declined':
      // Notify host
      const hostRoom = data.host_stream_id;
      broadcastToRoom(hostRoom, event, data);
      break;

    default:
      console.log('Unknown event:', event);
  }
}

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

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down...');
  wss.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
