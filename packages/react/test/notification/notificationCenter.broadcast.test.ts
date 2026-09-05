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

import { BroadcastChannel as NativeBroadcastChannel } from 'node:worker_threads';
import type { NotificationCenterEvent } from '../../src/notification/notificationCenter';
import type { Message } from '../../src/notification/types';

type TestMessage = Message<NotificationOptions> & { source: string };
const messageFactories: [
  string,
  (payload: NotificationOptions, onClick: () => void) => TestMessage,
][] = [
  [
    'plain properties',
    (payload, onClick) => ({
      title: 'Monitor',
      payload,
      onClick,
      source: 'monitor',
    }),
  ],
  [
    'prototype getters',
    (payload, onClick) =>
      new (class implements TestMessage {
        source = 'monitor';
        onClick = onClick;
        get title() {
          return 'Monitor';
        }
        get payload() {
          return payload;
        }
      })(),
  ],
  [
    'non-enumerable properties',
    (payload, onClick) =>
      Object.defineProperties(
        { title: 'Monitor', payload, onClick, source: 'monitor' },
        { title: { enumerable: false }, payload: { enumerable: false } },
      ),
  ],
];

it.each(messageFactories)(
  'keeps %s intact locally and omits onClick only on the wire',
  async (_name, createMessage) => {
    vi.stubGlobal('BroadcastChannel', NativeBroadcastChannel);
    const { NotificationCenter, notificationCenter } =
      await import('../../src/notification/notificationCenter');
    notificationCenter.destroy();
    const { channelRegistry } = await import('../../src/notification/channel');
    const center = new NotificationCenter();
    const peer = new NativeBroadcastChannel(
      '_broadcast_:NOTIFICATION_CENTER_EVENT',
    );
    const onClick = vi.fn();
    const payload = Object.freeze({
      body: 'Changed',
      data: { navigationUrl: '#changed' },
    });
    const original = Object.freeze(createMessage(payload, onClick));
    let channelMessage: Message | undefined;
    let channelTitle: string | undefined;
    let channelPayload: NotificationOptions | undefined;
    channelRegistry.register('test-message-identity', {
      send(message) {
        channelMessage = message;
        channelTitle = message.title;
        channelPayload = message.payload;
      },
    });
    let localMessage: Message | undefined;
    center.eventBus.on({
      name: 'inspect-local-message',
      handle: event => {
        localMessage = event.message;
      },
    });
    const received = new Promise<NotificationCenterEvent>(resolve => {
      peer.onmessage = event => resolve(event.data);
    });
    try {
      await expect(
        center.publish('test-message-identity', original),
      ).resolves.toBeUndefined();
      expect(channelTitle).toBe('Monitor');
      expect(channelPayload).toBe(payload);
      expect(channelMessage).toBe(original);
      expect(localMessage).toBe(original);
      expect(localMessage?.title).toBe('Monitor');
      expect(localMessage?.payload).toBe(payload);
      const event = await received;
      expect(event).toEqual({
        type: 'test-message-identity',
        message: { title: 'Monitor', payload, source: 'monitor' },
      });
      expect(event.message).not.toHaveProperty('onClick');
      expect(localMessage?.onClick).toBe(onClick);
      localMessage?.onClick?.();
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(original.onClick).toBe(onClick);
      expect(
        Object.getOwnPropertyDescriptor(original, 'onClick')?.enumerable,
      ).toBe(true);
      expect(original.payload).toBe(payload);
    } finally {
      peer.close();
      center.destroy();
      channelRegistry.unregister('test-message-identity');
    }
  },
);
