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
import { useDebouncedFetcher } from '../../src';
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

describe('useDebouncedFetcher', () => {
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
    vi.useRealTimers();
  });

  describe('initialization', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      expect(result.current.status).toBe(PromiseStatus.IDLE);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.result).toBeUndefined();
      expect(result.current.exchange).toBeUndefined();
      expect(typeof result.current.run).toBe('function');
      expect(typeof result.current.cancel).toBe('function');
      expect(typeof result.current.isPending).toBe('function');
    });

    it('should initialize with custom fetcher options', () => {
      const customFetcher = 'custom-fetcher';
      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          fetcher: customFetcher,
          debounce: { delay: 100 },
        }),
      );

      expect(result.current.status).toBe(PromiseStatus.IDLE);
      expect(result.current.loading).toBe(false);
    });

    it('should initialize with promise state options', () => {
      const onSuccess = vi.fn();
      const onError = vi.fn();
      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
          onSuccess,
          onError,
        }),
      );

      expect(result.current.status).toBe(PromiseStatus.IDLE);
    });
  });

  describe('debounced execution', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should debounce fetch execution with default trailing behavior', async () => {
      const mockResult = 'success data';
      mockExchange.extractResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      expect(result.current.isPending()).toBe(true);
      expect(result.current.loading).toBe(false);
      expect(mockFetcher.exchange).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.isPending()).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.status).toBe(PromiseStatus.SUCCESS);
      expect(result.current.result).toBe(mockResult);
      expect(mockFetcher.exchange).toHaveBeenCalledWith(
        request,
        expect.any(Object),
      );
    });

    it('should reset debounce timer on subsequent calls', async () => {
      const mockResult = 'success data';
      mockExchange.extractResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      act(() => {
        result.current.run(request);
      });

      act(() => {
        vi.advanceTimersByTime(50);
      });

      expect(mockFetcher.exchange).not.toHaveBeenCalled();

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(mockFetcher.exchange).toHaveBeenCalledTimes(1);
    });

    it('should handle multiple rapid calls correctly', async () => {
      const mockResult = 'success data';
      mockExchange.extractResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
        result.current.run(request);
        result.current.run(request);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockFetcher.exchange).toHaveBeenCalledTimes(1);
    });

    it('should work with zero delay', async () => {
      const mockResult = 'success data';
      mockExchange.extractResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 0 },
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      await act(async () => {
        vi.runOnlyPendingTimers();
      });

      expect(mockFetcher.exchange).toHaveBeenCalledTimes(1);
      expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    });
  });

  describe('cancellation', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should cancel pending debounced execution', async () => {
      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      expect(result.current.isPending()).toBe(true);

      act(() => {
        vi.advanceTimersByTime(50);
        result.current.cancel();
      });

      expect(result.current.isPending()).toBe(false);

      await act(async () => {
        vi.advanceTimersByTime(50);
      });

      expect(mockFetcher.exchange).not.toHaveBeenCalled();
    });

    it('should cancel and reset state properly', async () => {
      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      expect(result.current.isPending()).toBe(true);
      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.cancel();
      });

      expect(result.current.isPending()).toBe(false);
      expect(result.current.loading).toBe(false);
      expect(result.current.status).toBe(PromiseStatus.IDLE);
    });
  });

  describe('error handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should handle fetch errors in debounced execution', async () => {
      const error = new Error('fetch failed');
      mockExchange.extractResult.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.status).toBe(PromiseStatus.ERROR);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(error);
      expect(result.current.result).toBeUndefined();
    });

    it('should handle abort errors gracefully', async () => {
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockExchange.extractResult.mockRejectedValue(abortError);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(result.current.status).toBe(PromiseStatus.IDLE);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeUndefined();
      expect(result.current.result).toBeUndefined();
    });

    it('should handle errors with onError callback', async () => {
      const error = new Error('fetch failed');
      const onError = vi.fn();
      mockExchange.extractResult.mockRejectedValue(error);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
          onError,
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onError).toHaveBeenCalledWith(error);
    });
  });

  describe('success handling', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should handle successful fetch with onSuccess callback', async () => {
      const mockResult = 'success data';
      const onSuccess = vi.fn();
      mockExchange.extractResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
          onSuccess,
        }),
      );

      const request = { url: '/test' };

      act(() => {
        result.current.run(request);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(onSuccess).toHaveBeenCalledWith(mockResult);
      expect(result.current.result).toBe(mockResult);
    });

    it('should pass arguments correctly to the underlying execute function', async () => {
      const mockResult = 'success data';
      mockExchange.extractResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const request = {
        url: '/test',
        method: 'POST' as const,
        body: { data: 'test' },
        headers: { 'Content-Type': 'application/json' },
      };

      act(() => {
        result.current.run(request);
      });

      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(mockFetcher.exchange).toHaveBeenCalledWith(
        request,
        expect.any(Object),
      );
    });
  });

  describe('memoization', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('should return the same object reference when state does not change', () => {
      const { result, rerender } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const firstResult = result.current;

      rerender();

      expect(result.current).toBe(firstResult);
    });

    it('should return new object when state changes', async () => {
      const mockResult = 'success data';
      mockExchange.extractResult.mockResolvedValue(mockResult);

      const { result } = renderHook(() =>
        useDebouncedFetcher<string>({
          debounce: { delay: 100 },
        }),
      );

      const firstResult = result.current;

      const request = { url: '/test' };

      await act(async () => {
        result.current.run(request);
        vi.advanceTimersByTime(100);
      });

      expect(result.current).not.toBe(firstResult);
      expect(result.current.result).toBe(mockResult);
    });
  });

  describe('options validation', () => {
    it('should throw error when both leading and trailing are false', () => {
      expect(() => {
        renderHook(() =>
          useDebouncedFetcher<string>({
            debounce: { delay: 100, leading: false, trailing: false },
          }),
        );
      }).toThrow(
        'useDebouncedCallback: at least one of leading or trailing must be true',
      );
    });
  });
});
