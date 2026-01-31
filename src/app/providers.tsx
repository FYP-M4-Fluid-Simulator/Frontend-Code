'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

interface User {
  email: string;
  name: string;
}

interface AppContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  liftToDragRatio: number;
  setLiftToDragRatio: (ratio: number) => void;
  isSimulating: boolean;
  setIsSimulating: (simulating: boolean) => void;
  simulationComplete: boolean;
  setSimulationComplete: (complete: boolean) => void;
  showFlowField: boolean;
  setShowFlowField: (show: boolean) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProviders({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [liftToDragRatio, setLiftToDragRatio] = useState(49.3);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationComplete, setSimulationComplete] = useState(false);
  const [showFlowField, setShowFlowField] = useState(false);

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        liftToDragRatio,
        setLiftToDragRatio,
        isSimulating,
        setIsSimulating,
        simulationComplete,
        setSimulationComplete,
        showFlowField,
        setShowFlowField,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within AppProviders');
  }
  return context;
}
