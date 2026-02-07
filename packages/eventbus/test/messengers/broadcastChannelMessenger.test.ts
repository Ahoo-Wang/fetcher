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

declare const globalThis: {
  BroadcastChannel?: new (name: string) => { postMessage: (data: unknown) => void; close: () => void; onmessage: ((event: { data: unknown }) => void) | null };
};

import { describe, it, expect, vi, beforeEach, afterEach, MockInstance } from 'vitest';
import { BroadcastChannelMessenger } from '../../src';

describe('BroadcastChannelMessenger', () => {
  let originalBroadcastChannel: any;
  let BroadcastChannelMock: any;
  let lastInstance: any;

  beforeEach(() => {
    originalBroadcastChannel = globalThis.BroadcastChannel;

    class MockBroadcastChannel {
      static mockClear = vi.fn();
      postMessage = vi.fn();
      close = vi.fn();
      onmessage = null;
      constructor(public name: string) {
        lastInstance = this;
      }
    }

    BroadcastChannelMock = MockBroadcastChannel;
    (globalThis as Record<string, unknown>).BroadcastChannel = BroadcastChannelMock;
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>).BroadcastChannel = originalBroadcastChannel;
    lastInstance = null;
  });

  it('should create BroadcastChannel with correct name', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    expect(lastInstance.name).toBe('test-channel');
  });

  it('should post messages via BroadcastChannel', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    const testData = { message: 'test' };

    messenger.postMessage(testData);

    expect(lastInstance.postMessage).toHaveBeenCalledWith(testData);
  });

  it('should set onmessage handler on BroadcastChannel', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    const handler = vi.fn();

    messenger.onmessage = handler;

    expect(typeof lastInstance.onmessage).toBe('function');
  });

  it('should call handler when message is received', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    const handler = vi.fn();

    messenger.onmessage = handler;

    lastInstance.onmessage({ data: 'test message' });

    expect(handler).toHaveBeenCalledWith('test message');
  });

  it('should close BroadcastChannel when close is called', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');

    messenger.close();

    expect(lastInstance.close).toHaveBeenCalled();
  });

  it('should handle multiple message handlers', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    messenger.onmessage = handler1;
    messenger.onmessage = handler2;

    lastInstance.onmessage({ data: 'test' });

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledWith('test');
  });
});
