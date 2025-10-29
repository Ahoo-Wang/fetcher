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
import { renderHook, act } from '@testing-library/react';
import { useDebouncedCallback } from '../../src';

describe('useDebouncedCallback', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should debounce the callback with default trailing behavior', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 100 }),
    );

    act(() => {
      result.current.run();
    });
    expect(result.current.isPending()).toBe(true);
    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });
    expect(result.current.isPending()).toBe(false);
    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should pass arguments to the callback', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 100 }),
    );

    act(() => {
      result.current.run('arg1', 'arg2', 123);
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCallback).toHaveBeenCalledWith('arg1', 'arg2', 123);
  });

  it('should reset the timer on subsequent calls', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 100 }),
    );

    act(() => {
      result.current.run();
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    act(() => {
      result.current.run();
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(mockCallback).not.toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should execute immediately with leading option', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 100, leading: true }),
    );

    act(() => {
      result.current.run();
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should execute on trailing edge when leading is true and called again', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, {
        delay: 100,
        leading: true,
        trailing: true,
      }),
    );

    act(() => {
      result.current.run();
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(50);
    });

    act(() => {
      result.current.run();
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(10);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should not execute on trailing edge when trailing is false', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 100, trailing: false }),
    );

    act(() => {
      result.current.run();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should cancel pending execution', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 100 }),
    );

    act(() => {
      result.current.run();
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    act(() => {
      result.current.cancel();
    });

    act(() => {
      vi.advanceTimersByTime(50);
    });

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should use the latest callback when updated', () => {
    const mockCallback1 = vi.fn();
    const mockCallback2 = vi.fn();

    const { result, rerender } = renderHook(
      ({ callback }) => useDebouncedCallback(callback, { delay: 100 }),
      { initialProps: { callback: mockCallback1 } },
    );

    act(() => {
      result.current.run();
    });

    rerender({ callback: mockCallback2 });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCallback1).not.toHaveBeenCalled();
    expect(mockCallback2).toHaveBeenCalledTimes(1);
  });

  it('should use the latest delay when updated', () => {
    const mockCallback = vi.fn();

    const { result, rerender } = renderHook(
      ({ delay }) => useDebouncedCallback(mockCallback, { delay }),
      { initialProps: { delay: 200 } },
    );

    act(() => {
      result.current.run();
    });

    rerender({ delay: 100 });

    act(() => {
      result.current.run();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should use the latest options when updated', () => {
    const mockCallback = vi.fn();

    const { result, rerender } = renderHook(
      ({ options }) =>
        useDebouncedCallback(mockCallback, { delay: 100, ...options }),
      { initialProps: { options: { leading: false } } },
    );

    act(() => {
      result.current.run();
    });

    rerender({ options: { leading: true } });

    act(() => {
      result.current.run();
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should clean up timeout on unmount', () => {
    const mockCallback = vi.fn();
    const { result, unmount } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 100 }),
    );

    act(() => {
      result.current.run();
    });

    unmount();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should handle multiple rapid calls correctly', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 100 }),
    );

    act(() => {
      result.current.run();
      result.current.run();
      result.current.run();
    });

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should work with zero delay', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, { delay: 0 }),
    );

    act(() => {
      result.current.run();
    });

    act(() => {
      vi.runOnlyPendingTimers();
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should execute immediately with leading and not on trailing when trailing is false', () => {
    const mockCallback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(mockCallback, {
        delay: 100,
        leading: true,
        trailing: false,
      }),
    );

    act(() => {
      result.current.run();
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(mockCallback).toHaveBeenCalledTimes(1);
  });

  it('should throw error when both leading and trailing are false', () => {
    const mockCallback = vi.fn();

    expect(() => {
      renderHook(() =>
        useDebouncedCallback(mockCallback, {
          delay: 100,
          leading: false,
          trailing: false,
        }),
      );
    }).toThrow(
      'useDebouncedCallback: at least one of leading or trailing must be true',
    );
  });
});
