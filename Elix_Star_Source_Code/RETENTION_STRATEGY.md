# Retention Strategy & Gamification

This document outlines the systems designed to keep users (Viewers & Creators) engaged long-term.

## 1. Leveling System (XP)

### Mechanics
*   **XP Sources**:
    *   Sending Gifts: 1 Coin = 10 XP.
    *   Watch Time: 1 Minute = 1 XP (Capped at 60/day).
    *   Sharing Stream: 5 XP.
*   **Levels**:
    *   Level 1-10: "Newbie" (White Badge).
    *   Level 11-50: "Regular" (Blue Badge).
    *   Level 50+: "Elite" (Gold Badge + Entrance Animation).

### Implementation
*   **Database**: `user_levels` table (`user_id`, `current_xp`, `level`).
*   **Trigger**: Database Trigger on `transactions` insert -> Update XP.

## 2. Loyalty Rewards (Daily Login)

### "7-Day Streak"
*   **Day 1**: 10 Coins.
*   **Day 2**: 20 Coins.
*   ...
*   **Day 7**: 100 Coins + "Streak Frame" (24h).
*   **Logic**: Reset if missed a day.

## 3. Seasonal Events

### Concept
Time-limited competitions that drive revenue spikes.

### Example: "Summer Splash" (July)
*   **Duration**: 2 Weeks.
*   **Special Gifts**: "Water Gun", "Beach Ball" (Only available during event).
*   **Leaderboard**: "Most Splashes Sent".
*   **Prize**: Physical Trophy + 10k Diamonds.

## 4. Milestone Bonuses (Achievements)

### "Collector" Badges
*   **Sent 100 Gifts**: Bronze Gifter Badge.
*   **Sent 1k Gifts**: Silver Gifter Badge.
*   **Sent 10k Gifts**: Gold Gifter Badge.

### "Social Butterfly"
*   **Shared 50 Streams**: "Sharer" Badge.
*   **Invited 10 Friends**: "Influencer" Badge.

## 5. KPIs for Retention
*   **D1 Retention**: Target > 40%.
*   **D30 Retention**: Target > 10%.
*   **Stickiness**: DAU/MAU > 20%.
