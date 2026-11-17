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
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';
import {
  Fetcher,
  formatUrlParam,
  mergeRecordToMap,
  ResultExtractors,
} from '../src';
import {
  isArrayBuffer,
  isBlob,
  isDate,
  isFormData,
  isMap,
  isReadableStream,
  isURLSearchParams,
} from '../src/realm';

/**
 * Stands in for an object made in a same-origin iframe: it keeps the
 * built-in's internal slots, but `instanceof` this realm's constructor fails.
 * (A Node `vm` context has no Blob, FormData and the like to make one from.)
 */
function fromOtherRealm<T extends object>(value: T): T {
  return Object.setPrototypeOf(value, {});
}

function recordingFetcher() {
  const sent: { url: string; contentType: string | null; body: string }[] = [];
  const fetcher = new Fetcher({
    baseURL: 'https://example.test',
    fetch: async (url, init) => {
      const request = new Request(url, init);
      sent.push({
        url: request.url,
        contentType: request.headers.get('content-type'),
        body: await request.text(),
      });
      return new Response('{}');
    },
  });
  return { fetcher, sent };
}

describe('realm-independent type checks', () => {
  it('recognizes built-ins from another realm', () => {
    expect(isDate(runInNewContext('new Date(1)'))).toBe(true);
    expect(isMap(runInNewContext('new Map()'))).toBe(true);
    expect(isArrayBuffer(runInNewContext('new ArrayBuffer(1)'))).toBe(true);
    expect(isBlob(fromOtherRealm(new Blob(['x'])))).toBe(true);
    expect(isBlob(fromOtherRealm(new File(['x'], 'x.txt')))).toBe(true);
    expect(isFormData(fromOtherRealm(new FormData()))).toBe(true);
    expect(isURLSearchParams(fromOtherRealm(new URLSearchParams()))).toBe(true);
    expect(isReadableStream(fromOtherRealm(new ReadableStream()))).toBe(true);
  });

  it('rejects objects that only look like a built-in', () => {
    expect(isDate({ [Symbol.toStringTag]: 'Date' })).toBe(false);
    expect(isMap({ size: 0 })).toBe(false);
    expect(isBlob({ size: 1, type: 'text/plain' })).toBe(false);
    expect(isURLSearchParams({ has: () => true })).toBe(false);
    expect(isDate(null)).toBe(false);
    expect(isDate('2026-01-01')).toBe(false);
  });
});

describe('Date from another realm (#2046)', () => {
  const iso = '2026-01-02T03:04:05.006Z';
  const foreign = runInNewContext(`new Date(${JSON.stringify(iso)})`);

  it('formats as ISO 8601 with milliseconds', () => {
    expect(formatUrlParam(foreign)).toBe(iso);
  });

  it('formats path, query and array query values', async () => {
    const { fetcher, sent } = recordingFetcher();
    await fetcher.get('/at/{time}', {
      urlParams: {
        path: { time: foreign },
        query: { since: foreign, at: [foreign] },
      },
    });
    const url = new URL(sent[0].url);
    expect(decodeURIComponent(url.pathname)).toBe(`/at/${iso}`);
    expect(url.searchParams.get('since')).toBe(iso);
    expect(url.searchParams.getAll('at')).toEqual([iso]);
  });
});

describe('Map attributes from another realm (#2028)', () => {
  const foreign = runInNewContext(
    'new Map([["traceId", "trace-42"], ["screen", "checkout"]])',
  );

  it('copies the entries', () => {
    expect([...mergeRecordToMap(foreign)]).toEqual([
      ['traceId', 'trace-42'],
      ['screen', 'checkout'],
    ]);
    const target = new Map([['kept', 1]]);
    mergeRecordToMap(foreign, target as Map<string, any>);
    expect(target.get('traceId')).toBe('trace-42');
    expect(target.get('kept')).toBe(1);
  });

  it('reaches request interceptors', async () => {
    const { fetcher } = recordingFetcher();
    let seen: string | undefined;
    fetcher.interceptors.request.use({
      name: 'read-trace',
      order: 0,
      intercept: exchange => {
        seen = exchange.attributes.get('traceId');
      },
    });
    const exchange = await fetcher.get(
      '/orders',
      {},
      { attributes: foreign, resultExtractor: ResultExtractors.Exchange },
    );
    expect(seen).toBe('trace-42');
    expect(exchange.attributes.get('screen')).toBe('checkout');
  });
});

describe('request bodies from another realm (#2003)', () => {
  // Node's own Request does not take these stand-ins as bodies (a browser
  // does take an iframe's), so these check what Fetcher passes to fetch.
  function initRecordingFetcher() {
    const inits: RequestInit[] = [];
    const fetcher = new Fetcher({
      baseURL: 'https://example.test',
      fetch: async (_url, init) => {
        inits.push(init ?? {});
        return new Response('{}');
      },
    });
    return { fetcher, inits };
  }

  it.each([
    [
      'File',
      () =>
        new File(['actual-file'], 'example.txt', {
          type: 'text/plain',
        }) as object,
    ],
    ['Blob', () => new Blob(['blob']) as object],
    ['FormData', () => new FormData() as object],
    ['URLSearchParams', () => new URLSearchParams('a=1') as object],
  ])(
    'passes a %s through untouched and leaves its Content-Type to fetch',
    async (_name, make) => {
      const { fetcher, inits } = initRecordingFetcher();
      const body = fromOtherRealm(make());
      await fetcher.post('/upload', {
        body,
        headers: { 'Content-Type': 'application/json' },
      });
      expect(inits[0].body).toBe(body);
      expect(
        new Headers(inits[0].headers as HeadersInit).has('content-type'),
      ).toBe(false);
    },
  );

  it('sends an ArrayBuffer as bytes', async () => {
    const { fetcher, sent } = recordingFetcher();
    const buffer = runInNewContext(
      'new Uint8Array([65, 66]).buffer',
    ) as ArrayBuffer;
    await fetcher.post('/bytes', { body: buffer });
    expect(sent[0].body).toBe('AB');
    expect(sent[0].contentType).toBeNull();
  });

  it('streams a ReadableStream with duplex half', async () => {
    const stream = fromOtherRealm(
      new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode('chunk'));
          controller.close();
        },
      }),
    );
    let duplex: unknown;
    const fetcher = new Fetcher({
      baseURL: 'https://example.test',
      fetch: async (_url, init) => {
        duplex = (init as { duplex?: unknown }).duplex;
        return new Response('{}');
      },
    });
    await fetcher.post('/stream', { body: stream });
    expect(duplex).toBe('half');
  });

  it('still serializes a plain object from another realm as JSON', async () => {
    const { fetcher, sent } = recordingFetcher();
    await fetcher.post('/json', { body: runInNewContext('({ a: 1 })') });
    expect(sent[0].body).toBe('{"a":1}');
    expect(sent[0].contentType).toBe('application/json');
  });
});
