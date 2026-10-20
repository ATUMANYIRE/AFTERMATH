# Milestone 3 Baseline Audit & Architecture Verification

**Project**: AFTERMATH — The Release Time Machine  
**Milestone**: Milestone 3 of 5 — Causal Graph & Blast-Radius Analysis  
**Audit Timestamp**: 2026-10-20T20:30:00+02:00  
**Baseline Git Commit**: `dbb1944`  

---

## 1. Audit Scope & Verification Results

### 1.1 Test Suite & Integrity Baseline
- **Backend Tests (`pytest -v`)**:
  - `tests/test_endpoints.py`: 6 tests passing (Workspace routes, health checks, overview metrics).
  - `tests/test_experiments.py`: 6 tests passing (Executable scenarios, invariant enforcement, duplicate debits detection, delta calculations).
  - `tests/test_health.py`: 2 tests passing (`/healthz`, `/readyz`).
  - `tests/test_synthetic_payment.py`: 3 tests passing (Payment service, synthetic charge flows, card verification).
  - **Total**: 17 passing tests, 0 failures, 0 regressions. Execution duration: ~1.2s.
- **Frontend Typecheck (`tsc --noEmit`)**:
  - 0 errors. Strict TypeScript compliance maintained.
- **Playwright E2E Suite (`npx playwright test`)**:
  - 1 passing test in Microsoft Edge channel (`e2e/time_machine.spec.ts`).
  - Verified full UI rendering, tab navigation between Chronological Event Timeline and Customer Ledger Transactions, and invariant banner rendering.

---

## 2. Idempotency Boundaries & Scope Audit

### 2.1 Experiment-Scoped vs Production Idempotency Boundaries
In [`backend/app/models/idempotency_record.py`](file:///E:/Projects/AFTERMATH/backend/app/models/idempotency_record.py), the durable uniqueness constraint is configured as:
```python
UniqueConstraint("experiment_id", "scope", "idempotency_key", name="uq_experiment_scope_idempotency_key")
```
- **Rationale in Simulation Sandbox**: AFTERMATH runs repeatable counterfactual experiments with identical PRNG seeds across multiple runs. Including `experiment_id` in the compound key ensures each experiment execution (`exp-vul-*`, `exp-rep-*`) represents an isolated universe/tenant where concurrent retries compete for locks without interfering with past or concurrent simulation runs.
- **Production Idempotency Equivalent**: In live payment engines (Stripe, Adyen, Braintree), the scope is `(account_id, scope, idempotency_key)`. When deploying AFTERMATH's repaired barrier in production, `experiment_id` maps directly to `tenant_id` or `merchant_account_id`.
- **Finding**: The implementation is mathematically sound for multi-run deterministic simulation, provided that within any single experiment run, all requests for the same order share the exact same `(experiment_id, scope, idempotency_key)`. This was verified in Milestone 2 Phase C.

---

## 3. Metric Provenance & Honest Presentation Audit

### 3.1 Provenance Verification
1. **Financial Exposure Metric**:
   - Vulnerable variant: 10 orders $\times$ $75.00 avg $\times$ 2 duplicate debits = $1,500.00 in excess billed charges. Directly grounded in recorded `synthetic_transactions` where `is_duplicate = True` and `status = 'RACE_CORRUPTED'`.
   - Repaired variant: 10 orders billed exactly once = $0.00 duplicate charges. Directly grounded in `idempotency_records` intercepting retries with cached receipts.
2. **Timing / Latency**:
   - Latencies recorded in `ExperimentEvent` and `SyntheticTransaction` are measured wall-clock execution spans under controlled async sleep delays.
3. **GitLab Pipeline Identifiers**:
   - Seeded benchmark experiments refer to demonstrative pipeline IDs (`pipe-31048`, `pipe-31055`).
   - Newly executed experiments generate reproducible local run identifiers (`job-881824`, etc.).
   - Where real GitLab Duo execution is unconfigured, the UI honestly renders the "Unconfigured / Demo" badge and explicitly avoids claiming live GitLab SaaS execution.

---

## 4. External Remote & GitLab Blocker Status

- **GitLab Remote**: `https://gitlab.com/atumanyire-labs/aftermath.git`
- **Current Status**: `BLOCKED` (Remote returned `repository 'https://gitlab.com/atumanyire-labs/aftermath.git/' not found` or unauthorized).
- **Remediation Required**:
  1. Ensure project `aftermath` exists under namespace `atumanyire-labs` on gitlab.com.
  2. Verify project visibility is public or configure GitLab personal access token with `write_repository` permission in Git credentials.
  3. Once accessible, `git push gitlab main` will trigger the canonical GitLab CI/CD pipeline.
  4. Local development and verification continues independently without blocking.

---

## 5. Milestone 3 Objectives

1. Build a typed persistent Causal Graph data model and engine (`CausalNode`, `CausalEdge`, `BlastRadiusReport`).
2. Classify edges with strict epistemic rigor: `OBSERVED`, `EXPERIMENTALLY_SUPPORTED`, `INFERRED`, `UNKNOWN`.
3. Construct deterministic blast-radius calculations with explicit formulas and units.
4. Replace the static investigation page with an interactive `@xyflow/react` dependency graph featuring:
   - Node and edge filtering
   - Evidence inspector panel
   - Click-to-highlight causal paths
   - Counterfactual before/after comparison
   - Mobile fallback and accessible keyboard interactions.
5. Create comprehensive tests covering cycle detection, traversal limits, provenance, and E2E interactions.
