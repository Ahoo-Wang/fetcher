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
import { createCrossTabMessenger, CrossTabMessenger } from './messengers';

/**
 * Configuration options for BroadcastTypedEventBus
 *
 * @template EVENT - The event type this bus will handle
 */
export interface BroadcastTypedEventBusOptions<EVENT> {
  /**
   * The underlying event bus that handles local event processing and storage.
   * This bus manages event handlers and local event emission.
   */
  delegate: TypedEventBus<EVENT>;

  /**
   * Optional messenger for cross-tab/window communication.
   * If not provided, a default BroadcastChannel-based messenger will be created
   * using the pattern `_broadcast_:{type}`. Must be a valid CrossTabMessenger
   * implementation when provided.
   */
  messenger?: CrossTabMessenger;
}

/**
 * Broadcast event bus that enables cross-tab/window communication
 *
 * This class extends a local TypedEventBus with cross-context broadcasting capabilities.
 * When events are emitted, they are first processed locally by the delegate bus, then
 * broadcasted to other browser contexts (tabs, windows, etc.) through the provided messenger.
 *
 * Incoming broadcast messages from other contexts are automatically forwarded to the
 * local delegate bus for processing by registered event handlers.
 *
 * @template EVENT - The event type this bus handles (must be serializable for cross-context transport)
 *
 * @example Basic usage with default messenger
 * ```typescript
 * import { SerialTypedEventBus } from './serialTypedEventBus';
 * import { BroadcastTypedEventBus } from './broadcastTypedEventBus';
 *
 * // Create local event bus
 * const delegate = new SerialTypedEventBus<string>('user-events');
 *
 * // Create broadcast event bus with default messenger
 * const bus = new BroadcastTypedEventBus({
 *   delegate
 *   // messenger will be auto-created as '_broadcast_:user-events'
 * });
 *
 * // Register event handler
 * bus.on({
 *   name: 'user-login',
 *   order: 1,
 *   handle: (username: string) => console.log(`User ${username} logged in`)
 * });
 *
 * // Emit event (will be processed locally and broadcasted to other tabs)
 * await bus.emit('john-doe');
 * ```
 *
 * @example Using custom messenger
 * ```typescript
 * import { SerialTypedEventBus } from './serialTypedEventBus';
 * import { createCrossTabMessenger } from './messengers';
 * import { BroadcastTypedEventBus } from './broadcastTypedEventBus';
 *
 * // Create local event bus
 * const delegate = new SerialTypedEventBus<string>('user-events');
 *
 * // Create custom cross-tab messenger
 * const messenger = createCrossTabMessenger('my-custom-channel');
 *
 * // Create broadcast event bus
 * const bus = new BroadcastTypedEventBus({
 *   delegate,
 *   messenger
 * });
 *
 * // Register event handler and emit events...
 * ```
 *
 * @example Using custom messenger implementation
 * ```typescript
 * class CustomMessenger implements CrossTabMessenger {
 *   // ... implementation
 * }
 *
 * const customMessenger = new CustomMessenger();
 * const bus = new BroadcastTypedEventBus({
 *   delegate: new SerialTypedEventBus('events'),
 *   messenger: customMessenger
 * });
 * ```
 */
export class BroadcastTypedEventBus<EVENT> implements TypedEventBus<EVENT> {
  public readonly type: EventType;
  private readonly delegate: TypedEventBus<EVENT>;
  private messenger: CrossTabMessenger;

  /**
   * Creates a new broadcast event bus with cross-context communication
   *
   * @param options - Configuration object containing delegate bus and optional messenger
   * @throws {Error} If messenger creation fails when no messenger is provided
   */
  constructor(options: BroadcastTypedEventBusOptions<EVENT>) {
    this.delegate = options.delegate;
    this.type = this.delegate.type;
    const messenger =
      options.messenger ?? createCrossTabMessenger(`_broadcast_:${this.type}`);
    if (!messenger) {
      throw new Error('Messenger setup failed');
    }
    this.messenger = messenger;
    this.messenger.onmessage = async (event: EVENT) => {
      await this.delegate.emit(event);
    };
  }

  /**
   * Returns a copy of all currently registered event handlers
   *
   * This getter delegates to the underlying event bus and returns the current
   * list of handlers that will process incoming events.
   *
   * @returns Array of event handlers registered with this bus
   */
  get handlers(): EventHandler<EVENT>[] {
    return this.delegate.handlers;
  }

  /**
   * Emits an event locally and broadcasts it to other browser contexts
   *
   * This method first processes the event through the local delegate bus,
   * allowing all registered local handlers to process it. Then, if successful,
   * the event is broadcasted to other tabs/windows through the messenger.
   *
   * Note: If broadcasting fails (e.g., due to messenger errors), the local
   * emission is still completed and a warning is logged to console.
   *
   * @param event - The event data to emit and broadcast
   * @returns Promise that resolves when local processing is complete
   * @throws Propagates any errors from local event processing
   */
  async emit(event: EVENT): Promise<void> {
    await this.delegate.emit(event);
    this.messenger.postMessage(event);
  }

  /**
   * Removes an event handler by its registered name
   *
   * This method delegates to the underlying event bus to remove the specified
   * handler. The handler will no longer receive events emitted to this bus.
   *
   * @param name - The unique name of the handler to remove
   * @returns true if a handler with the given name was found and removed, false otherwise
   */
  off(name: string): boolean {
    return this.delegate.off(name);
  }

  /**
   * Registers a new event handler with this bus
   *
   * The handler will receive all events emitted to this bus, both locally
   * generated and received from other browser contexts via broadcasting.
   *
   * @param handler - The event handler configuration to register
   * @returns true if the handler was successfully added, false if a handler with the same name already exists
   */
  on(handler: EventHandler<EVENT>): boolean {
    return this.delegate.on(handler);
  }

  /**
   * Cleans up resources and stops cross-context communication
   *
   * This method closes the messenger connection, preventing further
   * cross-tab communication. Local event handling continues to work
   * through the delegate bus. After calling destroy(), the bus should
   * not be used for broadcasting operations.
   *
   * Note: This does not remove event handlers or affect local event processing.
   */
  destroy(): void {
    this.messenger.close();
  }
}
