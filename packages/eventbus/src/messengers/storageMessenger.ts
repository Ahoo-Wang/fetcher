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
 * after being processed to avoid storage pollution.
 *
 * @example
 * ```typescript
 * const messenger = new StorageMessenger('my-channel');
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
  private readonly storageEventHandler = (event: StorageEvent) => {
    if (!event.key?.startsWith(this.messageKeyPrefix) || !event.newValue) {
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
    window.addEventListener('storage', this.storageEventHandler);
  }

  /**
   * Send a message to other tabs/windows via localStorage
   */
  postMessage(message: any): void {
    const key = `${this.messageKeyPrefix}_${this.messageCounter++}`;
    const storageMessage: StorageMessage = { data: message, timestamp: Date.now() };
    this.storage.setItem(key, JSON.stringify(storageMessage));
    // Delay removal to ensure all listeners have processed the event
    setTimeout(() => this.storage.removeItem(key), 100);
  }

  /**
   * Set the message handler for incoming messages
   */
  set onmessage(handler: CrossTabMessageHandler) {
    this.messageHandler = handler;
  }

  /**
   * Close the messenger and clean up resources
   */
  close(): void {
    window.removeEventListener('storage', this.storageEventHandler);
  }
}
