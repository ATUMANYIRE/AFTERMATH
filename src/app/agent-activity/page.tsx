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
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, AgentActivityStatus } from "@/lib/api";

export default function AgentActivityPage() {
  const queryClient = useQueryClient();
  const [isTriggering, setIsTriggering] = useState(false);
  const [triggerStatus, setTriggerStatus] = useState<string | null>(null);

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
      setTriggerStatus("Successfully triggered Duo agent audit flow.");
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
        <div className="h-28 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="h-64 bg-white border border-[#ECE6DA] rounded-lg"></div>
      </div>
    );
  }

  if (isError || !agentData) {
    return (
      <div className="bg-white border border-[#FECDD3] rounded-lg p-8 text-center max-w-xl mx-auto my-12">
        <AlertCircle className="w-8 h-8 text-[#BE123C] mx-auto mb-2" />
        <h3 className="text-base font-semibold text-[#0F172A] mb-1">
          Unable to Load Agent Activity
        </h3>
        <p className="text-sm text-[#64748B] mb-4">
          Failed to fetch GitLab Duo agent sessions from backend.
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
              <span>AGENT ACTIVITY WORKSPACE</span>
              <span>&bull;</span>
              <span className="text-[#1D4ED8] font-medium">GITLAB DUO AGENT PLATFORM</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
              <Cpu className="w-6 h-6 text-[#1D4ED8]" />
              GitLab Duo Agent Activity
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Supervise AI agent flows testing code changes, identifying consequence paths, and proposing evidence-backed fixes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleTrigger}
              disabled={isTriggering}
              className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-xs transition-colors disabled:opacity-50"
            >
              {isTriggering ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Triggering Flow...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Trigger Duo Audit Flow</span>
                </>
              )}
            </button>
          </div>
        </div>

        {triggerStatus && (
          <div className="mt-3 p-2.5 rounded bg-[#EFF6FF] border border-[#DBEAFE] text-xs text-[#1D4ED8] font-mono">
            {triggerStatus}
          </div>
        )}
      </div>

      {/* Honest GitLab Duo Connection State Banner */}
      {!agentData.duo_connected ? (
        <div className="bg-white border-2 border-[#DDD4C3] rounded-lg p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded bg-[#FFFBEB] text-[#B45309] border border-[#FDE68A] flex items-center justify-center shrink-0 mt-0.5">
              <AlertCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#0F172A]">
                GitLab Duo Agent Platform — Setup &amp; Authorization Status
              </h3>
              <p className="text-xs text-[#475569] mt-1 leading-relaxed">
                {agentData.connection_message}
              </p>
            </div>
          </div>

          <div className="bg-[#FAF8F5] border border-[#ECE6DA] rounded-lg p-4 space-y-3 text-xs">
            <div className="font-semibold text-[#0F172A] flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-[#1D4ED8]" />
              Configuration Steps for Hackathon Evaluators:
            </div>
            <ol className="list-decimal list-inside space-y-1.5 text-[#475569] leading-relaxed">
              <li>
                Ensure your authenticated GitLab account has Duo Agent Platform and Ultimate access enabled.
              </li>
              <li>
                Create a Personal Access Token with <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#ECE6DA]">api</code>, <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#ECE6DA]">read_api</code>, and <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#ECE6DA]">read_repository</code> scopes.
              </li>
              <li>
                Update <code className="font-mono text-[#0F172A] bg-white px-1 py-0.5 rounded border border-[#ECE6DA]">.env</code>:
                <pre className="mt-2 p-2.5 rounded bg-[#0F172A] text-[#F8FAFC] font-mono text-[11px] overflow-x-auto">
{`GITLAB_INSTANCE_URL=https://gitlab.com
GITLAB_PROJECT_PATH=atumanyire/aftermath
GITLAB_ACCESS_TOKEN=glpat-your-token-here
GITLAB_DUO_ENABLED=true`}
                </pre>
              </li>
              <li>
                Restart the backend. Live Duo flows will execute against your GitLab repository directly.
              </li>
            </ol>
          </div>
        </div>
      ) : (
        <div className="bg-[#ECFDF5] border border-[#A7F3D0] rounded-lg p-4 flex items-center justify-between text-xs text-[#065F46]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#047857]" />
            <span className="font-semibold">GitLab Duo Agent Platform Authenticated &amp; Ready</span>
          </div>
          <span className="font-mono">{agentData.gitlab_project_path}</span>
        </div>
      )}

      {/* Execution History */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-5 py-3.5 border-b border-[#ECE6DA] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#1D4ED8]" />
            <h2 className="text-sm font-bold text-[#0F172A]">
              Duo Agent Execution Traces ({agentData.sessions.length})
            </h2>
          </div>
          <span className="text-xs text-[#64748B] font-mono">
            {agentData.completed_sessions_count} completed runs
          </span>
        </div>

        <div className="divide-y divide-[#ECE6DA]">
          {agentData.sessions.map((sess) => (
            <div key={sess.id} className="p-5 hover:bg-[#FAF8F5]/80 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#047857]"></span>
                  <span className="font-bold text-xs text-[#0F172A]">{sess.agent_name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EFF6FF] text-[#1D4ED8] border border-[#DBEAFE]">
                    {sess.agent_role}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] font-mono text-[#64748B]">
                  <span>Session: {sess.id}</span>
                  <span>Flow: {sess.gitlab_flow_name || "standard"}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-semibold text-[#64748B] block mb-0.5">Objective:</span>
                <p className="text-xs text-[#1E293B] font-medium">{sess.goal}</p>
              </div>

              {sess.summary && (
                <div className="p-3 rounded bg-[#FAF8F5] border border-[#ECE6DA] text-xs text-[#475569]">
                  <span className="font-semibold text-[#0F172A] block mb-0.5">Execution Summary:</span>
                  {sess.summary}
                </div>
              )}

              {sess.tools_invoked && sess.tools_invoked.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] font-mono text-[#64748B] mr-1">Tools Invoked:</span>
                  {sess.tools_invoked.map((tool) => (
                    <span
                      key={tool}
                      className="px-2 py-0.5 rounded bg-white border border-[#ECE6DA] text-[10px] font-mono text-[#334155]"
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
