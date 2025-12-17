import { DataUpdatedEvent, MonitorConfig, MonitorState } from './types';
import { useDataMonitorContext } from './DataMonitorContext';
import { useEventSubscription } from '../eventbus';

export interface UseDataMonitorReturn {
  getMonitor: (id: string) => MonitorState;

  register: (monitorConfig: MonitorConfig) => Promise<void>;

  unregister: (monitorId: string) => void;
}

export interface UseDataMonitorOptions {
  eventHandler?: (event: DataUpdatedEvent) => void;
}

export function useDataMonitor(
  options?: UseDataMonitorOptions,
): UseDataMonitorReturn {
  const { monitor } = useDataMonitorContext();

  useEventSubscription({
    bus: monitor.eventBus,
    handler: {
      name: 'demo-notification',
      order: 1,
      handle: (event: DataUpdatedEvent) => {
        if (options?.eventHandler) {
          options.eventHandler(event);
        }
      },
    },
  });

  return {
    getMonitor: monitor.getMonitor,
    register: monitor.registerMonitor,
    unregister: monitor.unregisterMonitor,
  };
}
