"""
Target Payment Worker Service for AFTERMATH.
Represents the checkout payment processing core analyzed and remediated in Milestone 4.

DEFECT: Missing atomic idempotency barrier on concurrent checkout settlement tasks.
Under transient network retries or parallel client dispatch, duplicate charges are issued to the ledger.
"""
from typing import Dict, Any, List, Optional
import uuid
import time
import asyncio
from datetime import datetime


class PaymentTransaction:
    def __init__(
        self,
        transaction_id: str,
        order_id: str,
        customer_id: str,
        amount_cents: int,
        idempotency_key: str,
        status: str,
        created_at: float,
    ):
        self.transaction_id = transaction_id
        self.order_id = order_id
        self.customer_id = customer_id
        self.amount_cents = amount_cents
        self.idempotency_key = idempotency_key
        self.status = status
        self.created_at = created_at

    def to_dict(self) -> Dict[str, Any]:
        return {
            "transaction_id": self.transaction_id,
            "order_id": self.order_id,
            "customer_id": self.customer_id,
            "amount_cents": self.amount_cents,
            "idempotency_key": self.idempotency_key,
            "status": self.status,
            "created_at": self.created_at,
        }


class PaymentProcessor:
    """
    Checkout Payment Settlement Processor.
    """

    def __init__(self):
        # In-memory ledger storage for the payment worker
        self.ledger: List[PaymentTransaction] = []
        # Vulnerable in-memory map without thread-safe mutex or database-backed unique locks
        self._processed_keys: Dict[str, str] = {}

    async def process_payment(
        self,
        order_id: str,
        customer_id: str,
        amount_cents: int,
        idempotency_key: str,
        simulated_network_delay_ms: int = 50,
    ) -> Dict[str, Any]:
        """
        Settles a customer payment.
        VULNERABLE IMPLEMENTATION:
        Checks _processed_keys, but due to asynchronous delay between check and commit,
        concurrent retries bypass the check and execute duplicate charges against the ledger.
        """
        # Vulnerable concurrency window: async sleep models I/O or gateway call
        if idempotency_key in self._processed_keys:
            existing_txn_id = self._processed_keys[idempotency_key]
            return {
                "success": True,
                "order_id": order_id,
                "transaction_id": existing_txn_id,
                "status": "SAFELY_DEDUPLICATED",
                "is_duplicate": True,
            }

        # Simulated gateway authorization latency
        if simulated_network_delay_ms > 0:
            await asyncio.sleep(simulated_network_delay_ms / 1000.0)

        # Defect: Multiple concurrent workers reach this line before _processed_keys is updated!
        txn_id = f"txn_{uuid.uuid4().hex[:10]}"
        txn = PaymentTransaction(
            transaction_id=txn_id,
            order_id=order_id,
            customer_id=customer_id,
            amount_cents=amount_cents,
            idempotency_key=idempotency_key,
            status="SETTLED",
            created_at=time.time(),
        )
        self.ledger.append(txn)

        # Update cache AFTER settlement (race window)
        self._processed_keys[idempotency_key] = txn_id

        return {
            "success": True,
            "order_id": order_id,
            "transaction_id": txn_id,
            "status": "SETTLED",
            "is_duplicate": False,
        }

    def get_charges_for_order(self, order_id: str) -> List[Dict[str, Any]]:
        """Returns all settled debit transactions for a given order."""
        return [t.to_dict() for t in self.ledger if t.order_id == order_id]


# Safe demonstration alias
VulnerablePaymentProcessor = PaymentProcessor

# Expose Durable Transactional Payment Processor (Milestone 5)
from services.payment_worker.durable_processor import (
    DurablePaymentProcessor,
    IdempotencyConflictError,
    PaymentProcessingError,
)
