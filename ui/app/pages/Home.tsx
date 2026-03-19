/**
 * Home — Overview dashboard. The main landing page.
 *
 * Shows: status banner, KPI strip, geographic cluster map with drill-down, incidents, site health grid.
 */

import React, { useMemo, useCallback } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Page } from '@dynatrace/strato-components-preview/layouts';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';
import { useClusterData } from '../hooks/useClusterData';
import { NETWORK_QUERIES } from '../data/networkQueries';
import { DEMO_OVERVIEW, DEMO_INCIDENTS, DEMO_SITES } from '../data/demoData';
import { StatusBanner } from '../components/StatusBanner';
import { KpiStrip } from '../components/KpiStrip';
import { IncidentList } from '../components/IncidentList';
import { SiteHealthGrid } from '../components/SiteHealthGrid';
import { ClusterMap } from '../components/ClusterMap';
import type { HealthStatus, Site, OverviewKpi, Incident, DavisProblemSeverity } from '../types/network';
import { toNum, mapLocationToCity } from '../utils';

function mapSeverityToIncident(sev: string): Incident['severity'] {
  switch (sev) {
    case 'AVAILABILITY': return 'critical';
    case 'ERROR': return 'major';
    case 'RESOURCE': return 'major';
    case 'SLOWDOWN': return 'minor';
    default: return 'info';
  }
}

export function Home() {
  const { demoMode } = useDemoMode();
  const { dqlTimeframe } = useTimeframe();
  const cluster = useClusterData();

  /* ── Live DQL: availability KPI ─── */
  const availResult = useDql(
    { query: NETWORK_QUERIES.overviewAvailability, defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart, defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );

  /* ── Live DQL: latency KPI ─── */
  const latencyResult = useDql(
    { query: NETWORK_QUERIES.overviewLatency, defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart, defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );

  /* ── Live DQL: Davis problems → incidents ─── */
  const problemsResult = useDql(
    { query: NETWORK_QUERIES.davisProblems, defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart, defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd },
    { enabled: !demoMode, refetchInterval: 30_000 },
  );

  /* ── Live DQL: sites from devices ─── */
  const sitesResult = useDql(
    { query: NETWORK_QUERIES.overviewSites, defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart, defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );

  const liveIncidents = useMemo<Incident[]>(() => {
    if (demoMode || !problemsResult.data?.records) return [];
    return (problemsResult.data.records as Record<string, unknown>[]).map(r => {
      const mz = Array.isArray(r['managementZone'])
        ? (r['managementZone'] as unknown[]).join(', ')
        : r['managementZone'] ? String(r['managementZone']) : undefined;
      return {
        id: String(r['problemId'] ?? ''),
        title: String(r['title'] ?? ''),
        severity: mapSeverityToIncident(String(r['severity'] ?? '')),
        status: 'open' as const,
        impactSummary: mz ? `Management zone: ${mz}` : String(r['title'] ?? ''),
        createdAt: String(r['startTime'] ?? new Date().toISOString()),
        updatedAt: String(r['startTime'] ?? new Date().toISOString()),
      };
    });
  }, [demoMode, problemsResult.data]);

  const liveSites = useMemo<Site[]>(() => {
    if (demoMode || !sitesResult.data?.records) return [];
    const cityMap = new Map<string, { devices: number; problems: number }>();
    for (const r of sitesResult.data.records as Record<string, unknown>[]) {
      const name = String(r['deviceName'] ?? '');
      const city = mapLocationToCity(name) || 'Unknown';
      const entry = cityMap.get(city) ?? { devices: 0, problems: 0 };
      entry.devices++;
      entry.problems += toNum(r['problems']);
      cityMap.set(city, entry);
    }
    return Array.from(cityMap.entries()).map(([city, v]) => ({
      id: `site-live-${city}`,
      name: city,
      region: city,
      latitude: 0,
      longitude: 0,
      health: (v.problems >= 3 ? 'outage' : v.problems >= 1 ? 'degraded' : 'healthy') as HealthStatus,
      deviceCount: v.devices,
      circuitCount: 0,
    }));
  }, [demoMode, sitesResult.data]);

  const liveOverview = useMemo<OverviewKpi | null>(() => {
    if (demoMode) return null;
    const avail = toNum((availResult.data?.records?.[0] as any)?.avgAvailability ?? 0);
    const p50 = toNum((latencyResult.data?.records?.[0] as any)?.p50 ?? 0);
    const p95 = toNum((latencyResult.data?.records?.[0] as any)?.p95 ?? 0);
    const openCount = liveIncidents.length;
    return {
      availability: { value: avail || 100, unit: '%', ranges: { '1h': avail || 100, '24h': avail || 100, '7d': avail || 100, '30d': avail || 100 } },
      latencyP50Ms: p50,
      latencyP95Ms: p95,
      packetLossPct: 0,
      jitterMs: 0,
      incidents: { open: openCount, acknowledged: 0, resolved: 0 },
      slaCompliancePct: avail || 100,
      topImpactedSites: [],
      topImpactedServices: [],
    };
  }, [demoMode, availResult.data, latencyResult.data, liveIncidents]);

  const overview = demoMode ? DEMO_OVERVIEW : (liveOverview ?? DEMO_OVERVIEW);
  const incidents = demoMode
    ? DEMO_INCIDENTS.filter((i) => i.status !== 'resolved')
    : liveIncidents;
  const sites = demoMode ? DEMO_SITES : liveSites;

  const overallHealth: HealthStatus = useMemo(() => {
    if (incidents.some((i) => i.severity === 'critical')) return 'outage';
    if (incidents.length > 0) return 'degraded';
    return 'healthy';
  }, [incidents]);

  const headline =
    overallHealth === 'outage'
      ? `${overview.incidents.open} open incident — critical`
      : overallHealth === 'degraded'
        ? `${overview.incidents.open} open incident — degraded performance`
        : 'All network services operational';

  const handleSiteClick = useCallback((site: Site) => {
    const region = cluster.regions.find(r =>
      r.label.toLowerCase().includes(site.region.toLowerCase()) ||
      site.region.toLowerCase().includes(r.label.toLowerCase()) ||
      site.name.toLowerCase().includes(r.label.toLowerCase())
    );
    if (region) {
      cluster.selectRegion(region);
      document.getElementById('cluster-map-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [cluster]);

  return (
    <Flex flexDirection="column" gap={16} padding={0}>
      <StatusBanner
        status={overallHealth}
        headline={headline}
        reason={overallHealth !== 'healthy' ? incidents[0]?.impactSummary : undefined}
      />

      <KpiStrip overview={overview} />

      <div id="cluster-map-section" style={{ height: 500, borderRadius: 8, overflow: 'hidden' }}>
        <ClusterMap
          regions={cluster.regions}
          sites={cluster.sites}
          selectedRegion={cluster.selectedRegion}
          onSelectRegion={cluster.selectRegion}
          onBack={cluster.resetDrillDown}
        />
      </div>

      <Flex gap={24} flexWrap="wrap">
        <Flex flexDirection="column" gap={8} style={{ flex: '1 1 400px', minWidth: 0 }}>
          <IncidentList incidents={incidents} />
        </Flex>
        <Flex flexDirection="column" gap={8} style={{ flex: '1 1 300px', minWidth: 0 }}>
          <SiteHealthGrid sites={sites} onSiteClick={handleSiteClick} />
        </Flex>
      </Flex>
    </Flex>
  );
}
