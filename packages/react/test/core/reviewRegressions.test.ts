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

import { StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { Fetcher } from '@ahoo-wang/fetcher';
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';
import {
  createExecuteApiHooks,
  createQueryApiHooks,
  useDebouncedFetcherQuery,
  useDebouncedQuery,
  useExecutePromise,
  useImmerKeyStorage,
} from '../../src';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it.each(['success', 'failure'] as const)(
  'ignores late %s after manual abort',
  async outcome => {
    let resolve!: (value: string) => void;
    let reject!: (error: Error) => void;
    let execution!: Promise<void>;
    const { result } = renderHook(() => useExecutePromise<string>());
    act(() => {
      execution = result.current.execute(
        () =>
          new Promise((yes, no) => {
            resolve = yes;
            reject = no;
          }),
      );
    });
    await act(async () => {
      await result.current.abort();
    });
    await act(async () => {
      if (outcome === 'success') resolve('obsolete');
      else reject(new Error('obsolete'));
      await execution;
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
  },
);

it.each(['query', 'fetcher'] as const)(
  'debounces controlled %s changes and ignores equal values',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const client = new Fetcher({ baseURL: 'https://example.test' });
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      const query = JSON.parse(init.body as string);
      queries.push(query);
      return Response.json(query);
    });
    const useSelectedQuery =
      kind === 'query'
        ? (query: { search: string }) =>
            useDebouncedQuery({
              query,
              execute,
              autoExecute: true,
              debounce: { delay: 10 },
            })
        : (query: { search: string }) =>
            useDebouncedFetcherQuery({
              query,
              fetcher: client,
              url: '/search',
              autoExecute: true,
              debounce: { delay: 10 },
            });
    const { rerender } = renderHook(({ query }) => useSelectedQuery(query), {
      initialProps: { query: { search: 'a' } },
    });
    await act(() => vi.advanceTimersByTimeAsync(10));
    rerender({ query: { search: 'b' } });
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(queries).toEqual([{ search: 'a' }, { search: 'b' }]);
    rerender({ query: { search: 'b' } });
    await act(() => vi.advanceTimersByTimeAsync(10));
    expect(queries).toHaveLength(2);
  },
);

it('applies consecutive Immer updaters to the latest stored value', async () => {
  const storage = new KeyStorage<{ count: number }>({
    key: 'counter',
    storage: new InMemoryStorage(),
  });
  const { result } = renderHook(() =>
    useImmerKeyStorage(storage, { count: 0 }),
  );
  await act(async () => {
    result.current[1](draft => {
      draft.count++;
    });
    result.current[1](draft => {
      draft.count++;
    });
  });
  expect(storage.get()).toEqual({ count: 2 });
  storage.destroy();
});

it.each([createExecuteApiHooks, createQueryApiHooks])(
  'collects API methods without evaluating accessors',
  createHooks => {
    class Api {
      state = { ready: true };
      get ready() {
        return this.state.ready;
      }
      async list() {
        return [];
      }
    }
    const hooks = createHooks({ api: new Api() });
    expect(Object.keys(hooks)).toEqual(['useList']);
    expect(hooks.useList).toBeTypeOf('function');
  },
);

it.each(['query', 'fetcher'] as const)(
  'runs the initial debounced %s once under StrictMode',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const client = new Fetcher({ baseURL: 'https://example.test' });
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      const query = JSON.parse(init.body as string);
      queries.push(query);
      return Response.json(query);
    });
    const { rerender } = renderHook(
      ({ query }) =>
        kind === 'query'
          ? useDebouncedQuery({
              query,
              execute,
              autoExecute: true,
              debounce: { delay: 10 },
            })
          : useDebouncedFetcherQuery({
              query,
              fetcher: client,
              url: '/search',
              autoExecute: true,
              debounce: { delay: 10 },
            }),
      { initialProps: { query: { search: 'a' } }, wrapper: StrictMode },
    );
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'a' }]);
    rerender({ query: { search: 'a' } });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toHaveLength(1);
  },
);

it.each(['query', 'fetcher'] as const)(
  'cancels automatic %s scheduling while preserving manual runs and re-enabling',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const client = new Fetcher({ baseURL: 'https://example.test' });
    vi.stubGlobal('fetch', async (_url: string, init: RequestInit) => {
      const query = JSON.parse(init.body as string);
      queries.push(query);
      return Response.json(query);
    });
    const { result, rerender } = renderHook(
      ({ query, enabled }) =>
        kind === 'query'
          ? useDebouncedQuery({
              query,
              execute,
              autoExecute: enabled,
              debounce: { delay: 10 },
            })
          : useDebouncedFetcherQuery({
              query,
              fetcher: client,
              url: '/search',
              autoExecute: enabled,
              debounce: { delay: 10 },
            }),
      { initialProps: { query: { search: 'a' }, enabled: true } },
    );
    expect(result.current.isPending()).toBe(true);
    rerender({ query: { search: 'a' }, enabled: false });
    expect(result.current.isPending()).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([]);

    act(() => result.current.run());
    rerender({ query: { search: 'a' }, enabled: false });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'a' }]);

    rerender({ query: { search: 'b' }, enabled: false });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toHaveLength(1);
    rerender({ query: { search: 'b' }, enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'a' }, { search: 'b' }]);
  },
);
