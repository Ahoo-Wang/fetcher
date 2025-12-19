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

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import {
  DataMonitorProvider,
  useDataMonitorContext,
  DataMonitor,
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

    it('should create DataMonitor with key option', () => {
      render(
        <DataMonitorProvider key="test-key" maxRetryCount={3}>
          <div>Test</div>
        </DataMonitorProvider>,
      );

      expect(mockDataMonitor).toHaveBeenCalledWith({
        maxRetryCount: 3,
      });
    });

    it('should create DataMonitor with all possible options', () => {
      render(
        <DataMonitorProvider maxRetryCount={10} browserNotification={false}>
          <div>Test</div>
        </DataMonitorProvider>,
      );

      expect(mockDataMonitor).toHaveBeenCalledWith({
        maxRetryCount: 10,
        browserNotification: false,
      });
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

    it('should reuse the same monitor instance across renders', () => {
      const monitorInstances: any[] = [];

      const TestComponent = () => {
        const { monitor } = useDataMonitorContext();
        monitorInstances.push(monitor);
        return <div>Test</div>;
      };

      const { rerender } = render(
        <DataMonitorProvider>
          <TestComponent />
        </DataMonitorProvider>,
      );

      // Re-render the same component
      rerender(
        <DataMonitorProvider>
          <TestComponent />
        </DataMonitorProvider>,
      );

      expect(monitorInstances[0]).toBe(monitorInstances[1]);
      expect(monitorInstances[0]).toBe(mockMonitorInstance);
    });

    it('should provide correct context value structure', () => {
      const contextValues: any[] = [];

      const TestComponent = () => {
        const context = useDataMonitorContext();
        contextValues.push(context);
        return <div>Test</div>;
      };

      render(
        <DataMonitorProvider>
          <TestComponent />
        </DataMonitorProvider>,
      );

      expect(contextValues[0]).toHaveProperty('monitor');
      expect(contextValues[0].monitor).toBe(mockMonitorInstance);
      expect(typeof contextValues[0].monitor).toBe('object');
    });

    it('should handle complex children structures', () => {
      render(
        <DataMonitorProvider>
          <div>
            <span>Child 1</span>
            <span>Child 2</span>
          </div>
          <p>Another child</p>
        </DataMonitorProvider>,
      );

      expect(screen.getByText('Child 1')).toBeTruthy();
      expect(screen.getByText('Child 2')).toBeTruthy();
      expect(screen.getByText('Another child')).toBeTruthy();
    });

    it('should handle empty children', () => {
      expect(() => {
        render(<DataMonitorProvider />);
      }).not.toThrow();
    });

    it('should handle null children', () => {
      render(<DataMonitorProvider>{null}</DataMonitorProvider>);
      // Should not crash
    });

    it('should handle undefined children', () => {
      render(<DataMonitorProvider>{undefined}</DataMonitorProvider>);
      // Should not crash
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

    it('should throw error with correct message when used outside provider', () => {
      const TestComponent = () => {
        useDataMonitorContext();
        return <div>Test</div>;
      };

      expect(() => render(<TestComponent />)).toThrow(
        'useDataMonitorContext must be used within a DataMonitorProvider',
      );
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

    it('should work with deeply nested components', () => {
      const contextValues: any[] = [];

      const DeeplyNestedComponent = () => {
        const context = useDataMonitorContext();
        contextValues.push(context);
        return <div>Deep</div>;
      };

      const MiddleComponent = () => (
        <div>
          <DeeplyNestedComponent />
        </div>
      );

      render(
        <DataMonitorProvider>
          <div>
            <MiddleComponent />
          </div>
        </DataMonitorProvider>,
      );

      expect(contextValues[0].monitor).toBe(mockMonitorInstance);
    });

    it('should work when called multiple times in the same component', () => {
      const contextValues: any[] = [];

      const TestComponent = () => {
        const context1 = useDataMonitorContext();
        const context2 = useDataMonitorContext();
        contextValues.push(context1, context2);
        return <div>Test</div>;
      };

      render(
        <DataMonitorProvider>
          <TestComponent />
        </DataMonitorProvider>,
      );

      expect(contextValues[0]).toBe(contextValues[1]);
      expect(contextValues[0].monitor).toBe(mockMonitorInstance);
    });

    it('should work with conditional rendering', () => {
      const contextValues: any[] = [];
      let showComponent = true;

      const ConditionalComponent = () => {
        const context = useDataMonitorContext();
        contextValues.push(context);
        return <div>Conditional</div>;
      };

      const { rerender } = render(
        <DataMonitorProvider>
          {showComponent && <ConditionalComponent />}
        </DataMonitorProvider>,
      );

      expect(contextValues.length).toBe(1);

      // Hide component
      showComponent = false;
      rerender(
        <DataMonitorProvider>
          {showComponent && <ConditionalComponent />}
        </DataMonitorProvider>,
      );

      // Should still have only one context access
      expect(contextValues.length).toBe(1);
    });
  });

  describe('Integration and Edge Cases', () => {
    it('should handle provider re-mounting', () => {
      const contextValues: any[] = [];

      const TestComponent = () => {
        const context = useDataMonitorContext();
        contextValues.push(context);
        return <div>Test</div>;
      };

      const { unmount } = render(
        <DataMonitorProvider>
          <TestComponent />
        </DataMonitorProvider>,
      );

      expect(contextValues.length).toBe(1);

      unmount();

      // Re-mount
      render(
        <DataMonitorProvider>
          <TestComponent />
        </DataMonitorProvider>,
      );

      expect(contextValues.length).toBe(2);
      expect(contextValues[0].monitor).toBe(mockMonitorInstance);
      expect(contextValues[1].monitor).toBe(mockMonitorInstance);
    });

    it('should handle multiple providers with different options', () => {
      const contextValues: any[] = [];

      const TestComponent = ({ id }: { id: string }) => {
        const context = useDataMonitorContext();
        contextValues.push({ id, monitor: context.monitor });
        return <div>{id}</div>;
      };

      render(
        <div>
          <DataMonitorProvider key="provider-1" maxRetryCount={5}>
            <TestComponent id="comp1" />
          </DataMonitorProvider>
          <DataMonitorProvider key="provider-2" maxRetryCount={10}>
            <TestComponent id="comp2" />
          </DataMonitorProvider>
        </div>,
      );

      expect(contextValues.length).toBe(2);
      expect(contextValues[0].monitor).toBe(mockMonitorInstance);
      expect(contextValues[1].monitor).toBe(mockMonitorInstance);
      expect(mockDataMonitor).toHaveBeenCalledWith({ maxRetryCount: 5 });
      expect(mockDataMonitor).toHaveBeenCalledWith({ maxRetryCount: 10 });
    });

    it('should handle rapid re-renders without issues', () => {
      const renderCount = { current: 0 };

      const TestComponent = () => {
        useDataMonitorContext();
        renderCount.current++;
        return <div>Render {renderCount.current}</div>;
      };

      const { rerender } = render(
        <DataMonitorProvider>
          <TestComponent />
        </DataMonitorProvider>,
      );

      expect(renderCount.current).toBe(1);

      // Rapid re-renders
      for (let i = 0; i < 5; i++) {
        rerender(
          <DataMonitorProvider>
            <TestComponent />
          </DataMonitorProvider>,
        );
      }

      expect(renderCount.current).toBe(6);
    });

    it('should handle async operations in children', async () => {
      const TestComponent = () => {
        const { monitor } = useDataMonitorContext();

        React.useEffect(() => {
          const asyncOperation = async () => {
            await Promise.resolve();
            await monitor.registerMonitor({
              id: 'async-test',
              fetchRequest: { url: '/test', method: 'GET' },
              interval: 1000,
            });
          };
          asyncOperation();
        }, [monitor]);

        return <div>Async Test</div>;
      };

      await act(async () => {
        render(
          <DataMonitorProvider>
            <TestComponent />
          </DataMonitorProvider>,
        );
      });

      expect(mockMonitorInstance.registerMonitor).toHaveBeenCalledWith({
        id: 'async-test',
        fetchRequest: { url: '/test', method: 'GET' },
        interval: 1000,
      });
    });
  });
});
