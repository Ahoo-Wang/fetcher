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
import { TokenStorage, DEFAULT_COSEC_TOKEN_KEY } from '../src';
import { JwtCompositeToken } from '../src';

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

// Mock BroadcastTypedEventBus and SerialTypedEventBus
vi.mock('@ahoo-wang/fetcher-eventbus', () => ({
  BroadcastTypedEventBus: vi.fn().mockImplementation(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  })),
  SerialTypedEventBus: vi.fn().mockImplementation(() => ({
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    destroy: vi.fn(),
  })),
  nameGenerator: {
    generate: vi.fn((prefix: string) => `${prefix}_1`),
  },
}));

// Mock JwtCompositeToken
vi.mock('../src/jwtToken', () => ({
  JwtCompositeToken: vi.fn().mockImplementation(token => ({
    token,
    isRefreshNeeded: vi.fn(() => false),
    isRefreshable: vi.fn(() => true),
  })),
  JwtCompositeTokenSerializer: vi.fn().mockImplementation(() => ({
    serialize: vi.fn(value => JSON.stringify(value.token)),
    deserialize: vi.fn(value => {
      const token = JSON.parse(value);
      return {
        token,
        isRefreshNeeded: vi.fn(() => false),
        isRefreshable: vi.fn(() => true),
      };
    }),
  })),
}));

describe('TokenStorage', () => {
  let tokenStorage: TokenStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    mockStorage.getItem.mockReturnValue(null);
    mockStorage.setItem.mockImplementation(() => {});
    mockStorage.removeItem.mockImplementation(() => {});
    mockBroadcastChannel.postMessage.mockImplementation(() => {});
    mockBroadcastChannel.close.mockImplementation(() => {});

    tokenStorage = new TokenStorage({
      key: DEFAULT_COSEC_TOKEN_KEY,
      storage: mockStorage as any,
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      // Mock eventBus for test environment
      const mockEventBus = {
        emit: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        destroy: vi.fn(),
      };
      const defaultStorage = new TokenStorage({
        key: 'test-token',
        eventBus: mockEventBus as any,
      });
      expect(defaultStorage).toBeDefined();
      expect(defaultStorage.earlyPeriod).toBe(0);
    });

    it('should initialize with custom options', () => {
      const customStorage = new TokenStorage({
        key: 'custom-key',
        earlyPeriod: 300,
        storage: mockStorage as any,
      });
      expect(customStorage).toBeDefined();
      expect(customStorage.earlyPeriod).toBe(300);
    });
  });

  describe('setCompositeToken', () => {
    it('should set composite token', () => {
      const compositeToken = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      tokenStorage.setCompositeToken(compositeToken);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        DEFAULT_COSEC_TOKEN_KEY,
        JSON.stringify(compositeToken),
      );
    });
  });

  describe('inherited KeyStorage methods', () => {
    it('should get token', () => {
      const storedToken = {
        accessToken: 'stored-access',
        refreshToken: 'stored-refresh',
      };
      mockStorage.getItem.mockReturnValue(JSON.stringify(storedToken));
      const token = tokenStorage.get();
      expect(token).toBeDefined();
      expect(token?.token).toEqual(storedToken);
    });

    it('should set token', () => {
      const jwtToken = {
        token: { accessToken: 'access', refreshToken: 'refresh' },
        isRefreshNeeded: vi.fn(),
        isRefreshable: vi.fn(),
      };
      tokenStorage.set(jwtToken as any);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        DEFAULT_COSEC_TOKEN_KEY,
        JSON.stringify(jwtToken.token),
      );
    });

    it('should set token', () => {
      const jwtToken = new JwtCompositeToken({
        accessToken: 'access',
        refreshToken: 'refresh',
      });
      tokenStorage.set(jwtToken);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        DEFAULT_COSEC_TOKEN_KEY,
        JSON.stringify(jwtToken.token),
      );
    });

    it('should remove token', () => {
      tokenStorage.remove();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        DEFAULT_COSEC_TOKEN_KEY,
      );
    });

    it('should add listener', () => {
      const listener = vi.fn();
      const remove = tokenStorage.addListener({
        name: 'test',
        handle: listener,
      });
      expect(typeof remove).toBe('function');
      remove();
    });

    it('should destroy', () => {
      tokenStorage.destroy();
      // destroy removes the internal handler
    });
  });
});
