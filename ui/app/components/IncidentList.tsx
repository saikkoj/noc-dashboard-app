/**
 * IncidentList — table of active incidents with severity badges.
 */

import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading } from '@dynatrace/strato-components/typography';
import Colors from '@dynatrace/strato-design-tokens/colors';
import Borders from '@dynatrace/strato-design-tokens/borders';
import type { Incident, Severity } from '../types/network';
import { SEVERITY_COLORS, formatAge } from '../utils';

interface IncidentListProps {
  incidents: Incident[];
  title?: string;
}

const statusLabel: Record<string, string> = {
  open: 'Open',
  acknowledged: 'Acknowledged',
  resolved: 'Resolved',
};

function SeverityBadge({ severity }: { severity: Severity }) {
  const color = SEVERITY_COLORS[severity];
  return (
    <span style={{
      padding: '1px 6px',
      borderRadius: 3,
      background: `${color}30`,
      color,
      fontSize: 10,
      fontWeight: 700,
      textTransform: 'uppercase',
    }}>
      {severity}
    </span>
  );
}

export function IncidentList({ incidents, title = 'Open Incidents' }: IncidentListProps) {
  return (
    <Flex flexDirection="column" gap={8}>
      <Heading level={6}>{title} ({incidents.length})</Heading>
      {incidents.length === 0 ? (
        <div style={{ color: '#6b7280', fontSize: 13 }}>No open incidents.</div>
      ) : (
        <Flex flexDirection="column" gap={6}>
          {incidents.map((inc) => (
            <div key={inc.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px',
              background: Colors.Background.Surface.Default,
              border: `1px solid ${Colors.Border.Neutral.Default}`,
              borderRadius: Borders.Radius.Container.Default,
            }}>
              <SeverityBadge severity={inc.severity} />
              <Flex flexDirection="column" gap={2} style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inc.title}
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {inc.siteName ?? inc.serviceName ?? '—'} · {inc.impactSummary}
                </span>
              </Flex>
              <span style={{
                padding: '1px 6px', borderRadius: 3,
                background: Colors.Background.Surface.Default,
                border: `1px solid ${Colors.Border.Neutral.Default}`,
                fontSize: 10, fontWeight: 500,
              }}>
                {statusLabel[inc.status] ?? inc.status}
              </span>
              <span style={{ fontSize: 11, color: '#6b7280', whiteSpace: 'nowrap' }}>
                {formatAge(inc.createdAt)}
              </span>
            </div>
          ))}
        </Flex>
      )}
    </Flex>
  );
}
