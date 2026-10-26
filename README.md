# AFTERMATH — The Release Time Machine

> **Every release has consequences. See them before production.**  
> Built for the **GitLab Life After Code Hackathon** (Deadline: October 27, 2026, 15:00 GMT+2).

[![Python](https://img.shields.io/badge/Python-3.11+-1D4ED8?style=flat-square&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15%20App%20Router-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-334155?style=flat-square)](LICENSE)

---

## What is AFTERMATH?

Continuous Delivery pipelines test code changes against static unit suites and isolated integration tests. But when changes hit production, unpredictable cascades happen: missing idempotency locks trigger duplicate billing under network retries, connection pools starve, and cascade failures breach customer SLAs.

**AFTERMATH** is the **Release Time Machine**:
- It runs **seeded, deterministic counterfactual experiments** on a release candidate. The experiment engine is a scripted simulation of a payment-retry failure, not the live payment code.
- It simulates production-like concurrency profiles (race window, lost response, key replay, DB lag, network drop).
- It displays a **side-by-side split comparison** of two actual experiment runs: the **Vulnerable Release** vs the **Repaired Release**.
- It provides tangible, evidence-backed proof of anomalies caught and prevented (such as double-charges, DB pool starvation, and p95 latency spikes).
- It enforces **DevSecOps verification gates** and human sign-off before any code touches staging or production.

---

## The Six Workspaces

| Workspace | Route | Purpose | Key Capabilities |
|:----------|:------|:--------|:-----------------|
| **A. Overview** | `/` | Operational Control Center | Active investigations, simulated exposure ($1,500, no real customer charged), readiness score and release registry. |
| **B. Release Time Machine** | `/time-machine` | **The Signature Centerpiece** | Split timeline comparison of two actual runs: unpatched vulnerable run vs repaired run. Synced event traces, latency delta, and ledger proof. |
| **C. Investigation Workspace** | `/investigation` | Causal Graph & Blast Radius | Interactive directed graph connecting code commits to runtime failures, epistemic provenance, and counterfactual analysis. |
| **D. Remediation Studio** | `/remediation` | **Autonomous Fix & Verification** | AST concurrency analysis, GNU unified diff synthesis, ephemeral sandboxed pytest execution (pre-patch fails, post-patch passes), and human gatekeeper approvals. |
| **E. Agent Activity** | `/agent-activity` | Agent Execution Traces | Full execution logs, tool call arguments, and honest setup guidance for GitLab Duo integrations. |
| **F. Release Control** | `/release-control` | **Release Superposition & Governance** | Multi-scenario superposition matrix (5 fault injection profiles), evidence-backed release recommendations, automated policy gates, and human sign-off. |

---

## Screenshots

All screenshots are of the running app (1366 px wide) with the built-in demo data. Dollar amounts are **simulated**; no real customer was charged.

### 1. Overview
The release registry and headline figures: release v2.4.0 is blocked for a duplicate-charge risk.

![Overview](screenshots/latest/01_overview.png)

### 2. Release Time Machine
The same failure, same seed, run against the vulnerable and the repaired release. Here 10 orders violate the one-charge-per-purchase rule in the vulnerable run and none in the repaired run.

![Time Machine](screenshots/latest/02_time_machine.png)
![Time Machine, expanded timelines](screenshots/latest/03_timelines_expanded.png)

The customer ledger: duplicate charges on the left, deduplicated retries on the right.

![Ledger](screenshots/latest/04_ledger.png)

### 3. Investigation
The causal graph from the code change to the double charge, before and after tracing the path.

![Investigation](screenshots/latest/05_investigation_initial.png)
![Investigation, traced path](screenshots/latest/06_investigation_traced.png)
![Investigation, graph fitted](screenshots/latest/07_investigation_fit.png)

### 4. Remediation Studio
The proposed patch as a unified diff, the recorded sandbox proof (real pytest output: failing before the patch, passing after), and the human sign-off.

![Remediation diff](screenshots/latest/08_remediation_diff.png)
![Sandbox proof](screenshots/latest/09_remediation_sandbox.png)
![Remediation approved](screenshots/latest/10_remediation_approved.png)

### 5. Release Control
Four policy gates, the last one a human sign-off, plus the scenario grid.

![Gates pending](screenshots/latest/11_release_control_gates_pending.png)
![Gates approved](screenshots/latest/12_release_control_gates_approved.png)
![Scenario grid](screenshots/latest/13_release_control.png)

### 6. Agent Activity
Honest agent status: the app is not connected to GitLab Duo, and its agent runs are labelled as local benchmarks.

![Agent Activity](screenshots/latest/14_agent_activity.png)
![Agent flow YAML](screenshots/latest/15_agent_yaml.png)

---

## What Is Real and What Is Simulated

| Area | Status |
|:-----|:-------|
| Experiment runs, ledger, event traces | Seeded **simulation** (deterministic); stored and served by the real API |
| Remediation sandbox verification | **Real pytest** run in an ephemeral directory (fails before the patch, passes after) |
| The patch itself | A **fixed reference patch**, not generated by an AI |
| Causal graph, blast radius, scenario grid, release headline | **Prepared demo data**; path tracing over the graph is a real search |
| Human approvals and gate sign-off | Real API state changes (limited to local callers unless `WRITE_API_KEY` is set) |
| GitLab Duo | **Not connected** from the app; see "GitLab Duo" below |
| CI jobs `simulation:time_machine`, `release:control_gates` | Placeholders; they do not enforce release policy |

See [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md), [`docs/COMPLETE_TESTING_GUIDE.md`](docs/COMPLETE_TESTING_GUIDE.md) and [`docs/DEMO_WALKTHROUGH.md`](docs/DEMO_WALKTHROUGH.md).

---

## Design System

A light, neutral engineering UI: off-white page (`#F8F9FB`), white cards with fine `#ECEEF1` borders, near-black text (`#191C24`), grey secondary text (`#747B87`), dark buttons (`#20242D`) and a single orange accent (`#FF6A13`) for risk. Inter typeface.

---

## Technology Stack

### Backend
- **Python 3.11+**
- **FastAPI**: Asynchronous high-performance REST endpoints
- **SQLAlchemy 2.0 (Async)**: Modern async ORM
- **Alembic**: Database migrations and version tracking
- **PostgreSQL / SQLite**: Dual support (PostgreSQL for Docker/production, async SQLite for instant local quickstart)
- **Pydantic v2**: Strict input validation and serialization
- **Pytest & Pytest-Asyncio**: Unit and integration test coverage

### Frontend
- **Next.js 15 (App Router)**: Server & Client components
- **TypeScript (Strict Mode)**: Comprehensive type contracts
- **Tailwind CSS**: Custom ivory/charcoal/cobalt token system
- **TanStack Query (React Query)**: Declarative data fetching and caching
- **Lucide Icons**: Crisp, uniform iconography

### Infrastructure
- **GitLab CI/CD**: Complete multi-stage DevSecOps pipeline (`.gitlab-ci.yml`)
- **Docker Compose**: Production orchestration (`postgres:16`, `backend`, `frontend`)
- **GitHub Mirror**: Automated CI workflow (`.github/workflows/ci.yml`)

---

## Quickstart Guide

### Option 1: Local Development (Instant, Zero External Dependencies)

#### 1. Backend Setup
```bash
# Clone the repository
git clone https://github.com/ATUMANYIRE/AFTERMATH.git
cd AFTERMATH

# Set up Python virtual environment
python -m venv backend/.venv
# Windows:
backend\.venv\Scripts\activate
# Linux/macOS:
source backend/.venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Run migrations and start API server
cd backend
python -m alembic upgrade head
uvicorn app.main:app --reload --port 8000
```
Backend is now running at `http://localhost:8000`. Interactive docs: `http://localhost:8000/docs`.

#### 2. Frontend Setup
In a new terminal window:
```bash
cd AFTERMATH
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

### Option 2: Docker Compose (Full Production Stack)

```bash
docker compose up --build
```
This spins up:
- **PostgreSQL 16**: Port 5432
- **AFTERMATH Backend**: Port 8000
- **AFTERMATH Frontend**: Port 3000

---

## Testing & Quality Assurance

### Run Backend Unit & Integration Tests
```bash
cd backend
pytest -v
```
Output:
```
============================= 38 passed =============================
```

### Run Frontend Typecheck & Playwright E2E
```bash
# Typecheck
npm run typecheck

# Playwright End-to-End Suite (2 passing tests)
npx playwright test
```

---

## Causal Graph & Blast Radius Intelligence

AFTERMATH features a typed, persistent directed causal graph and blast-radius intelligence engine:

| Endpoint | Method | Description |
|:---------|:-------|:------------|
| `/api/v1/investigation/{release_id}/causal-graph` | GET | Persistent directed topology with epistemic classifications (`OBSERVED`, `EXPERIMENTALLY_SUPPORTED`, `INFERRED`, `UNKNOWN`). |
| `/api/v1/investigation/{release_id}/blast-radius` | GET | Deterministic impact calculation: direct services, downstream cascades, and dollar exposure. |
| `/api/v1/investigation/{release_id}/counterfactual` | GET | Side-by-side blast radius comparison between vulnerable and repaired releases. |
| `/api/v1/investigation/{release_id}/trace-path` | GET / POST | Cycle-safe bounded BFS causal path discovery from code changes to broken invariants. |

---

## Consequence Laboratory & REST API

The Consequence Laboratory exposes a deterministic fault injection and invariant verification engine:

| Endpoint | Method | Description |
|:---------|:-------|:------------|
| `/api/v1/experiments/run` | POST | Execute a single counterfactual scenario (`lost-response-retry`, `concurrent-checkouts`, `duplicate-idempotency-keys`, `delayed-db-commit`, `transient-network-drop`). |
| `/api/v1/experiments/run-pair` | POST | Concurrently execute vulnerable and repaired runs with identical PRNG seed. |
| `/api/v1/experiments/{id}` | GET | Fetch experiment status, invariant result, duration, and error count. |
| `/api/v1/experiments/{id}/events` | GET | Chronological event trace with millisecond offsets and service markers. |
| `/api/v1/experiments/{id}/evidence` | GET | Empirical proof, log excerpts, and verification artifacts. |
| `/api/v1/experiments/{id}/ledger` | GET | Customer-level financial ledger debits with duplicate violation detection. |
| `/api/v1/experiments/{id}/comparison` | GET | Full side-by-side delta between paired runs. |
| `/api/v1/experiments/history` | GET | Audit log of all completed consequence runs. |

### Invariant Guarantee:
$$\text{INVARIANT}: \quad \forall \, \text{order } o, \quad \text{settled\_charges}(o) \le 1$$
- **Vulnerable Variant**: Violates the invariant under transient retry and race conditions ($1,500.00 in double debits).
- **Repaired Variant**: Guarantees single-billing via durable database unique constraints on `(experiment_id, scope, idempotency_key)` and 3-phase atomic transitions (`IN_FLIGHT` $\to$ `SETTLED`).

---

## GitLab Duo Agent Platform Setup

The app has configuration hooks for GitLab, but **it does not currently call GitLab Duo**; the Agent Activity page shows `Not connected` and labels its agent runs as local benchmarks. Settings for a future integration:

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Set your GitLab credentials:
   ```env
   GITLAB_INSTANCE_URL=https://gitlab.com
   GITLAB_PROJECT_PATH=atumanyire/aftermath
   GITLAB_ACCESS_TOKEN=glpat-your-personal-access-token
   GITLAB_DUO_ENABLED=true
   ```
   *Required token scopes: `api`, `read_api`, `read_repository`.*
3. When `GITLAB_DUO_ENABLED=false` or unconfigured (the default), the application runs in **Unconfigured Demo Mode** with benchmark fixtures labelled as such.
4. To start with an empty database instead of the demo fixtures, set `SEED_DEMO_DATA=false`. Most screens need the demo release, so this is only useful for development.

---

## Repository Setup & Competition Links

- **Canonical GitLab Repository**: [https://gitlab.com/atumanyire-labs/aftermath](https://gitlab.com/atumanyire-labs/aftermath) *(Required for the GitLab Life After Code Hackathon)*
- **GitHub Mirror**: [https://github.com/ATUMANYIRE/AFTERMATH.git](https://github.com/ATUMANYIRE/AFTERMATH.git)
- **Complete Testing Guide**: [`docs/COMPLETE_TESTING_GUIDE.md`](docs/COMPLETE_TESTING_GUIDE.md)
- **Demo Walkthrough**: [`docs/DEMO_WALKTHROUGH.md`](docs/DEMO_WALKTHROUGH.md)
- **Architecture Documentation**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Milestone 1 Acceptance Report**: [`docs/MILESTONE_1_ACCEPTANCE.md`](docs/MILESTONE_1_ACCEPTANCE.md)
- **Milestone 2 Baseline Audit**: [`docs/M2_BASELINE_AUDIT.md`](docs/M2_BASELINE_AUDIT.md)
- **Milestone 2 Acceptance Report**: [`docs/MILESTONE_2_ACCEPTANCE.md`](docs/MILESTONE_2_ACCEPTANCE.md)
- **Milestone 3 Baseline Audit**: [`docs/M3_BASELINE.md`](docs/M3_BASELINE.md)
- **Milestone 3 Acceptance Report**: [`docs/MILESTONE_3_ACCEPTANCE.md`](docs/MILESTONE_3_ACCEPTANCE.md)
- **Milestone 4 Baseline Audit**: [`docs/M4_BASELINE_AUDIT.md`](docs/M4_BASELINE_AUDIT.md)
- **Remediation Security & Sandbox Architecture**: [`docs/REMEDIATION_SECURITY.md`](docs/REMEDIATION_SECURITY.md)
- **Milestone 4 Acceptance Report**: [`docs/MILESTONE_4_ACCEPTANCE.md`](docs/MILESTONE_4_ACCEPTANCE.md)
- **Final Release Audit (Milestone 5)**: [`docs/FINAL_RELEASE_AUDIT.md`](docs/FINAL_RELEASE_AUDIT.md)
- **GitLab Duo Evidence & Blocker Report**: [`docs/GITLAB_DUO_EVIDENCE.md`](docs/GITLAB_DUO_EVIDENCE.md)
- **Known Technical Limitations & Boundaries**: [`docs/KNOWN_LIMITATIONS.md`](docs/KNOWN_LIMITATIONS.md)
- **Three-Minute Video Demo Script**: [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md)
- **Devpost Project Submission Copy**: [`docs/DEVPOST_SUBMISSION.md`](docs/DEVPOST_SUBMISSION.md)
- **Final Acceptance & Verification Report**: [`docs/FINAL_ACCEPTANCE_REPORT.md`](docs/FINAL_ACCEPTANCE_REPORT.md)

---

## License

This project is licensed under the [MIT License](LICENSE).
