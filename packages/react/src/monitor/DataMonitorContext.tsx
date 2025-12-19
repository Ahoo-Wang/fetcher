import { DataMonitor, DataMonitorOptions } from './dataMonitor';

import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';

/**
 * The value provided by the DataMonitorContext.
 * Contains the DataMonitor instance for use in child components.
 *
 * @interface DataMonitorContextValue
 * @property {DataMonitor} monitor - The DataMonitor instance for managing data monitoring
 *
 * @example
 * ```typescript
 * const context: DataMonitorContextValue = {
 *   monitor: new DataMonitor({ key: 'app-monitor' })
 * };
 * ```
 */
export interface DataMonitorContextValue {
  monitor: DataMonitor;
}

/**
 * Type alias for the DataMonitor context value.
 * Used for type annotations and context typing.
 *
 * @type {DataMonitorContext}
 */
export type DataMonitorContext = DataMonitorContextValue;

/**
 * React context for providing DataMonitor instance to child components.
 * Must be used within a DataMonitorProvider to access the monitor.
 *
 */
export const DataMonitorContext = createContext<DataMonitorContext | undefined>(
  undefined,
);

/**
 * Props for the DataMonitorProvider component.
 * Extends DataMonitorOptions with React-specific children prop.
 *
 * @interface DataMonitorProviderOptions
 * @extends {DataMonitorOptions}
 * @property {ReactNode} children - Child components that will have access to the DataMonitor
 *
 * @example
 * ```tsx
 * const providerProps: DataMonitorProviderOptions = {
 *   key: 'my-monitor',
 *   maxRetryCount: 3,
 *   browserNotification: true,
 *   children: <MyApp />
 * };
 * ```
 */
export interface DataMonitorProviderOptions extends DataMonitorOptions {
  children: ReactNode;
}

/**
 * React provider component that creates and provides a DataMonitor instance
 * to all child components via React context.
 *
 * This component:
 * - Creates a DataMonitor instance with the provided options
 * - Provides the monitor through DataMonitorContext
 * - Automatically cleans up monitors when unmounted
 *
 * @component
 * @param {DataMonitorProviderOptions} props - Provider configuration and children
 *
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <DataMonitorProvider
 *       key="weather-app"
 *       maxRetryCount={3}
 *       browserNotification={true}
 *     >
 *       <WeatherDashboard />
 *     </DataMonitorProvider>
 *   );
 * }
 * ```
 */
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

/**
 * React hook to access the DataMonitor instance from context.
 * Must be used within a component wrapped by DataMonitorProvider.
 *
 * @returns {DataMonitorContext} The context value containing the DataMonitor instance
 * @throws {Error} If used outside DataMonitorProvider
 *
 * @example
 * ```tsx
 * function WeatherComponent() {
 *   const { monitor } = useDataMonitorContext();
 *
 *   useEffect(() => {
 *     monitor.registerMonitor(weatherConfig);
 *     return () => monitor.unregisterMonitor('weather');
 *   }, []);
 *
 *   return <div>Weather monitoring active</div>;
 * }
 * ```
 */
export function useDataMonitorContext(): DataMonitorContext {
  const context = useContext(DataMonitorContext);
  if (!context) {
    throw new Error(
      'useDataMonitorContext must be used within a DataMonitorProvider',
    );
  }
  return context;
}
