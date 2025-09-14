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
import { useFetcher } from '../../src';
import {
  FetchRequest,
  Fetcher,
  FetchExchange,
} from '@ahoo-wang/fetcher';

// Mock useMountedState to always return true (component is mounted)
vi.mock('react-use/lib/useMountedState', () => () => () => true);

// Mock getFetcher to return the provided fetcher
vi.mock('@ahoo-wang/fetcher', async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    getFetcher: (fetcher: any) => fetcher,
  };
});

describe('useFetcher', () => {
  const mockRequest: FetchRequest = { url: '/test' };
  let originalAbortController: any;

  beforeEach(() => {
    // 保存原始 AbortController
    originalAbortController = global.AbortController;
    vi.clearAllMocks();
  });

  afterEach(() => {
    // 恢复原始 AbortController
    global.AbortController = originalAbortController;
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFetcher(mockRequest, { immediate: false }));

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(result.current.exchange).toBeUndefined();
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
  });

  it('should execute fetch successfully', async () => {
    const mockResult = 'success data';
    const mockExchange: FetchExchange = {
      response: Promise.resolve(new Response()),
      extractResult: vi.fn().mockResolvedValue(mockResult),
    } as any;

    const mockFetcher: Fetcher = {
      exchange: vi.fn().mockResolvedValue(mockExchange),
    };

    const { result } = renderHook(() => useFetcher<string>(mockRequest, { fetcher: mockFetcher, immediate: false }));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.exchange).toBe(mockExchange);
    expect(result.current.result).toBe(mockResult);
    // 检查调用参数，忽略options参数
    expect(mockFetcher.exchange).toHaveBeenCalled();
  }, 10000);

  it('should handle fetch error', async () => {
    const error = new Error('fetch failed');
    const mockFetcher: Fetcher = {
      exchange: vi.fn().mockRejectedValue(error),
    };

    const { result } = renderHook(() => useFetcher(mockRequest, { fetcher: mockFetcher, immediate: false }));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
    expect(result.current.exchange).toBeUndefined();
  }, 10000);

  it('should ignore AbortError', async () => {
    const abortError = new Error('AbortError');
    abortError.name = 'AbortError';
    const mockFetcher: Fetcher = {
      exchange: vi.fn().mockRejectedValue(abortError),
    };

    const { result } = renderHook(() => useFetcher(mockRequest, { fetcher: mockFetcher, immediate: false }));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
  }, 10000);

  it('should not auto-execute if immediate is false', () => {
    const mockResult = 'data';
    const mockExchange: FetchExchange = {
      response: Promise.resolve(new Response()),
      extractResult: vi.fn().mockResolvedValue(mockResult),
    } as any;

    const mockFetcher: Fetcher = {
      exchange: vi.fn().mockResolvedValue(mockExchange),
    };

    renderHook(() => useFetcher(mockRequest, { immediate: false, fetcher: mockFetcher }));

    expect(mockFetcher.exchange).not.toHaveBeenCalled();
  });

  it('should auto-execute by default', () => {
    const mockResult = 'data';
    const mockExchange: FetchExchange = {
      response: Promise.resolve(new Response()),
      extractResult: vi.fn().mockResolvedValue(mockResult),
    } as any;

    const mockFetcher: Fetcher = {
      exchange: vi.fn().mockResolvedValue(mockExchange),
    };

    renderHook(() => useFetcher(mockRequest, { fetcher: mockFetcher }));

    // Should auto-execute by default (immediate = true by default)
    expect(mockFetcher.exchange).toHaveBeenCalled();
  });
});