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


import { BroadcastChannelMessenger } from './broadcastChannelMessenger';

export type MessageHandler = (message: any) => void;

/**
 * Interface for cross-tab communication messengers
 *
 * Provides a unified API for different cross-tab communication mechanisms
 * like BroadcastChannel, StorageEvent, SharedWorker, etc.
 */
export interface CrossTabMessenger {
  /**
   * Send a message to other tabs/windows
   *
   * @param data - The data to send
   */
  postMessage(data: any): void;

  /**
   * Set the message handler for incoming messages
   *
   * @param handler - Function to handle incoming messages
   */
  set onmessage(handler: MessageHandler);

  /**
   * Close the messenger and clean up resources
   */
  close(): void;
}


export function isBroadcastChannelSupported(): boolean {
  return (
    typeof BroadcastChannel !== 'undefined' &&
    typeof BroadcastChannel.prototype?.postMessage === 'function'
  );
}

export function createCrossTabMessenger(channelName: string): CrossTabMessenger | undefined {
  if (isBroadcastChannelSupported()) {
    return new BroadcastChannelMessenger(channelName);
  }
  return undefined;
}