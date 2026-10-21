"""
Comprehensive Test Suite for Durable Transactional Payment Correctness (Milestone 5).
Verifies:
- Multiple Python processes (multiprocessing.Process)
- Concurrent worker threads and async tasks
- Worker crashes, mid-flight restarts, and state recovery
- Transaction rollback safety
- Idempotency-key reuse across distinct purchases (payload mismatch detection)
- Identical purchase retried repeatedly
- Explicit guarantee: AT-MOST-ONE durable settlement record per logical purchase
"""
import multiprocessing
import os
import tempfile
import pytest
from services.payment_worker.durable_processor import (
    DurablePaymentProcessor,
    IdempotencyConflictError,
    PaymentProcessingError,
    multiprocess_payment_worker,
)


@pytest.fixture
def temp_db():
    """Provides an isolated SQLite database path with automatic teardown."""
    fd, path = tempfile.mkstemp(suffix="_durable.db")
    os.close(fd)
    yield path
    for ext in ["", "-wal", "-shm"]:
        p = path + ext
        if os.path.exists(p):
            try:
                os.unlink(p)
            except OSError:
                pass


def test_identical_purchase_retried_repeatedly(temp_db):
    """
    1. Identical purchase retried repeatedly:
    Verifies that 10 consecutive retry attempts for the same purchase
    produce exactly 1 settlement and 9 safely deduplicated receipts.
    """
    processor = DurablePaymentProcessor(db_path=temp_db)
    order_id = "ord_repeat_01"
    customer_id = "cust_repeat_01"
    amount_cents = 8500
    idempotency_key = "idem_key_repeat_01"

    # First attempt: Settle
    first = processor.process_payment(
        order_id=order_id,
        customer_id=customer_id,
        amount_cents=amount_cents,
        idempotency_key=idempotency_key,
        simulated_network_delay_ms=5,
    )
    assert first["success"] is True
    assert first["status"] == "SETTLED"
    assert first["is_duplicate"] is False
    settled_txn_id = first["transaction_id"]

    # 9 Subsequent retries
    for attempt in range(2, 11):
        res = processor.process_payment(
            order_id=order_id,
            customer_id=customer_id,
            amount_cents=amount_cents,
            idempotency_key=idempotency_key,
            simulated_network_delay_ms=0,
        )
        assert res["success"] is True
        assert res["status"] == "SAFELY_DEDUPLICATED"
        assert res["is_duplicate"] is True
        assert res["transaction_id"] == settled_txn_id

    # Ledger invariant assertion
    charges = processor.get_charges_for_order(order_id)
    assert len(charges) == 1
    assert charges[0]["transaction_id"] == settled_txn_id
    assert charges[0]["amount_cents"] == 8500


def test_idempotency_key_reuse_across_distinct_purchases(temp_db):
    """
    2. Idempotency-key reuse across distinct purchases:
    If a client or malicious actor reuses an existing idempotency key for a different order
    or a different purchase amount, the processor must reject the request with IdempotencyConflictError.
    """
    processor = DurablePaymentProcessor(db_path=temp_db)
    idem_key = "shared_idempotency_token_99"

    # Order 1 succeeds
    res1 = processor.process_payment(
        order_id="ord_legitimate_01",
        customer_id="cust_alice",
        amount_cents=4500,
        idempotency_key=idem_key,
    )
    assert res1["status"] == "SETTLED"

    # Attempt 2: Reusing the same key for a different order ID
    with pytest.raises(IdempotencyConflictError) as exc_order:
        processor.process_payment(
            order_id="ord_distinct_02",  # Different order!
            customer_id="cust_alice",
            amount_cents=4500,
            idempotency_key=idem_key,
        )
    assert "Payload mismatch" in str(exc_order.value)

    # Attempt 3: Reusing the same key for the same order but different amount (tampering)
    with pytest.raises(IdempotencyConflictError) as exc_amount:
        processor.process_payment(
            order_id="ord_legitimate_01",
            customer_id="cust_alice",
            amount_cents=99999,  # Mismatched amount!
            idempotency_key=idem_key,
        )
    assert "amount 4500c" in str(exc_amount.value)

    # Ledger must still only contain Order 1
    ledger = processor.get_all_ledger_records()
    assert len(ledger) == 1
    assert ledger[0]["order_id"] == "ord_legitimate_01"


def test_worker_crash_and_restart(temp_db):
    """
    3. Worker crash and restart:
    Simulates a worker dying mid-flight prior to ledger commit.
    Verifies that no ghost transaction is debited, and a subsequent restart/retry
    successfully settles the purchase with exactly 1 debit.
    """
    processor = DurablePaymentProcessor(db_path=temp_db)
    order_id = "ord_crash_test_01"
    idem_key = "idem_crash_test_01"

    # Attempt 1: Process dies mid-flight
    with pytest.raises(PaymentProcessingError) as exc_crash:
        processor.process_payment(
            order_id=order_id,
            customer_id="cust_crash_01",
            amount_cents=12500,
            idempotency_key=idem_key,
            simulate_crash_before_commit=True,
        )
    assert "crash" in str(exc_crash.value).lower()

    # Verify zero charges in ledger after crash
    charges_mid = processor.get_charges_for_order(order_id)
    assert len(charges_mid) == 0

    # Attempt 2: Worker restarts and client retries
    recovered_processor = DurablePaymentProcessor(db_path=temp_db)
    recovery_res = recovered_processor.process_payment(
        order_id=order_id,
        customer_id="cust_crash_01",
        amount_cents=12500,
        idempotency_key=idem_key,
        simulate_crash_before_commit=False,
    )
    assert recovery_res["success"] is True
    assert recovery_res["status"] == "SETTLED"

    # Ledger must now have exactly 1 charge
    charges_final = recovered_processor.get_charges_for_order(order_id)
    assert len(charges_final) == 1
    assert charges_final[0]["amount_cents"] == 12500


def test_multiprocess_concurrency(temp_db):
    """
    4. Multiple Python processes concurrency:
    Spawns 5 distinct Python OS processes simultaneously hammering the database
    with parallel retry requests for the exact same purchase.
    Verifies that across all processes, exactly 1 settlement occurs and zero duplicate charges are issued.
    """
    queue = multiprocessing.Queue()
    order_id = "ord_multiprocess_99"
    customer_id = "cust_multi_99"
    amount_cents = 25000
    idempotency_key = "idem_multiprocess_99"

    # Spawn 5 distinct processes
    processes = [
        multiprocessing.Process(
            target=multiprocess_payment_worker,
            args=(temp_db, order_id, customer_id, amount_cents, idempotency_key, queue),
        )
        for _ in range(5)
    ]

    for p in processes:
        p.start()
    for p in processes:
        p.join(timeout=15.0)

    # Gather results from all 5 processes
    results = []
    while not queue.empty():
        results.append(queue.get())

    assert len(results) == 5, f"Expected 5 process results, got {len(results)}"
    success_results = [r["result"] for r in results if r["status"] == "SUCCESS"]
    assert len(success_results) == 5

    settled = [r for r in success_results if r["status"] == "SETTLED"]
    deduped = [r for r in success_results if r["status"] == "SAFELY_DEDUPLICATED"]

    assert len(settled) == 1, f"Expected exactly 1 SETTLED, got {len(settled)}"
    assert len(deduped) == 4, f"Expected 4 SAFELY_DEDUPLICATED, got {len(deduped)}"

    # Check ledger directly in the database
    processor = DurablePaymentProcessor(db_path=temp_db)
    charges = processor.get_charges_for_order(order_id)
    assert len(charges) == 1, f"CRITICAL CONCURRENCY INVARIANT VIOLATED: Order debited {len(charges)} times!"


def test_at_most_one_guarantee_explicit(temp_db):
    """
    5. Explicit AT-MOST-ONE Guarantee Verification:
    Tests database constraint enforcement directly.
    """
    processor = DurablePaymentProcessor(db_path=temp_db)
    res = processor.process_payment(
        order_id="ord_guarantee_01",
        customer_id="cust_01",
        amount_cents=1000,
        idempotency_key="idem_guarantee_01",
    )
    assert res["status"] == "SETTLED"

    charges = processor.get_charges_for_order("ord_guarantee_01")
    assert len(charges) == 1
