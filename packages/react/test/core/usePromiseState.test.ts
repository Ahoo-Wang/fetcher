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
import { usePromiseState, PromiseStatus } from '../../src';

// Mock useMounted to always return true (component is mounted)
vi.mock('../../src/core/useMounted', () => ({ useMounted: () => () => true }));

describe('usePromiseState', () => {
  let mockOnSuccess: ReturnType<typeof vi.fn>;
  let mockOnError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockOnSuccess = vi.fn();
    mockOnError = vi.fn();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => usePromiseState<string>());

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should initialize with custom initial status', () => {
    const { result } = renderHook(() =>
      usePromiseState<string>({ initialStatus: PromiseStatus.SUCCESS }),
    );

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => usePromiseState<string>());

    act(() => {
      result.current.setLoading();
    });

    expect(result.current.status).toBe(PromiseStatus.LOADING);
    expect(result.current.loading).toBe(true);
    expect(result.current.error).toBeUndefined();
  });

  it('should set success state and call onSuccess callback', async () => {
    const mockResult = 'test result';
    const { result } = renderHook(() =>
      usePromiseState<string>({ onSuccess: mockOnSuccess }),
    );

    await act(async () => {
      await result.current.setSuccess(mockResult);
    });

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe(mockResult);
    expect(result.current.error).toBeUndefined();
    expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
  });

  it('should set error state and call onError callback', async () => {
    const mockError = new Error('test error');
    const { result } = renderHook(() =>
      usePromiseState<string>({ onError: mockOnError }),
    );

    await act(async () => {
      await result.current.setError(mockError);
    });

    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBe(mockError);
    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it('should set idle state', async () => {
    const { result } = renderHook(() => usePromiseState<string>());

    // First set to success
    await act(async () => {
      await result.current.setSuccess('test');
    });
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);

    // Then reset to idle
    act(() => {
      result.current.setIdle();
    });

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  });

  it('should handle different result and error types', async () => {
    const { result } = renderHook(() => usePromiseState<number, string>());

    await act(async () => {
      await result.current.setSuccess(42);
    });
    expect(result.current.result).toBe(42);

    await act(async () => {
      await result.current.setError('custom error');
    });
    expect(result.current.error).toBe('custom error');
  });

  it('should support async callbacks', async () => {
    const mockOnSuccess = vi.fn().mockResolvedValue(undefined);

    const { result } = renderHook(() =>
      usePromiseState<string>({
        onSuccess: mockOnSuccess,
      }),
    );

    await act(async () => {
      await result.current.setSuccess('async success');
    });

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe('async success');
    expect(mockOnSuccess).toHaveBeenCalledWith('async success');
  });

  it('should handle onSuccess callback errors gracefully', async () => {
    const callbackError = new Error('callback failed');
    const mockOnSuccess = vi.fn().mockRejectedValue(callbackError);

    // Spy on console.warn to verify it's called
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {
      });

    const { result } = renderHook(() =>
      usePromiseState<string>({
        onSuccess: mockOnSuccess,
      }),
    );

    await act(async () => {
      await result.current.setSuccess('test result');
    });

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe('test result');
    expect(mockOnSuccess).toHaveBeenCalledWith('test result');
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'PromiseState onSuccess callback error:',
      callbackError,
    );

    consoleWarnSpy.mockRestore();
  });

  it('should handle onError callback errors gracefully', async () => {
    const callbackError = new Error('callback failed');
    const mockOnError = vi.fn().mockRejectedValue(callbackError);
    const stateError = new Error('state error');

    // Spy on console.warn to verify it's called
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {
      });

    const { result } = renderHook(() =>
      usePromiseState<string>({
        onError: mockOnError,
      }),
    );

    await act(async () => {
      await result.current.setError(stateError);
    });

    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.error).toBe(stateError);
    expect(mockOnError).toHaveBeenCalledWith(stateError);
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'PromiseState onError callback error:',
      callbackError,
    );

    consoleWarnSpy.mockRestore();
  });
});
