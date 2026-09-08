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
import { act, renderHook } from '@testing-library/react';
import { Fetcher } from '@ahoo-wang/fetcher';
import { useFetcherQuery } from '../../src/fetcher/useFetcherQuery';

it.each(['success', 'abort'] as const)(
  'finishes automatic useFetcherQuery after StrictMode replay and ignores late %s',
  async outcome => {
    const requests: {
      signal: AbortSignal;
      resolve: (value: Response) => void;
      reject: (reason: Error) => void;
    }[] = [];
    const successes: string[] = [];
    const errors: unknown[] = [];
    vi.stubGlobal(
      'fetch',
      (_url: string, init: RequestInit) =>
        new Promise<Response>((resolve, reject) => {
          requests.push({ signal: init.signal!, resolve, reject });
        }),
    );
    const client = new Fetcher({ baseURL: 'https://example.test' });
    const { result, rerender } = renderHook(
      () =>
        useFetcherQuery<{ id: number }, string>({
          query: { id: 1 },
          url: '/query',
          fetcher: client,
          autoExecute: true,
          onSuccess: value => {
            successes.push(value);
          },
          onError: error => {
            errors.push(error);
          },
        }),
      { wrapper: StrictMode },
    );
    await act(async () => {});
    expect(result.current.loading).toBe(true);
    await act(async () => {
      requests[requests.length - 1].resolve(Response.json('current'));
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('current');
    expect(requests).toHaveLength(2);
    expect(requests[0].signal.aborted).toBe(true);
    await act(async () => {
      if (outcome === 'success') requests[0].resolve(Response.json('obsolete'));
      else
        requests[0].reject(
          Object.assign(new Error('obsolete'), { name: 'AbortError' }),
        );
    });
    rerender();
    expect(requests).toHaveLength(2);
    expect(result.current.result).toBe('current');
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(successes).toEqual(['current']);
    expect(errors).toEqual([]);
  },
);
