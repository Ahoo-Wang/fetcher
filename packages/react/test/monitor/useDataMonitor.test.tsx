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
import { render } from '@testing-library/react';
import { useDataMonitor } from '../../src/monitor';

// Mock global Notification
Object.defineProperty(global, 'Notification', {
  value: vi.fn(),
  writable: true,
});
global.Notification.requestPermission = vi.fn().mockResolvedValue('granted');

// Mock dependencies
vi.mock('../../src/monitor/DataMonitorContext', async importOriginal => {
  const actual = (await importOriginal()) as Record<string, any>;
  return {
    ...actual,
    useDataMonitorContext: vi.fn(),
  };
});

vi.mock('../../src/eventbus', () => ({
  useEventSubscription: vi.fn(),
}));

import {
  useDataMonitorContext,
  DataMonitorProvider,
} from '../../src/monitor';
import { useEventSubscription } from '../../src';

const mockUseDataMonitorContext = vi.mocked(useDataMonitorContext);
const mockUseEventSubscription = vi.mocked(useEventSubscription);

describe('useDataMonitor', () => {
  let mockMonitor: any;
  let mockEventBus: any;

  beforeEach(() => {
    mockMonitor = {
      eventBus: {},
      getMonitor: vi.fn(),
      registerMonitor: vi.fn(),
      unregisterMonitor: vi.fn(),
    };

    mockEventBus = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };

    mockMonitor.eventBus = mockEventBus;

    mockUseDataMonitorContext.mockReturnValue({ monitor: mockMonitor });
    mockUseEventSubscription.mockReturnValue({
      subscribe: vi.fn(),
      unsubscribe: vi.fn(),
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should return an object with getMonitor, register, and unregister methods', () => {
    const hookResults: any[] = [];

    const TestComponent = () => {
      hookResults.push(useDataMonitor());
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    expect(hookResults[0]).toEqual({
      getMonitor: expect.any(Function),
      register: expect.any(Function),
      unregister: expect.any(Function),
    });
  });

  it('should call useDataMonitorContext to get the monitor instance', () => {
    const TestComponent = () => {
      useDataMonitor();
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    expect(mockUseDataMonitorContext).toHaveBeenCalledTimes(1);
  });

  it('should call useEventSubscription with correct parameters when eventHandler is provided', () => {
    const eventHandler = vi.fn();

    const TestComponent = () => {
      useDataMonitor({ eventHandler });
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    expect(mockUseEventSubscription).toHaveBeenCalledWith({
      bus: mockEventBus,
      handler: {
        name: 'demo-notification',
        order: 1,
        handle: expect.any(Function),
      },
    });
  });

  it('should call useEventSubscription with correct parameters when no eventHandler is provided', () => {
    const TestComponent = () => {
      useDataMonitor();
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    expect(mockUseEventSubscription).toHaveBeenCalledWith({
      bus: mockEventBus,
      handler: {
        name: 'demo-notification',
        order: 1,
        handle: expect.any(Function),
      },
    });
  });

  it('should call the eventHandler when an event is received', () => {
    const eventHandler = vi.fn();
    const mockEvent = { eventId: 123, latestData: 'test data' };

    let capturedHandler: any = null;
    mockUseEventSubscription.mockImplementation(options => {
      capturedHandler = options.handler;
      return {
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };
    });

    const TestComponent = () => {
      useDataMonitor({ eventHandler });
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    capturedHandler.handle(mockEvent);

    expect(eventHandler).toHaveBeenCalledWith(mockEvent);
    expect(eventHandler).toHaveBeenCalledTimes(1);
  });

  it('should not call eventHandler when no eventHandler is provided', () => {
    const mockEvent = { eventId: 123, latestData: 'test data' };

    let capturedHandler: any = null;
    mockUseEventSubscription.mockImplementation(options => {
      capturedHandler = options.handler;
      return {
        subscribe: vi.fn(),
        unsubscribe: vi.fn(),
      };
    });

    const TestComponent = () => {
      useDataMonitor();
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    expect(() => capturedHandler.handle(mockEvent)).not.toThrow();
  });

  it('should delegate getMonitor to monitor.getMonitor', () => {
    const monitorId = 'test-monitor';
    const expectedResult = { id: monitorId, latestData: 'test' };
    mockMonitor.getMonitor.mockReturnValue(expectedResult);

    const hookResults: any[] = [];

    const TestComponent = () => {
      hookResults.push(useDataMonitor());
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    const result = hookResults[0].getMonitor(monitorId);

    expect(mockMonitor.getMonitor).toHaveBeenCalledWith(monitorId);
    expect(result).toBe(expectedResult);
  });

  it('should delegate register to monitor.registerMonitor', async () => {
    const monitorConfig = {
      id: 'test-monitor',
      fetchRequest: { url: '/api/test', method: 'GET' },
      interval: 60000,
    };

    const hookResults: any[] = [];

    const TestComponent = () => {
      hookResults.push(useDataMonitor());
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    await hookResults[0].register(monitorConfig);

    expect(mockMonitor.registerMonitor).toHaveBeenCalledWith(monitorConfig);
  });

  it('should delegate unregister to monitor.unregisterMonitor', () => {
    const monitorId = 'test-monitor';

    const hookResults: any[] = [];

    const TestComponent = () => {
      hookResults.push(useDataMonitor());
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    hookResults[0].unregister(monitorId);

    expect(mockMonitor.unregisterMonitor).toHaveBeenCalledWith(monitorId);
  });

  it('should work with undefined options', () => {
    const hookResults: any[] = [];

    const TestComponent = () => {
      hookResults.push(useDataMonitor(undefined));
      return null;
    };

    render(
      <DataMonitorProvider>
        <TestComponent />
      </DataMonitorProvider>,
    );

    expect(hookResults[0]).toEqual({
      getMonitor: expect.any(Function),
      register: expect.any(Function),
      unregister: expect.any(Function),
    });

    expect(mockUseEventSubscription).toHaveBeenCalledWith({
      bus: mockEventBus,
      handler: {
        name: 'demo-notification',
        order: 1,
        handle: expect.any(Function),
      },
    });
  });
});
