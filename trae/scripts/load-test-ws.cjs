#!/usr/bin/env node
/**
 * WebSocket Load Test Script
 * 
 * Simulates multiple concurrent WebSocket clients connecting to a live room,
 * sending gifts, and awaiting ACK responses.
 * 
 * Usage:
 *   node scripts/load-test-ws.js [WS_URL] [NUM_CLIENTS] [GIFTS_PER_CLIENT] [DURATION_SEC]
 * 
 * Examples:
 *   node scripts/load-test-ws.js ws://localhost:3001 100 20 1800
 *   node scripts/load-test-ws.js wss://your-server.com/live 50 10 600
 * 
 * Default: 100 clients, 20 gifts each, 1800s (30min)
 */

const WebSocket = require('ws');

// ─── Configuration ───────────────────────────────────────────────
const WS_URL = process.argv[2] || process.env.WS_URL || 'ws://localhost:3001';
const NUM_CLIENTS = parseInt(process.argv[3] || process.env.NUM_CLIENTS || '100', 10);
const GIFTS_PER_CLIENT = parseInt(process.argv[4] || process.env.GIFTS_PER_CLIENT || '20', 10);
const DURATION_SEC = parseInt(process.argv[5] || process.env.DURATION_SEC || '1800', 10);
const ROOM_ID = process.env.ROOM_ID || 'load-test-room-001';
const ACK_TIMEOUT_MS = 5000; // 5s to receive gift ACK
const CONNECT_STAGGER_MS = 50; // stagger connections by 50ms each

// ─── Metrics ─────────────────────────────────────────────────────
const metrics = {
  connectAttempts: 0,
  connectSuccess: 0,
  connectFailed: 0,
  giftsSent: 0,
  giftsAcked: 0,
  giftsTimedOut: 0,
  messagesReceived: 0,
  errors: 0,
  disconnects: 0,
  reconnects: 0,
  latencies: [], // ms per ACK
  startTime: Date.now(),
};

// ─── Client Class ────────────────────────────────────────────────
class LoadTestClient {
  constructor(id) {
    this.id = id;
    this.userId = `load-test-user-${id}`;
    this.ws = null;
    this.connected = false;
    this.giftsSent = 0;
    this.pendingAcks = new Map(); // giftId -> { timestamp, timeout }
  }

  connect() {
    return new Promise((resolve) => {
      metrics.connectAttempts++;
      const url = `${WS_URL}/live/${ROOM_ID}?token=load-test-token-${this.id}`;

      try {
        this.ws = new WebSocket(url, {
          headers: { 'X-Client-Id': this.userId },
          handshakeTimeout: 10000,
        });
      } catch (err) {
        metrics.connectFailed++;
        metrics.errors++;
        resolve(false);
        return;
      }

      const connectTimeout = setTimeout(() => {
        if (!this.connected) {
          metrics.connectFailed++;
          try { this.ws.terminate(); } catch (_) { /* ignore */ }
          resolve(false);
        }
      }, 10000);

      this.ws.on('open', () => {
        this.connected = true;
        metrics.connectSuccess++;
        clearTimeout(connectTimeout);

        // Join room
        this.send('joinRoom', { roomId: ROOM_ID, userId: this.userId });
        resolve(true);
      });

      this.ws.on('message', (data) => {
        metrics.messagesReceived++;
        try {
          const msg = JSON.parse(data.toString());
          this.handleMessage(msg);
        } catch (_) {
          // Non-JSON message
        }
      });

      this.ws.on('error', (err) => {
        metrics.errors++;
        if (!this.connected) {
          metrics.connectFailed++;
          clearTimeout(connectTimeout);
          resolve(false);
        }
      });

      this.ws.on('close', () => {
        if (this.connected) {
          metrics.disconnects++;
          this.connected = false;
        }
      });
    });
  }

  handleMessage(msg) {
    // Check for gift ACK
    if (msg.event === 'gift_sent' && msg.data?.giftId) {
      const pending = this.pendingAcks.get(msg.data.giftId);
      if (pending) {
        const latency = Date.now() - pending.timestamp;
        metrics.giftsAcked++;
        metrics.latencies.push(latency);
        clearTimeout(pending.timeout);
        this.pendingAcks.delete(msg.data.giftId);
      }
    }
  }

  sendGift() {
    if (!this.connected || this.giftsSent >= GIFTS_PER_CLIENT) return false;

    const giftId = `gift-${this.id}-${this.giftsSent}`;
    const payload = {
      giftId,
      giftType: 'heart',
      coins: 1,
      senderId: this.userId,
      receiverId: 'host-user',
      roomId: ROOM_ID,
    };

    this.send('gift_sent', payload);
    metrics.giftsSent++;
    this.giftsSent++;

    // Set up ACK timeout
    const timeout = setTimeout(() => {
      if (this.pendingAcks.has(giftId)) {
        metrics.giftsTimedOut++;
        this.pendingAcks.delete(giftId);
      }
    }, ACK_TIMEOUT_MS);

    this.pendingAcks.set(giftId, { timestamp: Date.now(), timeout });
    return true;
  }

  send(event, data) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ event, data, timestamp: new Date().toISOString() }));
    }
  }

  disconnect() {
    // Clear all pending ACK timeouts
    for (const [, pending] of this.pendingAcks) {
      clearTimeout(pending.timeout);
      metrics.giftsTimedOut++;
    }
    this.pendingAcks.clear();

    if (this.ws) {
      try { this.ws.close(); } catch (_) { /* ignore */ }
      this.ws = null;
    }
    this.connected = false;
  }
}

// ─── Reporting ───────────────────────────────────────────────────
function printMetrics(final = false) {
  const elapsed = ((Date.now() - metrics.startTime) / 1000).toFixed(1);
  const p50 = percentile(metrics.latencies, 50);
  const p95 = percentile(metrics.latencies, 95);
  const p99 = percentile(metrics.latencies, 99);

  console.log(`\n${'═'.repeat(60)}`);
  console.log(final ? '  📊 FINAL RESULTS' : '  📊 Live Metrics');
  console.log(`${'═'.repeat(60)}`);
  console.log(`  ⏱  Elapsed:           ${elapsed}s / ${DURATION_SEC}s`);
  console.log(`  🔌 Connections:        ${metrics.connectSuccess}/${metrics.connectAttempts} (${metrics.connectFailed} failed)`);
  console.log(`  📤 Gifts sent:         ${metrics.giftsSent}`);
  console.log(`  ✅ Gifts ACK'd:        ${metrics.giftsAcked}`);
  console.log(`  ⏰ Gifts timed out:    ${metrics.giftsTimedOut}`);
  console.log(`  📨 Messages received:  ${metrics.messagesReceived}`);
  console.log(`  ❌ Errors:             ${metrics.errors}`);
  console.log(`  🔌 Disconnects:        ${metrics.disconnects}`);
  if (metrics.latencies.length > 0) {
    console.log(`  📏 Latency P50:        ${p50}ms`);
    console.log(`  📏 Latency P95:        ${p95}ms`);
    console.log(`  📏 Latency P99:        ${p99}ms`);
  }
  console.log(`${'═'.repeat(60)}\n`);

  if (final) {
    const ackRate = metrics.giftsSent > 0
      ? ((metrics.giftsAcked / metrics.giftsSent) * 100).toFixed(1)
      : '0.0';
    console.log(`  ACK success rate: ${ackRate}%`);
    console.log(`  ${metrics.giftsTimedOut === 0 && metrics.errors === 0 ? '✅ PASS' : '❌ FAIL'}\n`);
  }
}

function percentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, idx)];
}

// ─── Main ────────────────────────────────────────────────────────
async function main() {
  console.log(`\n  🚀 WebSocket Load Test`);
  console.log(`  URL:        ${WS_URL}`);
  console.log(`  Room:       ${ROOM_ID}`);
  console.log(`  Clients:    ${NUM_CLIENTS}`);
  console.log(`  Gifts/cli:  ${GIFTS_PER_CLIENT}`);
  console.log(`  Duration:   ${DURATION_SEC}s`);
  console.log(`  ACK timeout: ${ACK_TIMEOUT_MS}ms\n`);

  const clients = [];

  // Phase 1: Connect clients with stagger
  console.log('  📡 Connecting clients...');
  for (let i = 0; i < NUM_CLIENTS; i++) {
    const client = new LoadTestClient(i);
    clients.push(client);
    await client.connect();
    if (CONNECT_STAGGER_MS > 0) {
      await new Promise(r => setTimeout(r, CONNECT_STAGGER_MS));
    }
  }

  const connectedClients = clients.filter(c => c.connected);
  console.log(`  ✅ ${connectedClients.length}/${NUM_CLIENTS} clients connected\n`);

  if (connectedClients.length === 0) {
    console.error('  ❌ No clients connected. Check WS_URL and server status.');
    process.exit(1);
  }

  // Phase 2: Send gifts over duration
  const giftInterval = Math.max(100, (DURATION_SEC * 1000) / (GIFTS_PER_CLIENT * connectedClients.length));
  console.log(`  🎁 Sending gifts every ${giftInterval.toFixed(0)}ms per client...\n`);

  // Periodic reporting
  const reportInterval = setInterval(() => printMetrics(false), 30000);

  const endTime = Date.now() + DURATION_SEC * 1000;
  let giftRound = 0;

  while (Date.now() < endTime) {
    const active = connectedClients.filter(c => c.connected && c.giftsSent < GIFTS_PER_CLIENT);
    if (active.length === 0) break;

    for (const client of active) {
      client.sendGift();
    }
    giftRound++;

    await new Promise(r => setTimeout(r, giftInterval));
  }

  // Wait for remaining ACKs
  console.log('  ⏳ Waiting for remaining ACKs...');
  await new Promise(r => setTimeout(r, ACK_TIMEOUT_MS + 1000));

  // Phase 3: Cleanup
  clearInterval(reportInterval);
  for (const client of clients) {
    client.disconnect();
  }

  printMetrics(true);
  process.exit(metrics.giftsTimedOut === 0 && metrics.errors === 0 ? 0 : 1);
}

main().catch(err => {
  console.error('Load test crashed:', err);
  process.exit(1);
});
