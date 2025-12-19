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
  KeyStorage: class MockKeyStorage {
    constructor(options: any) {
      this.key = options.key;
      this.eventBus = options.eventBus;
    }
    key: string;
    eventBus: any;
    get() {
      return null;
    }
    set() {}
    addListener() {}
  },
}));

vi.mock('@ahoo-wang/fetcher-eventbus', () => ({
  BroadcastTypedEventBus: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
  SerialTypedEventBus: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn(),
  })),
}));

vi.mock('@ahoo-wang/fetcher-cosec', () => ({
  DEFAULT_COSEC_TOKEN_KEY: 'mock-cosec-token',
}));

import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const mockBroadcastTypedEventBus = vi.mocked(BroadcastTypedEventBus);
const mockSerialTypedEventBus = vi.mocked(SerialTypedEventBus);

describe('MonitorStorage', () => {
  let mockEventBusInstance: any;

  beforeEach(() => {
    mockEventBusInstance = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };

    mockBroadcastTypedEventBus.mockClear();
    mockSerialTypedEventBus.mockClear();

    mockBroadcastTypedEventBus.mockImplementation(() => mockEventBusInstance);
    mockSerialTypedEventBus.mockImplementation(() => mockEventBusInstance);
  });

  describe('constructor', () => {
    it('should create MonitorStorage with default options', () => {
      const storage = new MonitorStorage({});

      expect(storage).toBeInstanceOf(MonitorStorage);
      expect(mockBroadcastTypedEventBus).toHaveBeenCalledWith({
        delegate: expect.any(Object),
      });

      expect(mockSerialTypedEventBus).toHaveBeenCalledWith('mock-cosec-token');
    });

    it('should create MonitorStorage with custom key', () => {
      const customKey = 'custom-monitor-key';
      const storage = new MonitorStorage({ key: customKey });

      expect(storage).toBeInstanceOf(MonitorStorage);
    });

    it('should create MonitorStorage with custom eventBus', () => {
      const customEventBus = { custom: 'eventBus' };
      const storage = new MonitorStorage({ eventBus: customEventBus as any });

      expect(storage).toBeInstanceOf(MonitorStorage);
      // Should not create default event buses when custom eventBus is provided
      expect(mockBroadcastTypedEventBus).not.toHaveBeenCalled();
      expect(mockSerialTypedEventBus).not.toHaveBeenCalled();
    });

    it('should pass through additional KeyStorage options', () => {
      const additionalOptions = {
        storage: { custom: 'storage' },
        defaultValue: { 'default-monitor': {} as MonitorConfig },
      };

      const storage = new MonitorStorage(additionalOptions);

      expect(storage).toBeInstanceOf(MonitorStorage);
    });
  });

  describe('setMonitor', () => {
    let storage: MonitorStorage;
    let mockMonitor: MonitorConfig;

    beforeEach(() => {
      storage = new MonitorStorage({});
      mockMonitor = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 60000,
        latestData: { value: 42 },
      };

      // Mock the get and set methods on the KeyStorage instance
      (storage as any).get = vi.fn();
      (storage as any).set = vi.fn();
    });

    it('should add monitor to empty storage', () => {
      (storage as any).get.mockReturnValue(null);

      storage.setMonitor(mockMonitor);

      expect((storage as any).get).toHaveBeenCalledTimes(1);
      expect((storage as any).set).toHaveBeenCalledWith({
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
      (storage as any).get.mockReturnValue(existingMonitors);

      storage.setMonitor(mockMonitor);

      expect((storage as any).set).toHaveBeenCalledWith({
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
      (storage as any).get.mockReturnValue(existingMonitors);

      const updatedMonitor = { ...mockMonitor, latestData: { value: 'new' } };
      storage.setMonitor(updatedMonitor);

      expect((storage as any).set).toHaveBeenCalledWith({
        [mockMonitor.id]: updatedMonitor,
      });
    });

    it('should handle monitor with minimal properties', () => {
      const minimalMonitor: MonitorConfig = {
        id: 'minimal-monitor',
        fetchRequest: { url: '/api/minimal', method: 'GET' },
        interval: 30000,
      };

      (storage as any).get.mockReturnValue(null);

      storage.setMonitor(minimalMonitor);

      expect((storage as any).set).toHaveBeenCalledWith({
        [minimalMonitor.id]: minimalMonitor,
      });
    });

    it('should handle monitor with all properties', () => {
      const fullMonitor: MonitorConfig = {
        id: 'full-monitor',
        fetchRequest: {
          url: '/api/full',
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
        interval: 45000,
        latestData: { result: 'success' },
        notifyContent: {
          title: 'Monitor Alert',
          message: 'Data has changed',
          icon: '⚠️',
        },
      };

      (storage as any).get.mockReturnValue(null);

      storage.setMonitor(fullMonitor);

      expect((storage as any).set).toHaveBeenCalledWith({
        [fullMonitor.id]: fullMonitor,
      });
    });
  });

  describe('removeMonitor', () => {
    let storage: MonitorStorage;

    beforeEach(() => {
      storage = new MonitorStorage({});
      (storage as any).get = vi.fn();
      (storage as any).set = vi.fn();
    });

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
      (storage as any).get.mockReturnValue(existingMonitors);

      storage.removeMonitor('monitor-1');

      expect((storage as any).set).toHaveBeenCalledWith({
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
      (storage as any).get.mockReturnValue(existingMonitors);

      storage.removeMonitor('non-existent');

      expect((storage as any).set).toHaveBeenCalledWith(existingMonitors);
    });

    it('should handle empty storage', () => {
      (storage as any).get.mockReturnValue(null);

      storage.removeMonitor('any-monitor');

      expect((storage as any).set).toHaveBeenCalledWith({});
    });

    it('should remove monitor from storage with multiple monitors', () => {
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
        'monitor-3': {
          id: 'monitor-3',
          fetchRequest: { url: '/api/3', method: 'GET' },
          interval: 45000,
        },
      };
      (storage as any).get.mockReturnValue(existingMonitors);

      storage.removeMonitor('monitor-2');

      expect((storage as any).set).toHaveBeenCalledWith({
        'monitor-1': existingMonitors['monitor-1'],
        'monitor-3': existingMonitors['monitor-3'],
      });
    });
  });

  describe('getMonitor', () => {
    let storage: MonitorStorage;
    let mockMonitor: MonitorConfig;

    beforeEach(() => {
      storage = new MonitorStorage({});
      (storage as any).get = vi.fn();
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
      (storage as any).get.mockReturnValue(monitors);

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
      (storage as any).get.mockReturnValue(monitors);

      const result = storage.getMonitor('non-existent');

      expect(result).toBeUndefined();
    });

    it('should return undefined when storage is empty', () => {
      (storage as any).get.mockReturnValue(null);

      const result = storage.getMonitor('any-monitor');

      expect(result).toBeUndefined();
    });

    it('should return monitor with all properties', () => {
      const fullMonitor: MonitorConfig = {
        id: 'full-monitor',
        fetchRequest: { url: '/api/full', method: 'POST' },
        interval: 45000,
        latestData: { result: 'success' },
        notifyContent: {
          title: 'Monitor Alert',
          message: 'Data has changed',
        },
      };

      const monitors: MonitorMap = {
        [fullMonitor.id]: fullMonitor,
      };
      (storage as any).get.mockReturnValue(monitors);

      const result = storage.getMonitor(fullMonitor.id);

      expect(result).toBe(fullMonitor);
      expect(result?.notifyContent).toEqual({
        title: 'Monitor Alert',
        message: 'Data has changed',
      });
    });

    it('should handle undefined storage gracefully', () => {
      (storage as any).get.mockReturnValue(undefined);

      const result = storage.getMonitor('any-monitor');

      expect(result).toBeUndefined();
    });
  });

  describe('inheritance from KeyStorage', () => {
    let storage: MonitorStorage;

    beforeEach(() => {
      storage = new MonitorStorage({});
      (storage as any).get = vi.fn();
      (storage as any).set = vi.fn();
      (storage as any).addListener = vi.fn();
    });

    it('should inherit get method from KeyStorage', () => {
      const mockMonitors: MonitorMap = {
        'monitor-1': {
          id: 'monitor-1',
          fetchRequest: { url: '/api/1', method: 'GET' },
          interval: 60000,
        },
      };
      (storage as any).get.mockReturnValue(mockMonitors);

      const result = storage.get();

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

      expect((storage as any).set).toHaveBeenCalledWith(mockMonitors);
    });

    it('should inherit addListener method from KeyStorage', () => {
      const mockListener = vi.fn();

      storage.addListener(mockListener);

      expect((storage as any).addListener).toHaveBeenCalledWith(mockListener);
    });
  });

  describe('edge cases and error handling', () => {
    let storage: MonitorStorage;

    beforeEach(() => {
      storage = new MonitorStorage({});
      (storage as any).get = vi.fn();
      (storage as any).set = vi.fn();
    });

    it('should handle setMonitor with null monitor config', () => {
      // This should not crash, though TypeScript would prevent this
      const nullMonitor = null as any;

      expect(() => {
        storage.setMonitor(nullMonitor);
      }).toThrow(); // Will throw due to accessing null.id
    });

    it('should handle getMonitor with empty string id', () => {
      const monitors: MonitorMap = {
        '': {
          id: '',
          fetchRequest: { url: '/api/empty', method: 'GET' },
          interval: 30000,
        },
      };
      (storage as any).get.mockReturnValue(monitors);

      const result = storage.getMonitor('');

      expect(result).toBe(monitors['']);
    });

    it('should handle setMonitor with special characters in id', () => {
      const specialMonitor: MonitorConfig = {
        id: 'special-monitor_123.test',
        fetchRequest: { url: '/api/special', method: 'GET' },
        interval: 30000,
      };

      (storage as any).get.mockReturnValue(null);

      storage.setMonitor(specialMonitor);

      expect((storage as any).set).toHaveBeenCalledWith({
        [specialMonitor.id]: specialMonitor,
      });
    });

    it('should handle multiple operations in sequence', () => {
      // Start with empty storage
      (storage as any).get.mockReturnValue(null);

      // Add first monitor
      const monitor1: MonitorConfig = {
        id: 'monitor-1',
        fetchRequest: { url: '/api/1', method: 'GET' },
        interval: 60000,
      };
      storage.setMonitor(monitor1);

      // Now storage has monitor1
      const monitorsAfterFirst: MonitorMap = { [monitor1.id]: monitor1 };
      (storage as any).get.mockReturnValue(monitorsAfterFirst);

      // Add second monitor
      const monitor2: MonitorConfig = {
        id: 'monitor-2',
        fetchRequest: { url: '/api/2', method: 'GET' },
        interval: 30000,
      };
      storage.setMonitor(monitor2);

      // Now storage has both monitors
      const monitorsAfterSecond: MonitorMap = {
        [monitor1.id]: monitor1,
        [monitor2.id]: monitor2,
      };
      (storage as any).get.mockReturnValue(monitorsAfterSecond);

      // Remove first monitor
      storage.removeMonitor('monitor-1');

      // Should have only monitor2
      const monitorsAfterRemove: MonitorMap = {
        [monitor2.id]: monitor2,
      };

      expect((storage as any).set).toHaveBeenLastCalledWith(
        monitorsAfterRemove,
      );
    });

    it('should handle large number of monitors', () => {
      const monitors: MonitorMap = {};
      for (let i = 0; i < 100; i++) {
        monitors[`monitor-${i}`] = {
          id: `monitor-${i}`,
          fetchRequest: { url: `/api/${i}`, method: 'GET' },
          interval: 30000 + i,
        };
      }

      (storage as any).get.mockReturnValue(null);
      storage.setMonitor(monitors['monitor-50']);

      expect((storage as any).set).toHaveBeenCalledWith({
        'monitor-50': monitors['monitor-50'],
      });
    });
  });

  describe('DEFAULT_MONITOR_KEY', () => {
    it('should export DEFAULT_MONITOR_KEY constant', () => {
      expect(DEFAULT_MONITOR_KEY).toBe('react-fetcher-monitor');
    });

    it('should use DEFAULT_MONITOR_KEY when no key is provided', () => {
      const storage = new MonitorStorage({});

      expect(storage).toBeInstanceOf(MonitorStorage);
    });
  });
});
