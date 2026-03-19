/**
 * GraphScene3D — Canvas-based 3D topology renderer with logical network layers.
 *
 * Presents network entities on distinct Z-depth layers following standard
 * network architecture hierarchy:
 *
 *   Layer 4 (top)     — Servers / Endpoints       "Palvelimet"
 *   Layer 3           — Switches / Distribution    "Kytkimet"
 *   Layer 2           — Firewalls / Security       "Firewallt"
 *   Layer 1           — Routers / Core             "Reitittimet"
 *   Layer 0 (bottom)  — Cloud Gateways / WAN       "Pilvi"
 *
 * Each layer is visualized as a semi-transparent horizontal plane in 3D space,
 * with nodes rendered on their respective planes. This follows the established
 * practice of using a "2.5D" stratified layout for NOC topology visualization.
 *
 * Features:
 *   - Perspective projection with orbit/pan/zoom camera controls
 *   - Visible layer planes with labels for spatial orientation
 *   - Node rendering with role-specific shapes, health-colored fills
 *   - Depth fog and size attenuation for depth perception
 *   - Painter's algorithm: depth-sorted back-to-front rendering
 *   - Raycasting for node selection via click
 *   - Smooth camera animation (easeInOutQuad)
 *   - On-screen layer legend and navigation controls
 *   - requestAnimationFrame with dirty flag for efficiency
 */

import React, { useRef, useEffect, useCallback, useMemo } from 'react';
import type { TopologyNode, TopologyEdge, TopologyEdgeType, DeviceRole } from '../types/network';
import { HEALTH_COLORS } from '../utils';

/* ── Types ────────────────────────────────────────── */

interface Vec3 { x: number; y: number; z: number }

interface Camera {
  theta: number;
  phi: number;
  distance: number;
  target: Vec3;
}

export interface GraphScene3DProps {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  edgeCounts?: Record<TopologyEdgeType, number>;
  height?: number;
  selectedNodeId?: string | null;
  onNodeClick?: (node: TopologyNode) => void;
}

/* ── Constants ────────────────────────────────────── */

/** Edge type → color mapping */
const EDGE_TYPE_COLOR: Record<TopologyEdgeType, string> = {
  lldp: '#2ab06f',
  bgp: '#4fc3f7',
  flow: '#b388ff',
  'runs-on': '#6b7280',
  calls: '#ffd54f',
  serves: '#ff6e40',
  manual: '#888888',
};

/** Role → visual shape mapping */
const ROLE_SHAPE: Record<DeviceRole, 'circle' | 'hexagon' | 'diamond' | 'square' | 'pentagon' | 'triangle'> = {
  router: 'hexagon',
  'cloud-gw': 'circle',
  firewall: 'diamond',
  switch: 'square',
  server: 'square',
  host: 'square',
  cloud: 'circle',
  'process-group': 'pentagon',
  service: 'hexagon',
  application: 'triangle',
  unknown: 'circle',
};

/**
 * Logical Smartscape layers: Z-depth assignment by device role.
 * 8 layers, spaced 65 units apart for clear visual separation.
 */
const ROLE_Z: Record<DeviceRole, number> = {
  'cloud-gw': -230,
  cloud:      -230,
  router:     -165,
  firewall:   -100,
  switch:      -35,
  server:       30,
  host:         30,
  'process-group': 95,
  service:     160,
  application: 225,
  unknown:       0,
};

/** Layer metadata for rendering planes and legend */
interface LayerMeta {
  z: number;
  label: string;
  labelFi: string;
  color: string;
  roles: DeviceRole[];
}

const NETWORK_LAYERS: LayerMeta[] = [
  { z: -230, label: 'Cloud / WAN',        labelFi: 'Pilvi / WAN',           color: '#4fc3f7', roles: ['cloud-gw', 'cloud'] },
  { z: -165, label: 'Core / Routers',     labelFi: 'Ydin / Reitittimet',    color: '#2ab06f', roles: ['router'] },
  { z: -100, label: 'Security',           labelFi: 'Tietoturva',            color: '#ef5350', roles: ['firewall', 'unknown'] },
  { z:  -35, label: 'Distribution',       labelFi: 'Jakelu / Kytkimet',     color: '#ffd54f', roles: ['switch'] },
  { z:   30, label: 'Hosts',              labelFi: 'Palvelimet / Hostit',   color: '#4dd0e1', roles: ['server', 'host'] },
  { z:   95, label: 'Process Groups',     labelFi: 'Process Groups',        color: '#ab47bc', roles: ['process-group'] },
  { z:  160, label: 'Services',           labelFi: 'Services',              color: '#ff7043', roles: ['service'] },
  { z:  225, label: 'Applications',       labelFi: 'Sovellukset',           color: '#66bb6a', roles: ['application'] },
];

const NODE_RADIUS_BASE = 9;
const NEAR = 0.1;
const FAR = 3000;
const FOV_DEG = 50;
const LAYER_PLANE_HALF_SIZE = 360;

const arrowBtnStyle: React.CSSProperties = {
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 4,
  color: 'rgba(255,255,255,0.6)',
  fontSize: 12,
  cursor: 'pointer',
  padding: 0,
  lineHeight: 1,
};

/* ── Math helpers ─────────────────────────────────── */

function toRad(deg: number) { return deg * Math.PI / 180; }

function cameraPosition(cam: Camera): Vec3 {
  return {
    x: cam.target.x + cam.distance * Math.sin(cam.phi) * Math.cos(cam.theta),
    y: cam.target.y + cam.distance * Math.cos(cam.phi),
    z: cam.target.z + cam.distance * Math.sin(cam.phi) * Math.sin(cam.theta),
  };
}

function project(point: Vec3, cam: Camera, canvasW: number, canvasH: number): { sx: number; sy: number; depth: number } | null {
  const eye = cameraPosition(cam);
  const fwd = { x: cam.target.x - eye.x, y: cam.target.y - eye.y, z: cam.target.z - eye.z };
  const fwdLen = Math.sqrt(fwd.x * fwd.x + fwd.y * fwd.y + fwd.z * fwd.z) || 1;
  fwd.x /= fwdLen; fwd.y /= fwdLen; fwd.z /= fwdLen;

  const worldUp = { x: 0, y: 1, z: 0 };
  const right = {
    x: fwd.y * worldUp.z - fwd.z * worldUp.y,
    y: fwd.z * worldUp.x - fwd.x * worldUp.z,
    z: fwd.x * worldUp.y - fwd.y * worldUp.x,
  };
  const rLen = Math.sqrt(right.x * right.x + right.y * right.y + right.z * right.z) || 1;
  right.x /= rLen; right.y /= rLen; right.z /= rLen;

  const up = {
    x: right.y * fwd.z - right.z * fwd.y,
    y: right.z * fwd.x - right.x * fwd.z,
    z: right.x * fwd.y - right.y * fwd.x,
  };

  const rel = { x: point.x - eye.x, y: point.y - eye.y, z: point.z - eye.z };
  const depth = rel.x * fwd.x + rel.y * fwd.y + rel.z * fwd.z;
  if (depth < NEAR || depth > FAR) return null;

  const rx = rel.x * right.x + rel.y * right.y + rel.z * right.z;
  const ry = rel.x * up.x + rel.y * up.y + rel.z * up.z;

  const fovRad = toRad(FOV_DEG);
  const scale = canvasH / (2 * Math.tan(fovRad / 2) * depth);

  return {
    sx: canvasW / 2 + rx * scale,
    sy: canvasH / 2 - ry * scale,
    depth,
  };
}

/** Parse hex color to [r,g,b] */
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

/* ── Component ────────────────────────────────────── */

export const GraphScene3D: React.FC<GraphScene3DProps> = React.memo(({
  nodes,
  edges,
  height = 600,
  selectedNodeId,
  onNodeClick,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<Camera>({
    theta: Math.PI / 4,
    phi: Math.PI / 3.2,       // slightly more overhead for better layer visibility
    distance: 800,
    target: { x: 0, y: 0, z: 0 },
  });
  const dirtyRef = useRef(true);
  const dragRef = useRef<{ active: boolean; lastX: number; lastY: number; button: number }>({ active: false, lastX: 0, lastY: 0, button: 0 });
  const rafRef = useRef<number>(0);
  const nodesRef = useRef(nodes);
  const edgesRef = useRef(edges);
  const selectedRef = useRef(selectedNodeId);
  const hoveredNodeIdRef = useRef<string | null>(null);
  const animRef = useRef<{
    startTime: number;
    duration: number;
    from: Camera;
    to: Camera;
  } | null>(null);

  nodesRef.current = nodes;
  edgesRef.current = edges;
  selectedRef.current = selectedNodeId;

  /* ── 3D position computation ── */

  const positions3D = useMemo<Map<string, Vec3>>(() => {
    const map = new Map<string, Vec3>();
    if (nodes.length === 0) return map;

    const avgX = nodes.reduce((s, n) => s + n.x, 0) / nodes.length;
    const avgY = nodes.reduce((s, n) => s + n.y, 0) / nodes.length;

    for (const n of nodes) {
      map.set(n.id, {
        x: n.x - avgX,
        y: -(n.y - avgY),
        z: ROLE_Z[n.role] ?? 0,
      });
    }
    return map;
  }, [nodes]);

  /** Which layers have nodes on them */
  const activeLayers = useMemo(() => {
    const roleSet = new Set(nodes.map(n => n.role));
    return NETWORK_LAYERS.filter(layer => layer.roles.some(r => roleSet.has(r)));
  }, [nodes]);

  /* ── Camera auto-fit ── */

  useEffect(() => {
    if (nodes.length === 0) return;
    const cam = cameraRef.current;
    cam.target = { x: 0, y: 0, z: 0 };
    let maxDist = 0;
    for (const pos of positions3D.values()) {
      const d = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
      if (d > maxDist) maxDist = d;
    }
    cam.distance = Math.max(400, maxDist * 2.0);
    dirtyRef.current = true;
  }, [nodes, positions3D]);

  /* ── Render function ── */

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;
    const cam = cameraRef.current;
    const curNodes = nodesRef.current;
    const curEdges = edgesRef.current;
    const selId = selectedRef.current;

    ctx.clearRect(0, 0, w, h);

    /* ── 1. Draw layer planes (back-to-front) ── */
    // Project all 4 corners of each layer plane, sort by average depth
    const layerProjections: Array<{
      layer: LayerMeta;
      corners: Array<{ sx: number; sy: number }>;
      avgDepth: number;
      labelPos: { sx: number; sy: number } | null;
    }> = [];

    for (const layer of activeLayers) {
      const half = LAYER_PLANE_HALF_SIZE;
      const y = layer.z; // Y in 3D space = layer Z
      const corners3D: Vec3[] = [
        { x: -half, y, z: -half },
        { x:  half, y, z: -half },
        { x:  half, y, z:  half },
        { x: -half, y, z:  half },
      ];
      const projected = corners3D.map(c => project(c, cam, w, h));
      if (projected.some(p => p === null)) continue;
      const validCorners = projected as Array<{ sx: number; sy: number; depth: number }>;
      const avgDepth = validCorners.reduce((s, c) => s + c.depth, 0) / 4;

      // Label position: back-left corner of plane
      const labelPoint = project({ x: -half + 10, y, z: -half + 10 }, cam, w, h);

      layerProjections.push({
        layer,
        corners: validCorners.map(c => ({ sx: c.sx, sy: c.sy })),
        avgDepth,
        labelPos: labelPoint ? { sx: labelPoint.sx, sy: labelPoint.sy } : null,
      });
    }

    // Sort far-first
    layerProjections.sort((a, b) => b.avgDepth - a.avgDepth);

    // Draw the planes
    for (const lp of layerProjections) {
      const [r, g, b] = hexToRgb(lp.layer.color);
      ctx.globalAlpha = 0.06;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.beginPath();
      ctx.moveTo(lp.corners[0].sx, lp.corners[0].sy);
      for (let i = 1; i < lp.corners.length; i++) {
        ctx.lineTo(lp.corners[i].sx, lp.corners[i].sy);
      }
      ctx.closePath();
      ctx.fill();

      // Plane border
      ctx.globalAlpha = 0.15;
      ctx.strokeStyle = lp.layer.color;
      ctx.lineWidth = 1;
      ctx.setLineDash([6, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Layer label in 3D space
      if (lp.labelPos) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = lp.layer.color;
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(lp.layer.labelFi, lp.labelPos.sx, lp.labelPos.sy);
      }
    }
    ctx.globalAlpha = 1;

    /* ── 2. Draw edges ── */
    ctx.lineWidth = 1;
    for (const e of curEdges) {
      const srcPos = positions3D.get(e.source);
      const tgtPos = positions3D.get(e.target);
      if (!srcPos || !tgtPos) continue;

      const sp = project(srcPos, cam, w, h);
      const tp = project(tgtPos, cam, w, h);
      if (!sp || !tp) continue;

      const edgeType = e.edgeType ?? 'lldp';
      const crossLayer = srcPos.z !== tgtPos.z;
      ctx.strokeStyle = EDGE_TYPE_COLOR[edgeType] ?? '#555';
      // Cross-layer edges slightly more transparent
      ctx.globalAlpha = crossLayer ? 0.25 : 0.45;
      ctx.lineWidth = crossLayer ? 1.5 : 1;

      // Dashed for cross-layer edges to avoid visual clutter
      if (crossLayer) ctx.setLineDash([4, 3]);

      ctx.beginPath();
      ctx.moveTo(sp.sx, sp.sy);
      ctx.lineTo(tp.sx, tp.sy);
      ctx.stroke();

      // Draw arrowhead for directed edges (calls, serves, runs-on)
      if (edgeType === 'calls' || edgeType === 'serves' || edgeType === 'runs-on' || e.directed) {
        const dx = tp.sx - sp.sx;
        const dy = tp.sy - sp.sy;
        const len = Math.sqrt(dx * dx + dy * dy);
        if (len > 20) {
          const arrowSize = Math.min(6, len * 0.12);
          // Place arrow at 70% along the edge (avoids overlap with node)
          const mx = sp.sx + dx * 0.7;
          const my = sp.sy + dy * 0.7;
          const angle = Math.atan2(dy, dx);
          ctx.fillStyle = EDGE_TYPE_COLOR[edgeType] ?? '#555';
          ctx.beginPath();
          ctx.moveTo(mx + arrowSize * Math.cos(angle), my + arrowSize * Math.sin(angle));
          ctx.lineTo(mx + arrowSize * Math.cos(angle + 2.5), my + arrowSize * Math.sin(angle + 2.5));
          ctx.lineTo(mx + arrowSize * Math.cos(angle - 2.5), my + arrowSize * Math.sin(angle - 2.5));
          ctx.closePath();
          ctx.fill();
        }
      }

      if (crossLayer) ctx.setLineDash([]);
    }
    ctx.globalAlpha = 1;

    /* ── 3. Project & sort nodes (painter's algorithm) ── */
    const projected: Array<{
      node: TopologyNode;
      sx: number;
      sy: number;
      depth: number;
      radius: number;
    }> = [];

    for (const n of curNodes) {
      const pos = positions3D.get(n.id);
      if (!pos) continue;
      const p = project(pos, cam, w, h);
      if (!p) continue;
      const radius = Math.max(4, NODE_RADIUS_BASE * (500 / Math.max(p.depth, 60)));
      projected.push({ node: n, sx: p.sx, sy: p.sy, depth: p.depth, radius });
    }
    projected.sort((a, b) => b.depth - a.depth);

    /* ── 4. Draw nodes ── */
    for (const p of projected) {
      const color = HEALTH_COLORS[p.node.health] ?? '#555';
      const isSelected = p.node.id === selId;
      const isHovered = p.node.id === hoveredNodeIdRef.current;
      const shape = ROLE_SHAPE[p.node.role] ?? 'circle';
      const isExternal = !!p.node.isExternal;

      // Depth fog
      const alpha = Math.max(0.3, Math.min(1, 1 - (p.depth - 150) / 1600));
      ctx.globalAlpha = alpha;

      // Selection / hover glow
      if (isSelected) {
        ctx.shadowColor = '#3B82F6';
        ctx.shadowBlur = 14;
      } else if (isHovered) {
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 10;
      }

      ctx.fillStyle = color;
      ctx.strokeStyle = isSelected ? '#ffffff' : isExternal ? '#3B82F6' : 'rgba(255,255,255,0.18)';
      ctx.lineWidth = isSelected ? 2.5 : isExternal ? 2 : 1;
      if (isExternal) ctx.setLineDash([4, 3]);

      if (shape === 'hexagon') {
        // Hexagon — routers (standard network icon shape)
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (Math.PI / 3) * i - Math.PI / 6;
          const hx = p.sx + p.radius * Math.cos(angle);
          const hy = p.sy + p.radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (shape === 'diamond') {
        // Diamond — firewalls
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy - p.radius);
        ctx.lineTo(p.sx + p.radius, p.sy);
        ctx.lineTo(p.sx, p.sy + p.radius);
        ctx.lineTo(p.sx - p.radius, p.sy);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (shape === 'square') {
        // Rounded square — switches, servers, hosts
        const r = p.radius;
        const cr = Math.min(3, r * 0.3);
        ctx.beginPath();
        ctx.moveTo(p.sx - r + cr, p.sy - r);
        ctx.lineTo(p.sx + r - cr, p.sy - r);
        ctx.arcTo(p.sx + r, p.sy - r, p.sx + r, p.sy - r + cr, cr);
        ctx.lineTo(p.sx + r, p.sy + r - cr);
        ctx.arcTo(p.sx + r, p.sy + r, p.sx + r - cr, p.sy + r, cr);
        ctx.lineTo(p.sx - r + cr, p.sy + r);
        ctx.arcTo(p.sx - r, p.sy + r, p.sx - r, p.sy + r - cr, cr);
        ctx.lineTo(p.sx - r, p.sy - r + cr);
        ctx.arcTo(p.sx - r, p.sy - r, p.sx - r + cr, p.sy - r, cr);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (shape === 'pentagon') {
        // Pentagon — process groups
        ctx.beginPath();
        for (let i = 0; i < 5; i++) {
          const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
          const px = p.sx + p.radius * Math.cos(angle);
          const py = p.sy + p.radius * Math.sin(angle);
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else if (shape === 'triangle') {
        // Triangle — applications
        ctx.beginPath();
        ctx.moveTo(p.sx, p.sy - p.radius);
        ctx.lineTo(p.sx + p.radius * 0.87, p.sy + p.radius * 0.5);
        ctx.lineTo(p.sx - p.radius * 0.87, p.sy + p.radius * 0.5);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        // Circle — cloud-gw, cloud, unknown
        ctx.beginPath();
        ctx.arc(p.sx, p.sy, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }

      if (isExternal) ctx.setLineDash([]);
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;

      // Label (only for nearby / large enough nodes)
      if (p.depth < 800 && p.radius > 5) {
        ctx.globalAlpha = alpha * 0.85;
        ctx.fillStyle = '#e0e0e0';
        ctx.font = `${Math.max(8, Math.round(11 * (400 / Math.max(p.depth, 120))))}px sans-serif`;
        ctx.textAlign = 'center';
        const label = isExternal && p.node.location ? `↗ ${p.node.label}` : p.node.label;
        ctx.fillText(label, p.sx, p.sy + p.radius + 13, 140);
      }
    }
    ctx.globalAlpha = 1;
  }, [positions3D, activeLayers]);

  /* ── Animation loop ── */

  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      const anim = animRef.current;
      if (anim) {
        const elapsed = performance.now() - anim.startTime;
        const t = Math.min(1, elapsed / anim.duration);
        const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        const cam = cameraRef.current;
        cam.theta = anim.from.theta + (anim.to.theta - anim.from.theta) * ease;
        cam.phi = anim.from.phi + (anim.to.phi - anim.from.phi) * ease;
        cam.distance = anim.from.distance + (anim.to.distance - anim.from.distance) * ease;
        cam.target.x = anim.from.target.x + (anim.to.target.x - anim.from.target.x) * ease;
        cam.target.y = anim.from.target.y + (anim.to.target.y - anim.from.target.y) * ease;
        cam.target.z = anim.from.target.z + (anim.to.target.z - anim.from.target.z) * ease;
        dirtyRef.current = true;
        if (t >= 1) animRef.current = null;
      }
      if (dirtyRef.current) {
        dirtyRef.current = false;
        render();
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [render]);

  useEffect(() => { dirtyRef.current = true; }, [nodes, edges, selectedNodeId]);

  /* ── Resize canvas ── */

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;
    const ro = new ResizeObserver(() => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dirtyRef.current = true;
    });
    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  /* ── Utility functions ── */

  const PAN_KEY_STEP = 30;

  const panCamera = useCallback((dx: number, dy: number) => {
    const cam = cameraRef.current;
    const panScale = cam.distance * 0.002;
    cam.target.x -= dx * panScale * Math.cos(cam.theta);
    cam.target.z += dx * panScale * Math.sin(cam.theta);
    cam.target.y += dy * panScale;
    dirtyRef.current = true;
  }, []);

  const hitTest = useCallback((mx: number, my: number, w: number, h: number): TopologyNode | null => {
    const cam = cameraRef.current;
    let closest: TopologyNode | null = null;
    let closestDist = Infinity;
    for (const n of nodesRef.current) {
      const pos = positions3D.get(n.id);
      if (!pos) continue;
      const p = project(pos, cam, w, h);
      if (!p) continue;
      const radius = Math.max(4, NODE_RADIUS_BASE * (500 / Math.max(p.depth, 60)));
      const dx = mx - p.sx;
      const dy = my - p.sy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < radius + 5 && dist < closestDist) {
        closestDist = dist;
        closest = n;
      }
    }
    return closest;
  }, [positions3D]);

  const animateTo = useCallback((to: Camera, duration = 400) => {
    const cam = cameraRef.current;
    animRef.current = {
      startTime: performance.now(),
      duration,
      from: { theta: cam.theta, phi: cam.phi, distance: cam.distance, target: { ...cam.target } },
      to,
    };
  }, []);

  const resetCamera = useCallback(() => {
    let maxDist = 0;
    for (const pos of positions3D.values()) {
      const d = Math.sqrt(pos.x * pos.x + pos.y * pos.y + pos.z * pos.z);
      if (d > maxDist) maxDist = d;
    }
    animateTo({
      theta: Math.PI / 4,
      phi: Math.PI / 3.2,
      distance: Math.max(400, maxDist * 2.0),
      target: { x: 0, y: 0, z: 0 },
    });
  }, [animateTo, positions3D]);

  /* ── Mouse controls ── */

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    animRef.current = null;
    dragRef.current = { active: true, lastX: e.clientX, lastY: e.clientY, button: e.button };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (canvasRef.current) canvasRef.current.style.cursor = 'grabbing';
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;

    if (!drag.active) {
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
        const newId = hit?.id ?? null;
        if (newId !== hoveredNodeIdRef.current) {
          hoveredNodeIdRef.current = newId;
          dirtyRef.current = true;
        }
        canvas.style.cursor = hit ? 'pointer' : 'grab';
      }
      return;
    }

    const dx = e.clientX - drag.lastX;
    const dy = e.clientY - drag.lastY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;

    const cam = cameraRef.current;
    if (drag.button === 0) {
      cam.theta -= dx * 0.005;
      cam.phi = Math.max(0.1, Math.min(Math.PI - 0.1, cam.phi - dy * 0.005));
    } else if (drag.button === 2 || drag.button === 1) {
      const panScale = cam.distance * 0.002;
      cam.target.x -= dx * panScale * Math.cos(cam.theta);
      cam.target.z += dx * panScale * Math.sin(cam.theta);
      cam.target.y += dy * panScale;
    }
    dirtyRef.current = true;
  }, [hitTest]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    dragRef.current.active = false;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    if (canvasRef.current) canvasRef.current.style.cursor = 'grab';
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cam = cameraRef.current;

    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
      const panScale = cam.distance * 0.0015;
      const eye = cameraPosition(cam);
      const fwd = { x: cam.target.x - eye.x, y: cam.target.y - eye.y, z: cam.target.z - eye.z };
      const fwdLen = Math.sqrt(fwd.x * fwd.x + fwd.y * fwd.y + fwd.z * fwd.z) || 1;
      fwd.x /= fwdLen; fwd.y /= fwdLen; fwd.z /= fwdLen;
      const worldUp = { x: 0, y: 1, z: 0 };
      const right = {
        x: fwd.y * worldUp.z - fwd.z * worldUp.y,
        y: fwd.z * worldUp.x - fwd.x * worldUp.z,
        z: fwd.x * worldUp.y - fwd.y * worldUp.x,
      };
      const rLen = Math.sqrt(right.x * right.x + right.y * right.y + right.z * right.z) || 1;
      right.x /= rLen; right.y /= rLen; right.z /= rLen;
      const dx = e.deltaX * panScale;
      cam.target.x += right.x * dx;
      cam.target.y += right.y * dx;
      cam.target.z += right.z * dx;
      dirtyRef.current = true;
      return;
    }

    const oldDist = cam.distance;
    const factor = e.deltaY > 0 ? 1.08 : 1 / 1.08;
    const newDist = Math.max(80, Math.min(4000, oldDist * factor));
    cam.distance = newDist;

    // Zoom toward cursor
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const cw = rect.width;
    const ch = rect.height;

    const eye = cameraPosition(cam);
    const fwd = { x: cam.target.x - eye.x, y: cam.target.y - eye.y, z: cam.target.z - eye.z };
    const fwdLen = Math.sqrt(fwd.x * fwd.x + fwd.y * fwd.y + fwd.z * fwd.z) || 1;
    fwd.x /= fwdLen; fwd.y /= fwdLen; fwd.z /= fwdLen;

    const worldUp = { x: 0, y: 1, z: 0 };
    const right = {
      x: fwd.y * worldUp.z - fwd.z * worldUp.y,
      y: fwd.z * worldUp.x - fwd.x * worldUp.z,
      z: fwd.x * worldUp.y - fwd.y * worldUp.x,
    };
    const rLen = Math.sqrt(right.x * right.x + right.y * right.y + right.z * right.z) || 1;
    right.x /= rLen; right.y /= rLen; right.z /= rLen;
    const up = {
      x: right.y * fwd.z - right.z * fwd.y,
      y: right.z * fwd.x - right.x * fwd.z,
      z: right.x * fwd.y - right.y * fwd.x,
    };

    const fovRad = toRad(FOV_DEG);
    const halfH = Math.tan(fovRad / 2);
    const aspect = cw / ch;
    const ndcX = ((mx / cw) * 2 - 1) * aspect * halfH;
    const ndcY = (1 - (my / ch) * 2) * halfH;

    const rayDir = {
      x: fwd.x + right.x * ndcX + up.x * ndcY,
      y: fwd.y + right.y * ndcX + up.y * ndcY,
      z: fwd.z + right.z * ndcX + up.z * ndcY,
    };

    const shift = (oldDist - newDist) * 0.3;
    cam.target.x += rayDir.x * shift;
    cam.target.y += rayDir.y * shift;
    cam.target.z += rayDir.z * shift;

    dirtyRef.current = true;
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!onNodeClick) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    if (hit) onNodeClick(hit);
  }, [onNodeClick, hitTest]);

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const hit = hitTest(e.clientX - rect.left, e.clientY - rect.top, rect.width, rect.height);
    if (!hit) return;
    const pos = positions3D.get(hit.id);
    if (!pos) return;
    const cam = cameraRef.current;
    animateTo({
      theta: cam.theta,
      phi: cam.phi,
      distance: Math.max(200, cam.distance * 0.5),
      target: { x: pos.x, y: pos.y, z: pos.z },
    });
    if (onNodeClick) onNodeClick(hit);
  }, [hitTest, positions3D, animateTo, onNodeClick]);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  /* ── Keyboard controls ── */

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const cam = cameraRef.current;
      const scaledStep = PAN_KEY_STEP * (cam.distance / 600);
      if (e.shiftKey) {
        const ORBIT_STEP = 0.08;
        switch (e.key) {
          case 'ArrowLeft':  e.preventDefault(); cam.theta += ORBIT_STEP; dirtyRef.current = true; break;
          case 'ArrowRight': e.preventDefault(); cam.theta -= ORBIT_STEP; dirtyRef.current = true; break;
          case 'ArrowUp':    e.preventDefault(); cam.phi = Math.max(0.1, cam.phi - ORBIT_STEP); dirtyRef.current = true; break;
          case 'ArrowDown':  e.preventDefault(); cam.phi = Math.min(Math.PI - 0.1, cam.phi + ORBIT_STEP); dirtyRef.current = true; break;
        }
        return;
      }
      switch (e.key) {
        case 'ArrowLeft':  e.preventDefault(); panCamera(scaledStep, 0); break;
        case 'ArrowRight': e.preventDefault(); panCamera(-scaledStep, 0); break;
        case 'ArrowUp':    e.preventDefault(); panCamera(0, scaledStep); break;
        case 'ArrowDown':  e.preventDefault(); panCamera(0, -scaledStep); break;
        case '+': case '=': e.preventDefault(); cam.distance = Math.max(80, cam.distance / 1.15); dirtyRef.current = true; break;
        case '-': case '_': e.preventDefault(); cam.distance = Math.min(4000, cam.distance * 1.15); dirtyRef.current = true; break;
        case 'Home': case 'r': e.preventDefault(); resetCamera(); break;
      }
    };
    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [panCamera, resetCamera]);

  /* ── Layer legend style ── */
  const legendStyle: React.CSSProperties = {
    position: 'absolute',
    top: 12,
    left: 12,
    display: 'flex',
    flexDirection: 'column',
    gap: 3,
    background: 'rgba(0,0,0,0.55)',
    borderRadius: 6,
    padding: '8px 10px',
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    pointerEvents: 'none',
    backdropFilter: 'blur(4px)',
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      style={{
        width: '100%',
        height,
        position: 'relative',
        background: 'radial-gradient(ellipse at center, #1a1a2e 0%, #0d0d1a 100%)',
        borderRadius: 8,
        overflow: 'hidden',
        outline: 'none',
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onWheel={handleWheel}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        style={{ display: 'block', touchAction: 'none', cursor: 'grab' }}
      />

      {/* Layer Legend */}
      <div style={legendStyle}>
        <div style={{ fontWeight: 600, marginBottom: 2, fontSize: 11 }}>Network Layers</div>
        {[...NETWORK_LAYERS].reverse().map(layer => {
          const count = nodes.filter(n => layer.roles.includes(n.role)).length;
          if (count === 0) return null;
          return (
            <div key={layer.z} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{
                width: 8, height: 8,
                borderRadius: 2,
                background: layer.color,
                display: 'inline-block',
                opacity: 0.8,
              }} />
              <span>{layer.labelFi}</span>
              <span style={{ opacity: 0.5 }}>({count})</span>
            </div>
          );
        })}
      </div>

      {/* Shape Legend */}
      <div style={{ ...legendStyle, top: 'auto', bottom: 120, left: 12, gap: 4 }}>
        <div style={{ fontWeight: 600, marginBottom: 1, fontSize: 11 }}>Muodot</div>
        {[
          { shape: '⬡', label: 'Reititin / Service' },
          { shape: '◇', label: 'Firewall' },
          { shape: '■', label: 'Kytkin / Hosti' },
          { shape: '⬠', label: 'Process Group' },
          { shape: '▲', label: 'Sovellus' },
          { shape: '●', label: 'Pilvi / Unknown' },
        ].map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 12, textAlign: 'center', fontSize: 12 }}>{s.shape}</span>
            <span>{s.label}</span>
          </div>
        ))}
      </div>

      {/* Pan arrows + reset */}
      <div style={{ position: 'absolute', bottom: 48, right: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <button onClick={() => panCamera(0, PAN_KEY_STEP)} style={arrowBtnStyle} title="Up" aria-label="Pan Up">▲</button>
        <div style={{ display: 'flex', gap: 2 }}>
          <button onClick={() => panCamera(PAN_KEY_STEP, 0)} style={arrowBtnStyle} title="Vasemmalle" aria-label="Pan Left">◀</button>
          <button onClick={resetCamera} style={arrowBtnStyle} title="Reset View (Home)" aria-label="Reset View">⊞</button>
          <button onClick={() => panCamera(-PAN_KEY_STEP, 0)} style={arrowBtnStyle} title="Oikealle" aria-label="Pan Right">▶</button>
        </div>
        <button onClick={() => panCamera(0, -PAN_KEY_STEP)} style={arrowBtnStyle} title="Down" aria-label="Pan Down">▼</button>
      </div>

      {/* Controls hint */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 16,
          fontSize: 10,
          color: 'rgba(255,255,255,0.35)',
          pointerEvents: 'none',
          textAlign: 'right',
          lineHeight: 1.6,
        }}
      >
        Rotate · Pan · Zoom · Double-click: Focus · Home: Reset
      </div>

      {nodes.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.4)',
            fontSize: 14,
          }}
        >
          Ei topologiadataa
        </div>
      )}
    </div>
  );
});

GraphScene3D.displayName = 'GraphScene3D';
