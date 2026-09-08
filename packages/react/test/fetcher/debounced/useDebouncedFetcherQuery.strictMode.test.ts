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
import { useDebouncedFetcherQuery } from '../../../src/fetcher/debounced/useDebouncedFetcherQuery';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it.each([false, true])(
  'restarts leading fetcher query immediately after StrictMode cleanup (trailing: %s)',
  async trailing => {
    vi.useFakeTimers();
    vi.setSystemTime(1000);
    const requests: {
      signal: AbortSignal;
      resolve: (value: Response) => void;
    }[] = [];
    vi.stubGlobal(
      'fetch',
      (_url: string, init: RequestInit) =>
        new Promise<Response>(resolve =>
          requests.push({ signal: init.signal!, resolve }),
        ),
    );
    const client = new Fetcher({ baseURL: 'https://example.test' });
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onAbort = vi.fn();
    const { result, rerender } = renderHook(
      ({ query }) =>
        useDebouncedFetcherQuery<{ id: number }, string>({
          query,
          fetcher: client,
          url: '/leading',
          autoExecute: true,
          debounce: { delay: 100, leading: true, trailing },
          onSuccess,
          onError,
          onAbort,
        }),
      { initialProps: { query: { id: 1 } }, wrapper: StrictMode },
    );
    await act(async () => {});
    expect(requests).toHaveLength(2);
    expect(requests[0].signal.aborted).toBe(true);
    expect(requests[1].signal.aborted).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(result.current.isPending()).toBe(false);
    await act(async () => requests[1].resolve(Response.json('current')));
    expect(result.current.result).toBe('current');
    expect(result.current.loading).toBe(false);
    rerender({ query: { id: 1 } });
    await act(() => vi.advanceTimersByTimeAsync(200));
    expect(requests).toHaveLength(2);
    await act(async () => requests[0].resolve(Response.json('obsolete')));
    expect(result.current.result).toBe('current');
    expect(result.current.error).toBeUndefined();
    expect(result.current.status).toBe('success');
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith('current');
    expect(onError).not.toHaveBeenCalled();
    expect(onAbort).toHaveBeenCalledTimes(1);
  },
);
