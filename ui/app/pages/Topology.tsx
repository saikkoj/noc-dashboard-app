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
import type { LayoutMode } from '../utils/layoutEngine';
import { modeBadgeStyle } from '../utils';
import { useDemoMode } from '../hooks/useDemoMode';

export function Topology() {
  const { demoMode } = useDemoMode();
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 960, h: 540 });

  // Layout & filter state
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('force');
  const [renderMode, setRenderMode] = useState<RenderMode>('2d');
  const [visibleEdgeTypes, setVisibleEdgeTypes] = useState<Set<TopologyEdgeType>>(
    new Set(['lldp', 'bgp', 'flow', 'runs-on', 'calls', 'serves']),
  );
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);

  // Data hooks
  const { nodes, edges, edgeCounts, isLoading, error } = useTopologyData(size.w, size.h, layoutMode);

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

  const handleSelectNode = useCallback((n: TopologyNode | null) => setSelectedNode(n), []);

  const filteredEdges = useMemo(
    () => edges.filter(e => !e.edgeType || visibleEdgeTypes.has(e.edgeType)),
    [edges, visibleEdgeTypes],
  );

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
        />

        {error && (
          <div style={{ padding: 8, background: 'rgba(220,23,42,0.1)', borderRadius: 6, color: '#dc172a', fontSize: 12 }}>
            Error: {error}
          </div>
        )}

        {isLoading && !nodes.length && (
          <div style={{ padding: 16, textAlign: 'center', color: '#888' }}>Loading topology…</div>
        )}

        <div ref={containerRef} style={{ flex: 1, minHeight: 400, position: 'relative' }}>
          {renderMode === '2d' ? (
            <TopologyMap
              nodes={nodes}
              edges={edges}
              width={size.w}
              height={size.h}
              selectedNodeId={selectedNode?.id}
              onSelectNode={handleSelectNode}
              visibleEdgeTypes={visibleEdgeTypes}
            />
          ) : (
            <GraphScene3D
              nodes={nodes}
              edges={filteredEdges}
              edgeCounts={edgeCounts}
              height={Math.max(size.h, 500)}
              selectedNodeId={selectedNode?.id}
              onNodeClick={handleSelectNode}
            />
          )}

          {selectedNode && (
            <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNode(null)} />
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
