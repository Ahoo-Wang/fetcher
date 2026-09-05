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

import { StrictMode, useState } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { useDebouncedQuery } from '../../../src/core/debounced/useDebouncedQuery';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it.each([
  ['query', false],
  ['query', true],
] as const)(
  'tracks %s query mode when both values are undefined (starts controlled: %s)',
  async (kind, startsControlled) => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const initialQuery = { search: 'initial' };
    const { result, rerender } = renderHook(
      ({ controlled }) => {
        const options = {
          initialQuery,
          ...(controlled ? { query: undefined } : {}),
          autoExecute: true,
          debounce: { delay: 10 },
        };
        return useDebouncedQuery({ ...options, execute });
      },
      { initialProps: { controlled: startsControlled } },
    );
    expect(result.current.isPending()).toBe(!startsControlled);
    rerender({ controlled: !startsControlled });
    expect(result.current.isPending()).toBe(startsControlled);
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual(startsControlled ? [{ search: 'initial' }] : []);
    rerender({ controlled: startsControlled });
    expect(result.current.isPending()).toBe(!startsControlled);
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'initial' }]);
  },
);

it.each(['query'] as const)(
  'does not restart a cleared controlled %s query when auto execution is re-enabled',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const { result, rerender } = renderHook(
      ({
        query,
        enabled,
      }: {
        query:
          | {
              search: string;
            }
          | undefined;
        enabled: boolean;
      }) =>
        useDebouncedQuery({
          query,
          execute,
          autoExecute: enabled,
          debounce: { delay: 10 },
        }),
      {
        initialProps: {
          query: { search: 'previous' } as { search: string } | undefined,
          enabled: false,
        },
      },
    );
    rerender({ query: undefined, enabled: false });
    rerender({ query: undefined, enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([]);
    expect(result.current.isPending()).toBe(false);
    act(() => result.current.run());
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'previous' }]);
    rerender({ query: { search: 'current' }, enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'previous' }, { search: 'current' }]);
  },
);

it.each(['query'] as const)(
  'keeps uncontrolled %s initialQuery execution across automatic toggles',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const initialQuery = { search: 'initial' };
    const { rerender } = renderHook(
      ({ enabled }) =>
        useDebouncedQuery({
          initialQuery,
          execute,
          autoExecute: enabled,
          debounce: { delay: 10 },
        }),
      { initialProps: { enabled: false } },
    );
    rerender({ enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'initial' }]);
    rerender({ enabled: false });
    rerender({ enabled: true });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'initial' }, { search: 'initial' }]);
  },
);

it.each(['query'] as const)(
  'debounces controlled %s changes and ignores equal values',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const useSelectedQuery = (query: { search: string }) =>
      useDebouncedQuery({
        query,
        execute,
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

it.each(['query'] as const)(
  'cancels stale debounced %s work when the controlled query is cleared',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const { result, rerender } = renderHook(
      ({
        query,
      }: {
        query:
          | {
              search: string;
            }
          | undefined;
      }) =>
        useDebouncedQuery({
          query,
          execute,
          autoExecute: true,
          debounce: { delay: 10 },
        }),
      {
        initialProps: {
          query: { search: 'pending' } as { search: string } | undefined,
        },
      },
    );
    rerender({ query: undefined });
    expect(result.current.isPending()).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([]);
    rerender({ query: { search: 'current' } });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'current' }]);
    rerender({ query: undefined });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'current' }]);
  },
);

it.each(['query'] as const)(
  'cancels automatic %s work created by setQuery after a manual run',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const initialQuery = { search: 'initial' };
    const { result, rerender } = renderHook(
      ({ enabled }) =>
        useDebouncedQuery({
          initialQuery,
          execute,
          autoExecute: enabled,
          debounce: { delay: 10 },
        }),
      { initialProps: { enabled: true } },
    );
    act(() => {
      result.current.run();
      result.current.setQuery({ search: 'automatic' });
    });
    rerender({ enabled: false });
    expect(result.current.isPending()).toBe(false);
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([]);
  },
);

it.each(['query'] as const)(
  'runs the initial debounced %s once under StrictMode',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const { rerender } = renderHook(
      ({ query }) =>
        useDebouncedQuery({
          query,
          execute,
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

it.each(['query'] as const)(
  'cancels automatic %s scheduling while preserving manual runs and re-enabling',
  async kind => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const { result, rerender } = renderHook(
      ({ query, enabled }) =>
        useDebouncedQuery({
          query,
          execute,
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

it.each([
  ['query', 'disable'],
  ['query', 'clear'],
] as const)(
  'preserves a pending manual %s run when automatic scheduling changes: %s',
  async (kind, change) => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: unknown) => {
      queries.push(query);
      return query;
    };
    const query = { search: 'manual' };
    const { result, rerender } = renderHook(
      ({
        query,
        enabled,
      }: {
        query:
          | {
              search: string;
            }
          | undefined;
        enabled: boolean;
      }) =>
        useDebouncedQuery({
          query,
          execute,
          autoExecute: enabled,
          debounce: { delay: 10 },
        }),
      {
        initialProps: {
          query: query as { search: string } | undefined,
          enabled: true,
        },
      },
    );
    const run = result.current.run;
    act(() => run());
    rerender({
      query: change === 'clear' ? undefined : query,
      enabled: change !== 'disable',
    });
    expect(result.current.run).toBe(run);
    expect(result.current.isPending()).toBe(true);
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'manual' }]);
  },
);

it.each([false, true])(
  'does not repeat a controlled setQuery on the trailing edge (StrictMode: %s)',
  async strict => {
    vi.useFakeTimers();
    const queries: unknown[] = [];
    const execute = async (query: { search: string }) => {
      queries.push(query);
      return query;
    };
    const { result } = renderHook(
      () => {
        const [query, setControlledQuery] = useState({ search: 'initial' });
        const hook = useDebouncedQuery({
          query,
          execute,
          autoExecute: true,
          debounce: { delay: 10, leading: true, trailing: true },
        });
        return { ...hook, setControlledQuery };
      },
      { wrapper: strict ? StrictMode : undefined },
    );
    await act(() => vi.advanceTimersByTimeAsync(20));
    queries.length = 0;
    await act(async () => {
      result.current.setQuery({ search: 'updated' });
      result.current.setControlledQuery({ search: 'updated' });
    });
    expect(queries).toEqual([{ search: 'updated' }]);
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'updated' }]);
    await act(async () => {
      result.current.setControlledQuery({ search: 'external' });
    });
    await act(() => vi.advanceTimersByTimeAsync(20));
    expect(queries).toEqual([{ search: 'updated' }, { search: 'external' }]);
  },
);
