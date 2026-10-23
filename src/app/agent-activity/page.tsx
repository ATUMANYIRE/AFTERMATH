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
        <div className="h-28 bg-white rounded-[13px] border border-[#ECEEF1]" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-44 bg-white rounded-[13px] border border-[#ECEEF1]" />
          ))}
        </div>
        <div className="h-80 bg-white rounded-[13px] border border-[#ECEEF1]" />
      </div>
    );
  }

  if (isError || !agentData) {
    return (
      <div className="bg-white border border-[#ECEEF1] rounded-[13px] p-10 text-center max-w-xl mx-auto my-16">
        <AlertCircle className="w-8 h-8 text-[#FF6A13] mx-auto mb-3" />
        <h3 className="text-[14px]  text-[#191C24] mb-1">
          Unable to Load Agent Activity
        </h3>
        <p className="text-[13px] text-[#747B87] mb-6">
          Failed to fetch GitLab Duo agent sessions from backend.
        </p>
        <Button onClick={() => refetch()} variant="primary" icon={<RefreshCw className="w-4 h-4" />}>
          Retry Query
        </Button>
      </div>
    );
  }

  const connected = agentData.duo_connected;
  const sessions = agentData.sessions ?? [];
  const asList = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map(String);
    if (typeof v === "string") return v.replace(/[\[\]'"]/g, "").split(",").map((t) => t.trim()).filter(Boolean);
    return [];
  };
  const plainName = (n: string) => n.replace(/^GitLab Duo /, "");
  const specs = [
    { id: "auditor" as const, yaml: DUO_FLOW_AUDITOR_YAML, file: "consequence-auditor.yaml", purpose: "Audits a merge request and runs consequence experiments on it." },
    { id: "remediator" as const, yaml: DUO_FLOW_REMEDIATOR_YAML, file: "remediation-engineer.yaml", purpose: "Proposes a patch and verifies it in the sandbox." },
  ].map((s) => ({
    ...s,
    name: /^name:\s*(.+)$/m.exec(s.yaml)?.[1] ?? s.file,
    version: /^version:\s*(.+)$/m.exec(s.yaml)?.[1] ?? "",
    tools: (s.yaml.match(/- name:\s*\S+/g) ?? []).length,
  }));
  const activeSpec = specs.find((s) => s.id === selectedFlowYaml) ?? specs[0];
  const section = "bg-white rounded-[13px] border border-[#ECEEF1]";

  const SessionRow = ({ s }: { s: (typeof sessions)[number] }) => {
    const [open, setOpen] = useState(false);
    const tools = asList(s.tools_invoked);
    return (
      <li className="px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-1">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[13px] text-[#191C24]">{plainName(s.agent_name)}</span>
              <Badge variant="default">{connected ? s.status : "Local benchmark"}</Badge>
            </div>
            <p className="typo-description text-[#747B87] mt-0.5">{s.goal}</p>
          </div>
          <span className="typo-description text-[#747B87] whitespace-nowrap">
            {s.started_at ? new Date(s.started_at).toLocaleString() : ""}
          </span>
        </div>
        {s.summary && <p className="typo-body text-[#191C24] mt-2">{s.summary}</p>}
        {tools.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {tools.map((t) => (
              <span key={t} className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-[#F4F5F7] text-[#747B87]">{t}</span>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="mt-2 text-[11px] text-[#747B87] hover:text-[#191C24]"
        >
          {open ? "Hide details" : "Show details"}
        </button>
        {open && (
          <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-[12px] rounded-[10px] bg-[#F9FAFB] border border-[#ECEEF1] p-3">
            <dt className="text-[#747B87]">Flow</dt>
            <dd className="font-mono text-[#191C24] break-all">{s.gitlab_flow_name}</dd>
            <dt className="text-[#747B87]">Session</dt>
            <dd className="font-mono text-[#191C24] break-all">{s.id}</dd>
            {s.prompt && (
              <>
                <dt className="text-[#747B87]">Prompt</dt>
                <dd className="text-[#191C24]">{s.prompt}</dd>
              </>
            )}
            {s.completed_at && (
              <>
                <dt className="text-[#747B87]">Completed</dt>
                <dd className="text-[#191C24]">{new Date(s.completed_at).toLocaleString()}</dd>
              </>
            )}
          </dl>
        )}
      </li>
    );
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="sr-only">Agent Operations · GitLab Flow Registry v1</span>
          <h1 className="typo-page-title text-[#191C24]">GitLab Duo Agent Activity</h1>
          <p className="typo-description text-[#747B87] mt-0.5">What the AI agents tested, found and proposed.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => refetch()} variant="outline" size="sm" icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Refresh
          </Button>
          <Button onClick={handleTrigger} disabled={isTriggering} variant="primary" size="sm" icon={<Play className="w-3 h-3 fill-current" />}>
            {isTriggering ? "Running…" : "Trigger Benchmark Flow"}
          </Button>
        </div>
      </div>

      {triggerStatus && (
        <p className="typo-description text-[#191C24] rounded-[10px] bg-white border border-[#ECEEF1] px-3.5 py-2" role="status">{triggerStatus}</p>
      )}

      {/* 1. Connection status */}
      <section className={`${section} p-5`}>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${connected ? "bg-[#191C24]" : "bg-[#FF6A13]"}`} />
            <div className="min-w-0">
              <h2 className="text-[14px] text-[#191C24]">GitLab Duo connection: {connected ? "Connected" : "Not connected"}</h2>
              <p className="typo-description text-[#747B87] mt-0.5 max-w-2xl">{agentData.connection_message}</p>
            </div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-x-6 gap-y-2 md:shrink-0 text-[12px]">
            <div>
              <dt className="text-[#747B87]">Project</dt>
              <dd className="text-[#191C24] font-mono break-all">{agentData.gitlab_project_path}</dd>
            </div>
            <div>
              <dt className="text-[#747B87]">Active runs</dt>
              <dd className="text-[#191C24]">{agentData.active_sessions_count}</dd>
            </div>
            <div>
              <dt className="text-[#747B87]">Completed</dt>
              <dd className="text-[#191C24]">{connected ? agentData.completed_sessions_count : 0} authenticated</dd>
            </div>
          </dl>
        </div>

        {!connected && (
          <details className="mt-4 group rounded-[10px] bg-[#F9FAFB] border border-[#ECEEF1]">
            <summary className="cursor-pointer list-none px-3.5 py-2.5 text-[12px] text-[#191C24] flex items-center justify-between">
              How to connect GitLab Duo
              <span className="text-[#747B87] group-open:hidden">Show steps</span>
              <span className="text-[#747B87] hidden group-open:inline">Hide steps</span>
            </summary>
            <ol className="px-3.5 pb-3 pt-1 space-y-1.5 text-[12px] text-[#747B87] list-decimal list-inside">
              <li>Complete the SMS phone verification on your GitLab account.</li>
              <li>Create a personal access token with <code className="font-mono text-[#191C24]">api</code>, <code className="font-mono text-[#191C24]">read_api</code> and <code className="font-mono text-[#191C24]">read_repository</code> scopes.</li>
              <li>In <code className="font-mono text-[#191C24]">.env</code> set <code className="font-mono text-[#191C24]">GITLAB_ACCESS_TOKEN</code> and <code className="font-mono text-[#191C24]">GITLAB_DUO_ENABLED=true</code>.</li>
              <li>Restart the backend.</li>
            </ol>
          </details>
        )}
      </section>

      {/* 2. Genuine execution history */}
      <section className={section}>
        <header className="px-5 py-4 border-b border-[#ECEEF1]">
          <h2 className="text-[14px] text-[#191C24]">GitLab Duo execution history</h2>
          <p className="typo-description text-[#747B87]">Runs authenticated against GitLab Duo.</p>
        </header>
        {connected && sessions.length > 0 ? (
          <ul className="divide-y divide-[#ECEEF1]">
            {sessions.map((s) => <SessionRow key={s.id} s={s} />)}
          </ul>
        ) : (
          <p className="typo-description text-[#747B87] px-5 py-8 text-center">
            No authenticated GitLab Duo executions yet.
          </p>
        )}
      </section>

      {/* 3. Local benchmark activity */}
      <section className={section}>
        <header className="px-5 py-4 border-b border-[#ECEEF1] flex items-start justify-between gap-3">
          <div>
            <h2 className="text-[14px] text-[#191C24]">Local benchmark activity ({connected ? 0 : sessions.length})</h2>
            <p className="typo-description text-[#747B87]">
              Recorded by this app’s built-in agent simulation. These are fixtures, not runs on GitLab Duo.
            </p>
          </div>
        </header>
        {!connected && sessions.length > 0 ? (
          <ul className="divide-y divide-[#ECEEF1]">
            {sessions.map((s) => <SessionRow key={s.id} s={s} />)}
          </ul>
        ) : (
          <p className="typo-description text-[#747B87] px-5 py-8 text-center">No local benchmark runs yet.</p>
        )}
      </section>

      {/* 4. Agent specifications */}
      <section className={section}>
        <header className="px-5 py-4 border-b border-[#ECEEF1]">
          <h2 className="text-[14px] text-[#191C24]">Agent specifications</h2>
          <p className="typo-description text-[#747B87]">Flows declared in <span className="font-mono">.gitlab/duo/</span>. Declared, not necessarily running.</p>
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#ECEEF1]">
          {specs.map((sp) => (
            <button
              key={sp.id}
              type="button"
              onClick={() => setSelectedFlowYaml(sp.id)}
              aria-pressed={selectedFlowYaml === sp.id}
              className={`text-left whitespace-normal bg-white px-5 py-4 hover:bg-[#F9FAFB] ${selectedFlowYaml === sp.id ? "shadow-[inset_2px_0_0_#FF6A13]" : ""}`}
            >
              <span className="text-[13px] text-[#191C24] block">{sp.name}</span>
              <span className="typo-description text-[#747B87] block">{sp.purpose}</span>
              <span className="typo-description text-[#969CA6] block mt-1">v{sp.version} · {sp.tools} tools · {sp.file}</span>
            </button>
          ))}
        </div>
      </section>

      {/* 5. Raw YAML, collapsed by default */}
      <details className={`${section} group`}>
        <summary className="cursor-pointer list-none px-5 py-4 flex items-center justify-between">
          <span>
            <span className="text-[14px] text-[#191C24] block">Raw flow YAML</span>
            <span className="typo-description text-[#747B87]">{activeSpec.file}</span>
          </span>
          <span className="typo-description text-[#747B87] group-open:hidden">Show</span>
          <span className="typo-description text-[#747B87] hidden group-open:inline">Hide</span>
        </summary>
        <div className="border-t border-[#ECEEF1] px-5 py-3 flex items-center gap-2">
          <SegmentedTabs
            size="sm"
            options={specs.map((sp) => ({ id: sp.id, label: sp.file }))}
            activeId={selectedFlowYaml}
            onChange={(id) => setSelectedFlowYaml(id as "auditor" | "remediator")}
          />
        </div>
        <pre className="bg-[#F9FAFB] border-t border-[#ECEEF1] px-5 py-4 font-mono text-[12px] leading-5 text-[#191C24] overflow-x-auto rounded-b-[13px]">
          {activeSpec.yaml}
        </pre>
      </details>
    </div>
  );
}
