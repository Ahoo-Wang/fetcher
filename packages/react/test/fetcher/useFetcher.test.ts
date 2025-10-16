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
import { PromiseStatus } from '../../src';

// Mock fetcher
vi.mock('@ahoo-wang/fetcher', async importOriginal => {
  const actual = await importOriginal<typeof import('@ahoo-wang/fetcher')>();
  return {
    ...actual,
    fetcherRegistrar: {},
    getFetcher: vi.fn(),
  };
});

describe('useFetcher', () => {
  let mockExchange: any;
  let mockFetcher: any;

  beforeEach(async () => {
    mockExchange = {
      extractResult: vi.fn(),
    };
    mockFetcher = {
      exchange: vi.fn().mockResolvedValue(mockExchange),
    };
    const { getFetcher } = await import('@ahoo-wang/fetcher');
    vi.mocked(getFetcher).mockReturnValue(mockFetcher);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useFetcher<string>());

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(result.current.exchange).toBeUndefined();
    expect(typeof result.current.execute).toBe('function');
  });

  it('should execute fetch successfully', async () => {
    const mockResult = 'success data';
    mockExchange.extractResult.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useFetcher<string>());

    const request = { url: '/test' };

    await act(async () => {
      await result.current.execute(request);
    });

    expect(mockFetcher.exchange).toHaveBeenCalledWith(request, undefined);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBe(mockResult);
    expect(result.current.exchange).toBe(mockExchange);
  });

  it('should handle fetch error', async () => {
    const error = new Error('fetch failed');
    mockExchange.extractResult.mockRejectedValue(error);

    const { result } = renderHook(() => useFetcher<string>());

    const request = { url: '/test' };

    await act(async () => {
      await result.current.execute(request);
    });

    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should handle abort error', async () => {
    const abortError = new Error('Aborted');
    abortError.name = 'AbortError';
    mockExchange.extractResult.mockRejectedValue(abortError);

    const { result } = renderHook(() => useFetcher<string>());

    const request = { url: '/test' };

    await act(async () => {
      await result.current.execute(request);
    });

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should cancel previous request when executing new one', async () => {
    const mockResult1 = 'result1';
    const mockResult2 = 'result2';
    const mockExchange1 = {
      extractResult: vi.fn().mockResolvedValue(mockResult1),
    };
    const mockExchange2 = {
      extractResult: vi.fn().mockResolvedValue(mockResult2),
    };

    mockFetcher.exchange
      .mockResolvedValueOnce(mockExchange1)
      .mockResolvedValueOnce(mockExchange2);

    const { result } = renderHook(() => useFetcher<string>());

    const request1 = { url: '/test1' };
    const request2 = { url: '/test2' };

    // Start first request
    act(() => {
      result.current.execute(request1);
    });

    // Start second request, should cancel first
    await act(async () => {
      await result.current.execute(request2);
    });

    expect(result.current.result).toBe(mockResult2);
  });

  it('should abort ongoing request when component unmounts', async () => {
    const mockResult = 'success data';
    mockExchange.extractResult.mockResolvedValue(mockResult);

    // Mock AbortController
    const mockAbort = vi.fn();
    global.AbortController = vi.fn().mockImplementation(() => ({
      abort: mockAbort,
    }));

    const { result, unmount } = renderHook(() => useFetcher<string>());

    const request = { url: '/test' };

    // Start a request
    act(() => {
      result.current.execute(request);
    });

    // Unmount the component, should abort the request
    unmount();

    expect(mockAbort).toHaveBeenCalled();
  });
});
