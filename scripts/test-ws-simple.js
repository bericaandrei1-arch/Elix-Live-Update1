import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080?skipAuth=true');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send join_room message
  const message = {
    event: 'join_room',
    data: {
      roomId: 'test-room',
      userId: 'test-user-1',
      username: 'TestUser1',
      skipAuth: true
    }
  };
  
  console.log('Sending:', JSON.stringify(message));
  ws.send(JSON.stringify(message));
  
  // Send a gift after 1 second
  setTimeout(() => {
    const giftMessage = {
      event: 'gift_sent',
      data: {
        gift: { id: 'heart', name: 'Heart', coins: 10 },
        transactionId: 'test_transaction_123',
        target: {
          userId: 'streamer_123',
          username: 'TestStreamer'
        }
      }
    };
    
    console.log('Sending gift:', JSON.stringify(giftMessage));
    ws.send(JSON.stringify(giftMessage));
  }, 1000);
});

ws.on('message', (data) => {
  console.log('Received:', data.toString());
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('Disconnected from WebSocket server');
});

// Keep the script running
setTimeout(() => {
  console.log('Closing connection...');
  ws.close();
  process.exit(0);
}, 5000);