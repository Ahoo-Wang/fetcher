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
import { DeviceIdStorage, DEFAULT_COSEC_DEVICE_ID_KEY } from '../src';

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

// Mock idGenerator
vi.mock('../src/idGenerator', () => ({
  idGenerator: {
    generateId: vi.fn(() => 'generated-device-id'),
  },
}));

describe('DeviceIdStorage', () => {
  let deviceIdStorage: DeviceIdStorage;

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

    deviceIdStorage = new DeviceIdStorage({
      key: DEFAULT_COSEC_DEVICE_ID_KEY,
      storage: mockStorage as any,
    });
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const defaultStorage = new DeviceIdStorage();
      expect(defaultStorage).toBeDefined();
    });

    it('should initialize with custom options', () => {
      const customStorage = new DeviceIdStorage({
        key: 'custom-key',
        storage: mockStorage as any,
      });
      expect(customStorage).toBeDefined();
    });
  });

  describe('generateDeviceId', () => {
    it('should generate a new device ID', () => {
      const deviceId = deviceIdStorage.generateDeviceId();
      expect(deviceId).toBe('generated-device-id');
    });
  });

  describe('getOrCreate', () => {
    it('should return existing device ID if available', () => {
      mockStorage.getItem.mockReturnValue('existing-device-id');
      const deviceId = deviceIdStorage.getOrCreate();
      expect(deviceId).toBe('existing-device-id');
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });

    it('should generate and store new device ID if none exists', () => {
      mockStorage.getItem.mockReturnValue(null);
      const deviceId = deviceIdStorage.getOrCreate();
      expect(deviceId).toBe('generated-device-id');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        DEFAULT_COSEC_DEVICE_ID_KEY,
        'generated-device-id',
      );
    });
  });

  describe('inherited KeyStorage methods', () => {
    it('should get device ID', () => {
      mockStorage.getItem.mockReturnValue('stored-device-id');
      const deviceId = deviceIdStorage.get();
      expect(deviceId).toBe('stored-device-id');
    });

    it('should set device ID', () => {
      deviceIdStorage.set('new-device-id');
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        DEFAULT_COSEC_DEVICE_ID_KEY,
        'new-device-id',
      );
    });

    it('should remove device ID', () => {
      deviceIdStorage.remove();
      expect(mockStorage.removeItem).toHaveBeenCalledWith(
        DEFAULT_COSEC_DEVICE_ID_KEY,
      );
    });

    it('should add listener', () => {
      const listener = vi.fn();
      const remove = deviceIdStorage.addListener({
        name: 'test',
        handle: listener,
      });
      expect(typeof remove).toBe('function');
      remove();
    });

    it('should destroy', () => {
      deviceIdStorage.destroy();
      // destroy removes the internal handler, but since it's mocked, just ensure no error
    });
  });
});
