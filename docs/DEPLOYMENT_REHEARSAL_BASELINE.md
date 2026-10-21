# AFTERMATH — Deployment Rehearsal Baseline

**Product:** AFTERMATH — The Release Time Machine  
**Tagline:** Every release has consequences. See them before production.  
**Repository:** `E:\Projects\AFTERMATH`  
**GitLab Canonical:** `https://gitlab.com/atumanyire-labs/aftermath`  
**GitHub Mirror:** `https://github.com/ATUMANYIRE/AFTERMATH`  
**Baseline Commit:** `590c773`  
**Evaluation Date:** October 21, 2026  
**Rehearsal Lead:** Release Engineer, SRE, and DevSecOps Architect  

---

## 1. System Topology & Architectural Entry Points

AFTERMATH operates as a dual-runtime release supervision platform designed to predict, isolate, and remediate the downstream runtime consequences of code releases before staging or production deployment.

```
+-----------------------------------------------------------------------------+
|                          AFTERMATH SYSTEM TOPOLOGY                          |
+-----------------------------------------------------------------------------+

      [Browser / Operator]
               │
               ▼
     Next.js 15 App Router  (Port 3000)
     ├── /                 (Executive Cockpit & System Health)
     ├── /time-machine     (Consequence Laboratory: 5 Fault Scenarios)
     ├── /experiments      (Route Rewrite -> Consequence Laboratory)
     ├── /investigation    (Causal Graph & Blast Radius Workspace)
     ├── /remediation      (Autonomous Remediation & Sandbox Studio)
     ├── /release-control  (Release Superposition Matrix & Policy Gates)
     └── /agent-activity   (Duo Flow Traces & Audit Logs)
               │
               ▼ (HTTP/REST via FastAPI)
     FastAPI Backend  (Port 8000)
     ├── /healthz & /readyz  (Kubernetes / Container Probes)
     ├── /api/v1/releases    (Release Registry & Target Commits)
     ├── /api/v1/experiments (Empirical Consequence Execution Engine)
     ├── /api/v1/causal-graph(Empirical Dependency & Risk Graph)
     ├── /api/v1/remediations(Sandboxed Patch Synthesis & Approval)
     └── /api/v1/superposition(5-Scenario Release Matrix)
          │           │
          │           ▼
          │     Remediation Sandbox Worktree
          │     ├── Shell injection defenses & symlink verification
          │     ├── Clean environment isolation (zero secret leakage)
          │     └── Isolated pytest execution (15s timeout)
          ▼
     Durable Database & Payment Ledger
     ├── Primary: SQLite 3.45 with WAL Mode (Zero-dependency local dev)
     ├── Orchestrated: PostgreSQL 16 Alpine via Docker Compose
     └── Services: services/payment_worker (Durable multi-process processor)
```

### Component Entry Points

| Component | Entry File | Runtime / Framework | Primary Port | Health Probe |
|---|---|---|---|---|
| **Frontend Web** | `src/app/page.tsx` | Next.js 15.5.28 / React 19 / Tailwind | 3000 | `http://localhost:3000/` |
| **Backend API** | `backend/app/main.py` | FastAPI 0.110+ / Python 3.11.9 | 8000 | `http://localhost:8000/healthz` |
| **Readiness Probe** | `backend/app/api/health.py` | FastAPI / SQLAlchemy connection check | 8000 | `http://localhost:8000/readyz` |
| **Database Engine** | `backend/app/database.py` | SQLAlchemy 2.0 Async / aiosqlite / asyncpg | N/A (5432) | Checked via `/readyz` |
| **Payment Worker** | `services/payment_worker/durable_processor.py` | Async Python / SQLite / Postgres | N/A | Invariant unit tests |
| **Duo Flow Specs** | `.gitlab/duo/*.yaml` | GitLab Flow Registry v1 YAML specs | CI/CD | Pipeline validation |

---

## 2. Configuration & Environment Taxonomy

Configuration is defined via Pydantic Settings (`backend/app/config.py`) loading from `.env` with fallback defaults.

| Environment Variable | Default Value | Purpose | Production Consideration |
|---|---|---|---|
| `ENVIRONMENT` | `development` | Runtime mode (`development`, `production`) | Sets log formatting and debug headers |
| `LOG_LEVEL` | `info` | Logging verbosity (`debug`, `info`, `warning`) | Use `info` in production |
| `BACKEND_HOST` | `0.0.0.0` | Binding host address | Bind to `0.0.0.0` in container |
| `BACKEND_PORT` | `8000` | HTTP listen port | Matches container mapped port |
| `API_PREFIX` | `/api/v1` | Root API route namespace | Standard versioned prefix |
| `DATABASE_URL` | `sqlite+aiosqlite:///.../aftermath.db` | Primary DB connection string | Set to `postgresql+asyncpg://...` in Compose |
| `CORS_ORIGINS` | `["http://localhost:3000", ...]` | Permitted CORS origins | Restricted to frontend domain |
| `GITLAB_INSTANCE_URL` | `https://gitlab.com` | GitLab base URL | Self-managed or SaaS URL |
| `GITLAB_PROJECT_PATH` | `atumanyire-labs/aftermath` | Project namespace/path | Set to active GitLab repository |
| `GITLAB_ACCESS_TOKEN` | `""` (Empty string) | Personal access token with API scope | **Zero committed secrets** |
| `GITLAB_DUO_ENABLED` | `false` | Cloud Duo SaaS feature flag | True only when token & SMS verified |

---

## 3. Database Migration Baseline

The database schema is managed via Alembic (`backend/alembic/versions/`). All migrations support asynchronous execution and SQLite WAL / PostgreSQL dialects:

1. **`001_initial_schema.py`**:
   - `releases`: Release variants, source commits, pipeline IDs, timestamps.
   - `consequence_experiments`: Test runs, fault injection parameters, durations.
   - `metrics_snapshots`: P95 latency, error rates, financial exposure, throughput.
   - `experiment_events`: Chronological execution events for vulnerable vs repaired timelines.
   - `evidence`: Empirical proofs, log excerpts, GitLab job artifact links.
   - `agent_sessions`: GitLab Duo agent interaction traces, goals, and summaries.
   - `audit_events`: Tamper-evident trail of human approvals and gate evaluations.

2. **`002_executable_experiments.py`**:
   - Extends `consequence_experiments` with live execution fields (`scenario_id`, `live_execution`, `status`).
   - `durable_idempotency_keys`: Multi-process database-backed lock reservations for payment deduplication.

3. **`003_causal_graph_and_blast_radius.py`**:
   - `causal_graphs`: Root releases, summary statistics, node/edge counts.
   - `causal_nodes`: AST-level defects, concurrency primitives, runtime failures, business impacts.
   - `causal_edges`: Directed causal dependencies with empirical evidence links.
   - `blast_radius_reports`: Quantified financial exposure, affected downstream services, cascading failure chains.

4. **`004_remediation_workflows.py`**:
   - `remediation_workflows`: Target file paths, generated unified diffs, SHA-256 fingerprints, sandbox execution outputs, human approval decisions.

---

## 4. Feature Taxonomy & Ground Truth Classification

To prevent ambiguity and maintain absolute transparency for hackathon evaluation, all platform features are classified into five explicit ground truth categories:

### A. Live Executable Functionality (100% Real Runtime Execution)
- **Consequence Laboratory Execution:** User triggers any of the 5 fault scenarios (`lost-response-retry`, `concurrent-checkouts`, `repeated-idempotency-key`, `delayed-db-commit`, `gateway-502-chaos`). The backend executes concurrent asynchronous worker tasks, applies genuine network delay injections, persists real records to `durable_idempotency_keys`, detects double charges, and renders side-by-side comparison timelines.
- **Causal Graph & Blast Radius Synthesis:** Graph nodes and edges represent real code-to-runtime dependencies. Blast radius dollar amounts ($1,500.00) reflect real duplicate charges logged in the transaction ledger.
- **Autonomous Remediation Sandbox:** When "Execute Sandbox Verification" is triggered, the engine spawns an isolated temporary directory, copies real target test files, runs `pytest` against unpatched code (verifying the `AssertionError` invariant failure), writes the proposed patch, re-runs `pytest`, and captures real stdout, stderr, process exit codes, and run durations.
- **Human Gatekeeper Sign-off:** Approving a patch cryptographically records a real `AuditEvent` row in the database, transitions release status, and updates the Superposition Matrix.
- **Release Superposition Matrix:** The 5-scenario matrix dynamically computes risk scores, mitigation deltas, and policy gates from real database experiment histories.

### B. Seeded Demonstration Fixtures (Deterministic Benchmark Data)
- **Historical Experiments:** Initial baseline experiments (`exp-vuln-001`, `exp-rep-001`) are automatically seeded on startup if the database is fresh to ensure the demo is immediately interactive before a user manually triggers new experiments.
- **Demo Agent Sessions:** Baseline agent sessions (`sess-001`, `sess-002`) provide benchmark trace references and are explicitly tagged `[Demo Benchmark Fixture - Unauthenticated]`.

### C. Deterministic Repair Workflows
- **Patch Synthesis:** The remediation diff for `services/payment_worker/processor.py` is synthesized using AST inspection and reference atomic deduplication logic (`asyncio.Lock` reservation barrier + `_in_flight` event deduplication).

### D. AI Agent Execution Framework
- **Flow Registry v1 Specs:** Declarative YAML agent specifications in `.gitlab/duo/` (`consequence-auditor.yaml`, `remediation-engineer.yaml`, `agent-config.yml`) define exact prompts, tools, container runtimes, and input/output contracts.
- **Local Runner Ready:** Local execution engine can interpret and execute these tool flows directly against the codebase.

### E. Blocked Integrations (Pending External Prerequisites)
- **GitLab Duo Cloud SaaS Invocation:** Held pending completion of GitLab SMS phone verification by the repository owner. Explicitly labeled in the UI and documentation as `BLOCKED (External Auth Required)`. Zero fake SaaS session IDs or mock tokens are permitted.
