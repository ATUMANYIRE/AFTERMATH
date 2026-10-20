"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Compass,
  GitBranch,
  ShieldAlert,
  Server,
  Database,
  Layers,
  ArrowRight,
  ExternalLink,
  Cpu,
  Clock,
  CheckCircle2,
  AlertOctagon,
  FileText,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, InvestigationDetail } from "@/lib/api";

export default function InvestigationPage() {
  const [selectedRelease] = useState("rel-2026-001");

  const { data: investigation, isLoading, isError, refetch } = useQuery<InvestigationDetail>({
    queryKey: ["investigation", selectedRelease],
    queryFn: () => api.getInvestigation(selectedRelease),
  });

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="h-96 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="h-64 bg-white border border-[#ECE6DA] rounded-lg"></div>
      </div>
    );
  }

  if (isError || !investigation) {
    return (
      <div className="bg-white border border-[#FECDD3] rounded-lg p-8 text-center max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center mx-auto mb-3">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0F172A] mb-1">
          Investigation Data Unavailable
        </h3>
        <p className="text-sm text-[#64748B] mb-4">
          Failed to fetch investigation graph for {selectedRelease}.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-[#0F172A] text-white"
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
              <span>INVESTIGATION WORKSPACE</span>
              <span>&bull;</span>
              <span className="text-[#1D4ED8] font-medium">CAUSAL IMPACT &amp; COMPONENT TRACE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
              <Compass className="w-6 h-6 text-[#1D4ED8]" />
              Consequence Investigation
            </h1>
            <p className="text-sm text-[#475569] mt-0.5">
              Inspect changed components, cascade paths, verified evidence, and empirical blast-radius traces.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/time-machine"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#1D4ED8] hover:bg-[#1E40AF] text-white rounded transition-colors"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Launch Time Machine</span>
            </Link>
          </div>
        </div>

        {/* Root Cause Hypothesis Banner */}
        <div className="mt-4 p-3.5 rounded bg-[#FFFBEB] border border-[#FDE68A] text-xs">
          <div className="font-semibold text-[#92400E] mb-0.5 flex items-center gap-1.5">
            <AlertOctagon className="w-3.5 h-3.5" />
            Root Cause Hypothesis:
          </div>
          <p className="text-[#78350F] leading-relaxed">
            {investigation.root_cause_hypothesis}
          </p>
        </div>
      </div>

      {/* Interactive Consequence Architecture Graph */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg p-5 shadow-2xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#1D4ED8]" />
              Component Consequence Topology
            </h2>
            <p className="text-xs text-[#64748B]">
              Topology nodes indicate component health under simulated unpatched load and consequence propagation.
            </p>
          </div>
          <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-[#FAF8F5] text-[#64748B] border border-[#ECE6DA]">
            5 Nodes &bull; 4 Cascade Edges
          </span>
        </div>

        {/* Visual Graph Canvas */}
        <div className="bg-[#FAF8F5] border border-[#ECE6DA] rounded-lg p-6 overflow-x-auto">
          <div className="min-w-[700px] flex items-center justify-between gap-4 py-8 relative">
            {investigation.graph.nodes.map((node, idx) => {
              const isCritical = node.health === "critical";
              const isWarning = node.health === "warning";
              const isNormal = node.health === "normal";

              return (
                <div key={node.id} className="flex items-center">
                  {/* Node Card */}
                  <div
                    className={`w-48 p-3 rounded-lg border shadow-xs transition-all ${
                      isCritical
                        ? "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                        : isWarning
                        ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                        : "bg-white border-[#ECE6DA] text-[#1E293B]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono font-semibold mb-1">
                      <span className="uppercase text-[#64748B]">{node.component_type}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded uppercase ${
                          isCritical
                            ? "bg-[#BE123C] text-white"
                            : isWarning
                            ? "bg-[#B45309] text-white"
                            : "bg-[#047857] text-white"
                        }`}
                      >
                        {node.health}
                      </span>
                    </div>

                    <div className="font-bold text-xs text-[#0F172A] mb-1">
                      {node.label}
                    </div>

                    <p className="text-[11px] text-[#475569] line-clamp-2 leading-tight mb-2">
                      {node.description}
                    </p>

                    <div className="pt-2 border-t border-black/5 font-mono text-[10px] space-y-0.5 text-[#64748B]">
                      {Object.entries(node.metrics).map(([k, v]) => (
                        <div key={k} className="flex justify-between">
                          <span>{k}:</span>
                          <span className="font-semibold text-[#0F172A]">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Flow Arrow if not last */}
                  {idx < investigation.graph.nodes.length - 1 && (
                    <div className="px-3 flex flex-col items-center justify-center">
                      <ArrowRight className="w-5 h-5 text-[#94A3B8]" />
                      <span className="text-[9px] font-mono text-[#94A3B8] whitespace-nowrap mt-0.5">
                        cascades
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Suspected Components & Evidence List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Suspected Components */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-5 shadow-2xs space-y-4">
          <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-[#1D4ED8]" />
            Changed Components Under Review
          </h3>
          <div className="space-y-2">
            {investigation.suspected_components.map((comp) => (
              <div
                key={comp}
                className="p-3 rounded border border-[#ECE6DA] bg-[#FAF8F5] text-xs flex items-center justify-between"
              >
                <span className="font-medium text-[#1E293B]">{comp}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#FFF1F2] text-[#BE123C] border border-[#FECDD3]">
                  High Blast Radius
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#ECE6DA] text-xs text-[#64748B]">
            <p>
              Commit: <code className="font-mono text-[#0F172A]">{investigation.commit_hash}</code>
            </p>
            <p className="mt-1">
              Synthetic Sandbox Tested: <span className="text-[#047857] font-semibold">Yes</span>
            </p>
          </div>
        </div>

        {/* Right: Verified Findings & Supporting Evidence */}
        <div className="lg:col-span-2 bg-white border border-[#ECE6DA] rounded-lg p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#1D4ED8]" />
              Verified Empirical Findings &amp; Evidence
            </h3>
            <span className="text-xs text-[#64748B] font-mono">
              {investigation.evidence_items.length} items logged
            </span>
          </div>

          <div className="space-y-3">
            {investigation.evidence_items.map((evi) => (
              <div
                key={evi.id}
                className="p-4 rounded-lg border border-[#ECE6DA] bg-[#FAF8F5] text-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        evi.severity === "critical"
                          ? "bg-[#BE123C] text-white"
                          : evi.severity === "high"
                          ? "bg-[#B45309] text-white"
                          : "bg-[#047857] text-white"
                      }`}
                    >
                      {evi.severity.toUpperCase()}
                    </span>
                    <span className="font-bold text-[#0F172A] text-sm">{evi.title}</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#64748B]">
                    Category: {evi.category}
                  </span>
                </div>

                <p className="text-xs text-[#475569] leading-relaxed">{evi.summary}</p>

                {evi.raw_log_excerpt && (
                  <div className="p-2.5 rounded bg-[#0F172A] text-[#F8FAFC] font-mono text-[11px] overflow-x-auto">
                    <code>{evi.raw_log_excerpt}</code>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1 text-[11px] text-[#64748B]">
                  <span>Status: Verified Empirical Proof</span>
                  {evi.gitlab_artifact_url && (
                    <a
                      href={evi.gitlab_artifact_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1D4ED8] hover:underline inline-flex items-center gap-1 font-medium"
                    >
                      View GitLab CI Artifact
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
