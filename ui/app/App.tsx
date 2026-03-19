/**
 * App — root application component.
 *
 * Wraps content in ErrorBoundary + DemoModeProvider + TimeframeProvider.
 * Uses Strato Page layout with AppHeader.
 */

import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { Page } from '@dynatrace/strato-components-preview/layouts';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
import { DemoModeProvider } from './hooks/useDemoMode';
import { TimeframeProvider, useTimeframe } from './hooks/useTimeframe';
import { Home } from './pages/Home';
import { Topology } from './pages/Topology';
import { Incidents } from './pages/Incidents';
import { Sla } from './pages/Sla';
import { Devices } from './pages/Devices';
import { Interfaces } from './pages/Interfaces';
import { SelfService } from './pages/SelfService';
import MyServices from './pages/MyServices';
import Tickets from './pages/Tickets';
import Forecasts from './pages/Forecasts';
import Notifications from './pages/Notifications';

function AppContent() {
  const { refreshKey } = useTimeframe();

  return (
    <Page>
      <Page.Header>
        <Header />
      </Page.Header>
      <Page.Main key={refreshKey}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/topology" element={<Topology />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/sla" element={<Sla />} />
          <Route path="/devices" element={<Devices />} />
          <Route path="/interfaces" element={<Interfaces />} />
          <Route path="/selfservice" element={<SelfService />} />
          <Route path="/services" element={<MyServices />} />
          <Route path="/tickets" element={<Tickets />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/notifications" element={<Notifications />} />
        </Routes>
      </Page.Main>
    </Page>
  );
}

export function App() {
  return (
    <ErrorBoundary>
      <DemoModeProvider>
        <TimeframeProvider>
          <AppContent />
        </TimeframeProvider>
      </DemoModeProvider>
    </ErrorBoundary>
  );
}
