/**
 * SLA — SLA reporting and compliance page.
 */

import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import Colors from '@dynatrace/strato-design-tokens/colors';
import Borders from '@dynatrace/strato-design-tokens/borders';
import BoxShadows from '@dynatrace/strato-design-tokens/box-shadows';
import { DEMO_SLA } from '../data/demoData';
import { formatPct, formatDuration } from '../utils';

export function Sla() {
  const sla = DEMO_SLA;

  return (
    <Flex flexDirection="column" gap={16} padding={0}>
      <Heading level={4}>SLA Reporting</Heading>

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
