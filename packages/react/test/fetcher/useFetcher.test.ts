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
    expect(typeof result.current.reset).toBe('function');
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

  it('should pass abortController to the request', async () => {
    const mockResult = 'success data';
    mockExchange.extractResult.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useFetcher<string>());

    const request = { url: '/test' };

    await act(async () => {
      await result.current.execute(request);
    });

    // Verify that the request object received an abortController
    const callArgs = mockFetcher.exchange.mock.calls[0][0];
    expect(callArgs.abortController).toBeDefined();
    expect(typeof callArgs.abortController.abort).toBe('function');
  });

  it('should pass options to underlying fetcher', async () => {
    const mockResult = 'success data';
    mockExchange.extractResult.mockResolvedValue(mockResult);

    const options = {
      resultExtractor: vi.fn(),
      onSuccess: vi.fn(),
    };

    const { result } = renderHook(() => useFetcher<string>(options));

    const request = { url: '/test' };

    await act(async () => {
      await result.current.execute(request);
    });

    expect(mockFetcher.exchange).toHaveBeenCalledWith(request, options);
  });

  it('should handle race conditions with multiple rapid requests', async () => {
    const mockResult1 = 'result1';
    const mockResult2 = 'result2';
    const mockResult3 = 'result3';

    const mockExchange1 = {
      extractResult: vi.fn().mockResolvedValue(mockResult1),
    };
    const mockExchange2 = {
      extractResult: vi.fn().mockResolvedValue(mockResult2),
    };
    const mockExchange3 = {
      extractResult: vi.fn().mockResolvedValue(mockResult3),
    };

    mockFetcher.exchange
      .mockResolvedValueOnce(mockExchange1)
      .mockResolvedValueOnce(mockExchange2)
      .mockResolvedValueOnce(mockExchange3);

    const { result } = renderHook(() => useFetcher<string>());

    // Start multiple requests rapidly
    await act(async () => {
      result.current.execute({ url: '/test1' });
      result.current.execute({ url: '/test2' });
      await result.current.execute({ url: '/test3' });
    });

    // Should only have the result from the last request
    expect(result.current.result).toBe(mockResult3);
    expect(result.current.exchange).toBe(mockExchange3);
  });

  it('should maintain correct state during loading', async () => {
    const mockResult = 'success data';
    mockExchange.extractResult.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useFetcher<string>());

    const request = { url: '/test' };

    // Start request
    act(() => {
      result.current.execute(request);
    });

    // Should be loading immediately
    expect(result.current.loading).toBe(true);
    expect(result.current.status).toBe(PromiseStatus.LOADING);

    // Wait for completion
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle error with propagateError option', async () => {
    const error = new Error('fetch failed');
    mockExchange.extractResult.mockRejectedValue(error);

    const { result } = renderHook(() =>
      useFetcher<string>({ propagateError: true }),
    );

    const request = { url: '/test' };

    // When propagateError is true, the error should be thrown and state should remain idle
    await expect(
      act(async () => {
        await result.current.execute(request);
      }),
    ).rejects.toThrow('fetch failed');

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.error).toBeUndefined();
  });

  it('should reset state and exchange correctly', async () => {
    const mockResult = 'success data';
    mockExchange.extractResult.mockResolvedValue(mockResult);

    const { result } = renderHook(() => useFetcher<string>());

    // First execute a successful request
    const request = { url: '/test' };
    await act(async () => {
      await result.current.execute(request);
    });

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);
    expect(result.current.exchange).toBe(mockExchange);

    // Now reset
    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.exchange).toBeUndefined();
  });

  it('should abort ongoing request manually', async () => {
    const onAbortMock = vi.fn();
    const mockResult = 'success data';
    // Make the mock take longer so we can abort it
    mockExchange.extractResult.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockResult), 100)),
    );

    const { result } = renderHook(() =>
      useFetcher<string>({ onAbort: onAbortMock }),
    );

    const request = { url: '/test' };

    // Start request
    act(() => {
      result.current.execute(request);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.status).toBe(PromiseStatus.LOADING);

    // Abort the request
    await act(async () => {
      await result.current.abort();
    });

    expect(onAbortMock).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should handle abort when no request is ongoing', async () => {
    const { result } = renderHook(() => useFetcher<string>());

    // Try to abort when no request is running
    await act(async () => {
      await result.current.abort();
    });

    // Should not change state
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should call onAbort callback when request is aborted manually', async () => {
    const onAbortMock = vi.fn();
    const mockResult = 'success data';
    mockExchange.extractResult.mockImplementation(
      () => new Promise(resolve => setTimeout(() => resolve(mockResult), 100)),
    );

    const { result } = renderHook(() =>
      useFetcher<string>({ onAbort: onAbortMock }),
    );

    const request = { url: '/test' };

    // Start request
    act(() => {
      result.current.execute(request);
    });

    // Abort the request
    await act(async () => {
      await result.current.abort();
    });

    expect(onAbortMock).toHaveBeenCalledTimes(1);
  });

  it('should abort previous request when starting new one', async () => {
    const onAbortMock = vi.fn();
    const mockResult1 = 'result1';
    const mockResult2 = 'result2';

    const mockExchange1 = {
      extractResult: vi
        .fn()
        .mockImplementation(
          () =>
            new Promise(resolve => setTimeout(() => resolve(mockResult1), 200)),
        ),
    };
    const mockExchange2 = {
      extractResult: vi.fn().mockResolvedValue(mockResult2),
    };

    mockFetcher.exchange
      .mockResolvedValueOnce(mockExchange1)
      .mockResolvedValueOnce(mockExchange2);

    const { result } = renderHook(() =>
      useFetcher<string>({ onAbort: onAbortMock }),
    );

    // Start first request
    act(() => {
      result.current.execute({ url: '/test1' });
    });

    expect(result.current.loading).toBe(true);

    // Start second request (should abort first)
    await act(async () => {
      await result.current.execute({ url: '/test2' });
    });

    expect(onAbortMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult2);
  });
});
