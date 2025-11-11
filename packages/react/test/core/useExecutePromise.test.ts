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

  it('should abort ongoing operation', async () => {
    const mockProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
      );

    const { result } = renderHook(() => useExecutePromise<string>());

    // Start an operation
    act(() => {
      result.current.execute(mockProvider);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.status).toBe(PromiseStatus.LOADING);

    // Abort the operation
    await act(async () => {
      await result.current.abort();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should handle abort when no operation is ongoing', async () => {
    const { result } = renderHook(() => useExecutePromise<string>());

    // Try to abort when no operation is running
    await act(async () => {
      await result.current.abort();
    });

    // Should not change state
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should call onAbort callback when operation is aborted manually', async () => {
    const onAbortMock = vi.fn();
    const mockProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
      );

    const { result } = renderHook(() =>
      useExecutePromise<string>({ onAbort: onAbortMock }),
    );

    // Start an operation
    act(() => {
      result.current.execute(mockProvider);
    });

    // Abort the operation
    await act(async () => {
      await result.current.abort();
    });

    expect(onAbortMock).toHaveBeenCalledTimes(1);
  });

  it('should call onAbort callback when operation is aborted automatically on unmount', async () => {
    const onAbortMock = vi.fn();
    const mockProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
      );

    const { result, unmount } = renderHook(() =>
      useExecutePromise<string>({ onAbort: onAbortMock }),
    );

    // Start an operation
    act(() => {
      result.current.execute(mockProvider);
    });

    expect(result.current.loading).toBe(true);

    // Unmount the component (should trigger cleanup)
    unmount();

    // onAbort should be called during cleanup
    expect(onAbortMock).toHaveBeenCalledTimes(1);
  });

  it('should abort previous operation when starting new one', async () => {
    const onAbortMock = vi.fn();
    const firstProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('first'), 200)),
      );
    const secondProvider = vi.fn().mockResolvedValue('second');

    const { result } = renderHook(() =>
      useExecutePromise<string>({ onAbort: onAbortMock }),
    );

    // Start first operation
    act(() => {
      result.current.execute(firstProvider);
    });

    expect(result.current.loading).toBe(true);

    // Start second operation (should abort first)
    await act(async () => {
      await result.current.execute(secondProvider);
    });

    expect(onAbortMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe('second');
  });

  it('should handle onAbort callback errors gracefully', async () => {
    const onAbortMock = vi.fn().mockRejectedValue(new Error('onAbort error'));
    const mockProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
      );

    // Mock console.warn to capture the warning
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useExecutePromise<string>({ onAbort: onAbortMock }),
    );

    // Start an operation
    act(() => {
      result.current.execute(mockProvider);
    });

    // Abort the operation (should trigger onAbort callback error)
    await act(async () => {
      await result.current.abort();
    });

    // Should have logged the error
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'useExecutePromise onAbort callback error:',
      expect.any(Error),
    );

    // State should still be reset correctly
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);

    consoleWarnSpy.mockRestore();
  });
});
