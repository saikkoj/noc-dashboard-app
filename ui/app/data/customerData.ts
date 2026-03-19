/**
 * Demo data for customer service portal.
 * Enterprise customer of capacity/network services.
 */

import type {
  CustomerService, BandwidthForecast, SupportTicket, NotificationRule,
  SparklinePoint,
} from '../types/network';

/* ── Helpers ───────────────────────────────────── */

function generateUsageHistory(
  baseGbps: number, trendPctPerDay: number, days: number, variance: number,
): SparklinePoint[] {
  const now = Date.now();
  const dayMs = 86400_000;
  return Array.from({ length: days }, (_, i) => {
    const growth = 1 + (trendPctPerDay / 100) * i;
    const jitter = 1 + (Math.random() - 0.5) * 2 * (variance / 100);
    return {
      timestamp: new Date(now - (days - i) * dayMs).toISOString(),
      value: +(baseGbps * growth * jitter).toFixed(2),
    };
  });
}

function generateForecast(
  currentUsageMbps: number, orderedMbps: number, growthPctPerMonth: number, months: number,
): { projected: SparklinePoint[]; low: SparklinePoint[]; high: SparklinePoint[] } {
  const now = Date.now();
  const monthMs = 30 * 86400_000;
  const projected: SparklinePoint[] = [];
  const low: SparklinePoint[] = [];
  const high: SparklinePoint[] = [];
  for (let i = 0; i <= months; i++) {
    const growth = Math.pow(1 + growthPctPerMonth / 100, i);
    const val = currentUsageMbps * growth;
    const ts = new Date(now + i * monthMs).toISOString();
    projected.push({ timestamp: ts, value: +val.toFixed(0) });
    low.push({ timestamp: ts, value: +(val * 0.85).toFixed(0) });
    high.push({ timestamp: ts, value: +(val * 1.18).toFixed(0) });
  }
  return { projected, low, high };
}

function daysUntilThreshold(currentMbps: number, orderedMbps: number, growthPctPerMonth: number, thresholdPct: number): number | null {
  if (currentMbps <= 0 || growthPctPerMonth <= 0) return null;
  const target = orderedMbps * (thresholdPct / 100);
  if (currentMbps >= target) return 0;
  const monthsNeeded = Math.log(target / currentMbps) / Math.log(1 + growthPctPerMonth / 100);
  return Math.round(monthsNeeded * 30);
}

/* ── Customer Services ─────────────────────────── */

export const DEMO_CUSTOMER_SERVICES: CustomerService[] = [
  {
    id: 'svc-internet-hel',
    name: 'Internet Connection New York DC',
    type: 'internet',
    status: 'active',
    siteId: 'site-newyork-dc',
    siteName: 'New York DC',
    orderedBandwidthMbps: 10000,
    currentUsageMbps: 7200,
    peakUsageMbps: 8900,
    avgUsageMbps: 6500,
    slaTarget: 99.95,
    slaActual: 99.98,
    contractStart: '2024-01-01',
    contractEnd: '2026-12-31',
    monthlyCostEur: 4500,
    circuitId: 'CIR-HEL-INT-001',
    usageHistory: generateUsageHistory(5.5, 0.12, 90, 15),
  },
  {
    id: 'svc-mpls-hel-tmp',
    name: 'MPLS WAN New York–Chicago',
    type: 'mpls-wan',
    status: 'degraded',
    siteId: 'site-newyork-dc',
    siteName: 'New York DC → Chicago Office',
    orderedBandwidthMbps: 1000,
    currentUsageMbps: 820,
    peakUsageMbps: 960,
    avgUsageMbps: 750,
    slaTarget: 99.9,
    slaActual: 99.72,
    contractStart: '2024-03-01',
    contractEnd: '2027-02-28',
    monthlyCostEur: 2800,
    circuitId: 'CIR-HEL-TMP-001',
    usageHistory: generateUsageHistory(0.65, 0.18, 90, 12),
  },
  {
    id: 'svc-mpls-hel-oul',
    name: 'MPLS WAN New York–Denver',
    type: 'mpls-wan',
    status: 'outage',
    siteId: 'site-newyork-dc',
    siteName: 'New York DC → Denver North',
    orderedBandwidthMbps: 500,
    currentUsageMbps: 0,
    peakUsageMbps: 480,
    avgUsageMbps: 380,
    slaTarget: 99.9,
    slaActual: 98.4,
    contractStart: '2024-03-01',
    contractEnd: '2027-02-28',
    monthlyCostEur: 1800,
    circuitId: 'CIR-HEL-OUL-001',
    usageHistory: generateUsageHistory(0.35, 0.08, 90, 10),
  },
  {
    id: 'svc-sdwan-overlay',
    name: 'SD-WAN Overlay (all sites)',
    type: 'sd-wan',
    status: 'active',
    siteId: 'site-newyork-dc',
    siteName: 'All kohteet',
    orderedBandwidthMbps: 2000,
    currentUsageMbps: 1100,
    peakUsageMbps: 1650,
    avgUsageMbps: 980,
    slaTarget: 99.95,
    slaActual: 99.96,
    contractStart: '2025-01-01',
    contractEnd: '2027-12-31',
    monthlyCostEur: 3200,
    usageHistory: generateUsageHistory(0.85, 0.22, 90, 18),
  },
  {
    id: 'svc-internet-esp',
    name: 'Internet Connection Boston Campus',
    type: 'internet',
    status: 'active',
    siteId: 'site-boston-campus',
    siteName: 'Boston Campus',
    orderedBandwidthMbps: 5000,
    currentUsageMbps: 2800,
    peakUsageMbps: 3900,
    avgUsageMbps: 2400,
    slaTarget: 99.95,
    slaActual: 99.99,
    contractStart: '2024-06-01',
    contractEnd: '2027-05-31',
    monthlyCostEur: 2200,
    circuitId: 'CIR-ESP-INT-001',
    usageHistory: generateUsageHistory(2.0, 0.09, 90, 10),
  },
  {
    id: 'svc-dns-dhcp',
    name: 'Managed DNS / DHCP',
    type: 'dns-dhcp',
    status: 'degraded',
    siteId: 'site-newyork-dc',
    siteName: 'All kohteet',
    orderedBandwidthMbps: 0,
    currentUsageMbps: 0,
    peakUsageMbps: 0,
    avgUsageMbps: 0,
    slaTarget: 99.99,
    slaActual: 99.85,
    contractStart: '2024-01-01',
    contractEnd: '2026-12-31',
    monthlyCostEur: 800,
    usageHistory: [],
  },
  {
    id: 'svc-fw-managed',
    name: 'Managed Firewall',
    type: 'firewall',
    status: 'active',
    siteId: 'site-newyork-dc',
    siteName: 'New York DC',
    orderedBandwidthMbps: 10000,
    currentUsageMbps: 5100,
    peakUsageMbps: 7800,
    avgUsageMbps: 4600,
    slaTarget: 99.95,
    slaActual: 99.97,
    contractStart: '2024-01-01',
    contractEnd: '2026-12-31',
    monthlyCostEur: 3500,
    usageHistory: generateUsageHistory(4.0, 0.1, 90, 12),
  },
  {
    id: 'svc-sdwan-rov',
    name: 'SD-WAN Seattle (satellite backup)',
    type: 'sd-wan',
    status: 'degraded',
    siteId: 'site-seattle-north',
    siteName: 'Seattle Remote',
    orderedBandwidthMbps: 100,
    currentUsageMbps: 82,
    peakUsageMbps: 95,
    avgUsageMbps: 70,
    slaTarget: 99.5,
    slaActual: 98.8,
    contractStart: '2025-06-01',
    contractEnd: '2027-05-31',
    monthlyCostEur: 950,
    circuitId: 'CIR-ROV-SDW-001',
    usageHistory: generateUsageHistory(0.06, 0.25, 90, 20),
  },
];

/* ── Bandwidth Forecasts ───────────────────────── */

function buildForecast(svc: CustomerService, growthRate: number): BandwidthForecast {
  const usagePct = svc.orderedBandwidthMbps > 0 ? (svc.currentUsageMbps / svc.orderedBandwidthMbps) * 100 : 0;
  const fc = generateForecast(svc.currentUsageMbps, svc.orderedBandwidthMbps, growthRate, 12);
  const d80 = daysUntilThreshold(svc.currentUsageMbps, svc.orderedBandwidthMbps, growthRate, 80);
  const d95 = daysUntilThreshold(svc.currentUsageMbps, svc.orderedBandwidthMbps, growthRate, 95);
  // recommend next standard tier
  const tiers = [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 40000, 100000];
  const rec = tiers.find(t => t > svc.orderedBandwidthMbps) ?? svc.orderedBandwidthMbps * 2;
  const exhaustionDate = d95 != null && d95 > 0
    ? new Date(Date.now() + d95 * 86400_000).toISOString()
    : null;

  return {
    serviceId: svc.id,
    currentUsagePct: +usagePct.toFixed(1),
    growthRatePctPerMonth: growthRate,
    predictedExhaustionDate: exhaustionDate,
    daysUntilThreshold80: d80,
    daysUntilThreshold95: d95,
    recommendedUpgradeMbps: usagePct > 60 ? rec : null,
    projectedPoints: fc.projected,
    confidenceLow: fc.low,
    confidenceHigh: fc.high,
  };
}

export const DEMO_FORECASTS: BandwidthForecast[] = [
  buildForecast(DEMO_CUSTOMER_SERVICES[0], 3.5),  // Internet HEL — 72% used, growing
  buildForecast(DEMO_CUSTOMER_SERVICES[1], 5.2),  // MPLS HEL-TMP — 82% used, fast growth!
  buildForecast(DEMO_CUSTOMER_SERVICES[3], 6.8),  // SD-WAN overlay — 55%, fastest growth
  buildForecast(DEMO_CUSTOMER_SERVICES[4], 2.1),  // Internet ESP — 56%, moderate
  buildForecast(DEMO_CUSTOMER_SERVICES[6], 3.0),  // Managed FW — 51%
  buildForecast(DEMO_CUSTOMER_SERVICES[7], 7.5),  // SD-WAN ROV — 82%, very fast growth
];

/* ── Support Tickets ───────────────────────────── */

export const DEMO_TICKETS: SupportTicket[] = [
  {
    id: 'TKT-2026-0142',
    title: 'Denver North — complete connection outage',
    description: 'MPLS WAN -yhteys New York–Denver on kokonaan poikki. All 20 devices tavoittamattomia.',
    category: 'incident',
    priority: 'critical',
    status: 'in-progress',
    serviceId: 'svc-mpls-hel-oul',
    serviceName: 'MPLS WAN New York–Denver',
    siteId: 'site-denver-north',
    siteName: 'Denver North',
    createdAt: new Date(Date.now() - 50 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 8 * 60_000).toISOString(),
    assignee: 'NOC Team Tier 2',
    messages: [
      { id: 'msg-1', author: 'System', authorRole: 'system', content: 'Incident detected automatically. MPLS circuit CIR-NYC-DEN-001 is down.', timestamp: new Date(Date.now() - 50 * 60_000).toISOString() },
      { id: 'msg-2', author: 'John Smith', authorRole: 'customer', content: 'All connections at Denver office are down. Impacting entire business operations. Urgent!', timestamp: new Date(Date.now() - 45 * 60_000).toISOString() },
      { id: 'msg-3', author: 'NOC Team', authorRole: 'support', content: 'Investigating. Fault traced to backbone node DEN-CORE-01. Field technician en route.', timestamp: new Date(Date.now() - 30 * 60_000).toISOString() },
      { id: 'msg-4', author: 'NOC Team', authorRole: 'support', content: 'ETA for repair: 45 min. Physical fault in fiber connection.', timestamp: new Date(Date.now() - 8 * 60_000).toISOString() },
    ],
    relatedIncidentIds: ['inc-oulu-unreachable'],
  },
  {
    id: 'TKT-2026-0139',
    title: 'Bandwidth Upgrade: MPLS New York–Chicago',
    description: 'MPLS WAN link New York–Chicago consistently over 80% utilization. We want to upgrade bandwidth from 1 Gbps to 2 Gbps.',
    category: 'bandwidth-request',
    priority: 'high',
    status: 'waiting-customer',
    serviceId: 'svc-mpls-hel-tmp',
    serviceName: 'MPLS WAN New York–Chicago',
    createdAt: new Date(Date.now() - 3 * 86400_000).toISOString(),
    updatedAt: new Date(Date.now() - 1 * 86400_000).toISOString(),
    assignee: 'Capacity Team',
    messages: [
      { id: 'msg-5', author: 'John Smith', authorRole: 'customer', content: 'Bandwidth insufficient. Peak load nearly 100%. Requesting upgrade to 2 Gbps.', timestamp: new Date(Date.now() - 3 * 86400_000).toISOString() },
      { id: 'msg-6', author: 'Capacity Team', authorRole: 'support', content: 'Proposal sent: 2 Gbps MPLS, $4,200/mo. Approval required.', timestamp: new Date(Date.now() - 2 * 86400_000).toISOString() },
      { id: 'msg-7', author: 'Capacity Team', authorRole: 'support', content: 'Awaiting approval for the proposal. Installation possible within 2 business days.', timestamp: new Date(Date.now() - 1 * 86400_000).toISOString() },
    ],
    relatedIncidentIds: [],
  },
  {
    id: 'TKT-2026-0136',
    title: 'DNS Issues: intermittent resolution failures',
    description: 'DNS queries failing intermittently at New York, Boston, and Chicago sites.',
    category: 'incident',
    priority: 'high',
    status: 'in-progress',
    serviceId: 'svc-dns-dhcp',
    serviceName: 'Managed DNS / DHCP',
    createdAt: new Date(Date.now() - 95 * 60_000).toISOString(),
    updatedAt: new Date(Date.now() - 20 * 60_000).toISOString(),
    assignee: 'DNS Team',
    messages: [
      { id: 'msg-8', author: 'System', authorRole: 'system', content: 'DNS error rate exceeded threshold: 2.3% (raja 1%).', timestamp: new Date(Date.now() - 95 * 60_000).toISOString() },
      { id: 'msg-9', author: 'DNS Team', authorRole: 'support', content: 'Backup server activated. Investigating root cause on primary server.', timestamp: new Date(Date.now() - 60 * 60_000).toISOString() },
    ],
    relatedIncidentIds: ['inc-dns-failures'],
  },
  {
    id: 'TKT-2026-0130',
    title: 'Seattle — high latency on satellite',
    description: 'SD-WAN Seattle link has high latency p95 280ms. Primary fiber is under maintenance.',
    category: 'incident',
    priority: 'medium',
    status: 'open',
    serviceId: 'svc-sdwan-rov',
    serviceName: 'SD-WAN Seattle',
    siteId: 'site-seattle-north',
    siteName: 'Seattle Remote',
    createdAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 3 * 3600_000).toISOString(),
    messages: [
      { id: 'msg-10', author: 'John Smith', authorRole: 'customer', content: 'Seattle link is unusably slow. When will fiber maintenance be complete?', timestamp: new Date(Date.now() - 3 * 3600_000).toISOString() },
    ],
    relatedIncidentIds: ['inc-rovaniemi-latency'],
  },
  {
    id: 'TKT-2026-0125',
    title: 'Temporary Bandwidth Upgrade: Boston Campus',
    description: 'Requesting temporary bandwidth upgrade 5 Gbps to 10 Gbps for corporate event Mar 25-27, 2026.',
    category: 'bandwidth-request',
    priority: 'medium',
    status: 'open',
    serviceId: 'svc-internet-esp',
    serviceName: 'Internet Connection Boston Campus',
    siteId: 'site-boston-campus',
    siteName: 'Boston Campus',
    createdAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 86400_000).toISOString(),
    messages: [
      { id: 'msg-11', author: 'John Smith', authorRole: 'customer', content: 'We need a temporary bandwidth upgrade for 3 days for a major corporate event (500+ attendees, video streaming).', timestamp: new Date(Date.now() - 5 * 86400_000).toISOString() },
    ],
    relatedIncidentIds: [],
  },
  {
    id: 'TKT-2026-0118',
    title: 'BGP Session Recovery — resolved',
    description: 'New York DC:n BGP-sessio upstream-operaattoriin katkesi hetkeksi.',
    category: 'incident',
    priority: 'low',
    status: 'closed',
    serviceId: 'svc-internet-hel',
    serviceName: 'Internet Connection New York DC',
    siteId: 'site-newyork-dc',
    siteName: 'New York DC',
    createdAt: new Date(Date.now() - 6 * 3600_000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    resolvedAt: new Date(Date.now() - 5 * 3600_000).toISOString(),
    assignee: 'NOC Team',
    messages: [
      { id: 'msg-12', author: 'System', authorRole: 'system', content: 'BGP-sessio alhaalla 12 sekuntia. Palautui automaattisesti.', timestamp: new Date(Date.now() - 6 * 3600_000).toISOString() },
      { id: 'msg-13', author: 'NOC Team', authorRole: 'support', content: 'Analyzed: brief recovery via route-flap dampening mechanism. No further action needed.', timestamp: new Date(Date.now() - 5 * 3600_000).toISOString() },
    ],
    relatedIncidentIds: ['inc-helsinki-bgp'],
  },
];

/* ── Notification Rules ────────────────────────── */

export const DEMO_NOTIFICATION_RULES: NotificationRule[] = [
  { id: 'notif-bw-80', name: 'Bandwidth over 80%', enabled: true, metric: 'bandwidth-usage', thresholdPct: 80, channels: ['email', 'teams'], cooldownMinutes: 60, autoEscalate: true, lastTriggered: new Date(Date.now() - 2 * 3600_000).toISOString() },
  { id: 'notif-bw-95', name: 'Bandwidth over 95% (critical)', enabled: true, metric: 'bandwidth-usage', thresholdPct: 95, channels: ['email', 'sms', 'teams'], cooldownMinutes: 15, autoEscalate: true, lastTriggered: new Date(Date.now() - 12 * 3600_000).toISOString() },
  { id: 'notif-avail', name: 'Availability below 99.9%', enabled: true, metric: 'availability', thresholdPct: 99.9, channels: ['email', 'teams'], cooldownMinutes: 30, autoEscalate: true, lastTriggered: new Date(Date.now() - 50 * 60_000).toISOString() },
  { id: 'notif-latency', name: 'Latency over 100ms', enabled: true, metric: 'latency', thresholdPct: 100, channels: ['email'], cooldownMinutes: 120, autoEscalate: false, lastTriggered: new Date(Date.now() - 3 * 3600_000).toISOString() },
  { id: 'notif-pktloss', name: 'Packet loss over 1%', enabled: true, metric: 'packet-loss', thresholdPct: 1, channels: ['email', 'sms'], cooldownMinutes: 30, autoEscalate: true },
  { id: 'notif-cpu', name: 'Device CPU over 85%', enabled: false, metric: 'cpu', thresholdPct: 85, channels: ['email'], cooldownMinutes: 60, autoEscalate: false },
  { id: 'notif-mem', name: 'Device memory over 90%', enabled: false, metric: 'memory', thresholdPct: 90, channels: ['email'], cooldownMinutes: 60, autoEscalate: false },
  { id: 'notif-errors', name: 'Interface errors over 100/min', enabled: true, metric: 'errors', thresholdPct: 100, channels: ['teams'], cooldownMinutes: 15, autoEscalate: false },
];

/* ── Service type labels (Finnish) ─────────────── */

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  'internet': 'Internet Connection',
  'mpls-wan': 'MPLS WAN',
  'sd-wan': 'SD-WAN',
  'dns-dhcp': 'DNS / DHCP',
  'firewall': 'Firewall',
  'colocation': 'Konesali',
  'cloud-connect': 'Pilviyhteys',
};

export const SERVICE_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: '#2ab06f' },
  degraded: { label: 'Degraded', color: '#fd8232' },
  outage: { label: 'Outage', color: '#dc172a' },
  maintenance: { label: 'Maintenance', color: '#3B82F6' },
  pending: { label: 'Pending', color: '#6b7280' },
};

export const TICKET_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  'open': { label: 'Open', color: '#3B82F6' },
  'in-progress': { label: 'In Progress', color: '#ffd54f' },
  'waiting-customer': { label: 'Pending asiakasta', color: '#fd8232' },
  'resolved': { label: 'Ratkaistu', color: '#2ab06f' },
  'closed': { label: 'Closed', color: '#6b7280' },
};

export const TICKET_PRIORITY_LABELS: Record<string, { label: string; color: string }> = {
  critical: { label: 'Critical', color: '#dc172a' },
  high: { label: 'Korkea', color: '#fd8232' },
  medium: { label: 'Normal', color: '#ffd54f' },
  low: { label: 'Matala', color: '#6b7280' },
};

export const NOTIFICATION_METRIC_LABELS: Record<string, string> = {
  'bandwidth-usage': 'Bandwidth Usage',
  'latency': 'Viive (ms)',
  'packet-loss': 'Packet Loss (%)',
  'availability': 'Saatavuus (%)',
  'cpu': 'CPU Usage (%)',
  'memory': 'Memory Usage (%)',
  'errors': 'Rajapintavirheet (/min)',
};

export const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  sms: 'SMS',
  webhook: 'Webhook',
  teams: 'Teams',
};

/* ── Bandwidth upgrade tiers ───────────────────── */

export const BANDWIDTH_TIERS = [
  { mbps: 100, label: '100 Mbps', priceEur: 450 },
  { mbps: 200, label: '200 Mbps', priceEur: 680 },
  { mbps: 500, label: '500 Mbps', priceEur: 1200 },
  { mbps: 1000, label: '1 Gbps', priceEur: 1800 },
  { mbps: 2000, label: '2 Gbps', priceEur: 2800 },
  { mbps: 5000, label: '5 Gbps', priceEur: 4500 },
  { mbps: 10000, label: '10 Gbps', priceEur: 7500 },
  { mbps: 20000, label: '20 Gbps', priceEur: 12000 },
  { mbps: 40000, label: '40 Gbps', priceEur: 18000 },
  { mbps: 100000, label: '100 Gbps', priceEur: 35000 },
];
