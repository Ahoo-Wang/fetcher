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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BroadcastTypedEventBus } from '../src';
import { SerialTypedEventBus } from '../src';

describe('BroadcastTypedEventBus', () => {
  let mockBroadcastChannel: any;
  let delegate: SerialTypedEventBus<string>;

  beforeEach(() => {
    mockBroadcastChannel = {
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    };
    global.BroadcastChannel = vi.fn(() => mockBroadcastChannel);
    delegate = new SerialTypedEventBus<string>('test');
  });

  it('should create a bus with type from delegate', () => {
    const bus = new BroadcastTypedEventBus(delegate);
    expect(bus.type).toBe('test');
    expect(global.BroadcastChannel).toHaveBeenCalledWith('_broadcast_:test');
  });

  it('should set onmessage to emit on delegate', async () => {
    new BroadcastTypedEventBus(delegate);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    delegate.on(handler);

    // Simulate receiving a message
    await mockBroadcastChannel.onmessage({ data: 'event' });

    expect(handler.handle).toHaveBeenCalledWith('event');
  });

  it('should log errors in onmessage', async () => {
    new BroadcastTypedEventBus(delegate);
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {
    });
    const handler = {
      name: 'h1',
      order: 1,
      handle: vi.fn(() => {
        throw new Error('error');
      }),
    };
    delegate.on(handler);

    // Simulate receiving a message that causes error
    await mockBroadcastChannel.onmessage({ data: 'event' });

    expect(consoleWarn).toHaveBeenCalledWith(
      'Event handler error for h1:',
      expect.any(Error),
    );
    consoleWarn.mockRestore();
  });

  it('should delegate handlers', () => {
    const bus = new BroadcastTypedEventBus(delegate);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);
    expect(bus.handlers).toEqual(delegate.handlers);
  });

  it('should delegate on', () => {
    const bus = new BroadcastTypedEventBus(delegate);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    expect(bus.on(handler)).toBe(true);
    expect(delegate.handlers.length).toBe(1);
  });

  it('should delegate off', () => {
    const bus = new BroadcastTypedEventBus(delegate);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);
    expect(bus.off('h1')).toBe(true);
    expect(delegate.handlers.length).toBe(0);
  });

  it('should emit locally and broadcast', async () => {
    const bus = new BroadcastTypedEventBus(delegate);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);

    await bus.emit('event');

    expect(handler.handle).toHaveBeenCalledWith('event');
    expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith('event');
  });

  it('should destroy by closing BroadcastChannel', () => {
    const bus = new BroadcastTypedEventBus(delegate);
    bus.destroy();
    expect(mockBroadcastChannel.close).toHaveBeenCalled();
  });
});
