"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  Background,
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
  Maximize2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { CausalNodeItem, CausalEdgeItem } from "@/lib/api";

function getNodeIcon(type: string) {
  switch (type) {
    case "code_change":
      return <GitCommit className="w-3.5 h-3.5 text-[#191C24]" />;
    case "failure_condition":
      return <AlertTriangle className="w-3.5 h-3.5 text-[#FF6A13]" />;
    case "service":
      return <Server className="w-3.5 h-3.5 text-[#191C24]" />;
    case "invariant":
      return <Scale className="w-3.5 h-3.5 text-[#191C24]" />;
    case "runtime_event":
      return <Zap className="w-3.5 h-3.5 text-[#FF6A13]" />;
    case "observed_consequence":
      return <ShieldAlert className="w-3.5 h-3.5 text-[#FF6A13]" />;
    case "hypothesized_downstream_effect":
      return <HelpCircle className="w-3.5 h-3.5 text-[#747B87]" />;
    case "remediation_candidate":
      return <ShieldCheck className="w-3.5 h-3.5 text-[#191C24]" />;
    case "verification_evidence":
      return <FileCheck2 className="w-3.5 h-3.5 text-[#191C24]" />;
    default:
      return <Database className="w-3.5 h-3.5 text-[#747B87]" />;
  }
}

export function CausalNodeCard({ data }: NodeProps) {
  const node = data.node as CausalNodeItem;
  const isSelected = !!data.isSelected;
  const isPathHighlighted = !!data.isPathHighlighted;

  const isCritical = node.severity === "critical";
  const isWarning = node.severity === "warning";
  const isVerified = node.severity === "verified" || node.severity === "mitigated";

  let borderStyle = "border-[#ECEEF1]";
  let cardBg = "bg-white";

  if (isPathHighlighted) {
    borderStyle = "border-[#20242D] ring-2 ring-[#20242D]/25";
    cardBg = "bg-[#F4F5F7]/40";
  } else if (isSelected) {
    borderStyle = "border-[#191C24] ring-2 ring-[#191C24]/20";
  } else if (isCritical) {
    borderStyle = "border-[#ECEEF1]";
    cardBg = "bg-[#F4F5F7]/25";
  } else if (isWarning) {
    borderStyle = "border-[#ECEEF1]";
    cardBg = "bg-[#F4F5F7]/25";
  } else if (isVerified) {
    borderStyle = "border-[#ECEEF1]";
    cardBg = "bg-[#F4F5F7]/25";
  }

  const badgeColor = isCritical
    ? "bg-[#F4F5F7] text-[#FF6A13] border-[#ECEEF1]"
    : isWarning
    ? "bg-[#F4F5F7] text-[#FF6A13] border-[#ECEEF1]"
    : isVerified
    ? "bg-[#F4F5F7] text-[#191C24] border-[#ECEEF1]"
    : "bg-[#F4F5F7] text-[#747B87] border-[#ECEEF1]";

  return (
    <div
      className={`relative w-60 rounded-[13px] border ${borderStyle} ${cardBg} p-4 transition-all text-left font-sans cursor-pointer`}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !bg-[#747B87] !border-white"
      />

      {/* Header: Node Type & Severity Badge */}
      <div className="flex items-center justify-between gap-1 mb-2">
        <span className="flex items-center gap-1.5 text-[11px] text-[#747B87]">
          {getNodeIcon(node.node_type)}
          <span>{node.node_type.replace(/_/g, " ")}</span>
        </span>
        <span
          className={`px-2 py-0.5 rounded-full text-[10px]  border ${badgeColor}`}
        >
          {node.severity}
        </span>
      </div>

      {/* Title */}
      <h4 className="text-[13px] text-[#191C24] leading-snug mb-1 line-clamp-2">
        {node.label}
      </h4>

      {/* Description */}
      {node.description && (
        <p className="text-[12px] text-[#747B87] leading-snug line-clamp-2 mb-2.5">
          {node.description}
        </p>
      )}

      {/* Provenance Footer */}
      <div className="pt-2 border-t border-[#ECEEF1]/70 flex items-center justify-between text-[10px] font-mono text-[#747B87]">
        <span>Prov: {node.provenance_type.replace(/_/g, " ")}</span>
        {node.provenance_id && (
          <span className="text-[#191C24]  truncate max-w-[100px]">
            {node.provenance_id}
          </span>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !bg-[#747B87] !border-white"
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

const X_SCALE = 1.5;
const Y_SCALE = 1.7;
const NODE_W = 240;
const NODE_H = 140;
const DEFAULT_ZOOM = 0.85;

function GraphCanvas({
  nodes,
  edges,
  selectedNodeId,
  highlightedPathNodeIds,
  highlightedPathEdgeIds,
  onSelectNode,
}: CausalFlowGraphProps) {
  const rf = useReactFlow();
  const ready = useRef(false);

  const flowNodes: Node[] = useMemo(() => {
    return nodes.map((n, idx) => {
      const meta = n.metadata_json || {};
      const x = typeof meta.x === "number" ? meta.x : (idx % 3) * 320 + 50;
      const y = typeof meta.y === "number" ? meta.y : Math.floor(idx / 3) * 180 + 50;
      return {
        id: n.id,
        type: "causalNode",
        position: { x: x * X_SCALE, y: y * Y_SCALE },
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
      let stroke = "#9AA0AA";
      let dash: string | undefined;
      let width = 1.5;
      if (isPathHighlighted) {
        stroke = "#FF6A13";
        width = 2.5;
      } else if (e.classification === "EXPERIMENTALLY_SUPPORTED" || e.classification === "OBSERVED") {
        stroke = "#191C24";
      } else if (e.classification === "INFERRED") {
        stroke = "#FF6A13";
        dash = "5 5";
      } else {
        stroke = "#C9CDD4";
        dash = "2 3";
      }
      return {
        id: e.id,
        source: e.source_node_id,
        target: e.target_node_id,
        type: "smoothstep",
        animated: isPathHighlighted,
        style: {
          stroke,
          strokeWidth: width,
          strokeDasharray: dash,
          opacity: highlightedPathEdgeIds.size > 0 && !isPathHighlighted ? 0.25 : 1,
        },
        markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: stroke },
        label: e.relation_type.replace(/_/g, " "),
        labelStyle: { fill: "#747B87", fontSize: 10 },
        labelBgPadding: [4, 2] as [number, number],
        labelBgStyle: { fill: "#F8F9FB", fillOpacity: 1 },
      };
    });
  }, [edges, highlightedPathEdgeIds]);

  const resetView = useCallback(() => {
    rf.setViewport({ x: 24, y: 72, zoom: DEFAULT_ZOOM }, { duration: 250 });
  }, [rf]);

  const fitGraph = useCallback(() => {
    rf.fitView({ padding: 0.08, minZoom: 0.3, duration: 300 });
  }, [rf]);

  // Initial viewport once nodes are measured: readable zoom, anchored at the chain start.
  const onInit = useCallback(() => {
    if (ready.current) return;
    ready.current = true;
    requestAnimationFrame(() => rf.setViewport({ x: 24, y: 72, zoom: DEFAULT_ZOOM }));
  }, [rf]);

  // Keep the selected node in view at a readable zoom.
  useEffect(() => {
    if (!selectedNodeId || !ready.current) return;
    const n = rf.getNode(selectedNodeId);
    if (!n) return;
    rf.setCenter(n.position.x + NODE_W / 2, n.position.y + NODE_H / 2, {
      zoom: Math.max(rf.getZoom(), DEFAULT_ZOOM),
      duration: 300,
    });
  }, [selectedNodeId, rf]);

  // Frame a traced causal path, without shrinking below a readable zoom.
  useEffect(() => {
    if (highlightedPathNodeIds.size === 0 || !ready.current) return;
    rf.fitView({
      nodes: Array.from(highlightedPathNodeIds).map((id) => ({ id })),
      padding: 0.12,
      minZoom: 0.65,
      maxZoom: 1,
      duration: 400,
    });
  }, [highlightedPathNodeIds, rf]);

  const toolBtn =
    "h-8 px-2.5 inline-flex items-center gap-1.5 typo-button text-[#191C24] bg-white border border-[#ECEEF1] rounded-[10px] hover:bg-[#F9FAFB]";

  return (
    <div className="relative h-full w-full">
      <div className="absolute top-3 left-3 z-10 hidden lg:flex flex-wrap items-center gap-x-4 gap-y-1 bg-white border border-[#ECEEF1] px-3 py-1.5 rounded-[10px] text-[11px] text-[#747B87]">
        <span className="flex items-center gap-1.5"><span className="w-3 border-t-2 border-[#191C24]" />Observed / tested</span>
        <span className="flex items-center gap-1.5"><span className="w-3 border-t-2 border-dashed border-[#FF6A13]" />Inferred</span>
        <span className="flex items-center gap-1.5"><span className="w-3 border-t-2 border-[#FF6A13]" />Traced path</span>
      </div>
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5">
        <button type="button" className={toolBtn} onClick={() => rf.zoomOut({ duration: 150 })} aria-label="Zoom out"><ZoomOut className="w-3.5 h-3.5" /></button>
        <button type="button" className={toolBtn} onClick={() => rf.zoomIn({ duration: 150 })} aria-label="Zoom in"><ZoomIn className="w-3.5 h-3.5" /></button>
        <button type="button" className={toolBtn} onClick={fitGraph} aria-label="Fit graph" title="Fit graph"><Maximize2 className="w-3.5 h-3.5" /><span className="hidden sm:inline">Fit graph</span></button>
        <button type="button" className={toolBtn} onClick={resetView} aria-label="Reset view" title="Reset view"><RotateCcw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Reset view</span></button>
      </div>
      <ReactFlow
        nodes={flowNodes}
        edges={flowEdges}
        nodeTypes={nodeTypes}
        onNodeClick={(_, node) => onSelectNode(node.data.node as CausalNodeItem)}
        onInit={onInit}
        defaultViewport={{ x: 24, y: 72, zoom: DEFAULT_ZOOM }}
        minZoom={0.3}
        maxZoom={1.5}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={16} size={1} color="#E4E6EA" />
      </ReactFlow>
    </div>
  );
}

export function CausalFlowGraph(props: CausalFlowGraphProps) {
  return (
    <div className="w-full h-[560px] min-h-[420px] bg-[#F8F9FB] rounded-[13px] border border-[#ECEEF1] overflow-hidden">
      <ReactFlowProvider>
        <GraphCanvas {...props} />
      </ReactFlowProvider>
    </div>
  );
}
