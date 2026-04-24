// packages/react/src/dataMonitor/useDataMonitorEventBus.ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import type { EventHandler } from '@ahoo-wang/fetcher-eventbus';

const DataMonitorEventType = 'DATA_MONITOR_EVENT';

export interface DataChangedEvent {
  type: 'DATA_CHANGED';
  viewId: string;
  viewName: string;
  previousTotal: number | null;
  currentTotal: number;
}

export interface UseDataMonitorEventBusReturn {
  subscribe: (handler: EventHandler<DataChangedEvent>) => boolean;
  unsubscribe: (handlerName: string) => boolean;
}

const delegate = new SerialTypedEventBus<DataChangedEvent>(DataMonitorEventType);
const bus = new BroadcastTypedEventBus<DataChangedEvent>({ delegate });

export function useDataMonitorEventBus(): UseDataMonitorEventBusReturn {
  const subscribe = (handler: EventHandler<DataChangedEvent>): boolean => {
    return bus.on(handler);
  };

  const unsubscribe = (handlerName: string): boolean => {
    return bus.off(handlerName);
  };

  return {
    subscribe,
    unsubscribe,
  };
}

// 供 Service 内部调用的发布函数
export const dataMonitorEventBus = {
  emit: (event: DataChangedEvent): Promise<void> => {
    return bus.emit(event);
  },
};
