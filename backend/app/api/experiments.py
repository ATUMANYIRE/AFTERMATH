"""
Executable Experiments API.
Provides user-configurable scenario execution, fault injection,
and real-time consequence verification.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.release import Release
from app.models.experiment import Experiment
from app.models.experiment_event import ExperimentEvent
from app.models.evidence import Evidence
from app.models.synthetic_transaction import SyntheticTransaction
from app.services.consequence_engine import (
    engine as consequence_engine,
    RunExperimentRequest,
    ScenarioConfig,
)
from app.schemas.experiment import (
    ExperimentResponse,
    ExperimentEventResponse,
    EvidenceResponse,
    TransactionResponse,
    TimeMachineComparisonResponse,
    RunExperimentRequestSchema,
    RunPairRequestSchema,
)

router = APIRouter(prefix="/experiments", tags=["Consequence Experiments"])


@router.post("/run", response_model=ExperimentResponse, summary="Execute Single Consequence Experiment")
async def run_experiment(req: RunExperimentRequestSchema, db: AsyncSession = Depends(get_db)):
    # Validate release exists
    rel = (await db.execute(select(Release).where(Release.id == req.release_id))).scalars().first()
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Release '{req.release_id}' not found.",
        )

    # Convert to engine request
    engine_req = RunExperimentRequest(
        release_id=req.release_id,
        variant=req.variant,
        scenario=ScenarioConfig(**req.scenario.model_dump()),
    )

    exp = await consequence_engine.run_experiment(db, engine_req)

    # Reload with events and evidences
    stmt = (
        select(Experiment)
        .where(Experiment.id == exp.id)
        .options(selectinload(Experiment.events), selectinload(Experiment.evidences))
    )
    loaded_exp = (await db.execute(stmt)).scalars().first()

    return ExperimentResponse(
        id=loaded_exp.id,
        release_id=loaded_exp.release_id,
        name=loaded_exp.name,
        description=loaded_exp.description,
        variant=loaded_exp.variant,
        status=loaded_exp.status,
        duration_seconds=loaded_exp.duration_seconds,
        error_count=loaded_exp.error_count,
        transaction_count=loaded_exp.transaction_count,
        p95_latency_ms=loaded_exp.p95_latency_ms,
        anomaly_detected=loaded_exp.anomaly_detected,
        metrics_summary=loaded_exp.metrics_summary,
        gitlab_job_id=loaded_exp.gitlab_job_id,
        gitlab_pipeline_id=loaded_exp.gitlab_pipeline_id,
        scenario_id=loaded_exp.scenario_id,
        scenario_config=loaded_exp.scenario_config,
        reproducibility_seed=loaded_exp.reproducibility_seed,
        invariant_status=loaded_exp.invariant_status,
        invariant_verdict=loaded_exp.invariant_verdict,
        ledger_summary=loaded_exp.ledger_summary,
        started_at=loaded_exp.started_at,
        completed_at=loaded_exp.completed_at,
        events=[ExperimentEventResponse.model_validate(e) for e in sorted(loaded_exp.events, key=lambda x: x.timestamp_offset_ms)],
        evidences=[EvidenceResponse.model_validate(e) for e in loaded_exp.evidences],
    )


@router.post("/run-pair", response_model=TimeMachineComparisonResponse, summary="Execute Paired Vulnerable vs Repaired Experiments")
async def run_pair(req: RunPairRequestSchema, db: AsyncSession = Depends(get_db)):
    rel = (await db.execute(select(Release).where(Release.id == req.release_id))).scalars().first()
    if not rel:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Release '{req.release_id}' not found.",
        )

    # 1. Run vulnerable experiment
    engine_vuln = RunExperimentRequest(
        release_id=req.release_id,
        variant="vulnerable",
        scenario=ScenarioConfig(**req.scenario.model_dump()),
    )
    exp_vuln = await consequence_engine.run_experiment(db, engine_vuln)

    # 2. Run repaired experiment with identical seed
    engine_rep = RunExperimentRequest(
        release_id=req.release_id,
        variant="repaired",
        scenario=ScenarioConfig(**req.scenario.model_dump()),
    )
    exp_rep = await consequence_engine.run_experiment(db, engine_rep)

    # Reload both
    stmt_v = (
        select(Experiment)
        .where(Experiment.id == exp_vuln.id)
        .options(selectinload(Experiment.events), selectinload(Experiment.evidences))
    )
    v_loaded = (await db.execute(stmt_v)).scalars().first()

    stmt_r = (
        select(Experiment)
        .where(Experiment.id == exp_rep.id)
        .options(selectinload(Experiment.events), selectinload(Experiment.evidences))
    )
    r_loaded = (await db.execute(stmt_r)).scalars().first()

    vuln_resp = ExperimentResponse(
        id=v_loaded.id,
        release_id=v_loaded.release_id,
        name=v_loaded.name,
        description=v_loaded.description,
        variant=v_loaded.variant,
        status=v_loaded.status,
        duration_seconds=v_loaded.duration_seconds,
        error_count=v_loaded.error_count,
        transaction_count=v_loaded.transaction_count,
        p95_latency_ms=v_loaded.p95_latency_ms,
        anomaly_detected=v_loaded.anomaly_detected,
        metrics_summary=v_loaded.metrics_summary,
        gitlab_job_id=v_loaded.gitlab_job_id,
        gitlab_pipeline_id=v_loaded.gitlab_pipeline_id,
        scenario_id=v_loaded.scenario_id,
        scenario_config=v_loaded.scenario_config,
        reproducibility_seed=v_loaded.reproducibility_seed,
        invariant_status=v_loaded.invariant_status,
        invariant_verdict=v_loaded.invariant_verdict,
        ledger_summary=v_loaded.ledger_summary,
        started_at=v_loaded.started_at,
        completed_at=v_loaded.completed_at,
        events=[ExperimentEventResponse.model_validate(e) for e in sorted(v_loaded.events, key=lambda x: x.timestamp_offset_ms)],
        evidences=[EvidenceResponse.model_validate(e) for e in v_loaded.evidences],
    )

    rep_resp = ExperimentResponse(
        id=r_loaded.id,
        release_id=r_loaded.release_id,
        name=r_loaded.name,
        description=r_loaded.description,
        variant=r_loaded.variant,
        status=r_loaded.status,
        duration_seconds=r_loaded.duration_seconds,
        error_count=r_loaded.error_count,
        transaction_count=r_loaded.transaction_count,
        p95_latency_ms=r_loaded.p95_latency_ms,
        anomaly_detected=r_loaded.anomaly_detected,
        metrics_summary=r_loaded.metrics_summary,
        gitlab_job_id=r_loaded.gitlab_job_id,
        gitlab_pipeline_id=r_loaded.gitlab_pipeline_id,
        scenario_id=r_loaded.scenario_id,
        scenario_config=r_loaded.scenario_config,
        reproducibility_seed=r_loaded.reproducibility_seed,
        invariant_status=r_loaded.invariant_status,
        invariant_verdict=r_loaded.invariant_verdict,
        ledger_summary=r_loaded.ledger_summary,
        started_at=r_loaded.started_at,
        completed_at=r_loaded.completed_at,
        events=[ExperimentEventResponse.model_validate(e) for e in sorted(r_loaded.events, key=lambda x: x.timestamp_offset_ms)],
        evidences=[EvidenceResponse.model_validate(e) for e in r_loaded.evidences],
    )

    latency_delta = v_loaded.p95_latency_ms - r_loaded.p95_latency_ms
    error_reduction = v_loaded.error_count - r_loaded.error_count
    financial_exposure = 0.0
    if v_loaded.ledger_summary:
        financial_exposure = v_loaded.ledger_summary.get("financial_exposure_usd", 0.0)

    delta_summary = {
        "errors_prevented": error_reduction,
        "latency_improvement_ms": round(latency_delta, 1),
        "latency_improvement_ratio": f"{round(v_loaded.p95_latency_ms / max(r_loaded.p95_latency_ms, 1.0), 1)}x faster",
        "financial_exposure_prevented_usd": financial_exposure,
        "anomalies_eliminated": v_loaded.anomaly_detected and not r_loaded.anomaly_detected,
        "scenario_tested": req.scenario.scenario_id,
        "reproducibility_seed": req.scenario.seed,
        "gitlab_pipeline_comparison": {
            "vulnerable_pipeline_id": v_loaded.gitlab_pipeline_id,
            "repaired_pipeline_id": r_loaded.gitlab_pipeline_id,
        },
    }

    return TimeMachineComparisonResponse(
        release_id=rel.id,
        version_tag=rel.version_tag,
        summary=rel.summary,
        vulnerable_experiment=vuln_resp,
        repaired_experiment=rep_resp,
        delta_summary=delta_summary,
    )


@router.get("/history", response_model=List[ExperimentResponse], summary="List All Executed Experiments")
async def list_experiments(limit: int = 20, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Experiment)
        .order_by(Experiment.started_at.desc())
        .limit(limit)
        .options(selectinload(Experiment.events), selectinload(Experiment.evidences))
    )
    experiments = (await db.execute(stmt)).scalars().all()

    return [
        ExperimentResponse(
            id=exp.id,
            release_id=exp.release_id,
            name=exp.name,
            description=exp.description,
            variant=exp.variant,
            status=exp.status,
            duration_seconds=exp.duration_seconds,
            error_count=exp.error_count,
            transaction_count=exp.transaction_count,
            p95_latency_ms=exp.p95_latency_ms,
            anomaly_detected=exp.anomaly_detected,
            metrics_summary=exp.metrics_summary,
            gitlab_job_id=exp.gitlab_job_id,
            gitlab_pipeline_id=exp.gitlab_pipeline_id,
            scenario_id=exp.scenario_id,
            scenario_config=exp.scenario_config,
            reproducibility_seed=exp.reproducibility_seed,
            invariant_status=exp.invariant_status,
            invariant_verdict=exp.invariant_verdict,
            ledger_summary=exp.ledger_summary,
            started_at=exp.started_at,
            completed_at=exp.completed_at,
            events=[ExperimentEventResponse.model_validate(e) for e in sorted(exp.events, key=lambda x: x.timestamp_offset_ms)],
            evidences=[EvidenceResponse.model_validate(e) for e in exp.evidences],
        )
        for exp in experiments
    ]


@router.get("/{id}", response_model=ExperimentResponse, summary="Get Experiment by ID")
async def get_experiment(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Experiment)
        .where(Experiment.id == id)
        .options(selectinload(Experiment.events), selectinload(Experiment.evidences))
    )
    exp = (await db.execute(stmt)).scalars().first()
    if not exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{id}' not found.",
        )

    return ExperimentResponse(
        id=exp.id,
        release_id=exp.release_id,
        name=exp.name,
        description=exp.description,
        variant=exp.variant,
        status=exp.status,
        duration_seconds=exp.duration_seconds,
        error_count=exp.error_count,
        transaction_count=exp.transaction_count,
        p95_latency_ms=exp.p95_latency_ms,
        anomaly_detected=exp.anomaly_detected,
        metrics_summary=exp.metrics_summary,
        gitlab_job_id=exp.gitlab_job_id,
        gitlab_pipeline_id=exp.gitlab_pipeline_id,
        scenario_id=exp.scenario_id,
        scenario_config=exp.scenario_config,
        reproducibility_seed=exp.reproducibility_seed,
        invariant_status=exp.invariant_status,
        invariant_verdict=exp.invariant_verdict,
        ledger_summary=exp.ledger_summary,
        started_at=exp.started_at,
        completed_at=exp.completed_at,
        events=[ExperimentEventResponse.model_validate(e) for e in sorted(exp.events, key=lambda x: x.timestamp_offset_ms)],
        evidences=[EvidenceResponse.model_validate(e) for e in exp.evidences],
    )


@router.get("/{id}/events", response_model=List[ExperimentEventResponse], summary="Get Chronological Events for Experiment")
async def get_experiment_events(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(ExperimentEvent)
        .where(ExperimentEvent.experiment_id == id)
        .order_by(ExperimentEvent.timestamp_offset_ms.asc())
    )
    events = (await db.execute(stmt)).scalars().all()
    return [ExperimentEventResponse.model_validate(e) for e in events]


@router.get("/{id}/evidence", response_model=List[EvidenceResponse], summary="Get Verified Evidence for Experiment")
async def get_experiment_evidence(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(Evidence)
        .where(Evidence.experiment_id == id)
        .order_by(Evidence.created_at.asc())
    )
    evidences = (await db.execute(stmt)).scalars().all()
    return [EvidenceResponse.model_validate(e) for e in evidences]


@router.get("/{id}/ledger", response_model=List[TransactionResponse], summary="Get Actual Persisted Ledger Transactions for Experiment")
async def get_experiment_ledger(id: str, db: AsyncSession = Depends(get_db)):
    stmt = (
        select(SyntheticTransaction)
        .where(SyntheticTransaction.experiment_id == id)
        .order_by(SyntheticTransaction.created_at.asc())
    )
    txns = (await db.execute(stmt)).scalars().all()
    return [TransactionResponse.model_validate(t) for t in txns]


@router.get("/{id}/comparison", response_model=TimeMachineComparisonResponse, summary="Get Paired Comparison for Experiment")
async def get_experiment_comparison(id: str, db: AsyncSession = Depends(get_db)):
    # Find base experiment
    base_exp = (await db.execute(select(Experiment).where(Experiment.id == id))).scalars().first()
    if not base_exp:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Experiment '{id}' not found.",
        )

    # Find paired counterpart (same scenario and seed, opposite variant, or standard counterpart)
    opp_variant = "repaired" if base_exp.variant == "vulnerable" else "vulnerable"
    counterpart_stmt = (
        select(Experiment)
        .where(
            Experiment.release_id == base_exp.release_id,
            Experiment.variant == opp_variant,
            Experiment.reproducibility_seed == base_exp.reproducibility_seed,
            Experiment.scenario_id == base_exp.scenario_id,
        )
        .order_by(Experiment.started_at.desc())
    )
    counterpart = (await db.execute(counterpart_stmt)).scalars().first()

    # If no exact counterpart with same seed, fall back to any counterpart for this release
    if not counterpart:
        fallback_stmt = (
            select(Experiment)
            .where(
                Experiment.release_id == base_exp.release_id,
                Experiment.variant == opp_variant,
            )
            .order_by(Experiment.started_at.desc())
        )
        counterpart = (await db.execute(fallback_stmt)).scalars().first()

    if not counterpart:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No paired counterpart variant '{opp_variant}' found for release '{base_exp.release_id}'.",
        )

    vuln_exp = base_exp if base_exp.variant == "vulnerable" else counterpart
    rep_exp = counterpart if base_exp.variant == "vulnerable" else base_exp

    rel = (await db.execute(select(Release).where(Release.id == base_exp.release_id))).scalars().first()

    # Load events and evidences
    stmt_v = (
        select(Experiment)
        .where(Experiment.id == vuln_exp.id)
        .options(selectinload(Experiment.events), selectinload(Experiment.evidences))
    )
    v_loaded = (await db.execute(stmt_v)).scalars().first()

    stmt_r = (
        select(Experiment)
        .where(Experiment.id == rep_exp.id)
        .options(selectinload(Experiment.events), selectinload(Experiment.evidences))
    )
    r_loaded = (await db.execute(stmt_r)).scalars().first()

    vuln_resp = ExperimentResponse(
        id=v_loaded.id,
        release_id=v_loaded.release_id,
        name=v_loaded.name,
        description=v_loaded.description,
        variant=v_loaded.variant,
        status=v_loaded.status,
        duration_seconds=v_loaded.duration_seconds,
        error_count=v_loaded.error_count,
        transaction_count=v_loaded.transaction_count,
        p95_latency_ms=v_loaded.p95_latency_ms,
        anomaly_detected=v_loaded.anomaly_detected,
        metrics_summary=v_loaded.metrics_summary,
        gitlab_job_id=v_loaded.gitlab_job_id,
        gitlab_pipeline_id=v_loaded.gitlab_pipeline_id,
        scenario_id=v_loaded.scenario_id,
        scenario_config=v_loaded.scenario_config,
        reproducibility_seed=v_loaded.reproducibility_seed,
        invariant_status=v_loaded.invariant_status,
        invariant_verdict=v_loaded.invariant_verdict,
        ledger_summary=v_loaded.ledger_summary,
        started_at=v_loaded.started_at,
        completed_at=v_loaded.completed_at,
        events=[ExperimentEventResponse.model_validate(e) for e in sorted(v_loaded.events, key=lambda x: x.timestamp_offset_ms)],
        evidences=[EvidenceResponse.model_validate(e) for e in v_loaded.evidences],
    )

    rep_resp = ExperimentResponse(
        id=r_loaded.id,
        release_id=r_loaded.release_id,
        name=r_loaded.name,
        description=r_loaded.description,
        variant=r_loaded.variant,
        status=r_loaded.status,
        duration_seconds=r_loaded.duration_seconds,
        error_count=r_loaded.error_count,
        transaction_count=r_loaded.transaction_count,
        p95_latency_ms=r_loaded.p95_latency_ms,
        anomaly_detected=r_loaded.anomaly_detected,
        metrics_summary=r_loaded.metrics_summary,
        gitlab_job_id=r_loaded.gitlab_job_id,
        gitlab_pipeline_id=r_loaded.gitlab_pipeline_id,
        scenario_id=r_loaded.scenario_id,
        scenario_config=r_loaded.scenario_config,
        reproducibility_seed=r_loaded.reproducibility_seed,
        invariant_status=r_loaded.invariant_status,
        invariant_verdict=r_loaded.invariant_verdict,
        ledger_summary=r_loaded.ledger_summary,
        started_at=r_loaded.started_at,
        completed_at=r_loaded.completed_at,
        events=[ExperimentEventResponse.model_validate(e) for e in sorted(r_loaded.events, key=lambda x: x.timestamp_offset_ms)],
        evidences=[EvidenceResponse.model_validate(e) for e in r_loaded.evidences],
    )

    financial_exposure = 0.0
    if v_loaded.ledger_summary:
        financial_exposure = v_loaded.ledger_summary.get("financial_exposure_usd", 0.0)

    delta_summary = {
        "errors_prevented": v_loaded.error_count - r_loaded.error_count,
        "latency_improvement_ms": round(v_loaded.p95_latency_ms - r_loaded.p95_latency_ms, 1),
        "latency_improvement_ratio": f"{round(v_loaded.p95_latency_ms / max(r_loaded.p95_latency_ms, 1.0), 1)}x faster",
        "financial_exposure_prevented_usd": financial_exposure,
        "anomalies_eliminated": v_loaded.anomaly_detected and not r_loaded.anomaly_detected,
        "scenario_tested": v_loaded.scenario_id or "benchmark",
        "reproducibility_seed": v_loaded.reproducibility_seed or 42,
        "gitlab_pipeline_comparison": {
            "vulnerable_pipeline_id": v_loaded.gitlab_pipeline_id,
            "repaired_pipeline_id": r_loaded.gitlab_pipeline_id,
        },
    }

    return TimeMachineComparisonResponse(
        release_id=rel.id if rel else "rel-2026-001",
        version_tag=rel.version_tag if rel else "v2.4.0-rc.3",
        summary=rel.summary if rel else "",
        vulnerable_experiment=vuln_resp,
        repaired_experiment=rep_resp,
        delta_summary=delta_summary,
    )
