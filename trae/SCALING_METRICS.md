# Performance & Scaling Metrics

This document outlines the required metrics to track continuously for scaling the `elix-star-live` platform.

## 1. Tracking Dashboard

| Metric | Source Tool | Where to find it | Target |
| :--- | :--- | :--- | :--- |
| **Concurrent Users** | Supabase Auth / Analytics | Supabase Dashboard -> Reports -> Auth -> Daily Active Users | N/A (Growth) |
| **WebSocket Connections** | Supabase Realtime | Supabase Dashboard -> Reports -> Realtime -> Connected Clients | < Limit (depends on plan) |
| **Messages/Gifts per sec** | Supabase DB | Supabase Dashboard -> Reports -> Database -> "Throughput" | Monitor for spikes |
| **DB Queries/sec** | Supabase DB | Supabase Dashboard -> Reports -> API -> "Requests" | < 1000/s (Pro Plan) |
| **Cache Hit Rate** | Supabase Storage | Supabase Dashboard -> Storage -> Usage | > 80% |
| **CDN Hit Rate** | Digital Ocean / Cloudflare | CDN Provider Dashboard -> Analytics | > 90% |

## 2. Scaling Rules (Mandatory)

### A. Horizontal Scaling (API/WebSocket)
*   **Threshold**: CPU usage > **70%** for 5 minutes.
*   **Action**: Increase container count by +1 (Horizontal Scale).
*   **Max Limit**: Set max containers to **5** to prevent cost overrun (Monitoring required).
*   **Auto-scale Config**: Enable "Autoscale" in Digital Ocean App Platform settings.

### B. Database Read Replicas
*   **Threshold**: Read Latency > **100ms** OR Read IOPS > **3000**.
*   **Action**: Enable **Read Replica** in Supabase Dashboard.
*   **Implementation**: Update backend connection strings to use Replica URL for `SELECT` queries.

### C. Redis / Memory Cache (Hot Data)
*   **Threshold**: Repeated queries for same data (e.g., "Active Livestreams") > **500 req/sec**.
*   **Action**: Deploy **Redis** (Digital Ocean Managed Redis or Upstash).
*   **Strategy**: Cache `live_streams` list and `user_profiles` with 60s TTL.

## 3. Maintenance Schedule

### Quarterly Load Tests
*   **Frequency**: Every 3 months (Jan, Apr, Jul, Oct).
*   **Action**: Run full stress test simulation (using `scripts/load-test.mjs` logic or external tool like k6).
*   **Scenario**: Simulate **2x** current peak traffic.
*   **Pass Criteria**: No crashes, < 1% error rate, p95 latency < 500ms.
*   **Goal**: Verify capacity for the upcoming quarter's growth.

## 4. Daily Checklist
*   [ ] Check Supabase "System Health" (CPU/RAM).
*   [ ] Check Digital Ocean "Insights" (Bandwidth/Builds).
*   [ ] Review Error Logs for 5xx spikes.
