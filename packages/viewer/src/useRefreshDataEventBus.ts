import {
  BroadcastTypedEventBus,
  EventHandler,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { useEffect } from 'react';

const RefreshDataEventType = 'REFRESH_DATA_EVENTS';

export interface RefreshDataEventBusReturn {
  bus: BroadcastTypedEventBus<string>;
  publish: () => Promise<void>;
  subscribe: (handler: EventHandler<string>) => boolean;
}

const delegate = new SerialTypedEventBus<string>(RefreshDataEventType);
const bus = new BroadcastTypedEventBus({ delegate });

export function useRefreshDataEventBus(): RefreshDataEventBusReturn {
  const publish = () => {
    return bus.emit('REFRESH');
  };

  const subscribe = (handler: EventHandler<string>) => {
    return bus.on(handler);
  };

  useEffect(() => {
    return () => {
      bus.handlers.forEach(handler => {
        bus.off(handler.name);
      });
    };
  }, []);

  return {
    bus,
    publish,
    subscribe,
  };
}
