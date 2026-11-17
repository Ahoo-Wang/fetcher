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

import { act, renderHook } from '@testing-library/react';
import { Fetcher } from '@ahoo-wang/fetcher';
import { useDebouncedFetcherQuery, useFetcherQuery } from '../../src';

// A Fetcher whose fetch records the body and Content-Type it would send.
function recordingFetcher() {
  const sent: { body: string; contentType: string | null }[] = [];
  const fetcher = new Fetcher({
    baseURL: 'https://query.test',
    fetch: async (input, init) => {
      const outgoing = new Request(input, init);
      sent.push({
        body: await outgoing.text(),
        contentType: outgoing.headers.get('content-type'),
      });
      return Response.json({ ok: true });
    },
  });
  return { fetcher, sent };
}

describe('useFetcherQuery sends its query as JSON (#2040)', () => {
  it.each([
    'true',
    'Ada',
    '',
    null,
    42,
    false,
    { name: 'Ada' },
    [1, 'two'],
  ] as unknown[])('query %j', async query => {
    const { fetcher, sent } = recordingFetcher();
    const { result } = renderHook(() =>
      useFetcherQuery<unknown, unknown>({ query, fetcher, url: '/search' }),
    );
    await act(async () => {});
    expect(result.current.status).toBe('success');
    expect(sent).toEqual([
      { body: JSON.stringify(query), contentType: 'application/json' },
    ]);
  });

  it('an undefined query is still not ready', async () => {
    const { fetcher, sent } = recordingFetcher();
    const { result } = renderHook(() =>
      useFetcherQuery<string | undefined, unknown>({
        query: undefined,
        fetcher,
        url: '/search',
      }),
    );
    await act(async () => {});
    expect(result.current.status).toBe('idle');
    expect(sent).toEqual([]);
  });

  it('useDebouncedFetcherQuery sends a string as a JSON string', async () => {
    vi.useFakeTimers();
    try {
      const { fetcher, sent } = recordingFetcher();
      const { rerender } = renderHook(
        ({ query }) =>
          useDebouncedFetcherQuery<string | undefined, unknown>({
            query,
            fetcher,
            url: '/search',
            debounce: { delay: 100 },
          }),
        { initialProps: { query: undefined as string | undefined } },
      );
      rerender({ query: 'true' });
      await act(async () => {
        await vi.advanceTimersByTimeAsync(100);
      });
      expect(sent).toEqual([
        { body: '"true"', contentType: 'application/json' },
      ]);
    } finally {
      vi.useRealTimers();
    }
  });
});
