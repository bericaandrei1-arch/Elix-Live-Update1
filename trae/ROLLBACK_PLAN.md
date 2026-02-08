# Rollback Plan

## 1. Revert to Previous Working Build

### Method A: Digital Ocean Dashboard (Recommended)
**Time to Restore: < 2 minutes**
1.  Log in to Digital Ocean Cloud Console.
2.  Navigate to **Apps** -> Select your app (`elix-star-live` / `dolphin-app`).
3.  Click on the **Deployments** tab.
4.  Find the most recent **Successful** deployment (Green checkmark).
5.  Click the **... (Three dots)** button on the right side of the row.
6.  Select **Rollback**.
7.  Confirm the rollback. The platform will immediately re-serve the previous build artifact.

### Method B: Git Revert
**Time to Restore: ~5 minutes (Build time)**
1.  Open your local terminal.
2.  Run `git log` to find the bad commit hash.
3.  Run `git revert HEAD` (to undo the last commit) or `git revert <commit-hash>`.
4.  Run `git push origin main`.
5.  This triggers a new build pipeline which effectively deploys the old code.

## 2. Database Strategy

**Current Deployment Status**: Frontend Only (No DB Migrations included).

### Strategy: Forward-Fix
*   Since we generally do not run destructive migrations automatically, fixing the bug with a new migration is preferred over rolling back the database, which causes data loss for new users.

### Emergency DB Restore (Data Loss Scenario)
1.  Go to **Supabase Dashboard**.
2.  Select Project -> **Database** -> **Backups**.
3.  Select a **Point-in-Time** (if PITR enabled) or the last **Daily Backup**.
4.  Click **Restore**.
5.  **Warning**: This will overwrite all data created after the backup point.

## 3. Data & Backup Management (Mandatory)

### Automated Backups
*   **Schedule**: Daily (Automated by Supabase).
*   **Retention**:
    *   **Free Plan**: 1 day retention.
    *   **Pro Plan**: 7 days retention.
    *   **Enterprise/Add-on**: 30+ days retention (Required for Compliance).
*   **Action**: Upgrade to Pro Plan + PITR (Point-in-Time Recovery) to meet the **30+ day** requirement.

### Off-Site Copy Strategy
To ensure safety against provider failure (Supabase/AWS outage):
1.  **Script**: Create a nightly GitHub Action or Cron Job.
2.  **Command**: `pg_dump -h <host> -U <user> <db_name> > backup.sql`
3.  **Storage**: Upload `backup.sql` to **Digital Ocean Spaces** or **Google Drive**.
4.  **Frequency**: Daily.

## 4. Recovery Drills (Mandatory)
To ensure backups are actually valid:
*   **Frequency**: Every 6 months.
*   **Procedure**:
    1.  Create a fresh Supabase project ("Staging").
    2.  Restore the latest production backup to this Staging project.
    3.  Verify: Check if user accounts, gifts, and messages are present.
    4.  Verify: Check if the app connects and functions correctly with the restored DB.

## 5. Contacts & Access
*   **Digital Ocean**: [Link to Dashboard]
*   **Supabase**: [Link to Dashboard]
*   **GitHub**: [Link to Repo]
