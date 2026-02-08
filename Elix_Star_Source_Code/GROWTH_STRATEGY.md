# Growth Engine & Acquisition Strategy

This document outlines how `elix-star-live` acquires and tracks new users.

## 1. Acquisition Channels Tracking

### Organic Social (TikTok / Instagram / YouTube)
*   **Strategy**: Viral clips of "Best Live Moments".
*   **Tracking**: Use UTM parameters in bio links.
    *   `?utm_source=tiktok&utm_campaign=launch_promo`
*   **KPI**: Conversion Rate (Click -> Signup).

### Referral System
*   **Mechanism**: Every user gets a unique `referral_code` (e.g., `@username`).
*   **Incentive**: "Invite a friend, get 10 Diamonds".
*   **Tracking**:
    *   Store `referred_by` in `profiles` table.
    *   Dashboard: "Top Referrers" list.

### Creator Invites
*   **Target**: High-value streamers from other platforms.
*   **Mechanism**: "Golden Ticket" invites (VIP status on signup).
*   **Tracking**: Specific `invite_code` linked to an Agency/Scout.

### Influencer Onboarding
*   **Manual Onboarding**: Admin tags user as `is_influencer = true`.
*   **Tracking**:
    *   Monitor "Follower Growth" of influencers vs regular users.
    *   Monitor "Revenue Generated" by influencers.

## 2. Viral Loop & Hooks Implementation

### A. Share Clips (Content Virality)
*   **Feature**: "Clip This" button on Live Streams.
*   **Mechanism**: Captures last 30s -> Exports with Watermark & App Link.
*   **Channel**: User posts to TikTok/Shorts.
*   **Hook**: "Watch the full battle on Elix Star Live!"

### B. Invite Rewards (Network Effect)
*   **Offer**: "Get 100 Coins for every friend who joins & verifies phone."
*   **Condition**: Friend must reach Level 2 (prevents bot spam).
*   **Notification**: "Your friend joined! Here is your reward."

### C. Event-Based Campaigns (Retention/Engagement)
*   **Example**: "Weekend Battle Tournament".
*   **Hook**: Double XP / Double Diamonds during the event.
*   **Notification**: Push Notification to all inactive users.

### D. Limited-Time Gifts (FOMO)
*   **Strategy**: Release "Exclusive" gifts (e.g., "Valentine's Rose").
*   **Scarcity**: Available for 24 hours only.
*   **Effect**: Spikes revenue and app opens.

## 3. Expansion Strategy (Roadmap)

### A. Geography Rollout
*   **Phase 1: UK & EU (Current)**
    *   Focus: Compliance (GDPR), English content.
    *   Target: Diaspora communities & Local talent.
*   **Phase 2: USA**
    *   Trigger: Reaching 50k MAU in UK/EU.
    *   Reqs: CCPA Compliance, US Server Nodes (Agora).
*   **Phase 3: MENA & Asia**
    *   Target: Gulf States (High Gifting Culture) / SE Asia.
    *   Reqs: RTL Support (Arabic), Local Payment Methods.

### B. Platform Support
*   **Web (PWA)**: Primary (Live).
*   **Mobile (iOS/Android)**:
    *   Plan: Wrap PWA with Capacitor or React Native.
    *   Timeline: Q3 2026.
*   **Smart TV**: Long-term goal for "Watch Parties".

### C. Strategic Partnerships
*   **Agencies**: "Creator Factory" program (Sign exclusive deals with Talent Agencies).
*   **Payment Providers**:
    *   MENA: Integrate Fawry / STC Pay.
    *   Asia: Integrate UPI / GrabPay.
*   **Telcos**: Carrier Billing partnerships (Pay with Phone Bill) for lower CAC.
*   **Media Networks**: Co-produce "Talent Shows" exclusively on Elix Star.

## 4. Attribution Dashboard (Required)

| Channel | Signups | CPA (Cost Per Acquisition) | LTV (Lifetime Value) |
| :--- | :--- | :--- | :--- |
| TikTok Organic | ___ | $0 | $___ |
| Instagram Ads | ___ | $___ | $___ |
| Referrals | ___ | $___ (Reward cost) | $___ |
| Direct/Unknown | ___ | N/A | $___ |

## 5. Next Steps
*   [ ] Implement Deep Linking (Branch.io or Firebase Dynamic Links).
*   [ ] Build "Referral Dashboard" in App.
*   [ ] Create "Creator Agency" portal.
