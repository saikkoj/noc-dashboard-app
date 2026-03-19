/**
 * Shared utilities: severity colors, formatting, navigation helpers.
 */

import type { HealthStatus, Severity, SparklinePoint, ThresholdRule } from '../types/network';
import { sendIntent, getAppLink } from '@dynatrace-sdk/navigation';

/* ── Severity colors (hex) ─────────────────────── */

export const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#dc172a',
  major: '#fd8232',
  minor: '#ffd54f',
  info: '#3B82F6',
};

export const SEVERITY_META: Record<Severity, { color: string; bg: string; label: string; order: number }> = {
  critical: { color: '#dc172a', bg: 'rgba(220,23,42,0.12)', label: 'CRITICAL', order: 0 },
  major:    { color: '#fd8232', bg: 'rgba(253,130,50,0.12)', label: 'MAJOR',    order: 1 },
  minor:    { color: '#ffd54f', bg: 'rgba(245,211,15,0.12)', label: 'MINOR',    order: 2 },
  info:     { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', label: 'INFO',    order: 3 },
};

export const HEALTH_COLORS: Record<string, string> = {
  healthy: '#2ab06f',
  degraded: '#fd8232',
  outage: '#dc172a',
  unknown: '#6b7280',
  warning: '#fd8232',
  critical: '#dc172a',
};

/* ── Brand theme tokens ────────────────────── */

export const BRAND_PRIMARY = '#3B82F6';
export const BRAND_DARK = '#2563EB';
export const BRAND_LIGHT = '#60A5FA';
export const BRAND_RGB = '59,130,246';

/* ── Severity order for sorting ────────────────── */

export function severityOrder(sev: Severity): number {
  const map: Record<Severity, number> = { critical: 0, major: 1, minor: 2, info: 3 };
  return map[sev] ?? 4;
}

/* ── Health from availability % ────────────────── */

export function healthFromAvailability(pct: number): HealthStatus {
  if (pct >= 99.9) return 'healthy';
  if (pct >= 99.0) return 'degraded';
  return 'outage';
}

/* ── Evaluate threshold → severity ─────────────── */

export function computeSeverity(
  value: number | undefined,
  thresholds: ThresholdRule[],
): 'critical' | 'warning' | 'healthy' {
  if (value == null) return 'healthy';
  for (const t of thresholds) {
    const v = Number(t.value);
    const match =
      (t.comparator === '==' && value === v) ||
      (t.comparator === '<' && value < v) ||
      (t.comparator === '<=' && value <= v) ||
      (t.comparator === '>' && value > v) ||
      (t.comparator === '>=' && value >= v);
    if (match) {
      return t.color === 'red' ? 'critical' : t.color === 'amber' ? 'warning' : 'healthy';
    }
  }
  return 'healthy';
}

/* ── Formatting helpers ────────────────────────── */

export function formatPct(value: number, decimals = 2): string {
  return `${value.toFixed(decimals)}%`;
}

export function formatMs(value: number): string {
  if (value < 1) return `${(value * 1000).toFixed(0)} µs`;
  if (value < 1000) return `${value.toFixed(1)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${Math.round(minutes)}m`;
  const h = Math.floor(minutes / 60);
  const m = Math.round(minutes % 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function formatTraffic(gbps: number): string {
  if (gbps >= 1) return `${gbps.toFixed(1)} Gbps`;
  return `${(gbps * 1000).toFixed(0)} Mbps`;
}

export function toNum(v: unknown): number {
  if (v == null) return 0;
  if (typeof v === 'number') return v;
  if (typeof v === 'bigint') return Number(v);
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/* ── Format age string from ISO date ───────────── */

export function formatAge(isoDate: string): string {
  const ms = Date.now() - new Date(isoDate).getTime();
  const mins = Math.floor(ms / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ── Percent bar colour ────────────────────────── */

export function percentBarColor(value: number, warn = 60, crit = 80): string {
  if (value >= crit) return SEVERITY_META.critical.color;
  if (value >= warn) return SEVERITY_META.major.color;
  return '#2ab06f';
}

/* ── Demo/Live badge styles ───────────────────── */

export const modeBadgeStyle = (demoMode: boolean): React.CSSProperties => ({
  padding: '3px 10px',
  borderRadius: 10,
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.5px',
  background: demoMode ? 'rgba(99, 102, 241, 0.15)' : 'rgba(42, 176, 111, 0.15)',
  color: demoMode ? '#818cf8' : '#2ab06f',
});

/* ── Generate sparkline demo data ──────────────── */

export function generateSparkline(points: number, baseValue: number, variance: number): SparklinePoint[] {
  const now = Date.now();
  const interval = (60 * 60 * 1000) / points;
  return Array.from({ length: points }, (_, i) => ({
    timestamp: new Date(now - (points - i) * interval).toISOString(),
    value: baseValue + (Math.random() - 0.5) * 2 * variance,
  }));
}

/* ── Deep-link navigation helpers ──────────────── */

function getEnvOrigin(): string {
  try {
    const link = getAppLink('dynatrace.infraops');
    if (link.startsWith('http')) return new URL(link).origin;
  } catch { /* */ }
  const href = window.location.href;
  const appMarker = '/ui/apps/my.noc.dashboard';
  const idx = href.indexOf(appMarker);
  if (idx !== -1) return href.substring(0, idx);
  return window.location.origin;
}

export function getDeviceUrl(entityId: string): string {
  return `${getEnvOrigin()}/ui/apps/dynatrace.infraops/explorer/Network%20devices?perspective=Health&fullPageId=${encodeURIComponent(entityId)}`;
}

export function openDeviceDetail(entityId: string): void {
  try { window.open(getDeviceUrl(entityId), '_blank', 'noopener'); } catch { /* */ }
}

export function getProblemUrl(problemId: string): string {
  return `${getEnvOrigin()}/ui/apps/dynatrace.davis.problems/problem/${encodeURIComponent(problemId)}?from=now%28%29-2h&to=now%28%29`;
}

export function openProblemDetail(problemId: string): void {
  try { window.open(getProblemUrl(problemId), '_blank', 'noopener'); } catch { /* */ }
}

export function openQueryIntent(query: string): void {
  try { sendIntent({ 'dt.query': query }); } catch { /* */ }
}

/* ── Clickable entity name style ───────────────── */

export const entityLinkStyle: React.CSSProperties = {
  cursor: 'pointer',
  color: '#3B82F6',
  textDecoration: 'none',
  borderBottom: '1px dotted rgba(59,130,246,0.4)',
};

/* ── Location-to-city mapping ──────────────────── */

const LOCATION_MAP: Array<{ pattern: RegExp; city: string }> = [
  // IATA / prefix codes
  { pattern: /JFK/i, city: 'New York' },
  { pattern: /BOS/i, city: 'Boston' },
  { pattern: /ORD/i, city: 'Chicago' },
  { pattern: /ATL/i, city: 'Atlanta' },
  { pattern: /DEN/i, city: 'Denver' },
  { pattern: /DFW/i, city: 'Dallas' },
  { pattern: /PHX/i, city: 'Phoenix' },
  { pattern: /SEA/i, city: 'Seattle' },
  { pattern: /LON/i, city: 'London' },
  { pattern: /FRA/i, city: 'Frankfurt' },
  { pattern: /AMS/i, city: 'Amsterdam' },
  // US cities
  { pattern: /new york/i, city: 'New York' },
  { pattern: /boston/i, city: 'Boston' },
  { pattern: /chicago/i, city: 'Chicago' },
  { pattern: /atlanta/i, city: 'Atlanta' },
  { pattern: /denver/i, city: 'Denver' },
  { pattern: /dallas/i, city: 'Dallas' },
  { pattern: /phoenix/i, city: 'Phoenix' },
  { pattern: /seattle/i, city: 'Seattle' },
  { pattern: /portland/i, city: 'Portland' },
  { pattern: /sacramento/i, city: 'Sacramento' },
  { pattern: /san francisco/i, city: 'San Francisco' },
  { pattern: /los angeles/i, city: 'Los Angeles' },
  { pattern: /miami/i, city: 'Miami' },
  { pattern: /houston/i, city: 'Houston' },
  // US landmarks
  { pattern: /manhattan|brooklyn|queens|bronx/i, city: 'New York' },
  { pattern: /cambridge|somerville/i, city: 'Boston' },
  { pattern: /o'hare|midway/i, city: 'Chicago' },
  // International
  { pattern: /london/i, city: 'London' },
  { pattern: /frankfurt/i, city: 'Frankfurt' },
  { pattern: /amsterdam/i, city: 'Amsterdam' },
  { pattern: /stockholm/i, city: 'Stockholm' },
  // AWS regions
  { pattern: /us-east-1/i, city: 'Virginia' },
  { pattern: /us-west-2/i, city: 'Oregon' },
  { pattern: /us-east-2/i, city: 'Ohio' },
  { pattern: /eu-west-1/i, city: 'Dublin' },
  { pattern: /eu-central-1/i, city: 'Frankfurt' },
];

const KNOWN_CITIES = new Set(
  LOCATION_MAP.filter(e => /^[A-ZÀ-Ž]/.test(e.city)).map(e => e.city.toLowerCase()),
);

export function mapLocationToCity(raw: string | null | undefined): string {
  if (!raw || !raw.trim()) return '';
  const s = raw.trim();
  for (const entry of LOCATION_MAP) {
    if (entry.pattern.test(s)) return entry.city;
  }
  if (s.includes(',')) {
    const fields = s.split(',').map(f => f.trim());
    for (const field of fields) {
      if (KNOWN_CITIES.has(field.toLowerCase())) {
        for (const entry of LOCATION_MAP) {
          if (entry.pattern.test(field)) return entry.city;
        }
      }
    }
    for (const field of fields) {
      for (const entry of LOCATION_MAP) {
        if (entry.pattern.test(field)) return entry.city;
      }
    }
  }
  if ((s.match(/-/g) || []).length >= 2) return '';
  return s;
}
