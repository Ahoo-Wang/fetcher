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

import { act, renderHook, waitFor } from '@testing-library/react';
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import {
  useDebouncedFetcherQuery,
  useFetcher,
  useFetcherQuery,
} from '../../src';

const fetchMock = vi.fn<typeof fetch>();

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});
afterEach(() => vi.unstubAllGlobals());

const fetcher = new Fetcher({ baseURL: 'https://query.test' });

function respondWithJson() {
  fetchMock.mockImplementation(async (_url, init) =>
    Response.json({ echo: JSON.parse(String(init?.body)) }),
  );
}

describe('useFetcherQuery', () => {
  it('posts the query as JSON and parses the JSON response', async () => {
    respondWithJson();
    const { result } = renderHook(() =>
      useFetcherQuery<{ id: number }, { echo: { id: number } }>({
        fetcher,
        url: '/search',
        query: { id: 1 },
      }),
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.result).toEqual({ echo: { id: 1 } });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('https://query.test/search');
    expect(init?.method).toBe('POST');
    expect(result.current.exchange?.request.url).toBe(
      'https://query.test/search',
    );
  });

  it('sends again when the query content changes', async () => {
    respondWithJson();
    const { result, rerender } = renderHook(
      ({ query }) =>
        useFetcherQuery<{ id: number }, { echo: { id: number } }>({
          fetcher,
          url: '/search',
          query,
        }),
      { initialProps: { query: { id: 1 } } },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    rerender({ query: { id: 1 } });
    rerender({ query: { id: 2 } });
    await waitFor(() =>
      expect(result.current.result).toEqual({ echo: { id: 2 } }),
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('waits for a defined query', async () => {
    const { result } = renderHook(() =>
      useFetcherQuery({ fetcher, url: '/search', query: undefined }),
    );
    await act(async () => {});
    expect(result.current.status).toBe('idle');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('useDebouncedFetcherQuery', () => {
  it('sends the first query at once and the last of a burst after the delay', async () => {
    vi.useFakeTimers();
    try {
      respondWithJson();
      const { result, rerender } = renderHook(
        ({ query }) =>
          useDebouncedFetcherQuery<{ id: number }, unknown>({
            fetcher,
            url: '/search',
            query,
            debounce: { delay: 100 },
          }),
        { initialProps: { query: { id: 1 } } },
      );
      await act(async () => {});
      rerender({ query: { id: 2 } });
      rerender({ query: { id: 3 } });
      expect(result.current.pending).toBe(true);
      await act(async () => {
        vi.advanceTimersByTime(100);
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({
        id: 3,
      });
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('useFetcher exchange', () => {
  it('exposes the exchange of a request rejected by its status', async () => {
    fetchMock.mockResolvedValue(new Response('missing', { status: 404 }));
    const { result } = renderHook(() =>
      useFetcher<string>({ fetcher, resultExtractor: ResultExtractors.Text }),
    );
    await act(async () => {
      await result.current.execute({ url: '/missing' });
    });
    expect(result.current.status).toBe('error');
    expect(result.current.exchange?.response?.status).toBe(404);
  });

  it('does not change the request it is given', async () => {
    fetchMock.mockResolvedValue(new Response('ok'));
    const request = { url: '/a' };
    const { result } = renderHook(() =>
      useFetcher<string>({ fetcher, resultExtractor: ResultExtractors.Text }),
    );
    await act(async () => {
      await result.current.execute(request);
    });
    expect(request).toEqual({ url: '/a' });
  });

  it('aborts the request when a newer one starts', async () => {
    const signals: AbortSignal[] = [];
    fetchMock.mockImplementation(
      (_url, init) =>
        new Promise((resolve, reject) => {
          signals.push(init!.signal!);
          if (signals.length === 2) resolve(new Response('second'));
          init!.signal!.addEventListener('abort', () =>
            reject(new DOMException('aborted', 'AbortError')),
          );
        }),
    );
    const { result } = renderHook(() =>
      useFetcher<string>({ fetcher, resultExtractor: ResultExtractors.Text }),
    );
    await act(async () => {
      result.current.execute({ url: '/first' });
      await result.current.execute({ url: '/second' });
    });
    expect(signals[0].aborted).toBe(true);
    expect(result.current).toMatchObject({
      status: 'success',
      result: 'second',
    });
  });
});
