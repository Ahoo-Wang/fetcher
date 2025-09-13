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

import { describe, expect, it } from 'vitest';
import { deviceIdStorage, DeviceIdStorage } from '../src';

describe('deviceIdStorage.ts', () => {
  describe('DeviceIdStorage', () => {
    it('should create DeviceIdStorage with default parameters', () => {
      expect(deviceIdStorage).toBeInstanceOf(DeviceIdStorage);
    });

    it('should create DeviceIdStorage with custom parameters', () => {
      const customKey = 'custom-device-id-key';
      const storage = new DeviceIdStorage(customKey);

      expect(storage).toBeInstanceOf(DeviceIdStorage);
    });

    it('should get null when no device ID is set', () => {
      const storage = new DeviceIdStorage('test-key');
      const result = storage.get();

      expect(result).toBeNull();
    });

    it('should set and get device ID', () => {
      const storage = new DeviceIdStorage('test-key');
      const deviceId = 'test-device-id';

      storage.set(deviceId);
      const result = storage.get();

      expect(result).toBe(deviceId);
    });

    it('should generate device ID', () => {
      const storage = new DeviceIdStorage('test-key');
      const deviceId = storage.generateDeviceId();

      expect(deviceId).toBeDefined();
      expect(typeof deviceId).toBe('string');
      expect(deviceId.length).toBeGreaterThan(0);
    });

    it('should get existing device ID when available', () => {
      const storage = new DeviceIdStorage('test-key');
      const deviceId = 'existing-device-id';

      storage.set(deviceId);
      const result = storage.getOrCreate();

      expect(result).toBe(deviceId);
    });

    it('should generate and store new device ID when none exists', () => {
      const storage = new DeviceIdStorage('test-key');
      const result = storage.getOrCreate();

      expect(result).toBeDefined();
      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(0);

      // Verify it's stored
      const stored = storage.get();
      expect(stored).toBe(result);
    });

    it('should remove stored device ID', () => {
      const storage = new DeviceIdStorage('test-key');
      const deviceId = 'test-device-id';

      storage.set(deviceId);
      storage.remove();
      const result = storage.get();

      expect(result).toBeNull();
    });
  });
});
