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

import { channelRegistry } from './channel';
import type { ChannelType, Message } from './';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const NotificationCenterEventType = 'NOTIFICATION_CENTER_EVENT';
const NotificationCenterEventHandler = 'NOTIFICATION_CENTER_EVENT_HANDLER';

export interface NotificationCenterEvent {
  type: ChannelType;
  message: Message;
}

const beforeUnloadHandler = () => {
  notificationCenter.destroy();
};

export class NotificationCenter {
  public readonly eventBus: BroadcastTypedEventBus<NotificationCenterEvent>;
  private readonly localEventBus =
    new SerialTypedEventBus<NotificationCenterEvent>(
      NotificationCenterEventType,
    );

  constructor() {
    this.eventBus = new BroadcastTypedEventBus<NotificationCenterEvent>({
      delegate: this.localEventBus,
      messageTransformer: {
        serialize: event => {
          const { title, payload } = event.message;
          const message = Object.fromEntries(
            Reflect.ownKeys(event.message)
              .filter(
                key =>
                  key !== 'onClick' &&
                  key !== 'title' &&
                  key !== 'payload' &&
                  Object.getOwnPropertyDescriptor(event.message, key)
                    ?.enumerable,
              )
              .map(key => [key, Reflect.get(event.message, key)]),
          );
          return { ...event, message: { ...message, title, payload } };
        },
        deserialize: message => message as NotificationCenterEvent,
      },
    });

    this.eventBus.on({
      name: NotificationCenterEventHandler,
      once: false,
      handle: async (event: NotificationCenterEvent) => {
        await this.sendNotification(event.type, event.message);
      },
    });
  }

  private async sendNotification(
    type: ChannelType,
    message: Message,
  ): Promise<void> {
    const channel = channelRegistry.get(type);
    if (!channel) {
      throw new Error(`Channel ${type} is not registered`);
    }
    await channel.send(message);
  }

  publish(type: ChannelType, message: Message): Promise<void> {
    return this.eventBus.emit({ type, message });
  }

  /** Deliver through local handlers without serializing or broadcasting. */
  publishLocal(type: ChannelType, message: Message): Promise<void> {
    return this.localEventBus.emit({ type, message });
  }

  off() {
    this.eventBus.off(NotificationCenterEventHandler);
  }

  destroy() {
    this.off();
    this.eventBus.destroy();
  }
}

export const notificationCenter = new NotificationCenter();

// Module-level side effect must be guarded so importing this module
// in Node/SSR environments does not throw a ReferenceError.
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', beforeUnloadHandler);
}
