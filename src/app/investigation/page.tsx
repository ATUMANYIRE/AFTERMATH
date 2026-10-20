"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Compass,
  GitBranch,
  ShieldAlert,
  Server,
  Database,
  Layers,
  ArrowRight,
  ExternalLink,
  Cpu,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
  DollarSign,
  Scale,
  Sparkles,
  Zap,
  RotateCcw,
  Eye,
  Info,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  api,
  CausalNodeItem,
  CausalGraphData,
  BlastRadiusReportItem,
  CounterfactualComparisonItem,
  CausalPathTraceItem,
} from "@/lib/api";
import { CausalFlowGraph } from "@/components/CausalFlowGraph";

export default function InvestigationPage() {
  const [selectedRelease, setSelectedRelease] = useState("rel-2026-001");
  const [selectedVariant, setSelectedVariant] = useState<"vulnerable" | "repaired" | "both">("vulnerable");
  const [selectedNode, setSelectedNode] = useState<CausalNodeItem | null>(null);
  const [activePathTrace, setActivePathTrace] = useState<CausalPathTraceItem | null>(null);
  const [isTracing, setIsTracing] = useState(false);

  // 1. Fetch Causal Graph for the active release & variant
  const {
    data: causalGraph,
    isLoading: graphLoading,
    isError: graphError,
    refetch: refetchGraph,
  } = useQuery<CausalGraphData>({
    queryKey: ["causal-graph", selectedRelease, selectedVariant],
    queryFn: () => api.getCausalGraph(selectedRelease, selectedVariant),
  });

  // 2. Fetch Blast Radius Report
  const { data: blastRadius } = useQuery<BlastRadiusReportItem>({
    queryKey: ["blast-radius", selectedRelease],
    queryFn: () => api.getBlastRadius(selectedRelease),
  });

  // 3. Fetch Counterfactual Comparison
  const { data: counterfactual } = useQuery<CounterfactualComparisonItem>({
    queryKey: ["counterfactual", selectedRelease],
    queryFn: () => api.getCounterfactualComparison(selectedRelease),
  });

  // Highlighted Node & Edge IDs from active path trace
  const highlightedNodeIds = useMemo(() => {
    if (!activePathTrace || !activePathTrace.steps) return new Set<string>();
    return new Set(activePathTrace.steps.map((s) => s.node.id));
  }, [activePathTrace]);

  const highlightedEdgeIds = useMemo(() => {
    if (!activePathTrace || !activePathTrace.steps) return new Set<string>();
    const edgeIds = new Set<string>();
    for (const step of activePathTrace.steps) {
      if (step.edge_to_next?.id) edgeIds.add(step.edge_to_next.id);
    }
    return edgeIds;
  }, [activePathTrace]);

  // Signature Interaction: Trigger automated causal path trace from Code Change to Duplicate Debit Consequence
  const handleTraceSignaturePath = async () => {
    setIsTracing(true);
    try {
      const trace = await api.traceCausalPath(
        selectedRelease,
        "cnode-code-a8f9c21b",
        "cnode-cons-double-debit",
        10
      );
      setActivePathTrace(trace);
      // Automatically select the consequence node for inspection
      if (causalGraph?.nodes) {
        const consNode = causalGraph.nodes.find((n) => n.id === "cnode-cons-double-debit");
        if (consNode) setSelectedNode(consNode);
      }
    } catch (e) {
      console.error("Path trace failed:", e);
    } finally {
      setIsTracing(false);
    }
  };

  const handleClearTrace = () => {
    setActivePathTrace(null);
  };

  if (graphLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="h-24 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="h-[550px] bg-white border border-[#ECE6DA] rounded-lg"></div>
      </div>
    );
  }

  if (graphError || !causalGraph) {
    return (
      <div className="bg-white border border-[#FECDD3] rounded-lg p-8 text-center max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0F172A] mb-1">
          Causal Graph Unavailable
        </h3>
        <p className="text-sm text-[#64748B] mb-4">
          Failed to fetch directed causal graph for {selectedRelease}.
        </p>
        <button
          onClick={() => refetchGraph()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-[#0F172A] text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  const isRepairedActive = selectedVariant === "repaired";
  const exposureDisplay = isRepairedActive
    ? "$0.00"
    : blastRadius
    ? `$${blastRadius.financial_exposure_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
    : "$1,500.00";

  return (
    <div className="space-y-6">
      {/* 1. Header & Variant Controller */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mb-1">
              <span>INVESTIGATION WORKSPACE</span>
              <span>&bull;</span>
              <span className="text-[#1D4ED8] font-medium">
                CAUSAL GRAPH &amp; BLAST RADIUS INTELLIGENCE
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#1D4ED8]" />
              Consequence Investigation &amp; Blast Radius
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Persistent directed dependency topology classifying empirical evidence, invariant violations, and counterfactual remediations.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Signature Interaction Button */}
            <button
              onClick={handleTraceSignaturePath}
              disabled={isTracing}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#BE123C] hover:bg-[#9F1239] text-white rounded transition-colors shadow-2xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span>{isTracing ? "Tracing Path..." : "Trace Duplicate Debit Causal Path"}</span>
            </button>

            {/* Time Machine Deep Link */}
            <Link
              href="/time-machine"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded transition-colors shadow-2xs"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Launch Release Time Machine</span>
            </Link>
          </div>
        </div>

        {/* Counterfactual Variant Switcher Tabs */}
        <div className="mt-5 pt-4 border-t border-[#ECE6DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
            <span className="text-[#64748B]">Active Release Variant:</span>
            <div className="inline-flex rounded-lg border border-[#ECE6DA] p-0.5 bg-[#FAF8F5]">
              <button
                onClick={() => {
                  setSelectedVariant("vulnerable");
                  handleClearTrace();
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedVariant === "vulnerable"
                    ? "bg-[#BE123C] text-white shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Vulnerable Release Baseline
              </button>
              <button
                onClick={() => {
                  setSelectedVariant("repaired");
                  handleClearTrace();
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedVariant === "repaired"
                    ? "bg-[#047857] text-white shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Repaired Release (Duo Verified)
              </button>
              <button
                onClick={() => {
                  setSelectedVariant("both");
                  handleClearTrace();
                }}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                  selectedVariant === "both"
                    ? "bg-[#1D4ED8] text-white shadow-2xs"
                    : "text-[#64748B] hover:text-[#0F172A]"
                }`}
              >
                Complete Causal Diff
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-[#64748B]">
            <span>Release: <strong className="text-[#0F172A]">{selectedRelease}</strong></span>
            <span>&bull;</span>
            <span>Topology: {causalGraph.total_nodes} nodes, {causalGraph.total_edges} edges</span>
          </div>
        </div>
      </div>

      {/* 2. Blast Radius & Impact Intelligence Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Exposure Card */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748B]">
            <span>SYNTHETIC FINANCIAL EXPOSURE</span>
            <DollarSign className="w-4 h-4 text-[#BE123C]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0F172A]">
            {exposureDisplay}
          </div>
          <p className="text-[11px] text-[#64748B]">
            {isRepairedActive
              ? "100% neutralized in repaired release"
              : "20 duplicate charges across retry windows"}
          </p>
        </div>

        {/* Direct Affected Services */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748B]">
            <span>DIRECTLY AFFECTED SERVICES</span>
            <Server className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0F172A]">
            {blastRadius ? blastRadius.directly_affected_services.length : 2} Services
          </div>
          <p className="text-[11px] text-[#64748B] truncate">
            Checkout Service &bull; Synthetic Payment Gateway
          </p>
        </div>

        {/* Downstream Cascades */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748B]">
            <span>DOWNSTREAM PROPAGATION</span>
            <Database className="w-4 h-4 text-[#B45309]" />
          </div>
          <div className="text-2xl font-bold font-mono text-[#0F172A]">
            {blastRadius ? blastRadius.downstream_affected_services.length : 2} Components
          </div>
          <p className="text-[11px] text-[#64748B] truncate">
            PostgreSQL Ledger &bull; Customer Dispute Rail
          </p>
        </div>

        {/* Invariant Status */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs space-y-1">
          <div className="flex items-center justify-between text-xs font-mono text-[#64748B]">
            <span>SAFETY INVARIANT (INV-PAY-001)</span>
            <Scale className="w-4 h-4 text-[#047857]" />
          </div>
          <div
            className={`text-lg font-bold font-mono flex items-center gap-1.5 ${
              isRepairedActive ? "text-[#047857]" : "text-[#BE123C]"
            }`}
          >
            {isRepairedActive ? "PRESERVED (100%)" : "VIOLATED (Critical)"}
          </div>
          <p className="text-[11px] text-[#64748B] truncate">
            One logical purchase must not produce multiple charges
          </p>
        </div>
      </div>

      {/* 3. Signature Causal Path Stepper (When active) */}
      {activePathTrace && activePathTrace.path_found && (
        <div className="bg-[#FFF1F2] border border-[#FECDD3] rounded-lg p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#BE123C] animate-ping"></span>
              <h3 className="text-xs font-bold font-mono uppercase text-[#9F1239]">
                Active Causal Path: Code Change &rarr; Duplicate Debit Consequence ({activePathTrace.path_length} Steps)
              </h3>
            </div>
            <button
              onClick={handleClearTrace}
              className="text-[11px] font-mono text-[#BE123C] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Path Highlight
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            {activePathTrace.steps.map((step, idx) => (
              <React.Fragment key={step.step_index}>
                <div
                  onClick={() => setSelectedNode(step.node)}
                  className={`px-2.5 py-1.5 rounded border text-xs font-mono cursor-pointer transition-all ${
                    selectedNode?.id === step.node.id
                      ? "bg-[#9F1239] text-white border-[#9F1239]"
                      : "bg-white border-[#FECDD3] text-[#9F1239] hover:bg-[#FFF1F2]"
                  }`}
                >
                  <span className="font-bold mr-1">[{idx + 1}]</span>
                  <span>{step.node.label}</span>
                </div>
                {idx < activePathTrace.steps.length - 1 && (
                  <ArrowRight className="w-4 h-4 text-[#BE123C]" />
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="text-xs text-[#78350F] bg-white/70 p-2 rounded border border-[#FECDD3]/50">
            <strong>Causal Explanation:</strong> Git commit <code>a8f9c21b</code> removed thread synchronization. Injected client retry triggers parallel execution inside the synthetic payment gateway, debited 20 customer orders twice, strictly violating invariant <code>INV-PAY-001</code>.
          </p>
        </div>
      )}

      {/* 4. Main Workspace Canvas + Evidence Inspector Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: React Flow Directed Graph (Takes 2 Columns) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1D4ED8]" />
                Interactive Causal Dependency Graph
              </h2>
              <p className="text-xs text-[#64748B]">
                Pan, zoom, and select nodes to inspect empirical evidence, provenance, and failure paths.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B]">
              <span className="px-2 py-0.5 rounded bg-white border border-[#ECE6DA]">
                {causalGraph.experimentally_supported_edges} Verified Edges
              </span>
            </div>
          </div>

          {/* Canvas Component */}
          <CausalFlowGraph
            nodes={causalGraph.nodes}
            edges={causalGraph.edges}
            selectedNodeId={selectedNode ? selectedNode.id : null}
            highlightedPathNodeIds={highlightedNodeIds}
            highlightedPathEdgeIds={highlightedEdgeIds}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Right: Evidence Inspector Panel (Takes 1 Column) */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#ECE6DA] pb-3">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1D4ED8]" />
              Evidence &amp; Provenance Inspector
            </h3>
            {selectedNode && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#ECE6DA] text-[#64748B]">
                {selectedNode.id}
              </span>
            )}
          </div>

          {selectedNode ? (
            <div className="space-y-4 text-xs font-sans">
              <div>
                <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
                  Selected Node
                </span>
                <h4 className="text-sm font-bold text-[#0F172A]">{selectedNode.label}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-[#0F172A] text-white">
                    {selectedNode.node_type.replace(/_/g, " ")}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      selectedNode.severity === "critical"
                        ? "bg-[#BE123C] text-white"
                        : selectedNode.severity === "warning"
                        ? "bg-[#B45309] text-white"
                        : selectedNode.severity === "verified" || selectedNode.severity === "mitigated"
                        ? "bg-[#047857] text-white"
                        : "bg-[#64748B] text-white"
                    }`}
                  >
                    {selectedNode.severity}
                  </span>
                </div>
              </div>

              {selectedNode.description && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
                    Description &amp; Diagnosis
                  </span>
                  <p className="text-xs text-[#334155] leading-relaxed bg-[#FAF8F5] p-2.5 rounded border border-[#ECE6DA]">
                    {selectedNode.description}
                  </p>
                </div>
              )}

              {/* Provenance Box */}
              <div>
                <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
                  Epistemic Provenance
                </span>
                <div className="p-2.5 rounded border border-[#ECE6DA] bg-white font-mono text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Provenance Type:</span>
                    <span className="font-semibold text-[#0F172A]">{selectedNode.provenance_type}</span>
                  </div>
                  {selectedNode.provenance_id && (
                    <div className="flex justify-between">
                      <span className="text-[#64748B]">Identifier:</span>
                      <span className="font-semibold text-[#1D4ED8]">{selectedNode.provenance_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Recorded At:</span>
                    <span>{new Date(selectedNode.created_at).toLocaleTimeString()}</span>
                  </div>
                </div>
              </div>

              {/* Metadata Key-Value pairs */}
              {selectedNode.metadata_json && Object.keys(selectedNode.metadata_json).length > 0 && (
                <div>
                  <span className="text-[10px] font-mono uppercase text-[#64748B] block mb-1">
                    Technical Attributes
                  </span>
                  <div className="p-2.5 rounded border border-[#ECE6DA] bg-[#FAF8F5] font-mono text-[11px] space-y-1">
                    {Object.entries(selectedNode.metadata_json)
                      .filter(([k]) => k !== "x" && k !== "y")
                      .map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span className="text-[#64748B]">{k}:</span>
                          <span className="font-bold text-[#0F172A]">{String(v)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Deep Link to Time Machine */}
              <div className="pt-2 border-t border-[#ECE6DA]">
                <Link
                  href="/time-machine"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded bg-[#0F172A] hover:bg-[#1E293B] text-white transition-colors"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Inspect Consequence in Time Machine</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-[#64748B] space-y-2">
              <Info className="w-8 h-8 text-[#94A3B8] mx-auto" />
              <p className="text-xs">
                Click any service, failure condition, invariant, or consequence node in the topology canvas to inspect verified empirical evidence.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Mobile Responsive Linear Fallback */}
      <div className="block lg:hidden bg-white border border-[#ECE6DA] rounded-lg p-5 shadow-2xs space-y-4">
        <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#1D4ED8]" />
          Sequential Causal Path (Mobile Linear View)
        </h3>
        <div className="space-y-2.5">
          {causalGraph.nodes.map((node, idx) => (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className="p-3 rounded-lg border border-[#ECE6DA] bg-[#FAF8F5] text-xs space-y-1 cursor-pointer hover:border-[#1D4ED8]"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase text-[#64748B]">
                  Step {idx + 1} &bull; {node.node_type}
                </span>
                <span className="font-mono text-[9px] font-bold px-1.5 py-0.2 rounded uppercase bg-[#0F172A] text-white">
                  {node.severity}
                </span>
              </div>
              <h5 className="font-bold text-[#0F172A]">{node.label}</h5>
              {node.description && (
                <p className="text-[11px] text-[#475569]">{node.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
