import WebSocket from 'ws';

// Skip Supabase auth for testing
process.env.SKIP_SUPABASE_AUTH = 'true';

const ROOM_ID = 'test-room';
const NUM_CLIENTS = 10;
const GIFTS_PER_CLIENT = 5;
const DELAY_BETWEEN_GIFTS = 500; // ms

const gifts = [
  { id: 'rose', name: 'Rose', icon: '🌹', coins: 10 },
  { id: 'heart', name: 'Heart', icon: '❤️', coins: 20 },
  { id: 'star', name: 'Star', icon: '⭐', coins: 50 },
  { id: 'diamond', name: 'Diamond', icon: '💎', coins: 100 },
  { id: 'crown', name: 'Crown', icon: '👑', coins: 500 }
];

async function createClient(clientId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://localhost:8080?room=${ROOM_ID}&token=test-user-${clientId}`);
    
    ws.on('open', () => {
      console.log(`Client ${clientId} connected`);
      resolve(ws);
    });
    
    ws.on('error', reject);
  });
}

async function sendGift(ws, clientId, giftIndex) {
  const gift = gifts[Math.floor(Math.random() * gifts.length)];
  const transactionId = `client${clientId}_gift${giftIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return new Promise((resolve) => {
    const ackTimeout = setTimeout(() => {
      console.log(`Client ${clientId}: Gift ${giftIndex} - No ACK received (timeout)`);
      resolve(false);
    }, 3000);
    
    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.event === 'gift_ack' && message.data.transactionId === transactionId) {
        clearTimeout(ackTimeout);
        console.log(`Client ${clientId}: Gift ${giftIndex} - ACK received (${message.data.status})`);
        resolve(true);
      }
    });
    
    ws.send(JSON.stringify({
      event: 'gift_sent',
      data: {
        gift,
        transactionId,
        target: 'me'
      },
      requireAck: true
    }));
    
    console.log(`Client ${clientId}: Sent gift ${giftIndex} - ${gift.name} (${transactionId})`);
  });
}

async function runLoadTest() {
  console.log('Starting gift load test...');
  console.log(`Creating ${NUM_CLIENTS} clients...`);
  
  const clients = [];
  
  // Create all clients
  for (let i = 0; i < NUM_CLIENTS; i++) {
    try {
      const ws = await createClient(i);
      clients.push({ id: i, ws });
    } catch (error) {
      console.error(`Failed to create client ${i}:`, error.message);
    }
  }
  
  console.log(`\nSending ${GIFTS_PER_CLIENT} gifts per client...`);
  
  // Send gifts from each client
  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    duplicates: 0
  };
  
  for (const client of clients) {
    for (let i = 0; i < GIFTS_PER_CLIENT; i++) {
      results.total++;
      
      const success = await sendGift(client.ws, client.id, i);
      if (success) {
        results.successful++;
      } else {
        results.failed++;
      }
      
      // Delay between gifts
      await new Promise(resolve => setTimeout(resolve, DELAY_BETWEEN_GIFTS));
    }
  }
  
  // Test duplicate detection
  console.log('\nTesting duplicate detection...');
  const testClient = clients[0];
  if (testClient) {
    const duplicateTransactionId = `duplicate_test_${Date.now()}`;
    
    // Send first gift
    await new Promise((resolve) => {
      testClient.ws.send(JSON.stringify({
        event: 'gift_sent',
        data: {
          gift: gifts[0],
          transactionId: duplicateTransactionId,
          target: 'me'
        },
        requireAck: true
      }));
      setTimeout(resolve, 1000);
    });
    
    // Send duplicate
    await new Promise((resolve) => {
      testClient.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.event === 'gift_ack' && message.data.transactionId === duplicateTransactionId) {
          if (message.data.status === 'duplicate') {
            console.log('Duplicate detection: PASS');
            results.duplicates++;
          } else {
            console.log('Duplicate detection: FAIL');
          }
          resolve();
        }
      });
      
      testClient.ws.send(JSON.stringify({
        event: 'gift_sent',
        data: {
          gift: gifts[0],
          transactionId: duplicateTransactionId,
          target: 'me'
        },
        requireAck: true
      }));
    });
  }
  
  // Summary
  console.log('\n=== LOAD TEST RESULTS ===');
  console.log(`Total gifts sent: ${results.total}`);
  console.log(`Successful ACKs: ${results.successful}`);
  console.log(`Failed/Timeout: ${results.failed}`);
  console.log(`Duplicates detected: ${results.duplicates}`);
  console.log(`Success rate: ${((results.successful / results.total) * 100).toFixed(2)}%`);
  
  // Cleanup
  console.log('\nClosing connections...');
  clients.forEach(client => client.ws.close());
  
  setTimeout(() => {
    console.log('Test complete!');
    process.exit(0);
  }, 1000);
}

// Run the test
runLoadTest().catch(console.error);