# Monetization System & Revenue Architecture

This document outlines the financial infrastructure of `elix-star-live`.

## 1. Revenue Streams

### A. In-App Purchases (Coins)
*   **Model**: Virtual Currency ("Coins").
*   **Flow**: User buys Coins via Stripe -> Coins credited to Wallet -> User spends Coins on Gifts.
*   **Pricing**: Managed in `coin_packages` table.
*   **Audit**: Stripe `payment_intent.succeeded` webhook -> Supabase `transactions` table.

### B. Gift Marketplace
*   **Model**: Micro-transactions.
*   **Flow**: User selects Gift -> Client validates Balance -> Server broadcasts Gift -> Creator receives "Diamonds" (Credits).
*   **Catalog**: Managed in `gifts_catalog` table (Admin controllable).

### C. Creator Revenue Share
*   **Model**: RevShare (e.g., 50/50 split).
*   **Logic**: When a gift is received, the creator earns "Diamonds".
*   **Exchange Rate**: 1 Diamond = $0.005 USD (Example).
*   **Payout**: Creators request payout when Diamonds > Threshold ($50).

### D. Subscriptions (Planned)
*   **VIP Status**: Monthly recurring.
*   **Benefits**: Badge, 1.5x Leveling Speed, Exclusive Gifts.
*   **Implementation**: Stripe Subscriptions API.

## 2. Database Schema & Financial Tracking (Mandatory)

Every transaction record in `transactions` table **MUST** include:

*   `id`: UUID (Primary Key, Unique)
*   `user_id`: UUID (The actor)
*   `created_at`: Timestamp (UTC)
*   `amount`: Decimal (Value)
*   `currency`: String ('USD', 'COIN', 'DIAMOND')
*   `type`: Enum ('purchase', 'gift', 'payout', 'refund', 'adjustment')
*   `platform_fee`: Decimal (Calculated revenue for platform)
*   `creator_share`: Decimal (Calculated revenue for creator)
*   `tax_amount`: Decimal (VAT/Sales Tax collected)
*   `reference_id`: String (Stripe ID or Gift ID)

### Immutable Ledger Rule
*   **Rule**: `transactions` table is **APPEND-ONLY**.
*   **Policy**: NEVER `UPDATE` or `DELETE` a transaction row.
*   **Correction**: To fix an error, insert a new transaction with negative amount (Type: 'refund' or 'adjustment').
*   **No Manual Fixes**: All DB changes must be done via migration scripts or Admin API, never raw SQL in production.

## 3. Audit & Compliance

### Daily Automated Reconciliation
*   **Goal**: Ensure `DB Revenue == Stripe Revenue`.
*   **Procedure**:
    1.  Scheduled Job (Midnight UTC) fetches all Stripe Charges for the day.
    2.  Sums Stripe `amount_received`.
    3.  Queries Supabase `transactions` where `type='purchase'` for the same period.
    4.  **Alert**: If variance > $0.00, trigger "Finance Alert" (Slack/Email).

### Monthly Finance Report
*   **Generate**: 1st of every month.
*   **Contents**:
    *   **Gross Transaction Value (GTV)**: Total Sales.
    *   **Net Revenue**: GTV - Stripe Fees - Creator Payouts - Taxes.
    *   **Payout Liability**: Total Diamonds outstanding * Exchange Rate.
    *   **Tax Liability**: Total Sales Tax collected (to be remitted).

### Fraud Prevention
*   **Logic**:
    *   RLS Policies prevent spending coins you don't have.
    *   Server-side validation of Gift Transactions.
    *   Flag accounts with > 3 failed purchases in 1 hour.

## 4. Implementation Status
*   [x] Coin Purchase UI (`PurchaseCoins.tsx`)
*   [x] Stripe Checkout API (`api/create-checkout-session.ts`)
*   [x] Gift Catalog UI (`GiftPanel.tsx`)
*   [ ] Subscription Logic (Phase 1 Design)
*   [ ] Automated Payout System (Manual for MVP)
