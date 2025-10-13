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
  private readonly messageKey: string;
  private readonly storageEventHandler = (event: StorageEvent) => {
    if (!event.key?.startsWith(this.messageKey) || !event.newValue) {
      return;
    }
    const storageMessage = JSON.parse(event.newValue);
    this.messageHandler?.(storageMessage.data);
  };

  constructor(options: StorageMessengerOptions) {
    this.channelName = options.channelName;
    this.storage = options.storage ?? localStorage;
    this.messageKey = `_storage_msg_${this.channelName}`;
    window.addEventListener('storage', this.storageEventHandler);
  }

  /**
   * Send a message to other tabs/windows via localStorage
   */
  postMessage(message: any): void {
    try {
      this.storage.setItem(this.messageKey, JSON.stringify(message));
    } finally {
      this.storage.removeItem(this.messageKey);
    }
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
