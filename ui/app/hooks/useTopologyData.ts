/**
 * useTopologyData — fetches topology nodes + edges from DQL or demo data.
 */
import { useMemo } from 'react';
import { useDql } from '@dynatrace-sdk/react-hooks';
import { useDemoMode } from './useDemoMode';
import { useTimeframe } from './useTimeframe';
import { NETWORK_QUERIES } from '../data/networkQueries';
import { DEMO_TOPOLOGY_NODES, DEMO_TOPOLOGY_EDGES } from '../data/demoData';
import type { TopologyNode, TopologyEdge, DeviceRole, TopologyEdgeType } from '../types/network';
import { toNum, mapLocationToCity } from '../utils';
import { computeLayout, scaleNodesToFit, type LayoutMode } from '../utils/layoutEngine';

function mapDeviceRole(raw: unknown): DeviceRole {
  const s = (Array.isArray(raw) ? raw.join(' ') : String(raw ?? '')).toLowerCase();
  if (s.includes('router')) return 'router';
  if (s.includes('switch') || s.includes('catalyst')) return 'switch';
  if (s.includes('firewall') || s.includes('palo') || s.includes('fortinet')) return 'firewall';
  if (s.includes('cloud') || s.includes('gateway') || s.includes('tgw')) return 'cloud-gw';
  if (s.includes('server') || s.includes('host')) return 'server';
  return 'router';
}

function mapHealth(raw: unknown, problems: number): TopologyNode['health'] {
  const s = String(raw ?? '').toLowerCase();
  if (problems >= 3) return 'critical';
  if (problems >= 1) return 'warning';
  if (s === 'ok' || s === 'healthy' || s === '') return 'healthy';
  if (s === 'warning' || s === 'degraded') return 'warning';
  if (s === 'critical' || s === 'error' || s === 'down') return 'critical';
  return 'unknown';
}

export interface UseTopologyDataResult {
  nodes: TopologyNode[];
  edges: TopologyEdge[];
  edgeCounts: Record<TopologyEdgeType, number>;
  isLoading: boolean;
  error: string | null;
}

function mergeEdges(
  lldpEdges: TopologyEdge[],
  bgpEdges: TopologyEdge[],
  flowEdges: TopologyEdge[],
  runsOnEdges: TopologyEdge[] = [],
  callsEdges: TopologyEdge[] = [],
  servesEdges: TopologyEdge[] = [],
): TopologyEdge[] {
  const seen = new Set<string>();
  const edgeKey = (a: string, b: string, t: string) => `${[a, b].sort().join('↔')}:${t}`;
  const result: TopologyEdge[] = [];

  const addAll = (edges: TopologyEdge[], type: TopologyEdgeType) => {
    for (const e of edges) {
      const k = edgeKey(e.source, e.target, type);
      if (!seen.has(k)) { seen.add(k); result.push({ ...e, edgeType: type }); }
    }
  };

  addAll(lldpEdges, 'lldp');
  addAll(bgpEdges, 'bgp');
  addAll(flowEdges, 'flow');
  addAll(runsOnEdges, 'runs-on');
  addAll(callsEdges, 'calls');
  addAll(servesEdges, 'serves');
  return result;
}

export function useTopologyData(
  width = 960,
  height = 540,
  layoutMode: LayoutMode = 'force',
): UseTopologyDataResult {
  const { demoMode } = useDemoMode();
  const { dqlTimeframe } = useTimeframe();

  const tfStart = dqlTimeframe.defaultTimeframeStart;
  const tfEnd = dqlTimeframe.defaultTimeframeEnd;

  const nodesResult = useDql(
    { query: NETWORK_QUERIES.topologyNodes, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );

  const lldpEdgesResult = useDql(
    { query: NETWORK_QUERIES.topologyEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );

  const bgpEdgesResult = useDql(
    { query: NETWORK_QUERIES.topologyBgpEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );

  const flowEdgesResult = useDql(
    { query: NETWORK_QUERIES.topologyFlowEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );

  const locResult = useDql(
    { query: NETWORK_QUERIES.deviceLocations },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );

  /* ── Smartscape entity queries ── */
  const hostsResult = useDql(
    { query: NETWORK_QUERIES.hosts, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );
  const pgResult = useDql(
    { query: NETWORK_QUERIES.processGroups, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );
  const svcResult = useDql(
    { query: NETWORK_QUERIES.services, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );
  const appResult = useDql(
    { query: NETWORK_QUERIES.applications, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 60_000 },
  );

  /* ── Cross-layer edge queries ── */
  const hostDeviceEdgesResult = useDql(
    { query: NETWORK_QUERIES.hostToDeviceEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );
  const pgHostEdgesResult = useDql(
    { query: NETWORK_QUERIES.processToHostEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );
  const svcCallEdgesResult = useDql(
    { query: NETWORK_QUERIES.serviceCallEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );
  const svcPgEdgesResult = useDql(
    { query: NETWORK_QUERIES.serviceToProcessEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );
  const appSvcEdgesResult = useDql(
    { query: NETWORK_QUERIES.appToServiceEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );

  const sysLocationByName = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of (locResult.data?.records ?? [])) {
      const rec = r as Record<string, unknown>;
      const name = String(rec['name'] ?? '');
      const loc = String(rec['devSysLocation'] ?? '').replace(/^null$/i, '');
      if (name && loc) map.set(name, loc);
    }
    return map;
  }, [locResult.data]);

  const liveData = useMemo(() => {
    if (demoMode) return null;
    const nodeRecords = nodesResult.data?.records;
    if (!nodeRecords) return null;

    /* ── Network-device nodes ── */
    const rawNodes: Omit<TopologyNode, 'x' | 'y'>[] = nodeRecords.map((r: any) => {
      const label = String(r.deviceName ?? r['entity.name'] ?? 'Unknown');
      const roleHint = r.deviceType ?? r.tags ?? label;
      const sysLoc = sysLocationByName.get(label) ?? '';
      return {
        id: String(r.id ?? ''),
        label,
        role: mapDeviceRole(roleHint),
        health: mapHealth(r.state, toNum(r.problems)),
        ip: String(r.ip ?? ''),
        type: Array.isArray(r.deviceType) ? r.deviceType.join(', ') : String(r.deviceType ?? ''),
        cpu: toNum(r.cpuPct),
        memory: toNum(r.memPct),
        location: mapLocationToCity(sysLoc) || mapLocationToCity(label) || undefined,
      };
    });

    /* ── Host nodes ── */
    for (const r of (hostsResult.data?.records ?? []) as any[]) {
      rawNodes.push({
        id: String(r.id ?? ''),
        label: String(r['entity.name'] ?? 'Host'),
        role: 'host',
        health: mapHealth(r.state, toNum(r.problems)),
        cpu: toNum(r.cpuPct),
        memory: toNum(r.memPct),
        entityType: 'HOST',
      });
    }

    /* ── Process group nodes ── */
    for (const r of (pgResult.data?.records ?? []) as any[]) {
      rawNodes.push({
        id: String(r.id ?? ''),
        label: String(r['entity.name'] ?? 'Process Group'),
        role: 'process-group',
        health: mapHealth(r.state, toNum(r.problems)),
        cpu: toNum(r.cpuPct),
        entityType: 'PROCESS_GROUP',
        technology: String(r.technology ?? ''),
        instances: toNum(r.instances),
      });
    }

    /* ── Service nodes ── */
    for (const r of (svcResult.data?.records ?? []) as any[]) {
      rawNodes.push({
        id: String(r.id ?? ''),
        label: String(r['entity.name'] ?? 'Service'),
        role: 'service',
        health: mapHealth(r.state, toNum(r.problems)),
        entityType: 'SERVICE',
        technology: String(r.technology ?? ''),
        requestRate: toNum(r.requestRate),
        responseTime: toNum(r.responseTime),
        errorRate: toNum(r.errorRate),
      });
    }

    /* ── Application nodes ── */
    for (const r of (appResult.data?.records ?? []) as any[]) {
      rawNodes.push({
        id: String(r.id ?? ''),
        label: String(r['entity.name'] ?? 'Application'),
        role: 'application',
        health: mapHealth(r.state, toNum(r.problems)),
        entityType: 'APPLICATION',
        userActions: toNum(r.userActions),
        apdex: toNum(r.apdex),
      });
    }

    const nodeIds = new Set(rawNodes.map(n => n.id));
    const nameToId = new Map(rawNodes.map(n => [n.label, n.id]));

    const lldpEdges: TopologyEdge[] = (lldpEdgesResult.data?.records ?? [])
      .map((r: any) => {
        const srcName = String(r.sourceName ?? '');
        const tgtName = String(r.targetName ?? '');
        const source = nameToId.get(srcName) ?? String(r.sourceDevice ?? '');
        const target = nameToId.get(tgtName) ?? String(r.targetDevice ?? '');
        return { source, target, utilization: 0, bandwidth: 0, edgeType: 'lldp' as const, directed: true };
      })
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    const bgpEdges: TopologyEdge[] = (bgpEdgesResult.data?.records ?? []).map((r: any) => ({
      source: String(r.source ?? ''), target: String(r.target ?? ''),
      utilization: 0, bandwidth: 0, edgeType: 'bgp' as const,
    }));

    const flowEdges: TopologyEdge[] = (flowEdgesResult.data?.records ?? []).map((r: any) => ({
      source: String(r.source ?? ''), target: String(r.target ?? ''),
      utilization: 0, bandwidth: toNum(r.traffic), edgeType: 'flow' as const,
    }));

    /* ── Cross-layer edges ── */
    const parseRelEdges = (result: any): TopologyEdge[] =>
      (result.data?.records ?? []).map((r: any) => ({
        source: String(r.source ?? ''),
        target: String(r.target ?? ''),
        utilization: 0,
        bandwidth: 0,
      }));

    const runsOnEdges: TopologyEdge[] = [
      ...parseRelEdges(hostDeviceEdgesResult),
      ...parseRelEdges(pgHostEdgesResult),
      ...parseRelEdges(svcPgEdgesResult),
    ];
    const callsEdges: TopologyEdge[] = parseRelEdges(svcCallEdgesResult);
    const servesEdges: TopologyEdge[] = parseRelEdges(appSvcEdgesResult);

    const merged = mergeEdges(lldpEdges, bgpEdges, flowEdges, runsOnEdges, callsEdges, servesEdges);
    const validEdges = merged.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    const nodes = computeLayout(rawNodes, validEdges, width, height, layoutMode);

    const edgeCounts: Record<TopologyEdgeType, number> = { lldp: 0, bgp: 0, flow: 0, 'runs-on': 0, calls: 0, serves: 0, manual: 0 };
    for (const e of validEdges) {
      if (e.edgeType) edgeCounts[e.edgeType]++;
    }

    return { nodes, edges: validEdges, edgeCounts };
  }, [demoMode, nodesResult.data, lldpEdgesResult.data, bgpEdgesResult.data, flowEdgesResult.data,
      hostsResult.data, pgResult.data, svcResult.data, appResult.data,
      hostDeviceEdgesResult.data, pgHostEdgesResult.data, svcCallEdgesResult.data, svcPgEdgesResult.data, appSvcEdgesResult.data,
      sysLocationByName, width, height, layoutMode]);

  const demoScaled = useMemo(() => {
    if (!demoMode) return [];
    const laid = computeLayout(DEMO_TOPOLOGY_NODES, DEMO_TOPOLOGY_EDGES, width, height, layoutMode);
    return scaleNodesToFit(laid, width, height);
  }, [demoMode, width, height, layoutMode]);

  const demoResult = useMemo<UseTopologyDataResult>(() => {
    const edgeCounts: Record<TopologyEdgeType, number> = { lldp: 0, bgp: 0, flow: 0, 'runs-on': 0, calls: 0, serves: 0, manual: 0 };
    for (const e of DEMO_TOPOLOGY_EDGES) {
      if (e.edgeType) edgeCounts[e.edgeType]++;
    }
    return {
      nodes: demoScaled,
      edges: DEMO_TOPOLOGY_EDGES,
      edgeCounts,
      isLoading: false,
      error: null,
    };
  }, [demoScaled]);

  if (demoMode) return demoResult;

  return {
    nodes: liveData?.nodes ?? [],
    edges: liveData?.edges ?? [],
    edgeCounts: liveData?.edgeCounts ?? { lldp: 0, bgp: 0, flow: 0, 'runs-on': 0, calls: 0, serves: 0, manual: 0 },
    isLoading: nodesResult.isLoading || lldpEdgesResult.isLoading,
    error: nodesResult.error?.message ?? lldpEdgesResult.error?.message ?? null,
  };
}
