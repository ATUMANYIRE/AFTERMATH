"""
Comprehensive test suite for the AFTERMATH Causal Graph & Blast Radius Engine.
Verifies epistemic classification, graph traversal, cycle handling, bounded depth limits,
blast radius calculations, and counterfactual comparison.
"""
import pytest
from contextlib import asynccontextmanager
from app.services.causal_engine import CausalGraphEngine
from app.models.causal_node import CausalNode
from app.models.causal_edge import CausalEdge


@asynccontextmanager
async def _session(db):
    """Use the isolated, seeded in-memory test database from conftest (never the development DB)."""
    yield db


@pytest.mark.asyncio
async def test_causal_graph_baseline_population(test_db):
    """Verifies deterministic causal graph nodes, edges, and epistemic classifications."""
    async with _session(test_db) as session:
        graph = await CausalGraphEngine.get_causal_graph(session, "rel-2026-001", variant="vulnerable")

        assert graph.release_id == "rel-2026-001"
        assert graph.total_nodes >= 10
        assert graph.total_edges >= 7
        assert graph.experimentally_supported_edges > 0
        assert graph.observed_edges > 0
        assert graph.inferred_edges > 0

        node_types = {n.node_type for n in graph.nodes}
        assert "code_change" in node_types
        assert "failure_condition" in node_types
        assert "service" in node_types
        assert "invariant" in node_types
        assert "observed_consequence" in node_types


@pytest.mark.asyncio
async def test_causal_path_tracing(test_db):
    """Verifies directed causal path from code change to duplicate debit consequence."""
    async with _session(test_db) as session:
        path = await CausalGraphEngine.trace_causal_path(
            session,
            release_id="rel-2026-001",
            source_node_id="cnode-code-a8f9c21b",
            target_node_id="cnode-cons-double-debit",
            max_depth=10,
        )

        assert path.path_found is True
        assert path.path_length >= 3
        assert path.highest_severity == "critical"
        assert path.root_cause_node_id == "cnode-code-a8f9c21b"
        assert path.mitigating_remediation_id == "cnode-rem-durable-lock"

        # Check steps sequence
        labels = [step.node.label for step in path.steps]
        assert any("Git Commit" in l for l in labels)
        assert any("Double Debit" in l or "Duplicate Debit" in l for l in labels)


@pytest.mark.asyncio
async def test_cycle_handling_and_bounded_traversal(test_db):
    """Verifies that cycles in the dependency graph do not cause infinite loops and respect max_depth."""
    async with _session(test_db) as session:
        # Trace path with max_depth=1 to confirm early bounding
        bounded_path = await CausalGraphEngine.trace_causal_path(
            session,
            release_id="rel-2026-001",
            source_node_id="cnode-code-a8f9c21b",
            target_node_id="cnode-cons-double-debit",
            max_depth=1,
        )
        assert bounded_path.path_found is False

        # Non-existent path returns clean path_found=False without error
        non_existent = await CausalGraphEngine.trace_causal_path(
            session,
            release_id="rel-2026-001",
            source_node_id="cnode-svc-postgres",
            target_node_id="cnode-code-a8f9c21b",
            max_depth=5,
        )
        assert non_existent.path_found is False


@pytest.mark.asyncio
async def test_blast_radius_calculation(test_db):
    """Verifies deterministic blast-radius calculations with direct/downstream services and exposure."""
    async with _session(test_db) as session:
        blast = await CausalGraphEngine.calculate_blast_radius(session, "rel-2026-001")

        assert blast.release_id == "rel-2026-001"
        assert blast.severity == "CRITICAL"
        assert len(blast.directly_affected_services) >= 2
        assert len(blast.downstream_affected_services) >= 1
        assert "INV-PAY-001: Exactly-One-Charge-Per-Purchase" in blast.violated_invariants[0]
        assert blast.financial_exposure_usd == 1500.0
        assert blast.financial_exposure_cents == 150000
        assert len(blast.assumptions) >= 2


@pytest.mark.asyncio
async def test_counterfactual_comparison(test_db):
    """Verifies side-by-side counterfactual blast radius comparison between vulnerable and repaired releases."""
    async with _session(test_db) as session:
        comparison = await CausalGraphEngine.get_counterfactual_comparison(
            session, "rel-2026-001", scenario_id="lost-response-retry"
        )

        assert comparison.release_id == "rel-2026-001"
        assert comparison.vulnerable_blast_radius.severity == "CRITICAL"
        assert comparison.repaired_blast_radius.severity == "LOW"
        assert comparison.eliminated_financial_risk_usd >= 1240.0
        assert len(comparison.mitigated_consequences) >= 2
        assert len(comparison.preserved_invariants) >= 1
        assert "VERIFIED" in comparison.causal_fix_verification


@pytest.mark.asyncio
async def test_variant_filtering_in_graph(test_db):
    """Verifies that repaired variant reflects neutralized failure condition and active remediation edges."""
    async with _session(test_db) as session:
        vuln_graph = await CausalGraphEngine.get_causal_graph(session, "rel-2026-001", variant="vulnerable")
        rep_graph = await CausalGraphEngine.get_causal_graph(session, "rel-2026-001", variant="repaired")

        # Repaired graph should have mitigated status on failure node
        fail_node = next(n for n in rep_graph.nodes if n.id == "cnode-fail-missing-lock")
        assert fail_node.severity == "mitigated"
        assert fail_node.status == "neutralized"

        # Vulnerable graph should have critical status on failure node
        vuln_fail_node = next(n for n in vuln_graph.nodes if n.id == "cnode-fail-missing-lock")
        assert vuln_fail_node.severity == "critical"


@pytest.mark.asyncio
async def test_api_causal_graph_endpoints(client):
    """Verifies REST API endpoints for causal graph, blast radius, counterfactuals, and path tracing."""
    # 1. Causal Graph
    resp = await client.get("/api/v1/investigation/rel-2026-001/causal-graph?variant=vulnerable")
    assert resp.status_code == 200
    data = resp.json()
    assert data["release_id"] == "rel-2026-001"
    assert data["total_nodes"] >= 10
    assert "experimentally_supported_edges" in data

    # 2. Blast Radius
    resp = await client.get("/api/v1/investigation/rel-2026-001/blast-radius")
    assert resp.status_code == 200
    blast = resp.json()
    assert blast["severity"] == "CRITICAL"
    assert blast["financial_exposure_usd"] == 1500.0

    # 3. Counterfactual Comparison
    resp = await client.get("/api/v1/investigation/rel-2026-001/counterfactual")
    assert resp.status_code == 200
    comp = resp.json()
    assert comp["eliminated_financial_risk_usd"] >= 1240.0

    # 4. Trace Path (GET)
    resp = await client.get(
        "/api/v1/investigation/rel-2026-001/trace-path?source_node_id=cnode-code-a8f9c21b&target_node_id=cnode-cons-double-debit"
    )
    assert resp.status_code == 200
    trace = resp.json()
    assert trace["path_found"] is True
    assert trace["path_length"] >= 3

    # 5. Trace Path (POST)
    resp = await client.post(
        "/api/v1/investigation/rel-2026-001/trace-path",
        json={
            "source_node_id": "cnode-code-a8f9c21b",
            "target_node_id": "cnode-cons-double-debit",
            "max_depth": 8,
        },
    )
    assert resp.status_code == 200
    trace_post = resp.json()
    assert trace_post["path_found"] is True


@pytest.mark.asyncio
async def test_causal_graph_unknown_release_returns_404(client):
    """Genuinely nonexistent releases must keep returning 404."""
    resp = await client.get("/api/v1/investigation/rel-does-not-exist/causal-graph?variant=vulnerable")
    assert resp.status_code == 404
