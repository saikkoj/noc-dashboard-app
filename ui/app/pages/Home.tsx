/**
 * Home — Overview dashboard. The main landing page.
 *
 * Shows: status banner, KPI strip, geographic cluster map with drill-down, incidents, site health grid.
 */

import React, { useMemo, useCallback } from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Page } from '@dynatrace/strato-components-preview/layouts';
import { useDemoMode } from '../hooks/useDemoMode';
import { useClusterData } from '../hooks/useClusterData';
import { DEMO_OVERVIEW, DEMO_INCIDENTS, DEMO_SITES } from '../data/demoData';
import { StatusBanner } from '../components/StatusBanner';
import { KpiStrip } from '../components/KpiStrip';
import { IncidentList } from '../components/IncidentList';
import { SiteHealthGrid } from '../components/SiteHealthGrid';
import { ClusterMap } from '../components/ClusterMap';
import type { HealthStatus, Site } from '../types/network';

export function Home() {
  const { demoMode } = useDemoMode();
  const cluster = useClusterData();

  // TODO: Wire live data via useDql when demoMode === false
  const overview = DEMO_OVERVIEW;
  const incidents = DEMO_INCIDENTS.filter((i) => i.status !== 'resolved');
  const sites = DEMO_SITES;

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

  // When a site card is clicked, find the matching cluster region and drill in
  const handleSiteClick = useCallback((site: Site) => {
    const region = cluster.regions.find(r =>
      r.label.toLowerCase().includes(site.region.toLowerCase()) ||
      site.region.toLowerCase().includes(r.label.toLowerCase()) ||
      site.name.toLowerCase().includes(r.label.toLowerCase())
    );
    if (region) {
      cluster.selectRegion(region);
      // Scroll the map into view
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

      {/* Geographic cluster map with drill-down */}
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

      {!demoMode && (
        <div style={{ padding: 16, color: '#6b7280', fontSize: 12, textAlign: 'center' }}>
          Live mode: DQL queries will be enabled in future versions.
        </div>
      )}
    </Flex>
  );
}
