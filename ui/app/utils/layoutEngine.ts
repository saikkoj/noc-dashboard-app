/**
 * Layout engine for topology graphs.
 *
 * Modes:
 *   - FORCE:      force-directed (cluster discovery)
 *   - HORIZONTAL: left-to-right layered flow
 *   - VERTICAL:   top-to-bottom layered stack
 */

import type { TopologyNode } from '../types/network';

export type LayoutMode = 'force' | 'horizontal' | 'vertical';

interface MinimalEdge {
  source: string;
  target: string;
}

/* ── Force-directed layout ─────────────────────────── */

const FORCE_ITERATIONS = 60;
const REPULSION = 8000;
const ATTRACTION = 0.005;
const DAMPING = 0.85;
const MIN_DIST = 40;
const PAD = 60;

function forceLayout(
  nodes: Omit<TopologyNode, 'x' | 'y'>[],
  edges: MinimalEdge[],
  width: number,
  height: number,
): TopologyNode[] {
  if (nodes.length === 0) return [];

  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.38;

  const positioned = nodes.map((n, i) => {
    const angle = (2 * Math.PI * i) / nodes.length;
    return { ...n, x: cx + radius * Math.cos(angle), y: cy + radius * Math.sin(angle), vx: 0, vy: 0 };
  });

  const idxMap = new Map(positioned.map((n, i) => [n.id, i]));

  for (let iter = 0; iter < FORCE_ITERATIONS; iter++) {
    for (let i = 0; i < positioned.length; i++) {
      for (let j = i + 1; j < positioned.length; j++) {
        let dx = positioned[i].x - positioned[j].x;
        let dy = positioned[i].y - positioned[j].y;
        const dist = Math.max(Math.sqrt(dx * dx + dy * dy), MIN_DIST);
        const force = REPULSION / (dist * dist);
        dx = (dx / dist) * force;
        dy = (dy / dist) * force;
        positioned[i].vx += dx;
        positioned[i].vy += dy;
        positioned[j].vx -= dx;
        positioned[j].vy -= dy;
      }
    }

    for (const e of edges) {
      const si = idxMap.get(e.source);
      const ti = idxMap.get(e.target);
      if (si === undefined || ti === undefined) continue;
      const dx = positioned[ti].x - positioned[si].x;
      const dy = positioned[ti].y - positioned[si].y;
      positioned[si].vx += dx * ATTRACTION;
      positioned[si].vy += dy * ATTRACTION;
      positioned[ti].vx -= dx * ATTRACTION;
      positioned[ti].vy -= dy * ATTRACTION;
    }

    for (const n of positioned) {
      n.vx *= DAMPING;
      n.vy *= DAMPING;
      n.x = Math.max(PAD, Math.min(width - PAD, n.x + n.vx));
      n.y = Math.max(PAD, Math.min(height - PAD, n.y + n.vy));
    }
  }

  return positioned.map(({ vx, vy, ...rest }) => rest);
}

/* ── Layered layout ────────────────────────────────── */

function assignLayers(
  nodeIds: string[],
  edges: MinimalEdge[],
): Map<string, number> {
  const adj = new Map<string, string[]>();
  const inDeg = new Map<string, number>();
  for (const id of nodeIds) {
    adj.set(id, []);
    inDeg.set(id, 0);
  }
  for (const e of edges) {
    if (adj.has(e.source) && adj.has(e.target)) {
      adj.get(e.source)!.push(e.target);
      inDeg.set(e.target, (inDeg.get(e.target) ?? 0) + 1);
    }
  }

  const layers = new Map<string, number>();
  const queue: string[] = [];

  for (const id of nodeIds) {
    if ((inDeg.get(id) ?? 0) === 0) {
      queue.push(id);
      layers.set(id, 0);
    }
  }

  let head = 0;
  while (head < queue.length) {
    const current = queue[head++];
    const currentLayer = layers.get(current) ?? 0;
    for (const neighbor of (adj.get(current) ?? [])) {
      if (!layers.has(neighbor)) {
        layers.set(neighbor, currentLayer + 1);
        queue.push(neighbor);
      }
    }
  }

  for (const id of nodeIds) {
    if (!layers.has(id)) layers.set(id, 0);
  }

  return layers;
}

function layeredLayout(
  nodes: Omit<TopologyNode, 'x' | 'y'>[],
  edges: MinimalEdge[],
  width: number,
  height: number,
  direction: 'horizontal' | 'vertical',
): TopologyNode[] {
  if (nodes.length === 0) return [];

  const nodeIds = nodes.map(n => n.id);
  const layers = assignLayers(nodeIds, edges);

  const layerGroups = new Map<number, typeof nodes>();
  for (const n of nodes) {
    const layer = layers.get(n.id) ?? 0;
    if (!layerGroups.has(layer)) layerGroups.set(layer, []);
    layerGroups.get(layer)!.push(n);
  }

  const numLayers = Math.max(1, Math.max(...layerGroups.keys()) + 1);

  if (direction === 'horizontal') {
    const layerSpacing = (width - 2 * PAD) / Math.max(numLayers - 1, 1);
    return nodes.map(n => {
      const layer = layers.get(n.id) ?? 0;
      const group = layerGroups.get(layer) ?? [];
      const idx = group.indexOf(n);
      const groupSize = group.length;
      const ySpacing = (height - 2 * PAD) / Math.max(groupSize + 1, 2);
      return { ...n, x: PAD + layer * layerSpacing, y: PAD + (idx + 1) * ySpacing };
    });
  } else {
    const layerSpacing = (height - 2 * PAD) / Math.max(numLayers - 1, 1);
    return nodes.map(n => {
      const layer = layers.get(n.id) ?? 0;
      const group = layerGroups.get(layer) ?? [];
      const idx = group.indexOf(n);
      const groupSize = group.length;
      const xSpacing = (width - 2 * PAD) / Math.max(groupSize + 1, 2);
      return { ...n, x: PAD + (idx + 1) * xSpacing, y: PAD + layer * layerSpacing };
    });
  }
}

/* ── Public layout API ─────────────────────────────── */

export function computeLayout(
  nodes: Omit<TopologyNode, 'x' | 'y'>[],
  edges: MinimalEdge[],
  width: number,
  height: number,
  mode: LayoutMode,
): TopologyNode[] {
  switch (mode) {
    case 'horizontal':
      return layeredLayout(nodes, edges, width, height, 'horizontal');
    case 'vertical':
      return layeredLayout(nodes, edges, width, height, 'vertical');
    case 'force':
    default:
      return forceLayout(nodes, edges, width, height);
  }
}

export function scaleNodesToFit(
  nodes: TopologyNode[],
  width: number,
  height: number,
): TopologyNode[] {
  if (nodes.length <= 1) {
    return nodes.map(n => ({ ...n, x: width / 2, y: height / 2 }));
  }
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const srcMinX = Math.min(...xs);
  const srcMaxX = Math.max(...xs);
  const srcMinY = Math.min(...ys);
  const srcMaxY = Math.max(...ys);
  const srcW = srcMaxX - srcMinX || 1;
  const srcH = srcMaxY - srcMinY || 1;
  const tgtW = width - 2 * PAD;
  const tgtH = height - 2 * PAD;
  return nodes.map(n => ({
    ...n,
    x: PAD + ((n.x - srcMinX) / srcW) * tgtW,
    y: PAD + ((n.y - srcMinY) / srcH) * tgtH,
  }));
}
