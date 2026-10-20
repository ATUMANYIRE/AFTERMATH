# Milestone 3 Acceptance Report — Causal Graph & Blast-Radius Analysis

**Project**: AFTERMATH — The Release Time Machine  
**Hackathon**: GitLab Life After Code Hackathon (October 2026)  
**Milestone**: Milestone 3 of 5 — Causal Graph & Blast-Radius Analysis  
**Status**: **COMPLETE & EMPIRICALLY VERIFIED**  
**Repository (GitHub Mirror)**: `https://github.com/ATUMANYIRE/AFTERMATH.git`  
**GitLab Remote**: `https://gitlab.com/atumanyire-labs/aftermath.git` (Status: `BLOCKED` awaiting remote project visibility/authorization)  

---

## 1. Executive Summary

Milestone 3 elevates AFTERMATH from a counterfactual consequence experiment runner into an **evidence-driven causal investigation and blast-radius analysis platform**.

The system establishes a persistent, typed directed graph connecting Git code changes (`a8f9c21b`) to observed runtime failures, identifies transitive downstream blast radius, and rigorously separates experimentally proven causation from unverified architectural hypotheses using formal epistemic classifications.

---

## 2. Implemented Architecture & Functionality

### 2.1 Typed Persistent Causal Graph Engine (`backend/app/services/causal_engine.py`)
- **Domain Models**:
  - `CausalNode`: Typed graph entities (`code_change`, `failure_condition`, `service`, `invariant`, `runtime_event`, `observed_consequence`, `hypothesized_downstream_effect`, `remediation_candidate`, `verification_evidence`).
  - `CausalEdge`: Directed relations (`triggers`, `violates`, `mitigates`, `propagates_to`, `evidenced_by`, `hypothesizes`, `affects`).
  - `BlastRadiusReport`: Persisted deterministic impact records.
- **Alembic Migration**: `003_causal_graph_and_blast_radius` applied cleanly.
- **Epistemic Classifications**:
  - `EXPERIMENTALLY_SUPPORTED`: Proven by controlled counterfactual A/B execution under identical PRNG seeds.
  - `OBSERVED`: Directly verified in recorded runtime telemetry or transaction database.
  - `INFERRED`: Derived from static call architecture or suspected downstream propagation.
  - `UNKNOWN`: Plausible hypothesis without direct traces or test runs.
- **Cycle-Safe Bounded Traversal**: Breadth-First Search (BFS) with visited sets and depth limits (`max_depth=10`), preventing infinite loops and isolating directed causal explanations.

### 2.2 Deterministic Blast-Radius Model
- **Explicit Mathematical Formulas & Assumptions**:
  - Directly Affected Services: $\text{Neighbors}(\text{FlawedComponent}, \text{rel} \in \{\text{triggers}, \text{affects}\}) = \{\text{Checkout Service}, \text{Synthetic Payment Gateway}\}$.
  - Downstream Cascades: Transitive reachable components = $\{\text{PostgreSQL Ledger DB}, \text{Customer Dispute Rail}\}$.
  - Synthetic Financial Exposure: $\sum_{t \in \text{duplicate\_txns}} \text{amount\_cents}(t) / 100 = \$1,500.00$.
  - Invariant Breached: `INV-PAY-001: Exactly-One-Charge-Per-Purchase`.

### 2.3 Signature Interactive Frontend (`src/app/investigation/page.tsx`)
- **React Flow Graph Canvas (`src/components/CausalFlowGraph.tsx`)**:
  - Zoomable, pannable directed canvas powered by `@xyflow/react`.
  - Color-coded and styled edges matching epistemic classification (solid blue for experimentally supported, solid dark for observed, dashed amber for inferred, bold crimson for active causal path).
  - Floating epistemic edge classification legend, MiniMap, and zoom controls.
- **Signature Interaction ("Trace Duplicate Debit Causal Path")**:
  - Automatically isolates and highlights the 4-step path from Code Change $\to$ Missing Idempotency Barrier $\to$ Payment Gateway $\to$ Duplicate Debit Consequence.
  - Populates a step-by-step breadcrumb stepper with technical causal explanations.
- **Evidence & Provenance Inspector**:
  - Side panel displaying node type, severity, description, epistemic provenance (`git_commit`, `runtime_trace`, `empirical_ledger`), provenance ID, and technical attributes.
  - Deep link: "Inspect Consequence in Time Machine" linking directly to `/time-machine`.
- **Counterfactual Variant Switcher**:
  - Toggle between **Vulnerable Release Baseline** ($1,500.00 exposure, violated invariant) and **Repaired Release (Duo Verified)** ($0.00 exposure, preserved invariant, neutralized failure condition).
- **Mobile Responsive Linear Fallback**:
  - Clean vertical linear sequence with step numbers and severity badges for mobile viewports.

### 2.4 GitLab Duo Agent Platform Preparation
- Created `.gitlab/duo/consequence-auditor.yaml`: Official agent specification for automated merge-request consequence audit and sandbox simulation.
- Created `.gitlab/duo/remediation-engineer.yaml`: Milestone 4 preparation contract for automated patch synthesis and verification.
- Created `docs/GITLAB_DUO_INTEGRATION.md`: Full integration architecture and unblock checklist.

---

## 3. Verification & Quality Assurance Matrix

| Suite | Scope | Target | Result | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Backend Pytest** | Unit, Causal Engine, Invariant, API | 24 tests | 24 passed in ~1.5s | **PASS** |
| **Frontend Typecheck** | Strict TypeScript (`tsc --noEmit`) | App Router | 0 errors | **PASS** |
| **Production Build** | Next.js 15 (`next build`) | 8 static/dynamic routes | Compiled cleanly | **PASS** |
| **Playwright E2E** | Investigation Workspace E2E | Microsoft Edge | 2 tests passed (5.3s) | **PASS** |
| **Playwright E2E** | Time Machine E2E | Microsoft Edge | Passed | **PASS** |
| **GitLab Remote Push** | Git remote `atumanyire-labs/aftermath` | GitLab.com | Repository not found / auth | **BLOCKED** |

---

## 4. Measured Graph & Blast Radius Outputs

| Dimension | Vulnerable Baseline (`rel-2026-001`) | Repaired Release (Duo Verified) | Delta / Consequence Prevented |
| :--- | :--- | :--- | :--- |
| **Total Topology Nodes** | 11 | 11 | Complete architecture mapped |
| **Total Directed Edges** | 8 | 8 | Full dependency trace |
| **Experimentally Supported Edges** | 3 | 3 | Rigorous epistemic grounding |
| **Financial Exposure (USD)** | **$1,500.00** | **$0.00** | **$1,500.00 eliminated** |
| **Directly Affected Services** | 2 (Checkout, Payment) | 0 | Neutralized at idempotency barrier |
| **Downstream Saturated Pools** | PostgreSQL (100% pool load) | PostgreSQL (28% nominal) | Cascade failure prevented |
| **Safety Invariant (INV-PAY-001)** | **VIOLATED (Critical)** | **PRESERVED (100%)** | Mathematical guarantee satisfied |

---

## 5. Visual Verification Artifacts

Committed in `screenshots/`:
1. `screenshots/investigation_desktop.png`: Full desktop workspace with React Flow canvas, Blast Radius cards, and Epistemic Legend.
2. `screenshots/investigation_path_desktop.png`: Signature interaction view showing the 4-step active causal path illuminated in crimson and the Evidence & Provenance Inspector panel populated for `cnode-cons-double-debit`.
3. `screenshots/investigation_mobile.png`: High-density mobile responsive layout featuring sequential linear causal fallback.

---

## 6. Remote Blocker & GitLab Action Required

- **GitHub Origin**: Synchronized at latest commit on `main`.
- **GitLab Remote**: `https://gitlab.com/atumanyire-labs/aftermath.git`.
- **Blocker Status**: `BLOCKED` (remote returned repository not found or unauthorized).
- **User Action Needed**:
  1. Ensure the project `aftermath` exists under group/user `atumanyire-labs` on GitLab.com.
  2. Set project visibility to **Public** for hackathon evaluation.
  3. Configure a personal access token (`write_repository`) and execute:
     ```bash
     git push gitlab main
     ```

---

## 7. Readiness for Milestone 4 (Automated Remediation & Verification)

- **Prepared Contracts**: `.gitlab/duo/remediation-engineer.yaml` specifies the required contract inputs (`violated_invariant`, `causal_path`, `failed_experiment_id`) and output expectations (`remediation_branch`, `patch_diff`, `counterfactual_verification_proof`).
- **Engine Readiness**: Causal graph engine supports querying remediation candidates and evaluating counterfactual delta summaries immediately.
