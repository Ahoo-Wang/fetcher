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

import { StorageMessenger } from '../../src';

it.each(['user-admin', 'user_admin', 'user:admin'])(
  'neither receives nor expires messages belonging to %s',
  otherChannel => {
    vi.useFakeTimers();
    localStorage.clear();
    const receiver = new StorageMessenger({
      channelName: 'user',
      ttl: 1,
      cleanupInterval: 5,
    });
    const sender = new StorageMessenger({
      channelName: otherChannel,
      ttl: 1000,
    });
    const received: unknown[] = [];
    receiver.onmessage = message => received.push(message);
    try {
      sender.postMessage('another channel');
      const key = localStorage.key(0)!;
      window.dispatchEvent(
        new StorageEvent('storage', {
          storageArea: localStorage,
          key,
          newValue: localStorage.getItem(key),
        }),
      );
      expect(received).toEqual([]);
      vi.advanceTimersByTime(10);
      expect(localStorage.getItem(key)).not.toBeNull();
    } finally {
      receiver.close();
      sender.close();
      localStorage.clear();
      vi.useRealTimers();
    }
  },
);
