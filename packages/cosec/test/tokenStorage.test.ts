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
import {
  CompositeToken,
  DEFAULT_COSEC_TOKEN_KEY,
  InMemoryListenableStorage,
  TokenStorage,
} from '../src';

describe('tokenStorage.ts', () => {
  describe('TokenStorage', () => {
    it('should create TokenStorage with default parameters', () => {
      const storage = new TokenStorage();
      expect(storage).toBeInstanceOf(TokenStorage);
    });

    it('should create TokenStorage with custom parameters', () => {
      const customKey = 'custom-token-key';
      const customStorage = new InMemoryListenableStorage();
      const storage = new TokenStorage(customKey, customStorage);

      expect(storage).toBeInstanceOf(TokenStorage);
    });

    it('should get null when no token is set', () => {
      const storage = new TokenStorage('test-key', new InMemoryListenableStorage());
      const result = storage.get();

      expect(result).toBeNull();
    });

    it('should set and get token', () => {
      const storage = new TokenStorage('test-key', new InMemoryListenableStorage());
      const token: CompositeToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      storage.set(token);
      const result = storage.get();

      expect(result).toEqual(token);
    });

    it('should clear stored token', () => {
      const storage = new TokenStorage('test-key', new InMemoryListenableStorage());
      const token: CompositeToken = {
        accessToken: 'test-access-token',
        refreshToken: 'test-refresh-token',
      };

      storage.set(token);
      storage.clear();
      const result = storage.get();

      expect(result).toBeNull();
    });

    it('should handle invalid JSON in storage', () => {
      const mockStorage = {
        getItem: vi.fn().mockReturnValue('invalid-json'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      } as unknown as Storage;

      const storage = new TokenStorage('test-key', mockStorage);
      const result = storage.get();

      expect(result).toBeNull();
    });

    it('should use default key when none provided', () => {
      const mockStorage = {
        getItem: vi.fn().mockReturnValue(null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      } as unknown as Storage;

      const storage = new TokenStorage(undefined, mockStorage);
      storage.get();

      expect(mockStorage.getItem).toHaveBeenCalledWith(DEFAULT_COSEC_TOKEN_KEY);
    });
  });
});
