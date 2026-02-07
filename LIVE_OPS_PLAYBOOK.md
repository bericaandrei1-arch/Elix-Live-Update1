# Live Operations Playbook
**System**: Elix Star Live Good MVP
**Status**: Live / Production

This playbook is the single source of truth for operating, scaling, and protecting the platform.

---

## 1. Incident Procedures
**Goal**: Restore service within 15 mins (Critical) / 60 mins (High).

*   **Protocol**: Acknowledge -> Contain -> Rollback -> Fix -> Document -> Test.
*   **Quick Links**:
    *   [Full Incident Management Guide](./INCIDENT_MANAGEMENT.md)
    *   [Rollback Plan](./ROLLBACK_PLAN.md)
*   **Emergency Contacts**: See `INCIDENT_MANAGEMENT.md`.

---

## 2. Scaling Rules
**Goal**: Zero downtime during traffic spikes.

*   **Triggers**:
    *   **API/WS**: Scale out if CPU > 70%.
    *   **DB**: Add Read Replica if Latency > 100ms.
    *   **Cache**: Add Redis if DB Reads > 500/s.
*   **Maintenance**:
    *   **Quarterly Load Test**: Jan, Apr, Jul, Oct.
*   **Reference**: [Scaling Metrics & Rules](./SCALING_METRICS.md)

---

## 3. Security Policies
**Goal**: Zero breaches, 100% compliance.

*   **Mandatory Checks**:
    *   **Monthly**: `npm audit` & Log Review.
    *   **Patching**: Critical bugs fixed in < 48h.
*   **Controls**:
    *   Rate Limiting (Supabase).
    *   DDoS Protection (Cloudflare/DO).
    *   Input Sanitization (React).
*   **Reference**: [Security Policy](./SECURITY_POLICY.md)

---

## 4. Backup & Recovery
**Goal**: Zero data loss.

*   **Strategy**:
    *   **DB**: Daily Automated Backups (Supabase).
    *   **Retention**: 30+ Days (Requires Pro).
    *   **Off-site**: Daily `pg_dump` to external storage.
*   **Drills**: Test Restore every 6 months.
*   **Reference**: [Rollback & Backup Plan](./ROLLBACK_PLAN.md)

---

## 5. Cost Controls
**Goal**: Profitability (Cost growth < Revenue growth).

*   **Budget**: Track MoM increase. Alert if > 20%.
*   **Optimization**:
    *   Enforce CDN caching.
    *   Limit Video Bitrates.
    *   Archive old data.
*   **Reference**: [Cost Management](./COST_MANAGEMENT.md)

---

## 6. KPI Targets (Product Health)
**Goal**: Sustainable Growth.

*   **Metrics**:
    *   **Engagement**: DAU/MAU > 20%.
    *   **Retention**: D30 > 10%.
    *   **Monetization**: Gift Conversion > 5%.
*   **Review**: Monthly Business Review (1st Monday).
*   **Reference**: [Product Metrics](./PRODUCT_METRICS.md)

---

**End of Playbook**
*Last Updated: 2026-02-07*
