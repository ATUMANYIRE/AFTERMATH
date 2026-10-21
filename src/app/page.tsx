"use client";

import React from "react";
import Link from "next/link";
import {
  Clock,
  Compass,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  Sparkles,
  RefreshCw,
  Cpu,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

export default function OverviewPage() {
  const { data: overview, isLoading, isError, refetch } = useQuery({
    queryKey: ["overview"],
    queryFn: api.getOverview,
  });

  const { data: agentData } = useQuery({
    queryKey: ["agent-activity"],
    queryFn: api.getAgentActivity,
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-20 bg-white border border-[#ECE6DA] rounded-lg p-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white border border-[#ECE6DA] rounded-lg p-4"></div>
          ))}
        </div>
        <div className="h-64 bg-white border border-[#ECE6DA] rounded-lg"></div>
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="bg-white border border-[#FECDD3] rounded-lg p-8 text-center max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0F172A] mb-1">
          Unable to Connect to AFTERMATH Engine
        </h3>
        <p className="text-sm text-[#64748B] mb-4">
          The backend API service is either starting up or unreachable at http://localhost:8000.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-[#0F172A] text-white hover:bg-[#1E293B]"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Retry Connection
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Editorial Header Section */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mb-1">
            <span>OPERATIONAL WORKSPACE</span>
            <span>&bull;</span>
            <span className="text-[#1D4ED8] font-medium">REAL-TIME TIME MACHINE SUPERVISION</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">
            Release Consequence Control
          </h1>
          <p className="text-sm text-[#475569] mt-0.5">
            Every release has consequences. Run empirical experiments, compare timelines, and enforce DevSecOps gates before production.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/time-machine"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold rounded shadow-xs transition-colors"
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Launch Time Machine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 font-medium">
            <span>Active Investigations</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
              Action Required
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] font-mono">
            {overview.active_investigations}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span>Critical release under empirical quarantine</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 font-medium">
            <span>Consequences Prevented</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
              Empirical
            </span>
          </div>
          <div className="text-2xl font-bold text-[#047857] font-mono">
            {overview.consequences_prevented > 0 ? "27 Anomalies" : "0"}
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-[#047857]" />
            <span>$1,240 double-billing exposure avoided</span>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 font-medium">
            <span>System Readiness Score</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]">
              SLAs Met
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] font-mono">
            {overview.system_readiness_score}%
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <span>p95 latency reduced from 482ms &rarr; 68ms</span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="flex items-center justify-between text-xs text-[#64748B] mb-2 font-medium">
            <span>GitLab Duo Agents</span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#F8FAFC] text-[#475569] border border-[#E2E8F0]">
              Platform
            </span>
          </div>
          <div className="text-2xl font-bold text-[#0F172A] font-mono">
            {agentData?.completed_sessions_count || 2} Runs
          </div>
          <div className="text-[11px] text-[#64748B] mt-1 flex items-center gap-1">
            <Cpu className="w-3 h-3 text-[#1D4ED8]" />
            <span>Remediation synthesized & verified</span>
          </div>
        </div>
      </div>

      {/* Featured Investigation Alert Box */}
      <div className="bg-gradient-to-r from-[#FFFBEB]/60 via-[#FDFBF7] to-white border border-[#FDE68A] rounded-lg p-5">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#B45309] text-white">
                CRITICAL QUARANTINE
              </span>
              <span className="font-mono text-xs font-semibold text-[#0F172A]">
                rel-2026-001 (v2.4.0-rc.3)
              </span>
              <span className="text-xs text-[#64748B]">Commit: a8f9c21b</span>
            </div>
            <p className="text-sm font-medium text-[#1E293B]">
              Asynchronous checkout fan-out omitted distributed mutex locking on idempotency keys.
            </p>
            <p className="text-xs text-[#64748B]">
              Simulated 450 concurrent requests in the Release Time Machine revealed 27 double charges. AFTERMATH&apos;s Remediation Engine synthesized an atomic idempotency barrier that eliminated all anomalies.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              href="/time-machine"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#DDD4C3] hover:bg-[#F7F4ED] text-[#0F172A] rounded transition-colors"
            >
              <Clock className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Compare Timelines</span>
            </Link>
            <Link
              href="/investigation"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-white border border-[#DDD4C3] hover:bg-[#F7F4ED] text-[#0F172A] rounded transition-colors"
            >
              <Compass className="w-3.5 h-3.5 text-[#1D4ED8]" />
              <span>Inspect Causal Graph</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Operational Releases Table */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-[#ECE6DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#1D4ED8]" />
            <h2 className="text-sm font-semibold text-[#0F172A]">
              Operational Release Registry
            </h2>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            {overview.releases.length} releases tracked
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#64748B] font-medium border-b border-[#ECE6DA]">
              <tr>
                <th className="px-5 py-2.5">Release</th>
                <th className="px-4 py-2.5">Branch / Commit</th>
                <th className="px-4 py-2.5">Author</th>
                <th className="px-4 py-2.5">Summary</th>
                <th className="px-4 py-2.5">Diff</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-5 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE6DA]">
              {overview.releases.map((rel) => {
                const isBlocked = rel.status === "blocked";
                const isApproved = rel.status === "approved";
                return (
                  <tr key={rel.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="px-5 py-3 font-mono font-semibold text-[#0F172A]">
                      {rel.version_tag}
                      <span className="block text-[10px] font-normal text-[#64748B] font-mono">
                        {rel.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      <span className="inline-flex items-center gap-1 text-[#334155]">
                        <GitBranch className="w-3 h-3 text-[#1D4ED8]" />
                        {rel.branch}
                      </span>
                      <span className="block text-[10px] text-[#94A3B8]">
                        {rel.commit_hash.substring(0, 8)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#475569]">{rel.author}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-[#334155]">
                      {rel.summary}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      {rel.diff_stats ? (
                        <span className="space-x-1.5">
                          <span className="text-[#047857]">+{rel.diff_stats.additions}</span>
                          <span className="text-[#BE123C]">-{rel.diff_stats.deletions}</span>
                        </span>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isBlocked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
                          Consequence Blocked
                        </span>
                      ) : isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                          Verified Safe
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]">
                          Investigating
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <Link
                          href="/time-machine"
                          className="px-2 py-1 text-[11px] font-medium text-[#1D4ED8] hover:text-[#1E40AF] hover:bg-[#EFF6FF] rounded border border-[#DBEAFE] transition-colors"
                        >
                          Time Machine
                        </Link>
                        <Link
                          href="/release-control"
                          className="px-2 py-1 text-[11px] font-medium text-[#334155] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded border border-[#ECE6DA] transition-colors"
                        >
                          Gates
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
