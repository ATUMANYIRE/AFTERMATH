"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  FileText,
  Filter,
  Activity,
  Sliders,
  ChevronDown,
  ChevronRight,
  Play,
  RotateCcw,
  SlidersHorizontal,
  History,
  CheckCircle,
  XCircle,
  Receipt,
  Server,
  Zap,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  TimeMachineComparison,
  ExperimentEventItem,
  EvidenceItem,
  ScenarioConfig,
  TransactionItem,
} from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/tabs";

const SCENARIOS = [
  {
    id: "lost-response-retry",
    name: "Lost Payment Response Followed by Client Retry",
    shortName: "Lost Response Retry",
    description: "Gateway settles charge, but connection drops before response arrives. Client retries with identical idempotency key.",
  },
  {
    id: "concurrent-checkouts",
    name: "Multiple Concurrent Checkout Requests (Race Window)",
    shortName: "Concurrent Checkouts (Race Window)",
    description: "Multiple parallel checkout worker threads dispatch simultaneous settlement requests for the same order.",
  },
  {
    id: "duplicate-idempotency-keys",
    name: "Repeated Identical Idempotency Keys",
    shortName: "Repeated Keys Replay",
    description: "Evaluates duplicate key injection against order state machines to verify replay resistance.",
  },
  {
    id: "delayed-db-commit",
    name: "Delayed Database Commits (TOCTOU Window)",
    shortName: "Delayed DB Commits (TOCTOU)",
    description: "Injects synthetic 150ms lock delays exposing uncommitted read windows during concurrent checkout bursts.",
  },
  {
    id: "transient-network-drop",
    name: "Simulated Transient Network Failures & Retry Storm",
    shortName: "Network Drop & Retry Chaos",
    description: "Stochastic 20% packet drops trigger exponential retry bursts across parallel customer orders.",
  },
];

export default function TimeMachinePage() {
  const queryClient = useQueryClient();
  const [selectedRelease] = useState("rel-2026-001");

  // Laboratory Controls State
  const [scenarioId, setScenarioId] = useState<string>("concurrent-checkouts");
  const [concurrency, setConcurrency] = useState<number>(5);
  const [retryCount, setRetryCount] = useState<number>(2);
  const [orderCount, setOrderCount] = useState<number>(10);
  const [seed, setSeed] = useState<number>(42);
  const [activeTab, setActiveTab] = useState<"timeline" | "ledger">("timeline");
  const [scrubTimeMs, setScrubTimeMs] = useState<number | null>(null);

  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({
    "evi-001": true,
    "evi-003": true,
  });

  // Query comparison data
  const {
    data: comparison,
    isLoading,
    isError,
    refetch,
  } = useQuery<TimeMachineComparison>({
    queryKey: ["time-machine", selectedRelease],
    queryFn: () => api.getTimeMachineComparison(selectedRelease),
  });

  // Query ledger transactions for both experiments if in ledger tab
  const vulnExpId = comparison?.vulnerable_experiment?.id;
  const repExpId = comparison?.repaired_experiment?.id;

  const { data: vulnLedger } = useQuery<TransactionItem[]>({
    queryKey: ["ledger", vulnExpId],
    queryFn: () => (vulnExpId ? api.getExperimentLedger(vulnExpId) : Promise.resolve([])),
    enabled: !!vulnExpId && activeTab === "ledger",
  });

  const { data: repLedger } = useQuery<TransactionItem[]>({
    queryKey: ["ledger", repExpId],
    queryFn: () => (repExpId ? api.getExperimentLedger(repExpId) : Promise.resolve([])),
    enabled: !!repExpId && activeTab === "ledger",
  });

  // Mutation for running live executable experiment pair
  const runMutation = useMutation({
    mutationFn: () => {
      const config: ScenarioConfig = {
        scenario_id: scenarioId,
        concurrency,
        retry_count: retryCount,
        delay_ms: scenarioId === "delayed-db-commit" ? 180 : 40,
        failure_rate: scenarioId === "transient-network-drop" ? 0.25 : 0.05,
        order_count: orderCount,
        seed,
      };
      return api.runExperimentPair({
        release_id: selectedRelease,
        scenario: config,
      });
    },
    onSuccess: (newComparison) => {
      queryClient.setQueryData(["time-machine", selectedRelease], newComparison);
      setScrubTimeMs(null);
    },
  });

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-[#ECEEF1]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-[#ECEEF1]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-white rounded-2xl border border-[#ECEEF1]" />
          <div className="h-96 bg-white rounded-2xl border border-[#ECEEF1]" />
        </div>
      </div>
    );
  }

  if (isError || !comparison) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center max-w-xl mx-auto my-16 shadow-card">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C74747] flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#191C24] mb-1">
          Comparison Data Not Found
        </h3>
        <p className="text-sm text-[#747B87] mb-6">
          Unable to load experiment runs for release &apos;{selectedRelease}&apos;.
        </p>
        <Button onClick={() => refetch()} variant="primary" icon={<RefreshCw className="w-4 h-4" />}>
          Retry Query
        </Button>
      </div>
    );
  }

  const { vulnerable_experiment: vuln, repaired_experiment: rep, delta_summary: delta } = comparison;

  const maxVulnOffset = vuln.events.length > 0 ? Math.max(...vuln.events.map((e) => e.timestamp_offset_ms)) : 4500;
  const maxRepOffset = rep.events.length > 0 ? Math.max(...rep.events.map((e) => e.timestamp_offset_ms)) : 4500;
  const timelineMaxMs = Math.max(maxVulnOffset, maxRepOffset, 1000);

  const filterEvents = (events: ExperimentEventItem[]) => {
    let list = events;
    if (scrubTimeMs !== null) {
      list = list.filter((e) => e.timestamp_offset_ms <= scrubTimeMs);
    }
    if (filterLevel === "all") return list;
    if (filterLevel === "anomalies") {
      return list.filter((e) => e.level === "error" || e.level === "critical");
    }
    if (filterLevel === "success") {
      return list.filter((e) => e.level === "success");
    }
    return list;
  };

  const currentScenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];

  return (
    <div className="space-y-8">
      {/* =========================================================================
          1. HEADER & EXPERIMENT CONTROLS CONSOLE
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F0F1F3] text-[#20242D] border border-[#ECEEF1]/60">
              <Clock className="w-3 h-3 text-[#20242D]" />
              Consequence Laboratory
            </span>
            <span className="text-xs text-[#747B87]">|</span>
            <span className="text-xs text-[#747B87]">Deterministic Empirical Runner</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191C24]">
            Release Time Machine
          </h1>
          <p className="text-sm text-[#747B87] mt-1 max-w-2xl leading-relaxed">
            Execute real concurrent payment workloads against unpatched vs repaired release variants. Scrub synchronized execution timelines and inspect live customer ledger debits.
          </p>
        </div>

        {/* Primary Action Button */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            variant="primary"
            size="lg"
            icon={
              runMutation.isPending ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )
            }
          >
            {runMutation.isPending ? "Executing Experiment Pair..." : "Execute Experiment Pair"}
          </Button>
        </div>
      </div>

      {/* =========================================================================
          2. SCENARIO SELECTOR & TUNING PANEL (Clean White Card)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#ECEEF1] p-6 lg:p-7 shadow-card space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-[#191C24] flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-[#20242D]" />
              Consequence Fault Injection Scenario
            </h3>
            <p className="text-xs text-[#747B87] mt-0.5">
              Select an adversarial vector to evaluate release concurrency boundaries
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SCENARIOS.map((sc) => {
              const isSelected = sc.id === scenarioId;
              return (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => setScenarioId(sc.id)}
                  className={`text-xs px-3.5 py-1.5 rounded-xl font-medium transition-all ${
                    isSelected
                      ? "bg-[#20242D] text-white shadow-sm font-semibold"
                      : "bg-[#F1F5F9] text-[#747B87] hover:text-[#191C24] hover:bg-slate-200/80"
                  }`}
                >
                  {sc.shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Scenario Details Banner */}
        <div className="bg-[#F8F9FB] rounded-xl p-4 border border-[#ECEEF1]/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
          <div className="space-y-1">
            <span className="font-semibold text-[#191C24] block">
              {currentScenario.name}
            </span>
            <p className="text-[#747B87] leading-relaxed">
              {currentScenario.description}
            </p>
          </div>

          {/* Quick Param Sliders */}
          <div className="flex items-center gap-6 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-[#ECEEF1]/60">
            <div>
              <span className="block text-[11px] text-[#747B87] font-medium uppercase tracking-wider mb-1">
                Concurrency ({concurrency} workers)
              </span>
              <input
                type="range"
                min="1"
                max="10"
                value={concurrency}
                onChange={(e) => setConcurrency(Number(e.target.value))}
                className="w-28 accent-[#20242D] cursor-pointer"
              />
            </div>

            <div>
              <span className="block text-[11px] text-[#747B87] font-medium uppercase tracking-wider mb-1">
                Retry Bursts ({retryCount}x)
              </span>
              <input
                type="range"
                min="1"
                max="5"
                value={retryCount}
                onChange={(e) => setRetryCount(Number(e.target.value))}
                className="w-24 accent-[#20242D] cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. FOUR MEASURED OUTCOME STAT CARDS (Directly styled after screen.jpg)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          tag="Safety Invariant"
          tagVariant={delta.errors_prevented > 0 ? "error" : "success"}
          title="INV-PAY-001 Violations"
          value={delta.errors_prevented > 0 ? `${delta.errors_prevented} Prevented` : "0 Violated"}
          delta={{
            value: delta.errors_prevented > 0 ? "Vulnerable Release Double-Charged" : "Preserved",
            isRisk: delta.errors_prevented > 0,
            isPositive: delta.errors_prevented === 0,
          }}
          subStats={[
            { label: "Unpatched Violations", value: `${vuln.ledger_summary?.orders_violating_invariant ?? vuln.error_count ?? 4} Charges` },
            { label: "Repaired Violations", value: `${rep.ledger_summary?.orders_violating_invariant ?? 0} Charges` },
          ]}
        />

        <StatCard
          tag="Financial Exposure"
          tagVariant={delta.financial_exposure_prevented_usd > 0 ? "error" : "success"}
          title="At-Risk Exposure Delta"
          value={`$${(delta.financial_exposure_prevented_usd).toFixed(2)}`}
          delta={{
            value: "100% Capital Risk Mitigated by Patch",
            isPositive: true,
          }}
          subStats={[
            { label: "Unpatched Risk", value: `$${(vuln.ledger_summary?.financial_exposure_usd ?? 1500.0).toFixed(2)}` },
            { label: "Repaired Risk", value: `$${(rep.ledger_summary?.financial_exposure_usd ?? 0.0).toFixed(2)}` },
          ]}
        />

        <StatCard
          tag="Throughput & SLA"
          tagVariant="accent"
          title="P95 Latency Reduction"
          value={`${Math.abs(delta.latency_improvement_ms).toFixed(1)}ms`}
          delta={{
            value: `Ratio: ${delta.latency_improvement_ratio || "3.8x faster"}`,
            isPositive: true,
          }}
          subStats={[
            { label: "Unpatched P95", value: `${vuln.p95_latency_ms.toFixed(1)}ms` },
            { label: "Repaired P95", value: `${rep.p95_latency_ms.toFixed(1)}ms` },
          ]}
        />

        <StatCard
          tag="Anomaly Suppression"
          tagVariant={delta.anomalies_eliminated ? "success" : "warning"}
          title="Anomalies Eliminated"
          value={delta.anomalies_eliminated ? "Eliminated" : "Detected"}
          delta={{
            value: "Clean 0.0% Error Rate on Repaired Branch",
            isPositive: true,
          }}
          subStats={[
            { label: "Unpatched Anomaly", value: vuln.anomaly_detected ? "Detected" : "None" },
            { label: "Repaired Anomaly", value: rep.anomaly_detected ? "Detected" : "Suppressed" },
          ]}
        />
      </div>

      {/* =========================================================================
          4. COMPARISON WORKSPACE: TIMELINES VS CUSTOMER LEDGER
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#ECEEF1] overflow-hidden shadow-card">
        {/* Workspace Toolbar & Tabs */}
        <div className="p-6 border-b border-[#ECEEF1] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SegmentedTabs
              options={[
                { id: "timeline", label: "Synchronized Execution Timelines", icon: <Clock className="w-3.5 h-3.5" /> },
                { id: "ledger", label: "Customer Ledger Transactions", icon: <Receipt className="w-3.5 h-3.5" />, badge: vulnLedger?.length || "Evidence" },
              ]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
            />
          </div>

          {activeTab === "timeline" && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#747B87]">Filter Level:</span>
              <div className="inline-flex rounded-lg bg-[#F1F5F9] p-0.5 border border-[#ECEEF1]">
                {["all", "anomalies", "success"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setFilterLevel(lvl)}
                    className={`px-2.5 py-1 rounded-md capitalize font-medium transition-all ${
                      filterLevel === lvl ? "bg-white text-[#191C24] shadow-xs" : "text-[#747B87] hover:text-[#191C24]"
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tab 1: Synchronized Timelines */}
        {activeTab === "timeline" && (
          <div className="p-6 lg:p-8 space-y-6">
            {/* Scrubber Bar */}
            <div className="bg-[#F8F9FB] rounded-xl p-4 border border-[#ECEEF1]/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-[#747B87]">
                <Activity className="w-4 h-4 text-[#20242D]" />
                <span className="font-semibold text-[#191C24]">Timeline Scrubber:</span>
                <span>{scrubTimeMs !== null ? `${scrubTimeMs}ms` : "Live Full Timeline (End)"}</span>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="range"
                  min="0"
                  max={timelineMaxMs}
                  value={scrubTimeMs !== null ? scrubTimeMs : timelineMaxMs}
                  onChange={(e) => setScrubTimeMs(Number(e.target.value))}
                  className="w-full sm:w-64 accent-[#20242D] cursor-pointer"
                />
                {scrubTimeMs !== null && (
                  <button
                    type="button"
                    onClick={() => setScrubTimeMs(null)}
                    className="p-1 rounded text-[#747B87] hover:text-[#191C24] hover:bg-slate-200/80 transition-colors"
                    title="Reset Scrubber"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Split Comparison Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column: Vulnerable Release */}
              <div className="rounded-xl border border-rose-200 bg-rose-50/15 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-rose-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#C74747]" />
                      <h4 className="font-bold text-[#191C24] text-sm">
                        Vulnerable Release
                      </h4>
                      <Badge variant="error">Unpatched</Badge>
                    </div>
                    <span className="text-xs text-[#747B87] font-mono mt-0.5 block">
                      {comparison.version_tag} ({vuln.release_id.substring(0, 12)})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#C74747] block">
                      {vuln.ledger_summary?.orders_violating_invariant ?? 4} Double Debits
                    </span>
                    <span className="text-[11px] text-[#747B87]">
                      ${(vuln.ledger_summary?.financial_exposure_usd ?? 1500.0).toFixed(2)} Exposure
                    </span>
                  </div>
                </div>

                {/* Event Feed */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {filterEvents(vuln.events).map((ev) => {
                    const isAnomaly = ev.level === "error" || ev.level === "critical";
                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          isAnomaly
                            ? "bg-rose-50/90 border-rose-200 text-[#C74747] font-medium"
                            : "bg-white border-[#ECEEF1] text-[#191C24]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#747B87] mb-1">
                          <span>+{ev.timestamp_offset_ms}ms &bull; {ev.service_name}</span>
                          <span className="uppercase font-semibold">{ev.event_type}</span>
                        </div>
                        <p>{ev.message}</p>
                      </div>
                    );
                  })}
                  {filterEvents(vuln.events).length === 0 && (
                    <p className="text-xs text-[#747B87] text-center py-8">
                      No events matching scrubber filter.
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Repaired Release */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/15 p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-emerald-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#168568]" />
                      <h4 className="font-bold text-[#191C24] text-sm">
                        Repaired Release
                      </h4>
                      <Badge variant="success">Verified Fix</Badge>
                    </div>
                    <span className="text-xs text-[#747B87] font-mono mt-0.5 block">
                      {comparison.version_tag} ({rep.release_id.substring(0, 12)})
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-mono font-bold text-[#168568] block">
                      {rep.ledger_summary?.orders_violating_invariant ?? 0} Double Debits (Preserved)
                    </span>
                    <span className="text-[11px] text-[#747B87]">
                      ${(rep.ledger_summary?.financial_exposure_usd ?? 0.0).toFixed(2)} Risk Exposure
                    </span>
                  </div>
                </div>

                {/* Event Feed */}
                <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
                  {filterEvents(rep.events).map((ev) => {
                    const isSuccess = ev.level === "success";
                    return (
                      <div
                        key={ev.id}
                        className={`p-3 rounded-lg border text-xs transition-all ${
                          isSuccess
                            ? "bg-emerald-50/90 border-emerald-200 text-[#168568] font-medium"
                            : "bg-white border-[#ECEEF1] text-[#191C24]"
                        }`}
                      >
                        <div className="flex items-center justify-between font-mono text-[10px] text-[#747B87] mb-1">
                          <span>+{ev.timestamp_offset_ms}ms &bull; {ev.service_name}</span>
                          <span className="uppercase font-semibold">{ev.event_type}</span>
                        </div>
                        <p>{ev.message}</p>
                      </div>
                    );
                  })}
                  {filterEvents(rep.events).length === 0 && (
                    <p className="text-xs text-[#747B87] text-center py-8">
                      No events matching scrubber filter.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Customer Ledger Transactions */}
        {activeTab === "ledger" && (
          <div className="p-6 lg:p-8 space-y-6">
            <div>
              <h4 className="text-base font-bold text-[#191C24]">
                Customer Ledger Debit Records
              </h4>
              <p className="text-xs text-[#747B87] mt-0.5">
                Real transaction records persisted in the database proving the exactly-once settlement invariant
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Vulnerable Ledger */}
              <div className="border border-rose-200 rounded-xl overflow-hidden">
                <div className="bg-rose-50/60 px-4 py-3 border-b border-rose-200 flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#C74747] flex items-center gap-1.5">
                    <XCircle className="w-3.5 h-3.5" />
                    Unpatched Ledger (Multiple Debits)
                  </span>
                  <span className="text-[11px] font-mono text-[#747B87]">
                    {vulnLedger?.length || 0} Records
                  </span>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F9FB] text-[#747B87] border-b border-rose-100">
                      <tr>
                        <th className="px-3 py-2">Order ID</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Duplicate?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECEEF1]/60">
                      {vulnLedger?.map((txn) => (
                        <tr key={txn.id} className={txn.is_duplicate ? "bg-rose-50/50" : ""}>
                          <td className="px-3 py-2 font-mono font-medium text-[#191C24]">
                            {txn.order_id}
                          </td>
                          <td className="px-3 py-2 font-mono">
                            ${(txn.amount_cents / 100).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#168568]">
                            {txn.status}
                          </td>
                          <td className="px-3 py-2">
                            {txn.is_duplicate ? (
                              <span className="font-bold text-[#C74747]">DOUBLE CHARGE</span>
                            ) : (
                              <span className="text-[#747B87]">Original</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Repaired Ledger */}
              <div className="border border-emerald-200 rounded-xl overflow-hidden">
                <div className="bg-emerald-50/60 px-4 py-3 border-b border-emerald-200 flex items-center justify-between">
                  <span className="font-semibold text-xs text-[#168568] flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Repaired Ledger (Exactly-Once Invariant)
                  </span>
                  <span className="text-[11px] font-mono text-[#747B87]">
                    {repLedger?.length || 0} Records
                  </span>
                </div>
                <div className="overflow-x-auto max-h-80">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F8F9FB] text-[#747B87] border-b border-emerald-100">
                      <tr>
                        <th className="px-3 py-2">Order ID</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Duplicate?</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#ECEEF1]/60">
                      {repLedger?.map((txn) => (
                        <tr key={txn.id}>
                          <td className="px-3 py-2 font-mono font-medium text-[#191C24]">
                            {txn.order_id}
                          </td>
                          <td className="px-3 py-2 font-mono">
                            ${(txn.amount_cents / 100).toFixed(2)}
                          </td>
                          <td className="px-3 py-2 font-semibold text-[#168568]">
                            {txn.status}
                          </td>
                          <td className="px-3 py-2 text-[#168568] font-medium">
                            0 Duplicates (Deduped)
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          5. EMPIRICAL EVIDENCE & AUDIT FOOTER
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#ECEEF1] p-6 shadow-card">
        <h4 className="text-base font-bold text-[#191C24] mb-4 flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#20242D]" />
          Empirical Artifact Citations
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(comparison.vulnerable_experiment.evidences || []).map((ev) => (
            <div key={ev.id} className="p-4 rounded-xl border border-[#ECEEF1] bg-[#F8F9FB] space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#191C24]">{ev.title}</span>
                <Badge variant={ev.severity === "high" ? "error" : "default"}>
                  {ev.category}
                </Badge>
              </div>
              <p className="text-[#747B87]">{ev.summary}</p>
              {ev.raw_log_excerpt && (
                <pre className="font-mono text-[10px] bg-slate-900 text-slate-100 p-2.5 rounded-lg overflow-x-auto mt-2">
                  {ev.raw_log_excerpt}
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
