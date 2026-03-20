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

/** Parse a relative time expression like 'now-2h' into a Date. */
function resolveTimeExpr(expr: string): Date {
  const now = Date.now();
  if (expr === 'now' || expr === 'now()') return new Date(now);

  // Handles: now-2h, now()-2h, -2h  (common Strato / DQL formats)
  const m = /^(?:now(?:\(\))?)?-([\d.]+)(s|m|h|d|w)$/.exec(expr);
  if (m) {
    const val = parseFloat(m[1]);
    const unit = m[2];
    const ms = unit === 's' ? val * 1_000
      : unit === 'm' ? val * 60_000
      : unit === 'h' ? val * 3_600_000
      : unit === 'd' ? val * 86_400_000
      : val * 604_800_000;
    return new Date(now - ms);
  }
  // Try ISO / absolute date string
  const d = new Date(expr);
  return isNaN(d.getTime()) ? new Date(now) : d;
}

export function TimeframeProvider({ children }: { children: ReactNode }) {
  const [from, setFrom] = useState('now-2h');
  const [to, setTo] = useState('now');
  const [refreshKey, setRefreshKey] = useState(0);

  const dqlTimeframe = useMemo<DqlTimeframe>(() => ({
    defaultTimeframeStart: resolveTimeExpr(from).toISOString(),
    defaultTimeframeEnd: resolveTimeExpr(to).toISOString(),
  }), [from, to, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

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
