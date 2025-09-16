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

import { describe, expect, it, beforeAll, afterAll, afterEach } from 'vitest';
import {
  FetchRequest,
  FetchTimeoutError,
  resolveTimeout,
  timeoutFetch,
} from '../src';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';

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
  const server = setupServer(
    http.get('https://api.example.com/test', () => {
      return HttpResponse.text('test');
    }),
    http.get('https://api.example.com/slow', async () => {
      await delay(150);
      return HttpResponse.text('slow response');
    }),
  );

  beforeAll(() => server.listen());
  afterAll(() => server.close());
  afterEach(() => server.resetHandlers());

  it('should delegate to fetch when no timeout is specified', async () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
    };

    const result = await timeoutFetch(request);
    expect(result.status).toBe(200);

    const text = await result.text();
    expect(text).toBe('test');
  });

  it('should delegate to fetch when request.signal is present', async () => {
    // Create an AbortController to get a signal
    const controller = new AbortController();

    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      signal: controller.signal,
      timeout: 1000, // Even with timeout, should delegate because signal is present
    };

    const result = await timeoutFetch(request);
    expect(result.status).toBe(200);

    const text = await result.text();
    expect(text).toBe('test');
    // Should not have called abort on the controller
    expect(controller.signal.aborted).toBe(false);
  });

  it('should use abortController signal when no timeout is specified but abortController is provided', async () => {
    // Create an AbortController
    const controller = new AbortController();

    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      abortController: controller,
    };

    const result = await timeoutFetch(request);
    expect(result.status).toBe(200);

    const text = await result.text();
    expect(text).toBe('test');
  });

  it('should resolve normally when request completes before timeout', async () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      timeout: 1000,
    };

    const result = await timeoutFetch(request);
    expect(result.status).toBe(200);

    const text = await result.text();
    expect(text).toBe('test');
  });

  it('should reject with FetchTimeoutError when request times out', async () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/slow',
      method: 'GET',
      timeout: 100,
    };

    await expect(timeoutFetch(request)).rejects.toThrow(FetchTimeoutError);
    await expect(timeoutFetch(request)).rejects.toMatchObject({
      message:
        'Request timeout of 100ms exceeded for GET https://api.example.com/slow',
      request: request,
    });
  });
});
