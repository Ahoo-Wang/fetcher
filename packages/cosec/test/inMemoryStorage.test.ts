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

import { describe, expect, it, vi } from 'vitest';
import { getStorage, InMemoryStorage } from '../src';

describe('inMemoryStorage.ts', () => {
  describe('InMemoryStorage', () => {
    it('should create InMemoryStorage instance', () => {
      const storage = new InMemoryStorage();
      expect(storage).toBeInstanceOf(InMemoryStorage);
    });

    it('should implement Storage interface', () => {
      const storage: Storage = new InMemoryStorage();
      expect(storage.length).toBeDefined();
      expect(storage.clear).toBeDefined();
      expect(storage.getItem).toBeDefined();
      expect(storage.key).toBeDefined();
      expect(storage.removeItem).toBeDefined();
      expect(storage.setItem).toBeDefined();
    });

    it('should set and get items', () => {
      const storage = new InMemoryStorage();
      const key = 'test-key';
      const value = 'test-value';

      storage.setItem(key, value);
      const result = storage.getItem(key);

      expect(result).toBe(value);
    });

    it('should return null for non-existent items', () => {
      const storage = new InMemoryStorage();
      const result = storage.getItem('non-existent-key');

      expect(result).toBeNull();
    });

    it('should remove items', () => {
      const storage = new InMemoryStorage();
      const key = 'test-key';
      const value = 'test-value';

      storage.setItem(key, value);
      storage.removeItem(key);
      const result = storage.getItem(key);

      expect(result).toBeNull();
    });

    it('should not throw error when removing non-existent items', () => {
      const storage = new InMemoryStorage();
      expect(() => storage.removeItem('non-existent-key')).not.toThrow();
    });

    it('should clear all items', () => {
      const storage = new InMemoryStorage();
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');

      storage.clear();

      expect(storage.length).toBe(0);
      expect(storage.getItem('key1')).toBeNull();
      expect(storage.getItem('key2')).toBeNull();
    });

    it('should return correct length', () => {
      const storage = new InMemoryStorage();
      expect(storage.length).toBe(0);

      storage.setItem('key1', 'value1');
      expect(storage.length).toBe(1);

      storage.setItem('key2', 'value2');
      expect(storage.length).toBe(2);

      storage.removeItem('key1');
      expect(storage.length).toBe(1);

      storage.clear();
      expect(storage.length).toBe(0);
    });

    it('should return keys by index', () => {
      const storage = new InMemoryStorage();
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');

      const key1 = storage.key(0);
      const key2 = storage.key(1);
      const key3 = storage.key(2);

      expect(key1).toBe('key1');
      expect(key2).toBe('key2');
      expect(key3).toBeNull();
    });

    it('should return null for invalid index', () => {
      const storage = new InMemoryStorage();
      storage.setItem('key1', 'value1');

      const result = storage.key(-1);
      expect(result).toBeNull();

      const result2 = storage.key(10);
      expect(result2).toBeNull();
    });
  });

  describe('getStorage', () => {
    it('should return InMemoryStorage when localStorage is not available', () => {
      // In Node.js environment, window.localStorage is not available
      const storage = getStorage();
      expect(storage).toBeInstanceOf(InMemoryStorage);
    });

    it('should return window.localStorage when available', () => {
      // Mock window.localStorage
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
        key: vi.fn(),
        length: 0,
      };

      // Temporarily set window.localStorage
      const originalWindow = (globalThis as any).window;
      (globalThis as any).window = {
        localStorage: mockLocalStorage,
      };

      try {
        const storage = getStorage();
        expect(storage).toBe(mockLocalStorage);
      } finally {
        // Restore original window
        (globalThis as any).window = originalWindow;
      }
    });
  });
});
