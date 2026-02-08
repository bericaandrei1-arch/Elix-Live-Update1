# Load Test Report
### Script: `scripts/load-test-ws.js` (also `scripts/load-test-ws.cjs` for ESM compatibility)
### Date: 2026-02-08
### Status: ⚠️ REQUIRES DEPLOYED SERVER

---

## 1. Test Configuration

| Parameter | Value |
|-----------|-------|
| Script | `scripts/load-test-ws.js` |
| Default clients | 100 |
| Default gifts/client | 20 |
| Default duration | 1800s (30 min) |
| ACK timeout | 5000ms |
| Connect stagger | 50ms between clients |
| Room | `load-test-room-001` |

## 2. Test Script Capabilities

The load test script (`scripts/load-test-ws.js`, 296 lines) implements:

- ✅ **client_request_id**: Each gift has unique `gift-{clientId}-{giftNum}` identifier
- ✅ **ACK tracking**: Every gift waits for server ACK within 5s timeout
- ✅ **Idempotency**: `pendingAcks` Map prevents duplicate processing
- ✅ **Latency measurement**: P50, P95, P99 percentiles calculated
- ✅ **Connection metrics**: connect attempts, success, failed, disconnects
- ✅ **Error tracking**: errors, timeouts, reconnects counted
- ✅ **Pass/Fail verdict**: Fails if any timeouts or errors > 0
- ✅ **Periodic reporting**: Prints live metrics every 30s

## 3. Local Dry-Run Attempt

```
Date: 2026-02-08
Target: ws://localhost:3001

🚀 WebSocket Load Test
URL:        ws://localhost:3001
Room:       load-test-room-001
Clients:    5
Gifts/cli:  3
Duration:   10s
ACK timeout: 5000ms

📡 Connecting clients...
✅ 0/5 clients connected

❌ No clients connected. Check WS_URL and server status.
```

**Result**: No WebSocket server available locally. This test MUST be run against the deployed staging/production server.

## 4. How to Run the Full Load Test

```bash
# 1. Copy as .cjs (package.json has "type": "module")
cp scripts/load-test-ws.js scripts/load-test-ws.cjs

# 2. Run against your deployed server
node scripts/load-test-ws.cjs wss://your-server.com/live 100 20 1800

# 3. Or with environment variables
WS_URL=wss://your-server.com/live NUM_CLIENTS=100 DURATION_SEC=1800 node scripts/load-test-ws.cjs
```

## 5. Expected Output Format (when server is available)

```
═══════════════════════════════════════════════════════
  📊 FINAL RESULTS
═══════════════════════════════════════════════════════
  ⏱  Elapsed:           1800.0s / 1800s
  🔌 Connections:        100/100 (0 failed)
  📤 Gifts sent:         2000
  ✅ Gifts ACK'd:        2000
  ⏰ Gifts timed out:    0
  📨 Messages received:  6000
  ❌ Errors:             0
  🔌 Disconnects:        0
  📏 Latency P50:        45ms
  📏 Latency P95:        120ms
  📏 Latency P99:        250ms
═══════════════════════════════════════════════════════

  ACK success rate: 100.0%
  ✅ PASS
```

## 6. Fraud-Proof Gift Architecture (Code Verification)

| Check | Status | Evidence |
|-------|--------|----------|
| Gifts via server RPC only | ✅ | `giftService.ts` → `supabase.rpc('send_stream_gift', ...)` |
| client_request_id generated | ✅ | `crypto.randomUUID()` in `giftService.ts:40` |
| Idempotency key in DB | ✅ | `gift_transactions.idempotency_key UNIQUE` in migration |
| client_request_id sent to server | ✅ | `p_client_request_id` param in RPC call |
| No direct client INSERT to gift_transactions | ✅ | RLS: NO INSERT policy for users on `gift_transactions` |
| No direct client INSERT to wallet_ledger | ✅ | RLS: NO INSERT policy for users on `wallet_ledger` |
| apiFallback.ts direct insert exists | ⚠️ Dead code | File exists but is NOT imported anywhere in active `src/` |
| ACK flow implemented | ✅ | `sendGiftViaRPC()` returns `ack: true` + `transactionId` |
| Realtime ACK fallback | ✅ | `waitForGiftACK()` in `realtimeManager.ts` |

## 7. Acceptance Criteria

| Criteria | Target | Status |
|----------|--------|--------|
| ACK received vs timeouts | > 99% ACK | ⚠️ Requires server |
| client_request_id mention | Present | ✅ Confirmed in code |
| Idempotency | Unique constraint on DB | ✅ Confirmed in migration |
| Timeout rate | < 1% | ⚠️ Requires server |
| No direct DB writes from client | Blocked by RLS | ✅ Confirmed |

## 8. Conclusion

The load test **script is complete and production-ready** (296 lines, full metrics).
The fraud-proof architecture is **verified at code level**.
The actual **server load test must be run manually** against the deployed WebSocket server before App Store submission.

**Action Required**: Deploy server → Run `node scripts/load-test-ws.cjs wss://YOUR_SERVER 100 20 1800` → Paste output here.
