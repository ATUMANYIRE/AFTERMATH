"""
Synthetic Payment Service API.
Isolated sandbox endpoints demonstrating payment concurrency idempotency and failure simulation.
"""
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.services.synthetic_payment import (
    payment_service,
    PaymentRequest,
    PaymentResult,
)

router = APIRouter(prefix="/synthetic-payment", tags=["Synthetic Payment Service"])


@router.post("/execute", response_model=PaymentResult, summary="Execute Isolated Synthetic Payment")
async def execute_payment(req: PaymentRequest, db: AsyncSession = Depends(get_db)):
    result = await payment_service.execute_transaction(db=db, req=req)
    return result


@router.get("/stats", summary="Get Payment Anomaly & Idempotency Stats")
async def get_payment_stats(variant: Optional[str] = None, db: AsyncSession = Depends(get_db)):
    return await payment_service.get_stats(db=db, variant=variant)
