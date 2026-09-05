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

import { randomUUID } from 'node:crypto';
import { expect, it, vi } from 'vitest';
import {
  BroadcastChannelMessenger,
  BroadcastTypedEventBus,
  SerialTypedEventBus,
  StorageMessenger,
} from '../src';

it.each(['broadcast', 'storage'] as const)(
  'reports invalid incoming messages and keeps receiving through the real %s messenger',
  async kind => {
    const channelName = `inbound-${randomUUID()}`;
    const createMessenger = () =>
      kind === 'broadcast'
        ? new BroadcastChannelMessenger(channelName)
        : new StorageMessenger({ channelName });
    const sender = createMessenger();
    const bus = new BroadcastTypedEventBus<{ count: bigint }>({
      delegate: new SerialTypedEventBus(channelName),
      messenger: createMessenger(),
      messageTransformer: {
        serialize: event => ({ count: String(event.count) }),
        deserialize: message => ({
          count: BigInt((message as { count: string }).count),
        }),
      },
    });
    const received: { count: bigint }[] = [];
    bus.on({
      name: 'direct',
      handle: event => {
        received.push(event);
      },
    });
    const warnings: unknown[][] = [];
    const warn = vi.spyOn(console, 'warn').mockImplementation((...args) => {
      warnings.push(args);
    });
    const send = (message: unknown) => {
      sender.postMessage(message);
      if (kind === 'storage') {
        const key = Array.from({ length: localStorage.length }, (_, index) =>
          localStorage.key(index),
        ).find(key => key?.startsWith(`_storage_msg_${channelName}_`))!;
        // Browser storage events originate in the other document.
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: localStorage.getItem(key),
            storageArea: localStorage,
          }),
        );
        localStorage.removeItem(key);
      }
    };
    try {
      send({ count: 'invalid' });
      await vi.waitFor(() => expect(warnings).toHaveLength(1));
      expect(warnings[0][0]).toEqual(expect.stringContaining(channelName));
      expect(warnings[0][1]).toBeInstanceOf(SyntaxError);
      expect(received).toEqual([]);

      send({ count: '2' });
      await vi.waitFor(() => expect(received).toEqual([{ count: 2n }]));
      expect(warnings).toHaveLength(1);
    } finally {
      bus.destroy();
      sender.close();
      warn.mockRestore();
    }
  },
);
