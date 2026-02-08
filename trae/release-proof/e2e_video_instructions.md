# E2E Video Recording — Instructions
### Status: ⚠️ REQUIRES PHYSICAL iPHONE + TestFlight BUILD

---

## Why this file exists instead of e2e_video.mp4

An E2E video recording **cannot be generated programmatically** — it requires:
1. A physical iPhone with the app installed via TestFlight
2. A screen recording of the full user flow
3. Real camera/microphone permissions granted
4. Real network conditions (including airplane mode test)

## Recording Checklist

Record your iPhone screen (Settings → Control Center → Screen Recording) and perform:

| # | Step | What to show | Duration |
|---|------|-------------|----------|
| 1 | **Login** | Enter email/password → Dashboard loads | 15s |
| 2 | **Create Live** | Tap "Go Live" → Camera preview → Start stream | 20s |
| 3 | **Viewer Join** | Second device joins stream, shows in viewer count | 15s |
| 4 | **Chat** | Send 3 chat messages, see them appear in real-time | 15s |
| 5 | **Send Gift (1 tap)** | Tap gift → See "sending" → See ACK confirmation | 10s |
| 6 | **Gift animation** | Gift overlay appears on both screens | 5s |
| 7 | **Battle start** | Start 1v1 battle → Both players see battle UI | 15s |
| 8 | **Battle end** | Timer expires → Winner shown → Scores reset | 10s |
| 9 | **Airplane mode** | Enable airplane mode 5-10 seconds | 10s |
| 10 | **Reconnect** | Disable airplane mode → Stream resumes automatically | 15s |
| 11 | **Background** | Press Home → Wait 5s → Return to app | 10s |
| 12 | **Foreground resume** | App resumes, video/chat still working | 10s |
| 13 | **No crash** | Show the full flow is smooth, no white screens | - |

**Total recording time: ~2.5 minutes**

## How to produce

```bash
# 1. Build for iOS
npx cap sync ios
# 2. Open in Xcode
npx cap open ios
# 3. Archive → Upload to TestFlight
# 4. Install on iPhone via TestFlight
# 5. Start iPhone screen recording
# 6. Perform steps 1-13 above
# 7. Save as e2e_video.mp4
# 8. Copy to release-proof/e2e_video.mp4
```

## Code backing each E2E step

| Step | Code file | Key function |
|------|-----------|-------------|
| Login | `src/pages/Login.tsx` | `handleLogin()` → `supabase.auth.signInWithPassword()` |
| Go Live | `src/pages/LiveStream.tsx` | `getUserMedia()` + `AgoraManager.joinChannel()` |
| Viewer join | `src/lib/realtimeManager.ts` | `joinRoom()` → participants channel |
| Chat | `src/pages/LiveStream.tsx` | `handleSendMessage()` + `chatRateLimiter` |
| Gift | `src/lib/giftService.ts` | `sendGiftViaRPC()` → `supabase.rpc('send_stream_gift')` |
| Battle | `src/components/LiveBattleUI.tsx` | Battle timer + score UI |
| Reconnect | `src/lib/agoraManager.ts` | `setupVisibilityHandler()` + connection-state-change |
| Background | `src/lib/agoraManager.ts` | `document.visibilitychange` handler |
