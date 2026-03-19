/**
 * Global timeframe context with refresh key and dqlTimeframe for live queries.
 */

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/** Shape consumed by useDql's defaultTimeframeStart / defaultTimeframeEnd */
export interface DqlTimeframe {
  defaultTimeframeStart?: string;
  defaultTimeframeEnd?: string;
}

interface TimeframeState {
  from: string;
  to: string;
  refreshKey: number;
  dqlTimeframe: DqlTimeframe;
  setRange: (from: string, to: string) => void;
  setTimeframe: (from: string, to: string) => void;
  refresh: () => void;
}

const TimeframeContext = createContext<TimeframeState>({
  from: 'now-2h', to: 'now', refreshKey: 0,
  dqlTimeframe: {},
  setRange: () => undefined, setTimeframe: () => undefined, refresh: () => undefined,
});

export function TimeframeProvider({ children }: { children: ReactNode }) {
  const [from, setFrom] = useState('now-2h');
  const [to, setTo] = useState('now');
  const [refreshKey, setRefreshKey] = useState(0);

  const dqlTimeframe = useMemo<DqlTimeframe>(() => ({
    defaultTimeframeStart: new Date(Date.now() - 2 * 3600_000).toISOString(),
    defaultTimeframeEnd: new Date().toISOString(),
  }), [refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const setRange = useCallback((newFrom: string, newTo: string) => {
    setFrom(newFrom);
    setTo(newTo);
    setRefreshKey((k) => k + 1);
  }, []);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);

  return (
    <TimeframeContext.Provider value={{ from, to, refreshKey, dqlTimeframe, setRange, setTimeframe: setRange, refresh }}>
      {children}
    </TimeframeContext.Provider>
  );
}

export function useTimeframe(): TimeframeState {
  return useContext(TimeframeContext);
}
