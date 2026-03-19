/**
 * Core domain types for NOC Dashboard dt-app.
 */

export type HealthStatus = 'healthy' | 'degraded' | 'outage' | 'unknown';
export type Severity = 'critical' | 'major' | 'minor' | 'info';
export type IncidentStatus = 'open' | 'acknowledged' | 'resolved';
export type TimeRange = '1h' | '24h' | '7d' | '30d';

export interface OverviewKpi {
  availability: { value: number; unit: '%'; ranges: Record<TimeRange, number> };
  latencyP50Ms: number;
  latencyP95Ms: number;
  packetLossPct: number;
  jitterMs: number;
  incidents: { open: number; acknowledged: number; resolved: number };
  slaCompliancePct: number;
  topImpactedSites: Array<{ siteId: string; name: string; health: HealthStatus; incidentCount: number }>;
  topImpactedServices: Array<{ serviceId: string; name: string; health: HealthStatus; incidentCount: number }>;
}

export interface Site {
  id: string;
  name: string;
  region: string;
  latitude: number;
  longitude: number;
  health: HealthStatus;
  deviceCount: number;
  circuitCount: number;
}

export interface Incident {
  id: string;
  title: string;
  severity: Severity;
  status: IncidentStatus;
  siteId?: string;
  siteName?: string;
  serviceId?: string;
  serviceName?: string;
  impactSummary: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SlaReport {
  month: string;
  compliancePct: number;
  downtimeMinutes: number;
  topContributors: Array<{ siteId: string; siteName: string; downtimeMinutes: number }>;
}

export interface ChangeEvent {
  id: string;
  entityType: 'site' | 'service' | 'circuit' | 'device';
  entityId: string;
  entityName: string;
  changeType: string;
  description: string;
  author: string;
  timestamp: string;
}

export interface SparklinePoint {
  timestamp: string;
  value: number;
}

/* ── Topology types ────────────────────────────────── */

/** Full Smartscape entity role hierarchy (bottom → top) */
export type DeviceRole =
  | 'cloud' | 'cloud-gw'       // Layer 0 — Cloud / WAN
  | 'router'                   // Layer 1 — Core routing
  | 'firewall'                 // Layer 2 — Security
  | 'switch'                   // Layer 3 — Distribution / Access
  | 'server' | 'host'          // Layer 4 — Hosts (physical / VM)
  | 'process-group'            // Layer 5 — Process groups
  | 'service'                  // Layer 6 — Services
  | 'application'              // Layer 7 — Applications / Synthetic
  | 'unknown';

/** Edge relationship types across the full topology */
export type TopologyEdgeType =
  | 'lldp' | 'bgp' | 'flow'   // Network layer
  | 'runs-on'                  // Host ↔ Process / Network device → Host
  | 'calls'                    // Service → Service / Process → Process
  | 'serves'                   // Service → Application
  | 'manual';

export interface TopologyNode {
  id: string;
  label: string;
  role: DeviceRole;
  health: 'healthy' | 'warning' | 'critical' | 'unknown';
  x: number;
  y: number;
  ip?: string;
  type?: string;
  cpu?: number;
  memory?: number;
  location?: string;
  isExternal?: boolean;
  /** Smartscape entity type (e.g. dt.entity.host) */
  entityType?: string;
  /** Technology type for processes/services */
  technology?: string;
  /** Request count for services */
  requestRate?: number;
  /** Response time ms for services */
  responseTime?: number;
  /** Error rate % for services */
  errorRate?: number;
  /** Instance count for process groups */
  instances?: number;
  /** User action count for applications */
  userActions?: number;
  /** Apdex score */
  apdex?: number;
}

export interface TopologyEdge {
  id?: string;
  source: string;
  target: string;
  utilization: number;
  bandwidth: number;
  edgeType?: TopologyEdgeType;
  directed?: boolean;
  /** Call count / request volume on this edge */
  callCount?: number;
}

/* ── Network device & interface types ──────────────── */

export interface NetworkDevice {
  entityId: string;
  name: string;
  ip: string;
  type: string;
  status: 'UP' | 'DEGRADED' | 'DOWN';
  cpu: number;
  memory: number;
  problems: number;
  reachability: number;
  traffic: number;
  location?: string;
}

export interface NetworkInterface {
  entityId: string;
  deviceName: string;
  name: string;
  status: 'UP' | 'DOWN' | 'ADMIN_DOWN';
  inLoad: number;
  outLoad: number;
  inErrors: number;
  outErrors: number;
  inDiscards: number;
  outDiscards: number;
  trafficIn: number;
  trafficOut: number;
}

/* ── Cluster map types ─────────────────────────────── */

export interface HealthSummary {
  healthy: number;
  warning: number;
  critical: number;
  unknown: number;
}

export interface TopologyCluster {
  id: string;
  label: string;
  x: number;
  y: number;
  lat: number;
  lon: number;
  deviceCount: number;
  healthSummary: HealthSummary;
  avgCpu?: number;
  avgMemory?: number;
  alertCount: number;
}

export interface TopologySite {
  id: string;
  label: string;
  type: 'data-center' | 'office' | 'pop' | 'cell-tower' | 'exchange';
  deviceCount: number;
  healthSummary: HealthSummary;
}

export type DrillDownLevel = 'country' | 'region' | 'site';

/* ── Customer service portal types ──────────────────── */

export type ServiceType = 'internet' | 'mpls-wan' | 'sd-wan' | 'dns-dhcp' | 'firewall' | 'colocation' | 'cloud-connect';
export type ServiceStatus = 'active' | 'degraded' | 'outage' | 'maintenance' | 'pending';
export type TicketStatus = 'open' | 'in-progress' | 'waiting-customer' | 'resolved' | 'closed';
export type TicketPriority = 'critical' | 'high' | 'medium' | 'low';
export type TicketCategory = 'incident' | 'bandwidth-request' | 'configuration' | 'billing' | 'general';
export type NotificationChannel = 'email' | 'sms' | 'webhook' | 'teams';

export interface CustomerService {
  id: string;
  name: string;
  type: ServiceType;
  status: ServiceStatus;
  siteId: string;
  siteName: string;
  orderedBandwidthMbps: number;
  currentUsageMbps: number;
  peakUsageMbps: number;
  avgUsageMbps: number;
  slaTarget: number;
  slaActual: number;
  contractStart: string;
  contractEnd: string;
  monthlyCostEur: number;
  circuitId?: string;
  usageHistory: SparklinePoint[];
}

export interface BandwidthForecast {
  serviceId: string;
  currentUsagePct: number;
  growthRatePctPerMonth: number;
  predictedExhaustionDate: string | null;
  daysUntilThreshold80: number | null;
  daysUntilThreshold95: number | null;
  recommendedUpgradeMbps: number | null;
  projectedPoints: SparklinePoint[];
  confidenceLow: SparklinePoint[];
  confidenceHigh: SparklinePoint[];
}

export interface SupportTicket {
  id: string;
  title: string;
  description: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  serviceId?: string;
  serviceName?: string;
  siteId?: string;
  siteName?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  assignee?: string;
  messages: TicketMessage[];
  relatedIncidentIds: string[];
}

export interface TicketMessage {
  id: string;
  author: string;
  authorRole: 'customer' | 'support' | 'system';
  content: string;
  timestamp: string;
}

export interface NotificationRule {
  id: string;
  name: string;
  enabled: boolean;
  serviceId?: string;
  metric: 'bandwidth-usage' | 'latency' | 'packet-loss' | 'availability' | 'cpu' | 'memory' | 'errors';
  thresholdPct: number;
  channels: NotificationChannel[];
  cooldownMinutes: number;
  autoEscalate: boolean;
  lastTriggered?: string;
}

export interface BandwidthUpgradeRequest {
  serviceId: string;
  currentMbps: number;
  requestedMbps: number;
  reason: string;
  temporary: boolean;
  tempDurationDays?: number;
}

/* ── KPI / threshold types ─────────────────────────── */

export interface ThresholdRule {
  comparator: '==' | '<' | '<=' | '>' | '>=';
  value: number;
  color: 'green' | 'amber' | 'red';
}
