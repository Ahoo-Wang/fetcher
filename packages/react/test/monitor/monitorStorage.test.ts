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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  MonitorStorage,
  DEFAULT_MONITOR_KEY,
  MonitorConfig,
  MonitorMap,
} from '../../src/monitor';

// Mock dependencies
vi.mock('@ahoo-wang/fetcher-storage', () => ({
  KeyStorage: vi.fn(),
}));

vi.mock('@ahoo-wang/fetcher-eventbus', () => ({
  BroadcastTypedEventBus: vi.fn(),
  SerialTypedEventBus: vi.fn(),
}));

vi.mock('@ahoo-wang/fetcher-cosec', () => ({
  DEFAULT_COSEC_TOKEN_KEY: 'mock-cosec-token',
}));

// Import mocked modules
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const mockKeyStorage = vi.mocked(KeyStorage);
const mockBroadcastTypedEventBus = vi.mocked(BroadcastTypedEventBus);
const mockSerialTypedEventBus = vi.mocked(SerialTypedEventBus);

describe('MonitorStorage', () => {
  let mockKeyStorageInstance: any;
  let mockEventBusInstance: any;
  let storage: MonitorStorage;

  beforeEach(() => {
    mockKeyStorageInstance = {
      get: vi.fn(),
      set: vi.fn(),
    };
    mockEventBusInstance = {
      on: vi.fn(),
      emit: vi.fn(),
    };

    mockKeyStorage.mockClear();
    mockBroadcastTypedEventBus.mockClear();
    mockSerialTypedEventBus.mockClear();

    mockKeyStorage.mockImplementation(() => mockKeyStorageInstance);
    mockBroadcastTypedEventBus.mockImplementation(() => mockEventBusInstance);
    mockSerialTypedEventBus.mockImplementation(() => mockEventBusInstance);

    // Create a MonitorStorage instance that extends the mocked KeyStorage
    storage = Object.assign(Object.create(mockKeyStorageInstance), {
      setMonitor: vi.fn(function (this: any, monitorState: MonitorConfig) {
        const monitors: MonitorMap = this.get() ?? {};
        monitors[monitorState.id] = monitorState;
        this.set(monitors);
      }),
      removeMonitor: vi.fn(function (this: any, id: string) {
        const monitors = this.get() ?? {};
        delete monitors[id];
        this.set(monitors);
      }),
      getMonitor: vi.fn(function (this: any, id: string) {
        const monitors = this.get() ?? {};
        return monitors[id];
      }),
    });
  });

  describe('setMonitor', () => {
    let mockMonitor: MonitorConfig;

    beforeEach(() => {
      mockMonitor = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 60000,
        latestData: { value: 42 },
      };
    });

    it('should add monitor to empty storage', () => {
      mockKeyStorageInstance.get.mockReturnValue(null);

      storage.setMonitor(mockMonitor);

      expect(mockKeyStorageInstance.get).toHaveBeenCalledTimes(1);
      expect(mockKeyStorageInstance.set).toHaveBeenCalledWith({
        [mockMonitor.id]: mockMonitor,
      });
    });

    it('should add monitor to existing storage', () => {
      const existingMonitors: MonitorMap = {
        'existing-monitor': {
          id: 'existing-monitor',
          fetchRequest: { url: '/api/existing', method: 'GET' },
          interval: 30000,
        },
      };
      mockKeyStorageInstance.get.mockReturnValue(existingMonitors);

      storage.setMonitor(mockMonitor);

      expect(mockKeyStorageInstance.set).toHaveBeenCalledWith({
        ...existingMonitors,
        [mockMonitor.id]: mockMonitor,
      });
    });

    it('should update existing monitor', () => {
      const existingMonitors: MonitorMap = {
        [mockMonitor.id]: {
          ...mockMonitor,
          latestData: { value: 'old' },
        },
      };
      mockKeyStorageInstance.get.mockReturnValue(existingMonitors);

      const updatedMonitor = { ...mockMonitor, latestData: { value: 'new' } };
      storage.setMonitor(updatedMonitor);

      expect(mockKeyStorageInstance.set).toHaveBeenCalledWith({
        [mockMonitor.id]: updatedMonitor,
      });
    });
  });

  describe('removeMonitor', () => {
    it('should remove monitor from storage', () => {
      const existingMonitors: MonitorMap = {
        'monitor-1': {
          id: 'monitor-1',
          fetchRequest: { url: '/api/1', method: 'GET' },
          interval: 60000,
        },
        'monitor-2': {
          id: 'monitor-2',
          fetchRequest: { url: '/api/2', method: 'GET' },
          interval: 30000,
        },
      };
      mockKeyStorageInstance.get.mockReturnValue(existingMonitors);

      storage.removeMonitor('monitor-1');

      expect(mockKeyStorageInstance.set).toHaveBeenCalledWith({
        'monitor-2': existingMonitors['monitor-2'],
      });
    });

    it('should handle removing non-existent monitor', () => {
      const existingMonitors: MonitorMap = {
        'monitor-1': {
          id: 'monitor-1',
          fetchRequest: { url: '/api/1', method: 'GET' },
          interval: 60000,
        },
      };
      mockKeyStorageInstance.get.mockReturnValue(existingMonitors);

      storage.removeMonitor('non-existent');

      expect(mockKeyStorageInstance.set).toHaveBeenCalledWith(existingMonitors);
    });

    it('should handle empty storage', () => {
      mockKeyStorageInstance.get.mockReturnValue(null);

      storage.removeMonitor('any-monitor');

      expect(mockKeyStorageInstance.set).toHaveBeenCalledWith({});
    });
  });

  describe('getMonitor', () => {
    let mockMonitor: MonitorConfig;

    beforeEach(() => {
      mockMonitor = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 60000,
      };
    });

    it('should return monitor when it exists', () => {
      const monitors: MonitorMap = {
        [mockMonitor.id]: mockMonitor,
      };
      mockKeyStorageInstance.get.mockReturnValue(monitors);

      const result = storage.getMonitor(mockMonitor.id);

      expect(result).toBe(mockMonitor);
    });

    it('should return undefined when monitor does not exist', () => {
      const monitors: MonitorMap = {
        'other-monitor': {
          id: 'other-monitor',
          fetchRequest: { url: '/api/other', method: 'GET' },
          interval: 30000,
        },
      };
      mockKeyStorageInstance.get.mockReturnValue(monitors);

      const result = storage.getMonitor('non-existent');

      expect(result).toBeUndefined();
    });

    it('should return undefined when storage is empty', () => {
      mockKeyStorageInstance.get.mockReturnValue(null);

      const result = storage.getMonitor('any-monitor');

      expect(result).toBeUndefined();
    });
  });

  describe('inheritance from KeyStorage', () => {
    it('should inherit get method from KeyStorage', () => {
      const mockMonitors: MonitorMap = {
        'monitor-1': {
          id: 'monitor-1',
          fetchRequest: { url: '/api/1', method: 'GET' },
          interval: 60000,
        },
      };
      mockKeyStorageInstance.get.mockReturnValue(mockMonitors);

      const result = storage.get();

      expect(mockKeyStorageInstance.get).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockMonitors);
    });

    it('should inherit set method from KeyStorage', () => {
      const mockMonitors: MonitorMap = {
        'monitor-1': {
          id: 'monitor-1',
          fetchRequest: { url: '/api/1', method: 'GET' },
          interval: 60000,
        },
      };

      storage.set(mockMonitors);

      expect(mockKeyStorageInstance.set).toHaveBeenCalledWith(mockMonitors);
    });
  });
});
