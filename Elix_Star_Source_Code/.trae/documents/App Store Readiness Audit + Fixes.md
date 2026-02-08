## What “Perfect” Means Here
- No placeholder user-facing flows, no crashes from missing config, predictable auth, payments/coins correctness, and production-only behavior (no mock/local fallbacks).
- App Store / Play Store compliance: privacy, payments policy, stability, and packaging (native wrapper vs PWA).

## Phase 1 — Component/Route Audit (Code-Level)
1. **Inventory all routes and key components**
   - Use [App.tsx](file:///c:/Users/Sanda/Desktop/Elix%20Star%20Live%20Good%20MVP/src/App.tsx) + key pages/components to list what must work end-to-end.
2. **Identify and eliminate placeholders/stubs**
   - Replace or hide (feature-flag) anything that is “alert() / placeholder / implement later”, e.g. [SearchPage.tsx](file:///c:/Users/Sanda/Desktop/Elix%20Star%20Live%20Good%20MVP/src/pages/SearchPage.tsx), [LiveStreamPage.tsx](file:///c:/Users/Sanda/Desktop/Elix%20Star%20Live%20Good%20MVP/src/pages/LiveStreamPage.tsx), [LiveStream.tsx](file:///c:/Users/Sanda/Desktop/Elix%20Star%20Live%20Good%20MVP/src/pages/LiveStream.tsx).
3. **Add a global Error Boundary + user-friendly error screens**
   - Prevent hard crashes from runtime throws (Stripe key missing, upload errors) and add a clean fallback UI.

## Phase 2 — Production Hardening (Security + Reliability)
1. **Disable “local auth” for production builds**
   - Current local fallback stores password in localStorage via [useAuthStore.ts](file:///c:/Users/Sanda/Desktop/Elix%20Star%20Live%20Good%20MVP/src/store/useAuthStore.ts) (not acceptable for production). Keep it dev-only or remove.
2. **Disable mock API fallbacks in production**
   - Prevent silent swapping to mock behavior via [apiFallback.ts](file:///c:/Users/Sanda/Desktop/Elix%20Star%20Live%20Good%20MVP/src/lib/apiFallback.ts).
3. **Harden Stripe webhook security + atomic crediting**
   - Require Stripe signature verification in production; make coin crediting atomic (RPC/transaction) and rely on unique ids for idempotency.

## Phase 3 — Store Compliance (Apple + Google)
1. **Payments policy decision**
   - “Coins” are digital goods; Apple/Google usually require In‑App Purchase instead of Stripe when shipped as a native iOS/Android app. If you ship in stores, we either:
     - replace Stripe coins with IAP, or
     - remove coins purchase from the native build and sell only on web.
2. **Privacy + legal**
   - Confirm privacy policy route works, add required disclosures (data collection, analytics, tracking, account deletion).

## Phase 4 — Mobile Packaging
- Decide packaging path:
  - **PWA only** (no App Store listing), or
  - **Capacitor** wrapper + iOS/Android builds (recommended for store distribution).
- If Capacitor: add native projects, configure deep links for `/auth/callback`, camera/mic permissions (live), background audio rules, and build signing.

## Phase 5 — Verification (Must Pass)
- Fix lint/type errors (repo currently has many lint errors/warnings).
- Add smoke tests for critical flows (register/login/logout, feed playback, upload, live join, buy coins, send gift).
- Run production build and manual QA checklist on mobile viewports.

If you confirm this plan, I’ll start executing it in this order: placeholders/crashes first, then security hardening, then store compliance + packaging, then final test pass.