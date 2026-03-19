/**
 * StatusBanner — prominent health status indicator at top of overview.
 */

import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import Colors from '@dynatrace/strato-design-tokens/colors';
import Borders from '@dynatrace/strato-design-tokens/borders';
import type { HealthStatus } from '../types/network';
import { HEALTH_COLORS } from '../utils';

interface StatusBannerProps {
  status: HealthStatus;
  headline: string;
  reason?: string;
}

export function StatusBanner({ status, headline, reason }: StatusBannerProps) {
  const color = HEALTH_COLORS[status];
  const label = status === 'outage' ? 'Outage' : status === 'degraded' ? 'Degraded' : status === 'healthy' ? 'Operational' : 'Unknown';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 16px',
      background: `${color}18`,
      border: `1px solid ${color}60`,
      borderRadius: Borders.Radius.Container.Default,
    }}>
      <span style={{
        width: 12, height: 12, borderRadius: '50%',
        background: color,
        animation: status === 'outage' ? 'pulse 1.5s infinite' : undefined,
        flexShrink: 0,
      }} />
      <Flex flexDirection="column" gap={2}>
        <Heading level={6} style={{ margin: 0 }}>{headline}</Heading>
        {reason && (
          <Paragraph style={{ margin: 0, fontSize: 12, color: Colors.Text.Neutral.Default }}>
            {reason}
          </Paragraph>
        )}
      </Flex>
      <span style={{
        marginLeft: 'auto',
        padding: '2px 8px',
        borderRadius: 4,
        background: `${color}30`,
        color,
        fontSize: 11,
        fontWeight: 600,
      }}>
        {label}
      </span>
    </div>
  );
}
