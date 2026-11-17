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

import { expect, it, vi } from 'vitest';
import type { CrossTabMessageHandler } from '../src';
import { BroadcastTypedEventBus, SerialTypedEventBus } from '../src';

function callerMessenger() {
  let receive: CrossTabMessageHandler = () => {};
  return {
    close: vi.fn(),
    postMessage: vi.fn(),
    set onmessage(handler: CrossTabMessageHandler) {
      receive = handler;
    },
    deliver(message: unknown) {
      return receive(message);
    },
  };
}

it('does not detach the next bus from a reused messenger when destroyed again', async () => {
  const messenger = callerMessenger();
  const oldBus = new BroadcastTypedEventBus<string>({
    delegate: new SerialTypedEventBus('updates'),
    messenger,
  });
  oldBus.destroy();
  const newBus = new BroadcastTypedEventBus<string>({
    delegate: new SerialTypedEventBus('updates'),
    messenger,
  });
  const received: string[] = [];
  newBus.on({
    name: 'current-listener',
    handle: value => {
      received.push(value);
    },
  });

  await messenger.deliver('before repeated cleanup');
  oldBus.destroy();
  await messenger.deliver('after repeated cleanup');

  expect(received).toEqual([
    'before repeated cleanup',
    'after repeated cleanup',
  ]);
  expect(messenger.close).not.toHaveBeenCalled();
  newBus.destroy();
});

it('keeps handling locally without posting after a repeated destroy', async () => {
  const messenger = callerMessenger();
  const bus = new BroadcastTypedEventBus<string>({
    delegate: new SerialTypedEventBus('updates'),
    messenger,
  });
  const handle = vi.fn();
  bus.on({ name: 'local', handle });
  bus.destroy();
  bus.destroy();
  await bus.emit('local only');
  expect(handle).toHaveBeenCalledWith('local only');
  expect(messenger.postMessage).not.toHaveBeenCalled();
});

it('closes a messenger it created only once however often it is destroyed', () => {
  const close = vi.fn();
  class FakeChannel {
    onmessage: unknown = null;
    postMessage() {}
    close = close;
  }
  vi.stubGlobal('BroadcastChannel', FakeChannel);
  try {
    const bus = new BroadcastTypedEventBus<string>({
      delegate: new SerialTypedEventBus('owned'),
    });
    bus.destroy();
    bus.destroy();
    expect(close).toHaveBeenCalledOnce();
  } finally {
    vi.unstubAllGlobals();
  }
});
