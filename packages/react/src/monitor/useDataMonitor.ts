import { DataUpdatedEvent, MonitorConfig, MonitorState } from './types';
import { useDataMonitorContext } from './DataMonitorContext';
import { useEventSubscription } from '../eventbus';

const DEFAULT_EVENT_HANDLE_NAME: string = 'use-data-monitor-handler';

/**
 * Return type for the useDataMonitor hook.
 * Provides methods to interact with the DataMonitor instance.
 *
 * @interface UseDataMonitorReturn
 * @property {function(string): MonitorState} getMonitor - Get the current state of a monitor by ID
 * @property {function(MonitorConfig): Promise<void>} register - Register a new monitor configuration
 * @property {function(string): void} unregister - Unregister a monitor by ID
 *
 * @example
 * ```typescript
 * const { getMonitor, register, unregister } = useDataMonitor();
 * ```
 */
export interface UseDataMonitorReturn {
  getMonitor: (id: string) => MonitorState;

  register: (monitorConfig: MonitorConfig) => Promise<void>;

  unregister: (monitorId: string) => void;
}

/**
 * Options for configuring the useDataMonitor hook behavior.
 *
 * @interface UseDataMonitorOptions
 * @property {function(DataUpdatedEvent): void} [eventHandler] - Optional callback for data update events
 *
 * @example
 * ```typescript
 * const options: UseDataMonitorOptions = {
 *   eventHandler: (event) => {
 *     console.log('Data updated:', event.latestData);
 *   }
 * };
 * ```
 */
export interface UseDataMonitorOptions {
  handlerName?: string;
  eventHandler?: (event: DataUpdatedEvent) => void;
}

/**
 * React hook for interacting with the DataMonitor in functional components.
 * Provides a convenient interface to register monitors, handle events, and manage monitoring.
 *
 * This hook:
 * - Accesses the DataMonitor instance from context
 * - Subscribes to data update events if an eventHandler is provided
 * - Returns methods to control monitors
 *
 * @param {UseDataMonitorOptions} [options] - Configuration options for the hook
 * @returns {UseDataMonitorReturn} Object with monitor control methods
 *
 * @example
 * ```tsx
 * function WeatherMonitor() {
 *   const { register, unregister, getMonitor } = useDataMonitor({
 *     eventHandler: (event) => {
 *       console.log('Weather updated:', event.latestData);
 *     }
 *   });
 *
 *   useEffect(() => {
 *     register({
 *       id: 'weather',
 *       fetchRequest: { url: '/api/weather', method: 'GET' },
 *       interval: 300000,
 *       notifyContent: { title: 'Weather', message: 'Updated' }
 *     });
 *
 *     return () => unregister('weather');
 *   }, []);
 *
 *   const monitor = getMonitor('weather');
 *
 *   return (
 *     <div>
 *       Latest: {JSON.stringify(monitor?.latestData)}
 *     </div>
 *   );
 * }
 * ```
 */
export function useDataMonitor(
  options?: UseDataMonitorOptions,
): UseDataMonitorReturn {
  const { monitor } = useDataMonitorContext();

  useEventSubscription({
    bus: monitor.eventBus,
    handler: {
      name: options?.handlerName ?? DEFAULT_EVENT_HANDLE_NAME,
      order: 1,
      handle: (event: DataUpdatedEvent) => {
        if (options?.eventHandler) {
          options.eventHandler(event);
        }
      },
    },
  });

  return {
    getMonitor: (id: string) => monitor.getMonitor(id),
    register: (monitorConfig: MonitorConfig) =>
      monitor.registerMonitor(monitorConfig),
    unregister: (id: string) => monitor.unregisterMonitor(id),
  };
}
