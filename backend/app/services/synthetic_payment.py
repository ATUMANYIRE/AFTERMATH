"""
Isolated Synthetic Payment Service.
Provides deterministic simulation of payment transactions to demonstrate release consequence analysis.
Models the duplicate-charge / idempotency-race condition vulnerability between vulnerable and repaired releases.
"""
from datetime import datetime
from typing import Dict, Any, List, Optional
import uuid
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.models.synthetic_transaction import SyntheticTransaction


class PaymentRequest(BaseModel):
    customer_id: str
    amount_cents: int
    currency: str = "USD"
    idempotency_key: str
    release_variant: str = "vulnerable"  # "vulnerable" or "repaired"


class PaymentResult(BaseModel):
    transaction_ref: str
    idempotency_key: str
    customer_id: str
    amount_cents: int
    currency: str
    status: str  # "settled", "duplicate_detected", "race_corrupted", "rejected"
    latency_ms: float
    is_duplicate: bool
    has_anomaly: bool
    error_detail: Optional[str] = None


class SyntheticPaymentService:
    """
    Simulates payment execution under two release variants:
    - 'vulnerable': Missing atomic idempotency lock causes concurrent retries to bill twice.
    - 'repaired': Distributed atomic idempotency check safely deduplicates retries.
    """

    async def execute_transaction(
        self,
        db: AsyncSession,
        req: PaymentRequest,
    ) -> PaymentResult:
        # Check existing transaction with this idempotency key
        stmt = select(SyntheticTransaction).where(
            SyntheticTransaction.idempotency_key == req.idempotency_key
        )
        existing = (await db.execute(stmt)).scalars().first()

        transaction_ref = f"txn_{uuid.uuid4().hex[:12]}"
        now = datetime.utcnow()

        if existing is not None:
            if req.release_variant == "vulnerable":
                # Vulnerability: concurrency check omitted, ledger debited again
                txn = SyntheticTransaction(
                    id=str(uuid.uuid4()),
                    transaction_ref=transaction_ref,
                    idempotency_key=req.idempotency_key,
                    customer_id=req.customer_id,
                    amount_cents=req.amount_cents,
                    currency=req.currency,
                    status="race_corrupted",
                    latency_ms=184.5,
                    is_duplicate=True,
                    has_anomaly=True,
                    error_detail="Double debit occurred: duplicate idempotency key accepted without lock",
                    release_variant=req.release_variant,
                    metadata_payload={"original_txn_ref": existing.transaction_ref, "violation": "IDEMPOTENCY_BREACH"},
                    created_at=now,
                )
                db.add(txn)
                await db.commit()
                return PaymentResult(
                    transaction_ref=txn.transaction_ref,
                    idempotency_key=txn.idempotency_key,
                    customer_id=txn.customer_id,
                    amount_cents=txn.amount_cents,
                    currency=txn.currency,
                    status=txn.status,
                    latency_ms=txn.latency_ms,
                    is_duplicate=True,
                    has_anomaly=True,
                    error_detail=txn.error_detail,
                )
            else:
                # Repaired: Idempotency enforced, original transaction returned without re-charge
                txn = SyntheticTransaction(
                    id=str(uuid.uuid4()),
                    transaction_ref=transaction_ref,
                    idempotency_key=req.idempotency_key,
                    customer_id=req.customer_id,
                    amount_cents=req.amount_cents,
                    currency=req.currency,
                    status="duplicate_detected",
                    latency_ms=22.0,
                    is_duplicate=True,
                    has_anomaly=False,
                    error_detail=None,
                    release_variant=req.release_variant,
                    metadata_payload={"reused_original_ref": existing.transaction_ref, "action": "SAFELY_DEDUPLICATED"},
                    created_at=now,
                )
                db.add(txn)
                await db.commit()
                return PaymentResult(
                    transaction_ref=txn.transaction_ref,
                    idempotency_key=txn.idempotency_key,
                    customer_id=txn.customer_id,
                    amount_cents=txn.amount_cents,
                    currency=txn.currency,
                    status=txn.status,
                    latency_ms=txn.latency_ms,
                    is_duplicate=True,
                    has_anomaly=False,
                    error_detail=None,
                )

        # Standard new transaction
        txn = SyntheticTransaction(
            id=str(uuid.uuid4()),
            transaction_ref=transaction_ref,
            idempotency_key=req.idempotency_key,
            customer_id=req.customer_id,
            amount_cents=req.amount_cents,
            currency=req.currency,
            status="settled",
            latency_ms=64.2,
            is_duplicate=False,
            has_anomaly=False,
            error_detail=None,
            release_variant=req.release_variant,
            metadata_payload={"gateway": "mock_visa_direct", "auth_code": "AUTH_9921"},
            created_at=now,
        )
        db.add(txn)
        await db.commit()

        return PaymentResult(
            transaction_ref=txn.transaction_ref,
            idempotency_key=txn.idempotency_key,
            customer_id=txn.customer_id,
            amount_cents=txn.amount_cents,
            currency=txn.currency,
            status=txn.status,
            latency_ms=txn.latency_ms,
            is_duplicate=False,
            has_anomaly=False,
            error_detail=None,
        )

    async def get_stats(self, db: AsyncSession, variant: Optional[str] = None) -> Dict[str, Any]:
        query = select(
            SyntheticTransaction.status,
            func.count(SyntheticTransaction.id),
        )
        if variant:
            query = query.where(SyntheticTransaction.release_variant == variant)
        query = query.group_by(SyntheticTransaction.status)

        rows = (await db.execute(query)).all()
        breakdown = {row[0]: row[1] for row in rows}

        total_query = select(func.count(SyntheticTransaction.id))
        if variant:
            total_query = total_query.where(SyntheticTransaction.release_variant == variant)
        total = (await db.execute(total_query)).scalar() or 0

        anomalies_query = select(func.count(SyntheticTransaction.id)).where(SyntheticTransaction.has_anomaly.is_(True))
        if variant:
            anomalies_query = anomalies_query.where(SyntheticTransaction.release_variant == variant)
        anomalies = (await db.execute(anomalies_query)).scalar() or 0

        return {
            "variant": variant or "all",
            "total_transactions": total,
            "anomalies_detected": anomalies,
            "status_breakdown": breakdown,
        }


payment_service = SyntheticPaymentService()
