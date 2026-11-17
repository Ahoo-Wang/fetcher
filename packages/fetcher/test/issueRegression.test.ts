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
  ExchangeError,
  Fetcher,
  FetchTimeoutError,
  timeoutFetch,
  mergeQuery,
  mergeRequest,
  ResultExtractors,
  UrlTemplateStyle,
  expressUrlTemplateResolver,
  uriTemplateResolver,
} from '../src';

function recordingFetcher(
  respond: () => Response | Promise<Response> = () => new Response('{}'),
  urlTemplateStyle?: UrlTemplateStyle,
) {
  const sent: { url: string; contentType: string | null; body: string }[] = [];
  const fetch = vi.fn(async (url: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(url, init);
    sent.push({
      url: request.url,
      contentType: request.headers.get('content-type'),
      body: await request.text(),
    });
    return respond();
  });
  const fetcher = new Fetcher({
    baseURL: 'https://example.test',
    fetch,
    urlTemplateStyle,
  });
  return { fetcher, sent, fetch };
}

describe('URLSearchParams query (#1988)', () => {
  const query = () =>
    new URLSearchParams([
      ['tag', 'a'],
      ['tag', 'b'],
    ]);

  it('keeps every value through get(), fetch() and request()', async () => {
    const { fetcher, sent } = recordingFetcher();
    const input = query();
    await fetcher.get('/users', { urlParams: { query: input } });
    await fetcher.fetch('/users', { urlParams: { query: input } });
    await fetcher.request({ url: '/users', urlParams: { query: input } });
    for (const { url } of sent) {
      expect(url).toBe('https://example.test/users?tag=a&tag=b');
    }
    expect([...input]).toEqual([
      ['tag', 'a'],
      ['tag', 'b'],
    ]);
  });

  it('gives the exchange its own copy', () => {
    const { fetcher } = recordingFetcher();
    const input = query();
    const exchange = fetcher.resolveExchange({
      url: '/users',
      urlParams: { query: input },
    });
    const copy = exchange.request.urlParams?.query;
    expect(copy).toBeInstanceOf(URLSearchParams);
    expect(copy).not.toBe(input);
    expect(String(copy)).toBe('tag=a&tag=b');
  });

  it('merges with URLSearchParams on either side', () => {
    const merged = mergeQuery({ page: 1, tag: 'x' }, query());
    expect(String(merged)).toBe('page=1&tag=a&tag=b');
    const reversed = mergeQuery(query(), { tag: 'c', page: 2 });
    expect(String(reversed)).toBe('tag=c&page=2');
    expect(mergeQuery({ a: 1 }, { b: 2 })).toEqual({ a: 1, b: 2 });
    expect(mergeQuery(undefined, undefined)).toBeUndefined();
  });

  it('survives mergeRequest', () => {
    const merged = mergeRequest(
      { urlParams: { query: { page: 1 } } },
      { urlParams: { query: query() } },
    );
    expect(String(merged.urlParams?.query)).toBe('page=1&tag=a&tag=b');
  });
});

describe('nullish rejection reasons (#2016)', () => {
  it.each([undefined, null])(
    'rejects when an error interceptor rejects with %s',
    async reason => {
      const { fetcher } = recordingFetcher(
        () => new Response('upstream unavailable', { status: 503 }),
      );
      fetcher.interceptors.error.use({
        name: 'failed-recovery',
        order: 0,
        intercept: () => Promise.reject(reason),
      });
      await expect(fetcher.get('/fail')).rejects.toBeInstanceOf(ExchangeError);
    },
  );

  it.each([undefined, null])(
    'rejects request() when fetch rejects with %s',
    async reason => {
      const fetcher = new Fetcher({
        baseURL: 'https://example.test',
        fetch: () => Promise.reject(reason),
      });
      const rejection = fetcher.request({ url: '/fail' });
      await expect(rejection).rejects.toBeInstanceOf(ExchangeError);
      await expect(rejection).rejects.toThrow(`Rejected with ${reason}`);
    },
  );

  it.each([undefined, null])(
    'shows error interceptors an error when a request interceptor throws %s',
    async reason => {
      const { fetcher } = recordingFetcher();
      fetcher.interceptors.request.use({
        name: 'throws-nullish',
        order: 0,
        intercept: () => {
          throw reason;
        },
      });
      let seen: unknown;
      fetcher.interceptors.error.use({
        name: 'observer',
        order: 0,
        intercept: exchange => {
          seen = exchange.error;
        },
      });
      await expect(fetcher.get('/fail')).rejects.toBeInstanceOf(ExchangeError);
      expect(seen).toBeInstanceOf(Error);
    },
  );

  it('still recovers when an error interceptor clears the error', async () => {
    const { fetcher } = recordingFetcher(
      () => new Response('down', { status: 503 }),
    );
    fetcher.interceptors.error.use({
      name: 'fallback',
      order: 0,
      intercept: exchange => {
        exchange.response = new Response('fallback');
        exchange.error = undefined;
      },
    });
    const response = await fetcher.get('/fail');
    expect(await response.text()).toBe('fallback');
  });

  it.each([0, false, ''])(
    'keeps the falsy reason %j as the cause',
    async reason => {
      const fetcher = new Fetcher({
        baseURL: 'https://example.test',
        fetch: () => Promise.reject(reason),
      });
      const error = await fetcher.get('/fail').catch(e => e);
      expect(error).toBeInstanceOf(ExchangeError);
      expect(error.cause).toBe(reason);
    },
  );
});

describe('path parameters named like Object.prototype members (#2025)', () => {
  const names = ['constructor', 'toString', 'hasOwnProperty', '__proto__'];

  it.each([UrlTemplateStyle.UriTemplate, UrlTemplateStyle.Express])(
    'rejects a missing one before sending (style %s)',
    async style => {
      const { fetcher, fetch } = recordingFetcher(undefined, style);
      for (const name of [...names, 'normal']) {
        const template =
          style === UrlTemplateStyle.Express
            ? `/items/:${name}`
            : `/items/{${name}}`;
        const error = await fetcher
          .get(template, { urlParams: { path: {} } })
          .catch(e => e);
        expect(error).toBeInstanceOf(ExchangeError);
        expect(error.cause.message).toBe(
          `Missing required path parameter: ${name}`,
        );
      }
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it('uses one the caller gave', () => {
    expect(
      uriTemplateResolver.resolve('/items/{constructor}/{toString}', {
        constructor: 'alpha',
        toString: 7,
      }),
    ).toBe('/items/alpha/7');
    expect(
      expressUrlTemplateResolver.resolve(
        '/items/:__proto__',
        JSON.parse('{"__proto__":"beta"}'),
      ),
    ).toBe('/items/beta');
    expect(
      uriTemplateResolver.resolve(
        '/items/{constructor}',
        Object.assign(Object.create(null), { constructor: 'gamma' }),
      ),
    ).toBe('/items/gamma');
  });
});

describe('an empty Content-Type the caller set (#2050)', () => {
  it.each([
    ['a string', 'text payload', 'text payload'],
    ['an object', { a: 1 }, '{"a":1}'],
  ])('is kept for %s body', async (_label, body, expected) => {
    const { fetcher, sent } = recordingFetcher();
    await fetcher.post('/body', { body, headers: { 'content-type': '' } });
    expect(sent[0].contentType).toBe('');
    expect(sent[0].body).toBe(expected);
  });

  it('is kept when it comes from the client defaults', async () => {
    const { fetcher, sent } = recordingFetcher();
    fetcher.headers['Content-Type'] = '';
    await fetcher.post('/body', { body: 'text payload' });
    expect(sent[0].contentType).toBe('');
  });

  it('is still added when none was set', async () => {
    const { fetcher, sent } = recordingFetcher();
    await fetcher.post('/body', { body: { a: 1 } });
    expect(sent[0].contentType).toBe('application/json');
  });
});

describe('caller cancellation after the headers without AbortSignal.any (#1989)', () => {
  /** A fetch that resolves at once and whose body errors when signal aborts. */
  function streamingFetch() {
    return vi.fn(async (_url: string, init?: RequestInit) => {
      const signal = init!.signal!;
      const body = new ReadableStream<Uint8Array>({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('first'));
          signal.addEventListener('abort', () =>
            controller.error(signal.reason),
          );
        },
      });
      return new Response(body);
    });
  }

  it.each([
    ['signal and timeout', { timeout: 1000, withController: false }],
    [
      'signal and abortController',
      { timeout: undefined, withController: true },
    ],
  ])('still cancels the body with %s', async (_label, setup) => {
    vi.stubGlobal(
      'AbortSignal',
      Object.assign(function () {} as unknown as typeof AbortSignal, {
        ...AbortSignal,
        any: undefined,
        prototype: AbortSignal.prototype,
      }),
    );
    const caller = new AbortController();
    const fetch = streamingFetch();
    const response = await timeoutFetch(
      {
        url: 'https://example.test/stream',
        timeout: setup.timeout,
        signal: caller.signal,
        abortController: setup.withController
          ? new AbortController()
          : undefined,
      },
      fetch,
    );
    vi.unstubAllGlobals();
    const reason = new Error('cancel reading');
    caller.abort(reason);
    await expect(response.text()).rejects.toBe(reason);
  });

  it('lets go of the caller signal once it aborts', async () => {
    vi.stubGlobal(
      'AbortSignal',
      Object.assign(function () {} as unknown as typeof AbortSignal, {
        ...AbortSignal,
        any: undefined,
        prototype: AbortSignal.prototype,
      }),
    );
    const caller = new AbortController();
    const removed = vi.spyOn(caller.signal, 'removeEventListener');
    await timeoutFetch(
      { url: 'https://example.test', timeout: 1000, signal: caller.signal },
      async () => new Response('ok'),
    );
    vi.unstubAllGlobals();
    expect(removed).not.toHaveBeenCalled();
    caller.abort();
    expect(removed).toHaveBeenCalledWith('abort', expect.any(Function));
  });
});

describe('a timeout with a fetch that rejects on abort at once (#2013)', () => {
  function rejectOnAbort(_url: string, init?: RequestInit) {
    return new Promise<Response>((_resolve, reject) => {
      const abort = () =>
        reject(new DOMException('Adapter request aborted', 'AbortError'));
      if (init!.signal!.aborted) abort();
      else init!.signal!.addEventListener('abort', abort, { once: true });
    });
  }

  it.each([
    ['a Promise adapter', rejectOnAbort],
    [
      'the same adapter in an async wrapper',
      async (url: string, init?: RequestInit) => rejectOnAbort(url, init),
    ],
  ])('rejects with FetchTimeoutError from %s', async (_label, adapter) => {
    await expect(
      timeoutFetch({ url: 'https://example.test/slow', timeout: 5 }, adapter),
    ).rejects.toBeInstanceOf(FetchTimeoutError);
    const fetcher = new Fetcher({
      baseURL: 'https://example.test',
      timeout: 5,
      fetch: adapter,
    });
    const error = await fetcher.get('/slow').catch(e => e);
    expect(error).toBeInstanceOf(ExchangeError);
    expect(error.cause).toBeInstanceOf(FetchTimeoutError);
  });

  it('keeps the reason of a caller abort', async () => {
    const caller = new AbortController();
    const reason = new Error('caller');
    const pending = timeoutFetch(
      { url: 'https://example.test', timeout: 1000, signal: caller.signal },
      (_url, init) =>
        new Promise<Response>((_resolve, reject) =>
          init!.signal!.addEventListener('abort', () =>
            reject(init!.signal!.reason),
          ),
        ),
    );
    caller.abort(reason);
    await expect(pending).rejects.toBe(reason);
  });
});
