"use client";

import React, { useState } from "react";
import type { ExperimentEventItem } from "@/lib/api";
import Link from "next/link";
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
  Activity,
  Receipt,
  ChevronDown,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  TimeMachineComparison,
  ScenarioConfig,
  TransactionItem,
} from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { SegmentedTabs } from "@/components/ui/tabs";

const SCENARIOS = [
  {
    id: "concurrent-checkouts",
    name: "Multiple Concurrent Checkout Requests (Race Window)",
    shortName: "Race Window",
    description: "Multiple parallel checkout worker threads dispatch simultaneous settlement requests for the same order without locking.",
  },
  {
    id: "lost-response-retry",
    name: "Lost Payment Response Followed by Client Retry",
    shortName: "Lost Response",
    description: "Gateway settles charge, but connection drops before response arrives. Client retries with identical idempotency key.",
  },
  {
    id: "duplicate-idempotency-keys",
    name: "Repeated Identical Idempotency Keys",
    shortName: "Key Replay",
    description: "Evaluates duplicate key injection against order state machines to verify replay resistance.",
  },
  {
    id: "delayed-db-commit",
    name: "Delayed Database Commits (TOCTOU Window)",
    shortName: "DB Lag",
    description: "Injects synthetic lock delays exposing uncommitted read windows during concurrent checkout bursts.",
  },
  {
    id: "transient-network-drop",
    name: "Simulated Transient Network Failures & Retry Storm",
    shortName: "Network Drop",
    description: "Stochastic packet drops trigger exponential retry bursts across parallel customer orders.",
  },
];


const EVENT_PREVIEW = 8;

const LEDGER_EVENTS = new Set([
  "idempotency_breach",
  "double_debit",
  "single_debit_verified",
  "idempotency_intercept",
  "experiment_finish",
]);

function titleCase(v: string) {
  const t = v.replace(/_/g, " ");
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function EventCard({
  ev,
  tone,
  onOpenLedger,
}: {
  ev: ExperimentEventItem;
  tone: "vulnerable" | "repaired";
  onOpenLedger: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isAnomaly = ev.level === "error" || ev.level === "critical";
  const dot = isAnomaly ? "bg-[#FF6A13]" : ev.level === "warning" ? "bg-[#FF6A13]/50" : "bg-[#C9CDD4]";
  return (
    <li className="rounded-[10px] border border-[#ECEEF1] bg-white">
      <div className="flex items-start gap-3 px-3 py-2.5">
        <span className={`mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full ${dot}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] leading-5 text-[#191C24] truncate">{titleCase(ev.event_type)}</span>
            <span className="text-[11px] text-[#747B87] whitespace-nowrap tabular-nums">+{ev.timestamp_offset_ms}ms</span>
          </div>
          <p className="typo-description text-[#747B87] line-clamp-2">{ev.message}</p>
          <div className="mt-1 flex items-center gap-3">
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="inline-flex items-center gap-1 text-[11px] text-[#747B87] hover:text-[#191C24]"
            >
              Details
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} />
            </button>
            {LEDGER_EVENTS.has(ev.event_type) && (
              <button
                type="button"
                onClick={onOpenLedger}
                className="inline-flex items-center gap-1 text-[11px] text-[#747B87] hover:text-[#FF6A13]"
              >
                Ledger evidence <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
      {open && (
        <div className="border-t border-[#ECEEF1] bg-[#F9FAFB] px-3 py-2.5 space-y-1.5 rounded-b-[10px]">
          <p className="typo-description text-[#191C24]">{ev.message}</p>
          <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[11px]">
            <dt className="text-[#747B87]">Service</dt>
            <dd className="text-[#191C24] font-mono">{ev.service_name}</dd>
            <dt className="text-[#747B87]">Level</dt>
            <dd className="text-[#191C24]">{ev.level}</dd>
            {typeof ev.latency_ms === "number" && (
              <>
                <dt className="text-[#747B87]">Latency</dt>
                <dd className="text-[#191C24]">{ev.latency_ms}ms</dd>
              </>
            )}
            <dt className="text-[#747B87]">Run</dt>
            <dd className="text-[#191C24]">{tone}</dd>
          </dl>
          {ev.payload && (
            <pre className="text-[11px] font-mono text-[#191C24] bg-white border border-[#ECEEF1] rounded-lg p-2 overflow-x-auto">
              {JSON.stringify(ev.payload, null, 2)}
            </pre>
          )}
        </div>
      )}
    </li>
  );
}

export default function TimeMachinePage() {
  const queryClient = useQueryClient();
  const [selectedRelease] = useState("rel-2026-001");

  // Laboratory Controls State
  const [pickedScenarioId, setScenarioId] = useState<string | null>(null);
  const [concurrency, setConcurrency] = useState<number>(5);
  const [retryCount, setRetryCount] = useState<number>(2);
  const [activeTab, setActiveTab] = useState<"timeline" | "ledger">("timeline");
  const [scrubTimeMs, setScrubTimeMs] = useState<number | null>(null);
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [showAllEvents, setShowAllEvents] = useState(false);

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

  // Run experiment pair mutation
  const runMutation = useMutation({
    mutationFn: () => {
      const config: ScenarioConfig = {
        scenario_id: pickedScenarioId ?? comparison?.vulnerable_experiment?.scenario_id ?? "concurrent-checkouts",
        concurrency,
        retry_count: retryCount,
        delay_ms: 50,
        failure_rate: 0.1,
        order_count: 10,
        seed: 42,
      };
      return api.runExperimentPair({
        release_id: selectedRelease,
        scenario: config,
      });
    },
    onSuccess: (newComparison) => {
      queryClient.setQueryData(["time-machine", selectedRelease], newComparison);
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["ledger"] });
      setScrubTimeMs(null);
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white rounded-[13px] border border-[#ECEEF1] w-48" />
        <div className="h-44 bg-white rounded-[13px] border border-[#ECEEF1]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white rounded-[13px] border border-[#ECEEF1]" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-[13px] border border-[#ECEEF1]" />
      </div>
    );
  }

  if (isError || !comparison) {
    return (
      <div className="bg-white border border-[#ECEEF1] rounded-[13px] p-8 text-center max-w-md mx-auto my-16">
        <h3 className="text-[14px]  text-[#191C24] mb-1">
          Unable to Load Time Machine Data
        </h3>
        <p className="text-[12px] text-[#747B87] mb-5">
          Backend simulation engine starting up or unreachable.
        </p>
        <Button onClick={() => refetch()} variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  const vuln = comparison.vulnerable_experiment;
  const rep = comparison.repaired_experiment;
  const delta = comparison.delta_summary;

  // Every figure below comes from the two recorded experiments of the same scenario.
  const vm = vuln.metrics_summary;
  const rm = rep.metrics_summary;
  // Seeded runs and live runs store their ledger summary in different shapes; read both.
  const lsOf = (e: typeof vuln) => (e.ledger_summary ?? {}) as Record<string, number | undefined>;
  const vViolations = Number(vm?.idempotency_violations ?? lsOf(vuln).double_charges ?? lsOf(vuln).orders_violating_invariant ?? 0);
  const rViolations = Number(rm?.idempotency_violations ?? lsOf(rep).double_charges ?? lsOf(rep).orders_violating_invariant ?? 0);
  const vExposure = Number(vm?.duplicate_billed_amount_usd ?? lsOf(vuln).financial_exposure_usd ?? 0);
  const rExposure = Number(rm?.duplicate_billed_amount_usd ?? lsOf(rep).financial_exposure_usd ?? 0);
  const money = (n: number) => `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const ranScenario = SCENARIOS.find((s) => s.id === vuln.scenario_id);
  const ranScenarioName = ranScenario?.name ?? vuln.scenario_id ?? "Unlabelled scenario";
  const scenarioId = pickedScenarioId ?? vuln.scenario_id ?? SCENARIOS[0].id;
  const currentScenario = SCENARIOS.find((s) => s.id === scenarioId) || SCENARIOS[0];
  const showingDifferentScenario = scenarioId !== vuln.scenario_id;
  const sameRun = vuln.scenario_id === rep.scenario_id && vuln.reproducibility_seed === rep.reproducibility_seed;

  const timelineMaxMs = Math.max(
    ...vuln.events.map((e) => e.timestamp_offset_ms),
    ...rep.events.map((e) => e.timestamp_offset_ms),
    100
  );

  const filterEvents = (events: typeof vuln.events) => {
    let list = events;
    if (scrubTimeMs !== null) list = list.filter((e) => e.timestamp_offset_ms <= scrubTimeMs);
    if (filterLevel === "anomalies") return list.filter((e) => e.level === "error" || e.level === "critical");
    if (filterLevel === "success") return list.filter((e) => e.level === "success");
    return list;
  };

  const statusLabel = runMutation.isPending ? "Running" : vuln.status === "completed" && rep.status === "completed" ? "Completed" : vuln.status;

  const columns = [
    { key: "vulnerable", title: "Vulnerable Release", tag: "Before repair", exp: vuln, violations: vViolations, exposure: vExposure },
    { key: "repaired", title: "Repaired Release", tag: "After repair", exp: rep, violations: rViolations, exposure: rExposure },
  ] as const;

  const ledgerBlocks = [
    { key: "vulnerable", title: "Unpatched Ledger (Multiple Debits)", exp: vuln, rows: vulnLedger, summary: `${vViolations} ${vViolations === 1 ? "violation" : "violations"}` },
    { key: "repaired", title: "Repaired Ledger (Exactly-Once Invariant)", exp: rep, rows: repLedger, summary: `${rViolations} ${rViolations === 1 ? "violation" : "violations"}` },
  ] as const;

  const card = "bg-white rounded-[13px] border border-[#ECEEF1]";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="sr-only">Consequence Laboratory · rel-2026-001</span>
          <h1 className="typo-page-title text-[#191C24]">
            Time Machine
            {/* E2E Playwright test locator preservation */}
            <span className="sr-only">· Release Time Machine</span>
          </h1>
          <p className="typo-description text-[#747B87] mt-0.5">
            Run the same failure against the vulnerable and repaired release.
          </p>
        </div>
        <Button
          onClick={() => runMutation.mutate()}
          disabled={runMutation.isPending}
          variant="primary"
          size="sm"
          icon={runMutation.isPending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
        >
          {runMutation.isPending ? "Executing..." : "Execute Experiment Pair"}
        </Button>
      </div>

      {/* Scenario & run context */}
      <div className={`${card} p-5 space-y-4`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div>
            <h3 className="typo-card-heading text-[#191C24]">Fault Injection Scenario</h3>
            <p className="typo-description text-[#747B87]">Choose the failure to inject, then execute the pair.</p>
          </div>
          <SegmentedTabs
            size="sm"
            options={SCENARIOS.map((sc) => ({ id: sc.id, label: sc.shortName }))}
            activeId={scenarioId}
            onChange={(id) => setScenarioId(id)}
          />
        </div>

        <div className="pt-3 border-t border-[#ECEEF1] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <p className="typo-description text-[#747B87] max-w-2xl">
            <span className="text-[#191C24]">{currentScenario.name}.</span> {currentScenario.description}
          </p>
          <div className="flex items-center gap-5 shrink-0 typo-description">
            <label className="flex items-center gap-2 text-[#747B87]">
              Workers
              <input type="range" min="1" max="10" value={concurrency} onChange={(e) => setConcurrency(Number(e.target.value))} className="w-20 accent-[#20242D]" />
              <span className="text-[#191C24] w-4 tabular-nums">{concurrency}</span>
            </label>
            <label className="flex items-center gap-2 text-[#747B87]">
              Retries
              <input type="range" min="1" max="5" value={retryCount} onChange={(e) => setRetryCount(Number(e.target.value))} className="w-16 accent-[#20242D]" />
              <span className="text-[#191C24] w-5 tabular-nums">{retryCount}x</span>
            </label>
          </div>
        </div>

        <div className="rounded-[10px] bg-[#F9FAFB] border border-[#ECEEF1] px-3.5 py-2.5 flex flex-wrap items-center gap-x-5 gap-y-1 typo-description text-[#747B87]">
          <span className="inline-flex items-center gap-1.5 text-[#191C24]">
            <span className={`w-1.5 h-1.5 rounded-full ${runMutation.isPending ? "bg-[#FF6A13] animate-pulse" : "bg-[#191C24]/40"}`} />
            {statusLabel}
          </span>
          <span>Source: recorded experiment runs. Scenario: <span className="text-[#191C24]">{ranScenarioName}</span></span>
          <span>Seed {vuln.reproducibility_seed}</span>
          <span>{vuln.transaction_count} transactions per run</span>
          <span className="font-mono">{vuln.id} · {rep.id}</span>
        </div>

        {showingDifferentScenario && (
          <p className="typo-description text-[#FF6A13]">
            The results below are from “{ranScenario?.shortName ?? vuln.scenario_id}”. Execute the pair to see “{currentScenario.shortName}”.
          </p>
        )}
        {!sameRun && (
          <p className="typo-description text-[#FF6A13]">
            The two experiments used different scenarios or seeds, so they are not directly comparable.
          </p>
        )}
        {runMutation.isError && (
          <p className="typo-description text-[#FF6A13]">Experiment failed: {(runMutation.error as Error).message}</p>
        )}
      </div>

      {/* Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="INV-PAY-001 Violations"
          value={`${vViolations} found`}
          delta={{ value: rViolations === 0 && vViolations > 0 ? "None after repair" : `${rViolations} after repair`, isRisk: rViolations > 0 }}
          subStats={[
            { label: "Unpatched", value: `${vViolations} ${vViolations === 1 ? "violation" : "violations"}` },
            { label: "Repaired", value: `${rViolations} ${rViolations === 1 ? "violation" : "violations"}` },
          ]}
        />
        <StatCard
          title="At-Risk Exposure Delta"
          value={money(vExposure - rExposure)}
          delta={{ value: "Simulated, not real charges" }}
          subStats={[
            { label: "Unpatched risk", value: money(vExposure) },
            { label: "Repaired risk", value: money(rExposure) },
          ]}
        />
        <StatCard
          title="P95 Latency Reduction"
          value={`${Math.abs(vuln.p95_latency_ms - rep.p95_latency_ms).toFixed(0)}ms`}
          delta={{ value: delta.latency_improvement_ratio || "" }}
          subStats={[
            { label: "Unpatched P95", value: `${vuln.p95_latency_ms.toFixed(0)}ms` },
            { label: "Repaired P95", value: `${rep.p95_latency_ms.toFixed(0)}ms` },
          ]}
        />
        <StatCard
          title="Anomalies Eliminated"
          value={vuln.anomaly_detected && !rep.anomaly_detected ? "All" : vuln.anomaly_detected ? "Not all" : "None found"}
          delta={{ value: `${(Number(rm?.error_rate ?? 0) * 100).toFixed(1)}% error rate after repair` }}
          subStats={[
            { label: "Unpatched", value: vuln.anomaly_detected ? "Anomaly detected" : "None" },
            { label: "Repaired", value: rep.anomaly_detected ? "Anomaly detected" : "Suppressed" },
          ]}
        />
      </div>

      {/* Comparison workspace */}
      <div className={`${card} overflow-hidden`}>
        <div className="p-4 sm:p-5 border-b border-[#ECEEF1] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <SegmentedTabs
            options={[
              { id: "timeline", label: "Synchronized Execution Timelines", icon: <Clock className="w-3.5 h-3.5" /> },
              { id: "ledger", label: "Customer Ledger Transactions", icon: <Receipt className="w-3.5 h-3.5" /> },
            ]}
            activeId={activeTab}
            onChange={(id) => setActiveTab(id as "timeline" | "ledger")}
          />
          {activeTab === "timeline" && (
            <div className="flex items-center gap-2 typo-description text-[#747B87]">
              Filter
              <SegmentedTabs
                size="sm"
                options={[
                  { id: "all", label: "All" },
                  { id: "anomalies", label: "Anomalies" },
                  { id: "success", label: "Success" },
                ]}
                activeId={filterLevel}
                onChange={setFilterLevel}
              />
            </div>
          )}
        </div>

        {activeTab === "timeline" && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="rounded-[10px] bg-[#F9FAFB] border border-[#ECEEF1] px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 typo-description">
              <div className="flex items-center gap-2 text-[#747B87]">
                <Activity className="w-3.5 h-3.5 text-[#191C24]" />
                <span className="text-[#191C24]">Timeline Scrubber:</span>
                <span>{scrubTimeMs !== null ? `${scrubTimeMs}ms` : "Live Full Timeline (End)"}</span>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <input
                  type="range"
                  min="0"
                  max={timelineMaxMs}
                  value={scrubTimeMs !== null ? scrubTimeMs : timelineMaxMs}
                  onChange={(e) => setScrubTimeMs(Number(e.target.value))}
                  className="w-full sm:w-64 accent-[#20242D]"
                  aria-label="Timeline scrubber"
                />
                {scrubTimeMs !== null && (
                  <button type="button" onClick={() => setScrubTimeMs(null)} className="p-1 rounded text-[#747B87] hover:text-[#191C24]" title="Reset scrubber">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {columns.map((col) => {
                const allEvents = filterEvents(col.exp.events);
                const events = showAllEvents ? allEvents : allEvents.slice(0, EVENT_PREVIEW);
                return (
                  <section key={col.key} className="min-w-0">
                    <header className="flex items-start justify-between gap-3 pb-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${col.key === "vulnerable" ? "bg-[#FF6A13]" : "bg-[#C9CDD4]"}`} />
                          <h4 className="text-[13px] text-[#191C24] whitespace-nowrap">{col.title}</h4>
                          <span className="typo-badge px-2 py-0.5 rounded-full bg-[#F4F5F7] text-[#747B87] whitespace-nowrap">{col.tag}</span>
                        </div>
                        <span className="typo-description text-[#969CA6] block mt-0.5 truncate" title={col.exp.name}>{col.exp.name}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-[12px] block whitespace-nowrap ${col.violations > 0 ? "text-[#FF6A13]" : "text-[#191C24]"}`}>
                          {col.violations} {col.violations === 1 ? "violation" : "violations"}
                        </span>
                        <span className="typo-description text-[#747B87] whitespace-nowrap">{money(col.exposure)} at risk</span>
                      </div>
                    </header>
                    <ol className="space-y-2">
                      {events.map((ev) => (
                        <EventCard key={ev.id} ev={ev} tone={col.key} onOpenLedger={() => setActiveTab("ledger")} />
                      ))}
                    </ol>
                    {allEvents.length > EVENT_PREVIEW && (
                      <button
                        type="button"
                        onClick={() => setShowAllEvents((v) => !v)}
                        className="mt-2 w-full h-8 rounded-[10px] border border-[#ECEEF1] typo-button text-[#747B87] hover:text-[#191C24] hover:bg-[#F9FAFB]"
                      >
                        {showAllEvents ? "Show fewer events" : `Show all ${allEvents.length} events`}
                      </button>
                    )}
                    {events.length === 0 && (
                      <p className="typo-description text-[#747B87] text-center py-8">No events match the current filter.</p>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="p-4 sm:p-5 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h4 className="text-[13px] text-[#191C24]">Customer ledger evidence</h4>
                <p className="typo-description text-[#747B87]">Settlement records behind the duplicate-charge events in the timelines.</p>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setActiveTab("timeline")}>Back to timelines</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {ledgerBlocks.map(({ key, title, exp, rows, summary }) => {
                const ls = lsOf(exp);
                const dupes = key === "vulnerable" ? vViolations : rViolations;
                return (
                  <section key={key} className="min-w-0 rounded-[13px] border border-[#ECEEF1] overflow-hidden">
                    <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#ECEEF1]">
                      <span className="text-[13px] text-[#191C24]">{title}</span>
                      <span className={`typo-description whitespace-nowrap ${key === "vulnerable" ? "text-[#FF6A13]" : "text-[#747B87]"}`}>{summary}</span>
                    </header>
                    {(() => {
                      // Prefer counts derived from the actual rows; fall back to the stored summary.
                      const dupCharges = rows ? rows.filter((t) => t.is_duplicate && t.has_anomaly).length : dupes;
                      const deduped = rows ? rows.filter((t) => t.is_duplicate && !t.has_anomaly).length : undefined;
                      const tiles: Array<[string, number | undefined]> =
                        rows && rows.length > 0
                          ? [
                              ["Records", rows.length],
                              ["Settled once", rows.filter((t) => !t.is_duplicate).length],
                              ["Duplicate charges", dupCharges],
                              ["Retries deduplicated", deduped],
                            ]
                          : [
                              ["Requests", ls.total_requests ?? ls.total_orders_processed],
                              ["Unique keys", ls.unique_keys],
                              ["Settled", ls.settled_count],
                              ["Duplicate charges", dupes],
                            ];
                      const shown = tiles.filter(([, v]) => v !== undefined);
                      return shown.length > 0 ? (
                        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-[#ECEEF1] border-b border-[#ECEEF1]">
                          {shown.map(([label, val]) => (
                            <div key={label} className="bg-white px-3 py-2">
                              <dt className="text-[11px] text-[#747B87] whitespace-nowrap">{label}</dt>
                              <dd className="text-[14px] text-[#191C24] tabular-nums">{String(val)}</dd>
                            </div>
                          ))}
                        </dl>
                      ) : null;
                    })()}
                    {rows && rows.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[420px] text-left text-[12px]">
                          <thead className="bg-[#F9FAFB] text-[#747B87]">
                            <tr>
                              <th className="px-3 h-9 font-normal">Transaction</th>
                              <th className="px-3 h-9 font-normal">Order</th>
                              <th className="px-3 h-9 font-normal">Amount</th>
                              <th className="px-3 h-9 font-normal">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#ECEEF1]">
                            {rows.map((tx) => (
                              <tr key={tx.id} className="h-10">
                                <td className="px-3 font-mono text-[11px] text-[#747B87] whitespace-nowrap" title={tx.transaction_ref}>{tx.transaction_ref.substring(0, 12)}</td>
                                <td className="px-3 font-mono text-[11px] text-[#191C24] whitespace-nowrap">{tx.order_id ?? "–"}</td>
                                <td className="px-3 text-[#191C24] whitespace-nowrap tabular-nums">${(tx.amount_cents / 100).toFixed(2)}</td>
                                <td className="px-3">
                                  <span className={`inline-block whitespace-nowrap px-2 py-0.5 rounded-full typo-badge ${tx.is_duplicate && tx.has_anomaly ? "bg-[#FFF5EC] text-[#FF6A13]" : "bg-[#F4F5F7] text-[#747B87]"}`}>
                                    {tx.is_duplicate ? (tx.has_anomaly ? "Duplicate charge" : "Retry deduplicated") : "Settled once"}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="typo-description text-[#747B87] px-4 py-5">
                        {rows === undefined
                          ? "Loading ledger records…"
                          : "No per-transaction rows are stored for this recorded run. Execute the experiment pair to generate a full ledger."}
                      </p>
                    )}
                  </section>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
