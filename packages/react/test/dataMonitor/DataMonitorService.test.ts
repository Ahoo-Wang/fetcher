import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Use vi.hoisted to ensure mocks are properly set up
const { notificationCenterMock } = vi.hoisted(() => ({
  notificationCenterMock: {
    publish: vi.fn().mockResolvedValue(undefined),
  },
}));

const { dataMonitorEventBusMock } = vi.hoisted(() => ({
  dataMonitorEventBusMock: {
    emit: vi.fn().mockResolvedValue(undefined),
  },
}));

let storageData: Record<string, any> = {};

vi.mock('../../src/notification/notificationCenter', () => ({
  notificationCenter: notificationCenterMock,
}));

vi.mock('../../src/dataMonitor/useDataMonitorEventBus', () => ({
  dataMonitorEventBus: dataMonitorEventBusMock,
}));

// Mock KeyStorage
vi.mock('@ahoo-wang/fetcher-storage', () => {
  return {
    KeyStorage: class MockKeyStorage {
      get = vi.fn().mockImplementation(() => storageData);
      set = vi.fn().mockImplementation((data) => { storageData = data; });
      remove = vi.fn();
      addListener = vi.fn();
    },
  };
});

// Mock fetcher - the mock post function is hoisted so it's accessible in tests
const fetcherPostMock = vi.hoisted(() => vi.fn(() => Promise.resolve(0)));

vi.mock('@ahoo-wang/fetcher', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@ahoo-wang/fetcher')>();
  return {
    ...actual,
    fetcher: {
      ...actual.fetcher,
      post: fetcherPostMock,
    },
  };
});

// Mock fetcher-wow
vi.mock('@ahoo-wang/fetcher-wow', () => ({
  all: vi.fn().mockReturnValue({}),
}));

import { DataMonitorService } from '../../src/dataMonitor/DataMonitorService';
import { fetcher } from '@ahoo-wang/fetcher';

// Helper to set up sequential mock responses
const setupFetchResponses = (...values: number[]) => {
  let i = 0;
  fetcherPostMock.mockImplementation(() => {
    return Promise.resolve(values[i++] ?? 0);
  });
};

describe('DataMonitorService', () => {
  let service: DataMonitorService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    storageData = {};
    // Default: return 0 (simulates ResultExtractors.Json)
    setupFetchResponses(0);
    service = new DataMonitorService();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('enable', () => {
    it('should start monitoring a view and save to storage', () => {
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });

      expect(service.isEnabled('view-1')).toBe(true);
      expect(fetcher.post).toHaveBeenCalledWith(
        '/api/count',
        { body: {} },
        expect.objectContaining({ resultExtractor: expect.any(Function) }),
      );
    });

    it('should replace existing monitoring when enabling same viewId', () => {
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });
      expect(service.isEnabled('view-1')).toBe(true);

      service.enable('view-1', '/api/count/v2', 'Updated View', { status: 'active' }, { title: 'Updated' });

      expect(service.isEnabled('view-1')).toBe(true);
      expect(fetcher.post).toHaveBeenLastCalledWith(
        '/api/count/v2',
        { body: { status: 'active' } },
        expect.objectContaining({ resultExtractor: expect.any(Function) }),
      );
    });

    it('should use custom interval when provided', () => {
      const setIntervalSpy = vi.spyOn(window, 'setInterval');
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' }, 10000);

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 10000);
    });

    it('should use default 30000ms interval when not provided', () => {
      const setIntervalSpy = vi.spyOn(window, 'setInterval');
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });

      expect(setIntervalSpy).toHaveBeenCalledWith(expect.any(Function), 30000);
    });

    it('should persist enabled state to storage', () => {
      service.enable('view-1', '/api/count', 'Test View', { status: 'active' }, { title: 'Test', navigationUrl: '/test' });

      const savedView = storageData['view-1'];
      expect(savedView).toBeDefined();
      expect(savedView.enabled).toBe(true);
      expect(savedView.countUrl).toBe('/api/count');
      expect(savedView.viewName).toBe('Test View');
      expect(savedView.condition).toEqual({ status: 'active' });
      expect(savedView.notification).toEqual({ title: 'Test', navigationUrl: '/test' });
    });
  });

  describe('disable', () => {
    it('should stop monitoring and clear interval', () => {
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });
      service.disable('view-1');

      expect(service.isEnabled('view-1')).toBe(false);
      expect(clearIntervalSpy).toHaveBeenCalled();
    });

    it('should update storage after disable', () => {
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });
      expect(storageData['view-1']).toBeDefined();

      service.disable('view-1');

      expect(storageData['view-1']).toBeUndefined();
    });

    it('should not throw when disabling non-existent view', () => {
      expect(() => {
        service.disable('non-existent');
      }).not.toThrow();
    });
  });

  describe('isEnabled', () => {
    it('should return false for non-existent view', () => {
      expect(service.isEnabled('non-existent')).toBe(false);
    });

    it('should return true after enable', () => {
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });
      expect(service.isEnabled('view-1')).toBe(true);
    });

    it('should return false after disable', () => {
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });
      service.disable('view-1');
      expect(service.isEnabled('view-1')).toBe(false);
    });
  });

  describe('initialize', () => {
    it('should restore enabled views from storage', () => {
      storageData = {
        'saved-view': {
          enabled: true,
          countUrl: '/api/saved/count',
          viewName: 'Saved View',
          condition: {},
          notification: { title: 'Saved' },
        },
      };

      service.initialize();

      expect(service.isEnabled('saved-view')).toBe(true);
      expect(fetcher.post).toHaveBeenCalledWith(
        '/api/saved/count',
        { body: {} },
        expect.objectContaining({ resultExtractor: expect.any(Function) }),
      );
    });

    it('should skip disabled views in storage', () => {
      storageData = {
        'disabled-view': {
          enabled: false,
          countUrl: '/api/disabled/count',
          viewName: 'Disabled View',
          condition: {},
          notification: { title: 'Disabled' },
        },
      };

      service.initialize();

      expect(service.isEnabled('disabled-view')).toBe(false);
      expect(fetcher.post).not.toHaveBeenCalled();
    });

    it('should handle empty storage gracefully', () => {
      expect(() => {
        service.initialize();
      }).not.toThrow();

      expect(fetcher.post).not.toHaveBeenCalled();
    });

    it('should handle null storage gracefully', () => {
      storageData = null as any;

      expect(() => {
        service.initialize();
      }).not.toThrow();

      expect(fetcher.post).not.toHaveBeenCalled();
    });

    it('should handle storage with missing notification field', () => {
      storageData = {
        'view-no-notification': {
          enabled: true,
          countUrl: '/api/count',
          viewName: 'No Notification',
          condition: {},
        },
      };

      service.initialize();

      expect(service.isEnabled('view-no-notification')).toBe(true);
    });

    it('should restore multiple enabled views', () => {
      storageData = {
        'view-1': {
          enabled: true,
          countUrl: '/api/view1/count',
          viewName: 'View 1',
          condition: {},
          notification: { title: 'Notification 1' },
        },
        'view-2': {
          enabled: true,
          countUrl: '/api/view2/count',
          viewName: 'View 2',
          condition: { status: 'active' },
          notification: { title: 'Notification 2' },
        },
        'view-3': {
          enabled: false,
          countUrl: '/api/view3/count',
          viewName: 'View 3',
          condition: {},
          notification: { title: 'Notification 3' },
        },
      };

      service.initialize();

      expect(service.isEnabled('view-1')).toBe(true);
      expect(service.isEnabled('view-2')).toBe(true);
      expect(service.isEnabled('view-3')).toBe(false);
      expect(fetcher.post).toHaveBeenCalledTimes(2);
    });
  });

  describe('fetchAndCheck (via enable + interval advancement)', () => {
    it('should notify and emit event when total changes', async () => {
      setupFetchResponses(0, 10);

      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test Notification', navigationUrl: '/test' });

      await vi.advanceTimersByTimeAsync(30000);

      expect(fetcher.post).toHaveBeenCalledTimes(2);

      expect(dataMonitorEventBusMock.emit).toHaveBeenCalledWith({
        type: 'DATA_CHANGED',
        viewId: 'view-1',
        viewName: 'Test View',
        previousTotal: 0,
        currentTotal: 10,
      });

      expect(notificationCenterMock.publish).toHaveBeenCalledWith(
        'browser',
        expect.objectContaining({
          title: 'Test Notification',
          payload: expect.objectContaining({
            body: '当前共 10 条数据',
          }),
        }),
      );
    });

    it('should not notify when total is unchanged', async () => {
      setupFetchResponses(5, 5);

      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });

      await vi.advanceTimersByTimeAsync(30000);

      expect(fetcher.post).toHaveBeenCalledTimes(2);

      expect(dataMonitorEventBusMock.emit).not.toHaveBeenCalled();
      expect(notificationCenterMock.publish).not.toHaveBeenCalled();
    });

    it('should not notify on first fetch (previousTotal is null)', async () => {
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });

      expect(dataMonitorEventBusMock.emit).not.toHaveBeenCalled();
      expect(notificationCenterMock.publish).not.toHaveBeenCalled();
    });

    it('should handle fetch errors gracefully without crashing', async () => {
      fetcherPostMock.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

      expect(() => {
        service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });
      }).not.toThrow();

      await vi.advanceTimersByTimeAsync(30000);

      expect(service.isEnabled('view-1')).toBe(true);
      expect(notificationCenterMock.publish).not.toHaveBeenCalled();
    });

    it('should not notify if view is disabled during fetch', async () => {
      let resolveFetch!: (value: number) => void;
      const fetchPromise = new Promise<number>((resolve) => {
        resolveFetch = resolve;
      });
      fetcherPostMock.mockImplementationOnce(() => fetchPromise);

      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });

      service.disable('view-1');

      resolveFetch(42);

      await vi.advanceTimersByTimeAsync(0);

      expect(notificationCenterMock.publish).not.toHaveBeenCalled();
    });

    it('should include onClick with navigationUrl in notification', async () => {
      setupFetchResponses(0, 10);

      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test', navigationUrl: '/test' });

      await vi.advanceTimersByTimeAsync(30000);

      expect(notificationCenterMock.publish).toHaveBeenCalledWith(
        'browser',
        expect.objectContaining({
          title: 'Test',
          onClick: expect.any(Function),
        }),
      );
    });

    it('should navigate to navigationUrl when notification onClick is called', async () => {
      setupFetchResponses(0, 10);

      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });

      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test', navigationUrl: '/navigate-here' });

      await vi.advanceTimersByTimeAsync(30000);

      const publishedMessage = notificationCenterMock.publish.mock.calls[0][1];
      publishedMessage.onClick();

      expect(window.location.href).toBe('/navigate-here');

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });

    it('should not navigate when navigationUrl is not set', async () => {
      setupFetchResponses(0, 10);

      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true,
        configurable: true,
      });

      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Test' });

      await vi.advanceTimersByTimeAsync(30000);

      const publishedMessage = notificationCenterMock.publish.mock.calls[0][1];
      publishedMessage.onClick();

      expect(window.location.href).toBe('');

      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
        configurable: true,
      });
    });
  });

  describe('updateCondition', () => {
    it('should update condition for enabled view and persist to storage', () => {
      service.enable('view-1', '/api/count', 'Test View', { status: 'old' }, { title: 'Test' });

      service.updateCondition('view-1', { status: 'new', priority: 'high' });

      expect(storageData['view-1']?.condition).toEqual({ status: 'new', priority: 'high' });
    });

    it('should not throw when updating condition for non-existent view', () => {
      expect(() => {
        service.updateCondition('non-existent', {} as any);
      }).not.toThrow();
    });

    it('should not persist when view does not exist', () => {
      const initialStorage = { ...storageData };
      service.updateCondition('non-existent', { status: 'new' });
      expect(storageData).toEqual(initialStorage);
    });
  });

  describe('updateNotification', () => {
    it('should update notification for enabled view and persist to storage', () => {
      service.enable('view-1', '/api/count', 'Test View', {}, { title: 'Old Title' });

      service.updateNotification('view-1', { title: 'New Title', navigationUrl: '/new-url' });

      expect(storageData['view-1']?.notification).toEqual({ title: 'New Title', navigationUrl: '/new-url' });
    });

    it('should not throw when updating notification for non-existent view', () => {
      expect(() => {
        service.updateNotification('non-existent', { title: 'Test' });
      }).not.toThrow();
    });

    it('should not persist when view does not exist', () => {
      const initialStorage = { ...storageData };
      service.updateNotification('non-existent', { title: 'New' });
      expect(storageData).toEqual(initialStorage);
    });
  });

  describe('multiple views', () => {
    it('should manage multiple views independently', () => {
      service.enable('view-1', '/api/v1/count', 'View 1', {}, { title: 'Test 1' });
      service.enable('view-2', '/api/v2/count', 'View 2', {}, { title: 'Test 2' });
      service.enable('view-3', '/api/v3/count', 'View 3', {}, { title: 'Test 3' });

      expect(service.isEnabled('view-1')).toBe(true);
      expect(service.isEnabled('view-2')).toBe(true);
      expect(service.isEnabled('view-3')).toBe(true);

      service.disable('view-2');

      expect(service.isEnabled('view-1')).toBe(true);
      expect(service.isEnabled('view-2')).toBe(false);
      expect(service.isEnabled('view-3')).toBe(true);
    });

    it('should fetch each view with its own URL and condition', () => {
      service.enable('view-1', '/api/v1/count', 'View 1', { type: 'a' }, { title: 'Test 1' });
      service.enable('view-2', '/api/v2/count', 'View 2', { type: 'b' }, { title: 'Test 2' });

      expect(fetcher.post).toHaveBeenCalledWith(
        '/api/v1/count',
        { body: { type: 'a' } },
        expect.objectContaining({ resultExtractor: expect.any(Function) }),
      );
      expect(fetcher.post).toHaveBeenCalledWith(
        '/api/v2/count',
        { body: { type: 'b' } },
        expect.objectContaining({ resultExtractor: expect.any(Function) }),
      );
    });
  });
});
