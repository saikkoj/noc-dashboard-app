/**
 * Forecasts page — bandwidth capacity forecasts for all services.
 */
import React, { useState } from 'react';
import type { CustomerService, BandwidthForecast } from '../types/network';
import {
  DEMO_CUSTOMER_SERVICES,
  DEMO_FORECASTS,
  SERVICE_TYPE_LABELS,
} from '../data/customerData';
import { BandwidthUpgradeModal } from '../components/BandwidthUpgradeModal';
import { ForecastChart } from '../components/ForecastChart';
import { HEALTH_COLORS, formatTraffic, formatPct, modeBadgeStyle } from '../utils';
import { useDemoMode } from '../hooks/useDemoMode';

export default function Forecasts() {
  const { demoMode } = useDemoMode();
  const [selectedSvc, setSelectedSvc] = useState<CustomerService | null>(null);
  const [upgradeService, setUpgradeService] = useState<CustomerService | null>(null);

  const services = demoMode
    ? DEMO_CUSTOMER_SERVICES.filter(s => s.orderedBandwidthMbps > 0)
    : [];
  const forecasts = demoMode ? DEMO_FORECASTS : [];

  const getForecast = (svcId: string) => forecasts.find(f => f.serviceId === svcId);

  // Sort by urgency (days until threshold)
  const sorted = [...services].sort((a, b) => {
    const fa = getForecast(a.id);
    const fb = getForecast(b.id);
    const da = fa?.daysUntilThreshold80 ?? 999;
    const db = fb?.daysUntilThreshold80 ?? 999;
    return da - db;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#fff' }}>Capacity Forecasts</div>
          <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>AI-based bandwidth usage forecast for your services</div>
        </div>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </div>

      {!demoMode && services.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No forecast data available</div>
          <div style={{ fontSize: 12 }}>Forecast data is provided in demo mode. Switch to Demo mode to see example data.</div>
        </div>
      ) : (
        <>
      {/* Forecast table */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {/* Header row */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 80px', gap: 8,
          padding: '8px 12px', fontSize: 10, fontWeight: 600, color: '#666',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span>Service</span>
          <span>Subscribed</span>
          <span>Usage</span>
          <span>Growth/mo</span>
          <span>80% Threshold</span>
          <span>Capacity Exhausted</span>
          <span></span>
        </div>

        {sorted.map(svc => {
          const fc = getForecast(svc.id);
          const usagePct = (svc.currentUsageMbps / svc.orderedBandwidthMbps) * 100;
          const days80 = fc?.daysUntilThreshold80;
          const days95 = fc?.daysUntilThreshold95;
          const growth = fc?.growthRatePctPerMonth;

          return (
            <button
              key={svc.id}
              onClick={() => setSelectedSvc(svc)}
              style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 80px', gap: 8, alignItems: 'center',
                padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                background: 'rgba(255,255,255,0.02)', border: '1px solid transparent',
                textAlign: 'left', fontSize: 12, color: '#ccc', width: '100%',
              }}
            >
              <div>
                <div style={{ fontWeight: 600 }}>{svc.name}</div>
                <div style={{ fontSize: 10, color: '#666' }}>{SERVICE_TYPE_LABELS[svc.type]}</div>
              </div>
              <span>{formatTraffic(svc.orderedBandwidthMbps / 1000)}</span>
              <span style={{
                color: usagePct > 85 ? '#dc172a' : usagePct > 70 ? '#fd8232' : HEALTH_COLORS.healthy,
              }}>{usagePct.toFixed(0)}%</span>
              <span style={{ color: '#3B82F6' }}>{growth != null ? `${growth.toFixed(1)}%` : '—'}</span>
              <span style={{
                color: days80 != null && days80 > 0 
                  ? days80 < 60 ? '#dc172a' : days80 < 120 ? '#fd8232' : HEALTH_COLORS.healthy 
                  : days80 === 0 ? '#dc172a' : '#666',
              }}>
                {days80 != null && days80 > 0 ? `${days80} days` : days80 === 0 ? 'Exceeded' : '—'}
              </span>
              <span style={{
                color: days95 != null && days95 > 0
                  ? days95 < 90 ? '#dc172a' : days95 < 180 ? '#fd8232' : '#666'
                  : '#666',
              }}>
                {days95 != null && days95 > 0 ? `${days95} days` : '—'}
              </span>
              <span style={{ textAlign: 'right' }}>
                {fc?.recommendedUpgradeMbps && (
                  <span style={{
                    padding: '2px 8px', borderRadius: 10, fontSize: 10,
                    background: 'rgba(59,130,246,0.15)', color: '#3B82F6',
                  }}>Upgrade</span>
                )}
              </span>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, fontSize: 10, color: '#666' }}>
        <span>🟢 Sufficient (&gt;120 days)</span>
        <span style={{ color: '#fd8232' }}>🟠 Monitor (60–120 days)</span>
        <span style={{ color: '#dc172a' }}>🔴 Critical (&lt;60 days)</span>
      </div>

      {/* Forecast modal */}
      {selectedSvc && getForecast(selectedSvc.id) && (
        <ForecastChart
          service={selectedSvc}
          forecast={getForecast(selectedSvc.id)!}
          onClose={() => setSelectedSvc(null)}
          onUpgrade={() => {
            const svc = selectedSvc;
            setSelectedSvc(null);
            setUpgradeService(svc);
          }}
        />
      )}

      {upgradeService && (
        <BandwidthUpgradeModal
          service={upgradeService}
          onClose={() => setUpgradeService(null)}
          onSubmit={() => setUpgradeService(null)}
        />
      )}
        </>
      )}
    </div>
  );
}
