import type { EventHandler } from '@ahoo-wang/fetcher-eventbus';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { useCallback, useEffect, useId, useRef } from 'react';

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

  // Handler names registered through THIS hook instance. Multiple components
  // may share the same subscriberId (e.g. FetcherViewer and the refresh bar
  // items all use the viewerDefinitionId), so unmount cleanup must only
  // remove this instance's own handlers — never the shared prefix.
  const registeredHandlerNames = useRef<Set<string>>(new Set());

  const publish = useCallback((_subscriberId?: string) => {
    return bus.emit({
      type: 'REFRESH',
      subscriberId: _subscriberId ?? targetSubscriberId,
    });
  }, [targetSubscriberId]);

  const subscribe = useCallback(
    (handler: EventHandler<RefreshDataEvent>, _subscriberId?: string) => {
      const finalSubscriberId = _subscriberId ?? targetSubscriberId;
      const wrappedHandler: EventHandler<RefreshDataEvent> = {
        ...handler,
        name: `${finalSubscriberId}:${handler.name}`,
        order: handler.order,
        handle: (event: RefreshDataEvent) => {
          if (event.subscriberId === finalSubscriberId) {
            return handler.handle(event);
          }
        },
      };
      const subscribed = bus.on(wrappedHandler);
      if (subscribed) {
        registeredHandlerNames.current.add(wrappedHandler.name);
      }
      return subscribed;
    },
    [targetSubscriberId],
  );

  useEffect(() => {
    const ownHandlerNames = registeredHandlerNames.current;
    return () => {
      ownHandlerNames.forEach(name => {
        bus.off(name);
      });
      ownHandlerNames.clear();
    };
  }, [targetSubscriberId]);

  return {
    bus,
    publish,
    subscribe,
  };
}
