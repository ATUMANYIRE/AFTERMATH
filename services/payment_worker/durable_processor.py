"""
Durable Transactional Payment Processor for AFTERMATH (Milestone 5).
Replaces in-process-only locks with durable database-backed idempotency records,
compound unique constraints, and atomic transaction boundaries.

Guarantee: AT-MOST-ONE durable settlement record per logical purchase
under concurrent multi-process execution, worker crashes, and transient retries.
"""
import os
import sqlite3
import time
import uuid
from typing import Dict, Any, List, Optional
from pathlib import Path


class IdempotencyConflictError(Exception):
    """Raised when an idempotency key is reused with a mismatched payload (different order or amount)."""
    pass


class PaymentProcessingError(Exception):
    """Raised when payment processing fails or a worker crash is simulated."""
    pass


class DurablePaymentProcessor:
    """
    Durable, multi-process safe payment processor enforcing transactional idempotency.
    """

    def __init__(self, db_path: Optional[str] = None):
        if db_path is None:
            self.db_path = str(Path(__file__).parent / "durable_payment.db")
        else:
            self.db_path = str(Path(db_path).resolve())

        self._init_db()

    def _get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path, timeout=30.0)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL;")
        conn.execute("PRAGMA busy_timeout=15000;")
        return conn

    def _init_db(self):
        conn = self._get_connection()
        try:
            with conn:
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS payment_idempotency_keys (
                        idempotency_key TEXT PRIMARY KEY,
                        order_id TEXT NOT NULL,
                        customer_id TEXT NOT NULL,
                        amount_cents INTEGER NOT NULL,
                        currency TEXT NOT NULL DEFAULT 'USD',
                        status TEXT NOT NULL,
                        transaction_id TEXT,
                        created_at REAL NOT NULL,
                        updated_at REAL NOT NULL
                    );
                """)
                conn.execute("""
                    CREATE TABLE IF NOT EXISTS payment_ledger (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        transaction_id TEXT UNIQUE NOT NULL,
                        order_id TEXT NOT NULL,
                        customer_id TEXT NOT NULL,
                        amount_cents INTEGER NOT NULL,
                        currency TEXT NOT NULL DEFAULT 'USD',
                        idempotency_key TEXT NOT NULL,
                        created_at REAL NOT NULL,
                        CONSTRAINT uq_ledger_order_id UNIQUE(order_id),
                        CONSTRAINT uq_ledger_idem_key UNIQUE(idempotency_key)
                    );
                """)
                conn.execute("CREATE INDEX IF NOT EXISTS idx_ledger_order_id ON payment_ledger(order_id);")
                conn.execute("CREATE INDEX IF NOT EXISTS idx_idem_order_id ON payment_idempotency_keys(order_id);")
        finally:
            conn.close()

    def process_payment(
        self,
        order_id: str,
        customer_id: str,
        amount_cents: int,
        idempotency_key: str,
        currency: str = "USD",
        simulated_network_delay_ms: int = 10,
        simulate_crash_before_commit: bool = False,
    ) -> Dict[str, Any]:
        """
        Settles a customer payment with durable transactional idempotency.
        Enforces at-most-one debit per logical purchase across multiple processes.
        """
        max_attempts = 30
        for attempt in range(max_attempts):
            conn = self._get_connection()
            try:
                # 1. Inspect existing state under immediate transaction
                conn.execute("BEGIN IMMEDIATE;")
                cursor = conn.execute(
                    "SELECT * FROM payment_idempotency_keys WHERE idempotency_key = ?",
                    (idempotency_key,)
                )
                existing = cursor.fetchone()

                if existing:
                    # Payload integrity check: Detect reuse across distinct purchases
                    if (
                        existing["order_id"] != order_id
                        or existing["amount_cents"] != amount_cents
                        or existing["customer_id"] != customer_id
                    ):
                        conn.rollback()
                        raise IdempotencyConflictError(
                            f"Idempotency key '{idempotency_key}' was already registered for order "
                            f"'{existing['order_id']}' with amount {existing['amount_cents']}c. "
                            f"Payload mismatch for order '{order_id}' with amount {amount_cents}c."
                        )

                    # Case A: Already successfully settled
                    if existing["status"] == "SETTLED" and existing["transaction_id"]:
                        txn_id = existing["transaction_id"]
                        conn.rollback()
                        return {
                            "success": True,
                            "order_id": order_id,
                            "transaction_id": txn_id,
                            "status": "SAFELY_DEDUPLICATED",
                            "is_duplicate": True,
                        }

                    # Case B: In-flight by another concurrent worker
                    if existing["status"] == "IN_FLIGHT":
                        conn.rollback()
                        # Back off and wait for concurrent worker to complete
                        time.sleep(0.05 + 0.02 * attempt)
                        continue

                    # Case C: Previous attempt failed or crashed - allow retry by resetting status
                    if existing["status"] == "FAILED":
                        conn.execute(
                            "UPDATE payment_idempotency_keys SET status = 'IN_FLIGHT', updated_at = ? WHERE idempotency_key = ?",
                            (time.time(), idempotency_key)
                        )
                        conn.commit()
                        # Proceed with settlement below
                else:
                    # Brand-new idempotency key: Claim in-flight reservation
                    now = time.time()
                    try:
                        conn.execute(
                            """
                            INSERT INTO payment_idempotency_keys
                            (idempotency_key, order_id, customer_id, amount_cents, currency, status, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, 'IN_FLIGHT', ?, ?)
                            """,
                            (idempotency_key, order_id, customer_id, amount_cents, currency, now, now)
                        )
                        conn.commit()
                    except sqlite3.IntegrityError:
                        # Another worker inserted just ahead of us: rollback and retry
                        conn.rollback()
                        time.sleep(0.03)
                        continue

                # 2. Simulated external gateway authorization (outside DB lock)
                if simulated_network_delay_ms > 0:
                    time.sleep(simulated_network_delay_ms / 1000.0)

                # Simulated worker crash scenario: process dies before ledger commit
                if simulate_crash_before_commit:
                    conn_crash = self._get_connection()
                    try:
                        with conn_crash:
                            conn_crash.execute(
                                "UPDATE payment_idempotency_keys SET status = 'FAILED', updated_at = ? WHERE idempotency_key = ?",
                                (time.time(), idempotency_key)
                            )
                    finally:
                        conn_crash.close()
                    raise PaymentProcessingError("Simulated worker process crash prior to ledger settlement")

                # 3. Durable ledger settlement with atomic commit
                txn_id = f"txn_{uuid.uuid4().hex[:10]}"
                conn_settle = self._get_connection()
                try:
                    with conn_settle:
                        conn_settle.execute(
                            """
                            INSERT INTO payment_ledger
                            (transaction_id, order_id, customer_id, amount_cents, currency, idempotency_key, created_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                            """,
                            (txn_id, order_id, customer_id, amount_cents, currency, idempotency_key, time.time())
                        )
                        conn_settle.execute(
                            """
                            UPDATE payment_idempotency_keys
                            SET status = 'SETTLED', transaction_id = ?, updated_at = ?
                            WHERE idempotency_key = ?
                            """,
                            (txn_id, time.time(), idempotency_key)
                        )
                    return {
                        "success": True,
                        "order_id": order_id,
                        "transaction_id": txn_id,
                        "status": "SETTLED",
                        "is_duplicate": False,
                    }
                except sqlite3.IntegrityError:
                    # Database unique constraint (uq_ledger_order_id or uq_ledger_idem_key) prevented double debit!
                    # Fetch already settled receipt
                    cursor = conn_settle.execute(
                        "SELECT transaction_id FROM payment_ledger WHERE order_id = ? OR idempotency_key = ?",
                        (order_id, idempotency_key)
                    )
                    row = cursor.fetchone()
                    existing_txn = row["transaction_id"] if row else txn_id
                    return {
                        "success": True,
                        "order_id": order_id,
                        "transaction_id": existing_txn,
                        "status": "SAFELY_DEDUPLICATED",
                        "is_duplicate": True,
                    }
                finally:
                    conn_settle.close()

            except sqlite3.OperationalError as e:
                if "locked" in str(e).lower() or "busy" in str(e).lower():
                    time.sleep(0.05 + 0.02 * attempt)
                    continue
                raise
            finally:
                conn.close()

        # If attempts exhausted
        raise PaymentProcessingError(f"Payment settlement timed out after {max_attempts} concurrency retry attempts")

    def get_charges_for_order(self, order_id: str) -> List[Dict[str, Any]]:
        """Returns all settled debit transactions for a given order."""
        conn = self._get_connection()
        try:
            cursor = conn.execute("SELECT * FROM payment_ledger WHERE order_id = ?", (order_id,))
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()

    def get_all_ledger_records(self) -> List[Dict[str, Any]]:
        """Returns all transactions across the ledger."""
        conn = self._get_connection()
        try:
            cursor = conn.execute("SELECT * FROM payment_ledger ORDER BY id ASC")
            return [dict(row) for row in cursor.fetchall()]
        finally:
            conn.close()


def multiprocess_payment_worker(
    db_path: str,
    order_id: str,
    customer_id: str,
    amount_cents: int,
    idempotency_key: str,
    results_queue: Any,
):
    """Top-level worker function for multiprocessing tests."""
    processor = DurablePaymentProcessor(db_path=db_path)
    try:
        res = processor.process_payment(
            order_id=order_id,
            customer_id=customer_id,
            amount_cents=amount_cents,
            idempotency_key=idempotency_key,
            simulated_network_delay_ms=25,
        )
        results_queue.put({"status": "SUCCESS", "result": res})
    except Exception as e:
        results_queue.put({"status": "ERROR", "error": str(e), "type": type(e).__name__})
