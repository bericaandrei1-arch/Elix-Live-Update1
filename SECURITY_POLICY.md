# Security & Abuse Protection Policy

## 1. Mandatory Protections Status

| Protection | Implementation | Status |
| :--- | :--- | :--- |
| **Rate Limiting** | Supabase API Limits (Default: 300 req/min) | ✅ Active |
| **Anti-Bot / Fraud** | Supabase Auth (Captcha recommended) + RLS Policies | ⚠️ Requires Config |
| **Brute-Force** | Supabase Auth (Lockout after 5 attempts) | ✅ Active |
| **Input Sanitization** | React Escaping (No `dangerouslySetInnerHTML` found) | ✅ Verified |
| **DDoS Protection** | Cloudflare / Digital Ocean Edge | ✅ Active |
| **Dependency Scans** | `npm audit` | ⚠️ 7 Vulnerabilities Found (Requires Major Update) |

## 2. Configuration Requirements

### Anti-Fraud (Gifts)
*   **Database**: Ensure Row Level Security (RLS) policies prevent negative coin balances.
*   **Action**: Review `profiles` table policies in Supabase Dashboard.

### Dependency Management
*   **Current State**: 4 High Severity Vulnerabilities (in `@capacitor/cli` and `@vercel/node`).
*   **Action Plan**: Schedule a maintenance window to upgrade `@capacitor/cli` to v8+ and `@vercel/node` to v4+. This is a **Breaking Change** and requires full regression testing.

## 3. Incident Response for Security
*   **Leak**: If keys leaked, rotate immediately in Digital Ocean + Supabase.
*   **Attack**: If DDoS detected, enable "Under Attack Mode" in Cloudflare (if accessible) or contact Digital Ocean support.

## 4. Security Review Schedule

### Monthly Audit
*   **Frequency**: 1st of every month.
*   **Checklist**:
    *   Run `npm audit` to check for new vulnerabilities.
    *   Review Supabase Auth logs for suspicious patterns.
    *   Review Admin logs for abuse reports.
    *   Rotate keys if any suspicion of compromise.

### Patching SLA
*   **Critical Issues (High Severity)**: Must be patched within **48 hours**.
*   **Non-Critical Issues**: Schedule for next sprint.
