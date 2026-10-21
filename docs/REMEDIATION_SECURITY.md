# AFTERMATH — Autonomous Remediation Security & Sandbox Architecture

## 1. Threat Model & Security Objectives

Autonomous source code remediation systems represent a high-consequence failure domain. Giving an automated agent or pipeline the authority to generate and execute code patches creates substantial attack surfaces:
- **Arbitrary File Overwrite:** A compromised or misdirected patch could modify system files, `.env` secrets, CI/CD pipelines, or database credentials.
- **Directory Traversal:** Malicious relative paths (e.g., `../../etc/passwd` or `..\backend\app\main.py`) could escape the target repository workspace.
- **Arbitrary Code Execution in Production:** Unverified patches could be merged without evidence of safety or human oversight.
- **Phantom Verification:** Tools claiming test passes without genuinely executing test suites in an isolated environment.

AFTERMATH enforces a **Defense-in-Depth Zero-Trust Sandbox** architecture for all remediation workflows.

---

## 2. Security Boundaries & Allowlisting

### Path Validation Policy
Any target file specified in a remediation request must pass the strict validation gate in `backend/app/services/remediation_engine.py`:

```python
ALLOWED_TARGET_PREFIXES = (
    "services/payment_worker/",
)
```

1. **Path Normalization:** Forward slashes and backslashes are normalized; leading root slashes and drive letters are stripped.
2. **Directory Traversal Rejection:** Any presence of `..` or forbidden path tokens immediately raises an `HTTP 400 Bad Request`.
3. **Allowlist Prefix Check:** The path must begin with an approved prefix from `ALLOWED_TARGET_PREFIXES`. Requests to modify `.env`, `.git`, `backend/`, `src/`, or Docker configurations raise an `HTTP 403 Forbidden`.
4. **Project Root Anchoring:** The path is resolved against the absolute project root. If `resolved.startswith(project_root)` is false, execution is immediately terminated.
5. **Existence Check:** Target file must exist on disk before any diff synthesis or test execution occurs.

Unit tests in `backend/tests/test_remediation.py::test_sandbox_security_rejections` continuously verify that directory traversals and unauthorized paths are rejected.

---

## 3. Ephemeral Worktree Isolation

Sandboxed test validation executes in an isolated environment:
1. **Ephemeral Directory:** A dedicated temporary directory (`tempfile.TemporaryDirectory(prefix="aftermath_worktree_")`) is instantiated for every verification run.
2. **Service Package Clone:** Only the target service directory (`services/`) is copied into the worktree sandbox. Host system files, backend databases, and environment secrets are never mounted or copied.
3. **Controlled Subprocess Execution:**
   - Test commands are invoked with explicit working directories (`cwd=sandbox_path`).
   - Minimal environment variables: `PYTHONPATH=.` with standard PATH.
   - Fixed timeout limits (30 seconds) to prevent infinite loops or denial-of-service hangs.
4. **Deterministic Clean Teardown:** When the context manager exits, the entire ephemeral sandbox directory is wiped from disk, ensuring no lingering side effects.

---

## 4. Dual-Phase Invariant Verification Proof

To prevent "phantom passes" (where a test might pass trivially due to a broken assertion), the sandbox executes a mandatory two-phase verification:

| Phase | Target Code | Expected Exit Code | Expected Invariant Status |
|---|---|---|---|
| **Phase 1: Pre-Patch Baseline** | Unpatched `processor.py` | `Exit Code 1` | `INV-PAY-001 VIOLATED` (5 debits detected) |
| **Phase 2: Post-Patch Remediation** | Remediated `processor.py` | `Exit Code 0` | `INV-PAY-001 SATISFIED` (1 debit, 4 deduplicated) |

The workflow transitions to `AWAITING_APPROVAL` **if and only if** Phase 1 fails on the specific invariant and Phase 2 passes all assertions cleanly. If either condition fails, the workflow status is automatically marked as `FAILED`.

---

## 5. Supervised Human Gatekeeper (Dual-Key Approval)

AFTERMATH strictly prohibits autonomous auto-merging:
- Proposed patches can **never** self-merge into release branches.
- The state machine blocks progression at `AWAITING_APPROVAL`.
- Approvals require explicit human input:
  - Approver Full Name
  - Corporate/GitLab Email Address
  - Release Remarks / Business Justification
- Rejections require detailed technical rationale:
  - Reviewer Full Name
  - Reviewer Email
  - Rejection Reason (e.g. architectural incompatibility or Redis cluster requirement)
- Every approval and rejection generates an immutable, tamper-evident entry in the `audit_events` table for compliance auditing.

---

## 6. GitLab Duo & Remote Authentication Transparency

In strict conformance with the hackathon honesty standards:
- **Remote Integration Status:** Documented as `BLOCKED (External Auth Required)`.
- **Reason:** GitLab identity verification and push credentials remain unauthenticated.
- **Provider Metadata:** Labeled honestly as `reference_remediation_engine` (Emulated GitLab Duo Reference Engine).
- **Branch Staging:** Remediated patches are staged on deterministic branches (e.g. `remediation/rem-wf-001-atomic-idempotency`) ready for immediate push once GitLab credentials are authenticated.
