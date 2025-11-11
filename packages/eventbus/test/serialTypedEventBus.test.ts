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

import { describe, it, expect, vi } from 'vitest';
import { SerialTypedEventBus } from '../src';

describe('SerialTypedEventBus', () => {
  it('should create a bus with type', () => {
    const bus = new SerialTypedEventBus<string>('test');
    expect(bus.type).toBe('test');
  });

  it('should add handler', () => {
    const bus = new SerialTypedEventBus<string>('test');
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    expect(bus.on(handler)).toBe(true);
    expect(bus.handlers).toHaveLength(1);
  });

  it('should not add duplicate handler', () => {
    const bus = new SerialTypedEventBus<string>('test');
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);
    expect(bus.on(handler)).toBe(false);
  });

  it('should remove handler', () => {
    const bus = new SerialTypedEventBus<string>('test');
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);
    expect(bus.off('h1')).toBe(true);
    expect(bus.handlers).toHaveLength(0);
  });

  it('should not remove non-existent handler', () => {
    const bus = new SerialTypedEventBus<string>('test');
    expect(bus.off('h1')).toBe(false);
  });

  it('should emit serially in order', async () => {
    const bus = new SerialTypedEventBus<string>('test');
    const calls: string[] = [];
    const h1 = {
      name: 'h1',
      order: 1,
      handle: vi.fn(async () => {
        calls.push('h1');
      }),
    };
    const h2 = {
      name: 'h2',
      order: 2,
      handle: vi.fn(async () => {
        calls.push('h2');
      }),
    };
    bus.on(h1);
    bus.on(h2);
    await bus.emit('event');
    expect(calls).toEqual(['h1', 'h2']);
    expect(h1.handle).toHaveBeenCalledWith('event');
    expect(h2.handle).toHaveBeenCalledWith('event');
  });

  it('should handle once handlers', async () => {
    const bus = new SerialTypedEventBus<string>('test');
    const handler = { name: 'once', order: 1, handle: vi.fn(), once: true };
    bus.on(handler);
    await bus.emit('event');
    expect(bus.handlers).toHaveLength(0);
  });

  it('should log errors but continue', async () => {
    const bus = new SerialTypedEventBus<string>('test');
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const h1 = {
      name: 'h1',
      order: 1,
      handle: vi.fn(() => {
        throw new Error('error');
      }),
    };
    const h2 = { name: 'h2', order: 2, handle: vi.fn() };
    bus.on(h1);
    bus.on(h2);
    await bus.emit('event');
    expect(consoleWarn).toHaveBeenCalledWith(
      'Event handler error for h1:',
      expect.any(Error),
    );
    expect(h2.handle).toHaveBeenCalled();
    consoleWarn.mockRestore();
  });

  it('should return sorted handlers', () => {
    const bus = new SerialTypedEventBus<string>('test');
    const h2 = { name: 'h2', order: 2, handle: vi.fn() };
    const h1 = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(h2);
    bus.on(h1);
    const handlers = bus.handlers;
    expect(handlers[0].name).toBe('h1');
    expect(handlers[1].name).toBe('h2');
  });

  it('should destroy by clearing handlers', () => {
    const bus = new SerialTypedEventBus<string>('test');
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);
    expect(bus.handlers.length).toBe(1);
    bus.destroy();
    expect(bus.handlers.length).toBe(0);
  });
});
