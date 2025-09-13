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

import { idGenerator } from './idGenerator';
import { createListenableStorage, IdentitySerializer, KeyStorage } from '@ahoo-wang/fetcher-storage';

export const DEFAULT_COSEC_DEVICE_ID_KEY = 'cosec-device-id';

/**
 * Storage class for managing device identifiers.
 */
export class DeviceIdStorage extends KeyStorage<string> {
  constructor(key: string = DEFAULT_COSEC_DEVICE_ID_KEY) {
    super({
      key,
      serializer: new IdentitySerializer<string>(),
      storage: createListenableStorage(),
    });
  }

  /**
   * Generate a new device ID.
   *
   * @returns A newly generated device ID
   */
  generateDeviceId(): string {
    return idGenerator.generateId();
  }

  /**
   * Get or create a device ID.
   *
   * @returns The existing device ID if available, otherwise a newly generated one
   */
  getOrCreate(): string {
    // Try to get existing device ID from storage
    let deviceId = this.get();
    if (!deviceId) {
      // Generate a new device ID and store it
      deviceId = this.generateDeviceId();
      this.set(deviceId);
    }

    return deviceId;
  }

}

export const deviceIdStorage = new DeviceIdStorage();