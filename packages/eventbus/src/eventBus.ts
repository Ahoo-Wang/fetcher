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
export type EventType = string | symbol;

export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

export interface EventBus<Events extends Record<EventType, unknown>> {
  /**
   * Registers an event handler for the specified event type.
   * @param type - The event type to listen for
   * @param handler - The handler function to call when the event is emitted
   * @returns A function to unregister the event handler
   */
  on<Key extends EventType>(
    type: Key,
    handler: EventHandler<Events[Key]>,
  ): () => void;

  /**
   * Registers a one-time event handler that will be automatically removed after the first emission.
   * @param type - The event type to listen for
   * @param handler - The handler function to call when the event is emitted
   */
  once<Key extends EventType>(
    type: Key,
    handler: EventHandler<Events[Key]>,
  ): void;

  /**
   * Removes an event handler for the specified event type.
   * @param type - The event type to stop listening for
   * @param handler - The handler function to remove
   */
  off<Key extends EventType>(
    type: Key,
    handler: EventHandler<Events[Key]>,
  ): void;

  /**
   * Emits an event to all registered handlers for the specified event type.
   * @param type - The event type to emit
   * @param event - The event data to pass to handlers
   * @returns A promise if any handler returns a promise, void otherwise
   */
  emit<Key extends EventType>(
    type: Key,
    event: Events[Key],
  ): void | Promise<void>;
}
