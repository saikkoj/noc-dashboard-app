/**
 * KpiStrip — horizontal row of KPI cards for the overview page.
 */

import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import Colors from '@dynatrace/strato-design-tokens/colors';
import Borders from '@dynatrace/strato-design-tokens/borders';
import BoxShadows from '@dynatrace/strato-design-tokens/box-shadows';
import type { HealthStatus, OverviewKpi } from '../types/network';
import { HEALTH_COLORS, formatPct, formatMs } from '../utils';

interface KpiCardProps {
  label: string;
  value: string;
  health?: HealthStatus;
}

function KpiCard({ label, value, health }: KpiCardProps) {
  const borderColor = health ? `${HEALTH_COLORS[health]}80` : Colors.Border.Neutral.Default;
  return (
    <div style={{
      flex: '1 1 0',
      minWidth: 160,
      padding: 16,
      background: Colors.Background.Surface.Default,
      border: `1px solid ${borderColor}`,
      borderRadius: Borders.Radius.Container.Default,
      boxShadow: BoxShadows.Surface.Raised.Rest,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#9ca3af', marginBottom: 4 }}>
        {label}
      </div>
      <div style={{ fontSize: 24, fontWeight: 700 }}>{value}</div>
    </div>
  );
}

interface KpiStripProps {
  overview: OverviewKpi;
}

export function KpiStrip({ overview }: KpiStripProps) {
  const availHealth: HealthStatus = overview.availability.value >= 99.9 ? 'healthy' : overview.availability.value >= 99 ? 'degraded' : 'outage';
  const lossHealth: HealthStatus = overview.packetLossPct < 0.1 ? 'healthy' : overview.packetLossPct < 1 ? 'degraded' : 'outage';
  const slaHealth: HealthStatus = overview.slaCompliancePct >= 99.9 ? 'healthy' : overview.slaCompliancePct >= 99 ? 'degraded' : 'outage';

  return (
    <Flex gap={12} flexWrap="wrap">
      <KpiCard label="Saatavuus" value={formatPct(overview.availability.value)} health={availHealth} />
      <KpiCard label="Viive (p50)" value={formatMs(overview.latencyP50Ms)} />
      <KpiCard label="Viive (p95)" value={formatMs(overview.latencyP95Ms)} />
      <KpiCard label="Packet Loss" value={formatPct(overview.packetLossPct)} health={lossHealth} />
      <KpiCard label="Jitter" value={formatMs(overview.jitterMs)} />
      <KpiCard label="SLA" value={formatPct(overview.slaCompliancePct)} health={slaHealth} />
    </Flex>
  );
}
