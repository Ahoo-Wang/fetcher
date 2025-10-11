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

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { KeyStorage, KeyStorageOptions } from '../src';
import { JsonSerializer } from '../src';

// Mock Storage
const mockStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};

// Mock BroadcastChannel
const mockBroadcastChannel = {
  postMessage: vi.fn(),
  close: vi.fn(),
  onmessage: null,
};

vi.stubGlobal(
  'BroadcastChannel',
  vi.fn(() => mockBroadcastChannel),
);
vi.stubGlobal('window', { localStorage: mockStorage });

describe('KeyStorage', () => {
  let keyStorage: KeyStorage<string>;
  let options: KeyStorageOptions<string>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.getItem.mockReturnValue(null);
    mockStorage.setItem.mockImplementation(() => {
    });
    mockStorage.removeItem.mockImplementation(() => {
    });
    mockBroadcastChannel.postMessage.mockImplementation(() => {
    });
    mockBroadcastChannel.close.mockImplementation(() => {
    });

    options = {
      key: 'testKey',
      serializer: new JsonSerializer(),
      storage: mockStorage as any,
    };
    keyStorage = new KeyStorage(options);
  });

  describe('constructor', () => {
    it('should initialize with provided options', () => {
      expect(keyStorage).toBeDefined();
    });

    it('should use default serializer if not provided', () => {
      const ks = new KeyStorage({ key: 'test' });
      expect(ks).toBeDefined();
    });

    it('should use default storage if not provided', () => {
      const ks = new KeyStorage({ key: 'test' });
      expect(ks).toBeDefined();
    });
  });

  describe('get', () => {
    it('should return null when no value in storage', () => {
      mockStorage.getItem.mockReturnValue(null);
      const result = keyStorage.get();
      expect(result).toBeNull();
      expect(mockStorage.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should deserialize and return value from storage', () => {
      const storedValue = JSON.stringify('test value');
      mockStorage.getItem.mockReturnValue(storedValue);
      const result = keyStorage.get();
      expect(result).toBe('test value');
      expect(mockStorage.getItem).toHaveBeenCalledWith('testKey');
    });

    it('should use cached value on subsequent calls', () => {
      const storedValue = JSON.stringify('cached value');
      mockStorage.getItem.mockReturnValue(storedValue);
      keyStorage.get(); // First call caches
      mockStorage.getItem.mockClear();
      const result = keyStorage.get(); // Second call uses cache
      expect(result).toBe('cached value');
      expect(mockStorage.getItem).not.toHaveBeenCalled();
    });
  });

  describe('set', () => {
    it('should serialize and store value', () => {
      keyStorage.set('new value');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'testKey',
        JSON.stringify('new value'),
      );
    });

    it('should update cache', () => {
      keyStorage.set('new value');
      mockStorage.getItem.mockClear();
      const result = keyStorage.get();
      expect(result).toBe('new value');
      expect(mockStorage.getItem).not.toHaveBeenCalled();
    });

    it('should emit event with new and old values', async () => {
      const listener = vi.fn();
      keyStorage.addListener({ name: 'test', handle: listener });
      keyStorage.set('new value');
      await vi.waitFor(() =>
        expect(listener).toHaveBeenCalledWith({
          newValue: 'new value',
          oldValue: null,
        }),
      );
    });
  });

  describe('remove', () => {
    it('should remove item from storage', () => {
      keyStorage.remove();
      expect(mockStorage.removeItem).toHaveBeenCalledWith('testKey');
    });

    it('should clear cache', () => {
      keyStorage.set('value');
      keyStorage.remove();
      mockStorage.getItem.mockReturnValue(null);
      const result = keyStorage.get();
      expect(result).toBeNull();
    });

    it('should emit event with old value', async () => {
      keyStorage.set('old value');
      const listener = vi.fn();
      keyStorage.addListener({ name: 'test', handle: listener });
      keyStorage.remove();
      await vi.waitFor(() =>
        expect(listener).toHaveBeenCalledWith({
          newValue: null,
          oldValue: 'old value',
        }),
      );
    });
  });

  describe('addListener', () => {
    it('should add listener and return remove function', () => {
      const listener = vi.fn();
      const remove = keyStorage.addListener({ name: 'test', handle: listener });
      expect(typeof remove).toBe('function');
      remove();
    });

    it('should call listener when event emitted', async () => {
      const listener = vi.fn();
      keyStorage.addListener({ name: 'test', handle: listener });
      keyStorage.set('value');
      await vi.waitFor(() => expect(listener).toHaveBeenCalled());
    });
  });
});
