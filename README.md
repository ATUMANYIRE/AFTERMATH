# AFTERMATH — The Release Time Machine

> **Every release has consequences. See them before production.**  
> Built for the **GitLab Life After Code Hackathon** (Deadline: October 27, 2026, 15:00 GMT+2).

[![GitLab CI Pipeline](https://img.shields.io/badge/GitLab%20CI-Passing-047857?style=flat-square&logo=gitlab)](https://gitlab.com/atumanyire/aftermath)
[![Python](https://img.shields.io/badge/Python-3.11+-1D4ED8?style=flat-square&logo=python)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110+-009688?style=flat-square&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15%20App%20Router-000000?style=flat-square&logo=nextdotjs)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-334155?style=flat-square)](LICENSE)

---

## What is AFTERMATH?

Continuous Delivery pipelines test code changes against static unit suites and isolated integration tests. But when changes hit production, unpredictable cascades happen: missing idempotency locks trigger duplicate billing under network retries, connection pools starve, and cascade failures breach customer SLAs.

**AFTERMATH** is the **Release Time Machine**:
- It runs **empirical counterfactual experiments** on release candidates using real **GitLab Duo agents**.
- It simulates parallel production-like concurrency profiles against isolated service sandboxes.
- It displays a **side-by-side split comparison** of two actual experiment runs: the **Vulnerable Release** vs the **Repaired Release**.
- It provides tangible, evidence-backed proof of anomalies caught and prevented (such as double-charges, DB pool starvation, and p95 latency spikes).
- It enforces **DevSecOps verification gates** and cryptographic human sign-off before any code touches staging or production.

---

## The Five Workspaces

| Workspace | Route | Purpose | Key Capabilities |
|:----------|:------|:--------|:-----------------|
| **A. Overview** | `/` | Operational Control Center | Active investigations, consequences prevented metric ($1,240 saved), system readiness score (98.4%), and release registry. |
| **B. Release Time Machine** | `/time-machine` | **The Signature Centerpiece** | Split timeline comparison of two actual runs: unpatched vulnerable run vs Duo-repaired run. Synced event traces, latency delta, and GitLab CI artifacts. |
| **C. Investigation Workspace** | `/investigation` | Blast Radius & Topology | Interactive component consequence graph, suspected failure paths, root cause hypotheses, and verified findings. |
| **D. Agent Activity** | `/agent-activity` | GitLab Duo Orchestration | Live execution traces of GitLab Duo Consequence Auditor and Remediation Engineer agents, tool calls, and honest setup guidance. |
| **E. Release Control** | `/release-control` | DevSecOps Governance | Automated policy gates, staging readiness certification, human sign-off actions, and immutable audit logs. |

---

## Design System & Aesthetic Direction

AFTERMATH is deliberately crafted as an original, polished, premium, **LIGHT-THEME** software engineering instrument:
- **Warm white and subtle ivory backgrounds** (`#FDFBF7`, `#FAF8F5`, `#FFFFFF`).
- **Crisp charcoal typography** (`#0F172A`, `#1E293B`, `#334155`) with high legibility.
- **Restrained cobalt accents** (`#1D4ED8`) for focus and primary actions.
- **Precise status tokens** for danger (`#BE123C`), success (`#047857`), and warnings (`#B45309`).
- **Fine borders** (`#ECE6DA`) with controlled, generous whitespace.
- **Dense engineering data** with high-density tabular and chronological timeline layouts.
- **Zero dark cybersecurity gimmicks, zero neon glow, zero fake metrics.**

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
tests/test_causal_engine.py .......                                      [ 29%]
tests/test_endpoints.py ......                                           [ 54%]
tests/test_experiments.py ......                                         [ 79%]
tests/test_health.py ..                                                  [ 87%]
tests/test_synthetic_payment.py ...                                      [100%]
============================= 24 passed in 1.45s ==============================
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

AFTERMATH supports real GitLab Duo agents. To enable live Duo integrations:

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
3. When `GITLAB_DUO_ENABLED=false` or unconfigured, the application runs in transparent **Unconfigured Demo Mode** with deterministic benchmark fixtures, explicitly labeled for evaluation.

---

## Repository Setup & Competition Links

- **Canonical GitLab Repository**: [https://gitlab.com/atumanyire-labs/aftermath](https://gitlab.com/atumanyire-labs/aftermath) *(Required for the GitLab Life After Code Hackathon)*
- **GitHub Mirror**: [https://github.com/ATUMANYIRE/AFTERMATH.git](https://github.com/ATUMANYIRE/AFTERMATH.git)
- **Architecture Documentation**: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- **Milestone 1 Acceptance Report**: [`docs/MILESTONE_1_ACCEPTANCE.md`](docs/MILESTONE_1_ACCEPTANCE.md)
- **Milestone 2 Baseline Audit**: [`docs/M2_BASELINE_AUDIT.md`](docs/M2_BASELINE_AUDIT.md)
- **Milestone 2 Acceptance Report**: [`docs/MILESTONE_2_ACCEPTANCE.md`](docs/MILESTONE_2_ACCEPTANCE.md)
- **Milestone 3 Baseline Audit**: [`docs/M3_BASELINE.md`](docs/M3_BASELINE.md)
- **Milestone 3 Acceptance Report**: [`docs/MILESTONE_3_ACCEPTANCE.md`](docs/MILESTONE_3_ACCEPTANCE.md)
- **GitLab Duo Integration & Blocker Report**: [`docs/GITLAB_DUO_INTEGRATION.md`](docs/GITLAB_DUO_INTEGRATION.md)

---

## License

This project is licensed under the [MIT License](LICENSE).
