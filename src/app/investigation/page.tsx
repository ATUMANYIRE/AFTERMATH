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
  RefreshCw,
  GitCommit,
  Wrench,
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
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/tabs";

export default function InvestigationPage() {
  const [selectedRelease] = useState("rel-2026-001");
  const [selectedVariant, setSelectedVariant] = useState<"vulnerable" | "repaired" | "both">("vulnerable");
  const [selectedNode, setSelectedNode] = useState<CausalNodeItem | null>(null);
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [activePathTrace, setActivePathTrace] = useState<CausalPathTraceItem | null>(null);
  const [isTracing, setIsTracing] = useState(false);

  // 1. Fetch Causal Graph for active release & variant
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
        <div className="h-28 bg-white rounded-[13px] border border-[#ECEEF1]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-[13px] border border-[#ECEEF1]" />
          ))}
        </div>
        <div className="h-[580px] bg-white rounded-[13px] border border-[#ECEEF1]" />
      </div>
    );
  }

  if (graphError || !causalGraph) {
    return (
      <div className="bg-white border border-[#ECEEF1] rounded-[13px] p-10 text-center max-w-xl mx-auto my-16">
        <div className="w-12 h-12 rounded-full bg-[#F4F5F7] text-[#FF6A13] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-[14px]  text-[#191C24] mb-1">
          Causal Graph Unavailable
        </h3>
        <p className="text-[13px] text-[#747B87] mb-6">
          Failed to fetch directed causal graph for {selectedRelease}.
        </p>
        <Button onClick={() => refetchGraph()} variant="primary" icon={<RefreshCw className="w-4 h-4" />}>
          Retry Query
        </Button>
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
    <div className="space-y-8">
      {/* =========================================================================
          1. HEADER & INTERACTIVE TRACE CONTROLS
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <span className="sr-only">Causal Graph &amp; Blast Radius · Empirical Dependency Intelligence</span>
          <h1 className="typo-page-title text-[#191C24]">
            Causal Graph &amp; Blast Radius
          </h1>
          <p className="typo-description text-[#747B87] mt-0.5">How a code defect spreads into customer financial risk.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 sm:shrink-0">
          {activePathTrace && (
            <Button onClick={handleClearTrace} variant="outline" size="md" icon={<RotateCcw className="w-3.5 h-3.5" />}>
              Reset Trace
            </Button>
          )}
          <Button
            onClick={handleTraceSignaturePath}
            disabled={isTracing}
            variant="primary"
            size="md"
            icon={<Zap className="w-4 h-4 fill-current" />}
          >
            {isTracing ? "Tracing Causal Path..." : "Trace Duplicate Debit Causal Path"}
          </Button>
        </div>
      </div>

      {/* =========================================================================
          2. METRIC STAT CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          tag="Topological Nodes"
          tagVariant="accent"
          title="Total Causal Nodes"
          value={causalGraph.nodes.length}
          delta={{
            value: "11 Empirical Code & System Entities",
            isPositive: true,
          }}
          subStats={[
            { label: "Code Entities", value: "3 AST Elements" },
            { label: "Runtime Entities", value: "8 System Events" },
          ]}
        />

        <StatCard
          tag="Directed Edges"
          tagVariant="default"
          title="Dependency Edges"
          value={causalGraph.edges.length}
          delta={{
            value: "8 Proven Causal Pathways",
            isPositive: true,
          }}
          subStats={[
            { label: "Experimentally Proven", value: "5 Edges" },
            { label: "Inferred Effects", value: "3 Edges" },
          ]}
        />

        <StatCard
          tag="Quantified Risk"
          tagVariant={isRepairedActive ? "success" : "error"}
          title="Financial Blast Radius"
          value={exposureDisplay}
          delta={{
            value: isRepairedActive ? "Completely Mitigated" : "Active Customer Risk",
            isRisk: !isRepairedActive,
            isPositive: isRepairedActive,
          }}
          subStats={[
            { label: "Affected Orders", value: isRepairedActive ? "0 Orders" : "12 Orders" },
            { label: "Max Single Charge", value: "$120.00" },
          ]}
        />

        <StatCard
          tag="Cascading Failure"
          tagVariant="warning"
          title="Connection Starvation"
          value="1,600ms"
          delta={{
            value: "PostgreSQL Pool Depleted (342 Waiters)",
            isRisk: true,
          }}
          subStats={[
            { label: "Max Pool Size", value: "100" },
            { label: "Cascading Services", value: "3 Degraded" },
          ]}
        />
      </div>

      {/* =========================================================================
          3. SIGNATURE CAUSAL PATH STEPPER (When trace active)
          ========================================================================= */}
      {activePathTrace && activePathTrace.path_found && (
        <div className="bg-[#F4F5F7]/70 border border-[#ECEEF1] rounded-[13px] p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#FF6A13] animate-ping" />
              <h3 className="text-[12px]  text-[#FF6A13]">
                Active Causal Path: Code Change &rarr; Duplicate Debit Consequence ({activePathTrace.path_length} Steps)
              </h3>
            </div>
            <button
              onClick={handleClearTrace}
              className="text-[11px] font-mono text-[#FF6A13] hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              Reset Path Highlight
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-[12px]">
            {activePathTrace.steps.map((step, idx) => (
              <React.Fragment key={step.step_index}>
                <div
                  onClick={() => setSelectedNode(step.node)}
                  className={`px-2.5 py-1.5 rounded-[13px] border text-[12px] font-mono cursor-pointer transition-all ${
                    selectedNode?.id === step.node.id
                      ? "bg-[#FF6A13] text-white border-[#FF6A13]"
                      : "bg-white border-[#ECEEF1] text-[#FF6A13] hover:bg-[#F4F5F7]"
                  }`}
                >
                  <span className=" mr-1">[{idx + 1}]</span>
                  <span>{step.node.label}</span>
                </div>
                {idx < activePathTrace.steps.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-[#191C24]" />
                )}
              </React.Fragment>
            ))}
          </div>

          <p className="text-[12px] text-[#191C24] bg-white p-3 rounded-[13px] border border-[#ECEEF1]/60 leading-relaxed">
            <strong className="text-[#FF6A13]">Causal Explanation:</strong> Git commit <code>a8f9c21b</code> removed thread synchronization. Injected client retry triggers parallel execution inside the synthetic payment gateway, debited customer orders twice, strictly violating invariant <code>INV-PAY-001</code>.
          </p>
        </div>
      )}

      {/* =========================================================================
          4. MAIN CANVAS & CONTEXTUAL EVIDENCE INSPECTOR (Split Layout)
          ========================================================================= */}
      <div className={`grid grid-cols-1 gap-4 ${inspectorOpen ? "lg:grid-cols-[minmax(0,1fr)_340px]" : ""}`}>
        {/* Graph Canvas Column (8 cols) */}
        <div className="min-w-0 space-y-3">
          <div className="bg-white rounded-[13px] border border-[#ECEEF1] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-[12px]  text-[#191C24]">Release Variant:</span>
              <SegmentedTabs
                size="sm"
                options={[
                  { id: "vulnerable", label: "Vulnerable (Unpatched)" },
                  { id: "repaired", label: "Repaired" },
                  { id: "both", label: "Both (Superposition)" },
                ]}
                activeId={selectedVariant}
                onChange={(id) => setSelectedVariant(id as any)}
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setInspectorOpen((v) => !v)}
              aria-expanded={inspectorOpen}
            >
              {inspectorOpen ? "Hide inspector" : "Show inspector"}
            </Button>
          </div>

          {/* Interactive Graph Canvas */}
          <CausalFlowGraph
            nodes={causalGraph.nodes}
            edges={causalGraph.edges}
            selectedNodeId={selectedNode?.id || null}
            highlightedPathNodeIds={highlightedNodeIds}
            highlightedPathEdgeIds={highlightedEdgeIds}
            onSelectNode={(node) => setSelectedNode(node)}
          />
        </div>

        {/* Evidence & Node Inspector Column (4 cols) */}
        {inspectorOpen && (
        <div className="min-w-0">
          <Card className="flex flex-col justify-between lg:sticky lg:top-4 lg:max-h-[calc(100vh-32px)] overflow-y-auto">
            <div>
              <CardHeader className="border-b border-[#ECEEF1]/80 pb-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12px]  text-[#747B87]">
                    Contextual Inspector
                  </span>
                  {selectedNode && (
                    <Badge variant={selectedNode.severity === "critical" ? "error" : "accent"}>
                      {selectedNode.severity}
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-[14px] mt-1">
                  {selectedNode ? selectedNode.label : "Select a Node to Inspect"}
                </CardTitle>
                <CardDescription>
                  {selectedNode
                    ? `Entity type: ${selectedNode.node_type.replace(/_/g, " ")}`
                    : "Click any graph node to inspect empirical citations and provenance"}
                </CardDescription>
              </CardHeader>

              <CardContent className="pt-4 space-y-4 text-[12px]">
                {selectedNode ? (
                  <>
                    <div>
                      <span className="text-[#747B87]  block mb-1">Description:</span>
                      <p className="text-[#191C24] leading-relaxed bg-[#F8F9FB] p-3 rounded-[13px] border border-[#ECEEF1]/70">
                        {selectedNode.description || "No extended description provided."}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <div className="p-2.5 rounded-[13px] bg-[#F8F9FB] border border-[#ECEEF1]/70">
                        <span className="text-[#747B87] block text-[10px] ">Provenance Type</span>
                        <span className=" text-[#191C24] block mt-0.5">
                          {selectedNode.provenance_type.replace(/_/g, " ")}
                        </span>
                      </div>
                      <div className="p-2.5 rounded-[13px] bg-[#F8F9FB] border border-[#ECEEF1]/70">
                        <span className="text-[#747B87] block text-[10px] ">Provenance Ref</span>
                        <span className="font-mono  text-[#191C24] block mt-0.5 truncate">
                          {selectedNode.provenance_id || "N/A"}
                        </span>
                      </div>
                    </div>

                    {selectedNode.metadata_json && (
                      <div>
                        <span className="text-[#747B87] block mb-1">Evidence details</span>
                        <dl className="divide-y divide-[#ECEEF1] border border-[#ECEEF1] rounded-[10px]">
                          {Object.entries(selectedNode.metadata_json)
                            .filter(([k]) => !["x", "y", "raw_log_excerpt"].includes(k))
                            .map(([k, v]) => (
                              <div key={k} className="flex items-baseline justify-between gap-3 px-3 py-1.5">
                                <dt className="text-[#747B87] whitespace-nowrap">{k.replace(/_/g, " ")}</dt>
                                <dd className="text-[#191C24] text-right break-all">{String(v)}</dd>
                              </div>
                            ))}
                        </dl>
                      </div>
                    )}

                    {Boolean(selectedNode.metadata_json?.raw_log_excerpt) && (
                      <div>
                        <span className="text-[#747B87]  block mb-1">Empirical Log Evidence:</span>
                        <pre className="p-3 bg-[#F4F5F7] text-[#191C24] rounded-[13px] font-mono text-[10px] overflow-x-auto leading-relaxed">
                          {String(selectedNode.metadata_json.raw_log_excerpt)}
                        </pre>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-12 text-center text-[#747B87] space-y-3">
                    <Compass className="w-10 h-10 text-[#191C24]/40 mx-auto" />
                    <p className="max-w-xs mx-auto">
                      Click on any node in the canvas or use the <strong className="text-[#191C24]">Trace Duplicate Debit Causal Path</strong> button to step through the causal sequence.
                    </p>
                  </div>
                )}
              </CardContent>
            </div>

            {selectedNode && (
              <div className="p-4 border-t border-[#ECEEF1] bg-[#F8F9FB] rounded-b-[13px] flex flex-col gap-2">
                <Link href="/remediation" className="w-full block">
                  <Button variant="primary" size="sm" icon={<Wrench className="w-3.5 h-3.5" />} className="w-full justify-center">
                    Proceed to Remediation Studio
                  </Button>
                </Link>
                <Link href="/time-machine" className="w-full block">
                  <Button variant="outline" size="sm" icon={<Clock className="w-3.5 h-3.5" />} className="w-full justify-center text-[#747B87] hover:text-[#191C24]">
                    Inspect Consequence in Time Machine
                  </Button>
                </Link>
              </div>
            )}
          </Card>
        </div>
        )}
      </div>

      {/* =========================================================================
          4. QUANTIFIED BLAST RADIUS BREAKDOWN TABLE
          ========================================================================= */}
      {blastRadius && (
        <div className="bg-white rounded-[13px] border border-[#ECEEF1] overflow-hidden">
          <div className="p-6 border-b border-[#ECEEF1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-[14px]  text-[#191C24]">
                Empirical Blast Radius Breakdown
              </h3>
              <p className="text-[12px] text-[#747B87] mt-0.5">
                Downstream services impacted by the concurrency defect in services/payment_worker/processor.py
              </p>
            </div>
            <span className="text-[12px] font-mono px-2.5 py-1 rounded-full bg-[#F4F5F7] text-[#FF6A13]  border border-[#ECEEF1]">
              Total Risk: ${blastRadius.financial_exposure_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#F8F9FB] text-[#747B87]  border-b border-[#ECEEF1]">
                <tr>
                  <th className="px-6 py-3">Impacted Service</th>
                  <th className="px-5 py-3">Cascading Failure Mode</th>
                  <th className="px-5 py-3">Onset Latency</th>
                  <th className="px-5 py-3">Empirical Evidence</th>
                  <th className="px-6 py-3">Remediated State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1]/60">
                <tr className="hover:bg-[#F8F9FB]/50">
                  <td className="px-6 py-3.5  font-mono text-[#191C24] whitespace-nowrap">
                    payment-service
                  </td>
                  <td className="px-5 py-3.5 text-[#FF6A13]  whitespace-nowrap">
                    INV-PAY-001 Double Debits (4 charges)
                  </td>
                  <td className="px-5 py-3.5 typo-table-body text-[#747B87] whitespace-nowrap">
                    +40ms race gap
                  </td>
                  <td className="px-5 py-3.5 typo-table-body text-[#747B87] whitespace-nowrap">
                    exp-vuln-001 (5 concurrent checkouts)
                  </td>
                  <td className="px-6 py-3.5 text-[#191C24]  whitespace-nowrap">
                    0 Duplicate Debits (Deduped)
                  </td>
                </tr>

                <tr className="hover:bg-[#F8F9FB]/50">
                  <td className="px-6 py-3.5  font-mono text-[#191C24] whitespace-nowrap">
                    ledger-db (PostgreSQL 16)
                  </td>
                  <td className="px-5 py-3.5 text-[#FF6A13]  whitespace-nowrap">
                    Connection Pool Starvation (342 Waiters)
                  </td>
                  <td className="px-5 py-3.5 typo-table-body text-[#747B87] whitespace-nowrap">
                    +1,600ms onset
                  </td>
                  <td className="px-5 py-3.5 typo-table-body text-[#747B87] whitespace-nowrap">
                    evi-002 (Pool max size 100 exhausted)
                  </td>
                  <td className="px-6 py-3.5 text-[#191C24]  whitespace-nowrap">
                    Pool Nominal (0 Waiters)
                  </td>
                </tr>

                <tr className="hover:bg-[#F8F9FB]/50">
                  <td className="px-6 py-3.5  font-mono text-[#191C24] whitespace-nowrap">
                    checkout-worker
                  </td>
                  <td className="px-5 py-3.5 text-[#FF6A13]  whitespace-nowrap">
                    Retry Storm Cascade
                  </td>
                  <td className="px-5 py-3.5 typo-table-body text-[#747B87] whitespace-nowrap">
                    +2,100ms onset
                  </td>
                  <td className="px-5 py-3.5 typo-table-body text-[#747B87] whitespace-nowrap">
                    Unbounded Exponential Retries
                  </td>
                  <td className="px-6 py-3.5 text-[#191C24]  whitespace-nowrap">
                    Single Execution (SLA 68ms)
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
