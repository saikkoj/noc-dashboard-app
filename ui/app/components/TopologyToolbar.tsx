/**
 * TopologyToolbar — layout selector + 2D/3D toggle + edge type filters.
 */
import React from 'react';
import type { LayoutMode } from '../utils/layoutEngine';
import type { TopologyEdgeType } from '../types/network';

export type RenderMode = '2d' | '3d';

interface Props {
  layoutMode: LayoutMode;
  onLayoutChange: (mode: LayoutMode) => void;
  renderMode: RenderMode;
  onRenderModeChange: (mode: RenderMode) => void;
  visibleEdgeTypes: Set<TopologyEdgeType>;
  onToggleEdgeType: (type: TopologyEdgeType) => void;
  edgeCounts: Record<TopologyEdgeType, number>;
}

const LAYOUT_OPTIONS: { value: LayoutMode; label: string }[] = [
  { value: 'force', label: 'Voima' },
  { value: 'horizontal', label: 'Vaaka' },
  { value: 'vertical', label: 'Pysty' },
];

const EDGE_TYPES: { value: TopologyEdgeType; label: string; color: string }[] = [
  { value: 'lldp', label: 'LLDP', color: '#4dd0e1' },
  { value: 'bgp', label: 'BGP', color: '#b280ff' },
  { value: 'flow', label: 'Flow', color: '#ffd54f' },
  { value: 'runs-on', label: 'Runs-on', color: '#6b7280' },
  { value: 'calls', label: 'Calls', color: '#ff9800' },
  { value: 'serves', label: 'Serves', color: '#e91e63' },
];

export function TopologyToolbar({ layoutMode, onLayoutChange, renderMode, onRenderModeChange, visibleEdgeTypes, onToggleEdgeType, edgeCounts }: Props) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0',
      flexWrap: 'wrap', fontSize: 12, color: '#ccc',
    }}>
      {/* Layout selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ opacity: 0.6 }}>Asettelu:</span>
        {LAYOUT_OPTIONS.map(opt => (
          <button
            key={opt.value}
            onClick={() => onLayoutChange(opt.value)}
            style={{
              padding: '3px 10px', borderRadius: 6, border: '1px solid',
              borderColor: layoutMode === opt.value ? '#3B82F6' : 'rgba(255,255,255,0.12)',
              background: layoutMode === opt.value ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: layoutMode === opt.value ? '#3B82F6' : '#999',
              cursor: 'pointer', fontSize: 12,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* 2D / 3D toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ opacity: 0.6 }}>View:</span>
        {(['2d', '3d'] as RenderMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => onRenderModeChange(mode)}
            style={{
              padding: '3px 10px', borderRadius: 6, border: '1px solid',
              borderColor: renderMode === mode ? '#3B82F6' : 'rgba(255,255,255,0.12)',
              background: renderMode === mode ? 'rgba(59,130,246,0.12)' : 'transparent',
              color: renderMode === mode ? '#3B82F6' : '#999',
              cursor: 'pointer', fontSize: 12, fontWeight: renderMode === mode ? 600 : 400,
            }}
          >
            {mode.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Edge type filters */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ opacity: 0.6 }}>Connections:</span>
        {EDGE_TYPES.map(et => {
          const active = visibleEdgeTypes.has(et.value);
          return (
            <button
              key={et.value}
              onClick={() => onToggleEdgeType(et.value)}
              style={{
                padding: '3px 10px', borderRadius: 6, border: '1px solid',
                borderColor: active ? et.color : 'rgba(255,255,255,0.1)',
                background: active ? `${et.color}18` : 'transparent',
                color: active ? et.color : '#666',
                cursor: 'pointer', fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
              }}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: active ? et.color : '#555', display: 'inline-block' }} />
              {et.label}
              <span style={{ opacity: 0.5, fontSize: 10 }}>({edgeCounts[et.value] ?? 0})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
