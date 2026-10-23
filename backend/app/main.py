"""
Main FastAPI Application for AFTERMATH.
The Release Time Machine: Every release has consequences. See them before production.
"""
from contextlib import asynccontextmanager
import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.security import WriteAccessMiddleware
from app.database import engine, Base, AsyncSessionLocal
from app.api.router import api_router
from app.api.health import router as health_router
from app.api.experiments import router as experiments_direct_router
from app.api.remediation import router as remediation_direct_router
from app.services.seed_data import seed_initial_data, ensure_baseline_remediation

# Configure logging
logging.basicConfig(
    level=logging.INFO if settings.LOG_LEVEL.lower() == "info" else logging.DEBUG,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger("aftermath")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure tables exist and seed deterministic demo fixtures
    logger.info("Initializing AFTERMATH database schema...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    logger.info("Checking deterministic seed fixtures...")
    async with AsyncSessionLocal() as session:
        seeded = await seed_initial_data(session)
        if seeded:
            logger.info("Deterministic seed fixtures successfully loaded.")
        else:
            logger.info("Seed data already present. Skipping insertion.")
        await ensure_baseline_remediation(session)

    yield
    # Shutdown
    logger.info("Closing database engine connections...")
    await engine.dispose()


app = FastAPI(
    title="AFTERMATH API",
    description="The Release Time Machine — Real GitLab Duo consequence testing and release supervision.",
    version="0.2.0",
    lifespan=lifespan,
)

# Access boundary for state-changing requests (added first so CORS wraps its responses)
app.add_middleware(WriteAccessMiddleware)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred in AFTERMATH backend."},
    )

# Root Probes (Kubernetes / Docker default paths)
app.include_router(health_router)

# Direct root experiments and remediations route conforming strictly to prompt spec
app.include_router(experiments_direct_router, prefix="/api")
app.include_router(remediation_direct_router, prefix="/api")

# Mount main API router under prefix (e.g. /api/v1)
app.include_router(api_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    return {
        "product": "AFTERMATH — The Release Time Machine",
        "tagline": "Every release has consequences. See them before production.",
        "version": "0.2.0",
        "api_docs": "/docs",
        "health": "/healthz",
        "ready": "/readyz",
    }
