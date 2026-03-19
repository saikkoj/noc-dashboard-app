/**
 * useClusterData — geographic cluster view (regions → sites → devices).
 */
import { useMemo, useState, useCallback } from 'react';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { useDemoMode } from './useDemoMode';
import { useTimeframe } from './useTimeframe';
import { NETWORK_QUERIES } from '../data/networkQueries';
import { DEMO_REGIONS, DEMO_CLUSTER_SITES } from '../data/demoData';
import type { TopologyCluster, TopologySite, DrillDownLevel, HealthSummary } from '../types/network';
import { toNum, mapLocationToCity } from '../utils';

export interface UseClusterDataResult {
  level: DrillDownLevel;
  regions: TopologyCluster[];
  sites: TopologySite[];
  selectedRegion: TopologyCluster | null;
  selectRegion: (r: TopologyCluster | null) => void;
  resetDrillDown: () => void;
  isLoading: boolean;
  error: string | null;
}

const REGION_COORDS: Record<string, { lat: number; lon: number }> = {
  'New York': { lat: 40.71, lon: -74.01 },
  Boston: { lat: 42.36, lon: -71.06 },
  Chicago: { lat: 41.88, lon: -87.63 },
  Denver: { lat: 39.74, lon: -104.99 },
  Atlanta: { lat: 33.75, lon: -84.39 },
  Seattle: { lat: 47.61, lon: -122.33 },
  Dallas: { lat: 32.78, lon: -96.80 },
  Phoenix: { lat: 33.45, lon: -112.07 },
  Sydney: { lat: -33.87, lon: 151.21 },
  Melbourne: { lat: -37.81, lon: 144.96 },
  Auckland: { lat: -36.85, lon: 174.76 },
  Wellington: { lat: -41.29, lon: 174.78 },
};

function groupByRegion(records: Record<string, unknown>[]): TopologyCluster[] {
  const map = new Map<string, { lat: number; lon: number; devices: number; healthy: number; warning: number; critical: number; cpu: number[]; mem: number[] }>();
  for (const rec of records) {
    const loc = String(rec['devSysLocation'] ?? rec['location'] ?? '');
    const region = mapLocationToCity(loc) || 'Unknown';
    const entry = map.get(region) ?? { lat: 0, lon: 0, devices: 0, healthy: 0, warning: 0, critical: 0, cpu: [], mem: [] };
    entry.devices += 1;
    const problems = toNum(rec['problems']);
    if (problems >= 3) entry.critical++;
    else if (problems >= 1) entry.warning++;
    else entry.healthy++;
    entry.cpu.push(toNum(rec['cpu']));
    entry.mem.push(toNum(rec['memory']));
    if (entry.lat === 0) {
      entry.lat = toNum(rec['latitude']);
      entry.lon = toNum(rec['longitude']);
    }
    map.set(region, entry);
  }

  let idx = 0;
  return Array.from(map.entries()).map(([name, v]) => {
    const coords = REGION_COORDS[name] ?? { lat: v.lat || 61.5, lon: v.lon || 25.5 };
    const healthSummary: HealthSummary = { healthy: v.healthy, warning: v.warning, critical: v.critical, unknown: 0 };
    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
    return {
      id: `region-live-${idx++}`,
      label: name,
      x: 0,
      y: 0,
      lat: coords.lat,
      lon: coords.lon,
      deviceCount: v.devices,
      healthSummary,
      avgCpu: Math.round(avg(v.cpu)),
      avgMemory: Math.round(avg(v.mem)),
      alertCount: v.critical + v.warning,
    };
  });
}

export function useClusterData(): UseClusterDataResult {
  const { demoMode } = useDemoMode();
  const { dqlTimeframe } = useTimeframe();
  const [selectedRegion, setSelectedRegion] = useState<TopologyCluster | null>(null);

  const clusterResult = useDql(
    {
      query: NETWORK_QUERIES.clusterDevices,
      defaultTimeframeStart: dqlTimeframe.defaultTimeframeStart,
      defaultTimeframeEnd: dqlTimeframe.defaultTimeframeEnd,
    },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );

  const liveRegions = useMemo<TopologyCluster[]>(() => {
    if (demoMode || !clusterResult.data?.records) return [];
    return groupByRegion(clusterResult.data.records as Record<string, unknown>[]);
  }, [demoMode, clusterResult.data]);

  const regions = demoMode ? DEMO_REGIONS : liveRegions;

  const sites = useMemo<TopologySite[]>(() => {
    if (!selectedRegion) return [];
    if (demoMode) return DEMO_CLUSTER_SITES[selectedRegion.id] ?? [];
    if (!clusterResult.data?.records) return [];
    let idx = 0;
    return (clusterResult.data.records as Record<string, unknown>[])
      .filter(r => {
        const loc = String(r['devSysLocation'] ?? r['location'] ?? '');
        return mapLocationToCity(loc) === selectedRegion.label;
      })
      .map(r => {
        const problems = toNum(r['problems']);
        const hs: HealthSummary = problems >= 3
          ? { healthy: 0, warning: 0, critical: 1, unknown: 0 }
          : problems >= 1
            ? { healthy: 0, warning: 1, critical: 0, unknown: 0 }
            : { healthy: 1, warning: 0, critical: 0, unknown: 0 };
        return {
          id: `site-live-${idx++}`,
          label: String(r['entity.name'] ?? r['name'] ?? 'Unknown'),
          type: 'office' as const,
          deviceCount: 1,
          healthSummary: hs,
        };
      });
  }, [selectedRegion, demoMode, clusterResult.data]);

  const level: DrillDownLevel = selectedRegion ? 'site' : 'region';

  const selectRegion = useCallback((r: TopologyCluster | null) => setSelectedRegion(r), []);
  const resetDrillDown = useCallback(() => setSelectedRegion(null), []);

  return {
    level,
    regions,
    sites,
    selectedRegion,
    selectRegion,
    resetDrillDown,
    isLoading: !demoMode && clusterResult.isLoading,
    error: clusterResult.error?.message ?? null,
  };
}
