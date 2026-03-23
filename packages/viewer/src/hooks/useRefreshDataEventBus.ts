import {
  BroadcastTypedEventBus,
  EventHandler,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { useEffect, useId } from 'react';

const RefreshDataEventType = 'REFRESH_DATA_EVENTS';

export interface RefreshDataEvent {
  type: 'REFRESH';
  subscriberId: string;
}

export interface RefreshDataEventBusReturn {
  bus: BroadcastTypedEventBus<RefreshDataEvent>;
  publish: (subscriberId?: string) => Promise<void>;
  subscribe: (
    handler: EventHandler<RefreshDataEvent>,
    subscriberId?: string,
  ) => boolean;
}

const delegate = new SerialTypedEventBus<RefreshDataEvent>(
  RefreshDataEventType,
);
const bus = new BroadcastTypedEventBus<RefreshDataEvent>({ delegate });

export function useRefreshDataEventBus(
  subscriberId?: string,
): RefreshDataEventBusReturn {
  const generatedId = useId();

  const targetSubscriberId = subscriberId ?? generatedId;

  const publish = (_subscriberId?: string) => {
    return bus.emit({
      type: 'REFRESH',
      subscriberId: _subscriberId ?? targetSubscriberId,
    });
  };

  const subscribe = (
    handler: EventHandler<RefreshDataEvent>,
    _subscriberId?: string,
  ) => {
    const finalSubscriberId = _subscriberId ?? targetSubscriberId;
    const wrappedHandler: EventHandler<RefreshDataEvent> = {
      ...handler,
      name: `${finalSubscriberId}:${handler.name}`,
      order: handler.order,
      handle: async (event: RefreshDataEvent) => {
        if (event.subscriberId === finalSubscriberId) {
          await handler.handle(event);
        }
      },
    };
    return bus.on(wrappedHandler);
  };

  useEffect(() => {
    return () => {
      console.log(bus.handlers);
      bus.handlers
        .filter(h => h.name.startsWith(`${targetSubscriberId}:`))
        .forEach(handler => {
          bus.off(handler.name);
        });
    };
  }, [targetSubscriberId]);

  return {
    bus,
    publish,
    subscribe,
  };
}
