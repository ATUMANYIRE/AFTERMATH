"""
Test suite for target PaymentProcessor.
Verifies the core safety invariant:
ONE LOGICAL PURCHASE MUST NOT PRODUCE MULTIPLE CHARGES (INV-PAY-001)
"""
import pytest
import asyncio
from services.payment_worker.processor import PaymentProcessor


@pytest.mark.asyncio
async def test_single_payment_succeeds():
    """Baseline test: Single payment settles cleanly."""
    processor = PaymentProcessor()
    res = await processor.process_payment(
        order_id="ord_baseline_01",
        customer_id="cust_101",
        amount_cents=5000,
        idempotency_key="idem_key_baseline_01",
        simulated_network_delay_ms=10,
    )
    assert res["success"] is True
    assert res["status"] == "SETTLED"
    charges = processor.get_charges_for_order("ord_baseline_01")
    assert len(charges) == 1


@pytest.mark.asyncio
async def test_concurrent_retries_invariant():
    """
    CRITICAL INVARIANT TEST:
    Under concurrent retries or lost responses, ONE logical purchase must not produce multiple charges.
    Vulnerable processor fails this test by settling multiple charges for the same order.
    Patched processor must pass by atomically deduplicating concurrent attempts.
    """
    processor = PaymentProcessor()
    order_id = "ord_concurrent_99"
    idempotency_key = "idem_key_concurrent_99"

    # Dispatch 5 concurrent retry attempts simultaneously
    tasks = [
        processor.process_payment(
            order_id=order_id,
            customer_id="cust_7781",
            amount_cents=12000,
            idempotency_key=idempotency_key,
            simulated_network_delay_ms=40,
        )
        for _ in range(5)
    ]

    results = await asyncio.gather(*tasks)

    # Invariant assertion
    charges = processor.get_charges_for_order(order_id)
    duplicate_charges = len(charges) - 1

    assert (
        len(charges) == 1
    ), f"INVARIANT VIOLATED (INV-PAY-001): Order {order_id} debited {len(charges)} times! Duplicate charges: {duplicate_charges}"


@pytest.mark.asyncio
async def test_subsequent_retry_deduplication():
    """Tests that subsequent retry returns the cached receipt."""
    processor = PaymentProcessor()
    res1 = await processor.process_payment(
        order_id="ord_subsequent_02",
        customer_id="cust_202",
        amount_cents=3500,
        idempotency_key="idem_subsequent_02",
        simulated_network_delay_ms=10,
    )
    assert res1["status"] == "SETTLED"

    res2 = await processor.process_payment(
        order_id="ord_subsequent_02",
        customer_id="cust_202",
        amount_cents=3500,
        idempotency_key="idem_subsequent_02",
        simulated_network_delay_ms=10,
    )
    assert res2["is_duplicate"] is True
    charges = processor.get_charges_for_order("ord_subsequent_02")
    assert len(charges) == 1
