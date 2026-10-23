"use client";

import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DiffViewer } from "@/components/diff-viewer";
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
  CheckCircle,
  XCircle,
  ShieldCheck,
} from "lucide-react";
import { api, RemediationWorkflowItem } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/tabs";

const WORKFLOW_STEPS = [
  { key: "DETECTED", label: "Defect Detected" },
  { key: "INVESTIGATING", label: "Causal Analysis" },
  { key: "PATCH_PROPOSED", label: "Patch Synthesized" },
  { key: "VALIDATING", label: "Sandbox Validating" },
  { key: "AWAITING_APPROVAL", label: "Human Gatekeeper" },
  { key: "COMPLETED", label: "Approved & Merged" },
];


type SandboxRun = NonNullable<RemediationWorkflowItem["validation_results"]["pre_patch_run"]>;

function TestRunPanel({ title, run, note }: { title: string; run?: SandboxRun; note?: string }) {
  const [showRaw, setShowRaw] = useState(false);
  if (!run) {
    return (
      <section className="rounded-[13px] border border-[#ECEEF1] p-4">
        <h4 className="text-[13px] text-[#191C24]">{title}</h4>
        <p className="typo-description text-[#747B87] mt-2">Not run yet.</p>
      </section>
    );
  }
  const tests = run.stdout
    .split("\n")
    .map((l) => /^(\S+?)::(\S+)\s+(PASSED|FAILED|ERROR|SKIPPED)/.exec(l))
    .filter((m): m is RegExpExecArray => !!m)
    .map((m) => ({ file: m[1], name: m[2], result: m[3] }));
  const ok = run.exit_code === 0;
  return (
    <section className="min-w-0 rounded-[13px] border border-[#ECEEF1] overflow-hidden">
      <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#ECEEF1]">
        <h4 className="text-[13px] text-[#191C24]">{title}</h4>
        <span className={`typo-badge px-2 py-0.5 rounded-full whitespace-nowrap ${ok ? "bg-[#F4F5F7] text-[#191C24]" : "bg-[#FFF5EC] text-[#FF6A13]"}`}>
          {ok ? "Passed" : "Failed"} · exit {run.exit_code}
        </span>
      </header>
      <dl className="grid grid-cols-3 gap-px bg-[#ECEEF1] border-b border-[#ECEEF1]">
        {[
          ["Passed", run.passed],
          ["Failed", run.failed],
          ["Duration", `${run.duration_seconds}s`],
        ].map(([k, v]) => (
          <div key={String(k)} className="bg-white px-4 py-2">
            <dt className="text-[11px] text-[#747B87]">{k}</dt>
            <dd className="text-[14px] text-[#191C24] tabular-nums">{String(v)}</dd>
          </div>
        ))}
      </dl>
      {tests.length > 0 && (
        <ul className="divide-y divide-[#ECEEF1]">
          {tests.map((t) => (
            <li key={t.name} className="flex items-center justify-between gap-3 px-4 py-2 text-[12px]">
              <span className="font-mono text-[#191C24] truncate" title={`${t.file}::${t.name}`}>{t.name}</span>
              <span className={`whitespace-nowrap ${t.result === "PASSED" ? "text-[#747B87]" : "text-[#FF6A13]"}`}>{t.result.toLowerCase()}</span>
            </li>
          ))}
        </ul>
      )}
      {note && <p className="typo-description text-[#747B87] px-4 py-2.5 border-t border-[#ECEEF1]">{note}</p>}
      <div className="border-t border-[#ECEEF1]">
        <button
          type="button"
          onClick={() => setShowRaw((v) => !v)}
          aria-expanded={showRaw}
          className="w-full text-left px-4 py-2 text-[11px] text-[#747B87] hover:text-[#191C24]"
        >
          {showRaw ? "Hide raw output" : "Show raw output"}
        </button>
        {showRaw && (
          <pre className="bg-[#F9FAFB] border-t border-[#ECEEF1] px-4 py-3 font-mono text-[11px] leading-5 text-[#191C24] overflow-x-auto max-h-80 overflow-y-auto">
            {run.stdout}
            {run.stderr ? `\n${run.stderr}` : ""}
          </pre>
        )}
      </div>
    </section>
  );
}

export default function RemediationPage() {
  const queryClient = useQueryClient();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [approverName, setApproverName] = useState("Lead Release Engineer");
  const [approverEmail, setApproverEmail] = useState("lead-sre@company.com");
  const [approvalNote, setApprovalNote] = useState(
    "Verified atomic reservation lock eliminates INV-PAY-001 race condition with zero latency regressions."
  );
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
    mutationFn: ({
      wfId,
      data,
    }: {
      wfId: string;
      data: { approver_name: string; approver_email: string; note?: string };
    }) => api.approveRemediation(wfId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remediation-workflows"] });
      setApprovalModalOpen(false);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({
      wfId,
      data,
    }: {
      wfId: string;
      data: { approver_name: string; approver_email: string; reason: string };
    }) => api.rejectRemediation(wfId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["remediation-workflows"] });
      setRejectModalOpen(false);
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

    const order = [
      "DETECTED",
      "INVESTIGATING",
      "PATCH_PROPOSED",
      "VALIDATING",
      "AWAITING_APPROVAL",
      "COMPLETED",
    ];
    const currentIndex = order.indexOf(
      currentStatus === "APPROVED" ? "COMPLETED" : currentStatus
    );
    const stepIndex = order.indexOf(stepKey);

    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "pending";
  };

  if (isLoading) {
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

  const validation = activeWorkflow?.validation_results;
  const pre = validation?.pre_patch_run;
  const post = validation?.post_patch_run;
  const diffStats = (() => {
    const lines = (activeWorkflow?.patch_diff || "").split("\n");
    const add = lines.filter((l) => l.startsWith("+") && !l.startsWith("+++")).length;
    const del = lines.filter((l) => l.startsWith("-") && !l.startsWith("---")).length;
    return `+${add} / -${del}`;
  })();
  const isApproved = activeWorkflow?.approval_status === "APPROVED";
  const isPending = activeWorkflow?.approval_status === "PENDING";
  const isRejected = activeWorkflow?.approval_status === "REJECTED";

  return (
    <div className="space-y-8">
      {/* =========================================================================
          1. HEADER SECTION
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <span className="sr-only">Supervised Remediation Studio · rel-2026-001 (a8f9c21b4d08)</span>
          <h1 className="typo-page-title text-[#191C24]">
            Remediation Studio &amp; Fix Verification
          </h1>
          <p className="typo-description text-[#747B87] mt-0.5">Review the proposed fix, its sandbox proof and sign-off.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <Button onClick={() => refetch()} variant="outline" size="md" icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
          <Button
            onClick={() => triggerMutation.mutate()}
            disabled={triggerMutation.isPending}
            variant="primary"
            size="md"
            icon={<Play className="w-4 h-4 fill-current" />}
          >
            {triggerMutation.isPending ? "Synthesizing..." : "Trigger New Fix Workflow"}
          </Button>
        </div>
      </div>

      {/* =========================================================================
          2. WORKFLOW STEPPER CARD (Clean White Card)
          ========================================================================= */}
      <div className="bg-white rounded-[13px] border border-[#ECEEF1] p-6 space-y-4">
        <div className="flex items-center justify-between text-[12px] text-[#747B87]">
          <span className=" text-[#191C24] text-[11px]">
            Autonomous Remediation Pipeline Lifecycle
          </span>
          <span className="font-mono">
            Active Workflow: {activeWorkflow?.id || "None"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {WORKFLOW_STEPS.map((step, idx) => {
            const stepStatus = getStepStatus(step.key, activeWorkflow?.status);
            return (
              <div
                key={step.key}
                className={`p-3 rounded-[13px] border text-[12px] transition-all ${
                  stepStatus === "current"
                    ? "bg-[#F4F5F7] border-[#20242D] text-[#191C24]  shadow-xs"
                    : stepStatus === "completed"
                    ? "bg-[#F4F5F7] border-[#ECEEF1] text-[#191C24]"
                    : stepStatus === "rejected"
                    ? "bg-[#FEF2F2] border-[#ECEEF1] text-[#FF6A13]"
                    : "bg-[#F8F9FB] border-[#ECEEF1]/70 text-[#747B87]"
                }`}
              >
                <div className="flex items-center justify-between text-[10px]  mb-1">
                  <span>STEP 0{idx + 1}</span>
                  {stepStatus === "completed" && <Check className="w-3.5 h-3.5 text-[#191C24]" />}
                  {stepStatus === "current" && (
                    <span className="w-2 h-2 rounded-full bg-[#20242D] animate-pulse" />
                  )}
                  {stepStatus === "rejected" && <X className="w-3.5 h-3.5 text-[#FF6A13]" />}
                </div>
                <div className=" truncate">{step.label}</div>
                <div className="text-[10px] opacity-80 capitalize mt-0.5">{stepStatus}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* =========================================================================
          3. FOUR STAT CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          tag="Pipeline State"
          tagVariant={isApproved ? "success" : isRejected ? "error" : "accent"}
          title="Workflow Status"
          value={activeWorkflow?.status || "PATCH_PROPOSED"}
          delta={{
            value: isApproved ? "Gatekeeper Sign-off Granted" : "Awaiting Engineer Approval",
            isPositive: isApproved,
            isRisk: isRejected,
          }}
          subStats={[
            { label: "Source commit", value: activeWorkflow?.source_commit?.substring(0, 8) || "–" },
            { label: "Changed files", value: String(activeWorkflow?.changed_files?.length ?? 0) },
          ]}
        />

        <StatCard
          tag="Code Target"
          tagVariant="default"
          title="Target Service File"
          value="processor.py"
          delta={{
            value: "services/payment_worker/processor.py",
            isPositive: true,
          }}
          subStats={[
            { label: "Patch Hash", value: activeWorkflow?.patch_hash?.substring(0, 10) || "sha256..." },
            { label: "Changed lines", value: diffStats },
          ]}
        />

        <StatCard
          title="Sandbox Safety Score"
          value={post ? `${post.passed} of ${post.passed + post.failed} pass` : "Not run"}
          delta={{
            value: post ? (post.exit_code === 0 ? "All tests pass after the patch" : "Tests still failing after the patch") : "Run the sandbox to verify",
            isRisk: !!post && post.exit_code !== 0,
          }}
          subStats={[
            { label: "Unpatched pytest", value: pre ? `${pre.failed} failed, ${pre.passed} passed` : "–" },
            { label: "Patched pytest", value: post ? `${post.failed} failed, ${post.passed} passed` : "–" },
          ]}
        />

        <StatCard
          tag="Governance Gate"
          tagVariant={isApproved ? "success" : "warning"}
          title="Human Sign-off"
          value={activeWorkflow?.approval_status || "PENDING"}
          delta={{
            value: isApproved ? "Audit Record Persisted" : "Lead SRE Action Required",
            isPositive: isApproved,
            isRisk: !isApproved,
          }}
          subStats={[
            { label: "Approver", value: activeWorkflow?.approval_decision?.approver_name || "Unassigned" },
            { label: "Policy Gate", value: isApproved ? "PASSED" : "HELD" },
          ]}
        />
      </div>

      {/* Approval status: always visible above the evidence */}
      <div
        className={`rounded-[13px] border px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isApproved ? "bg-white border-[#ECEEF1]" : isRejected ? "bg-[#FFF5EC] border-[#FFE2CC]" : "bg-[#FFF5EC] border-[#FFE2CC]"
        }`}
        role="status"
      >
        <div className="flex items-start gap-3">
          <ShieldCheck className={`w-5 h-5 mt-0.5 shrink-0 ${isApproved ? "text-[#191C24]" : "text-[#FF6A13]"}`} />
          <div>
            <span className="text-[14px] text-[#191C24] block">
              {isApproved ? "Approved by a human engineer" : isRejected ? "Patch rejected" : "Awaiting human approval"}
            </span>
            <span className="typo-description text-[#747B87]">
              {isApproved
                ? `${activeWorkflow?.approval_decision?.approver_name ?? "Approver"} signed off${activeWorkflow?.approval_decision?.decided_at ? ` on ${new Date(activeWorkflow.approval_decision.decided_at).toLocaleString()}` : ""}.`
                : isRejected
                ? activeWorkflow?.approval_decision?.reason || "The patch was rejected and will not be promoted."
                : pre && post
                ? "Sandbox evidence is recorded. Nothing is promoted until an engineer signs off."
                : "Run the sandbox verification, then sign off below. Nothing is promoted until an engineer approves."}
            </span>
          </div>
        </div>
        {!isApproved && (
          <a href="#signoff" className="typo-button inline-flex items-center h-8 px-3 rounded-[10px] bg-white border border-[#ECEEF1] text-[#191C24] hover:bg-[#F9FAFB] whitespace-nowrap self-start sm:self-auto">
            Go to sign-off
          </a>
        )}
      </div>

      {/* =========================================================================
          4. MAIN WORKSPACE: UNIFIED DIFF VS SANDBOX PROOF VS PROVENANCE
          ========================================================================= */}
      <div className="bg-white rounded-[13px] border border-[#ECEEF1] overflow-hidden">
        {/* Workspace Tab Header */}
        <div className="p-6 border-b border-[#ECEEF1] flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SegmentedTabs
              options={[
                { id: "diff", label: "GNU Unified Patch Diff", icon: <FileCode className="w-3.5 h-3.5" /> },
                { id: "sandbox", label: "Sandbox Execution Proof", icon: <Terminal className="w-3.5 h-3.5" />, badge: "Pytest" },
                { id: "provenance", label: "Agent Tool Provenance", icon: <Cpu className="w-3.5 h-3.5" /> },
              ]}
              activeId={activeTab}
              onChange={(id) => setActiveTab(id as any)}
            />
          </div>

          <div className="flex items-center gap-3">
            {activeWorkflow && (
              <Button
                onClick={() => {
                  // Only workflows with a freshly proposed patch can be (re)validated; otherwise show the recorded run.
                  if (activeWorkflow.status === "PATCH_PROPOSED") validateMutation.mutate(activeWorkflow.id);
                  else setActiveTab("sandbox");
                }}
                disabled={validateMutation.isPending}
                variant="primary"
                size="sm"
                icon={
                  validateMutation.isPending ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )
                }
              >
                {validateMutation.isPending ? "Executing Sandbox..." : "Execute Sandbox Verification"}
              </Button>
            )}
          </div>
        </div>

        {/* Tab 1: GNU Unified Diff */}
        {activeTab === "diff" && (
          <div className="p-4 sm:p-5">
            <DiffViewer diff={activeWorkflow?.patch_diff} hash={activeWorkflow?.patch_hash} />
          </div>
        )}

        {/* Tab 2: Sandbox Execution Proof (recorded output only) */}
        {activeTab === "sandbox" && (
          <div className="p-4 sm:p-5 space-y-4">
            {!validation?.pre_patch_run && !validation?.post_patch_run ? (
              <div className="rounded-[13px] border border-dashed border-[#ECEEF1] py-10 text-center space-y-1">
                <p className="text-[13px] text-[#191C24]">No sandbox run recorded for this workflow</p>
                <p className="typo-description text-[#747B87]">Use “Execute Sandbox Verification” to run the tests against the unpatched and patched code.</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 rounded-[10px] bg-[#F9FAFB] border border-[#ECEEF1] px-3.5 py-2.5">
                  <div>
                    <span className="text-[13px] text-[#191C24] block">Isolated Worktree Sandbox Runner</span>
                    <span className="typo-description text-[#747B87]">
                      Real pytest output from an ephemeral worktree{validation?.tested_at ? `, run ${new Date(validation.tested_at).toLocaleString()}` : ""}.
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {validation?.sandbox_worktree && (
                      <>
                        <Badge variant="default">{validation.sandbox_worktree.isolation_mode}</Badge>
                        <Badge variant="default">{validation.sandbox_worktree.clean_teardown ? "Clean teardown" : "Teardown incomplete"}</Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <TestRunPanel
                    title="Unpatched Target Execution (Failure Proof)"
                    run={validation?.pre_patch_run}
                    note={validation?.pre_patch_run?.invariant_violated}
                  />
                  <TestRunPanel
                    title="Patched Target Execution (Invariant Restored)"
                    run={validation?.post_patch_run}
                    note={validation?.post_patch_run?.invariant_satisfied}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {/* Tab 3: Agent Tool Provenance */}
        {activeTab === "provenance" && (
          <div className="p-6 lg:p-8 space-y-4">
            <h4 className="text-[13px]  text-[#191C24]">
              Tool Invocation &amp; Remediation Audit Trace
            </h4>
            <div className="space-y-3">
              {activeWorkflow?.tool_execution_records?.map((rec: any, idx: number) => (
                <div key={idx} className="p-4 rounded-[13px] border border-[#ECEEF1] bg-[#F8F9FB] text-[12px] space-y-1">
                  <div className="flex items-center justify-between">
                    <span className=" text-[#191C24] font-mono">
                      Step 0{rec.step || idx + 1}: {rec.tool}
                    </span>
                    <span className="font-mono text-[10px] text-[#747B87]">
                      {rec.timestamp ? new Date(rec.timestamp).toLocaleTimeString() : "Recorded"}
                    </span>
                  </div>
                  <p className=" text-[#191C24]">{rec.action}</p>
                  <p className="text-[#747B87] leading-relaxed">{rec.details}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          5. HUMAN GATEKEEPER SIGN-OFF & APPROVAL FORM
          ========================================================================= */}
      <div id="signoff" className="bg-white rounded-[13px] border border-[#ECEEF1] p-5 space-y-5 scroll-mt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#ECEEF1]">
          <div>
            <h3 className="text-[14px]  text-[#191C24] flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#191C24]" />
              Supervised Human Gatekeeper Sign-off
            </h3>
            <p className="text-[12px] text-[#747B87] mt-0.5">
              Production integration gate. Mandates explicit human engineer sign-off backed by reproducible sandbox evidence.
            </p>
          </div>

          <Badge variant={isApproved ? "success" : "warning"} dot>
            {isApproved ? "Signed Off & Approved" : "Awaiting Sign-off"}
          </Badge>
        </div>

        {isApproved ? (
          <div className="bg-[#F4F5F7] border border-[#ECEEF1] rounded-[13px] p-5 text-[12px] text-[#191C24] space-y-2">
            <div className="flex items-center gap-2  text-[13px]">
              <CheckCircle className="w-4 h-4" />
              <span>Patch Formally Signed Off by Lead Release Engineer</span>
            </div>
            <p className="leading-relaxed">
              <strong>Rationale:</strong> {activeWorkflow?.approval_decision?.note || approvalNote}
            </p>
            <div className="flex items-center gap-4 text-[11px] font-mono pt-1 text-[#191C24]">
              <span>Approver: {activeWorkflow?.approval_decision?.approver_name}</span>
              <span>&bull;</span>
              <span>Signed At: {new Date(activeWorkflow?.approval_decision?.decided_at || Date.now()).toLocaleString()}</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12px]">
              <div>
                <label className="block  text-[#191C24] mb-1">
                  Lead Engineer Name
                </label>
                <input
                  type="text"
                  value={approverName}
                  onChange={(e) => setApproverName(e.target.value)}
                  className="w-full bg-[#F8F9FB] border border-[#ECEEF1] rounded-[13px] px-3.5 py-2 text-[12px] focus:bg-white focus:outline-none focus:border-[#20242D]"
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
                  className="w-full bg-[#F8F9FB] border border-[#ECEEF1] rounded-[13px] px-3.5 py-2 text-[12px] focus:bg-white focus:outline-none focus:border-[#20242D]"
                />
              </div>
            </div>

            <div className="text-[12px]">
              <label className="block  text-[#191C24] mb-1">
                Approval Sign-off Rationale
              </label>
              <textarea
                rows={2}
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                className="w-full bg-[#F8F9FB] border border-[#ECEEF1] rounded-[13px] p-3 text-[12px] focus:bg-white focus:outline-none focus:border-[#20242D]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                onClick={() => {
                  if (activeWorkflow) {
                    rejectMutation.mutate({
                      wfId: activeWorkflow.id,
                      data: {
                        approver_name: approverName,
                        approver_email: approverEmail,
                        reason: "Manual rejection during gate evaluation",
                      },
                    });
                  }
                }}
                disabled={rejectMutation.isPending}
                variant="destructive"
                size="md"
              >
                Reject Patch
              </Button>

              <Button
                onClick={() => {
                  if (activeWorkflow) {
                    approveMutation.mutate({
                      wfId: activeWorkflow.id,
                      data: {
                        approver_name: approverName,
                        approver_email: approverEmail,
                        note: approvalNote,
                      },
                    });
                  }
                }}
                disabled={approveMutation.isPending}
                variant="primary"
                size="md"
                icon={<Check className="w-4 h-4" />}
              >
                {approveMutation.isPending ? "Signing off..." : "Sign Off & Approve for Staging"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
