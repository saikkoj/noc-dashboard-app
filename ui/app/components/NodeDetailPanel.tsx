/**
 * NodeDetailPanel — slide-out detail panel for a selected topology node.
 */
import React from 'react';
import type { TopologyNode } from '../types/network';
import { HEALTH_COLORS, percentBarColor, openEntityDetail } from '../utils';

interface Props {
  node: TopologyNode;
  onClose: () => void;
  onIsolate?: (nodeId: string) => void;
  isIsolated?: boolean;
}

function MiniBar({ label, value, warn, crit }: { label: string; value: number; warn?: number; crit?: number }) {
  const color = percentBarColor(value, warn ?? 60, crit ?? 80);
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#aaa', marginBottom: 2 }}>
        <span>{label}</span>
        <span style={{ color }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(value, 100)}%`, height: '100%', borderRadius: 3, background: color, transition: 'width 0.3s' }} />
      </div>
    </div>
  );
}

export function NodeDetailPanel({ node, onClose, onIsolate, isIsolated }: Props) {
  const healthColor = HEALTH_COLORS[node.health] ?? HEALTH_COLORS.unknown;

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
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{node.label}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12 }}>
          <span style={{
            padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 10,
            background: `${healthColor}20`, color: healthColor, textTransform: 'uppercase',
          }}>
            {node.health}
          </span>
          <span style={{ color: '#888' }}>{node.role}</span>
        </div>
      </div>

      {/* Properties */}
      <div style={{ marginBottom: 16, fontSize: 12, color: '#ccc' }}>
        {node.ip && <div style={{ marginBottom: 4 }}>IP: <span style={{ color: '#fff' }}>{node.ip}</span></div>}
        {node.type && <div style={{ marginBottom: 4 }}>Type: <span style={{ color: '#fff' }}>{node.type}</span></div>}
        {node.location && <div style={{ marginBottom: 4 }}>Location: <span style={{ color: '#fff' }}>{node.location}</span></div>}
        {node.entityType && <div style={{ marginBottom: 4 }}>Entity: <span style={{ color: '#fff' }}>{node.entityType}</span></div>}
        {node.technology && <div style={{ marginBottom: 4 }}>Technology: <span style={{ color: '#fff' }}>{node.technology}</span></div>}
      </div>

      {/* Resource bars */}
      {(node.cpu != null || node.memory != null) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Resources</div>
          {node.cpu != null && <MiniBar label="CPU" value={node.cpu} />}
          {node.memory != null && <MiniBar label="Memory" value={node.memory} />}
        </div>
      )}

      {/* Service metrics */}
      {(node.requestRate != null || node.responseTime != null || node.errorRate != null) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Service Metrics</div>
          {node.requestRate != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ccc', marginBottom: 4 }}>
              <span>Request Rate</span><span style={{ color: '#fff' }}>{node.requestRate.toFixed(1)} req/s</span>
            </div>
          )}
          {node.responseTime != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ccc', marginBottom: 4 }}>
              <span>Response Time</span><span style={{ color: '#fff' }}>{node.responseTime.toFixed(0)} ms</span>
            </div>
          )}
          {node.errorRate != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#ccc' }}>Error Rate</span>
              <span style={{ color: node.errorRate > 5 ? '#ef5350' : node.errorRate > 1 ? '#ffd54f' : '#4caf50' }}>{node.errorRate.toFixed(2)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Process group info */}
      {node.instances != null && (
        <div style={{ marginBottom: 16, fontSize: 12, color: '#ccc' }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Process Group</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>Instances</span><span style={{ color: '#fff' }}>{node.instances}</span>
          </div>
        </div>
      )}

      {/* Application metrics */}
      {(node.userActions != null || node.apdex != null) && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: '#888', marginBottom: 6, fontWeight: 600 }}>Application</div>
          {node.userActions != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#ccc', marginBottom: 4 }}>
              <span>User Actions</span><span style={{ color: '#fff' }}>{node.userActions}</span>
            </div>
          )}
          {node.apdex != null && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: '#ccc' }}>Apdex</span>
              <span style={{ color: node.apdex >= 0.85 ? '#4caf50' : node.apdex >= 0.7 ? '#ffd54f' : '#ef5350' }}>{node.apdex.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 16 }}>
        <button
          onClick={() => openEntityDetail(node)}
          style={actionBtnStyle}
        >
          Open Entity
        </button>
        {onIsolate && (
          <button
            onClick={() => onIsolate(node.id)}
            style={{
              ...actionBtnStyle,
              background: isIsolated ? 'rgba(59,130,246,0.2)' : actionBtnStyle.background,
              border: isIsolated ? '1px solid #3B82F6' : actionBtnStyle.border,
            }}
          >
            {isIsolated ? 'Exit Isolation' : 'Isolate Entity'}
          </button>
        )}
      </div>
    </div>
  );
}

const actionBtnStyle: React.CSSProperties = {
  padding: '8px 14px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.25)',
  background: 'rgba(59,130,246,0.08)', color: '#3B82F6', cursor: 'pointer',
  fontSize: 12, textAlign: 'left',
};
