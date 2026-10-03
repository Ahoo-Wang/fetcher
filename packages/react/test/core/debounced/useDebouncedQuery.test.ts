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
import { useDebouncedQuery, useDebouncedValue } from '../../../src';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebouncedValue', () => {
  it('follows the value once it stops changing', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, { delay: 100 }),
      { initialProps: { value: 'a' } },
    );
    expect(result.current).toMatchObject({ value: 'a', pending: false });
    rerender({ value: 'b' });
    act(() => vi.advanceTimersByTime(50));
    rerender({ value: 'c' });
    expect(result.current).toMatchObject({ value: 'a', pending: true });
    act(() => vi.advanceTimersByTime(99));
    expect(result.current.value).toBe('a');
    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toMatchObject({ value: 'c', pending: false });
  });

  it('ignores a change back to the current value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, { delay: 100 }),
      { initialProps: { value: { a: 1 } } },
    );
    const first = result.current.value;
    rerender({ value: { a: 2 } });
    rerender({ value: { a: 1 } });
    expect(result.current.pending).toBe(false);
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.value).toBe(first);
  });

  it('applies the latest value at once on flush', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, { delay: 100 }),
      { initialProps: { value: 'a' } },
    );
    rerender({ value: 'b' });
    act(() => result.current.flush());
    expect(result.current).toMatchObject({ value: 'b', pending: false });
  });

  it('applies the first change of a burst at once with leading', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebouncedValue(value, { delay: 100, leading: true }),
      { initialProps: { value: 'a' } },
    );
    rerender({ value: 'b' });
    expect(result.current.value).toBe('b');
    rerender({ value: 'c' });
    expect(result.current.value).toBe('b');
    act(() => vi.advanceTimersByTime(100));
    expect(result.current.value).toBe('c');
  });
});

describe('useDebouncedQuery', () => {
  it('executes the first query at once and later ones after the delay', async () => {
    const execute = vi.fn(async (query: { keyword: string }) => query.keyword);
    const { result, rerender } = renderHook(
      ({ query }) =>
        useDebouncedQuery({ query, execute, debounce: { delay: 100 } }),
      { initialProps: { query: { keyword: 'a' } } },
    );
    await act(async () => {});
    expect(execute).toHaveBeenCalledTimes(1);
    expect(result.current.result).toBe('a');

    rerender({ query: { keyword: 'ab' } });
    rerender({ query: { keyword: 'abc' } });
    expect(result.current.pending).toBe(true);
    await act(async () => {
      vi.advanceTimersByTime(100);
    });
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenLastCalledWith(
      { keyword: 'abc' },
      expect.any(AbortController),
    );
    expect(result.current).toMatchObject({ result: 'abc', pending: false });
  });

  it('sends the waiting query at once on flush', async () => {
    const execute = vi.fn(async (query: { keyword: string }) => query.keyword);
    const { result, rerender } = renderHook(
      ({ query }) =>
        useDebouncedQuery({ query, execute, debounce: { delay: 100 } }),
      { initialProps: { query: { keyword: 'a' } } },
    );
    await act(async () => {});
    rerender({ query: { keyword: 'b' } });
    await act(async () => {
      result.current.flush();
    });
    expect(result.current.result).toBe('b');
    expect(execute).toHaveBeenCalledTimes(2);
  });

  it('cancels the waiting query on unmount', async () => {
    const execute = vi.fn(async () => 'ok');
    const { rerender, unmount } = renderHook(
      ({ query }) =>
        useDebouncedQuery({ query, execute, debounce: { delay: 100 } }),
      { initialProps: { query: 'a' } },
    );
    await act(async () => {});
    rerender({ query: 'b' });
    unmount();
    vi.advanceTimersByTime(100);
    expect(execute).toHaveBeenCalledTimes(1);
  });
});
