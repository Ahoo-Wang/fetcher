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
import { BroadcastChannelMessenger } from '../../src';

describe('BroadcastChannelMessenger', () => {
  let mockBroadcastChannel: any;
  let originalBroadcastChannel: any;

  beforeEach(() => {
    mockBroadcastChannel = {
      postMessage: vi.fn(),
      close: vi.fn(),
      onmessage: null,
    };

    originalBroadcastChannel = (global as any).BroadcastChannel;
    (global as any).BroadcastChannel = vi.fn(() => mockBroadcastChannel);
  });

  afterEach(() => {
    (global as any).BroadcastChannel = originalBroadcastChannel;
  });

  it('should create BroadcastChannel with correct name', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    expect((global as any).BroadcastChannel).toHaveBeenCalledWith(
      'test-channel',
    );
  });

  it('should post messages via BroadcastChannel', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    const testData = { message: 'test' };

    messenger.postMessage(testData);

    expect(mockBroadcastChannel.postMessage).toHaveBeenCalledWith(testData);
  });

  it('should set onmessage handler on BroadcastChannel', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    const handler = vi.fn();

    messenger.onmessage = handler;

    expect(typeof mockBroadcastChannel.onmessage).toBe('function');
  });

  it('should call handler when message is received', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    const handler = vi.fn();

    messenger.onmessage = handler;

    // Simulate receiving a message
    mockBroadcastChannel.onmessage({ data: 'test message' });

    expect(handler).toHaveBeenCalledWith('test message');
  });

  it('should close BroadcastChannel when close is called', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');

    messenger.close();

    expect(mockBroadcastChannel.close).toHaveBeenCalled();
  });

  it('should handle multiple message handlers', () => {
    const messenger = new BroadcastChannelMessenger('test-channel');
    const handler1 = vi.fn();
    const handler2 = vi.fn();

    messenger.onmessage = handler1;
    messenger.onmessage = handler2;

    // Only the last handler should be called
    mockBroadcastChannel.onmessage({ data: 'test' });

    expect(handler1).not.toHaveBeenCalled();
    expect(handler2).toHaveBeenCalledWith('test');
  });
});
