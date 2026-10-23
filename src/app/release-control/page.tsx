"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  UserCheck,
  FileText,
  Lock,
  ArrowRight,
  Layers,
  Sparkles,
  ExternalLink,
  Shield,
  Activity,
  Compass,
  Wrench,
  Info,
  Check,
  RotateCcw,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  ReleaseControlStatus,
  ApprovalItem,
  ReleaseSuperpositionItem,
} from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/tabs";

export default function ReleaseControlPage() {
  const queryClient = useQueryClient();
  const [selectedRelease, setSelectedRelease] = useState("rel-2026-001");
  const [activeTab, setActiveTab] = useState<"superposition" | "gates">("superposition");
  const [selectedGate, setSelectedGate] = useState<ApprovalItem | null>(null);
  const [approverName, setApproverName] = useState("Lead Release Engineer");
  const [approverEmail, setApproverEmail] = useState("lead-sre@company.com");
  const [approvalReason, setApprovalReason] = useState(
    "Verified empirical fix in Release Time Machine and Remediation Studio: 0 double debits, atomic idempotency barrier active."
  );
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  // Queries
  const { data: controlData, isLoading: controlLoading, refetch: refetchControl } = useQuery<ReleaseControlStatus>({
    queryKey: ["release-control", selectedRelease],
    queryFn: () => api.getReleaseControl(selectedRelease),
  });

  const { data: superpositionData, isLoading: superpositionLoading } = useQuery<ReleaseSuperpositionItem>({
    queryKey: ["release-superposition", selectedRelease],
    queryFn: () => api.getReleaseSuperposition(selectedRelease),
  });

  // Mutation for Gatekeeper sign-off
  const signOffMutation = useMutation({
    mutationFn: (action: "approved" | "rejected") => {
      if (!selectedGate) throw new Error("No gate selected");
      return api.signOffGate(selectedRelease, selectedGate.id, {
        status: action,
        approver_name: approverName,
        approver_email: approverEmail,
        reason: approvalReason,
      });
    },
    onSuccess: (updatedGate) => {
      queryClient.invalidateQueries({ queryKey: ["release-control"] });
      queryClient.invalidateQueries({ queryKey: ["overview"] });
      setSelectedGate(null);
      setActionSuccessMsg(`Gate '${updatedGate.gate_name}' successfully marked as ${updatedGate.status.toUpperCase()}.`);
      setTimeout(() => setActionSuccessMsg(null), 5000);
    },
  });

  if (controlLoading || superpositionLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-[13px] border border-[#ECEEF1]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-[13px] border border-[#ECEEF1]" />
          ))}
        </div>
        <div className="h-96 bg-white rounded-[13px] border border-[#ECEEF1]" />
      </div>
    );
  }

  const rec = superpositionData?.recommendation;

  return (
    <div className="space-y-8">
      {/* =========================================================================
          1. HEADER SECTION
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <span className="sr-only">Superposition &amp; Release Control · Multi-Scenario Decision Matrix</span>
          <h1 className="typo-page-title text-[#191C24]">
            Release Control &amp; Superposition
          </h1>
          <p className="typo-description text-[#747B87] mt-0.5">Compare every failure scenario and decide whether to promote.
          </p>
        </div>

        {/* Release Candidate Selector */}
        <div className="flex items-center gap-3 min-w-0 w-full sm:w-auto">
          <select
            value={selectedRelease}
            onChange={(e) => setSelectedRelease(e.target.value)}
            className="w-full sm:w-auto min-w-0 truncate text-[12px] h-9 px-3 bg-white border border-[#ECEEF1] rounded-[10px] text-[#191C24] focus:outline-none focus:border-[#20242D]"
          >
            <option value="rel-2026-001">rel-2026-001 (feat/distributed-checkout) · vulnerable</option>
            <option value="rel-2026-002">rel-2026-002 (main/clean-baseline) · baseline</option>
          </select>
        </div>
      </div>

      {/* =========================================================================
          2. EXECUTIVE RECOMMENDATION CARD (Prominent Banner)
          ========================================================================= */}
      {rec && (
        <div className="bg-white rounded-[13px] border border-[#ECEEF1] p-6 lg:p-8 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#ECEEF1]/80">
            <div className="flex items-center gap-3">
              <Badge variant={rec.verdict === "CONDITIONAL_APPROVAL" ? "warning" : "success"}>
                {rec.verdict.replace(/_/g, " ")}
              </Badge>
              <h2 className="text-[14px]  text-[#191C24]">
                {rec.headline}
              </h2>
            </div>

            <div className="flex items-center gap-2 text-[12px] font-mono">
              <span className="text-[#747B87]">EMPIRICAL CONFIDENCE:</span>
              <span className=" text-[#191C24] text-[13px]">{rec.confidence_score}%</span>
            </div>
          </div>

          <p className="text-[12px] text-[#191C24] leading-relaxed">
            {rec.evidence_summary}
          </p>

          <div className="p-3.5 rounded-[13px] bg-[#F8F9FB] border border-[#ECEEF1]/80 space-y-1.5 text-[12px] text-[#747B87]">
            <span className=" text-[#191C24] flex items-center gap-1.5 text-[11px]">
              <Info className="w-3.5 h-3.5 text-[#191C24]" />
              Governance &amp; External Verification Transparency
            </span>
            {rec.caveats?.map((c, i) => (
              <div key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                <span className="text-[#191C24] ">&bull;</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. FOUR STAT CARDS (Mitigation Delta)
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          tag="Capital Risk Mitigated"
          tagVariant="success"
          title="Financial Exposure Delta"
          value="$1,500.00"
          delta={{
            value: "100% Capital Risk Mitigated to $0.00",
            isPositive: true,
          }}
          subStats={[
            { label: "Unpatched Risk", value: "$1,500.00" },
            { label: "Repaired Risk", value: "$0.00" },
          ]}
        />

        <StatCard
          tag="Safety Invariant"
          tagVariant="success"
          title="INV-PAY-001 Breaches"
          value="12 Prevented"
          delta={{
            value: "12 Double Debits Suppressed",
            isPositive: true,
          }}
          subStats={[
            { label: "Unpatched Breaches", value: "12 Charges" },
            { label: "Repaired Breaches", value: "0 Charges" },
          ]}
        />

        <StatCard
          tag="Downstream Health"
          tagVariant="success"
          title="Services Protected"
          value="3 Services"
          delta={{
            value: "Zero Connection Starvation Cascades",
            isPositive: true,
          }}
          subStats={[
            { label: "Postgres Pool", value: "0 Waiters" },
            { label: "Worker Retries", value: "Nominal" },
          ]}
        />

        <StatCard
          tag="DevSecOps Gates"
          tagVariant={controlData?.overall_status === "PASSED" || controlData?.overall_status === "approved" ? "success" : "accent"}
          title="Policy Gates Passed"
          value={`${controlData?.gates_passed || 3} of ${controlData?.gates_total || 4}`}
          delta={{
            value: "Code Invariant & SLA Gates Satisfied",
            isPositive: true,
          }}
          subStats={[
            { label: "Auto Gates", value: "3 Passed" },
            { label: "Human Gate", value: "Pending Sign-off" },
          ]}
        />
      </div>

      {/* =========================================================================
          4. COMPARISON MATRIX VS POLICY GATES TABS
          ========================================================================= */}
      <div className="bg-white rounded-[13px] border border-[#ECEEF1] overflow-hidden">
        {/* Workspace Tab Header */}
        <div className="p-6 border-b border-[#ECEEF1] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SegmentedTabs
              options={[
                { id: "superposition", label: "5-Scenario Consequence Superposition Grid", icon: <Sparkles className="w-3.5 h-3.5" /> },
                { id: "gates", label: "DevSecOps Policy Gates", icon: <ShieldCheck className="w-3.5 h-3.5" />, badge: `${controlData?.gates_passed || 3}/${controlData?.gates_total || 4}` },
              ]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
            />
          </div>

          <div className="flex items-center gap-2 text-[12px] font-mono text-[#747B87]">
            <span>Commit:</span>
            <span className=" text-[#191C24]">{superpositionData?.commit_hash?.slice(0, 8)}</span>
          </div>
        </div>
        <p className="px-6 py-2.5 border-b border-[#ECEEF1] typo-description text-[#747B87]">Source: simulated scenario matrix{superpositionData?.generated_at ? `, generated ${new Date(superpositionData.generated_at).toLocaleString()}` : ""}. It is separate from the Time Machine experiment runs, which are listed there with their experiment IDs, so the figures can differ.</p>

        {actionSuccessMsg && (
          <div className="m-6 p-3 rounded-[13px] bg-[#F4F5F7] border border-[#ECEEF1] text-[12px] text-[#191C24]  flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#191C24]" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}

        {/* Tab 1: 5-Scenario Superposition Grid */}
        {activeTab === "superposition" && superpositionData && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[12px]">
              <thead className="bg-[#F8F9FB] text-[#747B87]  border-b border-[#ECEEF1]">
                <tr>
                  <th className="px-6 py-3.5">Fault Injection Vector</th>
                  <th className="px-5 py-3.5">Vulnerable Release Outcome</th>
                  <th className="px-5 py-3.5">Repaired Release Outcome</th>
                  <th className="px-5 py-3.5">Blast Radius Delta</th>
                  <th className="px-6 py-3.5 text-right">Verification Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#ECEEF1]/70">
                {superpositionData.scenario_matrix.map((sc) => {
                  const exposureDelta = sc.vulnerable.exposure_usd - sc.repaired.exposure_usd;
                  return (
                    <tr key={sc.scenario_id} className="hover:bg-[#F8F9FB]/60 transition-colors">
                      <td className="px-6 py-4 min-w-[300px]">
                        <span className=" text-[#191C24] block text-[12px] whitespace-nowrap">
                          {sc.name}
                        </span>
                        <span className="text-[11px] text-[#747B87] max-w-[280px] block mt-0.5">
                          {sc.fault_injection}
                        </span>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className=" text-[#FF6A13] block">
                          {sc.vulnerable.verdict}
                        </span>
                        <div className="typo-description text-[#747B87] space-x-2 mt-0.5">
                          <span>{sc.vulnerable.duplicate_debits} duplicate debits</span>
                          <span>&bull;</span>
                          <span>P95 {sc.vulnerable.p95_latency_ms}ms</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className=" text-[#191C24] block">
                          {sc.repaired.verdict}
                        </span>
                        <div className="typo-description text-[#747B87] space-x-2 mt-0.5">
                          <span>{sc.repaired.duplicate_debits} duplicate debits</span>
                          <span>&bull;</span>
                          <span>P95 {sc.repaired.p95_latency_ms}ms</span>
                        </div>
                      </td>

                      <td className="px-5 py-4 whitespace-nowrap typo-table-body">
                        {exposureDelta > 0 ? (
                          <span className=" text-[#191C24]">
                            -${exposureDelta.toFixed(2)} Risk Mitigated
                          </span>
                        ) : (
                          <span className="text-[#747B87]">0 Risk Delta</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <Link
                          href="/time-machine"
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-[13px] border border-[#ECEEF1] bg-white text-[#191C24] hover:bg-[#F4F5F7]  text-[12px] transition-colors"
                        >
                          <span>Replay</span>
                          <ArrowRight className="w-3 h-3 text-[#747B87]" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: DevSecOps Policy Gates */}
        {activeTab === "gates" && controlData && (
          <div className="p-6 lg:p-8 space-y-6">
            <div className="space-y-4">
              {controlData.gates.map((gate) => {
                const isPassed = gate.status === "approved";
                const isFailed = gate.status === "rejected";
                const isHeld = gate.status === "pending";

                return (
                  <div
                    key={gate.id}
                    className="p-5 rounded-[13px] border border-[#ECEEF1] bg-[#F8F9FB] flex flex-col md:flex-row md:items-center justify-between gap-4 text-[12px]"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className=" text-[#191C24] text-[13px]">
                          {gate.gate_name}
                        </span>
                        <Badge
                          variant={isPassed ? "success" : isFailed ? "error" : "warning"}
                          dot
                        >
                          {gate.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-[#747B87]">
                        Required for production release authorization
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {isHeld && (
                        <Button
                          onClick={() => setSelectedGate(gate)}
                          variant="primary"
                          size="sm"
                          icon={<UserCheck className="w-3.5 h-3.5" />}
                        >
                          Sign Off Gate
                        </Button>
                      )}
                      {isPassed && (
                        <div className="text-right">
                          <span className="text-[12px]  text-[#191C24] block">
                            Approved by {gate.approver_name || "Lead SRE"}
                          </span>
                          <span className="text-[11px] text-[#747B87]">
                            {gate.signed_at ? new Date(gate.signed_at).toLocaleDateString() : "Active"}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Gate Sign-Off Modal */}
            {selectedGate && (
              <div className="bg-white rounded-[13px] border border-[#20242D] p-6 shadow-popover space-y-4">
                <div className="flex items-center justify-between border-b border-[#ECEEF1] pb-3">
                  <h4 className=" text-[13px] text-[#191C24]">
                    Sign Off Gate: {selectedGate.gate_name}
                  </h4>
                  <button
                    onClick={() => setSelectedGate(null)}
                    className="text-[#747B87] hover:text-[#191C24]"
                  >
                    Cancel
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
                  <div>
                    <label className="block  text-[#191C24] mb-1">
                      Approver Name
                    </label>
                    <input
                      type="text"
                      value={approverName}
                      onChange={(e) => setApproverName(e.target.value)}
                      className="w-full bg-[#F8F9FB] border border-[#ECEEF1] rounded-[13px] p-2.5 text-[12px] focus:bg-white focus:outline-none focus:border-[#20242D]"
                    />
                  </div>

                  <div>
                    <label className="block  text-[#191C24] mb-1">
                      Official Email
                    </label>
                    <input
                      type="email"
                      value={approverEmail}
                      onChange={(e) => setApproverEmail(e.target.value)}
                      className="w-full bg-[#F8F9FB] border border-[#ECEEF1] rounded-[13px] p-2.5 text-[12px] focus:bg-white focus:outline-none focus:border-[#20242D]"
                    />
                  </div>
                </div>

                <div className="text-[12px]">
                  <label className="block  text-[#191C24] mb-1">
                    Sign-off Rationale &amp; Evidence Citation
                  </label>
                  <textarea
                    rows={2}
                    value={approvalReason}
                    onChange={(e) => setApprovalReason(e.target.value)}
                    className="w-full bg-[#F8F9FB] border border-[#ECEEF1] rounded-[13px] p-2.5 text-[12px] focus:bg-white focus:outline-none focus:border-[#20242D]"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    onClick={() => signOffMutation.mutate("rejected")}
                    disabled={signOffMutation.isPending}
                    variant="destructive"
                    size="sm"
                  >
                    Reject Gate
                  </Button>
                  <Button
                    onClick={() => signOffMutation.mutate("approved")}
                    disabled={signOffMutation.isPending}
                    variant="primary"
                    size="sm"
                    icon={<Check className="w-3.5 h-3.5" />}
                  >
                    {signOffMutation.isPending ? "Signing off..." : "Authorize Gate Approval"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
