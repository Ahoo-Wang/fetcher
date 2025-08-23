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

import { describe, it, expect, vi } from 'vitest';
import { Fetcher } from '../src';

describe('Fetcher Branch Coverage', () => {
  it('should handle empty headers object (covers line 101)', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
      headers: {}, // Empty headers object
    });

    // Mock fetch to return a response
    const mockFetch = vi.fn().mockResolvedValue(new Response('OK'));
    globalThis.fetch = mockFetch;

    await fetcher.get('/test');

    // Verify that fetch was called with undefined headers (empty object should result in undefined)
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'GET',
        headers: undefined,
      }),
    );
  });

  it('should handle falsy headers (covers line 108)', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://api.example.com',
    });

    // Explicitly set headers to undefined to test the falsy branch
    (fetcher as any).headers = undefined;

    // Mock fetch to return a response
    const mockFetch = vi.fn().mockResolvedValue(new Response('OK'));
    globalThis.fetch = mockFetch;

    await fetcher.get('/test', {
      headers: undefined, // Also undefined request headers
    });

    // Verify that fetch was called
    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/test',
      expect.objectContaining({
        method: 'GET',
      }),
    );
  });
});
