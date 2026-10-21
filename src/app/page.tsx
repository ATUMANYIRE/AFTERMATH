"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  Compass,
  GitBranch,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  Wrench,
  Cpu,
  RefreshCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Play,
  Activity,
  FileCode,
  ShieldCheck,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/tabs";

export default function OverviewPage() {
  const [selectedView, setSelectedView] = useState("all");

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
        <div className="h-16 bg-white/70 rounded-2xl border border-[#DCE2EB] p-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white/70 rounded-2xl border border-[#DCE2EB] p-5" />
          ))}
        </div>
        <div className="h-80 bg-white/70 rounded-2xl border border-[#DCE2EB]" />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center max-w-xl mx-auto my-16 shadow-card">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C74747] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#172033] mb-1">
          Unable to Connect to AFTERMATH Engine
        </h3>
        <p className="text-sm text-[#667085] mb-6">
          The backend API is starting up or unreachable at http://localhost:8000.
        </p>
        <Button onClick={() => refetch()} variant="primary" icon={<RefreshCw className="w-4 h-4" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* =========================================================================
          1. EXECUTIVE HEADER (Inspired by screen.jpg layout)
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF4FE] text-[#3558D4] border border-[#BFD5FB]/60">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3558D4] animate-pulse" />
              Live Consequence Engine Active
            </span>
            <span className="text-xs text-[#667085]">|</span>
            <span className="text-xs text-[#667085] font-mono">rel-2026-001 (feat/distributed-checkout)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
            Release Consequence Cockpit
          </h1>
          <p className="text-sm text-[#667085] mt-1 max-w-2xl leading-relaxed">
            Every release has consequences. See them before production. AFTERMATH reproduces runtime race conditions, graphs cascading blast radiuses, and synthesizes verifiable repairs.
          </p>
        </div>

        {/* Primary CTA and Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <Link href="/time-machine">
            <Button variant="primary" icon={<Clock className="w-4 h-4" />}>
              Launch Time Machine
            </Button>
          </Link>
          <Link href="/investigation">
            <Button variant="secondary" icon={<Compass className="w-4 h-4" />}>
              Causal Graph
            </Button>
          </Link>
        </div>
      </div>

      {/* =========================================================================
          2. TOP METRIC CARDS (Directly styled after screen.jpg top cards)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          tag="Active Invariant Breach"
          tagVariant="error"
          title="Financial Exposure at Risk"
          value="$1,500.00"
          delta={{
            value: "Violated INV-PAY-001: 4 Duplicate Charges",
            isRisk: true,
          }}
          description="Unbounded retry storms double-debited order ord_concurrent_99"
          subStats={[
            { label: "Unpatched Debits", value: "5 Charges" },
            { label: "Repaired Debits", value: "1 Charge (0 Dup)" },
          ]}
        />

        <StatCard
          tag="Remediation Verified"
          tagVariant="success"
          title="Sandbox Safety Score"
          value="98.4%"
          delta={{
            value: "+100% Invariant Pass Rate in Sandbox",
            isPositive: true,
          }}
          description="Atomic reservation lock verified in isolated worktree"
          subStats={[
            { label: "P95 Latency", value: "68ms (was 482ms)" },
            { label: "Approval Gate", value: "Pending Sign-off" },
          ]}
        />

        <StatCard
          tag="Cascading Failure"
          tagVariant="warning"
          title="PostgreSQL Contention"
          value="1,600ms"
          delta={{
            value: "Connection Pool Exhaustion (342 Waiters)",
            isRisk: true,
          }}
          description="Unbounded checkout fan-out starved database connection pool"
          subStats={[
            { label: "Max Pool Size", value: "100 Conns" },
            { label: "Post-Fix Queue", value: "0 Waiters" },
          ]}
        />

        <StatCard
          tag="Superposition Matrix"
          tagVariant="accent"
          title="Fault Scenarios Tested"
          value="5 / 5"
          delta={{
            value: "All Scenarios Verified Against Repair",
            isPositive: true,
          }}
          description="Race windows, network drops, delayed commits, gateway chaos"
          subStats={[
            { label: "Vulnerable State", value: "5 Failed" },
            { label: "Repaired State", value: "5 Passed" },
          ]}
        />
      </div>

      {/* =========================================================================
          3. FEATURED NARRATIVE HERO CARD: "THE GOLDEN STORY"
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#DCE2EB] p-6 lg:p-8 shadow-card">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#DCE2EB]/80">
          <div className="space-y-1.5 max-w-3xl">
            <div className="flex items-center gap-2">
              <Badge variant="error" dot>Active Consequence Incident</Badge>
              <span className="text-xs font-mono font-medium text-[#667085]">
                Target: commit a8f9c21b4d08 on feat/distributed-checkout
              </span>
            </div>
            <h2 className="text-xl font-bold text-[#172033] tracking-tight">
              A risky release caused duplicate customer charges. AFTERMATH reproduced the defect, traced the consequences, and verified an atomic repair.
            </h2>
            <p className="text-sm text-[#667085] leading-relaxed">
              When payment responses were dropped, concurrent checkout retries lacked a distributed mutex reservation. The resulting race condition double-debited customers and starved the downstream PostgreSQL connection pool within 1.6 seconds.
            </p>
          </div>

          <div className="flex flex-wrap lg:flex-col gap-2.5 shrink-0">
            <Link href="/remediation">
              <Button variant="primary" size="md" icon={<Wrench className="w-4 h-4" />} className="w-full justify-center">
                Review & Approve Patch
              </Button>
            </Link>
            <Link href="/time-machine">
              <Button variant="secondary" size="md" icon={<Clock className="w-4 h-4" />} className="w-full justify-center">
                Re-run Experiment Pair
              </Button>
            </Link>
          </div>
        </div>

        {/* Visual Consequence Progression Timeline */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Step 1 */}
          <div className="bg-[#FAF9F6] rounded-xl p-5 border border-[#DCE2EB]/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#C74747] flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4" />
                1. Empirical Failure
              </span>
              <span className="font-mono text-[10px] text-[#667085]">exp-vuln-001</span>
            </div>
            <p className="text-xs text-[#172033] font-medium">
              4 Duplicate debits detected under concurrent retry storm.
            </p>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Order <code className="font-mono text-[#C74747]">ord_concurrent_99</code> charged 5 times ($600.00 instead of $120.00).
            </p>
            <Link
              href="/time-machine"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#3558D4] hover:text-[#2846B4] pt-1"
            >
              View in Time Machine <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Step 2 */}
          <div className="bg-[#FAF9F6] rounded-xl p-5 border border-[#DCE2EB]/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#D78A43] flex items-center gap-1.5">
                <Compass className="w-4 h-4" />
                2. Causal Blast Radius
              </span>
              <span className="font-mono text-[10px] text-[#667085]">11 Nodes &bull; 8 Edges</span>
            </div>
            <p className="text-xs text-[#172033] font-medium">
              Traced from AST lock gap to DB connection starvation.
            </p>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Missing mutex caused connection pool starvation (queue depth: 342) and $1,500 total exposure.
            </p>
            <Link
              href="/investigation"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#3558D4] hover:text-[#2846B4] pt-1"
            >
              Inspect Causal Graph <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {/* Step 3 */}
          <div className="bg-[#FAF9F6] rounded-xl p-5 border border-[#DCE2EB]/80 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-[#168568] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                3. Sandboxed Fix
              </span>
              <span className="font-mono text-[10px] text-[#667085]">rem-wf-001</span>
            </div>
            <p className="text-xs text-[#172033] font-medium">
              Atomic reservation lock eliminates 100% of double debits.
            </p>
            <p className="text-[11px] text-[#667085] leading-relaxed">
              Subprocess sandbox verified tests pass in 0.68s with exit code 0. Awaiting human approval.
            </p>
            <Link
              href="/remediation"
              className="inline-flex items-center gap-1 text-xs font-medium text-[#3558D4] hover:text-[#2846B4] pt-1"
            >
              Open Remediation Studio <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. OPERATIONAL RELEASES REGISTRY (Clean Table matching screen.jpg)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#DCE2EB] overflow-hidden shadow-card">
        <div className="p-6 border-b border-[#DCE2EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#172033]">
              Operational Release Registry
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Tracked release candidates under consequence supervision
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-[#667085] font-mono mr-2">
              {overview.releases.length} Candidates Tracked
            </span>
            <Link href="/release-control">
              <Button variant="outline" size="sm" icon={<ShieldCheck className="w-3.5 h-3.5" />}>
                View Policy Gates
              </Button>
            </Link>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#FAF9F6] text-[#667085] font-medium border-b border-[#DCE2EB] text-xs">
              <tr>
                <th className="px-6 py-3">Version / ID</th>
                <th className="px-5 py-3">Branch & Commit</th>
                <th className="px-5 py-3">Author</th>
                <th className="px-5 py-3">Summary</th>
                <th className="px-4 py-3">Diff Stats</th>
                <th className="px-5 py-3">Consequence Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DCE2EB]/70">
              {overview.releases.map((rel) => {
                const isBlocked = rel.status === "blocked";
                const isApproved = rel.status === "approved";

                return (
                  <tr key={rel.id} className="hover:bg-[#FAF9F6]/60 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#172033] block">
                        {rel.version_tag}
                      </span>
                      <span className="text-xs font-mono text-[#667085]">
                        {rel.id}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-[#172033]">
                        <GitBranch className="w-3.5 h-3.5 text-[#3558D4]" />
                        <span>{rel.branch}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#667085] block mt-0.5">
                        {rel.commit_hash.substring(0, 8)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-[#667085]">
                      {rel.author}
                    </td>

                    <td className="px-5 py-4 max-w-xs truncate text-xs text-[#172033] font-medium">
                      {rel.summary}
                    </td>

                    <td className="px-4 py-4 font-mono text-xs">
                      {rel.diff_stats ? (
                        <span className="space-x-1.5">
                          <span className="text-[#168568]">+{rel.diff_stats.additions}</span>
                          <span className="text-[#C74747]">-{rel.diff_stats.deletions}</span>
                        </span>
                      ) : (
                        <span className="text-[#667085]">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4">
                      {isBlocked ? (
                        <Badge variant="error" dot>Consequence Blocked</Badge>
                      ) : isApproved ? (
                        <Badge variant="success" dot>Verified Safe</Badge>
                      ) : (
                        <Badge variant="accent" dot>Under Investigation</Badge>
                      )}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="inline-flex items-center gap-2">
                        <Link href="/time-machine">
                          <Button variant="outline" size="sm">
                            Time Machine
                          </Button>
                        </Link>
                        <Link href="/remediation">
                          <Button variant="primary" size="sm">
                            Remediate
                          </Button>
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
