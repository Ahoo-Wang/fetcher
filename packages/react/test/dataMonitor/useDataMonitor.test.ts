// packages/react/test/dataMonitor/useDataMonitor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataMonitor } from '../../src/dataMonitor/useDataMonitor';
import { dataMonitorService } from '../../src/dataMonitor/DataMonitorService';

vi.mock('../../src/dataMonitor/DataMonitorService', () => ({
  dataMonitorService: {
    isEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    updateCondition: vi.fn(),
    updateNotification: vi.fn(),
  },
}));

describe('useDataMonitor', () => {
  const defaultOptions = {
    viewId: 'test-view',
    countUrl: '/api/count',
    viewName: 'Test View',
    condition: {} as any,
    notification: { title: 'Test Notification' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (dataMonitorService.isEnabled as any).mockReturnValue(false);
  });

  it('should return isEnabled as false when service is disabled', () => {
    const { result } = renderHook(() => useDataMonitor(defaultOptions));
    expect(result.current.isEnabled).toBe(false);
  });

  it('should call enable when enable is called', () => {
    const { result } = renderHook(() => useDataMonitor(defaultOptions));

    act(() => {
      result.current.enable();
    });

    expect(dataMonitorService.enable).toHaveBeenCalledWith(
      defaultOptions.viewId,
      defaultOptions.countUrl,
      defaultOptions.viewName,
      defaultOptions.condition,
      defaultOptions.notification,
      undefined
    );
  });

  it('should call disable when disable is called', () => {
    (dataMonitorService.isEnabled as any).mockReturnValue(true);

    const { result } = renderHook(() => useDataMonitor(defaultOptions));

    act(() => {
      result.current.disable();
    });

    expect(dataMonitorService.disable).toHaveBeenCalledWith(defaultOptions.viewId);
  });

  it('should toggle between enable and disable', () => {
    const { result } = renderHook(() => useDataMonitor(defaultOptions));

    // Initially disabled - enable should be called
    act(() => {
      result.current.toggle();
    });
    expect(dataMonitorService.enable).toHaveBeenCalled();

    // Now enabled - disable should be called on next toggle
    (dataMonitorService.isEnabled as any).mockReturnValue(true);

    act(() => {
      result.current.toggle();
    });
    expect(dataMonitorService.disable).toHaveBeenCalled();
  });
});
