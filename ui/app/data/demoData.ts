/**
 * Demo data for NOC Dashboard — Network operations demo data.
 *
 * Used in demo mode (demoMode === true) and as development fallback.
 */

import type {
  OverviewKpi, Site, Incident, SlaReport, ChangeEvent,
  TopologyNode, TopologyEdge, NetworkDevice, NetworkInterface,
  TopologyCluster, TopologySite, HealthSummary,
  DavisProblem,
} from '../types/network';

/* ── Sites (Finnish cities) ────────────────────── */

export const DEMO_SITES: Site[] = [
  { id: 'site-newyork-dc', name: 'New York DC', region: 'Northeast', latitude: 40.7128, longitude: -74.0060, health: 'healthy', deviceCount: 48, circuitCount: 12 },
  { id: 'site-boston-campus', name: 'Boston Campus', region: 'Northeast', latitude: 42.3601, longitude: -71.0589, health: 'healthy', deviceCount: 32, circuitCount: 8 },
  { id: 'site-chicago-office', name: 'Chicago Office', region: 'Midwest', latitude: 41.8781, longitude: -87.6298, health: 'degraded', deviceCount: 24, circuitCount: 6 },
  { id: 'site-atlanta-branch', name: 'Atlanta Branch', region: 'Southeast', latitude: 33.7490, longitude: -84.3880, health: 'healthy', deviceCount: 16, circuitCount: 4 },
  { id: 'site-denver-north', name: 'Denver North', region: 'Northwest', latitude: 39.7392, longitude: -104.9903, health: 'outage', deviceCount: 20, circuitCount: 5 },
  { id: 'site-dallas-hub', name: 'Dallas Hub', region: 'Central', latitude: 32.7767, longitude: -96.7970, health: 'healthy', deviceCount: 14, circuitCount: 4 },
  { id: 'site-phoenix-edge', name: 'Phoenix Edge', region: 'Southwest', latitude: 33.4484, longitude: -112.0740, health: 'healthy', deviceCount: 10, circuitCount: 3 },
  { id: 'site-seattle-north', name: 'Seattle Remote', region: 'North', latitude: 47.6062, longitude: -122.3321, health: 'degraded', deviceCount: 8, circuitCount: 2 },
  { id: 'site-sydney-dc', name: 'Sydney DC', region: 'Australia', latitude: -33.8688, longitude: 151.2093, health: 'healthy', deviceCount: 36, circuitCount: 9 },
  { id: 'site-melbourne-office', name: 'Melbourne Office', region: 'Australia', latitude: -37.8136, longitude: 144.9631, health: 'degraded', deviceCount: 18, circuitCount: 5 },
  { id: 'site-auckland-pop', name: 'Auckland PoP', region: 'New Zealand', latitude: -36.8485, longitude: 174.7633, health: 'healthy', deviceCount: 12, circuitCount: 3 },
  { id: 'site-wellington-branch', name: 'Wellington Branch', region: 'New Zealand', latitude: -41.2865, longitude: 174.7762, health: 'healthy', deviceCount: 8, circuitCount: 2 },
];

/* ── Overview KPI ──────────────────────────────── */

export const DEMO_OVERVIEW: OverviewKpi = {
  availability: {
    value: 99.72,
    unit: '%',
    ranges: { '1h': 99.65, '24h': 99.72, '7d': 99.88, '30d': 99.91 },
  },
  latencyP50Ms: 12.4,
  latencyP95Ms: 48.7,
  packetLossPct: 0.34,
  jitterMs: 3.2,
  incidents: { open: 3, acknowledged: 1, resolved: 1 },
  slaCompliancePct: 99.91,
  topImpactedSites: [
    { siteId: 'site-denver-north', name: 'Denver North', health: 'outage', incidentCount: 1 },
    { siteId: 'site-chicago-office', name: 'Chicago Office', health: 'degraded', incidentCount: 1 },
    { siteId: 'site-seattle-north', name: 'Seattle Remote', health: 'degraded', incidentCount: 1 },
  ],
  topImpactedServices: [
    { serviceId: 'svc-dns-dhcp', name: 'DNS / DHCP', health: 'outage', incidentCount: 1 },
    { serviceId: 'svc-mpls-wan', name: 'MPLS WAN', health: 'degraded', incidentCount: 2 },
  ],
};

/* ── Incidents ─────────────────────────────────── */

export const DEMO_INCIDENTS: Incident[] = [
  {
    id: 'inc-oulu-unreachable',
    title: 'Denver North — entire site unreachable',
    severity: 'critical', status: 'open',
    siteId: 'site-denver-north', siteName: 'Denver North',
    serviceId: 'svc-mpls-wan', serviceName: 'MPLS WAN',
    impactSummary: 'All 20 devices at Denver North unreachable. MPLS circuit down.',
    createdAt: new Date(Date.now() - 45 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 60_000).toISOString(),
  },
  {
    id: 'inc-tampere-loss',
    title: 'Chicago — elevated packet loss on WAN link',
    severity: 'major', status: 'acknowledged',
    siteId: 'site-chicago-office', siteName: 'Chicago Office',
    serviceId: 'svc-mpls-wan', serviceName: 'MPLS WAN',
    impactSummary: 'Packet loss 2.3% on primary MPLS circuit. Backup active.',
    createdAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  },
  {
    id: 'inc-dns-failures',
    title: 'DNS service failures at multiple sites',
    severity: 'major', status: 'open',
    serviceId: 'svc-dns-dhcp', serviceName: 'DNS / DHCP',
    impactSummary: 'Intermittent DNS failures at New York, Boston, and Chicago. Backup server active.',
    createdAt: new Date(Date.now() - 90 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 90 * 60_000).toISOString(),
  },
  {
    id: 'inc-rovaniemi-latency',
    title: 'Seattle — high latency on satellite backup',
    severity: 'minor', status: 'open',
    siteId: 'site-seattle-north', siteName: 'Seattle Remote',
    serviceId: 'svc-sd-wan', serviceName: 'SD-WAN Overlay',
    impactSummary: 'Latency p95 280ms on satellite link. Primary fiber under maintenance.',
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
  },
  {
    id: 'inc-helsinki-bgp',
    title: 'New York DC — brief BGP outage (resolved)',
    severity: 'minor', status: 'resolved',
    siteId: 'site-newyork-dc', siteName: 'New York DC',
    serviceId: 'svc-internet', serviceName: 'Internet Breakout',
    impactSummary: 'BGP session to upstream provider down for 12 seconds. Recovered automatically.',
    createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 5.5 * 3600_000).toISOString(),
    resolvedAt: new Date(Date.now() - 5.5 * 3600_000).toISOString(),
  },
];

/* ── SLA ───────────────────────────────────────── */

export const DEMO_SLA: SlaReport = {
  month: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  compliancePct: 99.91,
  downtimeMinutes: 38,
  topContributors: [
    { siteId: 'site-denver-north', siteName: 'Denver North', downtimeMinutes: 22 },
    { siteId: 'site-chicago-office', siteName: 'Chicago Office', downtimeMinutes: 9 },
    { siteId: 'site-seattle-north', siteName: 'Seattle Remote', downtimeMinutes: 7 },
  ],
};

/* ── Change Events ─────────────────────────────── */

export const DEMO_CHANGES: ChangeEvent[] = [
  { id: 'ce-1', entityType: 'circuit', entityId: 'site-seattle-north', entityName: 'Seattle Primary Fiber', changeType: 'maintenance-start', description: 'Maintenance window started', author: 'NOC Operations', timestamp: new Date(Date.now() - 3 * 3600_000).toISOString() },
  { id: 'ce-2', entityType: 'device', entityId: 'site-denver-north', entityName: 'oulu-core-sw01', changeType: 'state-change', description: 'Device unreachable', author: 'NOC Dashboard', timestamp: new Date(Date.now() - 45 * 60_000).toISOString() },
  { id: 'ce-3', entityType: 'service', entityId: 'svc-dns-dhcp', entityName: 'DNS / DHCP', changeType: 'degradation', description: 'DNS error rate exceeded threshold', author: 'NOC Dashboard', timestamp: new Date(Date.now() - 90 * 60_000).toISOString() },
];

/* ── Topology Nodes (full Smartscape hierarchy) ─── */

export const DEMO_TOPOLOGY_NODES: Omit<TopologyNode, 'x' | 'y'>[] = [
  // ── Layer 0: Cloud / WAN ──
  { id: 'dev-rov-sdwan01', label: 'ROV-SD-WAN-01', role: 'cloud-gw', health: 'warning', ip: '10.8.1.1', type: 'Viptela vEdge', entityType: 'dt.entity.network:device' },
  { id: 'cloud-azure-fi', label: 'Azure North Europe', role: 'cloud', health: 'healthy', type: 'Azure vNet Gateway', entityType: 'cloud', isExternal: true },

  // ── Layer 1: Core Routers ──
  { id: 'dev-hel-core-rtr01', label: 'HEL-Core-Router-01', role: 'router', health: 'healthy', ip: '10.1.1.1', type: 'Cisco ISR 4451', entityType: 'dt.entity.network:device' },
  { id: 'dev-hel-core-rtr02', label: 'HEL-Core-Router-02', role: 'router', health: 'healthy', ip: '10.1.1.2', type: 'Cisco ISR 4451', entityType: 'dt.entity.network:device' },
  { id: 'dev-esp-core-rtr01', label: 'ESP-Core-Router-01', role: 'router', health: 'healthy', ip: '10.2.1.1', type: 'Juniper MX204', entityType: 'dt.entity.network:device' },
  { id: 'dev-tmp-wan-rtr01', label: 'TMP-WAN-Router-01', role: 'router', health: 'warning', ip: '10.3.1.1', type: 'Cisco ISR 4331', cpu: 72, memory: 68, entityType: 'dt.entity.network:device' },
  { id: 'dev-oul-wan-rtr01', label: 'OUL-WAN-Router-01', role: 'router', health: 'critical', ip: '10.5.1.1', type: 'Cisco ISR 4451', entityType: 'dt.entity.network:device' },

  // ── Layer 2: Firewalls ──
  { id: 'dev-hel-fw01', label: 'HEL-Firewall-01', role: 'firewall', health: 'healthy', ip: '10.1.2.1', type: 'Palo Alto PA-5250', entityType: 'dt.entity.network:device' },
  { id: 'dev-esp-fw01', label: 'ESP-Firewall-01', role: 'firewall', health: 'healthy', ip: '10.2.2.1', type: 'Fortinet FG-600E', entityType: 'dt.entity.network:device' },

  // ── Layer 3: Switches ──
  { id: 'dev-hel-sw-dist01', label: 'HEL-Dist-Switch-01', role: 'switch', health: 'healthy', ip: '10.1.3.1', type: 'Cisco Catalyst 9300', entityType: 'dt.entity.network:device' },
  { id: 'dev-hel-sw-acc01', label: 'HEL-Access-Switch-01', role: 'switch', health: 'warning', ip: '10.1.3.10', type: 'Cisco Catalyst 9200', cpu: 78, memory: 82, entityType: 'dt.entity.network:device' },
  { id: 'dev-esp-sw01', label: 'ESP-Switch-01', role: 'switch', health: 'healthy', ip: '10.2.3.1', type: 'Juniper EX4300', entityType: 'dt.entity.network:device' },
  { id: 'dev-tmp-sw01', label: 'TMP-Switch-01', role: 'switch', health: 'healthy', ip: '10.3.3.1', type: 'Cisco Catalyst 9300', entityType: 'dt.entity.network:device' },
  { id: 'dev-oul-sw01', label: 'OUL-Switch-01', role: 'switch', health: 'critical', ip: '10.5.3.1', type: 'Cisco Catalyst 9200', entityType: 'dt.entity.network:device' },

  // ── Layer 4: Hosts ──
  { id: 'host-hel-app01', label: 'hel-app-srv-01', role: 'host', health: 'healthy', ip: '10.1.10.1', type: 'Linux (Ubuntu 22.04)', cpu: 42, memory: 58, entityType: 'dt.entity.host' },
  { id: 'host-hel-app02', label: 'hel-app-srv-02', role: 'host', health: 'healthy', ip: '10.1.10.2', type: 'Linux (Ubuntu 22.04)', cpu: 35, memory: 50, entityType: 'dt.entity.host' },
  { id: 'host-hel-db01', label: 'hel-db-srv-01', role: 'host', health: 'warning', ip: '10.1.10.10', type: 'Linux (RHEL 9)', cpu: 68, memory: 78, entityType: 'dt.entity.host' },
  { id: 'host-esp-web01', label: 'esp-web-srv-01', role: 'host', health: 'healthy', ip: '10.2.10.1', type: 'Linux (Ubuntu 22.04)', cpu: 28, memory: 40, entityType: 'dt.entity.host' },
  { id: 'host-hel-k8s01', label: 'hel-k8s-node-01', role: 'host', health: 'healthy', ip: '10.1.11.1', type: 'Linux (Container-Optimized)', cpu: 55, memory: 62, entityType: 'dt.entity.host' },
  { id: 'host-hel-k8s02', label: 'hel-k8s-node-02', role: 'host', health: 'healthy', ip: '10.1.11.2', type: 'Linux (Container-Optimized)', cpu: 48, memory: 55, entityType: 'dt.entity.host' },
  { id: 'host-tmp-app01', label: 'tmp-app-srv-01', role: 'host', health: 'warning', ip: '10.3.10.1', type: 'Windows Server 2022', cpu: 75, memory: 82, entityType: 'dt.entity.host' },

  // ── Layer 5: Process Groups ──
  { id: 'pg-api-gateway', label: 'API Gateway', role: 'process-group', health: 'healthy', technology: 'Java (Spring Boot)', cpu: 32, memory: 45, instances: 3, entityType: 'dt.entity.process_group' },
  { id: 'pg-order-svc', label: 'Order Service', role: 'process-group', health: 'healthy', technology: 'Java (Spring Boot)', cpu: 28, memory: 38, instances: 2, entityType: 'dt.entity.process_group' },
  { id: 'pg-auth-svc', label: 'Authentication', role: 'process-group', health: 'healthy', technology: 'Node.js', cpu: 15, memory: 22, instances: 2, entityType: 'dt.entity.process_group' },
  { id: 'pg-postgres', label: 'PostgreSQL', role: 'process-group', health: 'warning', technology: 'PostgreSQL 15', cpu: 65, memory: 72, instances: 1, entityType: 'dt.entity.process_group' },
  { id: 'pg-redis', label: 'Redis Cache', role: 'process-group', health: 'healthy', technology: 'Redis 7', cpu: 12, memory: 55, instances: 2, entityType: 'dt.entity.process_group' },
  { id: 'pg-monitoring', label: 'Monitoring Agent', role: 'process-group', health: 'healthy', technology: 'Go', cpu: 8, memory: 15, instances: 4, entityType: 'dt.entity.process_group' },
  { id: 'pg-nginx', label: 'Nginx Reverse Proxy', role: 'process-group', health: 'healthy', technology: 'Nginx', cpu: 10, memory: 18, instances: 2, entityType: 'dt.entity.process_group' },
  { id: 'pg-kafka', label: 'Kafka Broker', role: 'process-group', health: 'healthy', technology: 'Apache Kafka', cpu: 38, memory: 48, instances: 3, entityType: 'dt.entity.process_group' },

  // ── Layer 6: Services ──
  { id: 'svc-customer-api', label: 'Customer API', role: 'service', health: 'healthy', technology: 'REST API', requestRate: 1250, responseTime: 45, errorRate: 0.2, entityType: 'dt.entity.service' },
  { id: 'svc-order-api', label: 'Order API', role: 'service', health: 'healthy', technology: 'REST API', requestRate: 480, responseTime: 120, errorRate: 0.5, entityType: 'dt.entity.service' },
  { id: 'svc-auth', label: 'Auth Service', role: 'service', health: 'healthy', technology: 'gRPC', requestRate: 3200, responseTime: 12, errorRate: 0.1, entityType: 'dt.entity.service' },
  { id: 'svc-billing', label: 'Billing Service', role: 'service', health: 'warning', technology: 'REST API', requestRate: 180, responseTime: 280, errorRate: 2.1, entityType: 'dt.entity.service' },
  { id: 'svc-notification', label: 'Notification Service', role: 'service', health: 'healthy', technology: 'AMQP', requestRate: 650, responseTime: 35, errorRate: 0.3, entityType: 'dt.entity.service' },
  { id: 'svc-network-status', label: 'Network Status Service', role: 'service', health: 'healthy', technology: 'REST API', requestRate: 920, responseTime: 60, errorRate: 0.4, entityType: 'dt.entity.service' },
  { id: 'svc-postgres', label: 'PostgreSQL Service', role: 'service', health: 'warning', technology: 'SQL', requestRate: 4500, responseTime: 8, errorRate: 0.8, entityType: 'dt.entity.service' },

  // ── Layer 7: Applications ──
  { id: 'app-portal', label: 'Customer Portal', role: 'application', health: 'healthy', technology: 'React SPA', userActions: 8500, apdex: 0.94, entityType: 'dt.entity.application' },
  { id: 'app-admin', label: 'Admin Panel', role: 'application', health: 'healthy', technology: 'React SPA', userActions: 1200, apdex: 0.91, entityType: 'dt.entity.application' },
  { id: 'app-mobile', label: 'Mobile App', role: 'application', health: 'healthy', technology: 'React Native', userActions: 15000, apdex: 0.88, entityType: 'dt.entity.application' },
];

export const DEMO_TOPOLOGY_EDGES: TopologyEdge[] = [
  // ── Network layer: LLDP ──
  { source: 'dev-hel-core-rtr01', target: 'dev-hel-core-rtr02', utilization: 45, bandwidth: 10000, edgeType: 'lldp' },
  { source: 'dev-hel-core-rtr01', target: 'dev-hel-fw01', utilization: 35, bandwidth: 10000, edgeType: 'lldp' },
  { source: 'dev-hel-fw01', target: 'dev-hel-sw-dist01', utilization: 30, bandwidth: 10000, edgeType: 'lldp' },
  { source: 'dev-hel-sw-dist01', target: 'dev-hel-sw-acc01', utilization: 62, bandwidth: 1000, edgeType: 'lldp' },
  { source: 'dev-hel-core-rtr02', target: 'dev-tmp-wan-rtr01', utilization: 55, bandwidth: 1000, edgeType: 'lldp', directed: true },
  { source: 'dev-esp-core-rtr01', target: 'dev-esp-fw01', utilization: 22, bandwidth: 10000, edgeType: 'lldp' },
  { source: 'dev-esp-fw01', target: 'dev-esp-sw01', utilization: 20, bandwidth: 10000, edgeType: 'lldp' },
  { source: 'dev-tmp-wan-rtr01', target: 'dev-tmp-sw01', utilization: 40, bandwidth: 1000, edgeType: 'lldp' },
  { source: 'dev-hel-core-rtr02', target: 'dev-oul-wan-rtr01', utilization: 85, bandwidth: 1000, edgeType: 'lldp', directed: true },
  { source: 'dev-oul-wan-rtr01', target: 'dev-oul-sw01', utilization: 90, bandwidth: 1000, edgeType: 'lldp' },
  // ── Network layer: BGP ──
  { source: 'dev-hel-core-rtr01', target: 'dev-esp-core-rtr01', utilization: 28, bandwidth: 10000, edgeType: 'bgp', directed: true },
  { source: 'dev-esp-core-rtr01', target: 'dev-tmp-wan-rtr01', utilization: 18, bandwidth: 1000, edgeType: 'bgp', directed: true },
  { source: 'dev-hel-core-rtr01', target: 'cloud-azure-fi', utilization: 12, bandwidth: 10000, edgeType: 'bgp', directed: true },
  // ── Network layer: Flow ──
  { source: 'dev-hel-core-rtr01', target: 'dev-rov-sdwan01', utilization: 15, bandwidth: 100, edgeType: 'flow', directed: true },
  // ── Cross-layer: Switch → Host (runs-on) ──
  { source: 'dev-hel-sw-dist01', target: 'host-hel-app01', utilization: 0, bandwidth: 10000, edgeType: 'runs-on' },
  { source: 'dev-hel-sw-dist01', target: 'host-hel-app02', utilization: 0, bandwidth: 10000, edgeType: 'runs-on' },
  { source: 'dev-hel-sw-acc01', target: 'host-hel-db01', utilization: 0, bandwidth: 1000, edgeType: 'runs-on' },
  { source: 'dev-hel-sw-dist01', target: 'host-hel-k8s01', utilization: 0, bandwidth: 10000, edgeType: 'runs-on' },
  { source: 'dev-hel-sw-dist01', target: 'host-hel-k8s02', utilization: 0, bandwidth: 10000, edgeType: 'runs-on' },
  { source: 'dev-esp-sw01', target: 'host-esp-web01', utilization: 0, bandwidth: 10000, edgeType: 'runs-on' },
  { source: 'dev-tmp-sw01', target: 'host-tmp-app01', utilization: 0, bandwidth: 1000, edgeType: 'runs-on' },
  // ── Cross-layer: Host → Process Group (runs-on) ──
  { source: 'host-hel-app01', target: 'pg-api-gateway', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-hel-app01', target: 'pg-nginx', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-hel-app02', target: 'pg-order-svc', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-hel-app02', target: 'pg-auth-svc', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-hel-db01', target: 'pg-postgres', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-hel-db01', target: 'pg-redis', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-hel-k8s01', target: 'pg-kafka', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-hel-k8s02', target: 'pg-monitoring', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-esp-web01', target: 'pg-nginx', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'host-tmp-app01', target: 'pg-order-svc', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  // ── Cross-layer: Service → Process Group (provided by) ──
  { source: 'svc-customer-api', target: 'pg-api-gateway', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'svc-order-api', target: 'pg-order-svc', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'svc-auth', target: 'pg-auth-svc', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'svc-postgres', target: 'pg-postgres', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  { source: 'svc-notification', target: 'pg-kafka', utilization: 0, bandwidth: 0, edgeType: 'runs-on' },
  // ── Cross-layer: Service → Service (calls) ──
  { source: 'svc-customer-api', target: 'svc-auth', utilization: 0, bandwidth: 0, edgeType: 'calls', directed: true, callCount: 3200 },
  { source: 'svc-customer-api', target: 'svc-order-api', utilization: 0, bandwidth: 0, edgeType: 'calls', directed: true, callCount: 480 },
  { source: 'svc-customer-api', target: 'svc-network-status', utilization: 0, bandwidth: 0, edgeType: 'calls', directed: true, callCount: 920 },
  { source: 'svc-order-api', target: 'svc-billing', utilization: 0, bandwidth: 0, edgeType: 'calls', directed: true, callCount: 180 },
  { source: 'svc-order-api', target: 'svc-postgres', utilization: 0, bandwidth: 0, edgeType: 'calls', directed: true, callCount: 1200 },
  { source: 'svc-order-api', target: 'svc-notification', utilization: 0, bandwidth: 0, edgeType: 'calls', directed: true, callCount: 150 },
  { source: 'svc-billing', target: 'svc-postgres', utilization: 0, bandwidth: 0, edgeType: 'calls', directed: true, callCount: 360 },
  { source: 'svc-auth', target: 'svc-postgres', utilization: 0, bandwidth: 0, edgeType: 'calls', directed: true, callCount: 1600 },
  // ── Cross-layer: Application → Service (serves) ──
  { source: 'app-portal', target: 'svc-customer-api', utilization: 0, bandwidth: 0, edgeType: 'serves', directed: true },
  { source: 'app-portal', target: 'svc-network-status', utilization: 0, bandwidth: 0, edgeType: 'serves', directed: true },
  { source: 'app-admin', target: 'svc-customer-api', utilization: 0, bandwidth: 0, edgeType: 'serves', directed: true },
  { source: 'app-admin', target: 'svc-billing', utilization: 0, bandwidth: 0, edgeType: 'serves', directed: true },
  { source: 'app-mobile', target: 'svc-customer-api', utilization: 0, bandwidth: 0, edgeType: 'serves', directed: true },
  { source: 'app-mobile', target: 'svc-order-api', utilization: 0, bandwidth: 0, edgeType: 'serves', directed: true },
];

/* ── Demo Devices ──────────────────────────────── */

export const DEMO_DEVICES: NetworkDevice[] = [
  { entityId: 'dev-hel-core-rtr01', name: 'HEL-Core-Router-01', ip: '10.1.1.1', type: 'Cisco ISR 4451', status: 'UP', cpu: 34, memory: 48, problems: 0, reachability: 100, traffic: 4.2 },
  { entityId: 'dev-hel-core-rtr02', name: 'HEL-Core-Router-02', ip: '10.1.1.2', type: 'Cisco ISR 4451', status: 'UP', cpu: 42, memory: 55, problems: 0, reachability: 100, traffic: 3.8, location: 'New York' },
  { entityId: 'dev-hel-fw01', name: 'HEL-Firewall-01', ip: '10.1.2.1', type: 'Palo Alto PA-5250', status: 'UP', cpu: 28, memory: 40, problems: 0, reachability: 100, traffic: 5.1, location: 'New York' },
  { entityId: 'dev-hel-sw-dist01', name: 'HEL-Dist-Switch-01', ip: '10.1.3.1', type: 'Cisco Catalyst 9300', status: 'UP', cpu: 15, memory: 32, problems: 0, reachability: 100, traffic: 2.4, location: 'New York' },
  { entityId: 'dev-hel-sw-acc01', name: 'HEL-Access-Switch-01', ip: '10.1.3.10', type: 'Cisco Catalyst 9200', status: 'DEGRADED', cpu: 78, memory: 82, problems: 1, reachability: 99.2, traffic: 0.8, location: 'New York' },
  { entityId: 'dev-esp-core-rtr01', name: 'ESP-Core-Router-01', ip: '10.2.1.1', type: 'Juniper MX204', status: 'UP', cpu: 22, memory: 35, problems: 0, reachability: 100, traffic: 3.5, location: 'Boston' },
  { entityId: 'dev-esp-sw01', name: 'ESP-Switch-01', ip: '10.2.3.1', type: 'Juniper EX4300', status: 'UP', cpu: 12, memory: 28, problems: 0, reachability: 100, traffic: 1.2, location: 'Boston' },
  { entityId: 'dev-tmp-wan-rtr01', name: 'TMP-WAN-Router-01', ip: '10.3.1.1', type: 'Cisco ISR 4331', status: 'DEGRADED', cpu: 72, memory: 68, problems: 1, reachability: 97.8, traffic: 1.8, location: 'Chicago' },
  { entityId: 'dev-tmp-sw01', name: 'TMP-Switch-01', ip: '10.3.3.1', type: 'Cisco Catalyst 9300', status: 'UP', cpu: 18, memory: 30, problems: 0, reachability: 100, traffic: 0.9, location: 'Chicago' },
  { entityId: 'dev-oul-wan-rtr01', name: 'OUL-WAN-Router-01', ip: '10.5.1.1', type: 'Cisco ISR 4451', status: 'DOWN', cpu: 0, memory: 0, problems: 2, reachability: 0, traffic: 0, location: 'Denver' },
  { entityId: 'dev-oul-sw01', name: 'OUL-Switch-01', ip: '10.5.3.1', type: 'Cisco Catalyst 9200', status: 'DOWN', cpu: 0, memory: 0, problems: 1, reachability: 0, traffic: 0, location: 'Denver' },
  { entityId: 'dev-rov-sdwan01', name: 'ROV-SD-WAN-01', ip: '10.8.1.1', type: 'Viptela vEdge', status: 'DEGRADED', cpu: 55, memory: 60, problems: 1, reachability: 95.3, traffic: 0.3, location: 'Seattle' },
  { entityId: 'dev-syd-core-rtr01', name: 'SYD-Core-Router-01', ip: '10.10.1.1', type: 'Cisco ASR 1002-HX', status: 'UP', cpu: 38, memory: 52, problems: 0, reachability: 100, traffic: 6.2, location: 'Sydney' },
  { entityId: 'dev-syd-core-rtr02', name: 'SYD-Core-Router-02', ip: '10.10.1.2', type: 'Cisco ASR 1002-HX', status: 'UP', cpu: 35, memory: 48, problems: 0, reachability: 100, traffic: 5.8, location: 'Sydney' },
  { entityId: 'dev-syd-fw01', name: 'SYD-Firewall-01', ip: '10.10.2.1', type: 'Palo Alto PA-5260', status: 'UP', cpu: 32, memory: 44, problems: 0, reachability: 100, traffic: 7.5, location: 'Sydney' },
  { entityId: 'dev-syd-sw-dist01', name: 'SYD-Dist-Switch-01', ip: '10.10.3.1', type: 'Cisco Catalyst 9500', status: 'UP', cpu: 20, memory: 35, problems: 0, reachability: 100, traffic: 3.4, location: 'Sydney' },
  { entityId: 'dev-mel-wan-rtr01', name: 'MEL-WAN-Router-01', ip: '10.11.1.1', type: 'Juniper MX204', status: 'DEGRADED', cpu: 68, memory: 72, problems: 1, reachability: 98.5, traffic: 2.8, location: 'Melbourne' },
  { entityId: 'dev-mel-sw01', name: 'MEL-Switch-01', ip: '10.11.3.1', type: 'Juniper EX4400', status: 'UP', cpu: 18, memory: 30, problems: 0, reachability: 100, traffic: 1.5, location: 'Melbourne' },
  { entityId: 'dev-akl-rtr01', name: 'AKL-Router-01', ip: '10.12.1.1', type: 'Cisco ISR 4351', status: 'UP', cpu: 28, memory: 38, problems: 0, reachability: 100, traffic: 1.9, location: 'Auckland' },
  { entityId: 'dev-akl-fw01', name: 'AKL-Firewall-01', ip: '10.12.2.1', type: 'Fortinet FG-400E', status: 'UP', cpu: 22, memory: 30, problems: 0, reachability: 100, traffic: 2.2, location: 'Auckland' },
  { entityId: 'dev-akl-sw01', name: 'AKL-Switch-01', ip: '10.12.3.1', type: 'Cisco Catalyst 9300', status: 'UP', cpu: 15, memory: 28, problems: 0, reachability: 100, traffic: 1.0, location: 'Auckland' },
  { entityId: 'dev-wlg-rtr01', name: 'WLG-Router-01', ip: '10.13.1.1', type: 'Cisco ISR 4331', status: 'UP', cpu: 20, memory: 32, problems: 0, reachability: 100, traffic: 0.8, location: 'Wellington' },
  { entityId: 'dev-wlg-sw01', name: 'WLG-Switch-01', ip: '10.13.3.1', type: 'Cisco Catalyst 9200', status: 'UP', cpu: 12, memory: 24, problems: 0, reachability: 100, traffic: 0.5, location: 'Wellington' },
];

/* ── Demo Interfaces ───────────────────────────── */

export const DEMO_INTERFACES: NetworkInterface[] = [
  { entityId: 'if-hel-rtr01-ge0', deviceName: 'HEL-Core-Router-01', name: 'GigabitEthernet0/0/0', status: 'UP', inLoad: 45, outLoad: 38, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 2.1, trafficOut: 1.8 },
  { entityId: 'if-hel-rtr01-ge1', deviceName: 'HEL-Core-Router-01', name: 'GigabitEthernet0/0/1', status: 'UP', inLoad: 32, outLoad: 28, inErrors: 12, outErrors: 5, inDiscards: 0, outDiscards: 0, trafficIn: 1.5, trafficOut: 1.3 },
  { entityId: 'if-hel-fw01-eth1', deviceName: 'HEL-Firewall-01', name: 'ethernet1/1', status: 'UP', inLoad: 55, outLoad: 48, inErrors: 0, outErrors: 0, inDiscards: 3, outDiscards: 0, trafficIn: 2.8, trafficOut: 2.3 },
  { entityId: 'if-hel-fw01-eth2', deviceName: 'HEL-Firewall-01', name: 'ethernet1/2', status: 'UP', inLoad: 40, outLoad: 35, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 2.0, trafficOut: 1.7 },
  { entityId: 'if-esp-rtr01-ge0', deviceName: 'ESP-Core-Router-01', name: 'ge-0/0/0', status: 'UP', inLoad: 28, outLoad: 22, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 1.4, trafficOut: 1.1 },
  { entityId: 'if-tmp-rtr01-ge0', deviceName: 'TMP-WAN-Router-01', name: 'GigabitEthernet0/0/0', status: 'UP', inLoad: 72, outLoad: 65, inErrors: 45, outErrors: 22, inDiscards: 8, outDiscards: 4, trafficIn: 0.9, trafficOut: 0.8 },
  { entityId: 'if-tmp-rtr01-ge1', deviceName: 'TMP-WAN-Router-01', name: 'GigabitEthernet0/0/1', status: 'DOWN', inLoad: 0, outLoad: 0, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 0, trafficOut: 0 },
  { entityId: 'if-oul-rtr01-ge0', deviceName: 'OUL-WAN-Router-01', name: 'GigabitEthernet0/0/0', status: 'DOWN', inLoad: 0, outLoad: 0, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 0, trafficOut: 0 },
  { entityId: 'if-oul-sw01-ge1', deviceName: 'OUL-Switch-01', name: 'GigabitEthernet1/0/1', status: 'DOWN', inLoad: 0, outLoad: 0, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 0, trafficOut: 0 },
  { entityId: 'if-rov-sdwan01-ge0', deviceName: 'ROV-SD-WAN-01', name: 'ge0/0', status: 'UP', inLoad: 82, outLoad: 75, inErrors: 120, outErrors: 88, inDiscards: 15, outDiscards: 10, trafficIn: 0.2, trafficOut: 0.1 },
  { entityId: 'if-hel-srv01-eth0', deviceName: 'HEL-Server-01', name: 'eth0', status: 'UP', inLoad: 18, outLoad: 15, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 0.8, trafficOut: 0.6 },
  { entityId: 'if-hel-acc01-ge1', deviceName: 'HEL-Access-Switch-01', name: 'GigabitEthernet1/0/1', status: 'UP', inLoad: 62, outLoad: 58, inErrors: 8, outErrors: 3, inDiscards: 2, outDiscards: 1, trafficIn: 0.4, trafficOut: 0.3 },
  { entityId: 'if-syd-rtr01-te0', deviceName: 'SYD-Core-Router-01', name: 'TenGigabitEthernet0/0/0', status: 'UP', inLoad: 52, outLoad: 45, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 3.1, trafficOut: 2.8 },
  { entityId: 'if-syd-rtr01-te1', deviceName: 'SYD-Core-Router-01', name: 'TenGigabitEthernet0/0/1', status: 'UP', inLoad: 38, outLoad: 32, inErrors: 2, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 2.2, trafficOut: 1.9 },
  { entityId: 'if-syd-fw01-eth1', deviceName: 'SYD-Firewall-01', name: 'ethernet1/1', status: 'UP', inLoad: 60, outLoad: 55, inErrors: 0, outErrors: 0, inDiscards: 1, outDiscards: 0, trafficIn: 3.8, trafficOut: 3.2 },
  { entityId: 'if-syd-sw01-te1', deviceName: 'SYD-Dist-Switch-01', name: 'TenGigabitEthernet1/0/1', status: 'UP', inLoad: 35, outLoad: 28, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 1.8, trafficOut: 1.5 },
  { entityId: 'if-mel-rtr01-ge0', deviceName: 'MEL-WAN-Router-01', name: 'ge-0/0/0', status: 'UP', inLoad: 78, outLoad: 70, inErrors: 35, outErrors: 18, inDiscards: 6, outDiscards: 3, trafficIn: 1.5, trafficOut: 1.2 },
  { entityId: 'if-mel-sw01-ge1', deviceName: 'MEL-Switch-01', name: 'ge-0/0/1', status: 'UP', inLoad: 25, outLoad: 20, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 0.8, trafficOut: 0.6 },
  { entityId: 'if-akl-rtr01-ge0', deviceName: 'AKL-Router-01', name: 'GigabitEthernet0/0/0', status: 'UP', inLoad: 42, outLoad: 35, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 1.0, trafficOut: 0.8 },
  { entityId: 'if-akl-fw01-eth1', deviceName: 'AKL-Firewall-01', name: 'ethernet1/1', status: 'UP', inLoad: 38, outLoad: 30, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 1.2, trafficOut: 0.9 },
  { entityId: 'if-wlg-rtr01-ge0', deviceName: 'WLG-Router-01', name: 'GigabitEthernet0/0/0', status: 'UP', inLoad: 30, outLoad: 25, inErrors: 0, outErrors: 0, inDiscards: 0, outDiscards: 0, trafficIn: 0.5, trafficOut: 0.3 },
];

/* ── Demo Cluster Regions ──────────────────────── */

export const DEMO_REGIONS: TopologyCluster[] = [
  { id: 'region-northeast', label: 'Northeast', x: 0, y: 0, lat: 40.71, lon: -74.01, deviceCount: 80, healthSummary: { healthy: 75, warning: 4, critical: 1, unknown: 0 }, avgCpu: 32, avgMemory: 45, alertCount: 2 },
  { id: 'region-midwest', label: 'Midwest', x: 0, y: 0, lat: 41.88, lon: -87.63, deviceCount: 24, healthSummary: { healthy: 20, warning: 3, critical: 1, unknown: 0 }, avgCpu: 48, avgMemory: 52, alertCount: 2 },
  { id: 'region-southeast', label: 'Southeast', x: 0, y: 0, lat: 33.75, lon: -84.39, deviceCount: 16, healthSummary: { healthy: 16, warning: 0, critical: 0, unknown: 0 }, avgCpu: 20, avgMemory: 30, alertCount: 0 },
  { id: 'region-northwest', label: 'Northwest', x: 0, y: 0, lat: 39.74, lon: -104.99, deviceCount: 20, healthSummary: { healthy: 0, warning: 0, critical: 20, unknown: 0 }, avgCpu: 0, avgMemory: 0, alertCount: 3 },
  { id: 'region-central', label: 'Central', x: 0, y: 0, lat: 32.78, lon: -96.80, deviceCount: 14, healthSummary: { healthy: 14, warning: 0, critical: 0, unknown: 0 }, avgCpu: 18, avgMemory: 28, alertCount: 0 },
  { id: 'region-north', label: 'North', x: 0, y: 0, lat: 47.61, lon: -122.33, deviceCount: 8, healthSummary: { healthy: 4, warning: 3, critical: 1, unknown: 0 }, avgCpu: 55, avgMemory: 60, alertCount: 1 },
  { id: 'region-australia', label: 'Australia', x: 0, y: 0, lat: -33.87, lon: 151.21, deviceCount: 54, healthSummary: { healthy: 48, warning: 5, critical: 1, unknown: 0 }, avgCpu: 38, avgMemory: 50, alertCount: 2 },
  { id: 'region-newzealand', label: 'New Zealand', x: 0, y: 0, lat: -36.85, lon: 174.76, deviceCount: 20, healthSummary: { healthy: 19, warning: 1, critical: 0, unknown: 0 }, avgCpu: 25, avgMemory: 35, alertCount: 0 },
];

export const DEMO_CLUSTER_SITES: Record<string, TopologySite[]> = {
  'region-northeast': [
    { id: 'site-newyork-dc', label: 'New York DC', type: 'data-center', deviceCount: 48, healthSummary: { healthy: 46, warning: 1, critical: 1, unknown: 0 } },
    { id: 'site-boston-campus', label: 'Boston Campus', type: 'office', deviceCount: 32, healthSummary: { healthy: 29, warning: 3, critical: 0, unknown: 0 } },
  ],
  'region-midwest': [
    { id: 'site-chicago-office', label: 'Chicago Office', type: 'office', deviceCount: 24, healthSummary: { healthy: 20, warning: 3, critical: 1, unknown: 0 } },
  ],
  'region-southeast': [
    { id: 'site-atlanta-branch', label: 'Atlanta Branch', type: 'office', deviceCount: 16, healthSummary: { healthy: 16, warning: 0, critical: 0, unknown: 0 } },
  ],
  'region-northwest': [
    { id: 'site-denver-north', label: 'Denver North', type: 'pop', deviceCount: 20, healthSummary: { healthy: 0, warning: 0, critical: 20, unknown: 0 } },
  ],
  'region-central': [
    { id: 'site-dallas-hub', label: 'Dallas Hub', type: 'exchange', deviceCount: 14, healthSummary: { healthy: 14, warning: 0, critical: 0, unknown: 0 } },
  ],
  'region-north': [
    { id: 'site-seattle-north', label: 'Seattle Remote', type: 'pop', deviceCount: 8, healthSummary: { healthy: 4, warning: 3, critical: 1, unknown: 0 } },
  ],
  'region-australia': [
    { id: 'site-sydney-dc', label: 'Sydney DC', type: 'data-center', deviceCount: 36, healthSummary: { healthy: 32, warning: 3, critical: 1, unknown: 0 } },
    { id: 'site-melbourne-office', label: 'Melbourne Office', type: 'office', deviceCount: 18, healthSummary: { healthy: 16, warning: 2, critical: 0, unknown: 0 } },
  ],
  'region-newzealand': [
    { id: 'site-auckland-pop', label: 'Auckland PoP', type: 'pop', deviceCount: 12, healthSummary: { healthy: 11, warning: 1, critical: 0, unknown: 0 } },
    { id: 'site-wellington-branch', label: 'Wellington Branch', type: 'office', deviceCount: 8, healthSummary: { healthy: 8, warning: 0, critical: 0, unknown: 0 } },
  ],
};

export function generateSiteTopology(site: TopologySite): { nodes: Omit<TopologyNode, 'x' | 'y'>[]; edges: TopologyEdge[] } {
  const count = Math.min(site.deviceCount, 8);
  const nodes: Omit<TopologyNode, 'x' | 'y'>[] = [];
  const edges: TopologyEdge[] = [];
  const roles: TopologyNode['role'][] = ['router', 'switch', 'firewall', 'server'];
  for (let i = 0; i < count; i++) {
    const role = roles[i % roles.length];
    const health: TopologyNode['health'] = i === 0 && site.healthSummary.critical > 0 ? 'critical' : 'healthy';
    nodes.push({ id: `${site.id}-dev-${i}`, label: `${site.label}-${role}-${i}`, role, health });
  }
  for (let i = 1; i < nodes.length; i++) {
    edges.push({ source: nodes[0].id, target: nodes[i].id, utilization: Math.random() * 60, bandwidth: 1000, edgeType: 'lldp' });
  }
  return { nodes, edges };
}

/* ── Demo Davis problems (alerts) ────────────── */

export const DEMO_DAVIS_PROBLEMS: DavisProblem[] = [
  {
    problemId: 'P-2403191200',
    displayId: 'P-2403191200',
    title: 'Denver North — all devices unreachable',
    severity: 'AVAILABILITY',
    status: 'OPEN',
    startTime: new Date(Date.now() - 45 * 60_000).toISOString(),
    affectedEntities: ['CUSTOM_DEVICE-001', 'CUSTOM_DEVICE-002', 'CUSTOM_DEVICE-003'],
    rootCauseEntity: 'CUSTOM_DEVICE-001',
    managementZone: 'Denver North',
  },
  {
    problemId: 'P-2403191130',
    displayId: 'P-2403191130',
    title: 'High CPU on core router CHI-RTR-01',
    severity: 'RESOURCE',
    status: 'OPEN',
    startTime: new Date(Date.now() - 90 * 60_000).toISOString(),
    affectedEntities: ['CUSTOM_DEVICE-010'],
    rootCauseEntity: 'CUSTOM_DEVICE-010',
    managementZone: 'Chicago Office',
  },
  {
    problemId: 'P-2403191100',
    displayId: 'P-2403191100',
    title: 'Elevated error rate on WAN interface Gi0/0/1',
    severity: 'ERROR',
    status: 'OPEN',
    startTime: new Date(Date.now() - 2 * 3600_000).toISOString(),
    affectedEntities: ['NETWORK_INTERFACE-050'],
    rootCauseEntity: 'CUSTOM_DEVICE-005',
    managementZone: 'Chicago Office',
  },
  {
    problemId: 'P-2403191050',
    displayId: 'P-2403191050',
    title: 'Slow DNS response times at multiple sites',
    severity: 'SLOWDOWN',
    status: 'OPEN',
    startTime: new Date(Date.now() - 3 * 3600_000).toISOString(),
    affectedEntities: ['SERVICE-DNS-01', 'SERVICE-DNS-02'],
    managementZone: 'DNS / DHCP',
  },
  {
    problemId: 'P-2403190930',
    displayId: 'P-2403190930',
    title: 'BGP session flapping with peer 10.0.0.1',
    severity: 'AVAILABILITY',
    status: 'OPEN',
    startTime: new Date(Date.now() - 5 * 3600_000).toISOString(),
    affectedEntities: ['CUSTOM_DEVICE-015'],
    rootCauseEntity: 'CUSTOM_DEVICE-015',
    managementZone: 'Seattle Remote',
  },
  {
    problemId: 'P-2403190800',
    displayId: 'P-2403190800',
    title: 'Custom threshold: interface utilization > 90%',
    severity: 'CUSTOM_ALERT',
    status: 'OPEN',
    startTime: new Date(Date.now() - 8 * 3600_000).toISOString(),
    affectedEntities: ['NETWORK_INTERFACE-080'],
    managementZone: 'New York DC',
  },
  {
    problemId: 'P-2403190600',
    displayId: 'P-2403190600',
    title: 'Memory usage critical on SEA-SW-02',
    severity: 'RESOURCE',
    status: 'OPEN',
    startTime: new Date(Date.now() - 12 * 3600_000).toISOString(),
    affectedEntities: ['CUSTOM_DEVICE-020'],
    rootCauseEntity: 'CUSTOM_DEVICE-020',
    managementZone: 'Seattle Remote',
  },
];

/* ── Demo top interfaces by error rate ───────── */

export interface DemoInterfaceErrorRow {
  interfaceId: string;
  interfaceName: string;
  deviceName: string;
  totalErrors: number;
  totalBytes: number;
  errorRate: number;
}

export const DEMO_TOP_INTERFACES_BY_ERRORS: DemoInterfaceErrorRow[] = [
  { interfaceId: 'NI-001', interfaceName: 'Gi0/0/1', deviceName: 'CHI-RTR-01', totalErrors: 14520, totalBytes: 890_000_000, errorRate: 0.0016 },
  { interfaceId: 'NI-002', interfaceName: 'Te0/1/0', deviceName: 'DEN-SW-01', totalErrors: 9830, totalBytes: 1_200_000_000, errorRate: 0.00082 },
  { interfaceId: 'NI-003', interfaceName: 'Gi0/0/2', deviceName: 'SEA-FW-01', totalErrors: 7200, totalBytes: 450_000_000, errorRate: 0.0016 },
  { interfaceId: 'NI-004', interfaceName: 'Gi0/0/0', deviceName: 'NYC-RTR-02', totalErrors: 5100, totalBytes: 3_500_000_000, errorRate: 0.00015 },
  { interfaceId: 'NI-005', interfaceName: 'Gi0/1/1', deviceName: 'BOS-SW-03', totalErrors: 3400, totalBytes: 780_000_000, errorRate: 0.00044 },
  { interfaceId: 'NI-006', interfaceName: 'Te0/0/0', deviceName: 'ATL-RTR-01', totalErrors: 2800, totalBytes: 2_100_000_000, errorRate: 0.00013 },
  { interfaceId: 'NI-007', interfaceName: 'Gi0/0/3', deviceName: 'DAL-SW-02', totalErrors: 1950, totalBytes: 600_000_000, errorRate: 0.00033 },
  { interfaceId: 'NI-008', interfaceName: 'Gi0/2/0', deviceName: 'PHX-FW-01', totalErrors: 1200, totalBytes: 340_000_000, errorRate: 0.00035 },
  { interfaceId: 'NI-009', interfaceName: 'Gi0/0/0', deviceName: 'CHI-SW-04', totalErrors: 890, totalBytes: 1_800_000_000, errorRate: 0.00005 },
  { interfaceId: 'NI-010', interfaceName: 'Te0/1/1', deviceName: 'NYC-RTR-01', totalErrors: 450, totalBytes: 5_200_000_000, errorRate: 0.000009 },
];
