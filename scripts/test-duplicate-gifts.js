import WebSocket from 'ws';

const ws = new WebSocket('ws://localhost:8080?skipAuth=true');

ws.on('open', () => {
  console.log('Connected to WebSocket server');
  
  // Send join_room message
  ws.send(JSON.stringify({
    event: 'join_room',
    data: {
      roomId: 'test-room',
      userId: 'test-user-1',
      username: 'TestUser1',
      skipAuth: true
    }
  }));
  
  // Wait for room join confirmation
  setTimeout(() => {
    const transactionId = 'duplicate_test_' + Date.now();
    const gift = { id: 'heart', name: 'Heart', coins: 10 };
    
    // Send first gift
    console.log('\nSending first gift with transaction ID:', transactionId);
    ws.send(JSON.stringify({
      event: 'gift_sent',
      data: {
        gift,
        transactionId,
        target: {
          userId: 'streamer_123',
          username: 'TestStreamer'
        }
      }
    }));
    
    // Send duplicate after 500ms
    setTimeout(() => {
      console.log('\nSending duplicate gift with same transaction ID:', transactionId);
      ws.send(JSON.stringify({
        event: 'gift_sent',
        data: {
          gift,
          transactionId,
          target: {
            userId: 'streamer_123',
            username: 'TestStreamer'
          }
        }
      }));
    }, 500);
    
    // Send another duplicate after 1 second
    setTimeout(() => {
      console.log('\nSending another duplicate gift with same transaction ID:', transactionId);
      ws.send(JSON.stringify({
        event: 'gift_sent',
        data: {
          gift,
          transactionId,
          target: {
            userId: 'streamer_123',
            username: 'TestStreamer'
          }
        }
      }));
    }, 1000);
  }, 500);
});

ws.on('message', (data) => {
  const message = JSON.parse(data.toString());
  
  if (message.event === 'gift_ack') {
    console.log('\nReceived ACK:', {
      transactionId: message.data.transactionId,
      status: message.data.status,
      timestamp: new Date(message.data.timestamp).toISOString()
    });
  } else if (message.event === 'gift_sent') {
    console.log('\nReceived gift broadcast');
  } else {
    console.log('\nReceived:', message.event);
  }
});

ws.on('error', (error) => {
  console.error('WebSocket error:', error);
});

ws.on('close', () => {
  console.log('\nDisconnected from WebSocket server');
});

// Close after 3 seconds
setTimeout(() => {
  console.log('\nTest complete. Closing connection...');
  ws.close();
  process.exit(0);
}, 3000);