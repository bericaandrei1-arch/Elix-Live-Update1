# Product Health Monitoring (Business Metrics)

## 1. Engagement Metrics

### DAU / MAU (Active Users)
*   **Definition**: Unique users who logged in or performed an action.
*   **Calculation (SQL)**:
    ```sql
    -- DAU
    SELECT count(DISTINCT user_id) FROM analytics_events 
    WHERE created_at > now() - interval '24 hours';
    ```
*   **Target**: DAU/MAU ratio > 20% (Good stickiness).

### Retention (D1 / D7 / D30)
*   **Definition**: % of users from a cohort who return after X days.
*   **Calculation**: Use Mixpanel or Supabase SQL Cohort Analysis.
*   **Target**: D1 > 40%, D7 > 20%, D30 > 10%.

## 2. Monetization Metrics

### ARPU (Average Revenue Per User)
*   **Definition**: Total Revenue / Total Active Users.
*   **Calculation (SQL)**:
    ```sql
    SELECT sum(amount) / count(DISTINCT user_id) 
    FROM transactions 
    WHERE created_at > now() - interval '30 days';
    ```

### Gift Conversion Rate
*   **Definition**: (Users who sent a gift / Total Active Users) * 100.
*   **Calculation (SQL)**:
    ```sql
    SELECT (count(DISTINCT sender_id)::float / (SELECT count(*) FROM profiles)) * 100 
    FROM gifts 
    WHERE created_at > now() - interval '30 days';
    ```
*   **Target**: > 5%.

### Creator Earnings
*   **Definition**: Total value of diamonds/gifts received by creators (pending payout).
*   **Calculation (SQL)**:
    ```sql
    SELECT sum(amount * 0.5) -- Assuming 50% rev share
    FROM transactions 
    WHERE type = 'gift_received';
    ```

## 3. Conversion Funnel (Core Loop)

Measure the drop-off at each step to identify the "Weakest Link".

| Step | Metric | Target Conversion | Action if Low |
| :--- | :--- | :--- | :--- |
| **Visitor** | Unique Landing Page Views | N/A (Top of Funnel) | Improve SEO / Ads |
| **Signup** | Signups / Visitors | > 20% | Fix Login UX / Auth Options |
| **First Live** | Users who streamed / Signups | > 10% | Improve "Go Live" Onboarding |
| **First Gift** | Users who gifted / Signups | > 5% | Offer "First Purchase" Bonus |
| **Retention** | D7 Retention | > 20% | Push Notifications / Content Quality |

## 4. Monthly Review Agenda (Mandatory)

Conduct this review on the **1st Monday of every month**.

### A. Technical Health
1.  **What's Breaking?**
    *   Review `INCIDENT_MANAGEMENT.md` log.
    *   Check Sentry/Error logs for top crash clusters.
2.  **What's Slow?**
    *   Review API Latency p95 > 500ms.
    *   Review App Load Time > 3s.

### B. Product Health
1.  **User Sentiment**
    *   Review App Store / Play Store ratings (Low stars).
    *   Review Support Tickets (Common keywords).
2.  **Feature Performance**
    *   Identify features with < 5% adoption.
    *   **Decision**: Kill, Fix, or Promote?
