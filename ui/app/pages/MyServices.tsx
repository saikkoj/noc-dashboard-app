/**
 * MyServices page — customer service overview with bandwidth gauges and actions.
 */
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import type { CustomerService } from '../types/network';
import {
  DEMO_CUSTOMER_SERVICES,
  DEMO_FORECASTS,
  SERVICE_TYPE_LABELS,
  SERVICE_STATUS_LABELS,
} from '../data/customerData';
import { ServiceCard } from '../components/ServiceCard';
import { BandwidthUpgradeModal } from '../components/BandwidthUpgradeModal';
import { ForecastChart } from '../components/ForecastChart';
import { HEALTH_COLORS, BRAND_PRIMARY, formatTraffic, formatPct, modeBadgeStyle } from '../utils';
import { useDemoMode } from '../hooks/useDemoMode';

export default function MyServices() {
  const { demoMode } = useDemoMode();
  const navigate = useNavigate();
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [upgradeService, setUpgradeService] = useState<CustomerService | null>(null);
  const [forecastService, setForecastService] = useState<CustomerService | null>(null);

  const services = demoMode ? DEMO_CUSTOMER_SERVICES : [];
  const forecasts = demoMode ? DEMO_FORECASTS : [];

  const filtered = useMemo(() => {
    if (typeFilter === 'all') return services;
    return services.filter(s => s.type === typeFilter);
  }, [services, typeFilter]);

  // KPIs
  const totalServices = services.length;
  const activeServices = services.filter(s => s.status === 'active').length;
  const avgSla = services.reduce((sum, s) => sum + s.slaActual, 0) / totalServices;
  const totalMonthlyCost = services.reduce((sum, s) => sum + s.monthlyCostEur, 0);
  const highUsageCount = services.filter(s =>
    s.orderedBandwidthMbps > 0 && (s.currentUsageMbps / s.orderedBandwidthMbps) > 0.75,
  ).length;

  const serviceTypes = Array.from(new Set(services.map(s => s.type)));

  const forecastForService = (svc: CustomerService) => forecasts.find(f => f.serviceId === svc.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header with mode badge */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </div>

      {!demoMode && services.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#888' }}>
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 8 }}>No service data available</div>
          <div style={{ fontSize: 12 }}>Service data is provided in demo mode. Switch to Demo mode to see example data.</div>
        </div>
      ) : (
        <>
      {/* KPI Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
        <KpiCard label="Services" value={`${activeServices}/${totalServices}`} sub="active" color="#3B82F6" />
        <KpiCard label="Avg SLA" value={formatPct(avgSla)} sub="achievement" color={avgSla >= 99.9 ? HEALTH_COLORS.healthy : HEALTH_COLORS.warning} />
        <KpiCard label="High Usage" value={`${highUsageCount}`} sub="services >75%" color={highUsageCount > 0 ? '#fd8232' : HEALTH_COLORS.healthy} />
        <KpiCard label="Forecast Warnings" value={`${forecasts.filter(f => f.daysUntilThreshold80 != null && f.daysUntilThreshold80 < 90 && f.daysUntilThreshold80 > 0).length}`} sub="under 90 days" color="#fd8232" />
        <KpiCard label="Monthly Cost" value={`${totalMonthlyCost.toLocaleString('en-US')} €`} sub="total" color="#ccc" />
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#888', marginRight: 4 }}>Type:</span>
        <FilterBtn label="All" active={typeFilter === 'all'} onClick={() => setTypeFilter('all')} count={services.length} />
        {serviceTypes.map(t => (
          <FilterBtn key={t} label={SERVICE_TYPE_LABELS[t]} active={typeFilter === t} onClick={() => setTypeFilter(t)}
            count={services.filter(s => s.type === t).length} />
        ))}
      </div>

      {/* Service grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320, 1fr))', gap: 14 }}>
        {filtered.map(svc => (
          <ServiceCard
            key={svc.id}
            service={svc}
            forecast={forecastForService(svc)}
            onUpgrade={s => setUpgradeService(s)}
            onOpenTicket={() => navigate('/tickets')}
            onViewForecast={s => setForecastService(s)}
          />
        ))}
      </div>

      {/* Modals */}
      {upgradeService && (
        <BandwidthUpgradeModal
          service={upgradeService}
          onClose={() => setUpgradeService(null)}
          onSubmit={() => setUpgradeService(null)}
        />
      )}
      {forecastService && forecastForService(forecastService) && (
        <ForecastChart
          service={forecastService}
          forecast={forecastForService(forecastService)!}
          onClose={() => setForecastService(null)}
          onUpgrade={() => {
            const svc = forecastService;
            setForecastService(null);
            setUpgradeService(svc);
          }}
        />
      )}
        </>
      )}
    </div>
  );
}

function KpiCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div style={{
      padding: 14, borderRadius: 10, background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.06)',
    }}>
      <div style={{ fontSize: 10, color: '#888', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>{sub}</div>
    </div>
  );
}

function FilterBtn({ label, active, onClick, count }: { label: string; active: boolean; onClick: () => void; count: number }) {
  return (
    <button onClick={onClick} style={{
      padding: '4px 12px', borderRadius: 14, cursor: 'pointer', fontSize: 11,
      border: active ? '1px solid #3B82F6' : '1px solid rgba(255,255,255,0.1)',
      background: active ? 'rgba(59,130,246,0.12)' : 'transparent',
      color: active ? '#3B82F6' : '#888',
    }}>
      {label} ({count})
    </button>
  );
}
