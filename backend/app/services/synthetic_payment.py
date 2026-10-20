"""
Isolated Synthetic Payment Service.
Provides deterministic simulation of payment transactions to demonstrate release consequence analysis.
Models the duplicate-charge / idempotency-race condition vulnerability between vulnerable and repaired releases.
"""
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import uuid
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from app.models.synthetic_transaction import SyntheticTransaction
from app.models.idempotency_record import IdempotencyRecord


class PaymentRequest(BaseModel):
    customer_id: str
    amount_cents: int
    currency: str = "USD"
    idempotency_key: str
    order_id: Optional[str] = None
    experiment_id: Optional[str] = None
    release_variant: str = "vulnerable"  # "vulnerable" or "repaired"


class PaymentResult(BaseModel):
    transaction_ref: str
    idempotency_key: str
    customer_id: str
    order_id: Optional[str] = None
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
    - 'repaired': Durable database-backed idempotency barrier safely deduplicates retries.
    """

    async def execute_transaction(
        self,
        db: AsyncSession,
        req: PaymentRequest,
    ) -> PaymentResult:
        now = datetime.utcnow()
        transaction_ref = f"txn_{uuid.uuid4().hex[:12]}"
        effective_order_id = req.order_id or f"ord_{req.idempotency_key[-8:]}"

        if req.release_variant == "repaired":
            # =================================================================
            # REPAIRED VARIANT: Durable Database Idempotency Record
            # =================================================================
            stmt = select(IdempotencyRecord).where(
                and_(
                    IdempotencyRecord.idempotency_key == req.idempotency_key,
                    IdempotencyRecord.scope == "checkout_payment",
                )
            )
            existing_record = (await db.execute(stmt)).scalars().first()

            if existing_record is not None:
                # Key already exists: Safely deduplicate!
                # Do NOT debit the ledger again.
                txn = SyntheticTransaction(
                    id=str(uuid.uuid4()),
                    experiment_id=req.experiment_id,
                    order_id=effective_order_id,
                    transaction_ref=transaction_ref,
                    idempotency_key=req.idempotency_key,
                    customer_id=req.customer_id,
                    amount_cents=req.amount_cents,
                    currency=req.currency,
                    status="duplicate_detected",
                    latency_ms=18.0,
                    is_duplicate=True,
                    has_anomaly=False,
                    error_detail=None,
                    release_variant=req.release_variant,
                    metadata_payload={
                        "reused_order_id": existing_record.order_id,
                        "action": "SAFELY_DEDUPLICATED",
                        "durable_lock": True,
                    },
                    created_at=now,
                )
                db.add(txn)
                await db.commit()

                return PaymentResult(
                    transaction_ref=txn.transaction_ref,
                    idempotency_key=txn.idempotency_key,
                    customer_id=txn.customer_id,
                    order_id=effective_order_id,
                    amount_cents=txn.amount_cents,
                    currency=txn.currency,
                    status=txn.status,
                    latency_ms=txn.latency_ms,
                    is_duplicate=True,
                    has_anomaly=False,
                    error_detail=None,
                )

            # First time seeing this idempotency key in repaired mode:
            # Create durable lock record and settle
            lease_expiry = now + timedelta(seconds=30)
            idem_rec = IdempotencyRecord(
                id=f"idem-rec-{uuid.uuid4().hex[:12]}",
                experiment_id=req.experiment_id or "default_exp",
                scope="checkout_payment",
                idempotency_key=req.idempotency_key,
                order_id=effective_order_id,
                status="SETTLED",
                response_payload={"order_id": effective_order_id, "amount_cents": req.amount_cents, "status": "settled"},
                locked_at=now,
                lease_expires_at=lease_expiry,
                settled_at=now,
                created_at=now,
            )
            db.add(idem_rec)

            txn = SyntheticTransaction(
                id=str(uuid.uuid4()),
                experiment_id=req.experiment_id,
                order_id=effective_order_id,
                transaction_ref=transaction_ref,
                idempotency_key=req.idempotency_key,
                customer_id=req.customer_id,
                amount_cents=req.amount_cents,
                currency=req.currency,
                status="settled",
                latency_ms=52.0,
                is_duplicate=False,
                has_anomaly=False,
                error_detail=None,
                release_variant=req.release_variant,
                metadata_payload={"durable_lock": True, "action": "INITIAL_SETTLEMENT"},
                created_at=now,
            )
            db.add(txn)
            await db.commit()

            return PaymentResult(
                transaction_ref=txn.transaction_ref,
                idempotency_key=txn.idempotency_key,
                customer_id=txn.customer_id,
                order_id=effective_order_id,
                amount_cents=txn.amount_cents,
                currency=txn.currency,
                status=txn.status,
                latency_ms=txn.latency_ms,
                is_duplicate=False,
                has_anomaly=False,
                error_detail=None,
            )

        else:
            # =================================================================
            # VULNERABLE VARIANT:
            # Concurrency check omitted. Concurrent requests or retry bursts
            # execute multiple debit operations against the customer ledger.
            # =================================================================
            stmt = select(SyntheticTransaction).where(
                SyntheticTransaction.idempotency_key == req.idempotency_key
            )
            existing = (await db.execute(stmt)).scalars().first()

            if existing is not None:
                # Invariant violation: Double debit
                txn = SyntheticTransaction(
                    id=str(uuid.uuid4()),
                    experiment_id=req.experiment_id,
                    order_id=effective_order_id,
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
                    order_id=effective_order_id,
                    amount_cents=txn.amount_cents,
                    currency=txn.currency,
                    status=txn.status,
                    latency_ms=txn.latency_ms,
                    is_duplicate=True,
                    has_anomaly=True,
                    error_detail=txn.error_detail,
                )

            # Initial transaction in vulnerable mode
            txn = SyntheticTransaction(
                id=str(uuid.uuid4()),
                experiment_id=req.experiment_id,
                order_id=effective_order_id,
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
                order_id=effective_order_id,
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
