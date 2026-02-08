import WebSocket from 'ws';

// Skip Supabase auth for testing
process.env.SKIP_SUPABASE_AUTH = 'true';

// Load test configuration
const WS_URL = process.env.WS_URL || 'ws://localhost:8080';
const NUM_CLIENTS = parseInt(process.env.NUM_CLIENTS) || 10;
const GIFTS_PER_CLIENT = parseInt(process.env.GIFTS_PER_CLIENT) || 5;
const DELAY_BETWEEN_GIFTS = parseInt(process.env.DELAY_MS) || 1000;

const ROOM_ID = 'test-room';
const GIFTS = [
  { id: 'heart', name: 'Heart', coins: 10 },
  { id: 'rose', name: 'Rose', coins: 50 },
  { id: 'star', name: 'Star', coins: 100 },
  { id: 'crown', name: 'Crown', coins: 500 },
  { id: 'diamond', name: 'Diamond', coins: 1000 }
];

const stats = {
  sent: 0,
  acked: 0,
  duplicates: 0,
  failed: 0,
  noAck: 0
};

const pendingAcks = new Map();

function createClient(clientId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL + '?skipAuth=true');
    const userId = `user_${clientId}`;
    const username = `TestUser${clientId}`;
    
    ws.on('open', () => {
      // Skip auth, just join room directly
      ws.send(JSON.stringify({
        event: 'join_room',
        data: {
          roomId: ROOM_ID,
          userId,
          username,
          skipAuth: true // Signal to server to skip auth
        }
      }));
      
      console.log(`Client ${clientId} connected`);
      resolve({ ws, clientId, userId, username });
    });
    
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        
        if (message.event === 'gift_ack') {
          const { transactionId, status } = message.data;
          const pending = pendingAcks.get(transactionId);
          
          if (pending) {
            clearTimeout(pending.timeout);
            pendingAcks.delete(transactionId);
            
            if (status === 'success') {
              stats.acked++;
              console.log(`Client ${clientId}: Gift ACK received - ${transactionId}`);
            } else if (status === 'duplicate') {
              stats.duplicates++;
              console.log(`Client ${clientId}: Duplicate gift detected - ${transactionId}`);
            }
          }
        }
      } catch (error) {
        console.error(`Client ${clientId}: Error parsing message:`, error);
      }
    });
    
    ws.on('error', (error) => {
      console.error(`Client ${clientId} error:`, error);
      reject(error);
    });
    
    ws.on('close', () => {
      console.log(`Client ${clientId} disconnected`);
    });
  });
}

async function sendGift(client, giftIndex) {
  const gift = GIFTS[Math.floor(Math.random() * GIFTS.length)];
  const transactionId = `client${client.clientId}_gift${giftIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const message = {
    event: 'gift_sent',
    data: {
      gift,
      transactionId,
      target: {
        userId: 'streamer_123',
        username: 'TestStreamer'
      }
    }
  };
  
  client.ws.send(JSON.stringify(message));
  stats.sent++;
  
  console.log(`Client ${client.clientId}: Sent gift ${giftIndex} - ${gift.name} (${transactionId})`);
  
  // Set up ACK timeout
  const timeout = setTimeout(() => {
    pendingAcks.delete(transactionId);
    stats.noAck++;
    console.log(`Client ${client.clientId}: Gift ${giftIndex} - No ACK received (timeout)`);
  }, 3000);
  
  pendingAcks.set(transactionId, { timeout, clientId: client.clientId, giftIndex });
}

async function runLoadTest() {
  console.log('Starting gift load test...');
  console.log(`Creating ${NUM_CLIENTS} clients...`);
  
  // Create all clients
  const clients = [];
  for (let i = 0; i < NUM_CLIENTS; i++) {
    try {
      const client = await createClient(i);
      clients.push(client);
    } catch (error) {
      console.error(`Failed to create client ${i}:`, error);
    }
  }
  
  console.log(`\nSending ${GIFTS_PER_CLIENT} gifts per client...`);
  
  // Send gifts from each client
  for (let giftIndex = 0; giftIndex < GIFTS_PER_CLIENT; giftIndex++) {
    for (const client of clients) {
      await sendGift(client, giftIndex);
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_GIFTS));
    }
  }
  
  // Wait for all ACKs
  console.log('\nWaiting for remaining ACKs...');
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  // Test duplicate detection
  console.log('\nTesting duplicate detection...');
  const testClient = clients[0];
  if (testClient) {
    const duplicateTransactionId = 'duplicate_test_123';
    
    // Send first gift
    testClient.ws.send(JSON.stringify({
      event: 'gift_sent',
      data: {
        gift: GIFTS[0],
        transactionId: duplicateTransactionId,
        target: { userId: 'streamer_123', username: 'TestStreamer' }
      }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Send duplicate
    testClient.ws.send(JSON.stringify({
      event: 'gift_sent',
      data: {
        gift: GIFTS[0],
        transactionId: duplicateTransactionId,
        target: { userId: 'streamer_123', username: 'TestStreamer' }
      }
    }));
    
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Print statistics
  console.log('\n=== Load Test Results ===');
  console.log(`Total gifts sent: ${stats.sent}`);
  console.log(`Successful ACKs: ${stats.acked}`);
  console.log(`Duplicates detected: ${stats.duplicates}`);
  console.log(`No ACK (timeout): ${stats.noAck}`);
  console.log(`Success rate: ${((stats.acked / stats.sent) * 100).toFixed(2)}%`);
  
  // Close all connections
  clients.forEach(client => client.ws.close());
  
  process.exit(0);
}

runLoadTest().catch(console.error);