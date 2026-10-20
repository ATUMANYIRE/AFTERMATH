"""
Main API Router for AFTERMATH.
"""
from fastapi import APIRouter
from app.api.health import router as health_router
from app.api.overview import router as overview_router
from app.api.time_machine import router as time_machine_router
from app.api.investigation import router as investigation_router
from app.api.agent_activity import router as agent_activity_router
from app.api.release_control import router as release_control_router
from app.api.synthetic_payment import router as synthetic_payment_router

api_router = APIRouter()

# Include all modular routers
api_router.include_router(health_router)
api_router.include_router(overview_router)
api_router.include_router(time_machine_router)
api_router.include_router(investigation_router)
api_router.include_router(agent_activity_router)
api_router.include_router(release_control_router)
api_router.include_router(synthetic_payment_router)
