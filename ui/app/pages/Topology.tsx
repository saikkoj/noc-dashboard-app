/**
 * Topology — network topology page with 2D SVG and 3D canvas views.
 */

import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading } from '@dynatrace/strato-components/typography';
import { TopologyMap } from '../components/TopologyMap';
import { GraphScene3D } from '../components/GraphScene3D';
import { TopologyToolbar } from '../components/TopologyToolbar';
import type { RenderMode } from '../components/TopologyToolbar';
import { NodeDetailPanel } from '../components/NodeDetailPanel';
import { useTopologyData } from '../hooks/useTopologyData';
import type { TopologyNode, TopologyEdgeType } from '../types/network';
import { TOPOLOGY_LAYERS, getLayerForRole } from '../types/network';
import type { LayoutMode } from '../utils/layoutEngine';
import { modeBadgeStyle } from '../utils';
import { useDemoMode } from '../hooks/useDemoMode';

export function Topology() {
  const { demoMode } = useDemoMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 960, h: 540 });

  // Layout & filter state
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('horizontal');
  const [renderMode, setRenderMode] = useState<RenderMode>('2d');
  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState<Set<TopologyEdgeType>>(
    new Set(['lldp', 'bgp', 'flow', 'runs-on', 'calls', 'serves']),
  );
  const [visibleLayers, setVisibleLayers] = useState<Set<string>>(
    new Set(TOPOLOGY_LAYERS.map(l => l.id)),
  );
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [isolatedNodeId, setIsolatedNodeId] = useState<string | null>(null);

  // Data hooks
  const { nodes, edges, edgeCounts, isLoading, error, truncationWarnings } = useTopologyData(size.w, size.h, layoutMode);

  // Responsive sizing
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setSize({ w: Math.max(width, 400), h: Math.max(height, 300) });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const toggleEdgeType = useCallback((type: TopologyEdgeType) => {
    setVisibleEdgeTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) next.delete(type);
      else next.add(type);
      return next;
    });
  }, []);

  const toggleLayer = useCallback((layerId: string) => {
    setVisibleLayers(prev => {
      const next = new Set(prev);
      if (next.has(layerId)) next.delete(layerId);
      else next.add(layerId);
      return next;
    });
  }, []);

  const handleSelectNode = useCallback((n: TopologyNode | null) => setSelectedNode(n), []);

  const handleIsolate = useCallback((nodeId: string) => {
    setIsolatedNodeId(prev => prev === nodeId ? null : nodeId);
  }, []);

  /** Count nodes per layer */
  const layerNodeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of nodes) {
      const layer = TOPOLOGY_LAYERS[getLayerForRole(n.role)];
      if (layer) counts[layer.id] = (counts[layer.id] ?? 0) + 1;
    }
    return counts;
  }, [nodes]);

  /** Apply isolation — show only the isolated node + 1-hop neighbours */
  const { displayNodes, displayEdges } = useMemo(() => {
    let dNodes = nodes;
    let dEdges = edges.filter(e => !e.edgeType || visibleEdgeTypes.has(e.edgeType));
    if (isolatedNodeId) {
      const neighborIds = new Set<string>([isolatedNodeId]);
      for (const e of edges) {
        if (e.source === isolatedNodeId) neighborIds.add(e.target);
        if (e.target === isolatedNodeId) neighborIds.add(e.source);
      }
      dNodes = nodes.filter(n => neighborIds.has(n.id));
      dEdges = dEdges.filter(e => neighborIds.has(e.source) && neighborIds.has(e.target));
    }
    return { displayNodes: dNodes, displayEdges: dEdges };
  }, [nodes, edges, visibleEdgeTypes, isolatedNodeId]);

  return (
    <Flex flexDirection="column" gap={8} padding={0} style={{ height: '100%' }}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={4}>Topology</Heading>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </Flex>

      <Flex flexDirection="column" gap={4} style={{ position: 'relative', flex: 1 }}>
        <TopologyToolbar
          layoutMode={layoutMode}
          onLayoutChange={setLayoutMode}
          renderMode={renderMode}
          onRenderModeChange={setRenderMode}
          visibleEdgeTypes={visibleEdgeTypes}
          onToggleEdgeType={toggleEdgeType}
          edgeCounts={edgeCounts}
          visibleLayers={visibleLayers}
          onToggleLayer={toggleLayer}
          layerNodeCounts={layerNodeCounts}
        />

        {error && (
          <div style={{ padding: 8, background: 'rgba(220,23,42,0.1)', borderRadius: 6, color: '#dc172a', fontSize: 12 }}>
            Error: {error}
          </div>
        )}

        {truncationWarnings.length > 0 && (
          <div style={{
            padding: '8px 12px', background: 'rgba(253,130,50,0.1)', borderRadius: 6,
            border: '1px solid rgba(253,130,50,0.25)', fontSize: 12, color: '#fd8232',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ flexShrink: 0 }}>⚠</span>
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                Some queries reached their result limit — topology may be incomplete
              </div>
              {truncationWarnings.map((w, i) => (
                <div key={i} style={{ color: 'rgba(253,130,50,0.8)', fontSize: 11 }}>• {w}</div>
              ))}
            </div>
          </div>
        )}

        {isLoading && !nodes.length && (
          <div style={{ padding: 16, textAlign: 'center', color: '#888' }}>Loading topology…</div>
        )}

        {isolatedNodeId && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '4px 10px',
            background: 'rgba(59,130,246,0.08)', borderRadius: 6, fontSize: 11, color: '#3B82F6',
          }}>
            <span>Isolated view — showing 1-hop neighbours of selected entity</span>
            <button
              onClick={() => setIsolatedNodeId(null)}
              style={{
                background: 'rgba(59,130,246,0.15)', border: 'none', borderRadius: 4,
                color: '#3B82F6', cursor: 'pointer', padding: '2px 8px', fontSize: 11,
              }}
            >
              Show All
            </button>
          </div>
        )}

        <div ref={containerRef} style={{ flex: 1, minHeight: 400, position: 'relative' }}>
          {renderMode === '2d' ? (
            <TopologyMap
              nodes={displayNodes}
              edges={displayEdges}
              width={size.w}
              height={size.h}
              selectedNodeId={selectedNode?.id}
              onSelectNode={handleSelectNode}
              visibleEdgeTypes={visibleEdgeTypes}
              visibleLayers={visibleLayers}
              layoutMode={layoutMode}
            />
          ) : (
            <GraphScene3D
              nodes={displayNodes}
              edges={displayEdges}
              edgeCounts={edgeCounts}
              height={Math.max(size.h, 500)}
              selectedNodeId={selectedNode?.id}
              onNodeClick={handleSelectNode}
              visibleLayers={visibleLayers}
            />
          )}

          {selectedNode && (
            <NodeDetailPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onIsolate={handleIsolate}
              isIsolated={isolatedNodeId === selectedNode.id}
            />
          )}
        </div>

        {/* Stats strip */}
        <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#888', padding: '4px 0' }}>
          <span>Devices: {nodes.length}</span>
          <span>Connections: {edges.length}</span>
          <span>LLDP: {edgeCounts.lldp}</span>
          <span>BGP: {edgeCounts.bgp}</span>
          <span>Flow: {edgeCounts.flow}</span>
        </div>
      </Flex>
    </Flex>
  );
}
