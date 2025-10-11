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
 * Broadcast implementation of TypedEventBus using BroadcastChannel API
 *
 * Provides cross-tab/window event broadcasting. Events are emitted locally and broadcasted
 * to other tabs/windows via BroadcastChannel. Incoming broadcasts are handled by the delegate.
 *
 * @template EVENT - The type of events this bus handles
 *
 * @example
 * ```typescript
 * const delegate = new SerialTypedEventBus<string>('test');
 * const bus = new BroadcastTypedEventBus('my-channel', delegate);
 * bus.on({ name: 'handler', order: 1, handle: (event) => console.log(event) });
 * await bus.emit('hello'); // Emits locally and broadcasts to other tabs
 * ```
 */
export class BroadcastTypedEventBus<EVENT> implements TypedEventBus<EVENT> {
  public readonly type: EventType;
  private readonly broadcastChannel: BroadcastChannel;

  /**
   * Creates a broadcast typed event bus
   *
   * @param channel - The BroadcastChannel name for cross-tab communication
   * @param delegate - The underlying TypedEventBus for local event handling
   */
  constructor(
    channel: string,
    private readonly delegate: TypedEventBus<EVENT>,
  ) {
    this.broadcastChannel = new BroadcastChannel(channel);
    this.broadcastChannel.onmessage = event => {
      this.delegate.emit(event.data);
    };
    this.type = delegate.type;
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
    this.broadcastChannel.postMessage(event);
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
   * Cleans up resources by closing the BroadcastChannel
   */
  destroy() {
    this.broadcastChannel.close();
  }
}
