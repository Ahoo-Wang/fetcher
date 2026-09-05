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
import type { Message } from '../../src/notification/types';

it('broadcasts notification data while keeping onClick local without mutating callers', async () => {
  vi.stubGlobal('BroadcastChannel', NativeBroadcastChannel);
  const { NotificationCenter } =
    await import('../../src/notification/notificationCenter');
  const center = new NotificationCenter();
  const peer = new NativeBroadcastChannel(
    '_broadcast_:NOTIFICATION_CENTER_EVENT',
  );
  const onClick = vi.fn();
  const payload = Object.freeze({
    body: 'Changed',
    data: { navigationUrl: '#changed' },
  });
  const original = Object.freeze({ title: 'Monitor', payload, onClick });
  let localMessage: Message | undefined;
  center.eventBus.on({
    name: 'inspect-local-message',
    handle: event => {
      localMessage = event.message;
    },
  });
  const received = new Promise<any>(resolve => {
    peer.onmessage = event => resolve(event.data);
  });
  try {
    await expect(center.publish('browser', original)).resolves.toBeUndefined();
    const event = await received;
    expect(event.message).toEqual({ title: 'Monitor', payload });
    expect(event.message.onClick).toBeUndefined();
    expect(localMessage?.onClick).toBe(onClick);
    localMessage?.onClick?.();
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(original.onClick).toBe(onClick);
    expect(
      Object.getOwnPropertyDescriptor(original, 'onClick')?.enumerable,
    ).toBe(true);
    expect(JSON.parse(JSON.stringify(localMessage))).toEqual(event.message);
    expect(original.payload).toBe(payload);
  } finally {
    peer.close();
    center.destroy();
  }
});
