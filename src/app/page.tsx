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
import { api, ReleaseSuperpositionItem } from "@/lib/api";
import { Button } from "@/components/ui/button";

export default function OverviewPage() {
  const [selectedScenario, setSelectedScenario] = useState<string>("lost-response-retry");

  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ["overview"],
    queryFn: api.getOverview,
  });

  const releaseId = overview?.releases?.[0]?.id;
  const { data: superposition } = useQuery<ReleaseSuperpositionItem>({
    queryKey: ["release-superposition", releaseId],
    queryFn: () => api.getReleaseSuperposition(releaseId as string),
    enabled: !!releaseId,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-white rounded-xl border border-[#ECEEF1] w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 h-56 bg-white rounded-[13px] border border-[#ECEEF1]" />
          <div className="lg:col-span-5 h-56 bg-white rounded-[13px] border border-[#ECEEF1]" />
        </div>
        <div className="h-80 bg-white rounded-[13px] border border-[#ECEEF1]" />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="bg-white border border-[#ECEEF1] rounded-[13px] p-8 text-center max-w-md mx-auto my-16">
        <h3 className="text-[14px] text-[#191C24] mb-1">
          Unable to Connect to AFTERMATH Engine
        </h3>
        <p className="text-[12px] text-[#747B87] mb-5">
          The backend service is starting up or unreachable at http://localhost:8000.
        </p>
        <Button onClick={() => refetch()} variant="primary" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  // All figures come from the release's 5-scenario simulation matrix (same source as Release Control).
  const matrix = superposition?.scenario_matrix ?? [];
  const sumVuln = matrix.reduce((n, s) => n + s.vulnerable.exposure_usd, 0);
  const sumRep = matrix.reduce((n, s) => n + s.repaired.exposure_usd, 0);
  const dupVuln = matrix.reduce((n, s) => n + s.vulnerable.duplicate_debits, 0);
  const dupRep = matrix.reduce((n, s) => n + s.repaired.duplicate_debits, 0);
  const maxExposure = Math.max(1, ...matrix.map((s) => s.vulnerable.exposure_usd));
  const usd = (n: number) => `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  const shortLabel: Record<string, string> = {
    "lost-response-retry": "Lost response",
    "concurrent-checkout": "Race window",
    "concurrent-checkouts": "Race window",
    "repeated-idempotency": "Key replay",
    "duplicate-idempotency-keys": "Key replay",
    "delayed-db-commit": "DB lag",
    "transient-network": "Network drop",
    "transient-network-drop": "Network drop",
  };
  const selected = matrix.find((s) => s.scenario_id === selectedScenario) ?? matrix[0];
  const release = overview.releases[0];
  const card = "bg-white rounded-[13px] border border-[#ECEEF1] p-5";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="typo-page-title text-[#191C24]">
            Dashboard
            {/* Preserved for E2E locator */}
            <span className="sr-only">· Release Consequence Cockpit</span>
            <span className="sr-only">Active Consequence Incident</span>
          </h1>
          <p className="typo-description text-[#747B87] mt-0.5">
            See what could happen to your release before it reaches production.
          </p>
        </div>
        <Link href="/time-machine">
          <Button variant="primary" size="sm" icon={<Play className="w-3 h-3 fill-current" />}>
            Run Experiment
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className={`lg:col-span-7 ${card} flex flex-col justify-between`}>
          <div>
            <h2 className="typo-card-heading text-[#747B87]">Simulated financial exposure</h2>
            <div className="typo-metric-primary text-[#191C24] mt-2">{usd(sumVuln)}</div>
            <p className="typo-description text-[#747B87] mt-2">
              Modelled across {matrix.length} fault scenarios for {release?.version_tag ?? "this release"}. No real customer was charged. Source: Release Control scenario matrix (not Time Machine runs).
            </p>
          </div>
          <div className="mt-5 pt-4 border-t border-[#ECEEF1] grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <span className="block text-[11px] leading-4 text-[#747B87]">Vulnerable release</span>
              <span className="block text-[15px] leading-6 text-[#191C24]">{dupVuln} simulated duplicate charges</span>
            </div>
            <div>
              <span className="block text-[11px] leading-4 text-[#747B87]">Repaired release</span>
              <span className="block text-[15px] leading-6 text-[#191C24]">{dupRep} simulated duplicate charges</span>
            </div>
          </div>
        </div>

        <div className={`lg:col-span-5 ${card} flex flex-col justify-between`}>
          <div>
            <h2 className="typo-card-heading text-[#747B87]">Repair verified</h2>
            <div className="mt-2 flex items-baseline gap-2 whitespace-nowrap">
              <span className="typo-metric-primary text-[#191C24]">{usd(sumRep)}</span>
              <span className="typo-description text-[#747B87]">simulated exposure after repair</span>
            </div>
            <p className="typo-description text-[#747B87] mt-2">
              {superposition?.recommendation.headline ?? "Run the experiment pair to verify the repair."}
            </p>
          </div>
          <Link
            href="/remediation"
            className="mt-5 pt-4 border-t border-[#ECEEF1] typo-button text-[#191C24] inline-flex items-center gap-1 hover:text-[#FF6A13]"
          >
            Review repair <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <div className={card}>
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h3 className="typo-card-heading text-[#747B87]">Release consequences</h3>
            <div className="flex items-center gap-8 mt-3">
              <div>
                <div className="flex items-center gap-1.5 typo-description text-[#747B87]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#D5D8DD]" />
                  After repair
                </div>
                <span className="typo-metric-secondary text-[#191C24] block">{usd(sumRep)}</span>
              </div>
              <div>
                <div className="flex items-center gap-1.5 typo-description text-[#747B87]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FF6A13]" />
                  Vulnerable release
                </div>
                <span className="typo-metric-secondary text-[#191C24] block">{usd(sumVuln)}</span>
              </div>
            </div>
          </div>

          <Link href="/time-machine">
            <Button variant="secondary" size="sm" icon={<Clock className="w-3 h-3" />}>
              Time Machine
            </Button>
          </Link>
        </div>

        <div className="overflow-x-auto">
        <div
          className="mt-4 h-40 min-w-[520px] flex items-end justify-between gap-3 px-1 sm:px-4 border-b border-[#ECEEF1]"
          role="group"
          aria-label="Simulated exposure per scenario"
        >
          {matrix.map((s) => {
            const isSelected = s.scenario_id === selected?.scenario_id;
            return (
              <button
                type="button"
                key={s.scenario_id}
                onClick={() => setSelectedScenario(s.scenario_id)}
                aria-pressed={isSelected}
                className={`flex-1 min-w-0 flex flex-col items-center h-full justify-end transition-opacity ${
                  isSelected ? "opacity-100" : "opacity-50 hover:opacity-100"
                }`}
              >
                <span className="text-[11px] leading-4 text-[#191C24] mb-1 tabular-nums">{usd(s.vulnerable.exposure_usd)}</span>
                <div
                  style={{ height: `${Math.max(6, (s.vulnerable.exposure_usd / maxExposure) * 84)}px` }}
                  className="w-5 rounded-t-[5px] bg-[#FF6A13]"
                  title={`Vulnerable: ${s.vulnerable.duplicate_debits} duplicate charges, ${usd(s.vulnerable.exposure_usd)}`}
                />
                <span className="mt-2 mb-2 text-[11px] leading-4 text-[#747B87] whitespace-nowrap">
                  {shortLabel[s.scenario_id] ?? s.name.split(" ").slice(0, 2).join(" ")}
                </span>
              </button>
            );
          })}
        </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between typo-description text-[#747B87] gap-3">
          <span className="min-w-0 truncate" title={selected?.name}>
            {selected?.name}: <span className="text-[#191C24]">{selected?.vulnerable.duplicate_debits} simulated duplicate charges, {selected ? usd(selected.vulnerable.exposure_usd) : ""} exposure</span> → <span className="text-[#191C24]">{selected?.repaired.duplicate_debits} after repair</span>
          </span>
          <div className="flex items-center gap-4 shrink-0">
            <Link href="/investigation" className="hover:text-[#191C24] flex items-center gap-1">
              Causal graph <ArrowRight className="w-3 h-3" />
            </Link>
            <Link href="/remediation" className="hover:text-[#191C24] flex items-center gap-1">
              Sandbox proof <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. LOWER CONTENT â€” OPERATIONAL RELEASE REGISTRY (Clean SpendHub Table)
          ========================================================================= */}
      <div className="bg-white rounded-[13px] border border-[#ECEEF1] overflow-hidden">
        <div className="p-5 border-b border-[#ECEEF1] flex items-center justify-between">
          <div>
            <h3 className="typo-card-heading text-[#747B87]">
              Operational Release Registry
            </h3>
            <p className="text-[12px] text-[#747B87] mt-0.5">
              Tracked release candidates under consequence evaluation
            </p>
          </div>

          <div className="flex items-center gap-3 text-[12px] text-[#747B87]">
            <span className="font-mono text-[11px]">{overview.releases.length} Candidates</span>
            <Link href="/release-control" className="text-[#191C24] hover:underline text-[12px]">
              Policy gates &rarr;
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-[12px] table-fixed">
            <colgroup>
              <col className="w-[150px]" />
              <col className="w-[230px]" />
              <col className="w-[120px]" />
              <col />
              <col className="w-[160px]" />
              <col className="w-[240px]" />
            </colgroup>
            <thead className="bg-[#F9FAFB] text-[#747B87] border-b border-[#ECEEF1]">
              <tr>
                <th className="px-5 h-10 font-normal">Version</th>
                <th className="px-4 h-10 font-normal">Branch &amp; commit</th>
                <th className="px-4 h-10 font-normal">Author</th>
                <th className="px-4 h-10 font-normal">Summary</th>
                <th className="px-4 h-10 font-normal">Status</th>
                <th className="pl-4 pr-5 h-10 font-normal text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECEEF1]">
              {overview.releases.map((rel) => {
                const isBlocked = rel.status === "blocked";
                const isApproved = rel.status === "approved" || rel.status === "verified_safe";
                const statusLabel = isBlocked ? "Blocked" : isApproved ? "Verified safe" : "Investigating";

                return (
                  <tr key={rel.id} className="h-[60px] hover:bg-[#F9FAFB]/70 transition-colors">
                    <td className="px-5">
                      <span className="block text-[#191C24] whitespace-nowrap" title={rel.version_tag}>
                        {rel.version_tag}
                      </span>
                      <span className="block text-[11px] text-[#969CA6] truncate" title={rel.id}>
                        {rel.id}
                      </span>
                    </td>

                    <td className="px-4">
                      <div className="flex items-center gap-1.5 text-[#191C24] text-[12px] min-w-0">
                        <GitBranch className="w-3 h-3 shrink-0 text-[#747B87]" />
                        <span className="truncate" title={rel.branch}>{rel.branch}</span>
                      </div>
                      <span className="block text-[11px] font-mono text-[#969CA6] whitespace-nowrap" title={rel.commit_hash}>
                        {rel.commit_hash.substring(0, 8)}
                      </span>
                    </td>

                    <td className="px-4 text-[#747B87]">
                      <span className="block truncate" title={rel.author}>{rel.author}</span>
                    </td>

                    <td className="px-4 text-[#191C24]">
                      <span className="block truncate" title={rel.summary}>{rel.summary}</span>
                    </td>

                    <td className="px-4">
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap px-2 py-0.5 rounded-full typo-badge bg-[#F4F5F7] text-[#747B87]">
                        <span className={`w-1.5 h-1.5 rounded-full ${isBlocked ? "bg-[#FF6A13]" : "bg-[#191C24]/30"}`} />
                        {statusLabel}
                      </span>
                    </td>

                    <td className="pl-4 pr-5 text-right">
                      <div className="inline-flex items-center gap-2 whitespace-nowrap">
                        <Link
                          href="/time-machine"
                          className="px-3 h-8 inline-flex items-center rounded-[10px] typo-button text-[#191C24] bg-[#F4F5F7] hover:bg-[#ECEEF1] transition-colors"
                        >
                          Time Machine
                        </Link>
                        <Link
                          href="/remediation"
                          className="px-3 h-8 inline-flex items-center rounded-[10px] typo-button text-white bg-[#20242D] hover:bg-[#2A303C] transition-colors"
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
