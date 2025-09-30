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
import { useExecutePromise, PromiseStatus } from '../../src/core';

// Mock useMountedState to always return true (component is mounted)
vi.mock('react-use/lib/useMountedState', () => () => () => true);

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
      await expect(result.current.execute(mockProvider)).rejects.toThrow(error);
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
});