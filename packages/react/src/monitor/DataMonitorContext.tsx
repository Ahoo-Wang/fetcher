import { DataMonitor, DataMonitorOptions } from './dataMonitor';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

export interface DataMonitorContextValue {
  monitor: DataMonitor;
}

export type DataMonitorContext = DataMonitorContextValue;

export const DataMonitorContext = createContext<DataMonitorContext | undefined>(
  undefined,
);

export interface DataMonitorProviderOptions extends DataMonitorOptions {
  children: ReactNode;
}

export function DataMonitorProvider({
  children,
  ...options
}: DataMonitorProviderOptions) {
  const [monitor] = useState<DataMonitor>(new DataMonitor(options));

  useEffect(() => {
    return () => {
      monitor.clearMonitors();
    };
  });

  return (
    <DataMonitorContext.Provider value={{ monitor }}>
      {children}
    </DataMonitorContext.Provider>
  );
}

export function useDataMonitorContext(): DataMonitorContext {
  const context = useContext(DataMonitorContext);
  if (!context) {
    throw new Error(
      'useDataMonitorContext must be used within a DataMonitorProvider',
    );
  }
  return context;
}
