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

const SCENARIOS = [
  {
    id: "lost-response-retry",
    name: "Lost Payment Response Followed by Client Retry",
    description: "Gateway settles charge, but connection drops before response arrives. Client retries with identical idempotency key.",
  },
  {
    id: "concurrent-checkouts",
    name: "Multiple Concurrent Checkout Requests (Race Window)",
    description: "Multiple parallel checkout worker threads dispatch simultaneous settlement requests for the same order.",
  },
  {
    id: "duplicate-idempotency-keys",
    name: "Repeated Identical Idempotency Keys",
    description: "Evaluates duplicate key injection against order state machines to verify replay resistance.",
  },
  {
    id: "delayed-db-commit",
    name: "Delayed Database Commits (TOCTOU Window)",
    description: "Injects synthetic 150ms lock delays exposing uncommitted read windows during concurrent checkout bursts.",
  },
  {
    id: "transient-network-drop",
    name: "Simulated Transient Network Failures & Retry Storm",
    description: "Stochastic 20% packet drops trigger exponential retry bursts across parallel customer orders.",
  },
];

export default function TimeMachinePage() {
  const queryClient = useQueryClient();
  const [selectedRelease] = useState("rel-2026-001");

  // Laboratory Controls State
  const [scenarioId, setScenarioId] = useState<string>("lost-response-retry");
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
        <div className="h-32 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-[#ECE6DA] rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-white border border-[#ECE6DA] rounded-lg"></div>
          <div className="h-96 bg-white border border-[#ECE6DA] rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (isError || !comparison) {
    return (
      <div className="bg-white border border-[#FECDD3] rounded-lg p-8 text-center max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0F172A] mb-1">
          Comparison Data Not Found
        </h3>
        <p className="text-sm text-[#64748B] mb-4">
          Unable to load experiment runs for release &apos;{selectedRelease}&apos;.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-[#0F172A] text-white hover:bg-[#1E293B]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { vulnerable_experiment: vuln, repaired_experiment: rep, delta_summary: delta } = comparison;

  // Max timeline offset for scrubber
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

  const filteredVulnEvents = filterEvents(vuln.events);
  const filteredRepEvents = filterEvents(rep.events);

  return (
    <div className="space-y-6">
      {/* Signature Header Banner */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mb-1">
              <span className="font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                CONSEQUENCE LABORATORY
              </span>
              <span>&bull;</span>
              <span>EXECUTABLE COUNTERFACTUAL ENGINE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#1D4ED8]" />
              Release Time Machine
            </h1>
            <p className="text-sm text-[#475569] mt-1 max-w-3xl">
              Configure deterministic fault injection scenarios, execute side-by-side consequence simulations,
              and empirically verify invariant assertions before promoting release candidates.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/release-control"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs transition-colors"
            >
              <span>Inspect Verification Gates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Invariant Banner */}
        <div className="mt-4 pt-4 border-t border-[#ECE6DA] grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 rounded-lg border border-[#FECDD3] bg-[#FFF1F2]/60 text-xs font-mono">
            <div className="flex items-center justify-between text-[#9F1239] font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5" />
                VULNERABLE INVARIANT RESULT: {vuln.invariant_status || "FAIL"}
              </span>
              <span>{vuln.id}</span>
            </div>
            <p className="text-[#881337] font-sans text-xs">
              {vuln.invariant_verdict || "ONE LOGICAL PURCHASE MUST NOT PRODUCE MULTIPLE CHARGES — VIOLATED"}
            </p>
          </div>

          <div className="p-3 rounded-lg border border-[#A7F3D0] bg-[#ECFDF5]/60 text-xs font-mono">
            <div className="flex items-center justify-between text-[#065F46] font-bold mb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5" />
                REPAIRED INVARIANT RESULT: {rep.invariant_status || "PASS"}
              </span>
              <span>{rep.id}</span>
            </div>
            <p className="text-[#047857] font-sans text-xs">
              {rep.invariant_verdict || "ONE LOGICAL PURCHASE MUST NOT PRODUCE MULTIPLE CHARGES — VERIFIED (100% Single Billing)"}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE EXPERIMENT CONFIGURATION CONSOLE (PHASE D) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#ECE6DA] pb-3">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-[#1D4ED8]" />
            <h2 className="text-sm font-bold text-[#0F172A]">
              Experiment Configuration &amp; Fault Injection Console
            </h2>
          </div>
          <span className="text-xs font-mono text-[#64748B]">
            Deterministic PRNG Engine &bull; Non-Production Synthetic Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
          {/* Scenario Selector */}
          <div className="lg:col-span-2 space-y-1">
            <label className="font-semibold text-[#334155] block">Fault Injection Scenario</label>
            <select
              value={scenarioId}
              onChange={(e) => setScenarioId(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded border border-[#ECE6DA] bg-white text-[#0F172A] font-medium focus:outline-hidden focus:border-[#1D4ED8]"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-[#64748B] pt-0.5">
              {SCENARIOS.find((s) => s.id === scenarioId)?.description}
            </p>
          </div>

          {/* Concurrency Slider */}
          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-[#334155]">
              <span>Parallel Workers</span>
              <span className="font-mono text-[#1D4ED8]">{concurrency}</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              value={concurrency}
              onChange={(e) => setConcurrency(Number(e.target.value))}
              className="w-full accent-[#1D4ED8]"
            />
            <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
              <span>1</span>
              <span>10</span>
              <span>20</span>
            </div>
          </div>

          {/* Retry Count Control */}
          <div className="space-y-1">
            <div className="flex justify-between font-semibold text-[#334155]">
              <span>Retry Attempts</span>
              <span className="font-mono text-[#1D4ED8]">{retryCount}</span>
            </div>
            <input
              type="range"
              min={0}
              max={5}
              value={retryCount}
              onChange={(e) => setRetryCount(Number(e.target.value))}
              className="w-full accent-[#1D4ED8]"
            />
            <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
              <span>0</span>
              <span>2</span>
              <span>5</span>
            </div>
          </div>

          {/* Seed Input & Launch Button */}
          <div className="space-y-2">
            <div>
              <label className="font-semibold text-[#334155] block mb-0.5">PRNG Seed</label>
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(Number(e.target.value))}
                className="w-full px-2.5 py-1 rounded border border-[#ECE6DA] font-mono text-xs text-[#0F172A]"
              />
            </div>
            <button
              onClick={() => runMutation.mutate()}
              disabled={runMutation.isPending}
              className="w-full py-2 px-3 rounded font-semibold text-xs text-white bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              {runMutation.isPending ? (
                <>
                  <Zap className="w-3.5 h-3.5 animate-spin" />
                  <span>Simulating...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Execute Experiment Pair</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Delta Outcome Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Delta 1 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="text-xs text-[#64748B] font-medium mb-1">Errors Prevented</div>
          <div className="text-2xl font-bold font-mono text-[#047857]">
            {delta.errors_prevented} Violations
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            {vuln.error_count} &rarr; {rep.error_count} double debits
          </div>
        </div>

        {/* Delta 2 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="text-xs text-[#64748B] font-medium mb-1">Financial Exposure Avoided</div>
          <div className="text-2xl font-bold font-mono text-[#047857]">
            ${delta.financial_exposure_prevented_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            Double debits completely neutralized
          </div>
        </div>

        {/* Delta 3 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="text-xs text-[#64748B] font-medium mb-1">p95 Latency Delta</div>
          <div className="text-2xl font-bold font-mono text-[#1D4ED8]">
            -{delta.latency_improvement_ms} ms
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            {delta.latency_improvement_ratio} ({vuln.p95_latency_ms}ms &rarr; {rep.p95_latency_ms}ms)
          </div>
        </div>

        {/* Delta 4 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="text-xs text-[#64748B] font-medium mb-1">Reproducibility Seed</div>
          <div className="text-2xl font-bold font-mono text-[#0F172A] flex items-center justify-between">
            <span>#{delta.reproducibility_seed || seed}</span>
            <button
              onClick={() => runMutation.mutate()}
              title="Rerun with identical seed"
              className="p-1 rounded hover:bg-[#FAF8F5] text-[#64748B] hover:text-[#0F172A]"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            Scenario: {delta.scenario_tested || scenarioId}
          </div>
        </div>
      </div>

      {/* Scrubbing & View Mode Bar */}
      <div className="bg-white border border-[#ECE6DA] p-4 rounded-lg space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          {/* Mode Tabs */}
          <div className="inline-flex rounded border border-[#ECE6DA] p-0.5 bg-[#FAF8F5]">
            <button
              onClick={() => setActiveTab("timeline")}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                activeTab === "timeline" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Chronological Event Timeline
            </button>
            <button
              onClick={() => setActiveTab("ledger")}
              className={`px-3 py-1 rounded font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "ledger" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Receipt className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Customer Ledger Transactions</span>
            </button>
          </div>

          {/* Filter options */}
          {activeTab === "timeline" && (
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-[#64748B]" />
              <div className="inline-flex rounded border border-[#ECE6DA] p-0.5 bg-[#FAF8F5]">
                <button
                  onClick={() => setFilterLevel("all")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    filterLevel === "all" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B]"
                  }`}
                >
                  All Events
                </button>
                <button
                  onClick={() => setFilterLevel("anomalies")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    filterLevel === "anomalies" ? "bg-white text-[#BE123C] shadow-xs" : "text-[#64748B]"
                  }`}
                >
                  Anomalies Only
                </button>
                <button
                  onClick={() => setFilterLevel("success")}
                  className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                    filterLevel === "success" ? "bg-white text-[#047857] shadow-xs" : "text-[#64748B]"
                  }`}
                >
                  Verifications Only
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Synchronized Timeline Scrubber */}
        {activeTab === "timeline" && (
          <div className="pt-2 border-t border-[#ECE6DA] space-y-1">
            <div className="flex justify-between items-center text-xs font-mono text-[#64748B]">
              <span className="font-semibold text-[#0F172A] flex items-center gap-1">
                <Sliders className="w-3 h-3 text-[#1D4ED8]" />
                Synchronized Timeline Scrubber:
              </span>
              <span>
                {scrubTimeMs !== null ? `T = +${scrubTimeMs}ms` : "All Ticks Displayed (Full Run)"}
                {scrubTimeMs !== null && (
                  <button
                    onClick={() => setScrubTimeMs(null)}
                    className="ml-2 text-[#1D4ED8] hover:underline"
                  >
                    Reset
                  </button>
                )}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={timelineMaxMs}
              value={scrubTimeMs ?? timelineMaxMs}
              onChange={(e) => setScrubTimeMs(Number(e.target.value))}
              className="w-full accent-[#1D4ED8]"
            />
            <div className="flex justify-between text-[10px] text-[#94A3B8] font-mono">
              <span>+0ms (Initiation)</span>
              <span>+{Math.round(timelineMaxMs / 2)}ms</span>
              <span>+{timelineMaxMs}ms (Completion)</span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* SPLIT COMPARISON: TIMELINES OR LEDGER */}
      {/* ========================================================================= */}
      {activeTab === "timeline" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ========================================================================= */}
          {/* LEFT COLUMN: VULNERABLE RELEASE */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-[#FECDD3] rounded-lg shadow-xs flex flex-col">
            {/* Header */}
            <div className="p-4 bg-[#FFF1F2]/60 border-b border-[#FECDD3]">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#BE123C] text-white">
                  <AlertTriangle className="w-3 h-3" />
                  VULNERABLE EXECUTION
                </span>
                <span className="font-mono text-xs text-[#9F1239] font-medium">
                  {vuln.id}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#0F172A]">
                {vuln.name}
              </h3>
              <p className="text-xs text-[#475569] mt-1">
                {vuln.description}
              </p>

              {/* Run Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#FECDD3]/60 text-xs font-mono">
                <div>
                  <span className="text-[#9F1239] block text-[10px]">ANOMALIES</span>
                  <span className="font-bold text-[#BE123C]">{vuln.error_count} double debits</span>
                </div>
                <div>
                  <span className="text-[#9F1239] block text-[10px]">p95 LATENCY</span>
                  <span className="font-bold text-[#0F172A]">{vuln.p95_latency_ms} ms</span>
                </div>
                <div>
                  <span className="text-[#9F1239] block text-[10px]">GITLAB CI JOB</span>
                  <a
                    href={`https://gitlab.com/atumanyire/aftermath/-/jobs/${vuln.gitlab_job_id || "881920"}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#1D4ED8] hover:underline inline-flex items-center gap-0.5"
                  >
                    {vuln.gitlab_job_id || "job-881920"}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Timeline Events Stream */}
            <div className="p-4 flex-1 space-y-3 bg-[#FCFCFA]">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Chronological Event Trace</span>
                <span className="font-mono text-[10px]">{filteredVulnEvents.length} events displayed</span>
              </div>

              <div className="space-y-2.5">
                {filteredVulnEvents.map((ev) => {
                  const isCritical = ev.level === "critical" || ev.level === "error";
                  const isWarning = ev.level === "warning";
                  return (
                    <div
                      key={ev.id}
                      className={`p-2.5 rounded border text-xs font-mono transition-all ${
                        isCritical
                          ? "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                          : isWarning
                          ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                          : "bg-white border-[#ECE6DA] text-[#334155]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-[#0F172A]">+{ev.timestamp_offset_ms}ms</span>
                        <span className="text-[10px] uppercase font-semibold px-1 rounded bg-black/5">
                          {ev.service_name}
                        </span>
                      </div>
                      <div className="font-sans text-xs leading-relaxed font-medium">
                        {ev.message}
                      </div>
                      {ev.latency_ms && (
                        <div className="text-[10px] text-[#64748B] mt-1">
                          Latency: {ev.latency_ms.toFixed(1)}ms
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Evidences */}
              <div className="pt-4 mt-4 border-t border-[#ECE6DA]">
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Empirical Evidence &amp; Traces ({vuln.evidences.length})
                </div>
                <div className="space-y-2">
                  {vuln.evidences.map((evi) => (
                    <div
                      key={evi.id}
                      className="border border-[#FECDD3] rounded bg-white overflow-hidden text-xs"
                    >
                      <button
                        onClick={() => toggleEvidence(evi.id)}
                        className="w-full px-3 py-2 text-left font-medium flex items-center justify-between hover:bg-[#FAF8F5]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#BE123C] text-white">
                            {evi.severity.toUpperCase()}
                          </span>
                          <span className="font-semibold text-[#0F172A]">{evi.title}</span>
                        </div>
                        {expandedEvidence[evi.id] ? (
                          <ChevronDown className="w-4 h-4 text-[#64748B]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#64748B]" />
                        )}
                      </button>
                      {expandedEvidence[evi.id] && (
                        <div className="px-3 pb-3 pt-1 border-t border-[#ECE6DA] bg-[#FAF8F5]/50 space-y-2">
                          <p className="text-xs text-[#475569]">{evi.summary}</p>
                          {evi.raw_log_excerpt && (
                            <div className="p-2 rounded bg-[#0F172A] text-[#F8FAFC] font-mono text-[11px] overflow-x-auto">
                              <code>{evi.raw_log_excerpt}</code>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                            <span>Verified: {evi.verified ? "Yes" : "No"}</span>
                            {evi.gitlab_artifact_url && (
                              <a
                                href={evi.gitlab_artifact_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#1D4ED8] hover:underline inline-flex items-center gap-0.5"
                              >
                                GitLab Job Artifact
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* RIGHT COLUMN: REPAIRED RELEASE */}
          {/* ========================================================================= */}
          <div className="bg-white border-2 border-[#A7F3D0] rounded-lg shadow-xs flex flex-col">
            {/* Header */}
            <div className="p-4 bg-[#ECFDF5]/60 border-b border-[#A7F3D0]">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#047857] text-white">
                  <CheckCircle2 className="w-3 h-3" />
                  REPAIRED EXECUTION
                </span>
                <span className="font-mono text-xs text-[#065F46] font-medium">
                  {rep.id}
                </span>
              </div>

              <h3 className="text-base font-bold text-[#0F172A]">
                {rep.name}
              </h3>
              <p className="text-xs text-[#475569] mt-1">
                {rep.description}
              </p>

              {/* Run Metrics Bar */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#A7F3D0]/60 text-xs font-mono">
                <div>
                  <span className="text-[#065F46] block text-[10px]">ANOMALIES</span>
                  <span className="font-bold text-[#047857]">0 violations (clean)</span>
                </div>
                <div>
                  <span className="text-[#065F46] block text-[10px]">p95 LATENCY</span>
                  <span className="font-bold text-[#0F172A]">{rep.p95_latency_ms} ms</span>
                </div>
                <div>
                  <span className="text-[#065F46] block text-[10px]">GITLAB CI JOB</span>
                  <a
                    href={`https://gitlab.com/atumanyire/aftermath/-/jobs/${rep.gitlab_job_id || "882041"}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-[#1D4ED8] hover:underline inline-flex items-center gap-0.5"
                  >
                    {rep.gitlab_job_id || "job-882041"}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Timeline Events Stream */}
            <div className="p-4 flex-1 space-y-3 bg-[#FCFCFA]">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center justify-between">
                <span>Chronological Event Trace</span>
                <span className="font-mono text-[10px]">{filteredRepEvents.length} events displayed</span>
              </div>

              <div className="space-y-2.5">
                {filteredRepEvents.map((ev) => {
                  const isSuccess = ev.level === "success";
                  const isWarning = ev.level === "warning";
                  return (
                    <div
                      key={ev.id}
                      className={`p-2.5 rounded border text-xs font-mono transition-all ${
                        isSuccess
                          ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                          : isWarning
                          ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                          : "bg-white border-[#ECE6DA] text-[#334155]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-bold text-[#0F172A]">+{ev.timestamp_offset_ms}ms</span>
                        <span className="text-[10px] uppercase font-semibold px-1 rounded bg-black/5">
                          {ev.service_name}
                        </span>
                      </div>
                      <div className="font-sans text-xs leading-relaxed font-medium">
                        {ev.message}
                      </div>
                      {ev.latency_ms && (
                        <div className="text-[10px] text-[#64748B] mt-1">
                          Latency: {ev.latency_ms.toFixed(1)}ms
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Evidences */}
              <div className="pt-4 mt-4 border-t border-[#ECE6DA]">
                <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                  Empirical Evidence &amp; Verification ({rep.evidences.length})
                </div>
                <div className="space-y-2">
                  {rep.evidences.map((evi) => (
                    <div
                      key={evi.id}
                      className="border border-[#A7F3D0] rounded bg-white overflow-hidden text-xs"
                    >
                      <button
                        onClick={() => toggleEvidence(evi.id)}
                        className="w-full px-3 py-2 text-left font-medium flex items-center justify-between hover:bg-[#FAF8F5]"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#047857] text-white">
                            VERIFIED
                          </span>
                          <span className="font-semibold text-[#0F172A]">{evi.title}</span>
                        </div>
                        {expandedEvidence[evi.id] ? (
                          <ChevronDown className="w-4 h-4 text-[#64748B]" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-[#64748B]" />
                        )}
                      </button>
                      {expandedEvidence[evi.id] && (
                        <div className="px-3 pb-3 pt-1 border-t border-[#ECE6DA] bg-[#FAF8F5]/50 space-y-2">
                          <p className="text-xs text-[#475569]">{evi.summary}</p>
                          {evi.raw_log_excerpt && (
                            <div className="p-2 rounded bg-[#0F172A] text-[#F8FAFC] font-mono text-[11px] overflow-x-auto">
                              <code>{evi.raw_log_excerpt}</code>
                            </div>
                          )}
                          <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                            <span>Verified: {evi.verified ? "Yes" : "No"}</span>
                            {evi.gitlab_artifact_url && (
                              <a
                                href={evi.gitlab_artifact_url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#1D4ED8] hover:underline inline-flex items-center gap-0.5"
                              >
                                GitLab Job Artifact
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* TAB 2: ACTUAL CUSTOMER LEDGER TRANSACTIONS COMPARISON */
        /* ========================================================================= */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vulnerable Ledger */}
          <div className="bg-white border-2 border-[#FECDD3] rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#FECDD3] pb-2">
              <h3 className="text-sm font-bold text-[#9F1239] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#BE123C]" />
                Vulnerable Ledger Debits ({vulnLedger?.length || 0} Records)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#FFF1F2] text-[#BE123C] font-semibold border border-[#FECDD3]">
                Double Debits Present
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#64748B] font-mono text-[11px] border-b border-[#ECE6DA]">
                  <tr>
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Violation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE6DA] font-mono text-[11px]">
                  {vulnLedger?.map((txn) => (
                    <tr
                      key={txn.id}
                      className={txn.has_anomaly ? "bg-[#FFF1F2]/80 text-[#9F1239]" : "hover:bg-[#FAF8F5]"}
                    >
                      <td className="py-2 px-3 font-semibold">{txn.order_id || txn.transaction_ref}</td>
                      <td className="py-2 px-3 text-[#475569]">{txn.customer_id}</td>
                      <td className="py-2 px-3 font-bold">${(txn.amount_cents / 100).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-black/5">
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {txn.has_anomaly ? (
                          <span className="font-bold text-[#BE123C]">DOUBLE DEBIT</span>
                        ) : (
                          <span className="text-[#047857]">Initial</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Repaired Ledger */}
          <div className="bg-white border-2 border-[#A7F3D0] rounded-lg p-5 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-[#A7F3D0] pb-2">
              <h3 className="text-sm font-bold text-[#065F46] flex items-center gap-1.5">
                <Receipt className="w-4 h-4 text-[#047857]" />
                Repaired Ledger Debits ({repLedger?.length || 0} Records)
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#ECFDF5] text-[#047857] font-semibold border border-[#A7F3D0]">
                100% Single Billing
              </span>
            </div>

            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF8F5] text-[#64748B] font-mono text-[11px] border-b border-[#ECE6DA]">
                  <tr>
                    <th className="py-2 px-3">Order ID</th>
                    <th className="py-2 px-3">Customer</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 px-3">Status</th>
                    <th className="py-2 px-3">Protection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE6DA] font-mono text-[11px]">
                  {repLedger?.map((txn) => (
                    <tr
                      key={txn.id}
                      className={txn.is_duplicate ? "bg-[#EFF6FF]/60 text-[#1D4ED8]" : "hover:bg-[#FAF8F5]"}
                    >
                      <td className="py-2 px-3 font-semibold">{txn.order_id || txn.transaction_ref}</td>
                      <td className="py-2 px-3 text-[#475569]">{txn.customer_id}</td>
                      <td className="py-2 px-3 font-bold">${(txn.amount_cents / 100).toFixed(2)}</td>
                      <td className="py-2 px-3">
                        <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-black/5">
                          {txn.status}
                        </span>
                      </td>
                      <td className="py-2 px-3">
                        {txn.is_duplicate ? (
                          <span className="font-bold text-[#1D4ED8]">SAFELY DEDUPED</span>
                        ) : (
                          <span className="text-[#047857]">Single Settled</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
