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

import { StrictMode, useEffect } from 'react';
import { act, renderHook } from '@testing-library/react';
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  useDebouncedCallback,
  useDebouncedExecutePromise,
  useDebouncedFetcher,
  useDebouncedValue,
  useStableValue,
} from '../../../src';

afterEach(() => {
  vi.useRealTimers();
});

describe('leading debounce keeps one burst while calls continue (#1991)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
  });

  it('runs only the first call and the last one after the quiet period', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, {
        delay: 100,
        leading: true,
        trailing: true,
      }),
    );
    act(() => result.current.run('first'));
    act(() => vi.advanceTimersByTime(60));
    act(() => result.current.run('second'));
    act(() => vi.advanceTimersByTime(60));
    act(() => result.current.run('third'));
    expect(callback.mock.calls).toEqual([['first']]);
    act(() => vi.advanceTimersByTime(99));
    expect(callback.mock.calls).toEqual([['first']]);
    act(() => vi.advanceTimersByTime(1));
    expect(callback.mock.calls).toEqual([['first'], ['third']]);
  });

  it('runs only the first call of a burst without trailing', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, {
        delay: 100,
        leading: true,
        trailing: false,
      }),
    );
    for (let i = 0; i < 5; i++) {
      act(() => result.current.run(i));
      act(() => vi.advanceTimersByTime(60));
    }
    expect(callback.mock.calls).toEqual([[0]]);
    act(() => vi.advanceTimersByTime(100));
    expect(callback.mock.calls).toEqual([[0]]);
    // A call after the quiet period starts a new burst.
    act(() => result.current.run('next'));
    expect(callback.mock.calls).toEqual([[0], ['next']]);
  });

  it('does not add a trailing call to a lone leading call', () => {
    const callback = vi.fn();
    const { result } = renderHook(() =>
      useDebouncedCallback(callback, {
        delay: 100,
        leading: true,
        trailing: true,
      }),
    );
    act(() => result.current.run('only'));
    act(() => vi.advanceTimersByTime(500));
    expect(callback.mock.calls).toEqual([['only']]);
    expect(result.current.isPending()).toBe(false);
  });
});

describe('StrictMode replay restarts a leading-only request (#2011)', () => {
  it('useDebouncedExecutePromise completes the mount request', async () => {
    vi.useFakeTimers();
    const supplier = vi.fn(async () => 'loaded');
    const { result } = renderHook(
      () => {
        const state = useDebouncedExecutePromise<string>({
          debounce: { delay: 100, leading: true, trailing: false },
        });
        const { run } = state;
        useEffect(() => {
          run(supplier);
        }, [run]);
        return state;
      },
      { wrapper: StrictMode },
    );
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('loaded');
  });

  it('useDebouncedFetcher completes the mount request', async () => {
    vi.useFakeTimers();
    const fetcher = new Fetcher({
      baseURL: 'https://debounce.test',
      fetch: async () => Response.json({ ok: true }),
    });
    const { result } = renderHook(
      () => {
        const state = useDebouncedFetcher<{ ok: boolean }>({
          fetcher,
          resultExtractor: exchange => exchange.requiredResponse.json(),
          debounce: { delay: 100, leading: true, trailing: false },
        });
        const { run } = state;
        useEffect(() => {
          run({ url: '/load' });
        }, [run]);
        return state;
      },
      { wrapper: StrictMode },
    );
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toEqual({ ok: true });
  });

  it('an explicit cancel() still keeps the leading window', () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const callback = vi.fn();
    const { result } = renderHook(
      () =>
        useDebouncedCallback(callback, {
          delay: 100,
          leading: true,
          trailing: false,
        }),
      { wrapper: StrictMode },
    );
    act(() => result.current.run('first'));
    act(() => result.current.cancel());
    act(() => result.current.run('second'));
    expect(callback.mock.calls).toEqual([['first']]);
  });
});

describe('function values are values, not initializers (#1992)', () => {
  it('useStableValue returns the function without calling it', () => {
    const value = vi.fn(() => 42);
    const { result } = renderHook(() => useStableValue(value), {
      wrapper: StrictMode,
    });
    expect(result.current).toBe(value);
    expect(value).not.toHaveBeenCalled();
  });

  it('useStableValue mounts with a function that throws', () => {
    const value = () => {
      throw new Error('called');
    };
    const { result } = renderHook(() => useStableValue(value));
    expect(result.current).toBe(value);
  });

  it('useDebouncedValue returns the function itself, now and later', () => {
    vi.useFakeTimers();
    const first = vi.fn(() => 1);
    const second = vi.fn(() => 2);
    const third = vi.fn(() => 3);
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, { delay: 100 }),
      { initialProps: { value: first }, wrapper: StrictMode },
    );
    expect(result.current.value).toBe(first);

    rerender({ value: second });
    expect(result.current.value).toBe(first);
    expect(result.current.pending).toBe(true);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.value).toBe(second);

    rerender({ value: third });
    act(() => result.current.flush());
    expect(result.current.value).toBe(third);
    for (const fn of [first, second, third]) {
      expect(fn).not.toHaveBeenCalled();
    }
  });
});
