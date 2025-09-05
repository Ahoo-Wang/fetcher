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

import { describe, expect, it, vi } from 'vitest';
import {
  FetchRequest,
  FetchTimeoutError,
  resolveTimeout,
  timeoutFetch,
} from '../src';

describe('FetchTimeoutError', () => {
  it('should create FetchTimeoutError with correct message', () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      timeout: 1000,
    };

    const error = new FetchTimeoutError(request);
    expect(error).toBeInstanceOf(FetchTimeoutError);
    expect(error.name).toBe('FetchTimeoutError');
    expect(error.message).toBe(
      'Request timeout of 1000ms exceeded for GET https://api.example.com/test',
    );
    expect(error.request).toBe(request);
  });

  it('should handle missing method in request', () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      timeout: 1000,
    } as FetchRequest;

    const error = new FetchTimeoutError(request);
    expect(error.message).toBe(
      'Request timeout of 1000ms exceeded for GET https://api.example.com/test',
    );
  });
});

describe('resolveTimeout', () => {
  it('should return request timeout when defined', () => {
    const result = resolveTimeout(1000, 2000);
    expect(result).toBe(1000);
  });

  it('should return options timeout when request timeout is undefined', () => {
    const result = resolveTimeout(undefined, 2000);
    expect(result).toBe(2000);
  });

  it('should return undefined when both timeouts are undefined', () => {
    const result = resolveTimeout(undefined, undefined);
    expect(result).toBeUndefined();
  });
});

describe('timeoutFetch', () => {
  // Replace global fetch with mock
  const originalFetch = globalThis.fetch;

  it('should delegate to fetch when no timeout is specified', async () => {
    // Set up mock fetch
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch as any;
    const response = new Response('test');
    mockFetch.mockResolvedValue(response);

    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
    };

    const result = await timeoutFetch(request);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      request,
    );
    expect(result).toBe(response);

    // Restore original fetch
    globalThis.fetch = originalFetch;
  });

  it('should delegate to fetch when request.signal is present', async () => {
    // Set up mock fetch
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch as any;
    const response = new Response('test');
    mockFetch.mockResolvedValue(response);

    // Create an AbortController to get a signal
    const controller = new AbortController();

    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      signal: controller.signal,
      timeout: 1000, // Even with timeout, should delegate because signal is present
    };

    const result = await timeoutFetch(request);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      request,
    );
    expect(result).toBe(response);
    // Should not have called abort on the controller
    expect(controller.signal.aborted).toBe(false);

    // Restore original fetch
    globalThis.fetch = originalFetch;
  });

  it('should resolve normally when request completes before timeout', async () => {
    vi.useFakeTimers();

    // Set up mock fetch
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch as any;
    const response = new Response('test');
    mockFetch.mockResolvedValue(response);

    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      timeout: 1000,
    };

    const promise = timeoutFetch(request);

    // Advance timers but not enough to trigger timeout
    vi.advanceTimersByTime(500);

    const result = await promise;
    expect(result).toBe(response);
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );

    // Restore original fetch
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it('should reject with FetchTimeoutError when request times out', async () => {
    vi.useFakeTimers();

    // Set up mock fetch that never resolves
    const mockFetch = vi.fn();
    globalThis.fetch = mockFetch as any;
    mockFetch.mockReturnValue(new Promise(() => {})); // Never resolves

    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      timeout: 1000,
    };

    const promise = timeoutFetch(request);

    // Advance timers to trigger timeout
    vi.advanceTimersByTime(1000);

    await expect(promise).rejects.toThrow(FetchTimeoutError);
    await expect(promise).rejects.toMatchObject({
      message:
        'Request timeout of 1000ms exceeded for GET https://api.example.com/test',
      request: request,
    });

    // Restore original fetch
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });
});