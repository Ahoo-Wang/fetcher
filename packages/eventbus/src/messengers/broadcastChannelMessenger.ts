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

import { CrossTabMessenger, MessageHandler } from './crossTabMessenger';

export class BroadcastChannelMessenger implements CrossTabMessenger {
  private readonly broadcastChannel: BroadcastChannel;

  constructor(channelName: string) {
    this.broadcastChannel = new BroadcastChannel(channelName);
  }

  postMessage(data: any): void {
    this.broadcastChannel.postMessage(data);
  }

  /**
   * Set the message handler for incoming messages
   *
   * @param handler - Function to handle incoming messages, or undefined to remove handler
   */
  set onmessage(handler: MessageHandler) {
    this.broadcastChannel.onmessage = (event: MessageEvent) => {
      handler(event.data);
    };
  }

  /**
   * Close the messenger and clean up resources
   *
   * After calling close(), the messenger cannot be used again.
   */
  close(): void {
    this.broadcastChannel.close();
  }
}
