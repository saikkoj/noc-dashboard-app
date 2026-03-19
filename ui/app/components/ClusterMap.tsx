/**
 * ClusterMap — geographic cluster view using strato-geo MapView + BubbleLayer.
 */
import React, { useMemo, useState, useCallback, useRef, useEffect } from 'react';
import { MapView, BubbleLayer } from '@dynatrace/strato-geo';
import type { TopologyCluster, TopologySite, HealthSummary } from '../types/network';
import { HEALTH_COLORS } from '../utils';

/* ── Helpers ───────────────────────────────────── */

function overallHealth(hs: HealthSummary): string {
  if (hs.critical > 0) return 'critical';
  if (hs.warning > 0) return 'warning';
  return 'healthy';
}

const LEGEND_ITEMS = [
  { label: 'Healthy', color: HEALTH_COLORS.healthy },
  { label: 'Warning', color: HEALTH_COLORS.warning },
  { label: 'Critical', color: HEALTH_COLORS.critical },
];

/* ── Region bubbles ────────────────────────────── */

interface BubbleItem {
  latitude: number;
  longitude: number;
  id: string;
  label: string;
  deviceCount: number;
  health: string;
}

interface RegionMapProps {
  regions: TopologyCluster[];
  onSelectRegion: (r: TopologyCluster) => void;
}

function RegionMap({ regions, onSelectRegion }: RegionMapProps) {
  const mapRef = useRef<any>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = useState(480);
  const [mapWidth, setMapWidth] = useState(800);
  const [viewState, setViewState] = useState({ latitude: 39.0, longitude: -98.0, zoom: 3.5 });

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      if (height > 50) setMapHeight(Math.round(height));
      if (width > 50) setMapWidth(Math.round(width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const bubbleData = useMemo<BubbleItem[]>(() => regions.map(r => ({
    latitude: r.lat,
    longitude: r.lon,
    id: r.id,
    label: r.label,
    deviceCount: r.deviceCount,
    health: overallHealth(r.healthSummary),
  })), [regions]);

  // Project lat/lon to pixel using simple Web Mercator
  const project = useCallback((lat: number, lon: number) => {
    const scale = (256 / (2 * Math.PI)) * Math.pow(2, viewState.zoom);
    const cx = mapWidth / 2;
    const cy = mapHeight / 2;
    const lam0 = (viewState.longitude * Math.PI) / 180;
    const phi0 = (viewState.latitude * Math.PI) / 180;
    const lam = (lon * Math.PI) / 180;
    const phi = (lat * Math.PI) / 180;
    const x = cx + scale * (lam - lam0);
    const y = cy - scale * (Math.log(Math.tan(Math.PI / 4 + phi / 2)) - Math.log(Math.tan(Math.PI / 4 + phi0 / 2)));
    return { x, y };
  }, [viewState, mapWidth, mapHeight]);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
      <MapView
        ref={mapRef}
        initialViewState={{ latitude: 39.0, longitude: -98.0, zoom: 3.5 }}
        height={mapHeight}
        onViewStateChange={(vs: any) => {
          if (vs?.latitude != null) setViewState({ latitude: vs.latitude, longitude: vs.longitude, zoom: vs.zoom });
        }}
      >
        <BubbleLayer
          data={bubbleData}
          scale="none"
          radius={(item: BubbleItem) => 16 + Math.sqrt(item.deviceCount) * 6}
          color={(item: BubbleItem) => HEALTH_COLORS[item.health] ?? HEALTH_COLORS.unknown}
        />
      </MapView>

      {/* Clickable overlay circles positioned over bubbles */}
      {regions.map(r => {
        const pos = project(r.lat, r.lon);
        const radius = 16 + Math.sqrt(r.deviceCount) * 6;
        return (
          <div
            key={r.id}
            onClick={() => onSelectRegion(r)}
            title={`${r.label} (${r.deviceCount} devices)`}
            style={{
              position: 'absolute',
              left: pos.x - radius,
              top: pos.y - radius,
              width: radius * 2,
              height: radius * 2,
              borderRadius: '50%',
              cursor: 'pointer',
              zIndex: 3,
            }}
          />
        );
      })}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 12, left: 12, zIndex: 5,
        background: 'rgba(20,20,26,0.9)', padding: '6px 12px', borderRadius: 8,
        display: 'flex', gap: 10, fontSize: 11,
      }}>
        {LEGEND_ITEMS.map(item => (
          <span key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ccc' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, display: 'inline-block' }} />
            {item.label}
          </span>
        ))}
      </div>

      {/* Region sidebar */}
      <div style={{
        position: 'absolute', top: 8, right: 8, zIndex: 5,
        background: 'rgba(20,20,26,0.9)', padding: '8px 12px', borderRadius: 8,
        fontSize: 11, color: '#ccc', maxHeight: 260, overflowY: 'auto',
      }}>
        <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 12, color: '#fff' }}>Regions</div>
        {regions.map(r => {
          const h = overallHealth(r.healthSummary);
          return (
            <div
              key={r.id}
              onClick={() => onSelectRegion(r)}
              style={{
                padding: '4px 6px', cursor: 'pointer', display: 'flex', gap: 6,
                alignItems: 'center', borderRadius: 4,
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.15)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLORS[h], display: 'inline-block', flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{r.label}</span>
              <span style={{ color: '#666', fontSize: 10 }}>({r.deviceCount})</span>
            </div>
          );
        })}
      </div>

      {/* Zoom controls */}
      <div style={{
        position: 'absolute', bottom: 12, right: 12, zIndex: 5,
        display: 'flex', flexDirection: 'column', gap: 4,
      }}>
        <button onClick={() => mapRef.current?.zoomIn?.()} style={controlBtnStyle} title="Zoom In">+</button>
        <button onClick={() => mapRef.current?.zoomOut?.()} style={controlBtnStyle} title="Zoom Out">−</button>
        <button onClick={() => mapRef.current?.zoomToFit?.()} style={controlBtnStyle} title="Fit to View">⊡</button>
      </div>
    </div>
  );
}

/* ── Site drill-down ───────────────────────────── */

interface SiteMapProps {
  sites: TopologySite[];
  regionLabel: string;
  region: TopologyCluster;
  onBack: () => void;
}

function SiteMap({ sites, regionLabel, region, onBack }: SiteMapProps) {
  const healthColor = HEALTH_COLORS[overallHealth(region.healthSummary)];

  return (
    <div style={{ padding: 20, height: '100%', overflowY: 'auto' }}>
      {/* Region header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20,
        padding: '12px 16px', borderRadius: 8,
        background: `${healthColor}12`, border: `1px solid ${healthColor}40`,
      }}>
        <button onClick={onBack} style={{
          background: 'none', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 6,
          color: '#3B82F6', padding: '6px 14px', cursor: 'pointer', fontSize: 12,
        }}>
          ← Back
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{regionLabel}</div>
          <div style={{ fontSize: 12, color: '#aaa', marginTop: 2 }}>
            {region.deviceCount} devices • Lat {region.lat.toFixed(2)}°N, Lon {region.lon.toFixed(2)}°E
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ display: 'flex', gap: 12, fontSize: 13 }}>
            <span style={{ color: HEALTH_COLORS.healthy }}>✓ {region.healthSummary.healthy}</span>
            <span style={{ color: HEALTH_COLORS.warning }}>⚠ {region.healthSummary.warning}</span>
            <span style={{ color: HEALTH_COLORS.critical }}>✕ {region.healthSummary.critical}</span>
          </div>
          {region.avgCpu != null && (
            <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
              CPU {region.avgCpu}% • Memory {region.avgMemory}%
            </div>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiBadge label="Devices" value={region.deviceCount} />
        <KpiBadge label="Alerts" value={region.alertCount ?? 0} alert={region.alertCount > 0} />
        <KpiBadge label="Sites" value={sites.length} />
        <KpiBadge label="Avg CPU" value={`${region.avgCpu ?? 0}%`} />
        <KpiBadge label="Avg Memory" value={`${region.avgMemory ?? 0}%`} />
      </div>

      {/* Site grid */}
      <div style={{ fontSize: 13, fontWeight: 600, color: '#ccc', marginBottom: 8 }}>
        Sites ({sites.length})
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
        {sites.map(s => {
          const h = overallHealth(s.healthSummary);
          const sColor = HEALTH_COLORS[h];
          return (
            <div key={s.id} style={{
              background: 'rgba(255,255,255,0.04)', borderRadius: 8,
              border: `1px solid ${sColor}30`, padding: 14,
              transition: 'border-color 0.15s',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: sColor, flexShrink: 0 }} />
                <span style={{ fontWeight: 600, color: '#fff', flex: 1 }}>{s.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#999' }}>
                <span>Type: {s.type}</span>
                <span>Devices: {s.deviceCount}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 11 }}>
                <span style={{ color: HEALTH_COLORS.healthy }}>✓ {s.healthSummary.healthy}</span>
                <span style={{ color: HEALTH_COLORS.warning }}>⚠ {s.healthSummary.warning}</span>
                <span style={{ color: HEALTH_COLORS.critical }}>✕ {s.healthSummary.critical}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function KpiBadge({ label, value, alert }: { label: string; value: number | string; alert?: boolean }) {
  return (
    <div style={{
      padding: '8px 16px', borderRadius: 8,
      background: alert ? 'rgba(220,23,42,0.1)' : 'rgba(255,255,255,0.04)',
      border: `1px solid ${alert ? 'rgba(220,23,42,0.25)' : 'rgba(255,255,255,0.06)'}`,
      minWidth: 90, textAlign: 'center',
    }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: alert ? '#dc172a' : '#fff' }}>{value}</div>
      <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{label}</div>
    </div>
  );
}

/* ── Control button style ──────────────────────── */
const controlBtnStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'rgba(20,20,26,0.85)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 6,
  color: 'rgba(255,255,255,0.7)',
  fontSize: 16,
  cursor: 'pointer',
  padding: 0,
  lineHeight: 1,
};

/* ── Main ClusterMap component ─────────────────── */

interface ClusterMapProps {
  regions: TopologyCluster[];
  sites: TopologySite[];
  selectedRegion: TopologyCluster | null;
  onSelectRegion: (r: TopologyCluster | null) => void;
  onBack: () => void;
}

export function ClusterMap({ regions, sites, selectedRegion, onSelectRegion, onBack }: ClusterMapProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen(prev => !prev);
  }, []);

  // Lock body scroll while fullscreen & allow Escape to exit
  useEffect(() => {
    if (!isFullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [isFullscreen]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Placeholder keeps parent height when the map goes fixed */}
      {isFullscreen && <div style={{ width: '100%', height: '100%' }} />}
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: isFullscreen ? 0 : 8,
          overflow: 'hidden',
          background: '#131317',
          position: isFullscreen ? 'fixed' : 'absolute',
          top: 0,
          left: 0,
          right: isFullscreen ? 0 : undefined,
          bottom: isFullscreen ? 0 : undefined,
          zIndex: isFullscreen ? 9999 : undefined,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      {selectedRegion ? (
        <SiteMap sites={sites} regionLabel={selectedRegion.label} region={selectedRegion} onBack={onBack} />
      ) : (
        <div style={{ flex: 1, position: 'relative' }}>
          <RegionMap regions={regions} onSelectRegion={r => onSelectRegion(r)} />
        </div>
      )}

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        style={{
          ...controlBtnStyle,
          position: 'absolute',
          top: 8,
          left: 8,
          zIndex: 10,
        }}
        title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
      >
        {isFullscreen ? '✕' : '⛶'}
      </button>
      </div>
    </div>
  );
}
