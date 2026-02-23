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
  window?: Record<string, unknown>;
  StorageEvent?: new (type: string, eventInitDict?: StorageEventInit) => StorageEvent;
  localStorage?: Record<string, unknown>;
  sessionStorage?: Record<string, unknown>;
};

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
    originalBroadcastChannel = globalThis.BroadcastChannel;
  });

  afterEach(() => {
    globalThis.BroadcastChannel = originalBroadcastChannel;
  });

  describe('isBroadcastChannelSupported', () => {
    it('should return true when BroadcastChannel is supported', () => {
      const MockBroadcastChannel = vi.fn();
      MockBroadcastChannel.prototype = { postMessage: vi.fn() };
      globalThis.BroadcastChannel = MockBroadcastChannel;
      expect(isBroadcastChannelSupported()).toBe(true);
    });

    it('should return false when BroadcastChannel is not available', () => {
      delete globalThis.BroadcastChannel;
      expect(isBroadcastChannelSupported()).toBe(false);
    });

    it('should return false when BroadcastChannel.prototype.postMessage is not available', () => {
      const MockBroadcastChannel = function () {};
      MockBroadcastChannel.prototype = {};
      (globalThis as Record<string, unknown>).BroadcastChannel = MockBroadcastChannel;
      expect(isBroadcastChannelSupported()).toBe(false);
    });
  });

  describe('isStorageEventSupported', () => {
    let originalWindow: any;
    let originalStorageEvent: any;
    let originalLocalStorage: any;

    beforeEach(() => {
      originalWindow = globalThis.window;
      originalStorageEvent = globalThis.StorageEvent;
      originalLocalStorage = globalThis.localStorage;
    });

    afterEach(() => {
      globalThis.window = originalWindow;
      globalThis.StorageEvent = originalStorageEvent;
      globalThis.localStorage = originalLocalStorage;
    });

    it('should return true when all StorageEvent requirements are met', () => {
      (globalThis as Record<string, unknown>).window = { addEventListener: vi.fn() };
      (globalThis as Record<string, unknown>).StorageEvent = function () {};
      (globalThis as Record<string, unknown>).localStorage = {};
      expect(isStorageEventSupported()).toBe(true);
    });

    it('should return false when window is not available', () => {
      delete (globalThis as Record<string, unknown>).window;
      expect(isStorageEventSupported()).toBe(false);
    });

    it('should return false when StorageEvent is not available', () => {
      (globalThis as Record<string, unknown>).window = { addEventListener: vi.fn() };
      delete (globalThis as Record<string, unknown>).StorageEvent;
      (globalThis as Record<string, unknown>).localStorage = {};
      expect(isStorageEventSupported()).toBe(false);
    });

    it('should return false when addEventListener is not available', () => {
      (globalThis as Record<string, unknown>).window = {};
      (globalThis as Record<string, unknown>).StorageEvent = function () {};
      (globalThis as Record<string, unknown>).localStorage = {};
      expect(isStorageEventSupported()).toBe(false);
    });

    it('should return false when neither localStorage nor sessionStorage is available', () => {
      (globalThis as Record<string, unknown>).window = { addEventListener: vi.fn() };
      (globalThis as Record<string, unknown>).StorageEvent = function () {};
      delete (globalThis as Record<string, unknown>).localStorage;
      delete (globalThis as Record<string, unknown>).sessionStorage;
      expect(isStorageEventSupported()).toBe(false);
    });

    it('should return true when sessionStorage is available but localStorage is not', () => {
      (globalThis as Record<string, unknown>).window = { addEventListener: vi.fn() };
      (globalThis as Record<string, unknown>).StorageEvent = function () {};
      delete (globalThis as Record<string, unknown>).localStorage;
      (globalThis as Record<string, unknown>).sessionStorage = {};
      expect(isStorageEventSupported()).toBe(true);
    });
  });

  describe('createCrossTabMessenger', () => {
    it('should return BroadcastChannelMessenger when supported', () => {
      class MockBroadcastChannel {
        postMessage = vi.fn();
        close = vi.fn();
        onmessage = null;
        constructor(public name: string) {}
      }
      globalThis.BroadcastChannel = MockBroadcastChannel;

      const messenger = createCrossTabMessenger('test-channel');
      expect(messenger).toBeDefined();
      expect(messenger).toHaveProperty('postMessage');
      expect(messenger).toHaveProperty('onmessage');
      expect(messenger).toHaveProperty('close');
    });

    it('should return StorageMessenger when BroadcastChannel is not supported but StorageEvent is', () => {
      delete globalThis.BroadcastChannel;

      const messenger = createCrossTabMessenger('test-channel');
      expect(messenger).toBeDefined();
      expect(messenger).toBeInstanceOf(StorageMessenger);
    });

    it('should return undefined when neither BroadcastChannel nor StorageEvent is supported', () => {
      delete globalThis.BroadcastChannel;
      delete globalThis.window;
      delete globalThis.StorageEvent;
      delete globalThis.localStorage;
      delete globalThis.sessionStorage;

      const messenger = createCrossTabMessenger('test-channel');
      expect(messenger).toBeUndefined();
    });
  });
});
