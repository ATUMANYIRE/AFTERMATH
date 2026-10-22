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
  Zap,
  Lock,
  Database,
  DollarSign,
  ArrowUpRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function OverviewPage() {
  const [activeScenario, setActiveScenario] = useState<"concurrent" | "gateway" | "exhaustion">("concurrent");

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
        <div className="h-16 bg-white rounded-2xl border border-[#E5E7EB] p-6 shadow-card" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-52 bg-white rounded-2xl border border-[#E5E7EB] shadow-card" />
          <div className="lg:col-span-5 h-52 bg-white rounded-2xl border border-[#E5E7EB] shadow-card" />
        </div>
        <div className="h-96 bg-white rounded-2xl border border-[#E5E7EB] shadow-card" />
      </div>
    );
  }

  if (isError || !overview) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center max-w-xl mx-auto my-16 shadow-card">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-[#C74747] flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-semibold text-[#111827] mb-1">
          Unable to Connect to AFTERMATH Engine
        </h3>
        <p className="text-sm text-[#6B7280] mb-6">
          The backend API is starting up or unreachable at http://localhost:8000.
        </p>
        <Button onClick={() => refetch()} variant="primary" icon={<RefreshCw className="w-4 h-4" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* =========================================================================
          1. EXECUTIVE HEADER (Spacious & Refined)
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-1">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EA580C] animate-pulse" />
              Live Consequence Engine Active
            </span>
            <span className="text-xs text-[#D1D5DB]">/</span>
            <span className="text-xs font-mono font-medium text-[#6B7280]">
              rel-2026-001 (feat/distributed-checkout)
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111827]">
            Release Consequence Cockpit
          </h1>
          <p className="text-sm text-[#6B7280] mt-1 max-w-2xl leading-relaxed">
            Every release has consequences. See them before production. AFTERMATH reproduces runtime race conditions, graphs cascading blast radiuses, and synthesizes verifiable repairs.
          </p>
        </div>

        {/* Primary Controls */}
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
          2. DUAL DOMINANT METRIC CARDS (Directly styled after screen.jpg top cards)
          ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Dominant Card (60% width): Available Financial Exposure */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-[#E5E7EB] p-7 shadow-card flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-rose-50/50 via-transparent to-transparent pointer-events-none rounded-tr-2xl" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#6B7280]">
                Simulated Financial Exposure
              </span>
              <Badge variant="error" dot>
                Active Consequence Incident
              </Badge>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111827]">
                $1,500.00
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#C74747] bg-[#FEF2F2] border border-[#FECACA] px-2 py-0.5 rounded-full">
                <AlertTriangle className="w-3 h-3" />
                INV-PAY-001 Invariant Violated
              </span>
            </div>

            <p className="text-xs text-[#6B7280] leading-relaxed max-w-xl">
              Unbounded checkout retry storms double-debited order <code className="font-mono text-[#C74747] bg-rose-50 px-1 py-0.5 rounded">ord_concurrent_99</code> 4 times ($600.00 charged vs $120.00 expected).
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <span className="block text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                Unpatched Debits
              </span>
              <span className="block text-sm font-semibold text-[#C74747] mt-0.5">
                5 Charges (4 Dup)
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                PostgreSQL Queue
              </span>
              <span className="block text-sm font-semibold text-[#D78A43] mt-0.5">
                342 Waiters (1,600ms)
              </span>
            </div>
            <div>
              <span className="block text-[11px] font-medium text-[#6B7280] uppercase tracking-wider">
                Repaired Debits
              </span>
              <span className="block text-sm font-semibold text-[#168568] mt-0.5">
                1 Charge (0 Dup)
              </span>
            </div>
          </div>
        </div>

        {/* Right Dominant Card (40% width): Verified Invariant Fix / Sandbox Safety */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-[#E5E7EB] p-7 shadow-card flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-emerald-50/50 via-transparent to-transparent pointer-events-none rounded-tr-2xl" />

          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold tracking-wider uppercase text-[#6B7280]">
                Autonomous Remediation
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#EA580C] bg-[#FFF7ED] border border-[#FED7AA] px-2.5 py-0.5 rounded-full">
                Remediation Ready
              </span>
            </div>

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-4xl sm:text-5xl font-bold tracking-tight text-[#111827]">
                98.4%
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#168568] bg-[#ECFDF5] border border-[#A7F3D0] px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3 h-3" />
                100% Invariant Pass
              </span>
            </div>

            <h4 className="text-sm font-semibold text-[#111827] mt-1 mb-1">
              Atomic Mutex Barrier Active
            </h4>
            <p className="text-xs text-[#6B7280] leading-relaxed">
              Synthesized reservation lock in <code className="font-mono text-[#111827] bg-slate-100 px-1 py-0.5 rounded">processor.py</code> serializes concurrent retries. Subprocess sandbox verified tests pass in 0.68s.
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#E5E7EB] flex items-center justify-between">
            <div className="text-xs text-[#6B7280]">
              <span className="font-medium text-[#111827]">P95 Latency:</span> 68ms (was 482ms)
            </div>
            <Link href="/remediation">
              <Button variant="primary" size="sm" icon={<ArrowRight className="w-3.5 h-3.5" />}>
                Review & Sign-Off Patch
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* =========================================================================
          3. MAIN VISUAL CENTERPIECE: "CASH FLOW" / CONSEQUENCE SUPERPOSITION FLOW
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] p-7 shadow-card">
        {/* Top bar with Title, Legend Dots, and Scenario Switcher */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-[#E5E7EB]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-bold text-[#111827] tracking-tight">
                Consequence Superposition & Lifecycle Flow
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-[#6B7280]">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#EA580C]" />
                <strong className="text-[#111827]">Unpatched Target:</strong> Commit <code className="font-mono text-[#EA580C]">a8f9c21b</code> ($1,500 Exposure · 4 Dups)
              </span>
              <span className="text-[#D1D5DB]">•</span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#168568]" />
                <strong className="text-[#111827]">Repaired Target:</strong> Patch <code className="font-mono text-[#168568]">d7a2e1c</code> ($0.00 Exposure · 0 Dups)
              </span>
            </div>
          </div>

          {/* Scenario Selector Pills */}
          <div className="flex items-center bg-[#F3F4F6] p-1 rounded-xl border border-[#E5E7EB] shrink-0">
            <button
              onClick={() => setActiveScenario("concurrent")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeScenario === "concurrent"
                  ? "bg-white text-[#111827] shadow-sm font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Concurrent Checkouts
            </button>
            <button
              onClick={() => setActiveScenario("gateway")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeScenario === "gateway"
                  ? "bg-white text-[#111827] shadow-sm font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Lost Gateway Response
            </button>
            <button
              onClick={() => setActiveScenario("exhaustion")}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeScenario === "exhaustion"
                  ? "bg-white text-[#111827] shadow-sm font-semibold"
                  : "text-[#6B7280] hover:text-[#111827]"
              }`}
            >
              Database Starvation
            </button>
          </div>
        </div>

        {/* Visual Dual-Track Lifecycle Timeline Diagram */}
        <div className="py-7 space-y-6">
          {/* TRACK 1: UNPATCHED VULNERABLE RELEASE */}
          <div className="bg-[#FAF9F6] rounded-xl p-5 border border-[#E5E7EB] relative">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#C74747] uppercase tracking-wider">
                <ShieldAlert className="w-4 h-4 text-[#C74747]" />
                Vulnerable Release Execution Path (Unpatched Defect)
              </span>
              <span className="font-mono text-xs text-[#6B7280]">
                exp-vuln-001 · commit a8f9c21b
              </span>
            </div>

            {/* Stepper Flow Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E5E7EB] shadow-sm relative">
                <span className="text-[10px] font-mono font-semibold text-[#6B7280] block mb-1">
                  STEP 1 · CODE DEFECT
                </span>
                <span className="text-xs font-semibold text-[#111827] block">
                  Un-mutexed Checkout
                </span>
                <span className="text-[11px] text-[#6B7280] block mt-0.5">
                  Missing lock in <code className="text-[#C74747] font-mono">processor.py:44</code>
                </span>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E5E7EB] shadow-sm relative">
                <span className="text-[10px] font-mono font-semibold text-[#6B7280] block mb-1">
                  STEP 2 · RACE WINDOW
                </span>
                <span className="text-xs font-semibold text-[#EA580C] block">
                  +40ms Overlapping Window
                </span>
                <span className="text-[11px] text-[#6B7280] block mt-0.5">
                  5 concurrent payment attempts
                </span>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E5E7EB] shadow-sm relative">
                <span className="text-[10px] font-mono font-semibold text-[#6B7280] block mb-1">
                  STEP 3 · CASCADE
                </span>
                <span className="text-xs font-semibold text-[#D78A43] block">
                  1,600ms DB Starvation
                </span>
                <span className="text-[11px] text-[#6B7280] block mt-0.5">
                  342 connections queued in pool
                </span>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-lg p-3.5 border border-rose-200 bg-rose-50/30 shadow-sm relative">
                <span className="text-[10px] font-mono font-semibold text-[#C74747] block mb-1">
                  STEP 4 · CONSEQUENCE
                </span>
                <span className="text-xs font-bold text-[#C74747] block">
                  $1,500 Duplicate Debits
                </span>
                <span className="text-[11px] text-[#C74747] block mt-0.5">
                  Violated Invariant INV-PAY-001
                </span>
              </div>
            </div>
          </div>

          {/* TRACK 2: REPAIRED VERIFIED RELEASE */}
          <div className="bg-[#FAF9F6] rounded-xl p-5 border border-[#E5E7EB] relative">
            <div className="flex items-center justify-between mb-4">
              <span className="inline-flex items-center gap-2 text-xs font-bold text-[#168568] uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4 text-[#168568]" />
                Repaired Release Execution Path (AFTERMATH Verified)
              </span>
              <span className="font-mono text-xs text-[#6B7280]">
                rem-wf-001 · commit d7a2e1c
              </span>
            </div>

            {/* Stepper Flow Nodes */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
              {/* Step 1 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E5E7EB] shadow-sm relative">
                <span className="text-[10px] font-mono font-semibold text-[#6B7280] block mb-1">
                  STEP 1 · ATOMIC MUTEX
                </span>
                <span className="text-xs font-semibold text-[#111827] block">
                  Reservation Lock
                </span>
                <span className="text-[11px] text-[#6B7280] block mt-0.5">
                  <code className="text-[#168568] font-mono">asyncio.Lock</code> on checkout_id
                </span>
              </div>

              {/* Step 2 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E5E7EB] shadow-sm relative">
                <span className="text-[10px] font-mono font-semibold text-[#6B7280] block mb-1">
                  STEP 2 · SERIALIZATION
                </span>
                <span className="text-xs font-semibold text-[#168568] block">
                  0ms Conflict Window
                </span>
                <span className="text-[11px] text-[#6B7280] block mt-0.5">
                  First debit wins, retries serialized
                </span>
              </div>

              {/* Step 3 */}
              <div className="bg-white rounded-lg p-3.5 border border-[#E5E7EB] shadow-sm relative">
                <span className="text-[10px] font-mono font-semibold text-[#6B7280] block mb-1">
                  STEP 3 · OPTIMAL QUEUE
                </span>
                <span className="text-xs font-semibold text-[#168568] block">
                  68ms P95 Latency
                </span>
                <span className="text-[11px] text-[#6B7280] block mt-0.5">
                  0 connection waiters in DB pool
                </span>
              </div>

              {/* Step 4 */}
              <div className="bg-white rounded-lg p-3.5 border border-emerald-200 bg-emerald-50/30 shadow-sm relative">
                <span className="text-[10px] font-mono font-semibold text-[#168568] block mb-1">
                  STEP 4 · PRESERVED
                </span>
                <span className="text-xs font-bold text-[#168568] block">
                  $0.00 At-Risk (Exact-1)
                </span>
                <span className="text-[11px] text-[#168568] block mt-0.5">
                  100% Invariant Compliance
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Metrics Comparison Footer */}
        <div className="pt-5 border-t border-[#E5E7EB] grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              At-Risk Exposure
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm line-through text-[#6B7280]">$1,500</span>
              <span className="text-base font-bold text-[#168568]">$0.00</span>
            </div>
            <span className="text-[10px] text-[#168568] font-medium">-100% exposure eliminated</span>
          </div>

          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Duplicate Debits
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm line-through text-[#6B7280]">4 charges</span>
              <span className="text-base font-bold text-[#168568]">0 charges</span>
            </div>
            <span className="text-[10px] text-[#168568] font-medium">Exactly-once enforced</span>
          </div>

          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              P95 DB Stall
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm line-through text-[#6B7280]">1,600ms</span>
              <span className="text-base font-bold text-[#168568]">68ms</span>
            </div>
            <span className="text-[10px] text-[#168568] font-medium">-95.8% latency reduction</span>
          </div>

          <div className="p-3 bg-[#FAF9F6] rounded-xl border border-[#E5E7EB]">
            <span className="text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider block">
              Sandbox Pytest Run
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-sm line-through text-[#6B7280]">FAIL (code 1)</span>
              <span className="text-base font-bold text-[#168568]">PASS (code 0)</span>
            </div>
            <span className="text-[10px] text-[#168568] font-medium">36 tests verified safe</span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          4. OPERATIONAL RELEASES REGISTRY (Matching screen.jpg Table Structure)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-card">
        <div className="p-6 border-b border-[#E5E7EB] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-[#111827]">
              Operational Release Registry
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              Tracked release candidates under consequence supervision
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#6B7280] font-mono">
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
            <thead className="bg-[#FAF9F6] text-[#6B7280] font-medium border-b border-[#E5E7EB] text-xs">
              <tr>
                <th className="px-6 py-3.5">Version / ID</th>
                <th className="px-5 py-3.5">Branch & Commit</th>
                <th className="px-5 py-3.5">Author</th>
                <th className="px-5 py-3.5">Summary</th>
                <th className="px-4 py-3.5">Diff Stats</th>
                <th className="px-5 py-3.5">Consequence Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {overview.releases.map((rel) => {
                const isBlocked = rel.status === "blocked";
                const isApproved = rel.status === "approved";

                return (
                  <tr key={rel.id} className="hover:bg-[#FAF9F6]/80 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-semibold text-[#111827] block">
                        {rel.version_tag}
                      </span>
                      <span className="text-xs font-mono text-[#6B7280]">
                        {rel.id}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-[#111827]">
                        <GitBranch className="w-3.5 h-3.5 text-[#EA580C]" />
                        <span>{rel.branch}</span>
                      </div>
                      <span className="text-[11px] font-mono text-[#6B7280] block mt-0.5">
                        {rel.commit_hash.substring(0, 8)}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-xs text-[#6B7280]">
                      {rel.author}
                    </td>

                    <td className="px-5 py-4 max-w-xs truncate text-xs text-[#111827] font-medium">
                      {rel.summary}
                    </td>

                    <td className="px-4 py-4 font-mono text-xs">
                      {rel.diff_stats ? (
                        <span className="space-x-1.5">
                          <span className="text-[#168568]">+{rel.diff_stats.additions}</span>
                          <span className="text-[#C74747]">-{rel.diff_stats.deletions}</span>
                        </span>
                      ) : (
                        <span className="text-[#6B7280]">—</span>
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