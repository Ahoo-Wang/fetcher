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
import type { FetchRequest } from '../src';
import { FetchTimeoutError, resolveTimeout, timeoutFetch } from '../src';
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

  it('should not abort the caller signal on success', async () => {
    const controller = new AbortController();
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      signal: controller.signal,
      timeout: 1000,
    };

    const result = await timeoutFetch(request);
    expect(await result.text()).toBe('test');
    expect(controller.signal.aborted).toBe(false);
  });

  it('should enforce the timeout when the caller also passes a signal', async () => {
    const controller = new AbortController();
    const request: FetchRequest = {
      url: 'https://api.example.com/slow',
      signal: controller.signal,
      timeout: 50,
    };

    await expect(timeoutFetch(request)).rejects.toThrow(FetchTimeoutError);
    // The timeout aborts the request, not the caller's signal.
    expect(controller.signal.aborted).toBe(false);
  });

  it.each(['signal', 'abortController'] as const)(
    'should reject with the caller reason when the caller %s aborts before the timeout',
    async source => {
      const controller = new AbortController();
      const request: FetchRequest = {
        url: 'https://api.example.com/slow',
        timeout: 1000,
        ...(source === 'signal'
          ? { signal: controller.signal }
          : { abortController: controller }),
      };
      const reason = new Error('user cancelled');
      setTimeout(() => controller.abort(reason), 20);

      await expect(timeoutFetch(request)).rejects.toBe(reason);
    },
  );

  describe('without AbortSignal.any', () => {
    const any = AbortSignal.any;
    beforeAll(() => {
      (AbortSignal as any).any = undefined;
    });
    afterAll(() => {
      AbortSignal.any = any;
    });

    it('should still reject with the caller reason and detach its listener', async () => {
      const controller = new AbortController();
      const remove = vi.spyOn(controller.signal, 'removeEventListener');
      const reason = new Error('user cancelled');
      setTimeout(() => controller.abort(reason), 20);

      await expect(
        timeoutFetch({
          url: 'https://api.example.com/slow',
          timeout: 1000,
          signal: controller.signal,
        }),
      ).rejects.toBe(reason);
      expect(remove).toHaveBeenCalledWith('abort', expect.any(Function));
    });

    it('should still time out and detach from a caller signal that never aborts', async () => {
      const controller = new AbortController();
      const remove = vi.spyOn(controller.signal, 'removeEventListener');

      await expect(
        timeoutFetch({
          url: 'https://api.example.com/slow',
          timeout: 50,
          signal: controller.signal,
        }),
      ).rejects.toThrow(FetchTimeoutError);
      expect(remove).toHaveBeenCalled();
    });

    it('should reject with the reason of an already aborted caller signal', async () => {
      const controller = new AbortController();
      const reason = new Error('already cancelled');
      controller.abort(reason);

      await expect(
        timeoutFetch({
          url: 'https://api.example.com/test',
          timeout: 1000,
          signal: controller.signal,
        }),
      ).rejects.toBe(reason);
    });
  });

  it('should not write to the request', async () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      timeout: 1000,
    };
    const keys = Object.keys(request);

    await timeoutFetch(request);

    expect(Object.keys(request)).toEqual(keys);
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

  // BUG: after a timeout, timeoutFetch writes the (now permanently aborted)
  // AbortController back onto `request.abortController` and its signal onto
  // `request` (RequestInit). A retry that reuses the SAME request object (the
  // standard error-interceptor retry pattern) then hits an already-aborted
  // controller/signal: in a real browser the retried fetch rejects
  // immediately (AbortError) instead of performing the retry. Retries are
  // impossible after any timeout.
  it('should not pollute the request with an aborted controller after a timeout (retry must still work)', async () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/retry',
      method: 'GET',
      timeout: 100,
    };

    // First attempt: slow endpoint → times out.
    server.use(
      http.get('https://api.example.com/retry', async () => {
        await delay(150);
        return HttpResponse.text('slow');
      }),
    );
    await expect(timeoutFetch(request)).rejects.toThrow(FetchTimeoutError);

    // Retry: replace the slow handler with a fast one for the same URL.
    server.resetHandlers();
    server.use(
      http.get('https://api.example.com/retry', () => HttpResponse.text('ok')),
    );
    // A retry reusing the same request object must succeed — NOT fail due to
    // a controller/signal that was polluted by the prior timeout.
    const response = await timeoutFetch(request);
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('ok');
  });

  // BUG (mirror of the timeout-failure pollution fixed above): on the SUCCESS
  // path the internal AbortController and its signal stay written on the
  // caller's request object. A later call reusing the SAME request object then
  // hits the `if (request.signal)` delegation branch and the timeout is
  // silently ignored.
  it('should not leave an internal controller/signal on the request after a successful call', async () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      timeout: 100,
    };

    const response = await timeoutFetch(request);
    expect(response.status).toBe(200);

    expect(request.signal).toBeUndefined();
    expect(request.abortController).toBeUndefined();
  });

  it('should still enforce the timeout when reusing a request object after a successful call', async () => {
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      timeout: 100,
    };

    // First attempt: fast endpoint → succeeds.
    const response = await timeoutFetch(request);
    expect(response.status).toBe(200);

    // Second call reusing the SAME request object against a slow endpoint
    // must still enforce the timeout — NOT delegate to plain fetch because of
    // a signal left behind by the first call.
    server.use(
      http.get('https://api.example.com/test', async () => {
        await delay(150);
        return HttpResponse.text('slow');
      }),
    );
    await expect(timeoutFetch(request)).rejects.toThrow(FetchTimeoutError);
  });

  it('should reuse a caller-supplied, non-aborted AbortController', async () => {
    const userController = new AbortController();
    const request: FetchRequest = {
      url: 'https://api.example.com/test',
      method: 'GET',
      timeout: 100,
      abortController: userController,
    };

    await timeoutFetch(request);

    // The caller's controller must be reused (not replaced) so external abort
    // still works.
    expect(request.abortController).toBe(userController);
    expect(userController.signal.aborted).toBe(false);
  });

  it('should not abort a caller-supplied AbortController on timeout', async () => {
    const userController = new AbortController();
    const request: FetchRequest = {
      url: 'https://api.example.com/slow',
      timeout: 50,
      abortController: userController,
    };

    await expect(timeoutFetch(request)).rejects.toThrow(FetchTimeoutError);
    // Aborting it would make the caller read a timeout as its own cancel.
    expect(userController.signal.aborted).toBe(false);
  });
});
