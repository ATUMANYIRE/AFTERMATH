# AFTERMATH — Deployment Rehearsal Results

**Evaluation Date:** October 21, 2026  
**Auditor:** Principal SRE, Security Auditor, & Release Engineer  
**Target Repository:** `E:\Projects\AFTERMATH`  
**GitLab Canonical:** `https://gitlab.com/atumanyire-labs/aftermath`  
**GitHub Mirror:** `https://github.com/ATUMANYIRE/AFTERMATH`  
**Commit Inspected:** `590c773`  
**Overall Rehearsal Status:** **PASSED (Local Production-Style Readiness Confirmed)**

---

## 1. Environment Verification

| Tool / Runtime | Installed Version | Declared Requirement | Verification Status |
|---|---|---|---|
| **Python** | 3.11.9 | `>=3.11` | **PASS** |
| **Node.js** | v24.12.0 | `>=20.0.0` | **PASS** |
| **npm** | 11.19.0 | `>=9.0.0` | **PASS** |
| **Docker** | 29.8.2 (Desktop Linux Engine) | `>=24.0.0` | **PASS** |
| **Docker Compose** | v5.5.1-desktop.1 | `>=2.20.0` | **PASS** |
| **Edge / Chromium** | 141.0.3537.106 | System Web Engine | **PASS** |

---

## 2. Fresh Database & Migration Rehearsal

A disposable temporary database (`test_fresh_rehearsal.db`) was created to test full schema initialization from scratch without relying on existing development state.

### Migration Upgrade Log
```
INFO  [alembic.runtime.migration] Context impl SQLiteImpl.
INFO  [alembic.runtime.migration] Will assume non-transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001_initial_schema, Initial schema for AFTERMATH domain models
INFO  [alembic.runtime.migration] Running upgrade 001_initial_schema -> 002_executable_experiments, Executable experiments and durable idempotency table
INFO  [alembic.runtime.migration] Running upgrade 002_executable_experiments -> 003_causal_graph_and_blast_radius, Causal graph and blast radius tables
INFO  [alembic.runtime.migration] Running upgrade 003_causal_graph_and_blast_radius -> 004_remediation_workflows, Remediation workflows table
```

### Seeding, Idempotency & Restart Verification
- **Run 1 (Cold Start):** All 4 migration revisions applied in 6.1s. Deterministic seed fixtures loaded 2 releases, 5 baseline experiments, 11 causal nodes, 8 causal edges, and 1 baseline remediation workflow (`rem-wf-001`).
- **Run 2 (Service Restart):** Seed routine re-executed against the existing database. `seed_initial_data` detected existing records, returning `False` without primary key collisions or foreign key violations.
- **Data Durability:** Clean shutdown and restart confirmed 100% data retention.

---

## 3. Backend & Concurrency Test Suite Results

### A. Full Backend Pytest Suite (36 Tests Passing)
```
backend/tests/test_causal_engine.py .......                              [ 19%]
backend/tests/test_endpoints.py .......                                  [ 38%]
backend/tests/test_experiments.py ......                                 [ 55%]
backend/tests/test_health.py ..                                          [ 61%]
backend/tests/test_remediation.py ......                                 [ 77%]
backend/tests/test_synthetic_payment.py ...                              [ 86%]
services/payment_worker/test_durable_processor.py .....                  [100%]

============================= 36 passed in 28.07s =============================
```

### B. Target Defect Proof (Failure Reproduction)
The vulnerable target processor (`services/payment_worker/processor.py`) was evaluated against `services/payment_worker/test_processor.py`:
- `test_single_payment_succeeds`: **PASSED** (Single payment settles cleanly)
- `test_subsequent_retry_deduplication`: **PASSED** (Sequential retries return cached receipt)
- `test_concurrent_retries_invariant`: **FAILED AS INTENDED (INV-PAY-001)**
  ```
  AssertionError: INVARIANT VIOLATED (INV-PAY-001): Order ord_concurrent_99 debited 5 times! Duplicate charges: 4
  assert 5 == 1
  ```
This proves that the invariant test genuinely detects the race condition and does not report a false positive.

### C. Multi-Process Durable Concurrency Proof
`services/payment_worker/test_durable_processor.py` was executed across 5 independent operating system processes with SQLite WAL concurrency:
- `test_identical_purchase_retried_repeatedly`: **PASSED**
- `test_idempotency_key_reuse_across_distinct_purchases`: **PASSED**
- `test_worker_crash_and_restart`: **PASSED**
- `test_multiprocess_concurrency`: **PASSED** (5 distinct OS processes competing simultaneously)
- `test_at_most_one_guarantee_explicit`: **PASSED**

---

## 4. Frontend Production Build & Route Verification

Next.js 15 App Router production bundle compiled cleanly with zero TypeScript errors and zero warnings:

```
Route (app)                                 Size  First Load JS
┌ ○ /                                    4.66 kB         119 kB
├ ○ /_not-found                            992 B         104 kB
├ ○ /agent-activity                      4.03 kB         117 kB
├ ○ /investigation                       64.9 kB         180 kB
├ ○ /release-control                     6.28 kB         123 kB
├ ○ /remediation                         7.63 kB         121 kB
└ ○ /time-machine                        7.99 kB         125 kB
+ First Load JS shared by all             103 kB
```

### URL Rewrites Verified
To ensure full compliance with the hackathon review specification:
- `/experiments` rewrites transparently to `/time-machine` (`HTTP 200 OK`).
- `/experiments/:id` rewrites to `/time-machine?experiment=:id` (`HTTP 200 OK`).

---

## 5. Playwright E2E Browser Test Results

Executed via Microsoft Edge (`msedge`) in headless mode against active local production daemons:

```
  ✓  1 [msedge] › e2e/end_to_end_demo.spec.ts (2.5s)
     - Complete 11-step journey: Defect -> Failure -> Causal Trace -> Repair Studio -> Sandbox Validation -> Human Gatekeeper -> Release Superposition
  ✓  2 [msedge] › e2e/investigation.spec.ts (1.3s)
     - Causal graph layout, blast radius table inspection, interactive node selection
  ✓  3 [msedge] › e2e/remediation.spec.ts (754ms)
     - Unified diff rendering, sandboxed test execution, approval sign-off
  ✓  4 [msedge] › e2e/time_machine.spec.ts (1.0s)
     - Consequence experiment execution, ledger transaction verification, side-by-side timeline

  4 passed (7.4s)
```

---

## 6. Security & Sandbox Audit Findings

1. **Path Traversal Defense:** `validate_target_path()` enforces `ALLOWED_TARGET_PREFIXES = ("services/payment_worker/",)`. Path traversal attempts (`../../`) and symlinks are rejected.
2. **Shell Injection Defense:** Prohibited tokens (`;`, `&`, `|`, `` ` ``, `$`, `\n`) are rejected with `HTTP 400 Bad Request`.
3. **AST Token Guard:** Proposed patches containing prohibited calls (`os.system`, `subprocess.Popen`, `eval(`, `__import__`) are rejected with `HTTP 403 Forbidden`.
4. **Environment Isolation:** Sandbox child processes execute with a sanitized environment dictionary (`clean_env`), preventing leakage of `GITLAB_ACCESS_TOKEN` or system credentials.
5. **Timeout Bounding:** Subprocess execution is strictly bounded to 15 seconds.
6. **Secret Exposure Scan:** Comprehensive `git grep` confirmed **zero committed secrets, private keys, or actual GitLab PATs** anywhere in repository history.
7. **CORS Safety:** Whitelist explicitly configured for `localhost:3000` and `127.0.0.1:3000`.

---

## 7. Container Rehearsal & Discovered Defects Resolved

During containerized deployment rehearsal, three significant defects were discovered and resolved:

### A. Docker Build Context Bloat (550MB -> 7.6kB)
- **Defect:** No `.dockerignore` file existed in the root repository. Docker Desktop was transferring over 550MB of local `node_modules`, `.next`, `backend/.venv`, and `screenshots` on every build.
- **Resolution:** Authored `.dockerignore` in root and `backend/.dockerignore`, reducing context transfer size from 550MB to **7.6kB** and build setup latency from 2+ minutes to 0.1 seconds.

### B. Debian CDN 503 Mirror Error Workaround
- **Defect:** `backend/Dockerfile` executed `apt-get update && apt-get install curl` on `python:3.11-slim`, which failed due to transient HTTP 503 errors on Debian's Fastly CDN (`151.101.130.132`).
- **Resolution:** Switched container health check in `docker-compose.yml` to utilize Python's built-in standard library (`urllib.request`), eliminating the need for `apt-get` and `curl` entirely. Pinned base image to `python:3.11-slim-bookworm`.

### C. Static Project Root Resolution in Container Worktree
- **Defect:** `backend/app/services/remediation_engine.py` statically resolved `PROJECT_ROOT = Path(__file__).resolve().parents[3]`. While correct on the local host filesystem, inside a Docker container where code is mounted at `/app`, `parents[3]` resolved to root (`/`), causing a 404 when looking for `services/payment_worker/processor.py`.
- **Resolution:** Refactored `PROJECT_ROOT` to use `_find_project_root()`, which dynamically traverses parent directories until locating the `services/payment_worker` module. Mounted `./services:/app/services:ro` in `docker-compose.yml`.

### D. Verified Container Metrics
- **Backend Image:** `aftermath-backend:latest`
- **Image ID:** `sha256:777d37d4be1c`
- **Disk Usage:** 248MB
- **Container Startup Time:** 1.2s to healthy `/healthz` response on port 8001.

---

## 8. Current Daemon Status (Active Local Demo)

The full platform has been left running in the background for live judge evaluation:

| Service | Local URL | Process Status | Health Check Output |
|---|---|---|---|
| **Frontend UI** | `http://localhost:3000` | **ONLINE (Daemon)** | `HTTP 200 OK` (Next.js 15) |
| **Backend API** | `http://localhost:8000` | **ONLINE (Daemon)** | `{"status":"ok","environment":"development","version":"0.1.0"}` |
| **Readiness Probe** | `http://localhost:8000/readyz` | **ONLINE (Daemon)** | `{"ready":true,"database_connected":true,"seed_data_loaded":true}` |
| **Interactive Docs** | `http://localhost:8000/docs` | **ONLINE (Daemon)** | `HTTP 200 OK` (FastAPI Swagger UI) |
