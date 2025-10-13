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
import {
  isBroadcastChannelSupported,
  isStorageEventSupported,
  createCrossTabMessenger,
} from '../../src';
import { StorageMessenger } from '../../src';

describe('CrossTabMessenger utilities', () => {
  let originalBroadcastChannel: any;

  beforeEach(() => {
    originalBroadcastChannel = (global as any).BroadcastChannel;
  });

  afterEach(() => {
    (global as any).BroadcastChannel = originalBroadcastChannel;
  });

  describe('isBroadcastChannelSupported', () => {
    it('should return true when BroadcastChannel is supported', () => {
      const MockBroadcastChannel = vi.fn();
      MockBroadcastChannel.prototype = { postMessage: vi.fn() };
      (global as any).BroadcastChannel = MockBroadcastChannel;
      expect(isBroadcastChannelSupported()).toBe(true);
    });

    it('should return false when BroadcastChannel is not available', () => {
      delete (global as any).BroadcastChannel;
      expect(isBroadcastChannelSupported()).toBe(false);
    });

    it('should return false when BroadcastChannel.prototype.postMessage is not available', () => {
      (global as any).BroadcastChannel = function () {};
      delete (global as any).BroadcastChannel.prototype.postMessage;
      expect(isBroadcastChannelSupported()).toBe(false);
    });
  });

  describe('isStorageEventSupported', () => {
    let originalWindow: any;
    let originalStorageEvent: any;
    let originalLocalStorage: any;

    beforeEach(() => {
      originalWindow = (global as any).window;
      originalStorageEvent = (global as any).StorageEvent;
      originalLocalStorage = (global as any).localStorage;
    });

    afterEach(() => {
      (global as any).window = originalWindow;
      (global as any).StorageEvent = originalStorageEvent;
      (global as any).localStorage = originalLocalStorage;
    });

    it('should return true when all StorageEvent requirements are met', () => {
      (global as any).window = { addEventListener: vi.fn() };
      (global as any).StorageEvent = function () {};
      (global as any).localStorage = {};
      expect(isStorageEventSupported()).toBe(true);
    });

    it('should return false when window is not available', () => {
      delete (global as any).window;
      expect(isStorageEventSupported()).toBe(false);
    });

    it('should return false when StorageEvent is not available', () => {
      (global as any).window = { addEventListener: vi.fn() };
      delete (global as any).StorageEvent;
      (global as any).localStorage = {};
      expect(isStorageEventSupported()).toBe(false);
    });

    it('should return false when addEventListener is not available', () => {
      (global as any).window = {};
      (global as any).StorageEvent = function () {};
      (global as any).localStorage = {};
      expect(isStorageEventSupported()).toBe(false);
    });

    it('should return false when neither localStorage nor sessionStorage is available', () => {
      (global as any).window = { addEventListener: vi.fn() };
      (global as any).StorageEvent = function () {};
      delete (global as any).localStorage;
      delete (global as any).sessionStorage;
      expect(isStorageEventSupported()).toBe(false);
    });

    it('should return true when sessionStorage is available but localStorage is not', () => {
      (global as any).window = { addEventListener: vi.fn() };
      (global as any).StorageEvent = function () {};
      delete (global as any).localStorage;
      (global as any).sessionStorage = {};
      expect(isStorageEventSupported()).toBe(true);
    });
  });

  describe('createCrossTabMessenger', () => {
    it('should return BroadcastChannelMessenger when supported', () => {
      const mockBroadcastChannel = {
        postMessage: vi.fn(),
        close: vi.fn(),
        onmessage: null,
      };
      const MockBroadcastChannel = vi.fn(() => mockBroadcastChannel);
      MockBroadcastChannel.prototype = { postMessage: vi.fn() };
      (global as any).BroadcastChannel = MockBroadcastChannel;

      const messenger = createCrossTabMessenger('test-channel');
      expect(messenger).toBeDefined();
      expect(messenger).toHaveProperty('postMessage');
      expect(messenger).toHaveProperty('onmessage');
      expect(messenger).toHaveProperty('close');
    });

    it('should return StorageMessenger when BroadcastChannel is not supported but StorageEvent is', () => {
      delete (global as any).BroadcastChannel;
      // StorageEvent support is mocked in the test environment

      const messenger = createCrossTabMessenger('test-channel');
      expect(messenger).toBeDefined();
      expect(messenger).toBeInstanceOf(StorageMessenger);
    });

    it('should return undefined when neither BroadcastChannel nor StorageEvent is supported', () => {
      delete (global as any).BroadcastChannel;
      delete (global as any).window;
      delete (global as any).StorageEvent;
      delete (global as any).localStorage;
      delete (global as any).sessionStorage;

      const messenger = createCrossTabMessenger('test-channel');
      expect(messenger).toBeUndefined();
    });
  });
});
