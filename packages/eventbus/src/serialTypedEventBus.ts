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

import { TypedEventBus } from './typedEventBus';
import { EventHandler, EventType } from './types';
import { toSorted } from '@ahoo-wang/fetcher';

/**
 * Serial implementation of TypedEventBus
 *
 * Provides an in-memory event bus that executes event handlers serially in order of priority.
 * Supports ordering and once-only execution of handlers.
 *
 * @template EVENT - The type of events this bus handles
 *
 * @example
 * ```typescript
 * const bus = new SerialTypedEventBus<string>('test');
 * bus.on({ name: 'handler1', order: 1, handle: (event) => console.log(event) });
 * bus.on({ name: 'handler2', order: 2, handle: (event) => console.log('second', event) });
 * await bus.emit('hello'); // handler1 executes first, then handler2
 * ```
 */
export class SerialTypedEventBus<EVENT> implements TypedEventBus<EVENT> {
  private sortedHandlers: EventHandler<EVENT>[] = [];

  /**
   * Creates an in-memory typed event bus
   *
   * @param type - The event type identifier for this bus
   */
  constructor(public readonly type: EventType) {
  }

  /**
   * Gets a copy of all registered event handlers, sorted by order
   */
  get handlers(): EventHandler<EVENT>[] {
    return [...this.sortedHandlers];
  }

  /**
   * Emits an event to all registered handlers serially
   *
   * Handlers are executed in order of their priority. Once-only handlers are removed after execution.
   * Errors in individual handlers are logged but do not stop other handlers.
   *
   * @param event - The event to emit
   */
  async emit(event: EVENT): Promise<void> {
    const onceHandlers: EventHandler<EVENT>[] = [];
    for (const handler of this.sortedHandlers) {
      try {
        await handler.handle(event);
      } catch (e) {
        console.warn(`Event handler error for ${handler.name}:`, e);
      } finally {
        if (handler.once) {
          onceHandlers.push(handler);
        }
      }
    }
    if (onceHandlers.length > 0) {
      this.sortedHandlers = toSorted(
        this.sortedHandlers.filter(item => !onceHandlers.includes(item)),
      );
    }
  }

  /**
   * Removes an event handler by name
   *
   * @param name - The name of the handler to remove
   * @returns true if a handler was removed, false otherwise
   */
  off(name: string): boolean {
    const original = this.sortedHandlers;
    if (!original.some(item => item.name === name)) {
      return false;
    }
    this.sortedHandlers = toSorted(original, item => item.name !== name);
    return true;
  }

  /**
   * Adds an event handler if not already present
   *
   * Handlers are sorted by their order property after addition.
   *
   * @param handler - The event handler to add
   * @returns true if the handler was added, false if a handler with the same name already exists
   */
  on(handler: EventHandler<EVENT>): boolean {
    const original = this.sortedHandlers;
    if (original.some(item => item.name === handler.name)) {
      return false;
    }
    this.sortedHandlers = toSorted([...original, handler]);
    return true;
  }
}
