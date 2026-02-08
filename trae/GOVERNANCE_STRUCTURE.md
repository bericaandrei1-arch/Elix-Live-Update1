# Governance & Leadership Structure

This document defines the internal organization and responsibilities for `elix-star-live`.

## 1. Organization Chart & Responsibilities

### 👑 CEO / Product Owner
*   **Core Responsibility**: Vision, Strategy, and Growth.
*   **Key Metrics**: DAU/MAU, Retention, Valuation.
*   **Owner of Documents**:
    *   `GROWTH_STRATEGY.md`
    *   `BRAND_GUIDELINES.md`
    *   `INVESTOR_PACK.md`
    *   `PRODUCT_METRICS.md`
*   **Daily Tasks**: Review KPIs, Prioritize Roadmap (Phase 1 of CIP).

### 🛠️ Tech Lead (CTO)
*   **Core Responsibility**: Platform Stability, Security, and Scalability.
*   **Key Metrics**: Uptime (99.9%), API Latency, Bundle Size.
*   **Owner of Documents**:
    *   `ARCHITECTURE.md`
    *   `SECURITY_POLICY.md`
    *   `SCALING_METRICS.md`
    *   `CONTINUOUS_IMPROVEMENT.md`
*   **Daily Tasks**: Code Review, Security Audits, Infrastructure Scaling.

### ⚙️ Operations Lead (COO)
*   **Core Responsibility**: User Happiness and Incident Response.
*   **Key Metrics**: Ticket Resolution Time, Creator Satisfaction.
*   **Owner of Documents**:
    *   `INCIDENT_MANAGEMENT.md`
    *   `LIVE_OPS_PLAYBOOK.md`
    *   `CREATOR_ECONOMY.md` (Execution side)
*   **Daily Tasks**: Customer Support, Creator Onboarding, Incident Triage.

### 💰 Finance Lead (CFO)
*   **Core Responsibility**: Profitability and Cash Flow.
*   **Key Metrics**: MRR, Gross Margin, Burn Rate, Runway.
*   **Owner of Documents**:
    *   `MONETIZATION.md`
    *   `COST_MANAGEMENT.md`
*   **Daily Tasks**: Reconciliation (Stripe vs DB), Payout Approvals, Budget Monitoring.

### ⚖️ Compliance & Risk Officer
*   **Core Responsibility**: Legal Safety and Fraud Prevention.
*   **Key Metrics**: Zero Lawsuits, 100% GDPR Compliance.
*   **Owner of Documents**:
    *   `COMPLIANCE_LEGAL.md`
    *   `SECURITY_POLICY.md` (Policy side)
*   **Daily Tasks**: Audit Logs Review, Content Moderation Oversight, KYC Checks.

## 2. Decision Making Framework

### The "Triangle of Trade-offs"
When making decisions, balance:
1.  **Speed** (CEO wants features now).
2.  **Stability** (CTO wants zero bugs).
3.  **Cost** (CFO wants low burn).

### Voting Rights
*   **Product Changes**: CEO has veto power.
*   **Security/Architecture**: Tech Lead has veto power.
*   **Budget**: Finance Lead has veto power.

## 3. Meeting Cadence & Review Cycles

| Meeting | Frequency | Attendees | Output |
| :--- | :--- | :--- | :--- |
| **All-Hands** | Weekly (Mon) | All | Goals for the week. |
| **Product Review** | Monthly | CEO, Tech, Ops | Roadmap updates (See `PRODUCT_METRICS.md`). |
| **Finance Review** | Monthly | CEO, Finance | P&L Review, Budget adjustments. |
| **Incident Review** | Ad-hoc | Tech, Ops | Post-mortem of any outages. |

### 🏛️ Board & Strategy (Decision System)

#### Monthly Board Review
*   **Frequency**: Last Friday of the month.
*   **Agenda**:
    1.  **Financials**: Burn rate, Runway, Revenue (Actual vs Plan).
    2.  **Key Metrics**: Growth, Churn, Engagement.
    3.  **Governance**: Major hiring, Legal issues, Investor updates.
*   **Goal**: "Are we healthy? Do we need to pivot?"

#### Quarterly Strategy Review
*   **Frequency**: Every 3 months (Jan, Apr, Jul, Oct).
*   **Agenda**:
    1.  **Market Position**: Competitor analysis, Market shifts.
    2.  **Expansion**: Review `GROWTH_STRATEGY.md` (New Geographies/Platforms).
    3.  **Long-term Roadmap**: Plan the next 2 quarters.
    4.  **OKRs**: Set Objectives and Key Results for the next quarter.
*   **Goal**: "Are we winning? Where are we going next?"
