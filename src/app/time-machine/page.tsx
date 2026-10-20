"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
  Layers,
  FileText,
  Filter,
  Activity,
  Sliders,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api, TimeMachineComparison, ExperimentEventItem, EvidenceItem } from "@/lib/api";

export default function TimeMachinePage() {
  const [selectedRelease] = useState("rel-2026-001");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({
    "evi-001": true,
    "evi-003": true,
  });

  const { data: comparison, isLoading, isError, refetch } = useQuery<TimeMachineComparison>({
    queryKey: ["time-machine", selectedRelease],
    queryFn: () => api.getTimeMachineComparison(selectedRelease),
  });

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-28 bg-white border border-[#ECE6DA] rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-20 bg-white border border-[#ECE6DA] rounded-lg"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-white border border-[#ECE6DA] rounded-lg"></div>
          <div className="h-96 bg-white border border-[#ECE6DA] rounded-lg"></div>
        </div>
      </div>
    );
  }

  if (isError || !comparison) {
    return (
      <div className="bg-white border border-[#FECDD3] rounded-lg p-8 text-center max-w-xl mx-auto my-12">
        <div className="w-12 h-12 rounded-full bg-[#FFF1F2] text-[#BE123C] flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <h3 className="text-base font-semibold text-[#0F172A] mb-1">
          Comparison Data Not Found
        </h3>
        <p className="text-sm text-[#64748B] mb-4">
          Unable to load experiment runs for release &apos;{selectedRelease}&apos;. Ensure the backend database has been seeded.
        </p>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded bg-[#0F172A] text-white hover:bg-[#1E293B]"
        >
          Retry
        </button>
      </div>
    );
  }

  const { vulnerable_experiment: vuln, repaired_experiment: rep, delta_summary: delta } = comparison;

  const filterEvents = (events: ExperimentEventItem[]) => {
    if (filterLevel === "all") return events;
    if (filterLevel === "anomalies") {
      return events.filter((e) => e.level === "error" || e.level === "critical");
    }
    if (filterLevel === "success") {
      return events.filter((e) => e.level === "success");
    }
    return events;
  };

  const filteredVulnEvents = filterEvents(vuln.events);
  const filteredRepEvents = filterEvents(rep.events);

  return (
    <div className="space-y-6">
      {/* Signature Header Banner */}
      <div className="bg-white border border-[#ECE6DA] rounded-lg p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-[#64748B] mb-1">
              <span className="font-semibold text-[#1D4ED8] bg-[#EFF6FF] px-2 py-0.5 rounded border border-[#DBEAFE]">
                SIGNATURE EXPERIENCE
              </span>
              <span>&bull;</span>
              <span>COUNTERFACTUAL TIMELINE COMPARISON</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A] flex items-center gap-2">
              <Clock className="w-6 h-6 text-[#1D4ED8]" />
              Release Time Machine
            </h1>
            <p className="text-sm text-[#475569] mt-1 max-w-3xl">
              Split comparison of two actual experiment runs: <strong className="text-[#BE123C]">Vulnerable Release</strong> versus{" "}
              <strong className="text-[#047857]">Repaired Release</strong>. Compare chronological timelines, event sequences, and empirical test evidence before production deployment.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link
              href="/release-control"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs transition-colors"
            >
              <span>Inspect Verification Gates</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Release Metadata Ribbon */}
        <div className="mt-4 pt-4 border-t border-[#ECE6DA] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex flex-wrap items-center gap-4 text-[#64748B]">
            <div>
              <span className="text-[#94A3B8]">Release: </span>
              <span className="font-semibold text-[#0F172A]">{comparison.version_tag}</span>
            </div>
            <span className="text-[#DDD4C3]">&bull;</span>
            <div>
              <span className="text-[#94A3B8]">Commit: </span>
              <span className="font-semibold text-[#0F172A]">a8f9c21b4d08</span>
            </div>
            <span className="text-[#DDD4C3]">&bull;</span>
            <div>
              <span className="text-[#94A3B8]">Scenario: </span>
              <span className="text-[#334155]">450 concurrent checkouts with 12% network retry injection</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-[#FAF8F5] text-[#475569] border border-[#ECE6DA]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#047857]"></span>
              Seeded Benchmark Fixture
            </span>
          </div>
        </div>
      </div>

      {/* Delta Outcome Highlights (Makes the difference immediately clear) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Delta 1 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="text-xs text-[#64748B] font-medium mb-1">Errors Prevented</div>
          <div className="text-2xl font-bold font-mono text-[#047857]">
            {delta.errors_prevented} Violations
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            27 &rarr; 0 idempotency concurrency breaches
          </div>
        </div>

        {/* Delta 2 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="text-xs text-[#64748B] font-medium mb-1">Financial Risk Avoided</div>
          <div className="text-2xl font-bold font-mono text-[#047857]">
            ${delta.financial_exposure_prevented_usd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            Double debits completely neutralized
          </div>
        </div>

        {/* Delta 3 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="text-xs text-[#64748B] font-medium mb-1">p95 Latency Delta</div>
          <div className="text-2xl font-bold font-mono text-[#1D4ED8]">
            -{delta.latency_improvement_ms} ms
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            {delta.latency_improvement_ratio} (482ms &rarr; 68.5ms)
          </div>
        </div>

        {/* Delta 4 */}
        <div className="bg-white border border-[#ECE6DA] rounded-lg p-4 shadow-2xs">
          <div className="text-xs text-[#64748B] font-medium mb-1">DB Pool Saturation</div>
          <div className="text-2xl font-bold font-mono text-[#047857]">
            -72% Load
          </div>
          <div className="text-[11px] text-[#64748B] mt-0.5">
            100% (starved) &rarr; 28% (nominal handles)
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex items-center justify-between text-xs bg-white border border-[#ECE6DA] px-4 py-2.5 rounded-lg">
        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-[#64748B]" />
          <span className="font-medium text-[#334155]">Filter Timeline Events:</span>
          <div className="inline-flex rounded border border-[#ECE6DA] p-0.5 bg-[#FAF8F5]">
            <button
              onClick={() => setFilterLevel("all")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterLevel === "all" ? "bg-white text-[#0F172A] shadow-xs" : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              All Events
            </button>
            <button
              onClick={() => setFilterLevel("anomalies")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterLevel === "anomalies" ? "bg-white text-[#BE123C] shadow-xs" : "text-[#64748B] hover:text-[#BE123C]"
              }`}
            >
              Anomalies Only
            </button>
            <button
              onClick={() => setFilterLevel("success")}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                filterLevel === "success" ? "bg-white text-[#047857] shadow-xs" : "text-[#64748B] hover:text-[#047857]"
              }`}
            >
              Success / Verifications
            </button>
          </div>
        </div>

        <div className="text-[#64748B] font-mono text-[11px] hidden sm:block">
          Synced discrete time scale (0ms &mdash; 4,800ms)
        </div>
      </div>

      {/* Split Comparison Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: VULNERABLE RELEASE */}
        {/* ========================================================================= */}
        <div className="bg-white border-2 border-[#FECDD3] rounded-lg shadow-xs flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[#FFF1F2]/60 border-b border-[#FECDD3]">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#BE123C] text-white">
                <AlertTriangle className="w-3 h-3" />
                VULNERABLE RELEASE
              </span>
              <span className="font-mono text-xs text-[#9F1239] font-medium">
                {vuln.id}
              </span>
            </div>

            <h3 className="text-base font-bold text-[#0F172A]">
              {vuln.name}
            </h3>
            <p className="text-xs text-[#475569] mt-1">
              {vuln.description}
            </p>

            {/* Run Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#FECDD3]/60 text-xs font-mono">
              <div>
                <span className="text-[#9F1239] block text-[10px]">ANOMALIES</span>
                <span className="font-bold text-[#BE123C]">{vuln.error_count} double debits</span>
              </div>
              <div>
                <span className="text-[#9F1239] block text-[10px]">p95 LATENCY</span>
                <span className="font-bold text-[#0F172A]">{vuln.p95_latency_ms} ms</span>
              </div>
              <div>
                <span className="text-[#9F1239] block text-[10px]">GITLAB CI JOB</span>
                <a
                  href={`https://gitlab.com/atumanyire/aftermath/-/jobs/881920`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#1D4ED8] hover:underline inline-flex items-center gap-0.5"
                >
                  {vuln.gitlab_job_id}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Timeline Events Stream */}
          <div className="p-4 flex-1 space-y-3 bg-[#FCFCFA]">
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Chronological Event Trace</span>
              <span className="font-mono text-[10px]">{filteredVulnEvents.length} events</span>
            </div>

            <div className="space-y-2.5">
              {filteredVulnEvents.map((ev) => {
                const isCritical = ev.level === "critical" || ev.level === "error";
                const isWarning = ev.level === "warning";
                return (
                  <div
                    key={ev.id}
                    className={`p-2.5 rounded border text-xs font-mono transition-all ${
                      isCritical
                        ? "bg-[#FFF1F2] border-[#FECDD3] text-[#9F1239]"
                        : isWarning
                        ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                        : "bg-white border-[#ECE6DA] text-[#334155]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-[#0F172A]">+{ev.timestamp_offset_ms}ms</span>
                      <span className="text-[10px] uppercase font-semibold px-1 rounded bg-black/5">
                        {ev.service_name}
                      </span>
                    </div>
                    <div className="font-sans text-xs leading-relaxed font-medium">
                      {ev.message}
                    </div>
                    {ev.latency_ms && (
                      <div className="text-[10px] text-[#64748B] mt-1">
                        Recorded latency: {ev.latency_ms}ms
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Test Evidences & Traces */}
            <div className="pt-4 mt-4 border-t border-[#ECE6DA]">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                Empirical Evidence &amp; Traces ({vuln.evidences.length})
              </div>
              <div className="space-y-2">
                {vuln.evidences.map((evi) => (
                  <div
                    key={evi.id}
                    className="border border-[#FECDD3] rounded bg-white overflow-hidden text-xs"
                  >
                    <button
                      onClick={() => toggleEvidence(evi.id)}
                      className="w-full px-3 py-2 text-left font-medium flex items-center justify-between hover:bg-[#FAF8F5]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#BE123C] text-white">
                          {evi.severity.toUpperCase()}
                        </span>
                        <span className="font-semibold text-[#0F172A]">{evi.title}</span>
                      </div>
                      {expandedEvidence[evi.id] ? (
                        <ChevronDown className="w-4 h-4 text-[#64748B]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#64748B]" />
                      )}
                    </button>
                    {expandedEvidence[evi.id] && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#ECE6DA] bg-[#FAF8F5]/50 space-y-2">
                        <p className="text-xs text-[#475569]">{evi.summary}</p>
                        {evi.raw_log_excerpt && (
                          <div className="p-2 rounded bg-[#0F172A] text-[#F8FAFC] font-mono text-[11px] overflow-x-auto">
                            <code>{evi.raw_log_excerpt}</code>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                          <span>Verified: {evi.verified ? "Yes" : "No"}</span>
                          {evi.gitlab_artifact_url && (
                            <a
                              href={evi.gitlab_artifact_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#1D4ED8] hover:underline inline-flex items-center gap-0.5"
                            >
                              GitLab Job Artifact
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: REPAIRED RELEASE */}
        {/* ========================================================================= */}
        <div className="bg-white border-2 border-[#A7F3D0] rounded-lg shadow-xs flex flex-col">
          {/* Header */}
          <div className="p-4 bg-[#ECFDF5]/60 border-b border-[#A7F3D0]">
            <div className="flex items-center justify-between mb-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#047857] text-white">
                <CheckCircle2 className="w-3 h-3" />
                REPAIRED RELEASE
              </span>
              <span className="font-mono text-xs text-[#065F46] font-medium">
                {rep.id}
              </span>
            </div>

            <h3 className="text-base font-bold text-[#0F172A]">
              {rep.name}
            </h3>
            <p className="text-xs text-[#475569] mt-1">
              {rep.description}
            </p>

            {/* Run Metrics Bar */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#A7F3D0]/60 text-xs font-mono">
              <div>
                <span className="text-[#065F46] block text-[10px]">ANOMALIES</span>
                <span className="font-bold text-[#047857]">0 violations (clean)</span>
              </div>
              <div>
                <span className="text-[#065F46] block text-[10px]">p95 LATENCY</span>
                <span className="font-bold text-[#0F172A]">{rep.p95_latency_ms} ms</span>
              </div>
              <div>
                <span className="text-[#065F46] block text-[10px]">GITLAB CI JOB</span>
                <a
                  href={`https://gitlab.com/atumanyire/aftermath/-/jobs/882041`}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-[#1D4ED8] hover:underline inline-flex items-center gap-0.5"
                >
                  {rep.gitlab_job_id}
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>
            </div>
          </div>

          {/* Timeline Events Stream */}
          <div className="p-4 flex-1 space-y-3 bg-[#FCFCFA]">
            <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Chronological Event Trace</span>
              <span className="font-mono text-[10px]">{filteredRepEvents.length} events</span>
            </div>

            <div className="space-y-2.5">
              {filteredRepEvents.map((ev) => {
                const isSuccess = ev.level === "success";
                const isWarning = ev.level === "warning";
                return (
                  <div
                    key={ev.id}
                    className={`p-2.5 rounded border text-xs font-mono transition-all ${
                      isSuccess
                        ? "bg-[#ECFDF5] border-[#A7F3D0] text-[#065F46]"
                        : isWarning
                        ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
                        : "bg-white border-[#ECE6DA] text-[#334155]"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="font-bold text-[#0F172A]">+{ev.timestamp_offset_ms}ms</span>
                      <span className="text-[10px] uppercase font-semibold px-1 rounded bg-black/5">
                        {ev.service_name}
                      </span>
                    </div>
                    <div className="font-sans text-xs leading-relaxed font-medium">
                      {ev.message}
                    </div>
                    {ev.latency_ms && (
                      <div className="text-[10px] text-[#64748B] mt-1">
                        Recorded latency: {ev.latency_ms}ms
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Test Evidences & Traces */}
            <div className="pt-4 mt-4 border-t border-[#ECE6DA]">
              <div className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-2">
                Empirical Evidence &amp; Verification ({rep.evidences.length})
              </div>
              <div className="space-y-2">
                {rep.evidences.map((evi) => (
                  <div
                    key={evi.id}
                    className="border border-[#A7F3D0] rounded bg-white overflow-hidden text-xs"
                  >
                    <button
                      onClick={() => toggleEvidence(evi.id)}
                      className="w-full px-3 py-2 text-left font-medium flex items-center justify-between hover:bg-[#FAF8F5]"
                    >
                      <div className="flex items-center gap-2">
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-[#047857] text-white">
                          VERIFIED
                        </span>
                        <span className="font-semibold text-[#0F172A]">{evi.title}</span>
                      </div>
                      {expandedEvidence[evi.id] ? (
                        <ChevronDown className="w-4 h-4 text-[#64748B]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[#64748B]" />
                      )}
                    </button>
                    {expandedEvidence[evi.id] && (
                      <div className="px-3 pb-3 pt-1 border-t border-[#ECE6DA] bg-[#FAF8F5]/50 space-y-2">
                        <p className="text-xs text-[#475569]">{evi.summary}</p>
                        {evi.raw_log_excerpt && (
                          <div className="p-2 rounded bg-[#0F172A] text-[#F8FAFC] font-mono text-[11px] overflow-x-auto">
                            <code>{evi.raw_log_excerpt}</code>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-[10px] text-[#64748B]">
                          <span>Verified: {evi.verified ? "Yes" : "No"}</span>
                          {evi.gitlab_artifact_url && (
                            <a
                              href={evi.gitlab_artifact_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-[#1D4ED8] hover:underline inline-flex items-center gap-0.5"
                            >
                              GitLab Job Artifact
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
