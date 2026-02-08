# Cost Control & Optimization

## 1. Monthly Cost Tracking Checklist

| Category | Provider | Where to Check | Budget Target |
| :--- | :--- | :--- | :--- |
| **Hosting** | Digital Ocean | Dashboard -> Billing -> App Platform | $___ / mo |
| **Bandwidth** | Digital Ocean / Cloudflare | Dashboard -> Bandwidth Usage | $___ / mo |
| **Streaming** | Agora / Mux | Agora Console -> Usage -> Video Minutes | $___ / mo |
| **AI / Processing** | OpenAI / MediaPipe | Usage Dashboard (if API based) | $___ / mo |
| **Storage** | Supabase / DO Spaces | Supabase Dashboard -> Storage Size | $___ / mo |

## 2. Alerts & Thresholds

*   **Global Trigger**: If Total Cost increases > **20% Month-over-Month (MoM)**.
*   **Action**: Pause non-critical scaling, Audit usage immediately.
*   **Billing Alerts**:
    *   Set up "Billing Alert" in Digital Ocean for 75% of budget.
    *   Set up "Spend Cap" in Supabase (if available) or email alert.

## 3. Optimization Strategies (Optimize Before Scaling)

### Bandwidth
*   **CDN**: Ensure all static assets (images, JS, CSS) are served via Cloudflare/CDN.
*   **Caching**: Increase `Cache-Control` max-age for immutable assets.

### Streaming (Highest Cost Risk)
*   **Bitrate Control**: Enforce max bitrate (e.g., 2Mbps) for standard users.
*   **Resolution**: Default to 720p instead of 1080p for mobile.
*   **Idle Streams**: Auto-disconnect streams with 0 viewers after 10 minutes.

### Storage
*   **Retention Policy**: Delete raw stream archives after 30 days unless "Saved" by user.
*   **Compression**: Compress uploaded images (WebP) before storing.

### Database
*   **Indexing**: Ensure high-traffic queries are indexed to reduce CPU usage (Compute cost).
*   **Archiving**: Move old logs/notifications to cold storage (S3) or delete.
