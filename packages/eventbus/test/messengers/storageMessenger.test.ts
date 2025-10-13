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

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageMessenger } from '../../src';

describe('StorageMessenger', () => {
  let storageMock: Storage;
  let messenger: StorageMessenger;
  let receivedMessages: any[] = [];
  let eventHandler: any;

  beforeEach(() => {
    storageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
    } as any;
    let _length = 0;
    Object.defineProperty(storageMock, 'length', {
      get: () => _length,
      set: value => {
        _length = value;
      },
    });

    vi.useFakeTimers();
    vi.spyOn(global, 'setInterval');
    vi.spyOn(global, 'clearInterval');
    vi.spyOn(global, 'addEventListener').mockImplementation(
      (event, handler) => {
        if (event === 'storage') eventHandler = handler;
      },
    );
    vi.spyOn(global, 'removeEventListener');

    messenger = new StorageMessenger({
      channelName: 'test-channel',
      storage: storageMock,
      ttl: 1000,
      cleanupInterval: 500,
    });

    messenger.onmessage = message => receivedMessages.push(message);
  });

  afterEach(() => {
    messenger.close();
    receivedMessages = [];
    vi.restoreAllMocks();
  });

  it('should generate unique keys', () => {
    messenger.postMessage('msg1');
    messenger.postMessage('msg2');

    expect(storageMock.setItem).toHaveBeenCalledTimes(2);
    const calls = (storageMock.setItem as any).mock.calls;
    const key1 = calls[0][0];
    const key2 = calls[1][0];
    expect(key1).not.toBe(key2);
    expect(key1.startsWith('_storage_msg_test-channel_')).toBe(true);
  });

  it('should clean up expired messages', () => {
    (storageMock as any).length = 1;
    (storageMock.key as any).mockReturnValue(
      '_storage_msg_test-channel_expired',
    );
    (storageMock.getItem as any).mockReturnValue(
      JSON.stringify({
        data: 'expired',
        timestamp: Date.now() - 2000,
      }),
    );

    vi.advanceTimersByTime(500);

    expect(storageMock.removeItem).toHaveBeenCalledWith(
      '_storage_msg_test-channel_expired',
    );
  });

  it('should close and clean up resources', () => {
    messenger.close();

    expect(global.clearInterval).toHaveBeenCalled();
    expect(global.removeEventListener).toHaveBeenCalledWith(
      'storage',
      expect.any(Function),
    );
  });

  it('should handle storage events correctly', () => {
    const testMessage = 'test';

    // Valid event
    const validEvent = {
      storageArea: storageMock,
      key: '_storage_msg_test-channel_123',
      newValue: JSON.stringify({ data: testMessage, timestamp: Date.now() }),
    };
    eventHandler(validEvent);
    expect(receivedMessages).toContain(testMessage);

    // Invalid storageArea
    const invalidStorageEvent = {
      storageArea: { getItem: vi.fn() },
      key: '_storage_msg_test-channel_123',
      newValue: JSON.stringify({ data: 'invalid', timestamp: Date.now() }),
    };
    eventHandler(invalidStorageEvent);
    expect(receivedMessages).toHaveLength(1); // No new message

    // Key not starting with prefix
    const invalidKeyEvent = {
      storageArea: storageMock,
      key: 'other_key',
      newValue: JSON.stringify({ data: 'invalid', timestamp: Date.now() }),
    };
    eventHandler(invalidKeyEvent);
    expect(receivedMessages).toHaveLength(1);

    // No newValue
    const noNewValueEvent = {
      storageArea: storageMock,
      key: '_storage_msg_test-channel_123',
      newValue: null,
    };
    eventHandler(noNewValueEvent);
    expect(receivedMessages).toHaveLength(1);
  });

  it('should handle invalid JSON in storage event', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const invalidJsonEvent = {
      storageArea: storageMock,
      key: '_storage_msg_test-channel_123',
      newValue: 'invalid json',
    };
    eventHandler(invalidJsonEvent);

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to parse storage message:',
      expect.any(SyntaxError),
    );
    consoleWarnSpy.mockRestore();
  });

  it('should handle invalid data in cleanup', () => {
    (storageMock as any).length = 1;
    (storageMock.key as any).mockReturnValue(
      '_storage_msg_test-channel_invalid',
    );
    (storageMock.getItem as any).mockReturnValue('invalid json');

    vi.advanceTimersByTime(500);

    expect(storageMock.removeItem).toHaveBeenCalledWith(
      '_storage_msg_test-channel_invalid',
    );
  });
});
