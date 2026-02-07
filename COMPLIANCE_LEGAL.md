# Legal, Compliance & Risk Control (UK/EU Ready)

This document outlines the mandatory legal frameworks for `elix-star-live`.

## 1. GDPR & Privacy Compliance (EU/UK)

### Data Rights (The "Rights")
*   **Right to Access**: Users can request a copy of their data.
    *   *Process*: Email `support@elixstarlive.co.uk`. Admin exports JSON from Supabase.
*   **Right to Erasure ("ToBeForgotten")**: Users can request deletion.
    *   *Process*: Email Support. Admin deletes user row (cascades to all data).
*   **Cookie Consent**:
    *   *Implementation*: A "Cookie Banner" must appear on first visit (Frontend).
    *   *Status*: **Pending** (Needs implementation in `App.tsx`).

### Data Processing
*   **Location**: Data stored in Supabase (AWS eu-west-2 / London region recommended for UK app).
*   **Sub-processors**: Stripe (Payments), Agora (Streaming).

## 2. Terms of Service & Policies

### Documents Status
*   **Terms & Conditions**: `src/pages/Terms.tsx` (Exists).
*   **Privacy Policy**: `src/pages/Privacy.tsx` (Exists).
*   **UGC Policy**: `src/pages/LegalUGC.tsx` (Exists) - Mandatory for App Store.
*   **DMCA**: `src/pages/LegalDMCA.tsx` (Exists).

### Age Verification
*   **Policy**: Users must be 18+ to stream or buy coins. 13+ to watch.
*   **Enforcement**:
    *   Checkbox on Signup: "I confirm I am over 18".
    *   **KYC**: Creators MUST verify age via ID before first payout.

## 3. Financial Compliance (AML/KYC)

### Anti-Money Laundering (AML)
*   **Risk**: Users using stolen cards to "gift" themselves to wash money.
*   **Controls**:
    *   **Payout Hold**: 30-day hold on earnings before withdrawal.
    *   **Threshold**: Identity Verification required for withdrawals > $50.
    *   **Provider**: Stripe Identity (Automated KYC).

### Refund Policy
*   **Digital Goods**: "All sales of Coins are final."
*   **Exceptions**: Unauthorized use (Chargebacks).
*   **Cooling-off Period**: UK users waive the 14-day cooling-off period when they "start consuming" the digital good (buy coins). This must be explicit in checkout.

## 4. Safety & Risk Control

### Content Moderation (DSA - Digital Services Act)
*   **Mechanism**: "Report" button on every stream/video.
*   **SLA**: Reports reviewed within 24 hours.
*   **Tools**: `src/pages/admin/Reports.tsx` (Admin Panel).

### Suicide & Self-Harm
*   **Policy**: Immediate ban + referral to helplines.
*   **Detection**: Keyword filtering in chat.

## 5. Mandatory Records (Audit Trail)

### Data Processing Register (ROPA)
*   **Requirement**: Maintain a document listing all data types processed, purpose, and retention period.
*   **Update Frequency**: Quarterly.

### Consent Logs
*   **Requirement**: Prove that User X accepted TOS v1.2 on Date Y.
*   **Implementation**: Store `tos_accepted_at` and `tos_version` in `profiles` table.

### Payment Logs
*   **Requirement**: Keep all transaction records for **7 Years** (UK HMRC / US IRS Requirement).
*   **Storage**: Supabase Database + Monthly CSV Export to Cold Storage (S3/Drive).
