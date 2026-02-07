# Stability & Incident Management

## 1. Response SLAs (Service Level Agreements)

| Severity | Definition | Max Response Time |
| :--- | :--- | :--- |
| **CRITICAL (SEV-1)** | Complete system outage, Data loss, Security breach | **≤ 15 minutes** |
| **HIGH (SEV-2)** | Partial outage (e.g., Video broken, Payments failing) | **≤ 60 minutes** |
| **MEDIUM (SEV-3)** | Minor bug, UI glitch, Non-blocking issue | **≤ 24 hours** |

## 2. Incident Response Protocol (Mandatory)

When an incident happens, follow these exact steps in order:

### 1. Acknowledge
*   Confirm receipt of the alert.
*   Notify the team that you are investigating.

### 2. Contain (Stop Spread)
*   Isolate the issue to prevent cascading failures.
*   Example: Disable a specific feature (feature flag), block malicious IP, or pause a queue.

### 3. Rollback (If needed)
*   If the issue was caused by a recent change/deployment, **ROLLBACK IMMEDIATELY**.
*   Do not try to "fix forward" during a critical outage.
*   See `ROLLBACK_PLAN.md`.

### 4. Fix Root Cause
*   Investigate logs and metrics to find the true source.
*   Develop a proper fix (Safe, Tested).
*   **POLICY**: No "quick hacks" in production. Patches must be proper code changes.

### 5. Document
*   Update the **Incident Log** below with date, impact, cause, and fix.

### 6. Add Regression Test
*   **MANDATORY**: Create an automated test (Unit/E2E) that reproduces the bug.
*   Verify the test fails without the fix and passes with the fix.
*   This prevents the same issue from ever happening again.

## 3. Incident Log

| Date | Severity | Impact Description | Root Cause | Fix Applied | Resolution Time |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 2026-02-07 | SEV-2 | "Service Unavailable" on deploy | Config missing `output_dir` | Updated `app.yaml` | 20 mins |
| | | | | | |

## 4. Key Contacts
*   **Admin/Owner**: [User Name]
*   **Hosting**: Digital Ocean Support
*   **Database**: Supabase Support
