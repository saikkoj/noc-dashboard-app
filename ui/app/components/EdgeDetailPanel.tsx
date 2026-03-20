/**
 * EdgeDetailPanel — slide-out detail panel for a selected topology edge (connection).
 */
import React from 'react';
import type { TopologyEdge, TopologyEdgeType } from '../types/network';
import { formatTraffic, HEALTH_COLORS } from '../utils';

interface Props {
  edge: TopologyEdge;
  onClose: () => void;
}

const EDGE_TYPE_COLOR: Record<TopologyEdgeType, string> = {
  lldp: '#2ab06f',
  bgp: '#4fc3f7',
  flow: '#b388ff',
  'runs-on': '#6b7280',
  calls: '#ffd54f',
  serves: '#ff6e40',
  manual: '#888888',
};

const EDGE_TYPE_LABEL: Record<TopologyEdgeType, string> = {
  lldp: 'LLDP Neighbor',
  bgp: 'BGP Peering',
  flow: 'Network Flow',
  'runs-on': 'Runs On',
  calls: 'Calls',
  serves: 'Serves',
  manual: 'Manual',
};

const BGP_STATE_LABEL: Record<number, string> = {
  1: 'Idle',
  2: 'Connect',
  3: 'Active',
  4: 'OpenSent',
  5: 'OpenConfirm',
  6: 'Established',
};

function bgpStateColor(state: number): string {
  if (state >= 6) return '#4caf50';
  if (state >= 4) return '#ffd54f';
  return '#ef5350';
}

function Row({ label, value, color }: { label: string; value: React.ReactNode; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ccc', marginBottom: 6 }}>
      <span>{label}</span>
      <span style={{ color: color ?? '#fff', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export function EdgeDetailPanel({ edge, onClose }: Props) {
  const edgeType = edge.edgeType ?? 'manual';
  const typeColor = EDGE_TYPE_COLOR[edgeType] ?? '#888';
  const typeLabel = EDGE_TYPE_LABEL[edgeType] ?? edgeType;
  const healthColor = edge.health ? (HEALTH_COLORS[edge.health] ?? '#6b7280') : '#6b7280';

  return (
    <div style={{
      position: 'absolute', top: 0, right: 0, width: 300, height: '100%',
      background: 'var(--dt-colors-background-surface-default, rgba(20,20,26,0.98))',
      borderLeft: '1px solid var(--dt-colors-border-neutral-default, rgba(59,130,246,0.2))',
      padding: 16, overflowY: 'auto', zIndex: 10,
    }}>
      {/* Close */}
      <button
        onClick={onClose}
        style={{
          position: 'absolute', top: 8, right: 8, background: 'none', border: 'none',
          color: '#888', fontSize: 18, cursor: 'pointer',
        }}
      >
        ✕
      </button>

      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 6 }}>Connection</div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span style={{
            padding: '2px 10px', borderRadius: 10, fontWeight: 600, fontSize: 10,
            background: `${typeColor}20`, color: typeColor, textTransform: 'uppercase',
          }}>
            {typeLabel}
          </span>
          {edge.health && (
            <span style={{
              padding: '2px 10px', borderRadius: 10, fontWeight: 600, fontSize: 10,
              background: `${healthColor}20`, color: healthColor, textTransform: 'uppercase',
            }}>
              {edge.health}
            </span>
          )}
        </div>
      </div>

      {/* Endpoints */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Endpoints</div>
        <div style={{
          display: 'flex', flexDirection: 'column', gap: 4, padding: '8px 10px',
          background: 'rgba(255,255,255,0.04)', borderRadius: 6,
        }}>
          <div style={{ fontSize: 12, color: '#fff' }}>
            {edge.sourceLabel || edge.source}
          </div>
          <div style={{ fontSize: 10, color: typeColor, textAlign: 'center' }}>
            {edge.directed ? '→' : '↔'} {typeLabel}
          </div>
          <div style={{ fontSize: 12, color: '#fff' }}>
            {edge.targetLabel || edge.target}
          </div>
        </div>
      </div>

      {/* LLDP-specific: interface names */}
      {edgeType === 'lldp' && (edge.sourceInterface || edge.targetInterface) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Interfaces</div>
          {edge.sourceInterface && (
            <Row label="Source Interface" value={edge.sourceInterface} />
          )}
          {edge.targetInterface && (
            <Row label="Neighbor Interface" value={edge.targetInterface} />
          )}
        </div>
      )}

      {/* BGP-specific: session state */}
      {edgeType === 'bgp' && edge.bgpState != null && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>BGP Session</div>
          <Row
            label="Peer State"
            value={BGP_STATE_LABEL[Math.round(edge.bgpState)] ?? `${edge.bgpState.toFixed(1)}`}
            color={bgpStateColor(edge.bgpState)}
          />
          <Row label="State Value" value={edge.bgpState.toFixed(2)} />
        </div>
      )}

      {/* Flow-specific: bandwidth */}
      {edgeType === 'flow' && edge.bandwidth > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Traffic</div>
          <Row label="Bandwidth" value={formatTraffic(edge.bandwidth / 1_000_000_000)} />
        </div>
      )}

      {/* Calls-specific */}
      {edgeType === 'calls' && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Service Call</div>
          {edge.callCount != null && <Row label="Call Count" value={edge.callCount} />}
          <Row label="Direction" value={`${edge.sourceLabel ?? 'Source'} → ${edge.targetLabel ?? 'Target'}`} />
        </div>
      )}

      {/* Runs-on / Serves description */}
      {(edgeType === 'runs-on' || edgeType === 'serves') && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Relationship</div>
          <Row label="Type" value={typeLabel} />
          <Row label="Direction" value={`${edge.sourceLabel ?? 'Source'} → ${edge.targetLabel ?? 'Target'}`} />
        </div>
      )}

      {/* Health explanation */}
      {edge.healthReason && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Health Analysis</div>
          <div style={{
            fontSize: 12, color: '#ccc', lineHeight: 1.5,
            padding: '8px 10px', borderRadius: 6,
            background: `${healthColor}10`,
            borderLeft: `3px solid ${healthColor}`,
          }}>
            {edge.healthReason}
          </div>
        </div>
      )}

      {/* Generic edge IDs (always shown as footer info) */}
      <div style={{ marginTop: 16, fontSize: 10, color: '#555', wordBreak: 'break-all' }}>
        <div>Source: {edge.source}</div>
        <div>Target: {edge.target}</div>
      </div>
    </div>
  );
}
