/**
 * Incidents — full incident management page with filtering.
 */

import React, { useMemo } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading, Paragraph } from '@dynatrace/strato-components/typography';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { IncidentList } from '../components/IncidentList';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';
import { NETWORK_QUERIES } from '../data/networkQueries';
import { DEMO_INCIDENTS } from '../data/demoData';
import type { Incident } from '../types/network';
import { modeBadgeStyle } from '../utils';

function mapSeverity(sev: string): Incident['severity'] {
  switch (sev) {
    case 'AVAILABILITY': return 'critical';
    case 'ERROR': return 'major';
    case 'RESOURCE': return 'major';
    case 'SLOWDOWN': return 'minor';
    default: return 'info';
  }
}

function mapStatus(status: string): Incident['status'] {
  if (status === 'OPEN') return 'open';
  return 'resolved';
}

export function Incidents() {
  const { demoMode } = useDemoMode();
  const { dqlTimeframe } = useTimeframe();

  const result = useDql(
    {
      query: NETWORK_QUERIES.incidentsAll,
      defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart,
      defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd,
    },
    { enabled: !demoMode, refetchInterval: 30_000 },
  );

  const liveIncidents = useMemo<Incident[]>(() => {
    if (demoMode || !result.data?.records) return [];
    return (result.data.records as Record<string, unknown>[]).map(r => {
      const mz = Array.isArray(r['managementZone'])
        ? (r['managementZone'] as unknown[]).join(', ')
        : r['managementZone'] ? String(r['managementZone']) : undefined;
      return {
        id: String(r['problemId'] ?? ''),
        title: String(r['title'] ?? ''),
        severity: mapSeverity(String(r['severity'] ?? '')),
        status: mapStatus(String(r['status'] ?? 'OPEN')),
        siteName: mz,
        impactSummary: mz ? `Management zone: ${mz}` : String(r['title'] ?? ''),
        createdAt: String(r['startTime'] ?? new Date().toISOString()),
        updatedAt: String(r['startTime'] ?? new Date().toISOString()),
        resolvedAt: r['endTime'] ? String(r['endTime']) : undefined,
      };
    });
  }, [demoMode, result.data]);

  const incidents = demoMode ? DEMO_INCIDENTS : liveIncidents;

  return (
    <Flex flexDirection="column" gap={16} padding={0}>
      <Flex alignItems="center" justifyContent="space-between">
        <Heading level={4}>Incidents</Heading>
        <span style={modeBadgeStyle(demoMode)}>{demoMode ? 'DEMO' : 'LIVE'}</span>
      </Flex>
      <Paragraph>Incident management with filtering and status updates.</Paragraph>
      <IncidentList
        incidents={incidents}
        title="All Incidents"
      />
    </Flex>
  );
}
