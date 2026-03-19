/**
 * ServiceCard — single customer service card with bandwidth gauge + actions.
 */
import React from 'react';
import type { CustomerService, BandwidthForecast } from '../types/network';
import { HEALTH_COLORS, percentBarColor, formatTraffic, formatPct } from '../utils';
import { SERVICE_TYPE_LABELS, SERVICE_STATUS_LABELS } from '../data/customerData';

interface Props {
  service: CustomerService;
  forecast?: BandwidthForecast;
  onUpgrade: (svc: CustomerService) => void;
  onOpenTicket: (svc: CustomerService) => void;
  onViewForecast: (svc: CustomerService) => void;
}

function UsageGauge({ current, ordered, peak }: { current: number; ordered: number; peak: number }) {
  if (ordered === 0) return null;
  const pct = (current / ordered) * 100;
  const peakPct = (peak / ordered) * 100;
  const color = percentBarColor(pct, 70, 85);

  return (
    <div style={{ marginTop: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#999', marginBottom: 3 }}>
        <span>Usage: {formatTraffic(current / 1000)}</span>
        <span>Subscribed: {formatTraffic(ordered / 1000)}</span>
      </div>
      <div style={{ position: 'relative', height: 10, borderRadius: 5, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
        <div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', borderRadius: 5, background: color, transition: 'width 0.3s' }} />
        {peakPct > pct && (
          <div style={{
            position: 'absolute', top: 0, left: `${Math.min(peakPct, 100)}%`, width: 2, height: '100%',
            background: '#fff', opacity: 0.5, transform: 'translateX(-1px)',
          }} />
        )}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#777', marginTop: 2 }}>
        <span style={{ color }}>{pct.toFixed(0)}% in use</span>
        <span>Huippu: {peakPct.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export function ServiceCard({ service, forecast, onUpgrade, onOpenTicket, onViewForecast }: Props) {
  const statusMeta = SERVICE_STATUS_LABELS[service.status] ?? { label: service.status, color: '#6b7280' };
  const typeLabel = SERVICE_TYPE_LABELS[service.type] ?? service.type;
  const hasBandwidth = service.orderedBandwidthMbps > 0;
  const usagePct = hasBandwidth ? (service.currentUsageMbps / service.orderedBandwidthMbps) * 100 : 0;
  const isHighUsage = usagePct > 75;
  const slaOk = service.slaActual >= service.slaTarget;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', borderRadius: 10,
      border: `1px solid ${statusMeta.color}30`, padding: 16,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{service.name}</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>{typeLabel} · {service.siteName}</div>
        </div>
        <span style={{
          padding: '2px 8px', borderRadius: 10, fontWeight: 600, fontSize: 10,
          background: `${statusMeta.color}20`, color: statusMeta.color,
        }}>
          {statusMeta.label}
        </span>
      </div>

      {/* Bandwidth gauge */}
      {hasBandwidth && (
        <UsageGauge current={service.currentUsageMbps} ordered={service.orderedBandwidthMbps} peak={service.peakUsageMbps} />
      )}

      {/* SLA row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#999' }}>SLA</span>
        <span>
          <span style={{ color: slaOk ? HEALTH_COLORS.healthy : HEALTH_COLORS.critical }}>
            {formatPct(service.slaActual)}
          </span>
          <span style={{ color: '#666' }}> / {formatPct(service.slaTarget)} tavoite</span>
        </span>
      </div>

      {/* Cost & contract */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ color: '#999' }}>Hinta</span>
        <span style={{ color: '#ccc' }}>{service.monthlyCostEur.toLocaleString('fi-FI')} €/kk</span>
      </div>

      {/* Forecast warning */}
      {forecast && forecast.daysUntilThreshold80 != null && forecast.daysUntilThreshold80 < 90 && forecast.daysUntilThreshold80 > 0 && (
        <div style={{
          padding: '6px 10px', borderRadius: 6, fontSize: 11,
          background: 'rgba(253,130,50,0.1)', color: '#fd8232',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          ⚡ Forecast: 80% Threshold {forecast.daysUntilThreshold80} days
        </div>
      )}
      {forecast && forecast.daysUntilThreshold95 != null && forecast.daysUntilThreshold95 < 120 && forecast.daysUntilThreshold95 > 0 && (
        <div style={{
          padding: '6px 10px', borderRadius: 6, fontSize: 11,
          background: 'rgba(220,23,42,0.1)', color: '#dc172a',
          display: 'flex', alignItems: 'center', gap: 4,
        }}>
          🔴 Capacity depleted in ~{forecast.daysUntilThreshold95} days
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
        {isHighUsage && hasBandwidth && (
          <button onClick={() => onUpgrade(service)} style={actionBtnPrimary}>
            Order More Bandwidth
          </button>
        )}
        {hasBandwidth && (
          <button onClick={() => onViewForecast(service)} style={actionBtnSecondary}>
            Forecast
          </button>
        )}
        <button onClick={() => onOpenTicket(service)} style={actionBtnSecondary}>
          Support Ticket
        </button>
      </div>
    </div>
  );
}

const actionBtnPrimary: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6, border: 'none',
  background: '#FF2D8D', color: '#fff', cursor: 'pointer',
  fontSize: 11, fontWeight: 600,
};

const actionBtnSecondary: React.CSSProperties = {
  padding: '6px 14px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.25)',
  background: 'rgba(59,130,246,0.08)', color: '#3B82F6', cursor: 'pointer',
  fontSize: 11,
};
