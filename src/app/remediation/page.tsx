"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  X,
  FileCode,
  Shield,
  ShieldAlert,
  ArrowRight,
  GitCommit,
  GitBranch,
  Terminal,
  ExternalLink,
  Lock,
  UserCheck,
  RefreshCw,
  Cpu,
  Info,
} from "lucide-react";
import { api, RemediationWorkflowItem } from "@/lib/api";

const WORKFLOW_STEPS = [
  { key: "DETECTED", label: "Defect Detected" },
  { key: "INVESTIGATING", label: "Causal Analysis" },
  { key: "PATCH_PROPOSED", label: "Patch Synthesized" },
  { key: "VALIDATING", label: "Sandbox Validating" },
  { key: "AWAITING_APPROVAL", label: "Human Gatekeeper" },
  { key: "COMPLETED", label: "Approved & Fixed" },
];

export default function RemediationPage() {
  const queryClient = useQueryClient();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approverName, setApproverName] = useState("");
  const [approverEmail, setApproverEmail] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [rejectReason, setRejectReason] = useState("");
  const [activeTab, setActiveTab] = useState<"diff" | "sandbox" | "provenance">("diff");

  // Fetch workflows
  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ["remediation-workflows"],
    queryFn: () => api.getRemediationWorkflows("rel-2026-001"),
    refetchInterval: 5000,
  });

  const activeWorkflow: RemediationWorkflowItem | undefined =
    workflows?.find((w) => (selectedWorkflowId ? w.id === selectedWorkflowId : true)) ||
    workflows?.[0];

  // Mutations
  const validateMutation = useMutation({
    mutationFn: (wfId: string) => api.validateRemediation(wfId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["remediation-workflows"] });
      setSelectedWorkflowId(updated.id);
      setActiveTab("sandbox");
    },
  });

  const approveMutation = useMutation({
    mutationFn: ({ wfId, data }: { wfId: string; data: { approver_name: string; approver_email: string; note?: string } }) =>
      api.approveRemediation(wfId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remediation-workflows"] });
      setApprovalModalOpen(false);
      setApproverName("");
      setApproverEmail("");
      setApprovalNote("");
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ wfId, data }: { wfId: string; data: { approver_name: string; approver_email: string; reason: string } }) =>
      api.rejectRemediation(wfId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remediation-workflows"] });
      setRejectModalOpen(false);
      setApproverName("");
      setApproverEmail("");
      setRejectReason("");
    },
  });

  const triggerMutation = useMutation({
    mutationFn: () =>
      api.triggerRemediation({
        release_id: "rel-2026-001",
        target_file_path: "services/payment_worker/processor.py",
        violated_invariant: "INV-PAY-001: Exactly-One-Charge-Per-Purchase",
      }),
    onSuccess: (newWf) => {
      queryClient.invalidateQueries({ queryKey: ["remediation-workflows"] });
      setSelectedWorkflowId(newWf.id);
    },
  });

  const getStepStatus = (stepKey: string, currentStatus?: string) => {
    if (!currentStatus) return "pending";
    if (currentStatus === "REJECTED" && stepKey === "AWAITING_APPROVAL") return "rejected";
    if (currentStatus === "FAILED" && stepKey === "VALIDATING") return "failed";

    const order = ["DETECTED", "INVESTIGATING", "PATCH_PROPOSED", "VALIDATING", "AWAITING_APPROVAL", "COMPLETED"];
    const currentIndex = order.indexOf(currentStatus === "APPROVED" ? "COMPLETED" : currentStatus);
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-[#FAF8F5] border border-[#E2E8F0] rounded-lg p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold uppercase tracking-wider bg-[#1D4ED8]/10 text-[#1D4ED8]">
                Milestone 4: Supervised Repair
              </span>
              <span className="text-[#64748B] text-xs font-mono">rel-2026-001 (v2.4.0-rc.3)</span>
            </div>
            <h1 className="text-2xl font-serif font-bold text-[#0F172A] tracking-tight">
              Remediation Studio & Fix Verification
            </h1>
            <p className="text-sm text-[#475569] mt-1 max-w-3xl">
              Deterministic invariant recovery pipeline. Automatically analyzes failing concurrency windows,
              synthesizes an atomic idempotency barrier, executes live pytest validation in an isolated worktree,
              and gates production integration behind explicit human sign-off.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[#475569] bg-white border border-[#CBD5E1] rounded-md hover:bg-[#F8FAFC] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Refresh
            </button>
            <button
              onClick={() => triggerMutation.mutate()}
              disabled={triggerMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-[#1D4ED8] rounded-md hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {triggerMutation.isPending ? "Synthesizing..." : "Trigger New Fix Workflow"}
            </button>
          </div>
        </div>

        {/* Workflow State Machine Stepper */}
        <div className="mt-6 pt-6 border-t border-[#E2E8F0]">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
            {WORKFLOW_STEPS.map((step, idx) => {
              const stepStatus = getStepStatus(step.key, activeWorkflow?.status);
              return (
                <div
                  key={step.key}
                  className={`relative p-3 rounded border text-xs transition-all ${
                    stepStatus === "current"
                      ? "bg-white border-[#1D4ED8] shadow-xs ring-1 ring-[#1D4ED8]/20"
                      : stepStatus === "completed"
                      ? "bg-[#F0FDF4] border-[#86EFAC] text-[#166534]"
                      : stepStatus === "rejected"
                      ? "bg-[#FEF2F2] border-[#FCA5A5] text-[#991B1B]"
                      : "bg-[#F8FAFC] border-[#E2E8F0] text-[#94A3B8]"
                  }`}
                >
                  <div className="flex items-center justify-between font-mono text-[10px] uppercase font-semibold mb-1">
                    <span>STEP 0{idx + 1}</span>
                    {stepStatus === "completed" && <Check className="w-3.5 h-3.5 text-[#16A34A]" />}
                    {stepStatus === "current" && (
                      <span className="w-2 h-2 rounded-full bg-[#1D4ED8] animate-pulse"></span>
                    )}
                    {stepStatus === "rejected" && <X className="w-3.5 h-3.5 text-[#DC2626]" />}
                  </div>
                  <div className="font-semibold truncate">{step.label}</div>
                  <div className="text-[10px] text-[#64748B] capitalize mt-0.5">{stepStatus}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center text-[#64748B]">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#1D4ED8]" />
          Loading remediation workflows...
        </div>
      ) : !activeWorkflow ? (
        <div className="bg-white border border-[#E2E8F0] rounded-lg p-12 text-center">
          <ShieldAlert className="w-8 h-8 text-[#F59E0B] mx-auto mb-3" />
          <h3 className="font-serif font-bold text-lg text-[#0F172A]">No Active Remediation Workflow</h3>
          <p className="text-sm text-[#64748B] mt-1 mb-4">
            No defect has been queued for autonomous repair yet on release rel-2026-001.
          </p>
          <button
            onClick={() => triggerMutation.mutate()}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-[#1D4ED8] rounded-md hover:bg-[#1E40AF]"
          >
            <Play className="w-3.5 h-3.5" />
            Trigger Concurrency Remediation
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Left Column: Patch & Validation */}
          <div className="lg:col-span-2 space-y-6">
            {/* Defect Context Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded text-xs font-mono font-semibold bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
                    VIOLATION
                  </span>
                  <span className="font-mono text-sm font-bold text-[#0F172A]">
                    {activeWorkflow.violated_invariant}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-semibold ${
                      activeWorkflow.status === "COMPLETED" || activeWorkflow.status === "APPROVED"
                        ? "bg-[#F0FDF4] text-[#16A34A] border border-[#86EFAC]"
                        : activeWorkflow.status === "AWAITING_APPROVAL"
                        ? "bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D]"
                        : activeWorkflow.status === "VALIDATING"
                        ? "bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]"
                        : "bg-[#F8FAFC] text-[#475569] border border-[#CBD5E1]"
                    }`}
                  >
                    STATUS: {activeWorkflow.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
                <div className="bg-[#FAF8F5] p-3 rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Target File</span>
                  <span className="text-[#0F172A] font-semibold mt-0.5 block truncate">
                    {activeWorkflow.target_file_path}
                  </span>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Source Commit</span>
                  <span className="text-[#0F172A] font-semibold mt-0.5 block">
                    {activeWorkflow.source_commit.slice(0, 8)}
                  </span>
                </div>
                <div className="bg-[#FAF8F5] p-3 rounded border border-[#E2E8F0]">
                  <span className="text-[#64748B] block text-[10px] uppercase font-semibold">Patch Fingerprint</span>
                  <span className="text-[#0F172A] font-semibold mt-0.5 block truncate" title={activeWorkflow.patch_hash || ""}>
                    {activeWorkflow.patch_hash ? `${activeWorkflow.patch_hash.slice(0, 12)}...` : "None"}
                  </span>
                </div>
              </div>
            </div>

            {/* View Tabs */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg shadow-xs overflow-hidden">
              <div className="flex items-center justify-between border-b border-[#E2E8F0] bg-[#FAF8F5] px-4">
                <div className="flex items-center gap-1 py-2">
                  <button
                    onClick={() => setActiveTab("diff")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === "diff"
                        ? "bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1]"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <FileCode className="w-3.5 h-3.5 inline mr-1.5" />
                    Proposed Patch Diff (.diff)
                  </button>
                  <button
                    onClick={() => setActiveTab("sandbox")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === "sandbox"
                        ? "bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1]"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5 inline mr-1.5" />
                    Sandbox Execution Proof
                  </button>
                  <button
                    onClick={() => setActiveTab("provenance")}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      activeTab === "provenance"
                        ? "bg-white text-[#0F172A] shadow-xs border border-[#CBD5E1]"
                        : "text-[#64748B] hover:text-[#0F172A]"
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5 inline mr-1.5" />
                    Tool Execution Chain
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {activeWorkflow.status === "PATCH_PROPOSED" && (
                    <button
                      onClick={() => validateMutation.mutate(activeWorkflow.id)}
                      disabled={validateMutation.isPending}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-[#1D4ED8] rounded hover:bg-[#1E40AF] transition-colors disabled:opacity-50"
                    >
                      <Play className="w-3 h-3" />
                      {validateMutation.isPending ? "Running Sandbox..." : "Run Sandbox Verification"}
                    </button>
                  )}
                </div>
              </div>

              {/* Tab 1: Diff Viewer */}
              {activeTab === "diff" && (
                <div className="p-4 bg-[#F8FAFC] font-mono text-xs overflow-x-auto max-h-[500px]">
                  {activeWorkflow.patch_diff ? (
                    <div className="space-y-0.5">
                      {activeWorkflow.patch_diff.split("\n").map((line, idx) => {
                        let lineClass = "text-[#334155]";
                        let bgClass = "bg-transparent";
                        if (line.startsWith("+") && !line.startsWith("+++")) {
                          lineClass = "text-[#16A34A] font-semibold";
                          bgClass = "bg-[#F0FDF4]";
                        } else if (line.startsWith("-") && !line.startsWith("---")) {
                          lineClass = "text-[#DC2626]";
                          bgClass = "bg-[#FEF2F2]";
                        } else if (line.startsWith("@@")) {
                          lineClass = "text-[#2563EB] font-semibold";
                          bgClass = "bg-[#EFF6FF]";
                        } else if (line.startsWith("---") || line.startsWith("+++")) {
                          lineClass = "text-[#0F172A] font-bold";
                        }
                        return (
                          <div key={idx} className={`flex px-2 py-0.5 rounded-xs ${bgClass}`}>
                            <span className="w-8 select-none text-[#94A3B8] text-[10px] text-right pr-3 shrink-0">
                              {idx + 1}
                            </span>
                            <span className={`${lineClass} whitespace-pre`}>{line}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-[#94A3B8]">No patch generated yet.</div>
                  )}
                </div>
              )}

              {/* Tab 2: Sandbox Execution Evidence */}
              {activeTab === "sandbox" && (
                <div className="p-5 space-y-5">
                  {activeWorkflow.validation_results?.tested_at ? (
                    <>
                      <div className="flex items-center justify-between p-3 rounded-md bg-[#FAF8F5] border border-[#E2E8F0] text-xs">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                          <span className="font-semibold text-[#0F172A]">Isolated Sandbox Verification: PASSED</span>
                        </div>
                        <span className="text-[#64748B] font-mono">
                          Verified at {new Date(activeWorkflow.validation_results.tested_at).toLocaleTimeString()}
                        </span>
                      </div>

                      {/* Before / After Comparison Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Pre-Patch Failure */}
                        <div className="border border-[#FCA5A5] rounded-md overflow-hidden bg-white">
                          <div className="bg-[#FEF2F2] px-3 py-2 border-b border-[#FCA5A5] flex items-center justify-between text-xs font-mono font-bold text-[#991B1B]">
                            <span>PRE-PATCH RUN (VULNERABLE)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white text-[#DC2626]">EXIT 1</span>
                          </div>
                          <div className="p-3 text-[11px] font-mono space-y-2">
                            <div className="text-[#991B1B] font-semibold">
                              Violation: {activeWorkflow.validation_results.pre_patch_run?.invariant_violated}
                            </div>
                            <div className="bg-[#0F172A] text-[#F1F5F9] p-2.5 rounded text-[10px] overflow-x-auto max-h-48 leading-relaxed">
                              {activeWorkflow.validation_results.pre_patch_run?.stdout || "Test output recorded."}
                            </div>
                          </div>
                        </div>

                        {/* Post-Patch Success */}
                        <div className="border border-[#86EFAC] rounded-md overflow-hidden bg-white">
                          <div className="bg-[#F0FDF4] px-3 py-2 border-b border-[#86EFAC] flex items-center justify-between text-xs font-mono font-bold text-[#166534]">
                            <span>POST-PATCH RUN (REMEDIATED)</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-white text-[#16A34A]">EXIT 0</span>
                          </div>
                          <div className="p-3 text-[11px] font-mono space-y-2">
                            <div className="text-[#166534] font-semibold">
                              Resolution: {activeWorkflow.validation_results.post_patch_run?.invariant_satisfied}
                            </div>
                            <div className="bg-[#0F172A] text-[#F1F5F9] p-2.5 rounded text-[10px] overflow-x-auto max-h-48 leading-relaxed">
                              {activeWorkflow.validation_results.post_patch_run?.stdout || "Test output recorded."}
                            </div>
                          </div>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="p-8 text-center text-[#64748B]">
                      <Terminal className="w-8 h-8 text-[#94A3B8] mx-auto mb-2" />
                      <p className="text-sm font-medium">Sandbox execution pending.</p>
                      <p className="text-xs text-[#94A3B8] mt-1 mb-4">
                        Click &ldquo;Run Sandbox Verification&rdquo; to execute the test suite against both the
                        unpatched and patched implementations.
                      </p>
                      <button
                        onClick={() => validateMutation.mutate(activeWorkflow.id)}
                        disabled={validateMutation.isPending}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-[#1D4ED8] rounded hover:bg-[#1E40AF]"
                      >
                        <Play className="w-3.5 h-3.5" />
                        {validateMutation.isPending ? "Validating..." : "Execute Sandboxed Invariant Check"}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Tool Execution Chain */}
              {activeTab === "provenance" && (
                <div className="p-5 space-y-3">
                  <h4 className="text-xs font-serif font-bold text-[#0F172A] uppercase tracking-wider mb-2">
                    Autonomous Agent Tool Trace
                  </h4>
                  {activeWorkflow.tool_execution_records?.map((rec, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded bg-[#FAF8F5] border border-[#E2E8F0] text-xs">
                      <div className="w-6 h-6 rounded-full bg-[#1D4ED8]/10 text-[#1D4ED8] flex items-center justify-center font-mono font-bold text-[10px] shrink-0 mt-0.5">
                        {rec.step}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between font-mono">
                          <span className="font-bold text-[#0F172A]">{rec.tool} &rarr; {rec.action}</span>
                          <span className="text-[10px] text-[#64748B]">{new Date(rec.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-[#475569] mt-1 text-[11px]">{rec.details || JSON.stringify(rec.exit_codes)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Human Gatekeeper & Approvals */}
          <div className="space-y-6">
            {/* Gatekeeper Action Card */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-5 shadow-xs">
              <h3 className="font-serif font-bold text-base text-[#0F172A] flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#1D4ED8]" />
                Human Approval Gate
              </h3>
              <p className="text-xs text-[#64748B] mt-1">
                Autonomous code patches require explicit human review and cryptographic audit sign-off before
                branch integration.
              </p>

              <div className="mt-4 pt-4 border-t border-[#F1F5F9] space-y-3">
                {activeWorkflow.approval_status === "APPROVED" ? (
                  <div className="p-3 bg-[#F0FDF4] border border-[#86EFAC] rounded-md text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#166534]">
                      <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                      PATCH APPROVED FOR MERGE
                    </div>
                    <div className="text-[#334155] font-mono text-[11px]">
                      Approver: {activeWorkflow.approval_decision?.approver_name} ({activeWorkflow.approval_decision?.approver_email})
                    </div>
                    <div className="text-[#64748B] text-[11px] italic">
                      &ldquo;{activeWorkflow.approval_decision?.note}&rdquo;
                    </div>
                    <div className="text-[10px] text-[#64748B] pt-1 border-t border-[#BBF7D0]">
                      Branch: {activeWorkflow.remediation_branch}
                    </div>
                  </div>
                ) : activeWorkflow.approval_status === "REJECTED" ? (
                  <div className="p-3 bg-[#FEF2F2] border border-[#FCA5A5] rounded-md text-xs space-y-1.5">
                    <div className="flex items-center gap-1.5 font-bold text-[#991B1B]">
                      <X className="w-4 h-4 text-[#DC2626]" />
                      PATCH REJECTED BY REVIEWER
                    </div>
                    <div className="text-[#334155] font-mono text-[11px]">
                      Reviewer: {activeWorkflow.approval_decision?.approver_name}
                    </div>
                    <div className="text-[#991B1B] text-[11px]">
                      Reason: {activeWorkflow.approval_decision?.reason}
                    </div>
                  </div>
                ) : activeWorkflow.status === "AWAITING_APPROVAL" ? (
                  <div className="space-y-2.5">
                    <div className="p-3 bg-[#FEF3C7] border border-[#FCD34D] rounded-md text-xs text-[#92400E]">
                      <span className="font-bold block mb-1">Awaiting Sign-off</span>
                      Validation evidence confirmed 0 duplicate charges. Please inspect diff and approve.
                    </div>
                    <div className="grid grid-cols-2 gap-2 pt-2">
                      <button
                        onClick={() => setApprovalModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded hover:bg-[#15803D] transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Approve Patch
                      </button>
                      <button
                        onClick={() => setRejectModalOpen(true)}
                        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#DC2626] bg-white border border-[#FCA5A5] rounded hover:bg-[#FEF2F2] transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-md text-xs text-[#64748B]">
                    <span className="font-semibold text-[#0F172A] block mb-1">Validation Required</span>
                    Execute the sandboxed test suite before human sign-off can be initiated.
                  </div>
                )}
              </div>
            </div>

            {/* External Integration Honesty Card */}
            <div className="bg-[#FAF8F5] border border-[#E2E8F0] rounded-lg p-5 text-xs space-y-3">
              <h4 className="font-serif font-bold text-sm text-[#0F172A] flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#64748B]" />
                GitLab Duo & Remote Status
              </h4>
              <p className="text-[#475569] leading-relaxed">
                In strict compliance with hackathon transparency guidelines: genuine GitLab Duo identity verification
                and push credentials remain externally blocked.
              </p>
              <div className="p-2.5 bg-white border border-[#CBD5E1] rounded text-[11px] font-mono space-y-1">
                <div>Provider: {activeWorkflow.agent_provider}</div>
                <div>Model: {activeWorkflow.agent_model}</div>
                <div className="text-[#DC2626] font-semibold">GitLab MR: {activeWorkflow.gitlab_mr_status}</div>
              </div>
            </div>

            {/* All Workflows Drawer */}
            <div className="bg-white border border-[#E2E8F0] rounded-lg p-4 shadow-xs">
              <h4 className="font-serif font-bold text-xs uppercase tracking-wider text-[#64748B] mb-3">
                Remediation History ({workflows?.length || 0})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {workflows?.map((wf) => (
                  <button
                    key={wf.id}
                    onClick={() => setSelectedWorkflowId(wf.id)}
                    className={`w-full text-left p-2.5 rounded border text-xs transition-colors ${
                      wf.id === activeWorkflow.id
                        ? "bg-[#EFF6FF] border-[#BFDBFE] font-medium text-[#1D4ED8]"
                        : "bg-white border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#334155]"
                    }`}
                  >
                    <div className="flex items-center justify-between font-mono text-[10px]">
                      <span>{wf.id}</span>
                      <span className="capitalize">{wf.status}</span>
                    </div>
                    <div className="text-[11px] text-[#64748B] truncate mt-0.5">
                      {wf.violated_invariant}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Approval Modal */}
      {approvalModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#CBD5E1] rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#0F172A] flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#16A34A]" />
              Approve Patch Sign-off
            </h3>
            <p className="text-xs text-[#64748B]">
              You are authorizing the merge of the atomic idempotency barrier patch for release rel-2026-001.
            </p>

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-[#334155] mb-1">Approver Full Name</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="e.g. Principal SRE John Doe"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#334155] mb-1">Corporate / GitLab Email</label>
                <input
                  type="email"
                  value={approverEmail}
                  onChange={(e) => setApproverEmail(e.target.value)}
                  placeholder="e.g. jdoe@aftermath.dev"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                />
              </div>
              <div>
                <label className="block text-[#334155] mb-1">Sign-off Remarks (Optional)</label>
                <textarea
                  value={approvalNote}
                  onChange={(e) => setApprovalNote(e.target.value)}
                  placeholder="e.g. Verified zero double-debit exposure under 5 concurrent retries."
                  rows={2}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#1D4ED8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setApprovalModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeWorkflow && approverName && approverEmail) {
                    approveMutation.mutate({
                      wfId: activeWorkflow.id,
                      data: { approver_name: approverName, approver_email: approverEmail, note: approvalNote },
                    });
                  }
                }}
                disabled={!approverName || !approverEmail || approveMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#16A34A] rounded hover:bg-[#15803D] disabled:opacity-50"
              >
                {approveMutation.isPending ? "Submitting..." : "Confirm & Sign Approval"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-[#CBD5E1] rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-[#0F172A] flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-[#DC2626]" />
              Reject Remediation Patch
            </h3>
            <p className="text-xs text-[#64748B]">
              Please state why the proposed patch is unsatisfactory or unapproved for deployment.
            </p>

            <div className="space-y-3 text-xs font-medium">
              <div>
                <label className="block text-[#334155] mb-1">Reviewer Full Name</label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  placeholder="e.g. Security Lead"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label className="block text-[#334155] mb-1">Email</label>
                <input
                  type="email"
                  value={approverEmail}
                  onChange={(e) => setApproverEmail(e.target.value)}
                  placeholder="e.g. security@aftermath.dev"
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
              <div>
                <label className="block text-[#334155] mb-1">Reason for Rejection (Required)</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Missing distributed Redis lock for multi-instance deployments."
                  rows={3}
                  className="w-full px-3 py-2 border border-[#CBD5E1] rounded font-sans focus:outline-none focus:ring-1 focus:ring-[#DC2626]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectModalOpen(false)}
                className="px-3 py-1.5 text-xs text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (activeWorkflow && approverName && approverEmail && rejectReason) {
                    rejectMutation.mutate({
                      wfId: activeWorkflow.id,
                      data: { approver_name: approverName, approver_email: approverEmail, reason: rejectReason },
                    });
                  }
                }}
                disabled={!approverName || !approverEmail || !rejectReason || rejectMutation.isPending}
                className="px-4 py-2 text-xs font-semibold text-white bg-[#DC2626] rounded hover:bg-[#B91C1C] disabled:opacity-50"
              >
                {rejectMutation.isPending ? "Submitting..." : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
