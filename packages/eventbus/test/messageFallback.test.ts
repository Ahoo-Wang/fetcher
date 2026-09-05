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
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
  type CrossTabMessageHandler,
} from '../src';

it('retries a failed messenger post once with its already serialized message', async () => {
  const failure = new Error('post failed');
  const postMessage = vi.fn().mockImplementationOnce(() => {
    throw failure;
  });
  const serialize = vi.fn(() => 'wire');
  const fallbackSerialize = vi.fn(() => 'fallback');
  const bus = new BroadcastTypedEventBus({
    delegate: new SerialTypedEventBus<string>('retry'),
    messenger: {
      postMessage,
      close() {},
      set onmessage(_: CrossTabMessageHandler) {},
    },
    messageTransformer: { serialize, fallbackSerialize, deserialize: String },
  });
  await bus.emit('original');
  expect(serialize).toHaveBeenCalledExactlyOnceWith('original');
  expect(fallbackSerialize).toHaveBeenCalledExactlyOnceWith('wire', failure);
  expect(postMessage.mock.calls).toEqual([['wire'], ['fallback']]);
  bus.destroy();
});

it('does not treat conversion failures as messenger failures or retry a second failure', async () => {
  const failure = new Error('failed');
  const postMessage = vi.fn(() => {
    throw failure;
  });
  const fallbackSerialize = vi.fn(() => 'fallback');
  const serialize = vi.fn<() => string>(() => {
    throw failure;
  });
  const bus = new BroadcastTypedEventBus({
    delegate: new SerialTypedEventBus<string>('failure'),
    messenger: {
      postMessage,
      close() {},
      set onmessage(_: CrossTabMessageHandler) {},
    },
    messageTransformer: { serialize, fallbackSerialize, deserialize: String },
  });
  await expect(bus.emit('original')).rejects.toBe(failure);
  expect(fallbackSerialize).not.toHaveBeenCalled();
  expect(postMessage).not.toHaveBeenCalled();
  serialize.mockImplementation(() => 'wire');
  await expect(bus.emit('original')).rejects.toBe(failure);
  expect(postMessage).toHaveBeenCalledTimes(2);
  expect(fallbackSerialize).toHaveBeenCalledOnce();
  bus.destroy();
});

it.each([true, false])(
  'keeps nested messages independent with early serialization %s',
  async beforeDispatch => {
    const order: string[] = [];
    const bus = new BroadcastTypedEventBus<{ value: number }>({
      delegate: new SerialTypedEventBus('nested'),
      messenger: {
        postMessage(message: { value: number }) {
          order.push(`post:${message.value}`);
        },
        close() {},
        set onmessage(_: CrossTabMessageHandler) {},
      },
      messageTransformer: {
        ...(beforeDispatch ? { serializeBeforeDispatch: true } : {}),
        serialize(event) {
          order.push(`serialize:${event.value}`);
          return { value: event.value };
        },
        deserialize: message => message as { value: number },
      },
    });
    bus.on({
      name: 'reenter',
      once: true,
      async handle(event) {
        order.push(`local:${event.value}`);
        event.value = 2;
        await bus.emit(event);
        event.value = 3;
      },
    });
    await bus.emit({ value: 1 });
    expect(order).toEqual(
      beforeDispatch
        ? ['serialize:1', 'local:1', 'serialize:2', 'post:2', 'post:1']
        : ['local:1', 'serialize:2', 'post:2', 'serialize:3', 'post:3'],
    );
    bus.destroy();
  },
);
