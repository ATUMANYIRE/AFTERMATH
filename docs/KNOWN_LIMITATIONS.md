# AFTERMATH — Known Technical Limitations & Scope Boundaries

In accordance with rigorous engineering standards, this document transparently enumerates the architectural boundaries, environmental assumptions, and known limitations of the AFTERMATH platform as of Milestone 5.

---

## 1. External GitLab Duo Agent Platform SaaS Integration
* **Status:** `BLOCKED` on external SMS phone identity verification.
* **Impact:** The local system cannot currently invoke live GitLab Duo SaaS cloud agents on GitLab.com.
* **Mitigation:**
  - Official GitLab Duo Agent Platform specifications have been completely authored in `.gitlab/duo/consequence-auditor.yaml`, `.gitlab/duo/remediation-engineer.yaml`, and `.gitlab/duo/agent-config.yml` (Flow Registry v1 standard).
  - All local remediation and consequence auditing operates via AFTERMATH's deterministic Python reference engine with 100% genuine test execution.
  - Transparently disclosed across all documentation and UI badges (`Demo Benchmark Fixture - Unauthenticated`).

---

## 2. Settlement Guarantee: At-Most-Once vs Exactly-Once
* **Scope:** Database settlement ledger.
* **Guarantee:** **At-most-one durable settlement record per logical purchase.**
* **Boundary:** In distributed payment systems, "exactly-once" external execution across network boundaries is impossible without a two-phase commit with the external payment gateway. AFTERMATH guarantees that internally, the ledger is debited at-most-once and duplicate client attempts are safely deduplicated. External gateway idempotency keys must be provided to ensure upstream third-party APIs (e.g., Stripe, Adyen) do not double-bill.

---

## 3. Worktree Sandbox Security on Developer Workstations
* **Platform:** Windows developer workstation execution.
* **Isolation Mechanics:** Ephemeral temporary directories, Python target allowlists (`services/payment_worker/*`), shell metacharacter stripping, symlink verification, clean minimal environment variables (`clean_env`), and a strict 15-second execution timeout.
* **Limitation:** Windows does not provide native Linux kernel cgroups or network namespaces without Docker/WSL2. In production, untrusted code execution should be delegated to an ephemeral Kubernetes Pod with `securityContext.readOnlyRootFilesystem=true` and `networkPolicy` disabling egress.

---

## 4. Multi-Node Database Concurrency
* **Current Implementation:** SQLite in WAL (Write-Ahead Logging) mode with `PRAGMA busy_timeout=15000`.
* **Scope:** Verified across multiple Python processes on a single host (`multiprocessing.Process`).
* **Production Path:** For multi-host containerized deployments across Kubernetes nodes, `DATABASE_URL` should point to the included PostgreSQL 16 service (`postgresql+asyncpg://...`), utilizing PostgreSQL's native table-level compound unique constraints and row-level locks.
