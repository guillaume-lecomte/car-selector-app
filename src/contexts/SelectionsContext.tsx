'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type SelectionsContextType = {
  refreshKey: number;
  triggerRefresh: () => void;
};

const SelectionsContext = createContext<SelectionsContextType | undefined>(undefined);

export function SelectionsProvider({ children }: { children: ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return (
    <SelectionsContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </SelectionsContext.Provider>
  );
}

export function useSelectionsContext() {
  const context = useContext(SelectionsContext);
  if (!context) {
    throw new Error('useSelectionsContext must be used within SelectionsProvider');
  }
  return context;
}
