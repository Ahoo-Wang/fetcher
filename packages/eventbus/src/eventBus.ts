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

import { EventHandler, EventType } from './types';
import { TypedEventBus } from './typedEventBus';

/**
 * Supplier function for creating TypedEventBus instances by event type
 */
export type TypeEventBusSupplier = (type: EventType) => TypedEventBus<unknown>;

/**
 * Generic event bus that manages multiple event types using lazy-loaded TypedEventBus instances
 *
 * @template Events - A record mapping event types to their event data types
 *
 * @example
 * ```typescript
 * const supplier = (type: EventType) => new SerialTypedEventBus(type);
 * const bus = new EventBus<{ 'user-login': string; 'order-update': number }>(supplier);
 * bus.on('user-login', { name: 'logger', order: 1, handle: (event) => console.log(event) });
 * await bus.emit('user-login', 'john-doe');
 * ```
 */
export class EventBus<Events extends Record<EventType, unknown>> {
  private readonly buses: Map<EventType, TypedEventBus<unknown>> = new Map();

  /**
   * Creates a generic event bus
   *
   * @param typeEventBusSupplier - Function to create TypedEventBus for specific event types
   */
  constructor(private readonly typeEventBusSupplier: TypeEventBusSupplier) {}

  /**
   * Adds an event handler for a specific event type
   *
   * @template Key - The event type
   * @param type - The event type to listen for
   * @param handler - The event handler to add
   * @returns true if the handler was added, false if a handler with the same name already exists
   */
  on<Key extends EventType>(
    type: Key,
    handler: EventHandler<Events[Key]>,
  ): boolean {
    let bus = this.buses.get(type);
    if (!bus) {
      bus = this.typeEventBusSupplier(type);
      this.buses.set(type, bus);
    }
    return bus?.on(handler) ?? false;
  }

  /**
   * Removes an event handler for a specific event type
   *
   * @template Key - The event type
   * @param type - The event type
   * @param name - The name of the event handler to remove
   * @returns true if a handler was removed, false otherwise
   */
  off<Key extends EventType>(type: Key, name: string): boolean {
    return this.buses.get(type)?.off(name) ?? false;
  }

  /**
   * Emits an event for a specific event type
   *
   * @template Key - The event type
   * @param type - The event type to emit
   * @param event - The event data
   * @returns Promise if the underlying bus is async, void otherwise
   */
  emit<Key extends EventType>(
    type: Key,
    event: Events[Key],
  ): void | Promise<void> {
    return this.buses.get(type)?.emit(event);
  }

  /**
   * Cleans up all managed event buses
   */
  destroy(): void {
    for (const bus of this.buses.values()) {
      bus.destroy();
    }
    this.buses.clear();
  }
}
