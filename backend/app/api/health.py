"""
Health and Readiness probes for AFTERMATH.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from app.database import get_db
from app.config import settings
from app.schemas.common import HealthResponse, ReadinessResponse
from app.models.release import Release

router = APIRouter(tags=["Health & Probes"])


@router.get("/healthz", response_model=HealthResponse, summary="Liveness Probe")
async def healthz():
    return HealthResponse(
        status="ok",
        environment=settings.ENVIRONMENT,
        database="configured",
        version="0.1.0",
    )


@router.get("/readyz", response_model=ReadinessResponse, summary="Readiness Probe")
async def readyz(db: AsyncSession = Depends(get_db)):
    db_connected = False
    seed_loaded = False
    message = "All core systems operational"

    # Test DB connection
    try:
        await db.execute(text("SELECT 1"))
        db_connected = True
    except Exception as e:
        message = f"Database connection error: {str(e)}"

    # Test Seed Data
    if db_connected:
        try:
            rel = (await db.execute(select(Release))).scalars().first()
            if rel is not None:
                seed_loaded = True
        except Exception as e:
            message = f"Database query error: {str(e)}"

    is_ready = db_connected

    return ReadinessResponse(
        ready=is_ready,
        database_connected=db_connected,
        seed_data_loaded=seed_loaded,
        gitlab_duo_configured=settings.GITLAB_DUO_ENABLED,
        message=message,
    )
