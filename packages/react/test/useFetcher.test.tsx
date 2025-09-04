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
import { renderHook } from '@testing-library/react';
import type { Fetcher } from '@ahoo-wang/fetcher';
import { useFetcher } from '../src';

// Mock the fetcher
const mockFetch = vi.fn();

const mockFetcher = {
  fetch: mockFetch,
} as unknown as Fetcher;

describe('useFetcher', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should automatically execute the request on mount', async () => {
    const mockResponse = new Response(JSON.stringify({ data: 'test' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    mockFetch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() =>
      useFetcher({ url: '/api/test' }, { fetcher: mockFetcher }),
    );

    expect(result.current.loading).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ url: '/api/test' }));
  });

  it('should handle request errors', async () => {
    const mockError = new Error('Network error');
    mockFetch.mockRejectedValue(mockError);

    const { result } = renderHook(() =>
      useFetcher({ url: '/api/test' }, { fetcher: mockFetcher }),
    );

    expect(result.current.loading).toBe(true);

    // Wait for promise resolution
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(result.current.error).toEqual(mockError);
    expect(result.current.data).toBeUndefined();
  });

  it('should not auto execute when autoExecute is false', async () => {
    mockFetch.mockResolvedValue(new Response(JSON.stringify({ data: 'test' })));

    const { result } = renderHook(() =>
      useFetcher({ url: '/api/test' }, { fetcher: mockFetcher, autoExecute: false }),
    );

    expect(result.current.loading).toBe(false);
    expect(mockFetch).not.toHaveBeenCalled();

    // Manually execute
    await result.current.execute();

    expect(result.current.loading).toBe(false);
    expect(mockFetch).toHaveBeenCalledWith('/api/test', expect.objectContaining({ url: '/api/test' }));
  });
});