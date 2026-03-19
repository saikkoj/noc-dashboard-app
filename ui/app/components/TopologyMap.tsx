/**
 * TopologyMap — interactive SVG topology with pan/zoom.
 * Renders nodes as role-based shapes, edges colour-coded by type.
 */
import React, { useRef, useState, useCallback, useMemo } from 'react';
import type { TopologyNode, TopologyEdge, DeviceRole, TopologyEdgeType } from '../types/network';
import { TOPOLOGY_LAYERS, getLayerForRole } from '../types/network';
import { HEALTH_COLORS, percentBarColor } from '../utils';

/* ── constants ─────────────────────────────────── */
const NODE_R = 22;
const LABEL_Y_OFFSET = 36;
const TOOLTIP_W = 220;
const TOOLTIP_H = 100;

const EDGE_COLOR: Record<TopologyEdgeType, string> = {
  lldp: '#4dd0e1',
  bgp: '#b280ff',
  flow: '#ffd54f',
  'runs-on': '#6b7280',
  calls: '#ff9800',
  serves: '#ff6e40',
  manual: '#6b7280',
};

/* ── Node shape by role ────────────────────────── */
function NodeShape({ node, selected, onClick }: {
  node: TopologyNode;
  selected: boolean;
  onClick: (n: TopologyNode) => void;
}) {
  const fill = HEALTH_COLORS[node.health] ?? HEALTH_COLORS.unknown;
  const stroke = selected ? '#fff' : 'rgba(255,255,255,0.15)';
  const sw = selected ? 3 : 1.5;
  const handle = useCallback(() => onClick(node), [node, onClick]);
  const role = node.role;

  const common = { onClick: handle, style: { cursor: 'pointer' } };

  if (role === 'firewall') {
    // diamond
    const d = NODE_R;
    return (
      <polygon
        points={`${node.x},${node.y - d} ${node.x + d},${node.y} ${node.x},${node.y + d} ${node.x - d},${node.y}`}
        fill={fill} stroke={stroke} strokeWidth={sw} {...common}
      />
    );
  }
  if (role === 'switch') {
    // rounded rect
    const s = NODE_R * 0.85;
    return (
      <rect
        x={node.x - s} y={node.y - s} width={s * 2} height={s * 2} rx={6}
        fill={fill} stroke={stroke} strokeWidth={sw} {...common}
      />
    );
  }
  if (role === 'cloud' || role === 'cloud-gw') {
    // slightly larger circle with dashed border
    return (
      <circle
        cx={node.x} cy={node.y} r={NODE_R + 4}
        fill={fill} stroke={stroke} strokeWidth={sw} strokeDasharray="5 3" {...common}
      />
    );
  }
  if (role === 'server' || role === 'host') {
    // tall rect (rack icon approximation)
    return (
      <rect
        x={node.x - 14} y={node.y - NODE_R} width={28} height={NODE_R * 2} rx={4}
        fill={fill} stroke={stroke} strokeWidth={sw} {...common}
      />
    );
  }
  if (role === 'process-group') {
    // pentagon
    const pts = Array.from({ length: 5 }, (_, i) => {
      const a = (Math.PI * 2 / 5) * i - Math.PI / 2;
      return `${node.x + NODE_R * Math.cos(a)},${node.y + NODE_R * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} {...common} />;
  }
  if (role === 'service') {
    // hexagon
    const pts = Array.from({ length: 6 }, (_, i) => {
      const a = (Math.PI / 3) * i - Math.PI / 6;
      return `${node.x + NODE_R * Math.cos(a)},${node.y + NODE_R * Math.sin(a)}`;
    }).join(' ');
    return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} {...common} />;
  }
  if (role === 'application') {
    // triangle (pointing up)
    const pts = `${node.x},${node.y - NODE_R} ${node.x + NODE_R * 0.87},${node.y + NODE_R * 0.5} ${node.x - NODE_R * 0.87},${node.y + NODE_R * 0.5}`;
    return <polygon points={pts} fill={fill} stroke={stroke} strokeWidth={sw} {...common} />;
  }
  // default: circle (router / unknown)
  return (
    <circle
      cx={node.x} cy={node.y} r={NODE_R}
      fill={fill} stroke={stroke} strokeWidth={sw} {...common}
    />
  );
}

function roleIcon(role: DeviceRole): string {
  switch (role) {
    case 'router': return 'R';
    case 'switch': return 'S';
    case 'firewall': return 'F';
    case 'server': return 'H';
    case 'host': return 'H';
    case 'cloud': return '☁';
    case 'cloud-gw': return 'G';
    case 'process-group': return 'P';
    case 'service': return 'Sv';
    case 'application': return 'A';
    default: return '?';
  }
}

/* ── Edge line ──────────────────────────────────── */
const DIRECTED_TYPES = new Set<TopologyEdgeType>(['calls', 'serves', 'runs-on']);

function EdgeLine({ edge, nodeMap }: { edge: TopologyEdge; nodeMap: Map<string, TopologyNode> }) {
  const src = nodeMap.get(edge.source);
  const tgt = nodeMap.get(edge.target);
  if (!src || !tgt) return null;

  const color = edge.edgeType ? EDGE_COLOR[edge.edgeType] : '#6b7280';
  const opacity = 0.5 + Math.min(edge.utilization / 100, 1) * 0.5;
  const width = 1.2 + (edge.utilization / 100) * 2;
  const directed = edge.directed || (edge.edgeType && DIRECTED_TYPES.has(edge.edgeType));
  const markerId = directed ? `arrow-${edge.edgeType ?? 'default'}` : undefined;

  // Shorten the line so the arrowhead is visible outside the target node
  let x1 = src.x, y1 = src.y, x2 = tgt.x, y2 = tgt.y;
  if (directed) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      // Pull back from target by NODE_R + a few px for the arrow
      const shrink = (NODE_R + 6) / len;
      x2 = x2 - dx * shrink;
      y2 = y2 - dy * shrink;
    }
  }

  return (
    <line
      x1={x1} y1={y1} x2={x2} y2={y2}
      stroke={color} strokeWidth={width} strokeOpacity={opacity}
      strokeLinecap="round"
      markerEnd={markerId ? `url(#${markerId})` : undefined}
    />
  );
}

/* ── Tooltip overlay ───────────────────────────── */
function Tooltip({ node, svgRect }: { node: TopologyNode; svgRect: DOMRect | null }) {
  if (!svgRect) return null;
  // position tooltip to the right of the node, clamp within SVG bounds
  let tx = node.x + NODE_R + 10;
  let ty = node.y - TOOLTIP_H / 2;
  if (tx + TOOLTIP_W > svgRect.width) tx = node.x - TOOLTIP_W - NODE_R - 10;
  if (ty < 0) ty = 4;
  if (ty + TOOLTIP_H > svgRect.height) ty = svgRect.height - TOOLTIP_H - 4;

  return (
    <foreignObject x={tx} y={ty} width={TOOLTIP_W} height={TOOLTIP_H}>
      <div style={{
        background: 'var(--dt-colors-background-surface-default, rgba(30,30,36,0.96))',
        border: '1px solid var(--dt-colors-border-neutral-default, rgba(59,130,246,0.3))',
        borderRadius: 8, padding: '8px 12px',
        color: 'var(--dt-colors-text-neutral-default, #e0e0e0)', fontSize: 12, lineHeight: 1.5,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, color: '#fff' }}>{node.label}</div>
        {node.ip && <div>IP: {node.ip}</div>}
        {node.type && <div>Type: {node.type}</div>}
        {node.cpu != null && <div>CPU: <span style={{ color: percentBarColor(node.cpu) }}>{node.cpu.toFixed(0)}%</span></div>}
        {node.memory != null && <div>Memory: <span style={{ color: percentBarColor(node.memory) }}>{node.memory.toFixed(0)}%</span></div>}
        {node.location && <div>Location: {node.location}</div>}
      </div>
    </foreignObject>
  );
}

/* ── Main component ────────────────────────────── */

export interface TopologyMapProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  selectedNodeId?: string | null;
  onSelectNode?: (node: TopologyNode | null) => void;
  width?: number;
  height?: number;
  visibleEdgeTypes?: Set<TopologyEdgeType>;
  /** Set of TOPOLOGY_LAYERS ids that are visible */
  visibleLayers?: Set<string>;
  /** Current layout mode — layer bands only appear in 'layered' */
  layoutMode?: string;
}

export function TopologyMap({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  width = 960,
  height = 540,
  visibleEdgeTypes,
  visibleLayers,
  layoutMode,
}: TopologyMapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredNode, setHoveredNode] = useState<TopologyNode | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const nodeMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

  /* ── Layer filtering ─── */
  const visibleNodeIds = useMemo(() => {
    if (!visibleLayers) return null; // all visible
    const ids = new Set<string>();
    for (const n of nodes) {
      const layer = TOPOLOGY_LAYERS[getLayerForRole(n.role)];
      if (layer && visibleLayers.has(layer.id)) ids.add(n.id);
    }
    return ids;
  }, [nodes, visibleLayers]);

  const displayNodes = useMemo(
    () => visibleNodeIds ? nodes.filter(n => visibleNodeIds.has(n.id)) : nodes,
    [nodes, visibleNodeIds],
  );

  const filteredEdges = useMemo(() => {
    let result = edges;
    if (visibleEdgeTypes) result = result.filter(e => !e.edgeType || visibleEdgeTypes.has(e.edgeType));
    if (visibleNodeIds) result = result.filter(e => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target));
    return result;
  }, [edges, visibleEdgeTypes, visibleNodeIds]);

  const handleNodeClick = useCallback((node: TopologyNode) => {
    onSelectNode?.(selectedNodeId === node.id ? null : node);
  }, [onSelectNode, selectedNodeId]);

  /* ── Pan/zoom handlers ─── */
  const onWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.93;
    setZoom(z => Math.max(0.2, Math.min(5, z * factor)));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  }, [pan]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  }, [dragging, dragStart]);

  const onMouseUp = useCallback(() => setDragging(false), []);
  const onMouseLeave = useCallback(() => { setDragging(false); setHoveredNode(null); }, []);

  const resetView = useCallback(() => { setPan({ x: 0, y: 0 }); setZoom(1); }, []);

  /* Double-click a node → centre & zoom in */
  const handleNodeDoubleClick = useCallback((node: TopologyNode) => {
    const targetZoom = 2.2;
    setPan({ x: width / 2 - node.x * targetZoom, y: height / 2 - node.y * targetZoom });
    setZoom(targetZoom);
    onSelectNode?.(node);
  }, [width, height, onSelectNode]);

  const svgRect = svgRef.current?.getBoundingClientRect() ?? null;

  // Determine connected nodes for the selected node
  const connectedIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const ids = new Set<string>();
    for (const e of edges) {
      if (e.source === selectedNodeId) ids.add(e.target);
      if (e.target === selectedNodeId) ids.add(e.source);
    }
    return ids;
  }, [selectedNodeId, edges]);

  // Orphan nodes (no edges)
  const orphanNodes = useMemo(() => {
    const withEdge = new Set<string>();
    for (const e of edges) { withEdge.add(e.source); withEdge.add(e.target); }
    return nodes.filter(n => !withEdge.has(n.id));
  }, [nodes, edges]);

  return (
    <div style={{ position: 'relative', width, height, overflow: 'hidden', borderRadius: 8, background: 'var(--dt-colors-background-base-default, #131317)' }}>
      {/* Legend strip */}
      <div style={{ position: 'absolute', top: 8, left: 8, display: 'flex', gap: 12, zIndex: 2, fontSize: 11, color: 'var(--dt-colors-text-neutral-subdued, #999)' }}>
        {(['lldp', 'bgp', 'flow'] as TopologyEdgeType[]).map(t => (
          <span key={t} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 14, height: 3, borderRadius: 2, backgroundColor: EDGE_COLOR[t] }} />
            {t.toUpperCase()}
          </span>
        ))}
      </div>

      {/* Zoom controls */}
      <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4, zIndex: 2 }}>
        <button onClick={() => setZoom(z => Math.min(5, z * 1.2))} style={zoomBtnStyle}>+</button>
        <button onClick={() => setZoom(z => Math.max(0.2, z / 1.2))} style={zoomBtnStyle}>−</button>
        <button onClick={resetView} style={zoomBtnStyle}>⟲</button>
      </div>

      <svg
        ref={svgRef}
        width={width}
        height={height}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseLeave}
        style={{ cursor: dragging ? 'grabbing' : 'grab' }}
      >
        {/* Arrow marker defs for directed edges */}
        <defs>
          {Object.entries(EDGE_COLOR).map(([type, color]) => (
            <marker
              key={type}
              id={`arrow-${type}`}
              viewBox="0 0 10 10"
              refX={10} refY={5}
              markerWidth={10} markerHeight={10}
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill={color} opacity={0.85} />
            </marker>
          ))}
        </defs>
        <g transform={`translate(${pan.x},${pan.y}) scale(${zoom})`}>
          {/* Layer bands — only in layered mode; Y matches roleLayeredLayout graph coords,
              X spans the visible viewport so bands always stretch edge-to-edge */}
          {layoutMode === 'layered' && (() => {
            const BAND_PAD = 60; // must match PAD in layoutEngine
            const numLayers = TOPOLOGY_LAYERS.length;
            const bandH = (height - 2 * BAND_PAD) / numLayers;
            // Viewport X span in graph coordinates
            const vx = -pan.x / zoom;
            const vw = width / zoom;
            // Render reversed: apps (index 7) at visual row 0 (top)
            return [...TOPOLOGY_LAYERS].reverse().map((layer, vi) => {
              if (visibleLayers && !visibleLayers.has(layer.id)) return null;
              const y = BAND_PAD + vi * bandH;
              return (
                <g key={layer.id}>
                  <rect x={vx} y={y} width={vw} height={bandH}
                    fill={layer.color} fillOpacity={0.08} />
                  <line x1={vx} y1={y} x2={vx + vw} y2={y}
                    stroke={layer.color} strokeOpacity={0.25} strokeDasharray="6 3" />
                  <text x={vx + 6 / zoom} y={y + 14} fill={layer.color}
                    fontSize={9 / zoom} opacity={0.7} fontWeight={600}>
                    {layer.label}
                  </text>
                  <text x={vx + 6 / zoom} y={y + 24} fill={layer.color}
                    fontSize={7 / zoom} opacity={0.45}>
                    {layer.osiRef}
                  </text>
                </g>
              );
            });
          })()}

          {/* Edges */}
          {filteredEdges.map((e, i) => (
            <EdgeLine key={`e-${i}`} edge={e} nodeMap={nodeMap} />
          ))}

          {/* Nodes */}
          {displayNodes.map(n => {
            const dimmed = selectedNodeId && selectedNodeId !== n.id && !connectedIds.has(n.id);
            return (
              <g
                key={n.id}
                opacity={dimmed ? 0.25 : 1}
                onMouseEnter={() => setHoveredNode(n)}
                onMouseLeave={() => setHoveredNode(null)}
                onDoubleClick={() => handleNodeDoubleClick(n)}
              >
                <NodeShape node={n} selected={selectedNodeId === n.id} onClick={handleNodeClick} />
                <text
                  x={n.x} y={n.y + 4}
                  textAnchor="middle" dominantBaseline="middle"
                  fill="#fff" fontSize={11} fontWeight={700}
                  pointerEvents="none"
                >
                  {roleIcon(n.role)}
                </text>
                <text
                  x={n.x} y={n.y + LABEL_Y_OFFSET}
                  textAnchor="middle" fill="#b0b0b0" fontSize={10}
                  pointerEvents="none"
                >
                  {n.label.length > 18 ? n.label.slice(0, 16) + '…' : n.label}
                </text>
              </g>
            );
          })}
        </g>

        {/* Tooltip (outside transform so it doesn't scale) */}
        {hoveredNode && <Tooltip node={hoveredNode} svgRect={svgRect} />}
      </svg>

      {/* Orphan strip */}
      {orphanNodes.length > 0 && (
        <div style={{
          position: 'absolute', bottom: 4, left: 8, right: 8,
          display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: 10, color: '#888',
        }}>
          <span style={{ opacity: 0.6 }}>Disconnected:</span>
          {orphanNodes.slice(0, 12).map(n => (
            <span key={n.id} style={{
              padding: '1px 6px', borderRadius: 4,
              background: 'rgba(255,255,255,0.06)', color: HEALTH_COLORS[n.health],
            }}>
              {n.label}
            </span>
          ))}
          {orphanNodes.length > 12 && <span>+{orphanNodes.length - 12}</span>}
        </div>
      )}
    </div>
  );
}

const zoomBtnStyle: React.CSSProperties = {
  width: 28, height: 28, borderRadius: 6,
  border: '1px solid var(--dt-colors-border-neutral-default, rgba(255,255,255,0.12))',
  background: 'var(--dt-colors-background-container-neutral-subdued, rgba(30,30,36,0.85))',
  color: 'var(--dt-colors-text-neutral-default, #ddd)', fontSize: 16,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
};
