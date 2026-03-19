/**
 * Header — AppHeader with navigation tabs, demo mode toggle, and HelpMenu.
 *
 * Follows Dynatrace AppHeader Experience Standard (Scenario 2: tabs + menus).
 */

import React from 'react';
import { NavLink } from 'react-router-dom';
import { Button } from '@dynatrace/strato-components/buttons';
import { AppHeader, HelpMenu } from '@dynatrace/strato-components-preview/layouts';
import { Tooltip } from '@dynatrace/strato-components-preview/overlays';
import { SettingIcon } from '@dynatrace/strato-icons';
import { useDemoMode } from '../hooks/useDemoMode';
import { useTimeframe } from '../hooks/useTimeframe';
import { BRAND_PRIMARY } from '../utils';

export function Header() {
  const { demoMode, setDemoMode } = useDemoMode();
  const { refresh } = useTimeframe();

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
        <AppHeader.ActionButton
          onClick={refresh}
          aria-label="Refresh"
        >
          Refresh
        </AppHeader.ActionButton>
      </AppHeader.ActionItems>

      <AppHeader.Menus>
        {/* Demo / Live toggle */}
        <Tooltip text={demoMode ? 'Switch to Live mode' : 'Switch to Demo mode'}>
          <Button onClick={() => setDemoMode(!demoMode)}>
            <span style={{
              display: 'inline-block',
              width: 8, height: 8, borderRadius: '50%',
              background: demoMode ? '#ffd54f' : '#2ab06f',
              marginRight: 6,
            }} />
            {demoMode ? 'Demo' : 'Live'}
          </Button>
        </Tooltip>

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
