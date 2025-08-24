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

import { describe, it, expect, vi, afterEach } from 'vitest';
import { NamedFetcher } from '../src';
import { fetcherRegistrar } from '../src';
import { Fetcher } from '../src';

// Mock fetch
const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

describe('NamedFetcher', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    mockFetch.mockClear();

    // Clear all registered fetchers after each test
    for (const [name] of fetcherRegistrar.fetchers) {
      fetcherRegistrar.unregister(name);
    }
  });

  it('should create NamedFetcher with default options and register it', () => {
    const fetcherName = 'test-fetcher';
    const fetcher = new NamedFetcher(fetcherName);

    // Check that the fetcher is properly created
    expect(fetcher).toBeInstanceOf(NamedFetcher);
    expect(fetcher).toBeInstanceOf(Fetcher);
    expect(fetcher.name).toBe(fetcherName);

    // Check that the fetcher is registered
    const registeredFetcher = fetcherRegistrar.get(fetcherName);
    expect(registeredFetcher).toBe(fetcher);
  });

  it('should create NamedFetcher with custom options and register it', () => {
    const fetcherName = 'api-fetcher';
    const options = {
      baseURL: 'https://api.example.com',
      timeout: 5000,
      headers: { Authorization: 'Bearer token' },
    };

    const fetcher = new NamedFetcher(fetcherName, options);

    // Check that the fetcher is properly created with custom options
    expect(fetcher).toBeInstanceOf(NamedFetcher);
    expect(fetcher.name).toBe(fetcherName);
    expect(fetcher.timeout).toBe(options.timeout);

    // Check that the fetcher is registered
    const registeredFetcher = fetcherRegistrar.get(fetcherName);
    expect(registeredFetcher).toBe(fetcher);
  });

  it('should make HTTP requests normally', async () => {
    const fetcherName = 'request-test-fetcher';
    const fetcher = new NamedFetcher(fetcherName, {
      baseURL: 'https://api.example.com',
    });

    mockFetch.mockResolvedValue(new Response('OK'));

    const response = await fetcher.get('/users');

    expect(mockFetch).toHaveBeenCalledWith(
      'https://api.example.com/users',
      expect.objectContaining({
        method: 'GET',
      }),
    );
    expect(response).toBeInstanceOf(Response);
  });

  it('should register fetcher with the same name overwrite the previous one', () => {
    const fetcherName = 'overwrite-test';
    const fetcher1 = new NamedFetcher(fetcherName, {
      baseURL: 'https://api1.example.com',
    });
    const fetcher2 = new NamedFetcher(fetcherName, {
      baseURL: 'https://api2.example.com',
    });

    // Check that the second fetcher overwrites the first one
    const registeredFetcher = fetcherRegistrar.get(fetcherName);
    expect(registeredFetcher).toBe(fetcher2);
    expect(registeredFetcher).not.toBe(fetcher1);
  });

  it('should work with fetcherRegistrar to retrieve the same instance', () => {
    const fetcherName = 'retrieval-test';
    const fetcher = new NamedFetcher(fetcherName, {
      baseURL: 'https://api.example.com',
    });

    // Retrieve the fetcher using fetcherRegistrar
    const retrievedFetcher = fetcherRegistrar.get(fetcherName);
    expect(retrievedFetcher).toBe(fetcher);

    // Use requiredGet as well
    const requiredFetcher = fetcherRegistrar.requiredGet(fetcherName);
    expect(requiredFetcher).toBe(fetcher);
  });

  it('should handle multiple named fetchers', () => {
    const fetcher1 = new NamedFetcher('api1', {
      baseURL: 'https://api1.example.com',
    });
    const fetcher2 = new NamedFetcher('api2', {
      baseURL: 'https://api2.example.com',
    });

    // Check that both fetchers are registered
    const registeredFetcher1 = fetcherRegistrar.get('api1');
    const registeredFetcher2 = fetcherRegistrar.get('api2');

    expect(registeredFetcher1).toBe(fetcher1);
    expect(registeredFetcher2).toBe(fetcher2);
    expect(registeredFetcher1).not.toBe(registeredFetcher2);
  });
});
