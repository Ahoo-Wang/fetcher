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
import { DataMonitor, MonitorConfig, MonitorStorage } from '../../src/monitor';
import { ParallelTypedEventBus } from '@ahoo-wang/fetcher-eventbus';
import { getFetcher } from '@ahoo-wang/fetcher';

// Mock dependencies
vi.mock('@ahoo-wang/fetcher', () => ({
  fetcherRegistrar: { default: 'mock-fetcher' },
  getFetcher: vi.fn(),
}));

vi.mock('@ahoo-wang/fetcher-eventbus', () => ({
  ParallelTypedEventBus: vi.fn(),
}));

vi.mock('../../src/monitor/monitorStorage', () => ({
  DEFAULT_MONITOR_KEY: 'react-fetcher-monitor',
  MonitorStorage: vi.fn(),
}));

// Mock global Notification
Object.defineProperty(global, 'Notification', {
  value: vi.fn(),
  writable: true,
});
global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');

// Mock timers
vi.useFakeTimers();

describe('DataMonitor', () => {
  let mockStorage: any;
  let mockEventBus: any;
  let mockFetcher: any;
  let mockExchange: any;

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup mock storage
    mockStorage = {
      get: vi.fn().mockReturnValue(null),
      setMonitor: vi.fn(),
      removeMonitor: vi.fn(),
    };
    vi.mocked(MonitorStorage).mockImplementation(() => mockStorage);

    // Setup mock event bus
    mockEventBus = {
      emit: vi.fn().mockResolvedValue(undefined),
    };
    vi.mocked(ParallelTypedEventBus).mockImplementation(() => mockEventBus);

    // Setup mock fetcher
    mockExchange = {
      requiredResponse: {
        json: vi.fn(),
      },
    };
    mockFetcher = {
      exchange: vi.fn().mockResolvedValue(mockExchange),
    };
    vi.mocked(getFetcher).mockReturnValue(mockFetcher);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  describe('constructor', () => {
    it('should initialize with default options', () => {
      const monitor = new DataMonitor({});

      expect(monitor).toBeDefined();
      expect(MonitorStorage).toHaveBeenCalledWith({
        key: 'react-fetcher-monitor',
      });
      expect(ParallelTypedEventBus).toHaveBeenCalledWith(
        'react-fetcher-monitor',
      );
    });

    it('should initialize with custom options', () => {
      const options = {
        key: 'custom-key',
        maxRetryCount: 5,
        browserNotification: false,
      };
      const monitor = new DataMonitor(options);

      expect(MonitorStorage).toHaveBeenCalledWith({ key: 'custom-key' });
      expect(ParallelTypedEventBus).toHaveBeenCalledWith('custom-key');
    });

    it('should call init during construction', () => {
      const monitor = new DataMonitor({});
      // init is called in constructor, verify storage.get was called
      expect(mockStorage.get).toHaveBeenCalled();
    });
  });

  describe('init', () => {
    it('should load persisted monitors and start them', () => {
      const persistedMonitors = {
        'monitor-1': {
          id: 'monitor-1',
          fetchRequest: { url: '/api/1', method: 'GET' },
          interval: 1000,
        },
      };
      mockStorage.get.mockReturnValue(persistedMonitors);

      const monitor = new DataMonitor({});
      // Force re-init to test
      monitor.init();

      expect(mockStorage.get).toHaveBeenCalled();
      // Should have started monitoring
      expect(monitor.getMonitor('monitor-1')).toBeDefined();
    });

    it('should request notification permission if enabled', () => {
      const monitor = new DataMonitor({ browserNotification: true });

      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it('should not request notification permission if disabled', () => {
      const monitor = new DataMonitor({ browserNotification: false });

      expect(Notification.requestPermission).not.toHaveBeenCalled();
    });
  });

  describe('registerMonitor', () => {
    it('should fetch initial data and start monitoring', async () => {
      const initialData = { value: 42 };
      mockExchange.requiredResponse.json.mockResolvedValue(initialData);

      const config: MonitorConfig = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 5000,
      };

      const monitor = new DataMonitor({});
      await monitor.registerMonitor(config);

      expect(mockFetcher.exchange).toHaveBeenCalledWith(
        config.fetchRequest,
        {},
      );
      expect(mockStorage.setMonitor).toHaveBeenCalledWith({
        ...config,
        latestData: initialData,
      });

      const state = monitor.getMonitor('test-monitor');
      expect(state).toBeDefined();
      expect(state?.latestData).toBe(initialData);
    });

    it('should handle fetch errors during registration', async () => {
      const error = new Error('Fetch failed');
      mockFetcher.exchange.mockRejectedValue(error);

      const config: MonitorConfig = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 5000,
      };

      const monitor = new DataMonitor({ maxRetryCount: 0 }); // No retries

      await expect(monitor.registerMonitor(config)).rejects.toThrow(
        'Fetch failed',
      );
    });
  });

  describe('unregisterMonitor', () => {
    it('should stop monitoring and remove from storage', () => {
      const monitor = new DataMonitor({});
      const config: MonitorConfig = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 1000,
      };

      // Manually add a monitor
      const state = { ...config, timeIntervalId: 123 };
      (monitor as any).monitors['test-monitor'] = state;

      monitor.unregisterMonitor('test-monitor');

      expect(mockStorage.removeMonitor).toHaveBeenCalledWith('test-monitor');
      expect(monitor.getMonitor('test-monitor')).toBeUndefined();
    });
  });

  describe('startMonitoring and stopMonitoring', () => {
    it('should start and stop monitoring with intervals', () => {
      const monitor = new DataMonitor({});
      const state = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 1000,
        timeIntervalId: undefined,
      };

      monitor.startMonitoring(state);
      expect(state.timeIntervalId).toBeDefined();

      monitor.stopMonitoring(state);
      expect(state.timeIntervalId).toBeUndefined();
    });

    it('should clear existing interval when starting new one', () => {
      const monitor = new DataMonitor({});
      const state = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 1000,
        timeIntervalId: 123,
      };

      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      monitor.startMonitoring(state);

      expect(clearIntervalSpy).toHaveBeenCalledWith(123);
      expect(state.timeIntervalId).not.toBe(123);
    });
  });

  describe('update', () => {
    it('should detect data changes and emit events', () => {
      const monitor = new DataMonitor({});
      const state = {
        id: 'test-monitor',
        latestData: { value: 1 },
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 1000,
        timeIntervalId: 1,
        notifyContent: { title: 'Update', message: 'Data changed' },
      };
      (monitor as any).monitors['test-monitor'] = state;

      monitor.update('test-monitor', { value: 2 });

      expect(state.latestData).toEqual({ value: 2 });
      expect(mockStorage.setMonitor).toHaveBeenCalledWith(state);
      expect(mockEventBus.emit).toHaveBeenCalledWith({
        eventId: expect.any(Number),
        latestData: { value: 2 },
        content: { title: 'Update', message: 'Data changed' },
      });
    });

    it('should not emit events when data has not changed', () => {
      const monitor = new DataMonitor({});
      const state = {
        id: 'test-monitor',
        latestData: { value: 1 },
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 1000,
        timeIntervalId: 1,
      };
      (monitor as any).monitors['test-monitor'] = state;

      monitor.update('test-monitor', { value: 1 });

      expect(mockEventBus.emit).not.toHaveBeenCalled();
      expect(mockStorage.setMonitor).not.toHaveBeenCalled();
    });
  });

  describe('fetchLatestData', () => {
    it('should fetch data successfully', async () => {
      const data = { result: 'success' };
      mockExchange.requiredResponse.json.mockResolvedValue(data);

      const monitor = new DataMonitor({});
      const config: MonitorConfig = {
        id: 'test',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 1000,
      };

      const result = await (monitor as any).fetchLatestData(config);

      expect(result).toBe(data);
      expect(mockFetcher.exchange).toHaveBeenCalledWith(
        config.fetchRequest,
        {},
      );
    });
  });

  describe('isEqual', () => {
    it('should return true for identical primitives', () => {
      const monitor = new DataMonitor({});
      expect((monitor as any).isEqual(1, 1)).toBe(true);
      expect((monitor as any).isEqual('test', 'test')).toBe(true);
      expect((monitor as any).isEqual(true, true)).toBe(true);
    });

    it('should return false for different primitives', () => {
      const monitor = new DataMonitor({});
      expect((monitor as any).isEqual(1, 2)).toBe(false);
      expect((monitor as any).isEqual('test', 'other')).toBe(false);
    });

    it('should perform deep equality on objects', () => {
      const monitor = new DataMonitor({});
      expect((monitor as any).isEqual({ a: 1, b: 2 }, { a: 1, b: 2 })).toBe(
        true,
      );
      expect((monitor as any).isEqual({ a: 1 }, { a: 2 })).toBe(false);
    });

    it('should perform deep equality on arrays', () => {
      const monitor = new DataMonitor({});
      expect((monitor as any).isEqual([1, 2, 3], [1, 2, 3])).toBe(true);
      expect((monitor as any).isEqual([1, 2], [1, 2, 3])).toBe(false);
    });

    it('should handle null and undefined', () => {
      const monitor = new DataMonitor({});
      expect((monitor as any).isEqual(null, null)).toBe(true);
      expect((monitor as any).isEqual(undefined, undefined)).toBe(true);
      expect((monitor as any).isEqual(null, undefined)).toBe(false);
    });
  });

  describe('asState', () => {
    it('should convert MonitorConfig to MonitorState', () => {
      const monitor = new DataMonitor({});
      const config: MonitorConfig = {
        id: 'test',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 1000,
      };

      const state = (monitor as any).asState(config);

      expect(state).toEqual({
        ...config,
        timeIntervalId: 0,
      });
    });
  });

  describe('clearMonitors', () => {
    it('should unregister all monitors', () => {
      const monitor = new DataMonitor({});
      const config1: MonitorConfig = {
        id: 'monitor-1',
        fetchRequest: { url: '/api/1', method: 'GET' },
        interval: 1000,
      };
      const config2: MonitorConfig = {
        id: 'monitor-2',
        fetchRequest: { url: '/api/2', method: 'GET' },
        interval: 1000,
      };

      // Manually add monitors
      (monitor as any).monitors['monitor-1'] = {
        ...config1,
        timeIntervalId: 1,
      };
      (monitor as any).monitors['monitor-2'] = {
        ...config2,
        timeIntervalId: 2,
      };

      monitor.clearMonitors();

      expect(monitor.getMonitor('monitor-1')).toBeUndefined();
      expect(monitor.getMonitor('monitor-2')).toBeUndefined();
      expect((monitor as any).monitors).toEqual({});
    });
  });

  describe('getMonitor', () => {
    it('should return the monitor state by id', () => {
      const monitor = new DataMonitor({});
      const state = {
        id: 'test-monitor',
        fetchRequest: { url: '/api/test', method: 'GET' },
        interval: 1000,
        timeIntervalId: 1,
      };
      (monitor as any).monitors['test-monitor'] = state;

      const result = monitor.getMonitor('test-monitor');
      expect(result).toBe(state);
    });

    it('should return undefined for non-existent monitor', () => {
      const monitor = new DataMonitor({});
      const result = monitor.getMonitor('non-existent');
      expect(result).toBeUndefined();
    });
  });
});
