"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Compass,
  GitBranch,
  ArrowRight,
  TrendingUp,
  Wrench,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
  ShieldCheck,
  Download,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>("concurrent-checkouts");

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ["overview"],
    queryFn: api.getOverview,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white rounded-xl border border-[#ECEEF1] w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 h-56 bg-white rounded-2xl border border-[#ECEEF1]" />
          <div className="lg:col-span-5 h-56 bg-white rounded-2xl border border-[#ECEEF1]" />
        </div>
        <div className="h-80 bg-white rounded-2xl border border-[#ECEEF1]" />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="bg-white border border-[#ECEEF1] rounded-2xl p-8 text-center max-w-md mx-auto my-16 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <h3 className="text-base font-semibold text-[#191C24] mb-1">
          Unable to Connect to AFTERMATH Engine
        </h3>
        <p className="text-xs text-[#747B87] mb-5">
          The backend service is starting up or unreachable at http://localhost:8000.
        </p>
        <Button onClick={() => refetch()} variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // Visual data for the Release Consequences chart (5 scenarios)
  const scenariosData = [
    {
      id: "concurrent-checkouts",
      label: "Concurrent",
      vulnerableVal: 1500,
      vulnerableHeight: "85%",
      repairedVal: 0,
      repairedHeight: "8%",
      vulnDesc: "4 duplicate charges ($1,500)",
      repairDesc: "0 duplicates (Exactly-once)",
    },
    {
      id: "lost-response",
      label: "Lost Response",
      vulnerableVal: 1200,
      vulnerableHeight: "68%",
      repairedVal: 0,
      repairedHeight: "8%",
      vulnDesc: "State desync on connection drop",
      repairDesc: "Durable idempotent replay",
    },
    {
      id: "key-replay",
      label: "Key Replay",
      vulnerableVal: 900,
      vulnerableHeight: "52%",
      repairedVal: 0,
      repairedHeight: "8%",
      vulnDesc: "TOCTOU race on idempotency key",
      repairDesc: "Atomic mutex serialized",
    },
    {
      id: "commit-lag",
      label: "DB Lag",
      vulnerableVal: 1600,
      vulnerableHeight: "90%",
      repairedVal: 0,
      repairedHeight: "8%",
      vulnDesc: "1,600ms pool exhaustion (342 waiters)",
      repairDesc: "68ms P95 latency (0 waiters)",
    },
    {
      id: "network-drop",
      label: "Network Drop",
      vulnerableVal: 600,
      vulnerableHeight: "38%",
      repairedVal: 0,
      repairedHeight: "8%",
      vulnDesc: "Stochastic retry storms double-charge",
      repairDesc: "Zero duplicate transactions",
    },
  ];

  return (
    <div className="space-y-6">
      {/* =========================================================================
          1. HEADER (Strictly matching SpendHub simplicity & typography)
          ========================================================================= */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div>
          <h1 className="text-[22px] md:text-[24px] font-semibold tracking-tight text-[#191C24] leading-tight">
            Dashboard
            {/* Screen reader and test locator preservation for E2E suite */}
            <span className="sr-only">· Release Consequence Cockpit</span>
          </h1>
          <p className="text-xs md:text-sm text-[#747B87] mt-0.5">
            See what could happen to your release before it reaches production.
          </p>
        </div>

        {/* Unobtrusive primary action button */}
        <div className="flex items-center gap-2.5 shrink-0">
          <Link href="/time-machine">
            <Button variant="primary" size="sm" icon={<Play className="w-3.5 h-3.5 fill-current" />}>
              Run Experiment
            </Button>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          2. FIRST ROW — TWO LARGE CARDS (SpendHub Available Balance & Better Pricing)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Card: Available Balance equivalent (Simulated Financial Exposure) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#ECEEF1] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Top row: Small neutral pills matching SpendHub styling */}
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0F1F3] text-[#747B87]">
                Overview
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0F1F3] text-[#747B87]">
                Active Consequence Incident
              </span>
            </div>

            {/* Metric title & large value */}
            <h2 className="text-[14px] md:text-[15px] font-medium text-[#191C24]">
              Simulated Financial Exposure
            </h2>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-[38px] md:text-[42px] font-semibold text-[#191C24] tracking-tight leading-none">
                $1,500
              </span>
            </div>

            {/* Short supporting explanation with subtle trend */}
            <div className="flex items-center gap-1.5 text-xs text-[#747B87] mt-2 font-normal">
              <span className="text-[#FF6A13] font-medium flex items-center gap-0.5">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF6A13]" />
                INV-PAY-001
              </span>
              <span>&bull;</span>
              <span>4 duplicate debits on unpatched order ord_concurrent_99</span>
            </div>
          </div>

          {/* Thin divider and two simple footer metrics (Matching SpendHub Income/Expenses) */}
          <div className="mt-6 pt-4 border-t border-[#ECEEF1] grid grid-cols-2 gap-4">
            <div>
              <span className="block text-[11px] font-normal text-[#747B87]">
                Vulnerable
              </span>
              <span className="block text-[15px] font-semibold text-[#191C24] mt-0.5">
                5 charges ($600)
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-normal text-[#747B87]">
                Repaired
              </span>
              <span className="block text-[15px] font-semibold text-[#191C24] mt-0.5">
                1 charge ($120)
              </span>
            </div>
          </div>
        </div>

        {/* Right Card: Better Pricing Available equivalent (Repair Verified) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#ECEEF1] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            {/* Top row: Small neutral pills */}
            <div className="flex items-center gap-1.5 mb-3">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0F1F3] text-[#747B87]">
                Insight
              </span>
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F0F1F3] text-[#747B87]">
                Latest
              </span>
            </div>

            {/* Heading & value */}
            <h2 className="text-[14px] md:text-[15px] font-medium text-[#191C24]">
              Repair Verified
            </h2>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-[38px] md:text-[42px] font-semibold text-[#191C24] tracking-tight leading-none">
                $0
              </span>
              <span className="text-xs text-[#747B87] font-normal">
                at-risk post-repair
              </span>
            </div>

            {/* Concise explanation */}
            <p className="text-xs text-[#747B87] mt-2.5 leading-relaxed">
              Atomic reservation mutex in <code className="font-mono text-[#191C24] text-[11px]">processor.py</code> serializes checkout retry storms, completely eliminating duplicate customer charges and DB pool contention.
            </p>

            {/* Understated text link */}
            <div className="mt-2.5">
              <Link
                href="/remediation"
                className="text-xs font-medium text-[#22C55E] hover:underline underline-offset-4 inline-flex items-center gap-1"
              >
                Review repair <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Carousel / evidence indicator at bottom (Direct replica of SpendHub pagination) */}
          <div className="mt-6 pt-3 border-t border-[#ECEEF1]/60 flex items-center gap-2 text-xs text-[#969CA6]">
            <ChevronLeft className="w-3.5 h-3.5 cursor-pointer hover:text-[#191C24]" />
            <div className="w-6 h-1 rounded-full bg-[#22C55E]" />
            <div className="w-6 h-1 rounded-full bg-[#ECEEF1]" />
            <div className="w-6 h-1 rounded-full bg-[#ECEEF1]" />
            <div className="w-6 h-1 rounded-full bg-[#ECEEF1]" />
            <ChevronRight className="w-3.5 h-3.5 cursor-pointer hover:text-[#191C24]" />
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. SECOND ROW — PRIMARY VISUALIZATION (SpendHub Cash Flow equivalent)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#ECEEF1] p-6 shadow-[0_1px_3px_rgba(0,0,0,0.02)] space-y-6">
        {/* Card Header: Title, Metrics, Scenario Selector & Export */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-[#191C24]">
              Release Consequences
            </h3>
            {/* Cash-flow style dual metrics */}
            <div className="flex items-center gap-6 mt-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#747B87]">
                  <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                  <span>Repaired Target</span>
                </div>
                <span className="text-[22px] font-semibold text-[#191C24] tracking-tight block mt-0.5">
                  $0 Loss
                </span>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-xs text-[#747B87]">
                  <span className="w-2 h-2 rounded-full bg-[#FF6A13]" />
                  <span>Vulnerable Release</span>
                </div>
                <span className="text-[22px] font-semibold text-[#191C24] tracking-tight block mt-0.5">
                  $1,500 Risk
                </span>
              </div>
            </div>
          </div>

          {/* Right Controls: Scenario Switcher + Link */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            {/* Scenario toggle pills (matches SpendHub 7d | 30d | 6m | 12m) */}
            <div className="inline-flex items-center bg-[#F0F1F3] rounded-xl p-0.5 border border-[#ECEEF1] text-xs">
              <button
                type="button"
                onClick={() => setSelectedScenario("concurrent-checkouts")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedScenario === "concurrent-checkouts"
                    ? "bg-white text-[#191C24] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "text-[#747B87] hover:text-[#191C24]"
                }`}
              >
                Race Window
              </button>
              <button
                type="button"
                onClick={() => setSelectedScenario("lost-response")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedScenario === "lost-response"
                    ? "bg-white text-[#191C24] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "text-[#747B87] hover:text-[#191C24]"
                }`}
              >
                Lost Response
              </button>
              <button
                type="button"
                onClick={() => setSelectedScenario("commit-lag")}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  selectedScenario === "commit-lag"
                    ? "bg-white text-[#191C24] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                    : "text-[#747B87] hover:text-[#191C24]"
                }`}
              >
                DB Starvation
              </button>
            </div>

            <Link href="/time-machine">
              <Button variant="secondary" size="sm" icon={<Clock className="w-3.5 h-3.5" />}>
                Time Machine
              </Button>
            </Link>
          </div>
        </div>

        {/* Clean, Restrained Bar Chart (Matching SpendHub's visual density & geometry) */}
        <div className="pt-4 pb-2 border-t border-[#ECEEF1]">
          <div className="h-44 flex items-end justify-between gap-4 px-2 sm:px-6">
            {scenariosData.map((item) => {
              const isSelected = item.id === selectedScenario;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedScenario(item.id)}
                  className={`flex-1 flex flex-col items-center h-full justify-end cursor-pointer group transition-opacity ${
                    isSelected ? "opacity-100" : "opacity-75 hover:opacity-100"
                  }`}
                >
                  {/* Paired Bars: Vulnerable (Orange) vs Repaired (Green) */}
                  <div className="w-full max-w-[54px] flex items-end justify-center gap-1.5 h-36">
                    {/* Vulnerable Bar (Restrained Orange) */}
                    <div
                      style={{ height: item.vulnerableHeight }}
                      className={`w-4 sm:w-5 rounded-t-md transition-all ${
                        isSelected ? "bg-[#FF6A13]" : "bg-[#FF6A13]/75 group-hover:bg-[#FF6A13]"
                      }`}
                      title={`Vulnerable: ${item.vulnDesc}`}
                    />
                    {/* Repaired Bar (Restrained Green) */}
                    <div
                      style={{ height: item.repairedHeight }}
                      className={`w-4 sm:w-5 rounded-t-md transition-all ${
                        isSelected ? "bg-[#22C55E]" : "bg-[#22C55E]/75 group-hover:bg-[#22C55E]"
                      }`}
                      title={`Repaired: ${item.repairDesc}`}
                    />
                  </div>

                  {/* Scenario Label Underneath */}
                  <span
                    className={`mt-2 text-[11px] w-full text-center whitespace-nowrap transition-colors ${
                      isSelected ? "text-[#191C24] font-medium" : "text-[#747B87]"
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Understated Evidence Breadcrumb Footer */}
          <div className="mt-5 pt-4 border-t border-[#ECEEF1] flex flex-wrap items-center justify-between text-xs text-[#747B87] gap-3">
            <div className="flex items-center gap-4">
              <span>
                Selected: <strong className="font-medium text-[#191C24]">{scenariosData.find(s => s.id === selectedScenario)?.label}</strong>
              </span>
              <span>&bull;</span>
              <span>
                Evidence: <span className="text-[#191C24] font-mono text-[11px]">{scenariosData.find(s => s.id === selectedScenario)?.vulnDesc}</span>
              </span>
            </div>

            <div className="flex items-center gap-3">
              <Link href="/investigation" className="hover:text-[#191C24] flex items-center gap-1">
                Causal graph <ArrowRight className="w-3 h-3" />
              </Link>
              <Link href="/remediation" className="hover:text-[#191C24] flex items-center gap-1">
                Sandbox proof <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. LOWER CONTENT — OPERATIONAL RELEASE REGISTRY (Clean SpendHub Table)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#ECEEF1] overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
        <div className="p-5 border-b border-[#ECEEF1] flex items-center justify-between">
          <div>
            <h3 className="text-[15px] font-semibold text-[#191C24]">
              Operational Release Registry
            </h3>
            <p className="text-xs text-[#747B87] mt-0.5">
              Tracked release candidates under consequence evaluation
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs text-[#747B87]">
            <span className="font-mono text-[11px]">{overview.releases.length} Candidates</span>
            <Link href="/release-control" className="text-[#191C24] font-medium hover:underline text-xs">
              Policy gates &rarr;
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#F9FAFB] text-[#747B87] font-medium border-b border-[#ECEEF1]">
              <tr>
                <th className="px-5 py-3">Version</th>
                <th className="px-4 py-3">Branch & Commit</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Summary</th>
                <th className="px-4 py-3">Invariant Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEF1]">
              {overview.releases.map((rel) => {
                const isBlocked = rel.status === "blocked";
                const isApproved = rel.status === "approved";

                return (
                  <tr key={rel.id} className="hover:bg-[#F9FAFB]/70 transition-colors">
                    <td className="px-5 py-3.5">
                      <span className="font-semibold text-[#191C24] block">
                        {rel.version_tag}
                      </span>
                      <span className="text-[11px] font-mono text-[#969CA6]">
                        {rel.id}
                      </span>
                    </td>

                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5 text-[#191C24] font-mono text-[11px]">
                        <GitBranch className="w-3 h-3 text-[#747B87]" />
                        <span>{rel.branch}</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#969CA6] block mt-0.5">
                        {rel.commit_hash.substring(0, 8)}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-[#747B87]">
                      {rel.author}
                    </td>

                    <td className="px-4 py-3.5 max-w-xs truncate text-[#191C24]">
                      {rel.summary}
                    </td>

                    <td className="px-4 py-3.5">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F0F1F3] text-[#747B87]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A13]" />
                          Consequence Blocked
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F0FDF4] text-[#22C55E]">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#22C55E]" />
                          Verified Safe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F0F1F3] text-[#747B87]">
                          Investigating
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link
                          href="/time-machine"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-[#191C24] bg-[#F0F1F3] hover:bg-[#ECEEF1] transition-colors"
                        >
                          Time Machine
                        </Link>
                        <Link
                          href="/remediation"
                          className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-white bg-[#20242D] hover:bg-[#2A303C] transition-colors"
                        >
                          Review
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
