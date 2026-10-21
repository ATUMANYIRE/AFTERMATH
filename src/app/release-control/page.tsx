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
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  api,
  ReleaseControlStatus,
  ApprovalItem,
  ReleaseSuperpositionItem,
} from "@/lib/api";

export default function ReleaseControlPage() {
  const queryClient = useQueryClient();
  const [selectedRelease, setSelectedRelease] = useState("rel-2026-001");
  const [activeTab, setActiveTab] = useState<"superposition" | "gates">("superposition");
  const [selectedGate, setSelectedGate] = useState<ApprovalItem | null>(null);
  const [approverName, setApproverName] = useState("Darlen Atumanyire");
  const [approverEmail, setApproverEmail] = useState("darlen@aftermath.dev");
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
        <div className="h-28 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="h-64 bg-white border border-[#ECE6DA] rounded-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Switcher */}
      <div className="bg-[#FAF8F5] border border-[#ECE6DA] rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mb-1">
              <span>MILESTONE 5</span>
              <span>&bull;</span>
              <span className="text-[#1D4ED8] font-medium">PRODUCTION READINESS &amp; RELEASE SUPERPOSITION</span>
            </div>
            <h1 className="text-2xl font-serif font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
              <Layers className="w-6 h-6 text-[#1D4ED8]" />
              Release Superposition &amp; Governance
            </h1>
            <p className="text-sm text-[#475569] mt-0.5 max-w-3xl">
              Every release exists in a superposition of multiple possible outcomes until tested under production fault profiles.
              Compare verified consequences side-by-side, evaluate blast radius mitigation, and enforce human sign-off.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedRelease}
              onChange={(e) => setSelectedRelease(e.target.value)}
              aria-label="Select Release Candidate"
              className="text-xs font-mono font-medium px-3 py-2 bg-white border border-[#CBD5E1] rounded-md text-[#0F172A] focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
            >
              <option value="rel-2026-001">rel-2026-001 (v2.4.0-rc.3) — Vulnerable Candidate</option>
              <option value="rel-2026-002">rel-2026-002 (v2.3.9-hotfix.1) — Clean Canary</option>
            </select>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="mt-6 pt-4 border-t border-[#E2E8F0] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("superposition")}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "superposition"
                  ? "bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1D4ED8]" />
              Release Superposition Matrix
            </button>
            <button
              onClick={() => setActiveTab("gates")}
              className={`px-4 py-2 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 ${
                activeTab === "gates"
                  ? "bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1] font-bold"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#047857]" />
              DevSecOps Policy Gates ({controlData?.gates_passed || 0}/{controlData?.gates_total || 0})
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-[#64748B]">
            <span>Commit:</span>
            <span className="font-semibold text-[#0F172A]">{superpositionData?.commit_hash.slice(0, 8)}</span>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="mt-3 p-2.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* TAB 1: RELEASE SUPERPOSITION MATRIX */}
      {activeTab === "superposition" && superpositionData && (
        <div className="space-y-6">
          {/* Executive Recommendation Banner */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]">
                  {superpositionData.recommendation.verdict}
                </span>
                <span className="font-serif text-base font-bold text-[#0F172A]">
                  {superpositionData.recommendation.headline}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[#64748B]">CONFIDENCE SCORE:</span>
                <span className="font-bold text-[#16A34A]">{superpositionData.recommendation.confidence_score}%</span>
              </div>
            </div>

            <p className="text-xs text-[#334155] leading-relaxed mb-4">
              {superpositionData.recommendation.evidence_summary}
            </p>

            {/* Caveats & External Blocker Transparency */}
            <div className="p-3 rounded bg-[#FAF8F5] border border-[#E2E8F0] space-y-1.5 text-[11px] text-[#475569]">
              <div className="font-bold text-[#0F172A] flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                <Info className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Governance &amp; Deployment Caveats
              </div>
              {superpositionData.recommendation.caveats.map((caveat, idx) => (
                <div key={idx} className="flex items-start gap-1.5 font-mono">
                  <span className="text-[#94A3B8]">&bull;</span>
                  <span>{caveat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Blast Radius Delta Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Financial Risk Mitigated</span>
              <span className="text-xl font-bold text-[#16A34A] block mt-1">
                ${superpositionData.blast_radius_delta.financial_exposure_mitigated_usd.toFixed(2)}
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">0 duplicate debits in repaired run</span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Duplicate Charges Prevented</span>
              <span className="text-xl font-bold text-[#1D4ED8] block mt-1">
                {superpositionData.blast_radius_delta.duplicate_charges_prevented}
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Across 5 fault injection profiles</span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">P95 Latency Reduction</span>
              <span className="text-xl font-bold text-[#0F172A] block mt-1">
                -{superpositionData.blast_radius_delta.p95_latency_improvement_ms.toFixed(0)} ms
              </span>
              <span className="text-[10px] text-[#64748B] mt-0.5 block">Eliminated thread contention locks</span>
            </div>
            <div className="bg-white p-4 rounded-lg border border-[#E2E8F0] shadow-xs">
              <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Protected Downstream Services</span>
              <div className="mt-1 flex flex-wrap gap-1">
                {superpositionData.blast_radius_delta.downstream_services_protected.map((svc) => (
                  <span key={svc} className="px-1.5 py-0.5 rounded bg-[#FAF8F5] border border-[#CBD5E1] text-[9px] text-[#334155]">
                    {svc}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Multi-Scenario Superposition Matrix Table */}
          <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
            <div className="p-4 bg-[#FAF8F5] border-b border-[#E2E8F0] flex items-center justify-between">
              <div>
                <h3 className="font-serif font-bold text-sm text-[#0F172A]">
                  Observed Outcome Superposition Matrix
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Controlled empirical measurements comparing Vulnerable release vs Repaired release under 5 production fault modes.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#FAF8F5] border-b border-[#E2E8F0] text-[10px] font-mono text-[#64748B] uppercase">
                    <th className="py-2.5 px-4 font-semibold">Fault Injection Scenario</th>
                    <th className="py-2.5 px-4 font-semibold text-[#DC2626]">Vulnerable Candidate Outcome</th>
                    <th className="py-2.5 px-4 font-semibold text-[#16A34A]">Repaired Candidate Outcome</th>
                    <th className="py-2.5 px-4 font-semibold">Epistemic Provenance</th>
                    <th className="py-2.5 px-4 font-semibold text-right">Investigation Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F1F5F9] font-mono">
                  {superpositionData.scenario_matrix.map((row) => (
                    <tr key={row.scenario_id} className="hover:bg-[#FAF8F5] transition-colors">
                      <td className="py-3 px-4 font-sans max-w-xs">
                        <div className="font-semibold text-[#0F172A]">{row.name}</div>
                        <div className="text-[10px] font-mono text-[#64748B] mt-0.5">{row.fault_injection}</div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#DC2626]"></span>
                          <span className="font-bold text-[#DC2626]">{row.vulnerable.verdict}</span>
                          <span className="text-[10px] text-[#94A3B8]">({row.vulnerable.invariant_status})</span>
                        </div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          {row.vulnerable.duplicate_debits} double debits &bull; ${row.vulnerable.exposure_usd.toFixed(2)} exposure
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">
                          p95: {row.vulnerable.p95_latency_ms}ms &bull; {row.vulnerable.affected_services.join(", ")}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                          <span className="font-bold text-[#16A34A]">{row.repaired.verdict}</span>
                          <span className="text-[10px] text-[#94A3B8]">({row.repaired.invariant_status})</span>
                        </div>
                        <div className="text-[11px] text-[#475569] mt-0.5">
                          {row.repaired.duplicate_debits} double debits &bull; $0.00 exposure
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">
                          p95: {row.repaired.p95_latency_ms}ms &bull; Clean settlement
                        </div>
                      </td>
                      <td className="py-3 px-4 text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-[#F1F5F9] border border-[#CBD5E1] text-[#334155] text-[10px] block w-fit font-medium">
                          {row.provenance}
                        </span>
                        <span className="text-[10px] text-[#64748B] mt-0.5 block">{row.uncertainty}</span>
                      </td>
                      <td className="py-3 px-4 text-right space-y-1 font-sans">
                        <Link
                          href="/time-machine"
                          className="inline-flex items-center gap-1 text-[11px] text-[#1D4ED8] hover:underline font-medium block"
                        >
                          <Clock className="w-3 h-3" />
                          Time Machine
                        </Link>
                        <Link
                          href="/remediation"
                          className="inline-flex items-center gap-1 text-[11px] text-[#047857] hover:underline font-medium block"
                        >
                          <Wrench className="w-3 h-3" />
                          Repair Studio
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DEVSECOPS POLICY GATES & APPROVALS */}
      {activeTab === "gates" && controlData && (
        <div className="space-y-6">
          {/* Overall Gate Status Banner */}
          <div
            className={`p-5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              controlData.can_promote
                ? "bg-[#ECFDF5] border-[#A7F3D0]"
                : "bg-[#FFFBEB] border-[#FDE68A]"
            }`}
          >
            <div className="flex items-center gap-3">
              {controlData.can_promote ? (
                <div className="w-10 h-10 rounded-full bg-[#D1FAE5] text-[#047857] flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6" />
                </div>
              )}
              <div>
                <h3 className="font-serif font-bold text-base text-[#0F172A]">
                  {controlData.can_promote
                    ? "Release Certified for Staging Promotion"
                    : "Release Promotion Blocked by DevSecOps Policy"}
                </h3>
                <p className="text-xs text-[#475569] mt-0.5">
                  {controlData.can_promote
                    ? "All automated invariant evaluations and human gatekeeper approvals have passed."
                    : `${controlData.gates_passed} of ${controlData.gates_total} verification gates satisfied.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 font-mono text-xs">
              <span className="px-3 py-1.5 rounded bg-white border border-[#ECE6DA] font-semibold text-[#0F172A]">
                Passed: {controlData.gates_passed} / {controlData.gates_total}
              </span>
            </div>
          </div>

          {/* Verification Gates Table */}
          <div className="bg-white border border-[#ECE6DA] rounded-lg shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ECE6DA] bg-[#FAF8F5]">
              <h3 className="font-serif font-bold text-sm text-[#0F172A]">Policy Verification Gates</h3>
            </div>

            <div className="divide-y divide-[#ECE6DA]">
              {controlData.gates.map((gate) => (
                <div key={gate.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#0F172A]">{gate.gate_name}</span>
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono uppercase bg-[#F1F5F9] text-[#475569]">
                        {gate.gate_type}
                      </span>
                    </div>
                    {gate.reason && (
                      <p className="text-[#64748B] text-[11px] italic max-w-xl">&ldquo;{gate.reason}&rdquo;</p>
                    )}
                    {gate.approver_name && (
                      <div className="text-[10px] font-mono text-[#475569]">
                        Signed by: {gate.approver_name} ({gate.approver_email}) &bull;{" "}
                        {gate.signed_at ? new Date(gate.signed_at).toLocaleTimeString() : ""}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-semibold uppercase ${
                        gate.status === "approved"
                          ? "bg-[#F0FDF4] text-[#16A34A] border border-[#86EFAC]"
                          : gate.status === "rejected"
                          ? "bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]"
                          : "bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]"
                      }`}
                    >
                      {gate.status}
                    </span>

                    {gate.status === "pending" && (
                      <button
                        onClick={() => setSelectedGate(gate)}
                        className="px-3 py-1 text-xs font-semibold rounded bg-[#1D4ED8] text-white hover:bg-[#1E40AF]"
                      >
                        Sign Gate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Immutable Audit Trail */}
          <div className="bg-white border border-[#ECE6DA] rounded-lg shadow-2xs overflow-hidden">
            <div className="px-5 py-4 border-b border-[#ECE6DA] bg-[#FAF8F5]">
              <h3 className="font-serif font-bold text-sm text-[#0F172A]">Governance Audit Events</h3>
            </div>
            <div className="divide-y divide-[#F1F5F9] font-mono text-xs max-h-64 overflow-y-auto">
              {controlData.recent_audits.map((a) => (
                <div key={a.id} className="p-3 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-semibold text-[#0F172A]">{a.action}</div>
                    <div className="text-[10px] text-[#64748B]">
                      Actor: {a.actor} &bull; Entity: {a.entity_type} ({a.entity_id.slice(0, 8)})
                    </div>
                  </div>
                  <div className="text-[10px] text-[#94A3B8]">
                    {new Date(a.created_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Human Gate Sign-off Modal */}
      {selectedGate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#CBD5E1] rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#0F172A] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#1D4ED8]" />
              Sign DevSecOps Policy Gate
            </h3>
            <p className="text-xs text-[#64748B]">
              You are evaluating <strong>{selectedGate.gate_name}</strong> for release candidate {selectedRelease}.
            </p>

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-[#334155] mb-1">Approver Full Name</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#334155] mb-1">Email</label>
                <input
                  type="email"
                  value={approverEmail}
                  onChange={(e) => setApproverEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#334155] mb-1">Sign-off Remarks / Reason</label>
                <textarea
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedGate(null)}
                className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                onClick={() => signOffMutation.mutate("rejected")}
                disabled={signOffMutation.isPending}
                className="px-3 py-2 text-xs font-semibold text-[#DC2626] bg-white border border-[#FCA5A5] rounded hover:bg-[#FEF2F2]"
              >
                Reject Gate
              </button>
              <button
                onClick={() => signOffMutation.mutate("approved")}
                disabled={signOffMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded hover:bg-[#15803D]"
              >
                {signOffMutation.isPending ? "Signing..." : "Approve & Sign"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
