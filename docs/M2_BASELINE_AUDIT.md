# AFTERMATH — Milestone 2 Baseline Engineering Audit

> **Document**: `docs/M2_BASELINE_AUDIT.md`  
> **Author**: Principal Distributed-Systems Engineer, Reliability Researcher & GitLab Duo Architect  
> **Date**: 2026-10-20  
> **Target**: Comprehensive assessment of Milestone 1 platform prior to Milestone 2 implementation

---

## 1. Executive Summary

Milestone 1 established the initial monorepo, foundational domain models, light-theme design system, and seeded demonstrator runs. However, an engineering audit reveals significant architectural gaps between the *narrative claims* of Milestone 1 and the *actual mechanical capabilities* of the engine:

1. **Redis is completely unconfigured and non-existent in backend code**: While seed data narratives claimed "Redis SETNX distributed lock", there is no Redis client (`redis-py` or `aioredis`), no connection pool, no lock manager, and no test verifying distributed lock semantics.
2. **Payment Idempotency was purely simulated with explicit branch checks**: The previous `execute_transaction` method checked `if req.release_variant == "vulnerable"`, and if an idempotency key was reused, manually constructed a record labeled `status="race_corrupted"`. It did not execute true concurrent requests under thread/coroutine contention, nor did it test real database transaction isolation levels or race conditions.
3. **Seeded Metrics had no reproducible provenance**: Experiments `exp-vuln-001` and `exp-rep-001` (450 transactions, 27 violations, $1,240 duplicate debits, 482ms vs 68.5ms latency) were hardcoded seed constants inserted via `seed_data.py`, without an executable PRNG or dynamic scenario generator.
4. **The Release Time Machine was a passive viewer**: The frontend displayed seeded static comparisons without the ability for engineers to configure concurrency, retry rates, fault injection, or launch new real experiments.

Milestone 2 addresses these gaps by implementing a **genuinely executable, deterministic, and durable Consequence Laboratory**.

---

## 2. Component-by-Component Audit

### 2.1 Synthetic Payment Service & Concurrency Invariants
- **Location**: `backend/app/services/synthetic_payment.py`
- **Current Behavior**:
  - Relies on sequential lookups `select(SyntheticTransaction).where(idempotency_key == key)`.
  - In a real distributed system, two concurrent HTTP requests arrive within microseconds. Both execute the SELECT simultaneously before either commits an INSERT (Time-Of-Check to Time-Of-Use race condition).
  - Milestone 1's implementation bypassed this by checking `if existing is not None:` and branching on `release_variant == "vulnerable"`.
- **Defects & Vulnerabilities**:
  - No database-level unique constraint on idempotency keys.
  - No atomic state transition lifecycle (`IN_FLIGHT`, `SETTLED`, `FAILED`).
  - No lock lease or timeout handling: if a process crashes mid-settlement, the idempotency key remains permanently trapped or undefined.
  - No ledger table tracking double-entry balance consistency.

### 2.2 Redis & Distributed Lock Audit
- **Requirement Verification**: Did Milestone 1 connect to or test Redis?
- **Finding**: **NEGATIVE (0% implemented).**
  - No `redis` package in `backend/requirements.txt`.
  - No Redis environment variable in `backend/app/config.py`.
  - No Redis client initialized in `backend/app/database.py` or `synthetic_payment.py`.
  - Running services check: While a container `origin-redis` (port 6399) runs on the host for an unrelated project, AFTERMATH does not communicate with any Redis instance.
- **Architectural Lesson**: A Redis `SETNX` lock *alone* does not guarantee idempotency in payment systems. Redis locks can expire while a database commit is delayed, leading to split-brain double charges. True idempotency requires **durable database uniqueness constraints, state-machine leases, and ACID transaction boundaries**.

### 2.3 Reproducibility & Provenance Audit
- **Seeded Constants**:
  - `exp-vuln-001`: Duration `45.2s`, `27` violations, `$1,240.00` duplicate billing, `p95 482ms`.
  - `exp-rep-001`: Duration `42.1s`, `0` violations, `$0.00` duplicate billing, `p95 68.5ms`.
  - Events at `+0ms`, `+250ms`, `+1200ms`, `+1450ms`, `+1580ms`, `+2800ms`, `+4500ms`.
- **Verdict**: These values were hand-authored fiction. In Milestone 2, all metrics, latencies, event offsets, and violation counts must be computed dynamically by a real scenario execution engine with an explicit PRNG seed.

### 2.4 Baseline Test Suite
- **Current Test Count**: 11 passed in 0.84s (`pytest -v backend/tests`).
  - `tests/test_endpoints.py`: 6 tests (Overview, Time Machine, Investigation, Agent Activity, Release Control).
  - `tests/test_health.py`: 2 tests (`/healthz`, `/readyz`).
  - `tests/test_synthetic_payment.py`: 3 tests (mock double charge, mock deduplication, stats).
- **Test Gap**: Zero concurrent execution tests, zero race condition tests, zero invariant property tests.

---

## 3. GitLab Platform Status

- **GitHub Remote**: `https://github.com/ATUMANYIRE/AFTERMATH.git` — Synchronized and passing on `main` (commit `10694c5`).
- **GitLab Remote**: `https://gitlab.com/atumanyire/aftermath.git` — Checked via `git ls-remote gitlab`:
  ```
  remote: The project you were looking for could not be found or you don't have permission to view it.
  fatal: repository 'https://gitlab.com/atumanyire/aftermath.git/' not found
  ```
- **Action**: Access blocker recorded. Implementation continues autonomously with full local reproducibility and GitLab CI pipeline readiness.

---

## 4. Milestone 2 Implementation Objectives

1. **Executable Experiment Engine**:
   - Discrete-event simulation runner with deterministic PRNG seeds.
   - Five scenarios:
     1. Lost payment response followed by client retry (`lost-response-retry`).
     2. Multiple concurrent checkout requests (`concurrent-checkouts`).
     3. Repeated identical idempotency keys (`duplicate-idempotency-keys`).
     4. Delayed database commits (`delayed-db-commit`).
     5. Simulated transient network failures (`transient-network-drop`).
2. **Mechanically Sound Payment Invariant Engine**:
   - Invariant: `ONE LOGICAL PURCHASE MUST NOT PRODUCE MULTIPLE CHARGES.`
   - Vulnerable variant: Real concurrency window without atomic constraint permits duplicate charges.
   - Repaired variant: Durable idempotency record with unique constraint, atomic lease/state machine, and ACID transaction boundary.
   - Legitimate distinct purchases are never suppressed.
3. **REST API Extensions**:
   - `POST /api/v1/experiments/run`
   - `GET /api/v1/experiments/{id}`
   - `GET /api/v1/experiments/{id}/events`
   - `GET /api/v1/experiments/{id}/evidence`
   - `GET /api/v1/experiments/{id}/comparison`
4. **Signature Interactive Laboratory UI**:
   - Scenario selector, concurrency controls, retry count slider, seed input, execution progress, synchronized timeline scrubbers, ledger delta comparison, and invariant verdict badges.
