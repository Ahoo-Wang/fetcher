// packages/react/test/dataMonitor/DataMonitorService.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';

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

vi.mock('../../src/notification/notificationCenter', () => ({
  notificationCenter: notificationCenterMock,
}));

vi.mock('../../src/dataMonitor/useDataMonitorEventBus', () => ({
  dataMonitorEventBus: dataMonitorEventBusMock,
}));

// Mock KeyStorage - must be a class that can be instantiated
vi.mock('@ahoo-wang/fetcher-storage', () => {
  return {
    KeyStorage: class MockKeyStorage {
      get = vi.fn().mockReturnValue(null);
      set = vi.fn();
      remove = vi.fn();
      addListener = vi.fn();
    },
  };
});

// Mock fetcher
vi.mock('@ahoo-wang/fetcher', () => ({
  fetcher: {
    post: vi.fn().mockResolvedValue(0),
  },
}));

// Mock fetcher-wow
vi.mock('@ahoo-wang/fetcher-wow', () => ({
  all: vi.fn().mockReturnValue({}),
}));

import { DataMonitorService } from '../../src/dataMonitor/DataMonitorService';

describe('DataMonitorService', () => {
  let service: DataMonitorService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new DataMonitorService();
  });

  describe('updateCondition', () => {
    it('should not throw when updating condition for non-existent view', () => {
      expect(() => {
        service.updateCondition('non-existent', {} as any);
      }).not.toThrow();
    });
  });

  describe('updateNotification', () => {
    it('should not throw when updating notification for non-existent view', () => {
      expect(() => {
        service.updateNotification('non-existent', { title: 'Test' });
      }).not.toThrow();
    });
  });

  describe('isEnabled', () => {
    it('should return false for non-existent view', () => {
      expect(service.isEnabled('non-existent')).toBe(false);
    });
  });
});