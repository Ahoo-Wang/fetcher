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

it.each(['getter', 'proxy'] as const)(
  'does not inspect onClick through a throwing %s while broadcasting',
  async kind => {
    vi.stubGlobal('BroadcastChannel', NativeBroadcastChannel);
    const { NotificationCenter } =
      await import('../../src/notification/notificationCenter');
    const { channelRegistry } = await import('../../src/notification/channel');
    const center = new NotificationCenter();
    const peer = new NativeBroadcastChannel(
      '_broadcast_:NOTIFICATION_CENTER_EVENT',
    );
    const readCallback = vi.fn(() => {
      throw new Error('onClick is local only');
    });
    const target = {
      title: 'Monitor',
      payload: { body: 'Changed' },
      source: 'monitor',
    };
    const original: Message =
      kind === 'getter'
        ? Object.defineProperty({ ...target }, 'onClick', {
            enumerable: true,
            get: readCallback,
          })
        : new Proxy(
            { ...target, onClick() {} },
            {
              get(object, key, receiver) {
                if (key === 'onClick') return readCallback();
                return Reflect.get(object, key, receiver);
              },
              getOwnPropertyDescriptor(object, key) {
                if (key === 'onClick') return readCallback();
                return Reflect.getOwnPropertyDescriptor(object, key);
              },
            },
          );
    const send = vi.fn();
    channelRegistry.register('skip-onclick', { send });
    const received = new Promise<NotificationCenterEvent>(resolve => {
      peer.onmessage = event => resolve(event.data);
    });
    try {
      await expect(
        center.publish('skip-onclick', original),
      ).resolves.toBeUndefined();
      expect(send.mock.calls[0][0]).toBe(original);
      expect((await received).message).toEqual(target);
      expect(readCallback).not.toHaveBeenCalled();
    } finally {
      peer.close();
      center.destroy();
      channelRegistry.unregister('skip-onclick');
    }
  },
);

it('publishes locally through every local handler without crossing the wire', async () => {
  vi.stubGlobal('BroadcastChannel', NativeBroadcastChannel);
  const { NotificationCenter } =
    await import('../../src/notification/notificationCenter');
  const { channelRegistry } = await import('../../src/notification/channel');
  const center = new NotificationCenter();
  const peer = new NativeBroadcastChannel(
    '_broadcast_:NOTIFICATION_CENTER_EVENT',
  );
  const send = vi.fn();
  const observe = vi.fn();
  channelRegistry.register('local-monitor', { send });
  center.eventBus.on({ name: 'observe-local', handle: observe });
  const serialize = vi.spyOn(center.eventBus.messageTransformer!, 'serialize');
  const original = {
    title: 'Local',
    payload: { body: 'Changed' },
    onClick() {},
  };
  const wire: NotificationCenterEvent[] = [];
  const barrier = new Promise<void>(resolve => {
    peer.onmessage = event => {
      wire.push(event.data);
      if (event.data.message.title === 'Barrier') resolve();
    };
  });
  try {
    await center.publishLocal('local-monitor', original);
    expect(send.mock.calls[0][0]).toBe(original);
    expect(observe.mock.calls[0][0].message).toBe(original);
    expect(serialize).not.toHaveBeenCalled();
    await center.publish('local-monitor', { title: 'Barrier', payload: {} });
    await barrier;
    expect(wire.map(event => event.message.title)).toEqual(['Barrier']);
    expect(send).toHaveBeenCalledTimes(2);
    expect(observe).toHaveBeenCalledTimes(2);
  } finally {
    serialize.mockRestore();
    peer.close();
    center.destroy();
    channelRegistry.unregister('local-monitor');
  }
});
