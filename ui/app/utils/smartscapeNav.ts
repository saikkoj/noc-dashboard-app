/**
 * Smartscape navigation helpers.
 */

import { sendIntent, getAppLink } from '@dynatrace-sdk/navigation';

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

export function openInSmartscape(entityId: string): boolean {
  try {
    const origin = getEnvOrigin();
    const url = `${origin}/ui/apps/dynatrace.smartscape/topology?id=${encodeURIComponent(entityId)}`;
    window.open(url, '_blank', 'noopener');
    return true;
  } catch {
    return false;
  }
}

export function viewTopologyIntent(entityId: string): boolean {
  try {
    sendIntent({
      'dt.entity': entityId,
      'dt.intent.action': 'view-topology',
    });
    return true;
  } catch {
    return false;
  }
}
