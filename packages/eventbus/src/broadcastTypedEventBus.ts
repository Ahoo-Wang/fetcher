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
import { CrossTabMessenger } from './messengers';

/**
 * Options for creating a BroadcastTypedEventBus
 *
 * @template EVENT - The type of events this bus handles
 */
export interface BroadcastTypedEventBusOptions<EVENT> {
  /** The underlying TypedEventBus for local event handling */
  delegate: TypedEventBus<EVENT>;
  /** Custom messenger for cross-tab communication */
  messenger: CrossTabMessenger;
}

/**
 * Broadcast implementation of TypedEventBus using BroadcastChannel API
 *
 * Enables cross-tab/window event broadcasting within the same origin. Events are first emitted
 * locally via the delegate, then broadcasted to other tabs/windows. Incoming broadcasts from
 * other tabs are handled by the delegate as well.
 *
 * Note: BroadcastChannel is only supported in modern browsers and requires same-origin policy.
 *
 * @template EVENT - The type of events this bus handles
 *
 * @example Using options object
 * ```typescript
 * const delegate = new SerialTypedEventBus<string>('user-events');
 * const messenger = createCrossTabMessenger('my-channel');
 * const bus = new BroadcastTypedEventBus({
 *   delegate,
 *   messenger
 * });
 * bus.on({ name: 'user-login', order: 1, handle: (event) => console.log('User logged in:', event) });
 * await bus.emit('john-doe'); // Emits locally and broadcasts to other tabs
 * ```
 */
export class BroadcastTypedEventBus<EVENT> implements TypedEventBus<EVENT> {
  public readonly type: EventType;
  private readonly delegate: TypedEventBus<EVENT>;
  private messenger: CrossTabMessenger;

  /**
   * Creates a broadcast typed event bus
   *
   * @param options - Configuration options for the event bus
   */
  constructor(options: BroadcastTypedEventBusOptions<EVENT>) {
    this.delegate = options.delegate;
    this.type = this.delegate.type;
    this.messenger = options.messenger;
    this.messenger.onmessage = async (event: EVENT) => {
      await this.delegate.emit(event);
    };
  }

  /**
   * Gets a copy of all registered event handlers from the delegate
   */
  get handlers(): EventHandler<EVENT>[] {
    return this.delegate.handlers;
  }

  /**
   * Emits an event locally and broadcasts it to other tabs/windows
   *
   * @param event - The event to emit
   */
  async emit(event: EVENT): Promise<void> {
    await this.delegate.emit(event);
    this.messenger.postMessage(event);
  }

  /**
   * Removes an event handler by name from the delegate
   *
   * @param name - The name of the handler to remove
   * @returns true if a handler was removed, false otherwise
   */
  off(name: string): boolean {
    return this.delegate.off(name);
  }

  /**
   * Adds an event handler to the delegate
   *
   * @param handler - The event handler to add
   * @returns true if the handler was added, false if a handler with the same name already exists
   */
  on(handler: EventHandler<EVENT>): boolean {
    return this.delegate.on(handler);
  }

  /**
   * Cleans up resources by closing the messenger
   */
  destroy(): void {
    this.messenger.close();
  }
}
