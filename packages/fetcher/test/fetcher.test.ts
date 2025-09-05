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
  DEFAULT_OPTIONS,
  Fetcher, FetcherError,
  FetchRequest,
  HttpMethod,
} from '../src';

describe('Fetcher', () => {
  it('should create Fetcher with default options', () => {
    const fetcher = new Fetcher();

    expect(fetcher).toBeInstanceOf(Fetcher);
    expect(fetcher.urlBuilder.baseURL).toBe(DEFAULT_OPTIONS.baseURL);
    expect(fetcher.headers).toEqual(DEFAULT_OPTIONS.headers);
    expect(fetcher.timeout).toBeUndefined();
    expect(fetcher.interceptors).toBeDefined();
  });

  it('should create Fetcher with custom options', () => {
    const options = {
      baseURL: 'https://api.example.com',
      headers: { Authorization: 'Bearer token' },
      timeout: 5000,
    };

    const fetcher = new Fetcher(options);

    expect(fetcher.urlBuilder.baseURL).toBe(options.baseURL);
    expect(fetcher.headers).toEqual(options.headers);
    expect(fetcher.timeout).toBe(options.timeout);
  });

  it('should handle missing headers in options', () => {
    const options = {
      baseURL: 'https://api.example.com',
    };

    const fetcher = new Fetcher(options as any);

    expect(fetcher.headers).toEqual(DEFAULT_OPTIONS.headers);
  });

  it('should handle missing interceptors in options', () => {
    const options = {
      baseURL: 'https://api.example.com',
    };

    const fetcher = new Fetcher(options as any);

    expect(fetcher.interceptors).toBeDefined();
  });

  it('should make GET request', async () => {
    const fetcher = new Fetcher();
    const mockResponse = new Response('test');

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        exchange.response = mockResponse;
        return exchange;
      });

    const response = await fetcher.get('/users');

    expect(response).toBe(mockResponse);
    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should make POST request', async () => {
    const fetcher = new Fetcher();
    const mockResponse = new Response('test');

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        exchange.response = mockResponse;
        return exchange;
      });

    const response = await fetcher.post('/users', { body: { name: 'test' } });

    expect(response).toBe(mockResponse);
    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should make PUT request', async () => {
    const fetcher = new Fetcher();
    const mockResponse = new Response('test');

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        exchange.response = mockResponse;
        return exchange;
      });

    const response = await fetcher.put('/users/1', { body: { name: 'test' } });

    expect(response).toBe(mockResponse);
    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should make DELETE request', async () => {
    const fetcher = new Fetcher();
    const mockResponse = new Response('test');

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        exchange.response = mockResponse;
        return exchange;
      });

    const response = await fetcher.delete('/users/1');

    expect(response).toBe(mockResponse);
    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should make PATCH request', async () => {
    const fetcher = new Fetcher();
    const mockResponse = new Response('test');

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        exchange.response = mockResponse;
        return exchange;
      });

    const response = await fetcher.patch('/users/1', {
      body: { name: 'test' },
    });

    expect(response).toBe(mockResponse);
    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should make HEAD request', async () => {
    const fetcher = new Fetcher();
    const mockResponse = new Response(null, { status: 200 });

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        exchange.response = mockResponse;
        return exchange;
      });

    const response = await fetcher.head('/users');

    expect(response).toBe(mockResponse);
    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should make OPTIONS request', async () => {
    const fetcher = new Fetcher();
    const mockResponse = new Response(null, { status: 200 });

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        exchange.response = mockResponse;
        return exchange;
      });

    const response = await fetcher.options('/users');

    expect(response).toBe(mockResponse);
    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should call fetch method with correct parameters', async () => {
    const fetcher = new Fetcher();
    const mockResponse = new Response('test');

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        exchange.response = mockResponse;
        return exchange;
      });

    const response = await fetcher.fetch('/users', { method: HttpMethod.GET });

    expect(response).toBe(mockResponse);
    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should throw FetcherError when no response is returned', async () => {
    const fetcher = new Fetcher();

    // Mock the interceptors.exchange method to not set a response
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        return exchange;
      });

    await expect(fetcher.get('/users')).rejects.toThrow(FetcherError);

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should merge headers correctly in request method', async () => {
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const fetcher = new Fetcher({ baseURL: '', headers: defaultHeaders });
    const requestHeaders = { Authorization: 'Bearer token' };
    const request: FetchRequest = {
      url: '/users',
      headers: requestHeaders,
    };

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        // Verify that headers are merged correctly
        expect(exchange.request.headers).toEqual({
          'Content-Type': 'application/json',
          Authorization: 'Bearer token',
        });
        exchange.response = new Response('test');
        return exchange;
      });

    await fetcher.request(request);

    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should resolve timeout correctly in request method', async () => {
    const fetcher = new Fetcher({ baseURL: '', timeout: 5000 });
    const request: FetchRequest = {
      url: '/users',
      timeout: 3000,
    };

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        // Verify that request timeout takes precedence
        expect(exchange.request.timeout).toBe(3000);
        exchange.response = new Response('test');
        return exchange;
      });

    await fetcher.request(request);

    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });

  it('should use fetcher timeout when request timeout is not specified', async () => {
    const fetcherTimeout = 5000;
    const fetcher = new Fetcher({ baseURL: '', timeout: fetcherTimeout });
    const request: FetchRequest = {
      url: '/users',
    };

    // Mock the interceptors.exchange method
    const exchangeSpy = vi
      .spyOn(fetcher.interceptors, 'exchange')
      .mockImplementation(async exchange => {
        // Verify that fetcher timeout is used
        expect(exchange.request.timeout).toBe(fetcherTimeout);
        exchange.response = new Response('test');
        return exchange;
      });

    await fetcher.request(request);

    expect(exchangeSpy).toHaveBeenCalled();

    // Clean up spy
    exchangeSpy.mockRestore();
  });
});
