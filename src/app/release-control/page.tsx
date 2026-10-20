"use client";

import React, { useState } from "react";
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
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, ReleaseControlStatus, ApprovalItem } from "@/lib/api";

export default function ReleaseControlPage() {
  const queryClient = useQueryClient();
  const [selectedRelease] = useState("rel-2026-001");
  const [selectedGate, setSelectedGate] = useState<ApprovalItem | null>(null);
  const [approverName, setApproverName] = useState("Darlen Atumanyire");
  const [approverEmail, setApproverEmail] = useState("darlen@aftermath.dev");
  const [approvalReason, setApprovalReason] = useState(
    "Verified empirical fix in Release Time Machine exp-rep-001: 0 double debits, Redis SETNX distributed lock active."
  );
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);

  const { data: controlData, isLoading, isError, refetch } = useQuery<ReleaseControlStatus>({
    queryKey: ["release-control", selectedRelease],
    queryFn: () => api.getReleaseControl(selectedRelease),
  });

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

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="h-64 bg-white border border-[#ECE6DA] rounded-lg"></div>
      </div>
    );
  }

  if (isError || !controlData) {
    return (
      <div className="bg-white border border-[#FECDD3] rounded-lg p-8 text-center max-w-xl mx-auto my-12">
        <AlertTriangle className="w-8 h-8 text-[#BE123C] mx-auto mb-2" />
        <h3 className="text-base font-semibold text-[#0F172A] mb-1">
          Unable to Load Release Control Data
        </h3>
        <p className="text-sm text-[#64748B] mb-4">
          Failed to fetch verification gates for {selectedRelease}.
        </p>
        <button
          onClick={() => refetch()}
          className="px-3 py-1.5 text-xs font-medium rounded bg-[#0F172A] text-white"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mb-1">
              <span>RELEASE CONTROL WORKSPACE</span>
              <span>&bull;</span>
              <span className="text-[#1D4ED8] font-medium">DEVSECOPS VERIFICATION GATES</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-[#1D4ED8]" />
              Release Control &amp; Sign-Off
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Strict empirical verification gates, staging readiness certification, and human cryptographic sign-off.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs px-3 py-1.5 rounded bg-[#FAF8F5] border border-[#ECE6DA] text-[#0F172A]">
              Release: <strong className="text-[#1D4ED8]">{controlData.version_tag}</strong>
            </span>
          </div>
        </div>

        {actionSuccessMsg && (
          <div className="mt-3 p-2.5 rounded bg-[#ECFDF5] border border-[#A7F3D0] text-xs text-[#065F46] font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span>{actionSuccessMsg}</span>
          </div>
        )}
      </div>

      {/* Overall Gate Status Banner */}
      <div
        className={`p-5 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
          controlData.can_promote
            ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
            : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase mb-1">
            {controlData.can_promote ? (
              <>
                <CheckCircle2 className="w-4 h-4 text-[#047857]" />
                <span>All Verification Gates Passed &mdash; Ready for Staging</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-[#B45309]" />
                <span>Pending Human Engineering Sign-Off</span>
              </>
            )}
          </div>
          <p className="text-xs max-w-2xl leading-relaxed">
            {controlData.can_promote
              ? "All automated consequence checks and human approvals have been verified. The release satisfies all SLA parameters and is certified for staging deployment."
              : "Automated empirical simulations succeeded in the Release Time Machine. Release promotion is gated awaiting final Principal Engineer approval."}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
          <span className="px-3 py-1.5 rounded bg-white border border-current font-bold">
            {controlData.gates_passed} of {controlData.gates_total} Gates Passed
          </span>
        </div>
      </div>

      {/* Verification Gates Table */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-[#ECE6DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#1D4ED8]" />
            <h2 className="text-sm font-bold text-[#0F172A]">
              Release Verification Gates ({controlData.gates.length})
            </h2>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            Automated + Human Guardrails
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8F5] text-[#64748B] font-medium border-b border-[#ECE6DA]">
              <tr>
                <th className="px-5 py-2.5">Gate Name</th>
                <th className="px-4 py-2.5">Type</th>
                <th className="px-4 py-2.5">Status</th>
                <th className="px-4 py-2.5">Evaluator / Approver</th>
                <th className="px-4 py-2.5">Verification Details</th>
                <th className="px-5 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ECE6DA]">
              {controlData.gates.map((gate) => {
                const isApproved = gate.status === "approved";
                const isRejected = gate.status === "rejected";
                const isPending = gate.status === "pending";

                return (
                  <tr key={gate.id} className="hover:bg-[#FAF8F5]/80 transition-colors">
                    <td className="px-5 py-3 font-semibold text-[#0F172A]">
                      {gate.gate_name}
                      <span className="block text-[10px] text-[#64748B] font-mono font-normal">
                        {gate.id}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] uppercase">
                      <span className="px-1.5 py-0.5 rounded bg-[#F1F5F9] text-[#475569]">
                        {gate.gate_type}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {isApproved ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#ECFDF5] text-[#047857] border border-[#A7F3D0]">
                          <CheckCircle2 className="w-3 h-3" />
                          APPROVED
                        </span>
                      ) : isRejected ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
                          <XCircle className="w-3 h-3" />
                          REJECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A]">
                          <Clock className="w-3 h-3" />
                          PENDING
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-[#334155]">
                      {gate.approver_name ? (
                        <div>
                          <div className="font-medium text-[#0F172A]">{gate.approver_name}</div>
                          <div className="text-[10px] text-[#64748B] font-mono">{gate.approver_email}</div>
                        </div>
                      ) : (
                        <span className="text-[#94A3B8] font-mono text-[11px]">Awaiting Sign-off</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-sm text-[#475569]">
                      {gate.reason || "Automated check verified against Release Time Machine simulation metrics."}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {gate.gate_type === "human" && (
                        <button
                          onClick={() => setSelectedGate(gate)}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-[#1D4ED8] hover:bg-[#1E40AF] text-white transition-colors"
                        >
                          {isApproved ? "Update Sign-Off" : "Sign Off Gate"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Human Sign-Off Modal */}
      {selectedGate && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-2xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-[#ECE6DA] shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#ECE6DA] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-[#1D4ED8]" />
                <h3 className="text-base font-bold text-[#0F172A]">
                  Human Gate Sign-Off
                </h3>
              </div>
              <button
                onClick={() => setSelectedGate(null)}
                className="text-[#64748B] hover:text-[#0F172A] text-sm"
              >
                &times;
              </button>
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold text-[#64748B]">Gate:</span>
              <p className="text-sm font-bold text-[#0F172A]">{selectedGate.gate_name}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-[#334155] block mb-1">
                  Approver Full Name
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#ECE6DA] text-[#0F172A] font-sans focus:outline-hidden focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">
                  Approver Email
                </label>
                <input
                  type="email"
                  value={approverEmail}
                  onChange={(e) => setApproverEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#ECE6DA] text-[#0F172A] font-sans focus:outline-hidden focus:border-[#1D4ED8]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#334155] block mb-1">
                  Sign-Off Justification &amp; Empirical Audit Rationale
                </label>
                <textarea
                  rows={3}
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="w-full px-3 py-1.5 rounded border border-[#ECE6DA] text-[#0F172A] font-sans focus:outline-hidden focus:border-[#1D4ED8]"
                ></textarea>
              </div>
            </div>

            <div className="pt-3 border-t border-[#ECE6DA] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setSelectedGate(null)}
                className="px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => signOffMutation.mutate("rejected")}
                disabled={signOffMutation.isPending}
                className="px-3 py-1.5 text-xs font-semibold rounded bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3] hover:bg-[#FFE4E6]"
              >
                Reject Release
              </button>
              <button
                type="button"
                onClick={() => signOffMutation.mutate("approved")}
                disabled={signOffMutation.isPending}
                className="px-3.5 py-1.5 text-xs font-semibold rounded bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-xs"
              >
                Sign Off &amp; Approve Release
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compliance Audit Trail */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-[#ECE6DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#1D4ED8]" />
            <h2 className="text-sm font-bold text-[#0F172A]">
              Immutable Governance Audit Log
            </h2>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            {controlData.recent_audits.length} events logged
          </span>
        </div>

        <div className="divide-y divide-[#ECE6DA]">
          {controlData.recent_audits.map((audit) => (
            <div key={audit.id} className="p-4 hover:bg-[#FAF8F5]/80 transition-colors flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-mono">
                  <span className="font-bold text-[#0F172A]">{audit.action}</span>
                  <span className="text-[#94A3B8]">&bull;</span>
                  <span className="text-[#64748B]">{audit.entity_type}:{audit.entity_id}</span>
                </div>
                <div className="text-[#475569]">
                  Actor: <strong className="text-[#0F172A]">{audit.actor}</strong>
                </div>
              </div>
              <div className="font-mono text-[11px] text-[#64748B] text-right">
                {new Date(audit.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
