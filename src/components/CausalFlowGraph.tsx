"use client";

import React, { useMemo } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  MiniMap,
  Handle,
  Position,
  NodeProps,
  Node,
  Edge,
  MarkerType,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  GitCommit,
  AlertTriangle,
  Server,
  Scale,
  Zap,
  ShieldCheck,
  FileCheck2,
  HelpCircle,
  Database,
  ArrowRight,
  ShieldAlert,
} from "lucide-react";
import { CausalNodeItem, CausalEdgeItem } from "@/lib/api";

function getNodeIcon(type: string) {
  switch (type) {
    case "code_change":
      return <GitCommit className="w-3.5 h-3.5 text-[#3558D4]" />;
    case "failure_condition":
      return <AlertTriangle className="w-3.5 h-3.5 text-[#C74747]" />;
    case "service":
      return <Server className="w-3.5 h-3.5 text-[#3558D4]" />;
    case "invariant":
      return <Scale className="w-3.5 h-3.5 text-[#168568]" />;
    case "runtime_event":
      return <Zap className="w-3.5 h-3.5 text-[#D78A43]" />;
    case "observed_consequence":
      return <ShieldAlert className="w-3.5 h-3.5 text-[#C74747]" />;
    case "hypothesized_downstream_effect":
      return <HelpCircle className="w-3.5 h-3.5 text-[#6B7280]" />;
    case "remediation_candidate":
      return <ShieldCheck className="w-3.5 h-3.5 text-[#168568]" />;
    case "verification_evidence":
      return <FileCheck2 className="w-3.5 h-3.5 text-[#3558D4]" />;
    default:
      return <Database className="w-3.5 h-3.5 text-[#6B7280]" />;
  }
}

export function CausalNodeCard({ data }: NodeProps) {
  const node = data.node as CausalNodeItem;
  const isSelected = !!data.isSelected;
  const isPathHighlighted = !!data.isPathHighlighted;

  const isCritical = node.severity === "critical";
  const isWarning = node.severity === "warning";
  const isVerified = node.severity === "verified" || node.severity === "mitigated";

  let borderStyle = "border-[#E5E7EB]";
  let cardBg = "bg-white";

  if (isPathHighlighted) {
    borderStyle = "border-[#3558D4] ring-2 ring-[#3558D4]/25 shadow-md";
    cardBg = "bg-[#EFF4FE]/40";
  } else if (isSelected) {
    borderStyle = "border-[#111827] ring-2 ring-[#111827]/20 shadow-md";
  } else if (isCritical) {
    borderStyle = "border-rose-200";
    cardBg = "bg-rose-50/25";
  } else if (isWarning) {
    borderStyle = "border-amber-200";
    cardBg = "bg-amber-50/25";
  } else if (isVerified) {
    borderStyle = "border-emerald-200";
    cardBg = "bg-emerald-50/25";
  }

  const badgeColor = isCritical
    ? "bg-rose-50 text-[#C74747] border-rose-200"
    : isWarning
    ? "bg-amber-50 text-[#D78A43] border-amber-200"
    : isVerified
    ? "bg-emerald-50 text-[#168568] border-emerald-200"
    : "bg-slate-100 text-[#6B7280] border-slate-200";

  return (
    <div
      className={`relative w-64 rounded-xl border ${borderStyle} ${cardBg} p-4 shadow-card hover:shadow-card-hover transition-all text-left font-sans cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[#6B7280] !border-white"
      />

      {/* Header: Node Type & Severity Badge */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#6B7280]">
          {getNodeIcon(node.node_type)}
          <span>{node.node_type.replace(/_/g, " ")}</span>
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase border ${badgeColor}`}
        >
          {node.severity}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-[#111827] leading-tight mb-1 line-clamp-2">
        {node.label}
      </h4>

      {/* Description */}
      {node.description && (
        <p className="text-[11px] text-[#6B7280] leading-snug line-clamp-2 mb-2.5">
          {node.description}
        </p>
      )}

      {/* Provenance Footer */}
      <div className="pt-2 border-t border-[#E5E7EB]/70 flex items-center justify-between text-[10px] font-mono text-[#6B7280]">
        <span>Prov: {node.provenance_type.replace(/_/g, " ")}</span>
        {node.provenance_id && (
          <span className="text-[#111827] font-semibold truncate max-w-[100px]">
            {node.provenance_id}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[#6B7280] !border-white"
      />
    </div>
  );
}

const nodeTypes = {
  causalNode: CausalNodeCard,
};

interface CausalFlowGraphProps {
  nodes: CausalNodeItem[];
  edges: CausalEdgeItem[];
  selectedNodeId: string | null;
  highlightedPathNodeIds: Set<string>;
  highlightedPathEdgeIds: Set<string>;
  onSelectNode: (node: CausalNodeItem) => void;
}

export function CausalFlowGraph({
  nodes,
  edges,
  selectedNodeId,
  highlightedPathNodeIds,
  highlightedPathEdgeIds,
  onSelectNode,
}: CausalFlowGraphProps) {
  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((n, idx) => {
      const meta = n.metadata_json || {};
      const x = typeof meta.x === "number" ? meta.x : (idx % 3) * 320 + 50;
      const y = typeof meta.y === "number" ? meta.y : Math.floor(idx / 3) * 180 + 50;

      return {
        id: n.id,
        type: "causalNode",
        position: { x, y },
        data: {
          node: n,
          isSelected: selectedNodeId === n.id,
          isPathHighlighted: highlightedPathNodeIds.has(n.id),
        },
      };
    });
  }, [nodes, selectedNodeId, highlightedPathNodeIds]);

  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((e) => {
      const isPathHighlighted = highlightedPathEdgeIds.has(e.id);
      const isExpSupported = e.classification === "EXPERIMENTALLY_SUPPORTED";
      const isObserved = e.classification === "OBSERVED";
      const isInferred = e.classification === "INFERRED";

      let strokeColor = "#6B7280";
      let strokeDasharray: string | undefined = undefined;
      let strokeWidth = 1.5;

      if (isPathHighlighted) {
        strokeColor = "#3558D4";
        strokeWidth = 3;
      } else if (isExpSupported) {
        strokeColor = "#168568";
        strokeWidth = 2;
      } else if (isObserved) {
        strokeColor = "#111827";
        strokeWidth = 2;
      } else if (isInferred) {
        strokeColor = "#D78A43";
        strokeDasharray = "5 5";
      } else {
        strokeColor = "#E5E7EB";
        strokeDasharray = "2 3";
      }

      return {
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        type: "bezier",
        animated: isExpSupported || isPathHighlighted,
        style: {
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray,
          opacity: highlightedPathEdgeIds.size > 0 && !isPathHighlighted ? 0.25 : 1.0,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 14,
          height: 14,
          color: strokeColor,
        },
        label: e.relation_type,
        labelStyle: {
          fill: isPathHighlighted ? "#3558D4" : "#6B7280",
          fontSize: 9,
          fontWeight: 600,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#FFFFFF",
          fillOpacity: 0.95,
          stroke: "#E5E7EB",
          strokeWidth: 0.5,
        },
      };
    });
  }, [edges, highlightedPathEdgeIds]);

  return (
    <div className="w-full h-[600px] bg-[#FAF9F6] rounded-2xl border border-[#E5E7EB] relative overflow-hidden shadow-card">
      {/* Canvas Epistemic Legend Bar */}
      <div className="absolute top-4 left-4 z-10 bg-white/95 backdrop-blur-sm border border-[#E5E7EB] px-3.5 py-2 rounded-xl shadow-card flex items-center gap-4 text-[11px] font-medium text-[#6B7280]">
        <span className="font-semibold text-[#111827]">Causal Classification:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#111827]" /> Observed
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#168568]" /> Experimentally Supported
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dashed border-[#D78A43]" /> Inferred
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 border-t border-dotted border-[#E5E7EB]" /> Unknown
        </span>
      </div>

      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelectNode(node.data.node as CausalNodeItem)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E5E7EB" />
        <Controls className="!bg-white !border-[#E5E7EB] !rounded-xl !shadow-card" />
        <MiniMap
          nodeColor={(n) => {
            const dataNode = n.data?.node as CausalNodeItem | undefined;
            if (dataNode?.severity === "critical") return "#C74747";
            if (dataNode?.severity === "warning") return "#D78A43";
            if (dataNode?.severity === "verified") return "#168568";
            return "#3558D4";
          }}
          className="!bg-white !border-[#E5E7EB] !rounded-xl !shadow-card !bottom-4 !right-4"
        />
      </ReactFlow>
    </div>
  );
}
