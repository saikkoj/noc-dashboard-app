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
  /** Warnings about truncated DQL results (queries that hit their limit). */
  truncationWarnings: string[];
}

/** Query limits — must match the `| limit N` in networkQueries.ts */
const QUERY_LIMITS: Record<string, number> = {
  hosts: 500,
  processGroups: 500,
  services: 500,
  applications: 200,
  processToHostEdges: 500,
  hostToDeviceEdges: 500,
  serviceToProcessEdges: 500,
  serviceCallEdges: 500,
  appToServiceEdges: 500,
};

function checkTruncation(label: string, result: { data?: { records?: unknown[] | null } | null }): string | null {
  const count = result.data?.records?.length ?? 0;
  const limit = QUERY_LIMITS[label];
  if (limit && count >= limit) {
    return `${label}: showing ${count} of possibly more results (limit ${limit})`;
  }
  return null;
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
    { query: NETWORK_QUERIES.deviceLocations, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
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
  const pgHostEdgesResult = useDql(
    { query: NETWORK_QUERIES.processToHostEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
    { enabled: !demoMode, refetchInterval: 120_000 },
  );
  const hostDeviceEdgesResult = useDql(
    { query: NETWORK_QUERIES.hostToDeviceEdges, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
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

  /* ── K8S entity mapping (SERVICE belongs_to K8S_DEPLOYMENT) ── */
  const svcK8sResult = useDql(
    { query: NETWORK_QUERIES.serviceK8sMapping, defaultTimeframeStart: tfStart, defaultTimeframeEnd: tfEnd },
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
        label: String(r.hostName ?? r['entity.name'] ?? 'Host'),
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
        label: String(r.pgName ?? r['entity.name'] ?? 'Process Group'),
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
        label: String(r.serviceName ?? r['entity.name'] ?? 'Service'),
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
        label: String(r.appName ?? r['entity.name'] ?? 'Application'),
        role: 'application',
        health: mapHealth(r.state, toNum(r.problems)),
        entityType: 'APPLICATION',
        userActions: toNum(r.userActions),
        apdex: toNum(r.apdex),
      });
    }

    const nodeIds = new Set(rawNodes.map(n => n.id));
    const nameToId = new Map(rawNodes.map(n => [n.label, n.id]));

    /* ── Resolve K8S entity IDs for deep-linking ── */
    // Build SERVICE → K8S_DEPLOYMENT map from smartscapeEdges
    const svcToK8sDeployment = new Map<string, string>();
    for (const r of (svcK8sResult.data?.records ?? []) as any[]) {
      const src = String(r.source_id ?? '');
      const tgt = String(r.target_id ?? '');
      if (src.startsWith('SERVICE-') && tgt.startsWith('K8S_DEPLOYMENT-')) {
        svcToK8sDeployment.set(src, tgt);
      }
    }

    // Build reverse maps from existing cross-layer edges:
    // PG → first SERVICE that runs on it (from svcPgEdges: source=svcId, target=pgId)
    const pgToSvc = new Map<string, string>();
    for (const r of (svcPgEdgesResult.data?.records ?? []) as any[]) {
      const svcId = String(r.source ?? '');
      const pgId = String(r.target ?? '');
      if (pgId && svcId && !pgToSvc.has(pgId)) pgToSvc.set(pgId, svcId);
    }
    // HOST → first PG on it (from pgHostEdges: source=pgId, target=hostId)
    const hostToPg = new Map<string, string>();
    for (const r of (pgHostEdgesResult.data?.records ?? []) as any[]) {
      const pgId = String(r.source ?? '');
      const hostId = String(r.target ?? '');
      if (hostId && pgId && !hostToPg.has(hostId)) hostToPg.set(hostId, pgId);
    }

    // Assign k8sEntityId to each node
    for (const n of rawNodes) {
      if (n.entityType === 'SERVICE') {
        n.k8sEntityId = svcToK8sDeployment.get(n.id);
      } else if (n.entityType === 'PROCESS_GROUP') {
        const svcId = pgToSvc.get(n.id);
        if (svcId) n.k8sEntityId = svcToK8sDeployment.get(svcId);
      } else if (n.entityType === 'HOST') {
        const pgId = hostToPg.get(n.id);
        const svcId = pgId ? pgToSvc.get(pgId) : undefined;
        if (svcId) n.k8sEntityId = svcToK8sDeployment.get(svcId);
      }
    }

    const lldpEdges: TopologyEdge[] = (lldpEdgesResult.data?.records ?? [])
      .map((r: any) => {
        const srcName = String(r.sourceName ?? '');
        const tgtName = String(r.targetName ?? '');
        const source = nameToId.get(srcName) ?? String(r.sourceDevice ?? '');
        const target = nameToId.get(tgtName) ?? String(r.targetDevice ?? '');
        return {
          source, target, utilization: 0, bandwidth: 0, edgeType: 'lldp' as const, directed: true,
          sourceInterface: String(r.sourceInterface ?? ''),
          targetInterface: String(r.neighborInterface ?? ''),
        };
      })
      .filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    const bgpEdges: TopologyEdge[] = (bgpEdgesResult.data?.records ?? []).map((r: any) => ({
      source: String(r.source ?? ''), target: String(r.target ?? ''),
      utilization: 0, bandwidth: 0, edgeType: 'bgp' as const,
      bgpState: toNum(r.bgpState),
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
      ...parseRelEdges(pgHostEdgesResult),
      ...parseRelEdges(hostDeviceEdgesResult),
      ...parseRelEdges(svcPgEdgesResult),
    ];
    const callsEdges: TopologyEdge[] = parseRelEdges(svcCallEdgesResult);
    const servesEdges: TopologyEdge[] = parseRelEdges(appSvcEdgesResult);

    const merged = mergeEdges(lldpEdges, bgpEdges, flowEdges, runsOnEdges, callsEdges, servesEdges);
    const validEdges = merged.filter(e => nodeIds.has(e.source) && nodeIds.has(e.target));

    // Resolve node labels + compute edge health
    const nodeById = new Map(rawNodes.map(n => [n.id, n]));
    const idToLabel = new Map(rawNodes.map(n => [n.id, n.label]));

    /** Build a concrete reason string for why a node is unhealthy, using its actual metrics. */
    function describeNodeHealth(n: Omit<TopologyNode, 'x' | 'y'>): string {
      const parts: string[] = [];
      const role = n.role;

      // Problem count is the primary health driver (mapHealth uses it first)
      if ((n as any).problems != null) {
        // problems was consumed by mapHealth but not stored — use health as proxy
      }

      // Infrastructure metrics (network devices, hosts)
      if (n.cpu != null && n.cpu > 0) {
        if (n.cpu >= 90) parts.push(`CPU at ${n.cpu.toFixed(0)}% (critical)`);
        else if (n.cpu >= 75) parts.push(`CPU at ${n.cpu.toFixed(0)}% (elevated)`);
      }
      if (n.memory != null && n.memory > 0) {
        if (n.memory >= 90) parts.push(`memory at ${n.memory.toFixed(0)}% (critical)`);
        else if (n.memory >= 75) parts.push(`memory at ${n.memory.toFixed(0)}% (elevated)`);
      }

      // Service-specific
      if (role === 'service') {
        if (n.errorRate != null && n.errorRate > 0) {
          if (n.errorRate >= 5) parts.push(`error rate ${n.errorRate.toFixed(1)}%`);
          else if (n.errorRate >= 1) parts.push(`error rate ${n.errorRate.toFixed(1)}% (elevated)`);
        }
        if (n.responseTime != null && n.responseTime > 0) {
          if (n.responseTime >= 5000) parts.push(`response time ${(n.responseTime / 1000).toFixed(1)}s (slow)`);
          else if (n.responseTime >= 1000) parts.push(`response time ${(n.responseTime / 1000).toFixed(1)}s`);
        }
      }

      // Application-specific
      if (role === 'application') {
        if (n.apdex != null && n.apdex > 0 && n.apdex < 1) {
          if (n.apdex < 0.5) parts.push(`Apdex ${n.apdex.toFixed(2)} (poor user experience)`);
          else if (n.apdex < 0.7) parts.push(`Apdex ${n.apdex.toFixed(2)} (fair)`);
        }
      }

      if (parts.length === 0) {
        // Fallback to Dynatrace problem count / entity state
        if (n.health === 'critical') return 'has active Dynatrace problems';
        if (n.health === 'warning') return 'has Dynatrace warnings';
        return '';
      }
      return parts.join(', ');
    }

    /** Build a single-node explanation with label + real metrics. */
    function nodeExplanation(nodeId: string, health: string): string {
      const n = nodeById.get(nodeId);
      if (!n) return health;
      const label = n.label;
      const detail = describeNodeHealth(n);
      if (health === 'critical') {
        return detail ? `${label} is critical — ${detail}.` : `${label} is critical — has active Dynatrace problems.`;
      }
      if (health === 'warning') {
        return detail ? `${label} is degraded — ${detail}.` : `${label} is degraded — has Dynatrace warnings.`;
      }
      return `${label} is healthy.`;
    }

    /** Edge-type-specific context for the relationship. */
    function edgeContext(edgeType: TopologyEdgeType | undefined): string {
      switch (edgeType) {
        case 'lldp': return 'This is a physical link (LLDP neighbor) — device issues may cause packet loss or link failure.';
        case 'runs-on': return 'This is an infrastructure dependency — the host health directly affects workloads running on it.';
        case 'calls': return 'This is a service-to-service call — failures propagate through the call chain.';
        case 'serves': return 'This service backs the application — service issues directly impact end users.';
        case 'flow': return 'This is a traffic flow — network device health affects throughput and latency.';
        default: return '';
      }
    }

    for (const e of validEdges) {
      e.sourceLabel = idToLabel.get(e.source);
      e.targetLabel = idToLabel.get(e.target);

      // Derive edge health from type-specific signals + endpoint node health
      if (e.edgeType === 'bgp' && e.bgpState != null) {
        const stateNum = Math.round(e.bgpState);
        const stateNames: Record<number, string> = { 1: 'Idle', 2: 'Connect', 3: 'Active', 4: 'OpenSent', 5: 'OpenConfirm', 6: 'Established' };
        const stateName = stateNames[stateNum] ?? `state ${e.bgpState.toFixed(1)}`;
        if (e.bgpState >= 6) {
          e.health = 'healthy';
          e.healthReason = `BGP session is ${stateName} — peering is fully operational.`;
        } else if (e.bgpState >= 3) {
          e.health = 'warning';
          e.healthReason = `BGP session is in ${stateName} state (${stateNum}/6) — peering is not fully established. The session may be negotiating or experiencing connectivity issues.`;
        } else {
          e.health = 'critical';
          e.healthReason = `BGP session is in ${stateName} state (${stateNum}/6) — peering is down or failing to initialize. This may indicate a routing failure or misconfiguration.`;
        }
      } else {
        // Worst health of the two connected nodes
        const srcH = (nodeById.get(e.source)?.health) ?? 'unknown';
        const tgtH = (nodeById.get(e.target)?.health) ?? 'unknown';
        const rank = (h: string) => h === 'critical' ? 3 : h === 'warning' ? 2 : h === 'healthy' ? 1 : 0;
        const worst = rank(srcH) >= rank(tgtH) ? srcH : tgtH;
        e.health = (worst === 'critical' || worst === 'warning' || worst === 'healthy') ? worst as any : 'unknown';

        const ctx = edgeContext(e.edgeType);

        if (srcH === 'critical' && tgtH === 'critical') {
          e.healthReason = `Both endpoints have issues. ${nodeExplanation(e.source, srcH)} ${nodeExplanation(e.target, tgtH)} ${ctx}`;
        } else if (srcH === 'critical') {
          e.healthReason = `${nodeExplanation(e.source, srcH)} ${ctx}`;
        } else if (tgtH === 'critical') {
          e.healthReason = `${nodeExplanation(e.target, tgtH)} ${ctx}`;
        } else if (srcH === 'warning' && tgtH === 'warning') {
          e.healthReason = `Both endpoints are degraded. ${nodeExplanation(e.source, srcH)} ${nodeExplanation(e.target, tgtH)} ${ctx}`;
        } else if (srcH === 'warning') {
          e.healthReason = `${nodeExplanation(e.source, srcH)} ${ctx}`;
        } else if (tgtH === 'warning') {
          e.healthReason = `${nodeExplanation(e.target, tgtH)} ${ctx}`;
        } else if (srcH === 'healthy' && tgtH === 'healthy') {
          e.healthReason = 'Both endpoints are healthy — no issues detected.';
        } else {
          const srcLabel = e.sourceLabel ?? e.source;
          const tgtLabel = e.targetLabel ?? e.target;
          e.healthReason = `Health could not be fully determined (${srcLabel}: ${srcH}, ${tgtLabel}: ${tgtH}).`;
        }
      }
    }

    const nodes = computeLayout(rawNodes, validEdges, width, height, layoutMode);

    const edgeCounts: Record<TopologyEdgeType, number> = { lldp: 0, bgp: 0, flow: 0, 'runs-on': 0, calls: 0, serves: 0, manual: 0 };
    for (const e of validEdges) {
      if (e.edgeType) edgeCounts[e.edgeType]++;
    }

    return { nodes, edges: validEdges, edgeCounts };
  }, [demoMode, nodesResult.data, lldpEdgesResult.data, bgpEdgesResult.data, flowEdgesResult.data,
      hostsResult.data, pgResult.data, svcResult.data, appResult.data,
      pgHostEdgesResult.data, hostDeviceEdgesResult.data, svcCallEdgesResult.data, svcPgEdgesResult.data, appSvcEdgesResult.data,
      svcK8sResult.data, sysLocationByName, width, height, layoutMode]);

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
      truncationWarnings: [],
    };
  }, [demoScaled]);

  const truncationWarnings = useMemo(() => {
    if (demoMode) return [];
    return [
      checkTruncation('hosts', hostsResult),
      checkTruncation('processGroups', pgResult),
      checkTruncation('services', svcResult),
      checkTruncation('applications', appResult),
      checkTruncation('processToHostEdges', pgHostEdgesResult),
      checkTruncation('hostToDeviceEdges', hostDeviceEdgesResult),
      checkTruncation('serviceCallEdges', svcCallEdgesResult),
      checkTruncation('serviceToProcessEdges', svcPgEdgesResult),
      checkTruncation('appToServiceEdges', appSvcEdgesResult),
    ].filter((w): w is string => w !== null);
  }, [demoMode, hostsResult, pgResult, svcResult, appResult,
      pgHostEdgesResult, hostDeviceEdgesResult, svcCallEdgesResult, svcPgEdgesResult, appSvcEdgesResult]);

  if (demoMode) return demoResult;

  const allErrors = [
    nodesResult, lldpEdgesResult, bgpEdgesResult, flowEdgesResult,
    hostsResult, pgResult, svcResult, appResult,
    pgHostEdgesResult, hostDeviceEdgesResult, svcCallEdgesResult, svcPgEdgesResult, appSvcEdgesResult,
  ].map(r => r.error?.message).filter(Boolean);

  return {
    nodes: liveData?.nodes ?? [],
    edges: liveData?.edges ?? [],
    edgeCounts: liveData?.edgeCounts ?? { lldp: 0, bgp: 0, flow: 0, 'runs-on': 0, calls: 0, serves: 0, manual: 0 },
    isLoading: nodesResult.isLoading || lldpEdgesResult.isLoading,
    error: allErrors.length > 0 ? allErrors.join('; ') : null,
    truncationWarnings,
  };
}
