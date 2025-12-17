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
import { render, screen } from '@testing-library/react';
import {
  DataMonitorProvider,
  useDataMonitorContext,
  DataMonitor
} from '../../src/monitor';

// Mock DataMonitor
vi.mock('../../src/monitor/dataMonitor', () => ({
  DataMonitor: vi.fn(),
}));

const mockDataMonitor = vi.mocked(DataMonitor);

describe('DataMonitorContext', () => {
  let mockMonitorInstance: any;

  beforeEach(() => {
    mockMonitorInstance = {
      clearMonitors: vi.fn(),
      registerMonitor: vi.fn(),
      unregisterMonitor: vi.fn(),
    };
    mockDataMonitor.mockClear();
    mockDataMonitor.mockImplementation(() => mockMonitorInstance);
  });

  describe('DataMonitorProvider', () => {
    it('should render children correctly', () => {
      const testId = 'test-child';
      render(
        <DataMonitorProvider>
          <div data-testid={testId}>Test Child</div>
        </DataMonitorProvider>,
      );

      expect(screen.getByTestId(testId)).toBeTruthy();
      expect(screen.getByText('Test Child')).toBeTruthy();
    });

    it('should create DataMonitor with provided options', () => {
      const options = {
        maxRetryCount: 5,
        browserNotification: true,
      };

      render(
        <DataMonitorProvider {...options}>
          <div>Test</div>
        </DataMonitorProvider>,
      );

      expect(mockDataMonitor).toHaveBeenCalledWith(options);
    });

    it('should create DataMonitor with default options when none provided', () => {
      render(
        <DataMonitorProvider>
          <div>Test</div>
        </DataMonitorProvider>,
      );

      expect(mockDataMonitor).toHaveBeenCalledWith({});
    });

    it('should call clearMonitors on unmount', () => {
      const { unmount } = render(
        <DataMonitorProvider>
          <div>Test</div>
        </DataMonitorProvider>,
      );

      unmount();

      expect(mockMonitorInstance.clearMonitors).toHaveBeenCalledTimes(1);
    });
  });

  describe('useDataMonitorContext', () => {
    it('should throw error when used outside DataMonitorProvider', () => {
      // Create a component that uses the hook outside provider
      const TestComponent = () => {
        useDataMonitorContext();
        return <div>Test</div>;
      };

      // Mock console.error to avoid noise in test output
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      expect(() => render(<TestComponent />)).toThrow(
        'useDataMonitorContext must be used within a DataMonitorProvider',
      );

      consoleSpy.mockRestore();
    });

    it('should return context value when used inside DataMonitorProvider', () => {
      const contextValues: any[] = [];

      const TestComponent = () => {
        const context = useDataMonitorContext();
        contextValues.push(context);
        return <div>Test</div>;
      };

      render(
        <DataMonitorProvider key="test-context">
          <TestComponent />
        </DataMonitorProvider>,
      );

      expect(contextValues[0]).toEqual({ monitor: mockMonitorInstance });
      expect(contextValues[0].monitor).toBe(mockMonitorInstance);
    });

    it('should provide the same monitor instance to multiple components', () => {
      const contextValues: any[] = [];

      const TestComponent1 = () => {
        const context = useDataMonitorContext();
        contextValues.push(context);
        return <div>Component 1</div>;
      };

      const TestComponent2 = () => {
        const context = useDataMonitorContext();
        contextValues.push(context);
        return <div>Component 2</div>;
      };

      render(
        <DataMonitorProvider>
          <TestComponent1 />
          <TestComponent2 />
        </DataMonitorProvider>,
      );

      expect(contextValues[0].monitor).toBe(contextValues[1].monitor);
      expect(contextValues[0].monitor).toBe(mockMonitorInstance);
    });
  });
});
