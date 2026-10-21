"""
Deterministic Seed Fixtures for AFTERMATH Milestone 1.
Populates reproducible release scenarios, consequence timelines, empirical evidence,
agent sessions, approvals, and synthetic transactions.
"""
from datetime import datetime, timedelta
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.release import Release
from app.models.experiment import Experiment
from app.models.experiment_event import ExperimentEvent
from app.models.evidence import Evidence
from app.models.agent_session import AgentSession
from app.models.approval import Approval
from app.models.audit_event import AuditEvent
from app.models.synthetic_transaction import SyntheticTransaction


async def seed_initial_data(db: AsyncSession) -> bool:
    """
    Checks if seed data already exists; if not, inserts deterministic benchmark data.
    Returns True if data was seeded, False if already populated.
    """
    existing_release = (await db.execute(select(Release).where(Release.id == "rel-2026-001"))).scalars().first()
    if existing_release is not None:
        return False

    base_time = datetime(2026, 10, 20, 14, 0, 0)

    # 1. Primary Demonstration Release: rel-2026-001
    release = Release(
        id="rel-2026-001",
        version_tag="v2.4.0-rc.3",
        commit_hash="a8f9c21b4d08",
        branch="feat/distributed-checkout-pipeline",
        author="darlen@aftermath.dev",
        summary="Optimized checkout transaction concurrency with asynchronous settlement fan-out.",
        status="blocked",
        diff_stats={"files_changed": 5, "additions": 184, "deletions": 42},
        created_at=base_time - timedelta(hours=3),
        updated_at=base_time,
    )
    db.add(release)

    # Secondary Release: rel-2026-002 (Clean canary ready for deployment)
    release_2 = Release(
        id="rel-2026-002",
        version_tag="v2.3.9-hotfix.1",
        commit_hash="c3e78a94df12",
        branch="hotfix/jwt-expiry-skew",
        author="security-lead@aftermath.dev",
        summary="Clock-skew tolerance fix for multi-region authentication tokens.",
        status="approved",
        diff_stats={"files_changed": 2, "additions": 28, "deletions": 9},
        created_at=base_time - timedelta(days=1),
        updated_at=base_time - timedelta(hours=12),
    )
    db.add(release_2)

    # 2. Experiments for rel-2026-001: Vulnerable vs Repaired
    exp_vuln = Experiment(
        id="exp-vuln-001",
        release_id="rel-2026-001",
        name="Consequence Baseline: Unpatched Async Checkout Fan-Out",
        description="Simulates 450 concurrent checkout operations with 12% network retry rate under production load profile.",
        variant="vulnerable",
        status="completed",
        duration_seconds=45.2,
        error_count=27,
        transaction_count=450,
        p95_latency_ms=482.0,
        anomaly_detected=True,
        metrics_summary={
            "error_rate": 0.06,
            "idempotency_violations": 27,
            "p95_latency_ms": 482.0,
            "total_settled_amount_usd": 19450.00,
            "duplicate_billed_amount_usd": 1240.00,
            "cpu_peak_percent": 88.4,
            "db_connection_peak": 100,
        },
        gitlab_job_id="job-881920",
        gitlab_pipeline_id="pipe-31048",
        scenario_id="lost-response-retry",
        reproducibility_seed=42,
        invariant_status="FAIL",
        invariant_verdict="VIOLATION DETECTED: 27 duplicate charges issued across 450 transactions.",
        ledger_summary={"total_requests": 450, "unique_keys": 423, "settled_count": 450, "double_charges": 27},
        started_at=base_time - timedelta(minutes=45),
        completed_at=base_time - timedelta(minutes=44, seconds=15),
    )
    db.add(exp_vuln)

    exp_rep = Experiment(
        id="exp-rep-001",
        release_id="rel-2026-001",
        name="Consequence Verification: Duo Agent Repaired Atomic Idempotency Lock",
        description="Executes identical 450 concurrent checkout operations with Redis SETNX distributed lock and deduplication barrier.",
        variant="repaired",
        status="completed",
        duration_seconds=42.1,
        error_count=0,
        transaction_count=450,
        p95_latency_ms=68.5,
        anomaly_detected=False,
        metrics_summary={
            "error_rate": 0.0,
            "idempotency_violations": 0,
            "p95_latency_ms": 68.5,
            "total_settled_amount_usd": 18210.00,
            "duplicate_billed_amount_usd": 0.00,
            "cpu_peak_percent": 34.2,
            "db_connection_peak": 28,
        },
        gitlab_job_id="job-882041",
        gitlab_pipeline_id="pipe-31055",
        scenario_id="lost-response-retry",
        reproducibility_seed=42,
        invariant_status="PASS",
        invariant_verdict="VERIFIED: Zero duplicate charges; all identical idempotency keys deduplicated safely.",
        ledger_summary={"total_requests": 450, "unique_keys": 450, "settled_count": 450, "double_charges": 0},
        started_at=base_time - timedelta(minutes=25),
        completed_at=base_time - timedelta(minutes=24, seconds=18),
    )
    db.add(exp_rep)

    # 3. Chronological Events for Vulnerable Experiment
    vuln_events = [
        (0, "api_gateway", "traffic_start", "info", "Commenced test scenario: 450 parallel checkout requests initiated across 6 regions", 12.0),
        (250, "checkout_service", "async_dispatch", "info", "Dispatching asynchronous payment tasks to worker cluster without mutex acquisition", 28.0),
        (1200, "network_emulator", "retry_triggered", "warning", "Simulated packet drop injected; client dispatched retry with key idem_99014", 185.0),
        (1450, "payment_service", "idempotency_breach", "critical", "CRITICAL ANOMALY: Concurrency collision. Duplicate idempotency key 'idem_99014' accepted by worker-4", 240.0),
        (1580, "payment_gateway", "double_debit", "critical", "Duplicate charge confirmed: Customer cust_7781 debited $120.00 twice on Visa auth #9921", 310.0),
        (2800, "database_pool", "pool_exhaustion", "error", "Database connection pool saturated (100/100 active connections). Query queues backlogged", 482.0),
        (4500, "consequence_engine", "experiment_finish", "error", "Scenario terminated with 27 idempotency breaches and $1,240.00 duplicate billing", 45.2),
    ]
    for idx, (offset, svc, ev_type, lvl, msg, lat) in enumerate(vuln_events):
        ev = ExperimentEvent(
            id=f"ev-vuln-{idx+1:03d}",
            experiment_id="exp-vuln-001",
            timestamp_offset_ms=offset,
            service_name=svc,
            event_type=ev_type,
            level=lvl,
            message=msg,
            latency_ms=lat,
            payload={"offset_ms": offset, "stage": idx + 1},
        )
        db.add(ev)

    # 4. Chronological Events for Repaired Experiment
    rep_events = [
        (0, "api_gateway", "traffic_start", "info", "Commenced test scenario: 450 parallel checkout requests initiated with Duo atomic patch", 10.0),
        (180, "checkout_service", "lock_acquisition", "info", "Redis SETNX distributed lock acquired on settlement resource 'lock:idem_99014'", 14.0),
        (1200, "network_emulator", "retry_triggered", "warning", "Simulated packet drop injected; client dispatched retry with key idem_99014", 160.0),
        (1240, "payment_service", "idempotency_intercept", "success", "Atomic idempotency barrier intercepted retry 'idem_99014'. Returning cached 200 OK without re-charge", 22.0),
        (1300, "payment_gateway", "single_debit_verified", "success", "Verified single billing: Customer cust_7781 ledger exact balance preserved ($120.00)", 54.0),
        (2500, "database_pool", "pool_nominal", "info", "Connection pool nominal at 28/100 concurrent handles. Zero latency spikes observed", 68.5),
        (4200, "consequence_engine", "experiment_finish", "success", "Scenario completed cleanly: 0 anomalies, 0 duplicate charges, all SLAs satisfied", 42.1),
    ]
    for idx, (offset, svc, ev_type, lvl, msg, lat) in enumerate(rep_events):
        ev = ExperimentEvent(
            id=f"ev-rep-{idx+1:03d}",
            experiment_id="exp-rep-001",
            timestamp_offset_ms=offset,
            service_name=svc,
            event_type=ev_type,
            level=lvl,
            message=msg,
            latency_ms=lat,
            payload={"offset_ms": offset, "stage": idx + 1},
        )
        db.add(ev)

    # 5. Evidences for rel-2026-001
    ev_1 = Evidence(
        id="evi-001",
        experiment_id="exp-vuln-001",
        title="Double-Debit Race Condition in Async Settlement",
        category="data_corruption",
        severity="critical",
        summary="Concurrent HTTP retries under transient network drops bypass non-atomic in-memory map, causing parallel card debits.",
        raw_log_excerpt="2026-10-20T14:15:22.401Z [CRIT] payment_worker.go:142 - Lock missing for idem_99014. Processed two concurrent charges for customer cust_7781.",
        gitlab_artifact_url="https://gitlab.com/atumanyire/aftermath/-/jobs/881920/artifacts/browse",
        verified=True,
        metadata_json={"affected_customers": 27, "financial_exposure_usd": 1240.00},
        created_at=base_time - timedelta(minutes=44),
    )
    db.add(ev_1)

    ev_2 = Evidence(
        id="evi-002",
        experiment_id="exp-vuln-001",
        title="Cascading PostgreSQL Connection Starvation",
        category="timeout_cascade",
        severity="high",
        summary="Unbounded retry storms without exponential backoff exhausted connection pool within 1,600ms of incident onset.",
        raw_log_excerpt="2026-10-20T14:15:23.812Z [ERROR] pool.py:88 - ConnectionPoolExhausted: Pool max size 100 reached. Queue depth: 342.",
        gitlab_artifact_url="https://gitlab.com/atumanyire/aftermath/-/jobs/881920/artifacts/browse",
        verified=True,
        metadata_json={"max_connections": 100, "queued_waiters": 342},
        created_at=base_time - timedelta(minutes=44),
    )
    db.add(ev_2)

    ev_3 = Evidence(
        id="evi-003",
        experiment_id="exp-rep-001",
        title="Verified Distributed Mutex Deduplication",
        category="verification_proof",
        severity="low",
        summary="Duo-suggested patch introduces Redis SETNX atomic locking with 30s TTL, guaranteeing single-execution semantics.",
        raw_log_excerpt="2026-10-20T14:35:12.110Z [INFO] dedupe.go:49 - Redis lock acquired. Subsequent retry idem_99014 deduped successfully.",
        gitlab_artifact_url="https://gitlab.com/atumanyire/aftermath/-/jobs/882041/artifacts/browse",
        verified=True,
        metadata_json={"idempotency_pass_rate": 1.0, "p95_overhead_ms": 3.8},
        created_at=base_time - timedelta(minutes=24),
    )
    db.add(ev_3)

    # 6. Agent Sessions
    sess_1 = AgentSession(
        id="sess-001",
        release_id="rel-2026-001",
        agent_name="GitLab Duo Consequence Auditor",
        agent_role="consequence_auditor",
        status="completed",
        goal="Audit release diff a8f9c21b4d08 for concurrent transaction safety and run empirical consequence timelines.",
        prompt="Analyze git diff between main and feat/distributed-checkout-pipeline. Focus on payment retry flows.",
        summary="Detected critical vulnerability in async settlement fan-out. Executed experiment exp-vuln-001 reproducing double-charging.",
        tools_invoked=["gitlab_git_diff", "time_machine_simulator", "log_analyzer", "patch_synthesizer"],
        gitlab_duo_session_id="duo_sess_8921a9",
        gitlab_flow_name="consequence_audit_pipeline",
        started_at=base_time - timedelta(minutes=50),
        completed_at=base_time - timedelta(minutes=40),
    )
    db.add(sess_1)

    sess_2 = AgentSession(
        id="sess-002",
        release_id="rel-2026-001",
        agent_name="GitLab Duo Remediation Engineer",
        agent_role="remediation_engineer",
        status="completed",
        goal="Synthesize atomic idempotency lock patch and verify in sandbox experiment.",
        prompt="Synthesize a minimal diff introducing Redis SETNX lock with safe fallback and re-run consequence simulation.",
        summary="Synthesized patch in checkout/idempotency.py. Executed exp-rep-001: 0 anomalies, 0 errors, SLA met.",
        tools_invoked=["code_synthesizer", "time_machine_simulator", "ast_validator"],
        gitlab_duo_session_id="duo_sess_8922b1",
        gitlab_flow_name="remediation_synthesis_flow",
        started_at=base_time - timedelta(minutes=30),
        completed_at=base_time - timedelta(minutes=20),
    )
    db.add(sess_2)

    # 7. Approvals / Release Control Gates
    gate_1 = Approval(
        id="gate-001",
        release_id="rel-2026-001",
        gate_name="Synthetic Payment Idempotency Verification",
        gate_type="automated",
        status="approved",
        approver_name="AFTERMATH Consequence Gate Engine",
        approver_email="gate-bot@aftermath.dev",
        reason="Repaired run verified: 0 idempotency violations across 450 simulated load ticks.",
        required=True,
        signed_at=base_time - timedelta(minutes=18),
        created_at=base_time - timedelta(hours=2),
    )
    db.add(gate_1)

    gate_2 = Approval(
        id="gate-002",
        release_id="rel-2026-001",
        gate_name="Database Connection Starvation Threshold (<80%)",
        gate_type="automated",
        status="approved",
        approver_name="AFTERMATH Metric Auditor",
        approver_email="gate-bot@aftermath.dev",
        reason="Peak DB connection utilization remained at 28% (threshold: 80%).",
        required=True,
        signed_at=base_time - timedelta(minutes=18),
        created_at=base_time - timedelta(hours=2),
    )
    db.add(gate_2)

    gate_3 = Approval(
        id="gate-003",
        release_id="rel-2026-001",
        gate_name="Latency SLA Under Retry Storm (p95 < 150ms)",
        gate_type="automated",
        status="approved",
        approver_name="AFTERMATH SLA Sentinel",
        approver_email="gate-bot@aftermath.dev",
        reason="p95 latency measured at 68.5ms, well within the 150ms ceiling.",
        required=True,
        signed_at=base_time - timedelta(minutes=18),
        created_at=base_time - timedelta(hours=2),
    )
    db.add(gate_3)

    gate_4 = Approval(
        id="gate-004",
        release_id="rel-2026-001",
        gate_name="Lead Principal Engineer Production Sign-off",
        gate_type="human",
        status="pending",
        approver_name=None,
        approver_email=None,
        reason=None,
        required=True,
        signed_at=None,
        created_at=base_time - timedelta(hours=2),
    )
    db.add(gate_4)

    # 8. Audit Trail Events
    audits = [
        ("release", "rel-2026-001", "created", "gitlab-ci-webhook", {"source_branch": "feat/distributed-checkout-pipeline"}),
        ("experiment", "exp-vuln-001", "evaluated", "consequence_engine", {"variant": "vulnerable", "anomalies": 27}),
        ("agent_session", "sess-001", "completed", "gitlab-duo-consequence-auditor", {"action": "anomaly_report_generated"}),
        ("experiment", "exp-rep-001", "evaluated", "consequence_engine", {"variant": "repaired", "anomalies": 0}),
        ("approval", "gate-001", "approved", "gate-bot@aftermath.dev", {"criteria": "synthetic_payment_idempotency"}),
        ("approval", "gate-002", "approved", "gate-bot@aftermath.dev", {"criteria": "db_connection_starvation"}),
        ("approval", "gate-003", "approved", "gate-bot@aftermath.dev", {"criteria": "latency_sla"}),
    ]
    for idx, (ent_type, ent_id, action, actor, details) in enumerate(audits):
        aud = AuditEvent(
            id=f"audit-{idx+1:03d}",
            entity_type=ent_type,
            entity_id=ent_id,
            action=action,
            actor=actor,
            details=details,
            created_at=base_time - timedelta(minutes=45 - idx * 4),
        )
        db.add(aud)

    # 9. Synthetic Payment Transactions for demonstration fixture
    demo_txns = [
        # Vulnerable set
        ("txn_vuln_101", "idem_99014", "cust_7781", 12000, "USD", "settled", 62.0, False, False, None, "vulnerable"),
        ("txn_vuln_102", "idem_99014", "cust_7781", 12000, "USD", "race_corrupted", 184.0, True, True, "Double debit occurred: duplicate idempotency key accepted without lock", "vulnerable"),
        ("txn_vuln_103", "idem_99015", "cust_4412", 4500, "USD", "settled", 58.0, False, False, None, "vulnerable"),
        ("txn_vuln_104", "idem_99015", "cust_4412", 4500, "USD", "race_corrupted", 195.0, True, True, "Double debit occurred: duplicate idempotency key accepted without lock", "vulnerable"),
        ("txn_vuln_105", "idem_99016", "cust_9021", 8900, "USD", "settled", 71.0, False, False, None, "vulnerable"),
        # Repaired set
        ("txn_rep_201", "idem_99014", "cust_7781", 12000, "USD", "settled", 54.0, False, False, None, "repaired"),
        ("txn_rep_202", "idem_99014", "cust_7781", 12000, "USD", "duplicate_detected", 18.0, True, False, None, "repaired"),
        ("txn_rep_203", "idem_99015", "cust_4412", 4500, "USD", "settled", 48.0, False, False, None, "repaired"),
        ("txn_rep_204", "idem_99015", "cust_4412", 4500, "USD", "duplicate_detected", 21.0, True, False, None, "repaired"),
        ("txn_rep_205", "idem_99016", "cust_9021", 8900, "USD", "settled", 52.0, False, False, None, "repaired"),
    ]
    for txn_ref, idem_k, cust_id, amt, curr, status, lat, is_dup, has_anom, err, var in demo_txns:
        st = SyntheticTransaction(
            id=str(uuid.uuid4()),
            transaction_ref=txn_ref,
            idempotency_key=idem_k,
            customer_id=cust_id,
            amount_cents=amt,
            currency=curr,
            status=status,
            latency_ms=lat,
            is_duplicate=is_dup,
            has_anomaly=has_anom,
            error_detail=err,
            release_variant=var,
            metadata_payload={"seeded_demo_fixture": True},
            created_at=base_time - timedelta(minutes=30),
        )
        db.add(st)

    await db.commit()

    # 10. Seed Deterministic Causal Graph & Blast Radius Report
    from app.services.causal_engine import CausalGraphEngine
    await CausalGraphEngine.ensure_baseline_graph(db, "rel-2026-001")

    # 11. Seed Baseline Remediation Workflow
    await ensure_baseline_remediation(db)

    return True


async def ensure_baseline_remediation(db: AsyncSession) -> None:
    """Ensures deterministic baseline remediation workflow is seeded for rel-2026-001."""
    from app.models.remediation_workflow import RemediationWorkflow
    from app.services.remediation_engine import generate_remediation_diff
    
    existing_wf = (await db.execute(select(RemediationWorkflow).where(RemediationWorkflow.id == "rem-wf-001"))).scalars().first()
    if existing_wf is not None:
        return

    diff_text, patch_hash, changed_files, _ = generate_remediation_diff("services/payment_worker/processor.py")
    base_time = datetime(2026, 10, 20, 14, 0, 0)

    wf = RemediationWorkflow(
        id="rem-wf-001",
        release_id="rel-2026-001",
        triggering_experiment_id="exp-vuln-001",
        violated_invariant="INV-PAY-001: Exactly-One-Charge-Per-Purchase",
        causal_node_id="node-inv-001",
        source_commit="a8f9c21b4d08",
        target_file_path="services/payment_worker/processor.py",
        patch_diff=diff_text,
        patch_hash=patch_hash,
        changed_files=changed_files,
        status="PATCH_PROPOSED",
        agent_provider="reference_remediation_engine",
        agent_model="GitLab Duo Code Assistant (Emulated Reference Engine)",
        tool_execution_records=[
            {
                "step": 1,
                "tool": "ast_concurrency_analyzer",
                "action": "locate_race_window",
                "details": "Discovered unprotected asynchronous gap between idempotency check and write in services/payment_worker/processor.py",
                "timestamp": (base_time - timedelta(minutes=15)).isoformat(),
            },
            {
                "step": 2,
                "tool": "patch_generator",
                "action": "synthesize_atomic_barrier",
                "details": "Injected asyncio.Lock barrier and in-flight reservation map to serialize duplicate attempts",
                "timestamp": (base_time - timedelta(minutes=10)).isoformat(),
            },
        ],
        validation_results={},
        approval_status="PENDING",
        approval_decision=None,
        remediation_branch="remediation/rem-wf-001-atomic-idempotency",
        gitlab_mr_url=None,
        gitlab_mr_status="BLOCKED (External Auth Required)",
        created_at=base_time - timedelta(minutes=10),
        updated_at=base_time - timedelta(minutes=10),
    )
    db.add(wf)
    await db.commit()

