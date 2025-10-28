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
import { renderHook, act, waitFor } from '@testing-library/react';

// Import before mocks
import { useExecutePromise, PromiseStatus } from '../../src';

describe('useExecutePromise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useExecutePromise<string>());

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should execute promise successfully', async () => {
    const mockResult = 'success data';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle promise rejection', async () => {
    const error = new Error('promise failed');
    const mockProvider = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should reset state to initial values', async () => {
    const mockResult = 'success data';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should update states correctly during async execution', async () => {
    // Test the sequence of state changes
    const mockResult = 'test result';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    // Initially should be idle
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);

    // Execute the promise
    await act(async () => {
      await result.current.execute(mockProvider);
    });

    // After execution should be success
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe(mockResult);
    expect(result.current.error).toBeUndefined();
  });

  it('should execute a direct promise', async () => {
    const mockResult = 'direct promise result';
    const mockPromise = Promise.resolve(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockPromise);
    });

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe(mockResult);
    expect(result.current.error).toBeUndefined();
  });

  it('should handle race conditions by ignoring stale requests', async () => {
    const { result } = renderHook(() => useExecutePromise<string>());

    // Start first request (slow)
    const firstPromise = new Promise<string>(resolve => {
      setTimeout(() => resolve('first result'), 100);
    });

    // Start second request (fast)
    const secondPromise = Promise.resolve('second result');

    // Execute first (slow)
    await act(async () => {
      await result.current.execute(firstPromise);
    });

    // Execute second (fast), should override
    await act(async () => {
      await result.current.execute(secondPromise);
    });

    // Should have second result, not first
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe('second result');
  });

  it('should propagate error when propagateError is true', async () => {
    const error = new Error('propagate error');
    const mockProvider = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ propagateError: true }),
    );

    await act(async () => {
      await expect(result.current.execute(mockProvider)).rejects.toThrow(error);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should not propagate error when propagateError is false', async () => {
    const error = new Error('do not propagate');
    const mockProvider = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ propagateError: false }),
    );

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should default to not propagate error when propagateError is undefined', async () => {
    const error = new Error('default behavior');
    const mockProvider = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useExecutePromise<string>({}));

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should debounce execution when debounceDelay is set', async () => {
    const mockResult = 'debounced result';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 100 }),
    );

    // Call execute multiple times quickly
    act(() => {
      result.current.execute(mockProvider);
    });

    act(() => {
      result.current.execute(mockProvider);
    });

    act(() => {
      result.current.execute(mockProvider);
    });

    // Should not have executed yet due to debouncing
    expect(mockProvider).not.toHaveBeenCalled();

    // Wait for debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should have executed only once
    expect(mockProvider).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should reset state during debounced execution', async () => {
    const mockResult = 'debounced result';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 100 }),
    );

    // Start debounced execution
    act(() => {
      result.current.execute(mockProvider);
    });

    // Reset immediately
    act(() => {
      result.current.reset();
    });

    // State should be reset
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);

    // Wait for debounce delay - execution will still happen
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Provider was called and state was updated despite reset
    expect(mockProvider).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle component unmount during execution', async () => {
    const mockProvider = vi.fn().mockImplementation(() => {
      return new Promise(() => {
        // Never resolves to simulate hanging promise
      });
    });

    const { result, unmount } = renderHook(() => useExecutePromise<string>());

    // Start execution
    act(() => {
      result.current.execute(mockProvider);
    });

    // Unmount component
    unmount();

    // Should not throw or cause issues
    expect(mockProvider).toHaveBeenCalled();
  });

  it('should handle multiple rapid executions with debouncing', async () => {
    const mockResult1 = 'result 1';
    const mockResult2 = 'result 2';
    const mockProvider1 = vi.fn().mockResolvedValue(mockResult1);
    const mockProvider2 = vi.fn().mockResolvedValue(mockResult2);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 50 }),
    );

    // Execute first promise
    act(() => {
      result.current.execute(mockProvider1);
    });

    // Quickly execute second promise (should cancel first)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
      result.current.execute(mockProvider2);
    });

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 75));
    });

    // Only second promise should have executed
    expect(mockProvider1).not.toHaveBeenCalled();
    expect(mockProvider2).toHaveBeenCalledTimes(1);
    expect(result.current.result).toBe(mockResult2);
  });

  it('should work with zero debounce delay', async () => {
    const mockResult = 'immediate result';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 0 }),
    );

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle promise supplier function calls', async () => {
    const mockResult = 'supplier result';
    const mockSupplier = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockSupplier);
    });

    expect(mockSupplier).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle debounced promise supplier function calls', async () => {
    const mockResult = 'debounced supplier result';
    const mockSupplier = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 50 }),
    );

    act(() => {
      result.current.execute(mockSupplier);
    });

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 75));
    });

    expect(mockSupplier).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should debounce execution when debounceDelay is set', async () => {
    const mockResult = 'debounced result';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 100 }),
    );

    // Call execute multiple times quickly
    act(() => {
      result.current.execute(mockProvider);
    });

    act(() => {
      result.current.execute(mockProvider);
    });

    act(() => {
      result.current.execute(mockProvider);
    });

    // Should not have executed yet due to debouncing
    expect(mockProvider).not.toHaveBeenCalled();

    // Wait for debounce delay
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Should have executed only once
    expect(mockProvider).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should reset state during debounced execution', async () => {
    const mockResult = 'debounced result';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 100 }),
    );

    // Start debounced execution
    act(() => {
      result.current.execute(mockProvider);
    });

    // Reset immediately
    act(() => {
      result.current.reset();
    });

    // State should be reset
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);

    // Wait for debounce delay - execution will still happen
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    // Provider was called and state was updated despite reset
    expect(mockProvider).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle component unmount during execution', async () => {
    const mockProvider = vi.fn().mockImplementation(() => {
      return new Promise(() => {
        // Never resolves to simulate hanging promise
      });
    });

    const { result, unmount } = renderHook(() => useExecutePromise<string>());

    // Start execution
    act(() => {
      result.current.execute(mockProvider);
    });

    // Unmount component
    unmount();

    // Should not throw or cause issues
    expect(mockProvider).toHaveBeenCalled();
  });

  it('should handle multiple rapid executions with debouncing', async () => {
    const mockResult1 = 'result 1';
    const mockResult2 = 'result 2';
    const mockProvider1 = vi.fn().mockResolvedValue(mockResult1);
    const mockProvider2 = vi.fn().mockResolvedValue(mockResult2);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 50 }),
    );

    // Execute first promise
    act(() => {
      result.current.execute(mockProvider1);
    });

    // Quickly execute second promise (should cancel first)
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 25));
      result.current.execute(mockProvider2);
    });

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 75));
    });

    // Only second promise should have executed
    expect(mockProvider1).not.toHaveBeenCalled();
    expect(mockProvider2).toHaveBeenCalledTimes(1);
    expect(result.current.result).toBe(mockResult2);
  });

  it('should work with zero debounce delay', async () => {
    const mockResult = 'immediate result';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 0 }),
    );

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle promise supplier function calls', async () => {
    const mockResult = 'supplier result';
    const mockSupplier = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockSupplier);
    });

    expect(mockSupplier).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle debounced promise supplier function calls', async () => {
    const mockResult = 'debounced supplier result';
    const mockSupplier = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ debounceDelay: 50 }),
    );

    act(() => {
      result.current.execute(mockSupplier);
    });

    // Wait for debounce
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 75));
    });

    expect(mockSupplier).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });
});
