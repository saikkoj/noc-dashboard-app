/**
 * Header — AppHeader with navigation, timeframe, segments, demo toggle, and refresh.
 *
 * Follows Dynatrace AppHeader Experience Standard (Scenario 2: tabs + menus).
 */

import React, { useCallback, useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@dynatrace/strato-components/buttons';
import { AppHeader, HelpMenu } from '@dynatrace/strato-components-preview/layouts';
import { Tooltip } from '@dynatrace/strato-components-preview/overlays';
import { ToggleButtonGroup } from '@dynatrace/strato-components-preview/forms';
import { TimeframeSelector } from '@dynatrace/strato-components-preview/filters';
import { SegmentSelector } from '@dynatrace/strato-components-preview/filters';
import type { Timeframe } from '@dynatrace/strato-components-preview/core';
import { RefreshIcon, SettingIcon } from '@dynatrace/strato-icons';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';

export function Header() {
  const { demoMode, setDemoMode } = useDemoMode();
  const { refresh, setTimeframe } = useTimeframe();
  const defaultTf: Timeframe = {
    from: { type: 'expression', value: 'now-2h', absoluteDate: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
    to: { type: 'expression', value: 'now', absoluteDate: new Date().toISOString() },
  };
  const [timeframeValue, setTimeframeValue] = useState<Timeframe | null>(defaultTf);

  useEffect(() => {
    setTimeframe('now-2h', 'now');
  }, [setTimeframe]);

  const handleTimeframeChange = useCallback((tf: Timeframe | null) => {
    setTimeframeValue(tf);
    if (tf) {
      setTimeframe(tf.from.value, tf.to.value);
    }
  }, [setTimeframe]);

  const handleModeChange = useCallback((val: string) => {
    setDemoMode(val === 'demo');
  }, [setDemoMode]);

  return (
    <AppHeader>
      <AppHeader.Logo appName="NOC Dashboard" />

      <AppHeader.Navigation>
        <AppHeader.NavigationItem as={NavLink} to="/">
          Overview
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/topology">
          Topology
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/incidents">
          Incidents
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/alerts">
          Alerts
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/sla">
          SLA
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/devices">
          Devices
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/interfaces">
          Interfaces
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/selfservice">
          Self-Service
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/services">
          My Services
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/tickets">
          Tickets
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/forecasts">
          Forecasts
        </AppHeader.NavigationItem>
        <AppHeader.NavigationItem as={NavLink} to="/notifications">
          Notifications
        </AppHeader.NavigationItem>
      </AppHeader.Navigation>

      <AppHeader.ActionItems>
        {/* Timeframe selector */}
        <TimeframeSelector value={timeframeValue} onChange={handleTimeframeChange} stepper={false} />

        {/* Segments */}
        <SegmentSelector />

        {/* Live / Demo toggle */}
        <ToggleButtonGroup value={demoMode ? 'demo' : 'live'} onChange={handleModeChange}>
          <ToggleButtonGroup.Item value="live">Live</ToggleButtonGroup.Item>
          <ToggleButtonGroup.Item value="demo">Demo</ToggleButtonGroup.Item>
        </ToggleButtonGroup>

        {/* Refresh icon */}
        <AppHeader.ActionButton
          prefixIcon={<RefreshIcon />}
          showLabel={false}
          onClick={refresh}
          aria-label="Refresh data"
        >
          Refresh
        </AppHeader.ActionButton>
      </AppHeader.ActionItems>

      <AppHeader.Menus>
        {/* Settings */}
        <Tooltip text="Settings">
          <Button onClick={() => undefined}>
            <Button.Prefix>
              <SettingIcon />
            </Button.Prefix>
          </Button>
        </Tooltip>

        {/* Help — mandatory per experience standard */}
        <HelpMenu
          entries={{
            whatsNew: 'default',
            about: 'default',
          }}
        />
      </AppHeader.Menus>
    </AppHeader>
  );
}
