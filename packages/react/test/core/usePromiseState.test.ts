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
import { usePromiseState, PromiseStatus } from '../../src/core';

// Mock useMountedState to always return true (component is mounted)
vi.mock('react-use/lib/useMountedState', () => () => () => true);

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

  it('should set success state and call onSuccess callback', () => {
    const mockResult = 'test result';
    const { result } = renderHook(() =>
      usePromiseState<string>({ onSuccess: mockOnSuccess }),
    );

    act(() => {
      result.current.setSuccess(mockResult);
    });

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe(mockResult);
    expect(result.current.error).toBeUndefined();
    expect(mockOnSuccess).toHaveBeenCalledWith(mockResult);
  });

  it('should set error state and call onError callback', () => {
    const mockError = new Error('test error');
    const { result } = renderHook(() =>
      usePromiseState<string>({ onError: mockOnError }),
    );

    act(() => {
      result.current.setError(mockError);
    });

    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBe(mockError);
    expect(mockOnError).toHaveBeenCalledWith(mockError);
  });

  it('should set idle state', () => {
    const { result } = renderHook(() => usePromiseState<string>());

    // First set to success
    act(() => {
      result.current.setSuccess('test');
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

  it('should handle different result and error types', () => {
    const { result } = renderHook(() => usePromiseState<number, string>());

    act(() => {
      result.current.setSuccess(42);
    });
    expect(result.current.result).toBe(42);

    act(() => {
      result.current.setError('custom error');
    });
    expect(result.current.error).toBe('custom error');
  });
});
