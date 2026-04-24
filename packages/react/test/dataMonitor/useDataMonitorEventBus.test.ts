import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataMonitorEventBus, dataMonitorEventBus } from '../../src/dataMonitor/useDataMonitorEventBus';

describe('useDataMonitorEventBus', () => {
  it('should return subscribe and unsubscribe functions', () => {
    const { result } = renderHook(() => useDataMonitorEventBus());

    expect(result.current.subscribe).toBeDefined();
    expect(result.current.unsubscribe).toBeDefined();
  });

  it('should call handler when event is emitted', async () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useDataMonitorEventBus());

    result.current.subscribe({
      name: 'test-handler',
      handle: handler,
    });

    await act(async () => {
      await dataMonitorEventBus.emit({
        type: 'DATA_CHANGED',
        viewId: 'view-1',
        viewName: 'Test View',
        previousTotal: 10,
        currentTotal: 20,
      });
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
