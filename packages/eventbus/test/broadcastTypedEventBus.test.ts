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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BroadcastTypedEventBus } from '../src';
import { SerialTypedEventBus } from '../src';
import { createCrossTabMessenger } from '../src/messengers/crossTabMessenger';

// Mock the createCrossTabMessenger function
vi.mock('../src/messengers/crossTabMessenger', () => ({
  createCrossTabMessenger: vi.fn(),
}));

describe('BroadcastTypedEventBus', () => {
  let mockMessenger: any;
  let delegate: SerialTypedEventBus<string>;
  let createCrossTabMessengerMock: any;

  beforeEach(() => {
    mockMessenger = {
      postMessage: vi.fn(),
      close: vi.fn(),
      set onmessage(handler: any) {
        this._onmessage = handler;
      },
      get onmessage() {
        return this._onmessage;
      },
      _onmessage: null,
      // Simulate calling the handler with event.data
      triggerMessage: function (event: any) {
        if (this._onmessage) {
          this._onmessage(event.data);
        }
      },
    };

    createCrossTabMessengerMock = vi.mocked(createCrossTabMessenger);
    createCrossTabMessengerMock.mockReturnValue(mockMessenger);

    delegate = new SerialTypedEventBus<string>('test');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should create a bus with type from delegate', () => {
    const bus = new BroadcastTypedEventBus({
      delegate,
      messenger: mockMessenger,
    });
    expect(bus.type).toBe('test');
    expect(createCrossTabMessengerMock).not.toHaveBeenCalled();
  });

  it('should set onmessage to emit on delegate', async () => {
    new BroadcastTypedEventBus({ delegate, messenger: mockMessenger });
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    delegate.on(handler);

    // Simulate receiving a message
    mockMessenger.triggerMessage({ data: 'event' });

    expect(handler.handle).toHaveBeenCalledWith('event');
  });

  it('should log errors in onmessage', async () => {
    new BroadcastTypedEventBus({ delegate, messenger: mockMessenger });
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const handler = {
      name: 'h1',
      order: 1,
      handle: vi.fn(() => {
        throw new Error('error');
      }),
    };
    delegate.on(handler);

    // Simulate receiving a message that causes error
    mockMessenger.triggerMessage({ data: 'event' });

    expect(consoleWarn).toHaveBeenCalledWith(
      'Event handler error for h1:',
      expect.any(Error),
    );
    consoleWarn.mockRestore();
  });

  it('should delegate handlers', () => {
    const bus = new BroadcastTypedEventBus({
      delegate,
      messenger: mockMessenger,
    });
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);
    expect(bus.handlers).toEqual(delegate.handlers);
  });

  it('should delegate on', () => {
    const bus = new BroadcastTypedEventBus({
      delegate,
      messenger: mockMessenger,
    });
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    expect(bus.on(handler)).toBe(true);
    expect(delegate.handlers.length).toBe(1);
  });

  it('should delegate off', () => {
    const bus = new BroadcastTypedEventBus({
      delegate,
      messenger: mockMessenger,
    });
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);
    expect(bus.off('h1')).toBe(true);
    expect(delegate.handlers.length).toBe(0);
  });

  it('should emit locally and broadcast', async () => {
    const bus = new BroadcastTypedEventBus({
      delegate,
      messenger: mockMessenger,
    });
    const handler = { name: 'h1', order: 1, handle: vi.fn() };
    bus.on(handler);

    await bus.emit('event');

    expect(handler.handle).toHaveBeenCalledWith('event');
    expect(mockMessenger.postMessage).toHaveBeenCalledWith('event');
  });

  it('should destroy by closing messenger', () => {
    const bus = new BroadcastTypedEventBus({
      delegate,
      messenger: mockMessenger,
    });
    bus.destroy();
    expect(mockMessenger.close).toHaveBeenCalled();
  });

  describe('options constructor', () => {
    it('should use custom messenger from options', () => {
      const customMessenger = {
        postMessage: vi.fn(),
        close: vi.fn(),
        set onmessage(handler: any) {
          this._onmessage = handler;
        },
        get onmessage() {
          return this._onmessage;
        },
        _onmessage: null,
      };

      const bus = new BroadcastTypedEventBus({
        delegate,
        messenger: customMessenger,
      });

      expect(createCrossTabMessengerMock).not.toHaveBeenCalled();
      expect(bus.type).toBe('test');
    });

    it('should create default messenger when none provided', () => {
      createCrossTabMessengerMock.mockReturnValue(mockMessenger);

      const bus = new BroadcastTypedEventBus({
        delegate,
      });

      expect(createCrossTabMessengerMock).toHaveBeenCalledWith(
        '_broadcast_:test',
      );
      expect(bus.type).toBe('test');
    });

    it('should throw error when messenger creation fails', () => {
      createCrossTabMessengerMock.mockReturnValue(null);

      expect(() => {
        new BroadcastTypedEventBus({
          delegate,
        });
      }).toThrow('Messenger setup failed');
    });
  });
});
