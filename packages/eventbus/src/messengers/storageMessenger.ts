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

import { CrossTabMessenger, CrossTabMessageHandler } from './crossTabMessenger';

export interface StorageMessengerOptions {
  channelName: string;
  /** Storage instance to use. Defaults to localStorage */
  storage?: Storage;
  /** Time to live in milliseconds for messages. Used for periodic cleanup of expired data */
  ttl?: number;
  /** Interval in milliseconds for periodic cleanup. Defaults to 1000ms */
  cleanupInterval?: number;
}

export interface StorageMessage {
  data: any;
  timestamp: number;
}

/**
 * Messenger implementation using StorageEvent API for cross-tab communication
 *
 * This messenger uses localStorage to send messages and listens to storage events
 * to receive messages from other tabs/windows. Messages are cleaned up immediately
 * after being processed to avoid storage pollution. Optional TTL support allows
 * periodic cleanup of expired messages.
 *
 * @example
 * ```typescript
 * const messenger = new StorageMessenger({
 *   channelName: 'my-channel',
 *   ttl: 5000, // 5 seconds TTL
 *   cleanupInterval: 1000 // Clean every 1 second
 * });
 * messenger.onmessage = (message) => console.log('Received:', message);
 * messenger.postMessage('Hello from another tab!');
 * ```
 */
export class StorageMessenger implements CrossTabMessenger {
  private readonly channelName: string;
  private readonly storage: Storage;
  private messageHandler?: CrossTabMessageHandler;
  private readonly messageKeyPrefix: string;
  private messageCounter = 0;
  private readonly ttl: number;
  private readonly cleanupInterval: number;
  private cleanupTimer?: number;
  private readonly storageEventHandler = (event: StorageEvent) => {
    if (
      event.storageArea !== this.storage ||
      !event.key?.startsWith(this.messageKeyPrefix) ||
      !event.newValue
    ) {
      return;
    }
    try {
      const storageMessage = JSON.parse(event.newValue) as StorageMessage;
      this.messageHandler?.(storageMessage.data);
    } catch (error) {
      console.warn('Failed to parse storage message:', error);
    }
  };

  constructor(options: StorageMessengerOptions) {
    this.channelName = options.channelName;
    this.storage = options.storage ?? localStorage;
    this.messageKeyPrefix = `_storage_msg_${this.channelName}`;
    this.ttl = options.ttl ?? 1000;
    this.cleanupInterval = options.cleanupInterval ?? 60000;
    this.cleanupTimer = window.setInterval(
      () => this.cleanup(),
      this.cleanupInterval,
    );
    window.addEventListener('storage', this.storageEventHandler);
  }

  /**
   * Send a message to other tabs/windows via localStorage
   */
  postMessage(message: any): void {
    const key = `${this.messageKeyPrefix}_${this.messageCounter++}`;
    const storageMessage: StorageMessage = {
      data: message,
      timestamp: Date.now(),
    };
    this.storage.setItem(key, JSON.stringify(storageMessage));
    // Delay removal to ensure all listeners have processed the event
    setTimeout(() => this.storage.removeItem(key), this.cleanupInterval);
  }

  /**
   * Set the message handler for incoming messages
   */
  set onmessage(handler: CrossTabMessageHandler) {
    this.messageHandler = handler;
  }

  /**
   * Clean up expired messages from storage
   */
  private cleanup(): void {
    const now = Date.now();
    const keysToRemove: string[] = [];
    for (let i = 0; i < this.storage.length; i++) {
      const key = this.storage.key(i);
      if (key?.startsWith(this.messageKeyPrefix)) {
        try {
          const value = this.storage.getItem(key);
          if (value) {
            const message: StorageMessage = JSON.parse(value);
            if (now > message.timestamp + this.ttl) {
              keysToRemove.push(key);
            }
          }
        } catch {
          // Invalid data, remove it
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => this.storage.removeItem(key));
  }

  /**
   * Close the messenger and clean up resources
   */
  close(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }
    window.removeEventListener('storage', this.storageEventHandler);
  }
}
