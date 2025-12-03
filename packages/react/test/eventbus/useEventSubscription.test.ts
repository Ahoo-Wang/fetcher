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

import { describe, it, expect, vi, beforeEach, type Mocked } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEventSubscription } from '../../src/eventbus/useEventSubscription';
import type { TypedEventBus, EventHandler } from '@ahoo-wang/fetcher-eventbus';

describe('useEventSubscription', () => {
  let mockBus: any;
  let mockHandler: EventHandler<string>;

  beforeEach(() => {
    mockBus = {
      type: 'test',
      handlers: [],
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
      destroy: vi.fn(),
    };

    mockHandler = {
      name: 'testHandler',
      order: 0,
      handle: vi.fn(),
    };
  });

  it('should subscribe on mount and unsubscribe on unmount', () => {
    mockBus.on.mockReturnValue(true);
    mockBus.off.mockReturnValue(true);

    const { unmount } = renderHook(() =>
      useEventSubscription({
        bus: mockBus,
        handler: mockHandler,
      }),
    );

    expect(mockBus.on).toHaveBeenCalledWith(mockHandler);
    expect(mockBus.off).not.toHaveBeenCalled();

    act(() => {
      unmount();
    });

    expect(mockBus.off).toHaveBeenCalledWith('testHandler');
  });

  it('should return subscribe and unsubscribe functions', () => {
    mockBus.on.mockReturnValue(true);
    mockBus.off.mockReturnValue(true);

    const { result } = renderHook(() =>
      useEventSubscription({
        bus: mockBus,
        handler: mockHandler,
      }),
    );

    expect(typeof result.current.subscribe).toBe('function');
    expect(typeof result.current.unsubscribe).toBe('function');
  });

  it('should allow manual subscription', () => {
    mockBus.on.mockReturnValue(true);

    const { result } = renderHook(() =>
      useEventSubscription({
        bus: mockBus,
        handler: mockHandler,
      }),
    );

    act(() => {
      const success = result.current.subscribe();
      expect(success).toBe(true);
    });

    expect(mockBus.on).toHaveBeenCalledTimes(2); // once auto, once manual
  });

  it('should allow manual unsubscription', () => {
    mockBus.off.mockReturnValue(true);

    const { result } = renderHook(() =>
      useEventSubscription({
        bus: mockBus,
        handler: mockHandler,
      }),
    );

    act(() => {
      const success = result.current.unsubscribe();
      expect(success).toBe(true);
    });

    expect(mockBus.off).toHaveBeenCalledWith('testHandler');
  });

  it('should resubscribe when handler changes', () => {
    mockBus.on.mockReturnValue(true);
    mockBus.off.mockReturnValue(true);

    const newHandler: EventHandler<string> = {
      name: 'newHandler',
      order: 0,
      handle: vi.fn(),
    };

    const { rerender } = renderHook(
      ({ handler }) =>
        useEventSubscription({
          bus: mockBus,
          handler,
        }),
      { initialProps: { handler: mockHandler } },
    );

    expect(mockBus.on).toHaveBeenCalledWith(mockHandler);

    act(() => {
      rerender({ handler: newHandler });
    });

    expect(mockBus.off).toHaveBeenCalledWith('testHandler');
    expect(mockBus.on).toHaveBeenCalledWith(newHandler);
  });

  it('should resubscribe when bus changes', () => {
    mockBus.on.mockReturnValue(true);
    mockBus.off.mockReturnValue(true);

    const newBus: TypedEventBus<string> = {
      type: 'newTest',
      handlers: [],
      on: vi.fn().mockReturnValue(true),
      off: vi.fn().mockReturnValue(true),
      emit: vi.fn(),
      destroy: vi.fn(),
    };

    const { rerender } = renderHook(
      ({ bus }) =>
        useEventSubscription({
          bus,
          handler: mockHandler,
        }),
      { initialProps: { bus: mockBus } },
    );

    expect(mockBus.on).toHaveBeenCalledWith(mockHandler);

    act(() => {
      rerender({ bus: newBus });
    });

    expect(mockBus.off).toHaveBeenCalledWith('testHandler');
    expect(newBus.on).toHaveBeenCalledWith(mockHandler);
  });

  it('should handle subscription failure with warning', () => {
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});
    mockBus.on.mockReturnValue(false); // Simulate failure

    renderHook(() =>
      useEventSubscription({
        bus: mockBus,
        handler: mockHandler,
      }),
    );

    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'Failed to subscribe to event bus with handler: testHandler',
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle unsubscription failure gracefully', () => {
    mockBus.off.mockReturnValue(false);

    const { result, unmount } = renderHook(() =>
      useEventSubscription({
        bus: mockBus,
        handler: mockHandler,
      }),
    );

    act(() => {
      unmount();
    });

    // Should not throw, just return false
    expect(mockBus.off).toHaveBeenCalledWith('testHandler');
  });
});
