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

import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryStorage } from '../src';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  describe('length', () => {
    it('should return 0 for empty storage', () => {
      expect(storage.length).toBe(0);
    });

    it('should return correct length after adding items', () => {
      storage.setItem('key1', 'value1');
      expect(storage.length).toBe(1);
      storage.setItem('key2', 'value2');
      expect(storage.length).toBe(2);
    });

    it('should return correct length after removing items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      storage.removeItem('key1');
      expect(storage.length).toBe(1);
    });
  });

  describe('clear', () => {
    it('should remove all items', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      expect(storage.length).toBe(2);
      storage.clear();
      expect(storage.length).toBe(0);
      expect(storage.getItem('key1')).toBeNull();
      expect(storage.getItem('key2')).toBeNull();
    });
  });

  describe('getItem', () => {
    it('should return null for non-existent key', () => {
      expect(storage.getItem('nonexistent')).toBeNull();
    });

    it('should return the value for existing key', () => {
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
    });

    it('should return null after removing item', () => {
      storage.setItem('key1', 'value1');
      storage.removeItem('key1');
      expect(storage.getItem('key1')).toBeNull();
    });
  });

  describe('key', () => {
    it('should return null for out of bounds index', () => {
      expect(storage.key(0)).toBeNull();
      storage.setItem('key1', 'value1');
      expect(storage.key(1)).toBeNull();
    });

    it('should return the key at the specified index', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key2', 'value2');
      const keys = [storage.key(0), storage.key(1)];
      expect(keys).toContain('key1');
      expect(keys).toContain('key2');
    });
  });

  describe('removeItem', () => {
    it('should not throw error when removing non-existent key', () => {
      expect(() => storage.removeItem('nonexistent')).not.toThrow();
    });

    it('should remove existing item', () => {
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
      storage.removeItem('key1');
      expect(storage.getItem('key1')).toBeNull();
    });
  });

  describe('setItem', () => {
    it('should store the value', () => {
      storage.setItem('key1', 'value1');
      expect(storage.getItem('key1')).toBe('value1');
    });

    it('should overwrite existing value', () => {
      storage.setItem('key1', 'value1');
      storage.setItem('key1', 'newValue');
      expect(storage.getItem('key1')).toBe('newValue');
    });

    it('should handle empty string values', () => {
      storage.setItem('key1', '');
      expect(storage.getItem('key1')).toBe('');
    });
  });

  describe('Storage interface compliance', () => {
    it('should implement all Storage interface methods', () => {
      expect(typeof storage.length).toBe('number');
      expect(typeof storage.clear).toBe('function');
      expect(typeof storage.getItem).toBe('function');
      expect(typeof storage.key).toBe('function');
      expect(typeof storage.removeItem).toBe('function');
      expect(typeof storage.setItem).toBe('function');
    });
  });
});
