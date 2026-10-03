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
import type { CrossTabMessageHandler, TypeEventBusSupplier } from '../src';
import { BroadcastTypedEventBus, EventBus } from '../src';
import { SerialTypedEventBus } from '../src';

describe('EventBus', () => {
  let supplier: TypeEventBusSupplier;

  beforeEach(() => {
    supplier = vi.fn((type: string) => new SerialTypedEventBus(type));
  });

  it('should create buses lazily', () => {
    const bus = new EventBus<{ test: string }>(supplier);
    expect(supplier).not.toHaveBeenCalled();
    bus.on('test', { name: 'h1', order: 1, handle: vi.fn() });
    expect(supplier).toHaveBeenCalledWith('test');
  });

  it('should add handler', () => {
    const bus = new EventBus<{ test: string }>(supplier);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    expect(bus.on('test', handler)).toBe(true);
  });

  it('should not add duplicate handler', () => {
    const bus = new EventBus<{ test: string }>(supplier);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on('test', handler);
    expect(bus.on('test', handler)).toBe(false);
  });

  it('should remove handler', () => {
    const bus = new EventBus<{ test: string }>(supplier);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on('test', handler);
    expect(bus.off('test', handler.name)).toBe(true);
  });

  it('should not remove non-existent handler', () => {
    const bus = new EventBus<{ test: string }>(supplier);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    expect(bus.off('test', handler.name)).toBe(false);
  });

  it('should emit event', async () => {
    const bus = new EventBus<{ test: string }>(supplier);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on('test', handler);
    await bus.emit('test', 'event');
    expect(handler.handle).toHaveBeenCalledWith('event');
  });

  it('should handle multiple event types', () => {
    const bus = new EventBus<{ type1: string; type2: number }>(supplier);
    const h1 = { name: 'h1', order: 1, handle: vi.fn() };
    const h2 = { name: 'h2', order: 1, handle: vi.fn() };
    bus.on('type1', h1);
    bus.on('type2', h2);
    expect(supplier).toHaveBeenCalledTimes(2);
  });

  it('should destroy all buses', async () => {
    const bus = new EventBus<{ test: string }>(supplier);
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on('test', handler);
    const typed = vi.mocked(supplier).mock.results[0].value;
    const destroy = vi.spyOn(typed, 'destroy');
    bus.destroy();
    expect(destroy).toHaveBeenCalledOnce();
    // Destroy forgets the buses: a later emit gets a fresh one.
    await bus.emit('test', 'event');
    expect(handler.handle).not.toHaveBeenCalled();
    expect(supplier).toHaveBeenCalledTimes(2);
  });

  it('broadcasts an emit for a type nothing here has subscribed to', async () => {
    const postMessage = vi.fn();
    const bus = new EventBus<{ test: string }>(
      type =>
        new BroadcastTypedEventBus({
          delegate: new SerialTypedEventBus(type),
          messenger: {
            postMessage,
            close() {},
            set onmessage(_: CrossTabMessageHandler) {},
          },
        }),
    );
    await bus.emit('test', 'event');
    expect(postMessage).toHaveBeenCalledExactlyOnceWith('event');
    bus.destroy();
  });

  it('does not create a bus to remove a handler', () => {
    const bus = new EventBus<{ test: string }>(supplier);
    expect(bus.off('test', 'missing')).toBe(false);
    expect(supplier).not.toHaveBeenCalled();
  });
});
