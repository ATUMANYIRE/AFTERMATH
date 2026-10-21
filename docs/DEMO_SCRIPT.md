# AFTERMATH — Video Demonstration Script & Recording Guide

**Target Video Duration:** 2 minutes 50 seconds (Strictly under 3 minutes)  
**Tone:** Confident, technical, authoritative, restrained  
**Hackathon:** GitLab Life After Code Hackathon (October 2026)  

---

## Shot-by-Shot Production Guide

### [0:00 – 0:25] ACT I: THE HOOK & THE DILEMMA
* **Visual:** Open on `http://localhost:3000/` (Operational Overview). Slow pan over the ivory-charcoal cards showing "Release Consequence Control", release `rel-2026-001`, and the headline metric "$1,500.00 Financial Risk Mitigated".
* **Voiceover:**
  > "Every modern engineering team runs unit tests and static linters before merging code. All green. But when asynchronous checkout pipelines meet transient network retries in production, catastrophic cascades happen: idempotency keys race, customers get charged twice, and connection pools starve.
  >
  > Welcome to **AFTERMATH: The Release Time Machine**. Our tagline is simple: *Every release has consequences. See them before production.*"

---

### [0:25 – 1:00] ACT II: THE RELEASE TIME MACHINE (SIGNATURE VIEW)
* **Visual:** Transition to `/time-machine`. Click "Execute Experiment Pair". Watch the split-screen timeline populate in real time with synchronized clocks.
* **Voiceover:**
  > "Here is our signature view: the Release Time Machine. Rather than hoping code works, AFTERMATH spins up empirical discrete-time simulations of candidate releases against isolated service sandboxes.
  >
  > On the left, we observe the unpatched release: under a 12% client retry storm, missing database synchronization breaches safety invariant INV-PAY-001. 27 duplicate charges occur, resulting in critical failure.
  >
  > On the right, we see the repaired release running the exact same seed: atomic idempotency barriers intercept retries, latency drops by 195 milliseconds, and double charges drop to zero."

---

### [1:00 – 1:35] ACT III: CAUSAL GRAPH & BLAST RADIUS
* **Visual:** Navigate to `/investigation`. Click the button: "Trace Duplicate Debit Causal Path". Show the node highlights connecting git commit `a8f9c21b` through `checkout-service` to `ledger-db` and the breached invariant.
* **Voiceover:**
  > "Correlation is not causation. In the Investigation Workspace, AFTERMATH models a persistent directed causal graph. By comparing counterfactual execution traces, our engine proves the causal chain from git commit `a8f9c21b` directly to the ledger breach, distinguishing verified causation from speculative hypothesis.
  >
  > It computes the blast radius: three affected services and exactly $1,500.00 in synthetic double-debit exposure."

---

### [1:35 – 2:15] ACT IV: REMEDIATION STUDIO & ZERO-TRUST SANDBOX
* **Visual:** Click over to `/remediation`. Show the 6-step state machine stepper. Click on "Proposed Patch Diff (.diff)" showing `asyncio.Lock` and unique constraints. Then click "Run Sandbox Verification". Show the real-time terminal comparing Pre-Patch (Exit 1) and Post-Patch (Exit 0). Then open the "Approve Patch Sign-off" modal and submit approval.
* **Voiceover:**
  > "In the Remediation Studio, AFTERMATH doesn't pretend to fix code with fake chat messages. It analyzes the concurrency race window, generates a standard GNU unified diff, and spawns an ephemeral sandbox worktree.
  >
  > It actually executes pytest against the unpatched code—confirming failure—and then applies the patch and re-executes pytest—confirming zero duplicate debits.
  >
  > But autonomous code patches cannot self-merge. Our Dual-Key Human Gatekeeper requires explicit cryptographic sign-off with approver identity and release justification before staging promotion."

---

### [2:15 – 2:50] ACT V: RELEASE SUPERPOSITION & GITLAB GOVERNANCE
* **Visual:** Transition to `/release-control`. Display the Release Superposition Matrix with all 5 fault modes, the confidence score (98.4%), and the conditional approval recommendation. Briefly show the `.gitlab/duo/` configuration files in the editor.
* **Voiceover:**
  > "Finally, we introduce **Release Superposition**: a candidate release isn't a static binary—it is an ensemble of possible outcomes across network drops, retry storms, and pool latency. Our matrix presents empirical proof across all five fault modes.
  >
  > While remote GitLab Duo SaaS remains transparently blocked pending SMS identity verification, all agent contracts, Flow Registry v1 specifications, and CI/CD pipelines are fully validated.
  >
  > Every release has consequences. With AFTERMATH, you see them before production."

---

## Recording Tips for the Presenter
1. **Screen Resolution:** Record at 1920x1080 (16:9 aspect ratio) with 60 FPS.
2. **Cursor Smoothness:** Use slow, deliberate mouse movements. Avoid erratic clicking.
3. **Audio:** Use a clean external microphone. Speak calmly without rushing.
4. **Theme Consistency:** Keep the warm-white editorial theme active.
