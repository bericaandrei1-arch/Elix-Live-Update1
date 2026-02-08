/**
 * chatRateLimiter.ts — Client-side chat anti-spam throttle
 *
 * Rules:
 * - Max 5 messages per 10 seconds per user
 * - Min 500ms between consecutive messages
 * - Returns { allowed, retryAfter } 
 */

const MESSAGE_WINDOW_MS = 10_000;
const MAX_MESSAGES_PER_WINDOW = 5;
const MIN_INTERVAL_MS = 500;

let messageTimes: number[] = [];
let lastMessageTime = 0;

export function checkChatRateLimit(): { allowed: boolean; retryAfter: number } {
  const now = Date.now();

  // Min interval between messages
  if (now - lastMessageTime < MIN_INTERVAL_MS) {
    return { allowed: false, retryAfter: MIN_INTERVAL_MS - (now - lastMessageTime) };
  }

  // Sliding window: remove old timestamps
  messageTimes = messageTimes.filter(t => now - t < MESSAGE_WINDOW_MS);

  if (messageTimes.length >= MAX_MESSAGES_PER_WINDOW) {
    const oldestInWindow = messageTimes[0];
    const retryAfter = MESSAGE_WINDOW_MS - (now - oldestInWindow);
    return { allowed: false, retryAfter };
  }

  // Allowed — record this message
  messageTimes.push(now);
  lastMessageTime = now;
  return { allowed: true, retryAfter: 0 };
}

export function resetChatRateLimit(): void {
  messageTimes = [];
  lastMessageTime = 0;
}
