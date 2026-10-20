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
} from "lucide-react";
import { CausalNodeItem, CausalEdgeItem } from "@/lib/api";

// Icon mapping based on node_type
function getNodeIcon(type: string) {
  switch (type) {
    case "code_change":
      return <GitCommit className="w-4 h-4 text-[#7C3AED]" />;
    case "failure_condition":
      return <AlertTriangle className="w-4 h-4 text-[#BE123C]" />;
    case "service":
      return <Server className="w-4 h-4 text-[#1D4ED8]" />;
    case "invariant":
      return <Scale className="w-4 h-4 text-[#047857]" />;
    case "runtime_event":
      return <Zap className="w-4 h-4 text-[#B45309]" />;
    case "observed_consequence":
      return <AlertTriangle className="w-4 h-4 text-[#BE123C]" />;
    case "hypothesized_downstream_effect":
      return <HelpCircle className="w-4 h-4 text-[#9333EA]" />;
    case "remediation_candidate":
      return <ShieldCheck className="w-4 h-4 text-[#047857]" />;
    case "verification_evidence":
      return <FileCheck2 className="w-4 h-4 text-[#1D4ED8]" />;
    default:
      return <Database className="w-4 h-4 text-[#64748B]" />;
  }
}

// Custom Node Component
export function CausalNodeCard({ data }: NodeProps) {
  const node = data.node as CausalNodeItem;
  const isSelected = !!data.isSelected;
  const isPathHighlighted = !!data.isPathHighlighted;

  const isCritical = node.severity === "critical";
  const isWarning = node.severity === "warning";
  const isVerified = node.severity === "verified" || node.severity === "mitigated";

  // Border & background based on state
  let cardBg = "bg-white";
  let borderStyle = "border-[#ECE6DA]";

  if (isPathHighlighted) {
    borderStyle = "border-[#BE123C] ring-2 ring-[#BE123C]/30 shadow-md";
    cardBg = "bg-[#FFF1F2]/80";
  } else if (isSelected) {
    borderStyle = "border-[#1D4ED8] ring-2 ring-[#1D4ED8]/30 shadow-md";
  } else if (isCritical) {
    borderStyle = "border-[#FECDD3]";
    cardBg = "bg-[#FFF1F2]/40";
  } else if (isWarning) {
    borderStyle = "border-[#FDE68A]";
    cardBg = "bg-[#FFFBEB]/40";
  } else if (isVerified) {
    borderStyle = "border-[#A7F3D0]";
    cardBg = "bg-[#ECFDF5]/40";
  }

  return (
    <div
      className={`relative w-64 rounded-lg border ${borderStyle} ${cardBg} p-3.5 shadow-2xs transition-all text-left font-sans cursor-pointer hover:shadow-xs`}
    >
      <Handle type="target" position={Position.Left} className="!w-2 !h-2 !bg-[#64748B]" />

      {/* Header: Type & Severity Badge */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="flex items-center gap-1.5 text-[10px] font-mono uppercase font-bold text-[#475569]">
          {getNodeIcon(node.node_type)}
          <span>{node.node_type.replace(/_/g, " ")}</span>
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
            isCritical
              ? "bg-[#BE123C] text-white"
              : isWarning
              ? "bg-[#B45309] text-white"
              : isVerified
              ? "bg-[#047857] text-white"
              : "bg-[#0F172A] text-white"
          }`}
        >
          {node.severity}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-xs font-bold text-[#0F172A] leading-tight mb-1 line-clamp-2">
        {node.label}
      </h4>

      {/* Short Description */}
      {node.description && (
        <p className="text-[11px] text-[#475569] leading-snug line-clamp-2 mb-2">
          {node.description}
        </p>
      )}

      {/* Provenance Footer */}
      <div className="pt-2 border-t border-black/5 flex items-center justify-between text-[10px] font-mono text-[#64748B]">
        <span>Prov: {node.provenance_type.replace(/_/g, " ")}</span>
        {node.provenance_id && (
          <span className="text-[#0F172A] font-semibold truncate max-w-[90px]">
            {node.provenance_id}
          </span>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="!w-2 !h-2 !bg-[#64748B]" />
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
  // Convert API nodes to React Flow nodes with coordinates
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

  // Convert API edges to React Flow edges with epistemic styling
  const flowEdges: Edge[] = useMemo(() => {
    return edges.map((e) => {
      const isPathHighlighted = highlightedPathEdgeIds.has(e.id);
      const isExpSupported = e.classification === "EXPERIMENTALLY_SUPPORTED";
      const isObserved = e.classification === "OBSERVED";
      const isInferred = e.classification === "INFERRED";

      // Color and line styling based on classification
      let strokeColor = "#64748B";
      let strokeDasharray: string | undefined = undefined;
      let strokeWidth = 1.5;

      if (isPathHighlighted) {
        strokeColor = "#BE123C";
        strokeWidth = 3;
      } else if (isExpSupported) {
        strokeColor = "#1D4ED8";
        strokeWidth = 2;
      } else if (isObserved) {
        strokeColor = "#0F172A";
        strokeWidth = 2;
      } else if (isInferred) {
        strokeColor = "#D97706";
        strokeDasharray = "5 5";
      } else {
        strokeColor = "#94A3B8";
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
          fill: isPathHighlighted ? "#BE123C" : "#64748B",
          fontSize: 9,
          fontWeight: 600,
          fontFamily: "monospace",
        },
        labelBgStyle: {
          fill: "#FAF8F5",
          fillOpacity: 0.9,
          stroke: "#ECE6DA",
          strokeWidth: 0.5,
        },
      };
    });
  }, [edges, highlightedPathEdgeIds]);

  return (
    <div className="w-full h-[580px] bg-[#FAF8F5] rounded-lg border border-[#ECE6DA] relative overflow-hidden">
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => {
          const item = nodes.find((n) => n.id === node.id);
          if (item) onSelectNode(item);
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={1.5}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#CBD5E1" />
        <Controls className="!bg-white !border-[#ECE6DA] !shadow-2xs text-[#0F172A]" />
        <MiniMap
          nodeColor={(n) => {
            const item = nodes.find((item) => item.id === n.id);
            if (!item) return "#94A3B8";
            if (item.severity === "critical") return "#BE123C";
            if (item.severity === "warning") return "#B45309";
            if (item.severity === "verified") return "#047857";
            return "#1D4ED8";
          }}
          className="!bg-white !border-[#ECE6DA] !rounded-lg !shadow-2xs"
          maskColor="rgba(250, 248, 245, 0.7)"
        />
      </ReactFlow>

      {/* Epistemic Legend Floating in Top-Right */}
      <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-xs border border-[#ECE6DA] rounded-lg p-2.5 shadow-2xs text-[11px] font-mono space-y-1 z-10 pointer-events-none">
        <div className="font-bold text-[#0F172A] text-[10px] uppercase mb-1">
          Epistemic Edge Classification
        </div>
        <div className="flex items-center gap-2 text-[#1D4ED8]">
          <span className="w-3.5 h-0.5 bg-[#1D4ED8]"></span>
          <span>EXPERIMENTALLY_SUPPORTED</span>
        </div>
        <div className="flex items-center gap-2 text-[#0F172A]">
          <span className="w-3.5 h-0.5 bg-[#0F172A]"></span>
          <span>OBSERVED (Telemetry/Logs)</span>
        </div>
        <div className="flex items-center gap-2 text-[#D97706]">
          <span className="w-3.5 h-0.5 border-t border-dashed border-[#D97706]"></span>
          <span>INFERRED (Architecture Path)</span>
        </div>
        <div className="flex items-center gap-2 text-[#BE123C] font-bold">
          <span className="w-3.5 h-0.5 bg-[#BE123C]"></span>
          <span>ACTIVE CAUSAL PATH</span>
        </div>
      </div>
    </div>
  );
}
