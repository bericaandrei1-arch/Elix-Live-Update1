# Continuous Improvement Process (CIP)

**Rule:** All changes must follow this cycle. No skipping.

## 🔄 The Cycle (Phase 1 → 4)

### Phase 1: Diagnosis & Planning
*   **Trigger**: New Feature Request or Bug Report.
*   **Activities**:
    *   Research feasible solutions.
    *   Create a Design Doc (RFC).
    *   **Gate**: Approval from Lead/Owner.

### Phase 2: Implementation
*   **Activities**:
    *   Write code (Feature Branch).
    *   Write Tests (Unit/Integration).
    *   Local Verification.
*   **Gate**: Code Review + Tests Pass.

### Phase 3: Stabilization
*   **Activities**:
    *   QA Testing (Staging).
    *   Fix Bugs found in QA.
    *   Update Documentation (`README.md`, `API Docs`).
*   **Gate**: Staging Sign-off.

### Phase 4: Operations
*   **Activities**:
    *   Deploy to Production (Blue/Green).
    *   Monitor Metrics (CPU, Errors).
    *   Rollback if failure.
    *   Post-Launch Review.
*   **Gate**: Stable for 24 hours.

## 🚀 New Feature Policy
*   **Every new feature = Restart Cycle.**
*   Do not bundle multiple massive features into one Phase 2.
*   Break features into smaller, shippable increments.

## 🛡️ Risk Management
*   If a step fails, go back to the previous step.
*   Never push to Production (Phase 4) without passing Phase 3.
