/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useCallback } from 'react';
import { EventHandler, TypedEventBus } from '@ahoo-wang/fetcher-eventbus';

/**
 * Options for the useEventSubscription hook.
 * @template EVENT - The type of events handled by the event bus.
 */
export interface UseEventSubscriptionOptions<EVENT> {
  /**
   * The typed event bus instance to subscribe to.
   */
  bus: TypedEventBus<EVENT>;
  /**
   * The event handler function that will be called when events are published.
   */
  handler: EventHandler<EVENT>;
}

/**
 * Return type for the useEventSubscription hook.
 */
export interface UseEventSubscriptionReturn {
  /**
   * Function to manually subscribe to the event bus.
   * @returns true if subscription was successful, false otherwise.
   */
  subscribe: () => boolean;
  /**
   * Function to manually unsubscribe from the event bus.
   * @returns true if unsubscription was successful, false otherwise.
   */
  unsubscribe: () => boolean;
}

/**
 * A React hook for subscribing to events from a typed event bus.
 *
 * This hook automatically subscribes to the event bus when the component mounts
 * and unsubscribes when the component unmounts. It also provides manual subscribe
 * and unsubscribe functions for additional control.
 *
 * @template EVENT - The type of events handled by the event bus. Defaults to unknown.
 * @param options - Configuration options for the subscription.
 * @param options.bus - The typed event bus instance to subscribe to.
 * @param options.handler - The event handler function that will be called when events are published.
 * @returns An object containing subscribe and unsubscribe functions.
 * @throws Will throw an error if the event bus or handler is invalid.
 *
 * @example
 * ```typescript
 * import { useEventSubscription } from '@ahoo-wang/fetcher-react';
 * import { eventBus } from './eventBus';
 *
 * function MyComponent() {
 *   const { subscribe, unsubscribe } = useEventSubscription({
 *     bus: eventBus,
 *     handler: {
 *       name: 'myEvent',
 *       handle: (event) => {
 *         console.log('Received event:', event);
 *       }
 *     }
 *   });
 *
 *   // The hook automatically subscribes on mount and unsubscribes on unmount
 *   // You can also manually control subscription if needed
 *   const handleToggleSubscription = () => {
 *     if (someCondition) {
 *       subscribe();
 *     } else {
 *       unsubscribe();
 *     }
 *   };
 *
 *   return <div>My Component</div>;
 * }
 * ```
 */
export function useEventSubscription<EVENT = unknown>(
  options: UseEventSubscriptionOptions<EVENT>,
): UseEventSubscriptionReturn {
  const { bus, handler } = options;
  const subscribe = useCallback(() => {
    return bus.on(handler);
  }, [bus, handler]);

  const unsubscribe = useCallback(() => {
    return bus.off(handler.name);
  }, [bus, handler]);

  useEffect(() => {
    const success = bus.on(handler);
    if (!success) {
      console.warn(
        `Failed to subscribe to event bus with handler: ${handler.name}`,
      );
    }
    return () => {
      bus.off(handler.name);
    };
  }, [bus, handler]);

  return {
    subscribe,
    unsubscribe,
  };
}
