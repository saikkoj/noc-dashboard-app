/**
 * ForecastChart — bandwidth capacity forecast with projected usage and thresholds.
 */
import React from 'react';
import type { BandwidthForecast, CustomerService } from '../types/network';
import { SERVICE_TYPE_LABELS } from '../data/customerData';
import { formatTraffic, BRAND_PRIMARY } from '../utils';

interface Props {
  service: CustomerService;
  forecast: BandwidthForecast;
  onClose: () => void;
  onUpgrade: () => void;
}

function MiniSvgChart({ forecast, orderedMbps, width, height }: {
  forecast: BandwidthForecast;
  orderedMbps: number;
  width: number;
  height: number;
}) {
  const pts = forecast.projectedPoints;
  const hiPts = forecast.confidenceHigh;
  const loPts = forecast.confidenceLow;
  if (pts.length < 2) return null;

  const allVals = [...pts, ...hiPts].map(p => p.value);
  const maxVal = Math.max(...allVals, orderedMbps * 1.1);
  const padTop = 20;
  const padBottom = 30;
  const padLeft = 50;
  const chartW = width - padLeft - 10;
  const chartH = height - padTop - padBottom;

  const xScale = (i: number) => padLeft + (i / (pts.length - 1)) * chartW;
  const yScale = (v: number) => padTop + chartH - (v / maxVal) * chartH;

  const projLine = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.value)}`).join(' ');

  // Confidence band
  const bandUp = hiPts.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p.value)}`).join(' ');
  const bandDown = loPts.map((_, i) => `L${xScale(loPts.length - 1 - i)},${yScale(loPts[loPts.length - 1 - i].value)}`).join(' ');
  const bandPath = bandUp + ' ' + bandDown + ' Z';

  // Threshold lines
  const y80 = yScale(orderedMbps * 0.8);
  const y95 = yScale(orderedMbps * 0.95);
  const yOrdered = yScale(orderedMbps);

  // Month labels
  const months = pts.map(p => {
    const d = new Date(p.timestamp);
    return d.toLocaleDateString('en-US', { month: 'short' });
  });

  return (
    <svg width={width} height={height}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(frac => (
        <line key={frac} x1={padLeft} y1={yScale(maxVal * frac)} x2={width - 10} y2={yScale(maxVal * frac)}
          stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}

      {/* Y-axis labels */}
      {[0.25, 0.5, 0.75, 1].map(frac => (
        <text key={`l-${frac}`} x={padLeft - 6} y={yScale(maxVal * frac) + 4}
          textAnchor="end" fill="#666" fontSize={9}>
          {formatTraffic((maxVal * frac) / 1000)}
        </text>
      ))}

      {/* Threshold lines */}
      <line x1={padLeft} y1={yOrdered} x2={width - 10} y2={yOrdered}
        stroke="#dc172a" strokeWidth={1.5} strokeDasharray="6 3" />
      <text x={width - 12} y={yOrdered - 4} textAnchor="end" fill="#dc172a" fontSize={9}>Subscribed</text>

      <line x1={padLeft} y1={y80} x2={width - 10} y2={y80}
        stroke="#fd8232" strokeWidth={1} strokeDasharray="4 3" />
      <text x={width - 12} y={y80 - 4} textAnchor="end" fill="#fd8232" fontSize={9}>80%</text>

      <line x1={padLeft} y1={y95} x2={width - 10} y2={y95}
        stroke="#dc172a" strokeWidth={1} strokeDasharray="4 3" opacity={0.6} />
      <text x={width - 12} y={y95 - 4} textAnchor="end" fill="#dc172a" fontSize={9} opacity={0.6}>95%</text>

      {/* Confidence band */}
      <path d={bandPath} fill="rgba(59,130,246,0.1)" />

      {/* Projected line */}
      <path d={projLine} fill="none" stroke="#3B82F6" strokeWidth={2} />

      {/* "Now" marker */}
      <line x1={xScale(0)} y1={padTop} x2={xScale(0)} y2={padTop + chartH}
        stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="3 3" />
      <text x={xScale(0)} y={padTop + chartH + 14} textAnchor="middle" fill="#888" fontSize={9}>Now</text>

      {/* Month labels */}
      {months.map((m, i) => i > 0 && i % 2 === 0 ? (
        <text key={i} x={xScale(i)} y={padTop + chartH + 14} textAnchor="middle" fill="#666" fontSize={9}>{m}</text>
      ) : null)}

      {/* Data points */}
      {pts.map((p, i) => (
        <circle key={i} cx={xScale(i)} cy={yScale(p.value)} r={2.5}
          fill={p.value > orderedMbps * 0.95 ? '#dc172a' : p.value > orderedMbps * 0.8 ? '#fd8232' : '#3B82F6'} />
      ))}
    </svg>
  );
}

export function ForecastChart({ service, forecast, onClose, onUpgrade }: Props) {
  const exhaustionDate = forecast.predictedExhaustionDate
    ? new Date(forecast.predictedExhaustionDate).toLocaleDateString('en-US')
    : null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: '#1a1a22', borderRadius: 12, padding: 24, width: 640, maxHeight: '90vh', overflowY: 'auto',
        border: '1px solid rgba(255,255,255,0.1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Capacity Forecast</div>
            <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>
              {service.name} · {SERVICE_TYPE_LABELS[service.type]}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>

        {/* KPI summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
          <KpiBlock label="Usage" value={`${forecast.currentUsagePct.toFixed(0)}%`}
            color={forecast.currentUsagePct > 80 ? '#dc172a' : forecast.currentUsagePct > 60 ? '#fd8232' : '#2ab06f'} />
          <KpiBlock label="Growth Rate" value={`${forecast.growthRatePctPerMonth.toFixed(1)}%/mo`} color="#3B82F6" />
          <KpiBlock
            label="80% Threshold"
            value={forecast.daysUntilThreshold80 != null && forecast.daysUntilThreshold80 > 0
              ? `${forecast.daysUntilThreshold80} days` : forecast.daysUntilThreshold80 === 0 ? 'Exceeded!' : '—'}
            color={forecast.daysUntilThreshold80 != null && forecast.daysUntilThreshold80 < 60 ? '#fd8232' : '#2ab06f'}
          />
          <KpiBlock
            label="Capacity Exhaustion"
            value={exhaustionDate ?? '—'}
            color={forecast.daysUntilThreshold95 != null && forecast.daysUntilThreshold95 < 120 ? '#dc172a' : '#2ab06f'}
          />
        </div>

        {/* Chart */}
        <div style={{ background: '#131317', borderRadius: 8, padding: 8, marginBottom: 16 }}>
          <MiniSvgChart forecast={forecast} orderedMbps={service.orderedBandwidthMbps} width={580} height={280} />
        </div>

        {/* Recommendation */}
        {forecast.recommendedUpgradeMbps && (
          <div style={{
            padding: 12, borderRadius: 8, marginBottom: 16,
            background: `${BRAND_PRIMARY}12`, border: `1px solid ${BRAND_PRIMARY}30`,
          }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
              💡 Recommendation: Upgrade bandwidth → {formatTraffic(forecast.recommendedUpgradeMbps / 1000)}
            </div>
            <div style={{ fontSize: 11, color: '#ccc' }}>
              At the current growth rate ({forecast.growthRatePctPerMonth}%/mo) capacity will be insufficient
              {exhaustionDate ? ` ${exhaustionDate} by then` : ' soon'}.
            </div>
            <button onClick={onUpgrade} style={{
              marginTop: 8, padding: '8px 16px', borderRadius: 6, border: 'none',
              background: BRAND_PRIMARY, color: '#fff', cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>
              Request {formatTraffic(forecast.recommendedUpgradeMbps / 1000)}
            </button>
          </div>
        )}

        <button onClick={onClose} style={{
          width: '100%', padding: '10px 0', borderRadius: 8,
          border: '1px solid rgba(255,255,255,0.12)', background: 'transparent',
          color: '#999', cursor: 'pointer', fontSize: 13,
        }}>Close</button>
      </div>
    </div>
  );
}

function KpiBlock({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ padding: 10, background: 'rgba(255,255,255,0.04)', borderRadius: 6 }}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}
