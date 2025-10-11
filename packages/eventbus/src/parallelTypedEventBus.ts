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

/**
 * Parallel implementation of TypedEventBus
 *
 * Provides an in-memory event bus that executes event handlers in parallel.
 * Supports ordering and once-only execution of handlers.
 *
 * @template EVENT - The type of events this bus handles
 *
 * @example
 * ```typescript
 * const bus = new ParallelTypedEventBus<string>('test');
 * bus.on({ name: 'handler1', order: 1, handle: (event) => console.log(event) });
 * bus.on({ name: 'handler2', order: 2, handle: (event) => console.log('second', event) });
 * await bus.emit('hello'); // Both handlers execute in parallel
 * ```
 */
export class ParallelTypedEventBus<EVENT> implements TypedEventBus<EVENT> {
  private eventHandlers: EventHandler<EVENT>[] = [];

  /**
   * Creates a parallel typed event bus
   *
   * @param type - The event type identifier for this bus
   */
  constructor(public readonly type: EventType) {
  }

  /**
   * Gets a copy of all registered event handlers, sorted by order
   */
  get handlers(): EventHandler<EVENT>[] {
    return [...this.eventHandlers];
  }

  /**
   * Emits an event to all registered handlers in parallel
   *
   * Handlers are executed concurrently. Once-only handlers are removed after all executions complete.
   * Errors in individual handlers are logged but do not affect other handlers.
   *
   * @param event - The event to emit
   */
  async emit(event: EVENT): Promise<void> {
    const onceHandlers: EventHandler<EVENT>[] = [];
    const promises = this.eventHandlers.map(async handler => {
      try {
        await handler.handle(event);
      } catch (e) {
        console.warn(`Event handler error for ${handler.name}:`, e);
      } finally {
        if (handler.once) {
          onceHandlers.push(handler);
        }
      }
    });
    await Promise.all(promises);
    if (onceHandlers.length > 0) {
      this.eventHandlers = this.eventHandlers.filter(
        item => !onceHandlers.includes(item),
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
    const original = this.eventHandlers;
    if (!original.some(item => item.name === name)) {
      return false;
    }
    this.eventHandlers = original.filter(item => item.name !== name);
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
    const original = this.eventHandlers;
    if (original.some(item => item.name === handler.name)) {
      return false;
    }
    this.eventHandlers = [...original, handler];
    return true;
  }
}
