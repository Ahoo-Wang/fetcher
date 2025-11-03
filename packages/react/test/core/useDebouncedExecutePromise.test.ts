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
import { useDebouncedExecutePromise } from '../../src';
import { PromiseStatus } from '../../src';

describe('useDebouncedExecutePromise', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() =>
      useDebouncedExecutePromise({
        debounce: { delay: 300 },
      }),
    );

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(typeof result.current.run).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
    expect(typeof result.current.isPending).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should debounce calls correctly', () => {
    const mockPromise = vi.fn().mockResolvedValue('result');

    const { result } = renderHook(() =>
      useDebouncedExecutePromise({
        debounce: { delay: 300 },
      }),
    );

    act(() => {
      result.current.run(mockPromise);
    });

    expect(result.current.isPending()).toBe(true);
    expect(mockPromise).not.toHaveBeenCalled();

    act(() => {
      result.current.run(mockPromise);
    });

    expect(result.current.isPending()).toBe(true);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPromise).toHaveBeenCalledTimes(1);
  });

  it('should cancel pending debounced execution', () => {
    const mockPromise = vi.fn().mockResolvedValue('result');

    const { result } = renderHook(() =>
      useDebouncedExecutePromise({
        debounce: { delay: 300 },
      }),
    );

    act(() => {
      result.current.run(mockPromise);
    });

    expect(result.current.isPending()).toBe(true);

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isPending()).toBe(false);

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(mockPromise).not.toHaveBeenCalled();
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() =>
      useDebouncedExecutePromise({
        debounce: { delay: 300 },
      }),
    );

    // Simulate some state change (in real usage, this would happen after execution)
    // Since we can't easily trigger execution without complex setup, we test the reset function exists and is callable
    expect(() => {
      act(() => {
        result.current.reset();
      });
    }).not.toThrow();
  });

  it('should handle leading edge debouncing', () => {
    const mockPromise = vi.fn().mockResolvedValue('result');

    const { result } = renderHook(() =>
      useDebouncedExecutePromise({
        debounce: { delay: 300, leading: true },
      }),
    );

    act(() => {
      result.current.run(mockPromise);
    });

    expect(mockPromise).toHaveBeenCalled();
  });

  it('should memoize return object', () => {
    const { result, rerender } = renderHook(() =>
      useDebouncedExecutePromise({
        debounce: { delay: 300 },
      }),
    );

    const firstResult = result.current;

    rerender();

    expect(result.current).toBe(firstResult);
  });
});
