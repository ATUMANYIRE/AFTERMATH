# AFTERMATH — GitLab Duo Agent Platform Integration & Evidence Report

**Status:** `BLOCKED (External SMS Identity Verification Pending)`  
**Project:** `https://gitlab.com/atumanyire-labs/aftermath`  
**Date:** October 21, 2026  
**Evaluation Standard:** Zero Fabricated Telemetry / Strict Authenticity  

---

## 1. Current Authentication Status & Blocker

In strict accordance with the hackathon rules and engineering integrity guidelines:
- **No live GitLab Duo SaaS session has been executed on GitLab.com.**
- **Exact Blocker:** GitLab requires SMS phone identity verification on the account before granting access to GitLab Duo Agent Platform / Ultimate features. The account owner currently does not have physical access to the registered phone to receive the SMS verification code.
- **Strict Policy:** AFTERMATH **does not** fabricate artificial Duo session identifiers, mock SaaS agent replies, or pretend that a remote SaaS agent executed. All agent flows shown in the UI are transparently labeled as `(Demo Benchmark Fixture - Unauthenticated)` or `(Emulated Reference Engine)`.

---

## 2. Prepared & Compliant GitLab Duo Specifications

AFTERMATH includes fully authored, validated configurations adhering to the **official GitLab Duo Agent Platform & Flow Registry v1** specifications:

### A. Execution Environment Configuration: `.gitlab/duo/agent-config.yml`
Specifies how custom flows and developer agents execute inside project CI/CD runners:
- **Runtime Image:** `python:3.11-slim`
- **Setup Script:** Installs dependencies from `backend/requirements.txt`
- **Network Policy:** Whitelists `gitlab.com`, `registry.npmjs.org`, `pypi.org`, and blocks arbitrary outbound sockets.
- **Caching:** Caches `.venv/` and `~/.cache/pip` between runs.

### B. Consequence Auditor Flow: `.gitlab/duo/consequence-auditor.yaml`
- **Specification:** Flow Registry v1 (`version: "1.0"`)
- **Triggers:** `merge_request.opened`, `merge_request.synchronize`, `mention`, `assign`
- **Components:** `AgentComponent` (analyzing MR diff against main) and `ToolComponent` (calling `/api/v1/experiments/run-pair`).
- **Safety Invariant:** `INV-PAY-001: Exactly-One-Charge-Per-Purchase`.

### C. Remediation Engineer Flow: `.gitlab/duo/remediation-engineer.yaml`
- **Specification:** Flow Registry v1 (`version: "1.0"`)
- **Triggers:** `custom.aftermath_consequence_audit.invariant_failed`, `mention`, `assign`
- **Components:** `AgentComponent` (synthesizing atomic lock / compound unique constraint patch) and `ToolComponent` (calling `/api/v1/remediations/workflows/{id}/validate`).

---

## 3. How to Activate Live GitLab Duo Once Phone Verification is Complete

Once SMS verification is resolved on [GitLab Duo Project Settings](https://gitlab.com/atumanyire-labs/aftermath/edit):

1. **Generate GitLab Personal Access Token (PAT):**
   - Scopes required: `api`, `read_api`, `read_repository`.
2. **Update Environment (`.env`):**
   ```bash
   GITLAB_INSTANCE_URL=https://gitlab.com
   GITLAB_PROJECT_PATH=atumanyire-labs/aftermath
   GITLAB_ACCESS_TOKEN=glpat-your-token-here
   GITLAB_DUO_ENABLED=true
   ```
3. **Restart Backend:**
   The backend service automatically authenticates against GitLab REST API, polls MR webhooks, and connects the Duo Agent Platform flows directly to AFTERMATH experiments.
