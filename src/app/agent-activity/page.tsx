"use client";

import React, { useState } from "react";
import {
  Cpu,
  CheckCircle2,
  AlertCircle,
  Play,
  Terminal,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  GitBranch,
  FileCode,
  ShieldAlert,
  Info,
  Clock,
  Sparkles,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, AgentActivityStatus } from "@/lib/api";
import { StatCard } from "@/components/ui/stat-card";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SegmentedTabs } from "@/components/ui/tabs";

const DUO_FLOW_AUDITOR_YAML = `name: consequence-auditor
version: 1.0.0
description: GitLab Duo flow for MR consequence auditing & empirical time-machine testing
trigger:
  event: merge_request.updated
  paths:
    - "services/**"
tools:
  - name: gitlab_git_diff
  - name: time_machine_simulator
  - name: causal_graph_builder
  - name: blast_radius_analyzer
runtime:
  image: python:3.11-slim
  entrypoint: aftermath-auditor`;

const DUO_FLOW_REMEDIATOR_YAML = `name: remediation-engineer
version: 1.0.0
description: GitLab Duo flow for atomic patch synthesis and sandboxed pytest verification
trigger:
  event: aftermath.invariant_violated
  invariants:
    - INV-PAY-001
tools:
  - name: ast_concurrency_analyzer
  - name: patch_generator
  - name: isolated_sandbox_runner
runtime:
  image: python:3.11-slim
  entrypoint: aftermath-remediator`;

export default function AgentActivityPage() {
  const queryClient = useQueryClient();
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);
  const [selectedFlowYaml, setSelectedFlowYaml] = useState<"auditor" | "remediator">("auditor");

  const { data: agentData, isLoading, isError, refetch } = useQuery<AgentActivityStatus>({
    queryKey: ["agent-activity"],
    queryFn: api.getAgentActivity,
  });

  const triggerMutation = useMutation({
    mutationFn: () =>
      api.triggerAgent(
        "rel-2026-001",
        "Empirically verify Redis SETNX distributed lock under parallel checkout concurrency"
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["agent-activity"] });
      setTriggerStatus("Triggered local benchmark flow execution.");
      setTimeout(() => setTriggerStatus(null), 4000);
    },
    onError: (err: Error) => {
      setTriggerStatus(`Trigger failed: ${err.message}`);
    },
    onSettled: () => {
      setIsTriggering(false);
    },
  });

  const handleTrigger = () => {
    setIsTriggering(true);
    triggerMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white rounded-2xl border border-[#DCE2EB]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-[#DCE2EB]" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-2xl border border-[#DCE2EB]" />
      </div>
    );
  }

  if (isError || !agentData) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl p-10 text-center max-w-xl mx-auto my-16 shadow-card">
        <AlertCircle className="w-8 h-8 text-[#C74747] mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-[#172033] mb-1">
          Unable to Load Agent Activity
        </h3>
        <p className="text-sm text-[#667085] mb-6">
          Failed to fetch GitLab Duo agent sessions from backend.
        </p>
        <Button onClick={() => refetch()} variant="primary" icon={<RefreshCw className="w-4 h-4" />}>
          Retry Query
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* =========================================================================
          1. HEADER SECTION
          ========================================================================= */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-2">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#EFF4FE] text-[#3558D4] border border-[#BFD5FB]/60">
              <Cpu className="w-3 h-3 text-[#3558D4]" />
              Agent Operations &amp; Duo Traces
            </span>
            <span className="text-xs text-[#667085]">|</span>
            <span className="text-xs text-[#667085]">GitLab Flow Registry v1</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#172033]">
            GitLab Duo Agent Activity
          </h1>
          <p className="text-sm text-[#667085] mt-1 max-w-2xl leading-relaxed">
            Supervise AI agent flows testing code changes, identifying consequence paths, and proposing evidence-backed fixes under explicit governance.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 shrink-0">
          <Button onClick={() => refetch()} variant="outline" size="md" icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
          <Button
            onClick={handleTrigger}
            disabled={isTriggering}
            variant="primary"
            size="md"
            icon={isTriggering ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />}
          >
            {isTriggering ? "Triggering..." : "Trigger Benchmark Flow"}
          </Button>
        </div>
      </div>

      {triggerStatus && (
        <div className="p-3 rounded-xl bg-[#EFF4FE] border border-[#BFD5FB] text-xs text-[#3558D4] font-medium flex items-center gap-2">
          <Info className="w-4 h-4 text-[#3558D4]" />
          <span>{triggerStatus}</span>
        </div>
      )}

      {/* =========================================================================
          2. TRANSPARENT CLOUD DUO INTEGRATION STATE CARD
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#DCE2EB] p-6 lg:p-7 shadow-card space-y-4">
        <div className="flex items-start gap-3 pb-3 border-b border-[#DCE2EB]/80">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#D78A43] border border-amber-200 flex items-center justify-center shrink-0 mt-0.5">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-[#172033]">
                GitLab Duo Agent Platform — Remote Authorization Status
              </h3>
              <Badge variant="warning" dot>BLOCKED: Phone Verification Pending</Badge>
            </div>
            <p className="text-xs text-[#667085] leading-relaxed">
              {agentData.connection_message}
            </p>
          </div>
        </div>

        <div className="bg-[#FAF9F6] border border-[#DCE2EB]/80 rounded-xl p-4 space-y-2.5 text-xs text-[#667085]">
          <span className="font-bold text-[#172033] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Terminal className="w-3.5 h-3.5 text-[#3558D4]" />
            Configuration Steps for Live GitLab Duo Cloud Execution:
          </span>
          <ol className="list-decimal list-inside space-y-1 leading-relaxed text-[11px]">
            <li>Complete the SMS phone verification challenge on your GitLab account to unlock Duo Agent Platform.</li>
            <li>Create a Personal Access Token with <code className="font-mono text-[#172033] bg-white px-1.5 py-0.5 rounded border border-[#DCE2EB]">api</code>, <code className="font-mono text-[#172033] bg-white px-1.5 py-0.5 rounded border border-[#DCE2EB]">read_api</code>, and <code className="font-mono text-[#172033] bg-white px-1.5 py-0.5 rounded border border-[#DCE2EB]">read_repository</code> scopes.</li>
            <li>Set in <code className="font-mono text-[#172033] bg-white px-1.5 py-0.5 rounded border border-[#DCE2EB]">.env</code>: <code className="font-mono text-[#3558D4]">GITLAB_ACCESS_TOKEN=glpat-...</code> and <code className="font-mono text-[#3558D4]">GITLAB_DUO_ENABLED=true</code>.</li>
            <li>Restart the backend. Live Duo flows will execute against your GitLab repository directly.</li>
          </ol>
        </div>
      </div>

      {/* =========================================================================
          3. FOUR STAT CARDS
          ========================================================================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          tag="Agent Status"
          tagVariant="warning"
          title="Cloud Duo Integration"
          value="SaaS Blocked"
          delta={{
            value: "Pending SMS Phone Challenge",
            isRisk: true,
          }}
          subStats={[
            { label: "GitLab Group", value: "atumanyire-labs" },
            { label: "Project", value: "aftermath" },
          ]}
        />

        <StatCard
          tag="Flow Registry"
          tagVariant="accent"
          title="Registered Duo Flows"
          value="2 Flows"
          delta={{
            value: "Flow Registry v1 Specifications Committed",
            isPositive: true,
          }}
          subStats={[
            { label: "Auditor Flow", value: "consequence-auditor" },
            { label: "Repair Flow", value: "remediation-engineer" },
          ]}
        />

        <StatCard
          tag="Recorded Traces"
          tagVariant="default"
          title="Execution Sessions"
          value={`${agentData.sessions.length} Runs`}
          delta={{
            value: "Deterministic Benchmark Sessions",
            isPositive: true,
          }}
          subStats={[
            { label: "Completed", value: `${agentData.completed_sessions_count} Runs` },
            { label: "Active", value: "0 In-Flight" },
          ]}
        />

        <StatCard
          tag="Tool Matrix"
          tagVariant="success"
          title="Registered Agent Tools"
          value="7 Tools"
          delta={{
            value: "AST, Pytest, Time Machine, Diff Analyzers",
            isPositive: true,
          }}
          subStats={[
            { label: "Execution Sandbox", value: "Isolated Worktree" },
            { label: "Timeout Bound", value: "15 Seconds" },
          ]}
        />
      </div>

      {/* =========================================================================
          4. DECLARATIVE DUO FLOW SPECIFICATIONS CARD
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#DCE2EB] overflow-hidden shadow-card">
        <div className="p-6 border-b border-[#DCE2EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-[#3558D4]" />
              GitLab Duo Flow Registry v1 Declarations
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Declarative agent specifications authored in .gitlab/duo/
            </p>
          </div>

          <SegmentedTabs
            size="sm"
            options={[
              { id: "auditor", label: "consequence-auditor.yaml" },
              { id: "remediator", label: "remediation-engineer.yaml" },
            ]}
            activeId={selectedFlowYaml}
            onChange={(id) => setSelectedFlowYaml(id as any)}
          />
        </div>

        <div className="p-6 bg-slate-900 text-slate-100 font-mono text-xs overflow-x-auto">
          <pre className="leading-relaxed">
            {selectedFlowYaml === "auditor" ? DUO_FLOW_AUDITOR_YAML : DUO_FLOW_REMEDIATOR_YAML}
          </pre>
        </div>
      </div>

      {/* =========================================================================
          5. EXECUTION HISTORY (Explicit Benchmark Provenance)
          ========================================================================= */}
      <div className="bg-white rounded-2xl border border-[#DCE2EB] overflow-hidden shadow-card">
        <div className="p-6 border-b border-[#DCE2EB] flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-[#172033]">
              Agent Execution Traces ({agentData.sessions.length})
            </h3>
            <p className="text-xs text-[#667085] mt-0.5">
              Historical agent execution records with explicit provenance labels
            </p>
          </div>
          <Badge variant="default">Demo Benchmark Fixtures</Badge>
        </div>

        <div className="divide-y divide-[#DCE2EB]/70">
          {agentData.sessions.map((sess) => (
            <div key={sess.id} className="p-6 hover:bg-[#FAF9F6]/50 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#168568]" />
                  <span className="font-bold text-sm text-[#172033]">{sess.agent_name}</span>
                  <Badge variant="accent">{sess.agent_role}</Badge>
                  <Badge variant="warning">Benchmark Fixture</Badge>
                </div>
                <div className="flex items-center gap-3 text-xs font-mono text-[#667085]">
                  <span>Session: {sess.id}</span>
                  <span>Flow: {sess.gitlab_flow_name || "standard"}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#667085] block mb-0.5">Objective:</span>
                <p className="text-xs text-[#172033] font-medium leading-relaxed">{sess.goal}</p>
              </div>

              {sess.summary && (
                <div className="p-3.5 rounded-xl bg-[#FAF9F6] border border-[#DCE2EB]/80 text-xs text-[#667085] leading-relaxed">
                  <span className="font-semibold text-[#172033] block mb-0.5">Execution Summary:</span>
                  {sess.summary}
                </div>
              )}

              {sess.tools_invoked && sess.tools_invoked.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-[#667085] mr-1">Tools Invoked:</span>
                  {sess.tools_invoked.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded-md bg-[#FAF9F6] border border-[#DCE2EB] text-[10px] font-mono text-[#172033]"
                    >
                      {tool}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
