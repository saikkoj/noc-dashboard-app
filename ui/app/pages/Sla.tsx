/**
 * SLA — SLA reporting and compliance page.
 */

import React, { useMemo } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import Colors from '@dynatrace/strato-design-tokens/colors';
import Borders from '@dynatrace/strato-design-tokens/borders';
import BoxShadows from '@dynatrace/strato-design-tokens/box-shadows';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';
import { NETWORK_QUERIES } from '../data/networkQueries';
import { DEMO_SLA } from '../data/demoData';
import type { SlaReport } from '../types/network';
import { formatPct, formatDuration, toNum, mapLocationToCity, modeBadgeStyle } from '../utils';

export function Sla() {
  const { demoMode } = useDemoMode();
  const { dqlTimeframe } = useTimeframe();

  const slaResult = useDql(
    {
      query: NETWORK_QUERIES.slaOverview,
      defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart,
      defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd,
    },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );

  const liveSla = useMemo<SlaReport | null>(() => {
    if (demoMode || !slaResult.data?.records) return null;
    const records = slaResult.data.records as Record<string, unknown>[];
    if (records.length === 0) return null;

    const reachabilities = records.map(r => toNum(r['reachPct']));
    const avgReach = reachabilities.reduce((a, b) => a + b, 0) / reachabilities.length;

    // Estimate downtime: (1 - availability/100) * total minutes in timeframe
    const totalMinutes = 30 * 24 * 60; // approx month
    const downtimeMinutes = Math.round((1 - avgReach / 100) * totalMinutes);

    // Top contributors — devices with lowest reachability
    const topContributors = records
      .filter(r => toNum(r['reachPct']) < 100)
      .sort((a, b) => toNum(a['reachPct']) - toNum(b['reachPct']))
      .slice(0, 5)
      .map(r => {
        const name = String(r['deviceName'] ?? '');
        const reach = toNum(r['reachPct']);
        const deviceDowntime = Math.round((1 - reach / 100) * totalMinutes);
        return {
          siteId: String(r['id'] ?? ''),
          siteName: mapLocationToCity(name) || name,
          downtimeMinutes: deviceDowntime,
        };
      });

    const now = new Date();
    return {
      month: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`,
      compliancePct: avgReach,
      downtimeMinutes,
      topContributors,
    };
  }, [demoMode, slaResult.data]);

  const sla = demoMode ? DEMO_SLA : (liveSla ?? { month: '', compliancePct: 0, downtimeMinutes: 0, topContributors: [] });

  return (
    <Flex flexDirection="column" gap={16} padding={0}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={4}>SLA Reporting</Heading>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </Flex>

      <Flex gap={12} flexWrap="wrap">
        <div style={{
          flex: '1 1 200px', padding: 16,
          background: Colors.Background.Surface.Default,
          border: `1px solid ${Colors.Border.Neutral.Default}`,
          borderRadius: Borders.Radius.Container.Default,
          boxShadow: BoxShadows.Surface.Raised.Rest,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
            Compliance
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: sla.compliancePct >= 99.9 ? '#2ab06f' : '#fd8232' }}>
            {formatPct(sla.compliancePct)}
          </div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Month: {sla.month}</div>
        </div>

        <div style={{
          flex: '1 1 200px', padding: 16,
          background: Colors.Background.Surface.Default,
          border: `1px solid ${Colors.Border.Neutral.Default}`,
          borderRadius: Borders.Radius.Container.Default,
          boxShadow: BoxShadows.Surface.Raised.Rest,
        }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', color: '#9ca3af', marginBottom: 4 }}>
            Downtime
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{formatDuration(sla.downtimeMinutes)}</div>
          <div style={{ fontSize: 11, color: '#6b7280' }}>Total this month</div>
        </div>
      </Flex>

      <Heading level={6}>Top contributors</Heading>
      <Flex flexDirection="column" gap={6}>
        {sla.topContributors.map((c) => (
          <Flex key={c.siteId} alignItems="center" gap={8} style={{
            padding: '6px 12px',
            background: Colors.Background.Surface.Default,
            border: `1px solid ${Colors.Border.Neutral.Default}`,
            borderRadius: Borders.Radius.Container.Default,
          }}>
            <span style={{ fontSize: 13, fontWeight: 500 }}>{c.siteName}</span>
            <span style={{ marginLeft: 'auto', fontSize: 12, color: '#dc172a' }}>
              {formatDuration(c.downtimeMinutes)} downtime
            </span>
          </Flex>
        ))}
      </Flex>
    </Flex>
  );
}
