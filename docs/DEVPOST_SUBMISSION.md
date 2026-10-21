# AFTERMATH — Devpost Project Submission Copy

**Tagline:** Every release has consequences. See them before production.  
**Hackathon:** GitLab Life After Code Hackathon (October 2026)  
**Track:** GitLab Duo Agent Platform & DevSecOps Innovation  
**Repository (GitLab):** [https://gitlab.com/atumanyire-labs/aftermath](https://gitlab.com/atumanyire-labs/aftermath)  
**Repository (GitHub Mirror):** [https://github.com/ATUMANYIRE/AFTERMATH](https://github.com/ATUMANYIRE/AFTERMATH)  

---

## Inspiration

Continuous Delivery pipelines deploy code based on static unit tests and passing smoke tests. But when changes reach production, unpredictable cascades happen: missing database synchronization triggers double-billing under network retries, connection pools starve, and cascade failures breach customer SLAs.

We asked ourselves: **What if engineers could see the empirical runtime consequences of their code changes before deployment?**

Not with generative hallucinations, but with **real discrete-time simulation, controlled fault injection, directed causal inference, and automated remediation**. We built **AFTERMATH: The Release Time Machine**.

---

## What It Does

AFTERMATH is an evidence-driven DevSecOps intelligence platform:

1. **Release Time Machine (Signature View):** Spins up empirical runs of both the proposed candidate release and a remediated release under production-like concurrency profiles. Displays a synchronized side-by-side timeline of event logs, latency deltas, and customer ledger impacts.
2. **Causal Graph & Blast Radius Engine:** Connects git commits to observed runtime failures using a typed, persistent directed causal graph. Proves the causal failure chain from code diff to double-billing and calculates synthetic financial exposure ($1,500.00).
3. **Remediation Studio & Fix Verification:** Discovers concurrency race windows, synthesizes standard GNU unified diffs introducing atomic idempotency barriers, and executes real pytest tests in an isolated sandbox worktree (proving Exit 1 failure unpatched $\to$ Exit 0 pass patched).
4. **Dual-Key Human Gatekeeper:** Prohibits autonomous auto-merging; enforces human cryptographic review with name, email, and business justification before staging promotion.
5. **Release Superposition Matrix:** Represents release candidates as multiple evidence-backed outcomes across 5 production fault modes (lost responses, concurrent checkouts, repeated keys, delayed DB commits, transient gateway 502s).
6. **GitLab Duo Flow Registry v1 Integration:** Includes fully authored agent specifications for Consequence Auditor and Remediation Engineer flows, along with runner environment configurations (`.gitlab/duo/agent-config.yml`).

---

## How We Built It

- **Backend Architecture:** Python 3.11, FastAPI (asynchronous REST APIs), SQLAlchemy 2.0, Alembic migrations (`001` through `004`), and dual SQLite (WAL mode) / PostgreSQL support.
- **Frontend Design System:** Next.js 15 App Router, TypeScript (strict mode), Tailwind CSS, TanStack React Query, and Lucide icons. Meticulously designed in an **original warm-white and subtle ivory editorial aesthetic** (`#FAF8F5`, `#FDFBF7`) with crisp charcoal typography and restrained cobalt accents (`#1D4ED8`). Zero dark cybersecurity gimmicks, zero neon glow.
- **Target Workload:** Real checkout settlement worker (`services/payment_worker/processor.py` and `durable_processor.py`) demonstrating true multi-process concurrency safety.
- **Testing & Verification:** 35 backend pytest tests (including multi-process `multiprocessing.Process` concurrency tests and adversarial security hardening) and 4 comprehensive Playwright browser E2E tests.

---

## DevSecOps 9-Stage Coverage

| Stage | Implementation Status | How AFTERMATH Implements It |
|---|---|---|
| **1. Plan** | **Implemented** | GitLab Duo Consequence Auditor specifications, MR issue goals, and scenario configurations. |
| **2. Create** | **Implemented** | Git commit tracking, diff analysis, unified patch synthesis, and branch staging. |
| **3. Verify** | **Implemented** | Dual-phase sandboxed pytest execution, multi-process concurrency tests, and Next.js strict typecheck & build. |
| **4. Package** | **Implemented** | Docker Compose orchestration, GitLab CI artifact archiving, and ephemeral worktree packaging. |
| **5. Secure** | **Implemented** | Secret detection, path allowlisting, shell metacharacter rejection, symlink protection, and dependency checking. |
| **6. Deploy** | **Partially Demonstrated** | Staging promotion certification; production deployment is deliberately gated behind human sign-off. |
| **7. Operate** | **Partially Demonstrated** | Release supervision engine tracking synthetic checkout workers and pool saturation. |
| **8. Monitor** | **Implemented** | Real-time consequence timelines, p95 latency scrubber, and customer ledger anomaly auditing. |
| **9. Govern** | **Implemented** | Dual-Key Human Gatekeeper, automated policy verification gates, and immutable compliance audit logs (`audit_events`). |

---

## Challenges We Overcame

1. **Transactional Idempotency vs In-Process Locks:** Ensuring that idempotency guarantees survive multiple OS processes, worker restarts, and transaction rollbacks without claiming unproven "exactly-once" external side-effects. We established explicit **at-most-one durable settlement records** using compound unique constraints and WAL locking.
2. **Worktree Sandbox Hardening:** Moving beyond basic temporary directories to enforce shell injection defense, symlink verification, sanitized environment variables, and strict 15s execution timeouts.
3. **Engineering Honesty & Authentication Transparency:** When GitLab SMS verification emerged as an external blocker, we strictly refused to fake SaaS Duo responses or fabricate imaginary AI chats. We clearly documented the blocker, authored the official Flow Registry v1 contracts, and preserved genuine local deterministic execution.

---

## What's Next for AFTERMATH

- Distributed Redis Redlock clustering for multi-region microservice deployments.
- Ephemeral Kubernetes Sandbox Operator for running worktree tests in dedicated scratch pods.
- Live webhook synchronization with GitLab Duo Agent Platform once SMS verification is completed.
