/**
 * Demo mode context — toggle between live DQL data and static demo data.
 * Default: true (demo mode) since no live environment is wired yet.
 */

import React, { createContext, useContext, useState, type ReactNode } from 'react';

interface DemoModeState {
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
}

const DemoModeContext = createContext<DemoModeState>({ demoMode: true, setDemoMode: () => undefined });

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoMode, setDemoMode] = useState(true);
  return (
    <DemoModeContext.Provider value={{ demoMode, setDemoMode }}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode(): DemoModeState {
  return useContext(DemoModeContext);
}
