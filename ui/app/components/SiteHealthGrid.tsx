/**
 * SiteHealthGrid — grid of site health indicators.
 */

import React from 'react';
import { Flex } from '@dynatrace/strato-components/layouts';
import { Heading } from '@dynatrace/strato-components/typography';
import Colors from '@dynatrace/strato-design-tokens/colors';
import Borders from '@dynatrace/strato-design-tokens/borders';
import type { Site, HealthStatus } from '../types/network';
import { HEALTH_COLORS } from '../utils';

interface SiteHealthGridProps {
  sites: Site[];
  onSiteClick?: (site: Site) => void;
}

function SiteDot({ site, onClick }: { site: Site; onClick?: (site: Site) => void }) {
  const color = HEALTH_COLORS[site.health as HealthStatus] ?? HEALTH_COLORS.unknown;
  return (
    <div
      onClick={() => onClick?.(site)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '6px 10px',
        background: Colors.Background.Surface.Default,
        borderRadius: Borders.Radius.Container.Default,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        border: '1px solid transparent',
      }}
      onMouseEnter={e => { if (onClick) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = 'transparent'; }}
    >
      <span style={{
        width: 10, height: 10, borderRadius: '50%',
        background: color,
        animation: site.health === 'outage' ? 'pulse 1.5s infinite' : undefined,
        flexShrink: 0,
      }} />
      <span style={{ fontSize: 13 }}>{site.name}</span>
      <span style={{ marginLeft: 'auto', fontSize: 11, color: '#9ca3af' }}>{site.deviceCount} devices</span>
    </div>
  );
}

export function SiteHealthGrid({ sites, onSiteClick }: SiteHealthGridProps) {
  return (
    <Flex flexDirection="column" gap={8}>
      <Heading level={6}>Sites ({sites.length})</Heading>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 6 }}>
        {sites.map((site) => (
          <SiteDot key={site.id} site={site} onClick={onSiteClick} />
        ))}
      </div>
    </Flex>
  );
}
