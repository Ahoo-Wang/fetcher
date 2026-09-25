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
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { setupServer } from 'msw/node';
import { http, HttpResponse, delay } from 'msw';
import { Fetcher, ResultExtractors, mergeRequest, timeoutFetch } from '../src';

const server = setupServer(
  http.all('https://review.test/*', async ({ request }) =>
    HttpResponse.json({
      url: request.url,
      headers: Object.fromEntries(request.headers),
      body: await request.text(),
    }),
  ),
);
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
const options = { resultExtractor: ResultExtractors.Json };

describe('request regressions', () => {
  it('overrides headers regardless of case across default and request layers', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://review.test',
      headers: {
        Authorization: 'Bearer old',
        'Content-Type': 'application/json',
      },
    });
    const response = await fetcher.post<any>(
      '/headers',
      {
        headers: { authorization: 'Bearer new', 'content-type': 'text/plain' },
        body: 'hello',
      },
      options,
    );
    expect(response.headers.authorization).toBe('Bearer new');
    expect(response.headers['content-type']).toBe('text/plain');
  });

  it('merges request headers with case-insensitive replacement', () => {
    const result = mergeRequest(
      { headers: { Authorization: 'old' } },
      { headers: { authorization: 'new' } },
    );
    expect(
      new Headers(result.headers as Record<string, string>).get(
        'authorization',
      ),
    ).toBe('new');
  });

  it('preserves a lowercase JSON content type and removes it for FormData', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://review.test',
      headers: { 'content-type': 'application/problem+json' },
    });
    const json = await fetcher.post<any>(
      '/headers',
      { body: { value: 1 } },
      options,
    );
    expect(json.headers['content-type']).toBe('application/problem+json');
    const form = new FormData();
    form.set('value', '1');
    const multipart = await fetcher.post<any>(
      '/headers',
      { body: form },
      options,
    );
    expect(multipart.headers['content-type']).toMatch(
      /^multipart\/form-data; boundary=/,
    );
  });

  it.each([
    ['/users?active=true', 'https://review.test/users?active=true&page=2'],
    [
      '/users?active=true#details',
      'https://review.test/users?active=true&page=2#details',
    ],
    ['/users#details', 'https://review.test/users?page=2#details'],
  ])('adds query parameters before fragments: %s', async (url, expected) => {
    const fetcher = new Fetcher({ baseURL: 'https://review.test' });
    const response = await fetcher.get<any>(
      url,
      { urlParams: { query: { page: 2 } } },
      options,
    );
    expect(response.url).toBe(expected);
  });

  it('honors a caller-aborted controller even when timeout is enabled', async () => {
    const controller = new AbortController();
    controller.abort(new Error('user cancelled'));
    const fetcher = new Fetcher({
      baseURL: 'https://review.test',
      timeout: 1000,
    });
    await expect(
      fetcher.post('/cancelled', {
        body: { value: 1 },
        abortController: controller,
      }),
    ).rejects.toThrow('user cancelled');
  });
});

it.each([true, false])(
  'normalizes duplicate casing even when one request is empty: %s',
  first => {
    const request = { headers: { Authorization: 'old', authorization: 'new' } };
    const merged = first
      ? mergeRequest(request, {})
      : mergeRequest({}, request);
    expect(
      new Headers(merged.headers as Record<string, string>).get(
        'authorization',
      ),
    ).toBe('new');
  },
);

it('leaves the caller controller usable after a timeout, so a retry times out again', async () => {
  server.use(
    http.get('https://review.test/slow', async () => {
      await delay(50);
      return HttpResponse.text('late');
    }),
  );
  const abortController = new AbortController();
  const request = {
    url: 'https://review.test/slow',
    timeout: 5,
    abortController,
  };
  await expect(timeoutFetch(request)).rejects.toThrow('timeout');
  expect(request.abortController).toBe(abortController);
  expect(abortController.signal.aborted).toBe(false);
  await expect(timeoutFetch(request)).rejects.toThrow('timeout');
});

it('sends a ReadableStream body, which fetch only accepts with duplex half', async () => {
  // MSW's interception skips fetch's own validation; building the native
  // Request runs it.
  vi.stubGlobal('fetch', async (input: string, init: RequestInit) => {
    const request = new Request(input, init);
    return new Response(await request.text());
  });
  try {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('streamed'));
        controller.close();
      },
    });
    const fetcher = new Fetcher({ baseURL: 'https://review.test' });
    const response = await fetcher.post('/upload', { body });
    expect(await response.text()).toBe('streamed');
  } finally {
    vi.unstubAllGlobals();
  }
});

describe('caller-owned objects', () => {
  it('gives every Fetcher its own headers record', () => {
    const first = new Fetcher();
    const second = new Fetcher();
    first.headers!['X-Tenant'] = 't1';
    expect(second.headers).not.toBe(first.headers);
    expect(second.headers!['X-Tenant']).toBeUndefined();
  });

  it('does not share the headers passed in options', () => {
    const headers = { 'X-App': 'a' };
    const fetcher = new Fetcher({ baseURL: '', headers });
    fetcher.headers!['X-App'] = 'b';
    expect(headers['X-App']).toBe('a');
  });

  it('keeps path and query parameters written by an interceptor out of the caller request', async () => {
    const fetcher = new Fetcher({ baseURL: 'https://review.test' });
    fetcher.interceptors.request.use({
      name: 'TenantInterceptor',
      order: 0,
      intercept(exchange) {
        const urlParams = exchange.ensureRequestUrlParams();
        urlParams.path.tenantId ??= 'T1';
        urlParams.query.ts = 'now';
      },
    });
    const shared = {
      urlParams: { path: {} as Record<string, string>, query: { a: '1' } },
    };
    const response = await fetcher.get<any>(
      '/tenants/{tenantId}',
      shared,
      options,
    );
    expect(response.url).toBe('https://review.test/tenants/T1?a=1&ts=now');
    expect(shared.urlParams).toEqual({ path: {}, query: { a: '1' } });
  });
});
