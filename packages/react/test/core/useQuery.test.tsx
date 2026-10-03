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
import type { ReactNode } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react';
import { useQuery } from '../../src';

interface Query {
  keyword: string;
}

function setup(
  initialProps: { query: Query | undefined; autoExecute?: boolean },
  execute = vi.fn(async (query: Query) => `result:${query.keyword}`),
  wrapper?: (props: { children: ReactNode }) => ReactNode,
) {
  const hook = renderHook(
    props => useQuery<Query, string>({ ...props, execute }),
    { initialProps, wrapper },
  );
  return { ...hook, execute };
}

describe('useQuery', () => {
  it('executes the query on mount, starting in loading', async () => {
    const { result, execute } = setup({ query: { keyword: 'a' } });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.result).toBe('result:a');
    expect(execute).toHaveBeenCalledExactlyOnceWith(
      { keyword: 'a' },
      expect.any(AbortController),
    );
  });

  it('renders loading on the first render when it executes on mount', () => {
    const statuses: string[] = [];
    renderHook(() => {
      const state = useQuery<Query, string>({
        query: { keyword: 'a' },
        execute: () => new Promise(() => {}),
      });
      statuses.push(state.status);
      return state;
    });
    expect(statuses[0]).toBe('loading');
  });

  it('does nothing while the query is undefined', async () => {
    const { result, execute } = setup({ query: undefined });
    expect(result.current.status).toBe('idle');
    let settled;
    await act(async () => {
      settled = await result.current.execute();
    });
    expect(settled).toMatchObject({ status: 'idle' });
    expect(execute).not.toHaveBeenCalled();
  });

  it('does not execute again for an equal query object', async () => {
    const { result, rerender, execute } = setup({ query: { keyword: 'a' } });
    await waitFor(() => expect(result.current.status).toBe('success'));
    rerender({ query: { keyword: 'a' } });
    rerender({ query: { keyword: 'a' } });
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('executes again when the query content changes, cancelling the previous one', async () => {
    const controllers: AbortController[] = [];
    const execute = vi.fn((query: Query, controller: AbortController) => {
      controllers.push(controller);
      return query.keyword === 'a'
        ? new Promise<string>(() => {})
        : Promise.resolve(`result:${query.keyword}`);
    });
    const { result, rerender } = setup({ query: { keyword: 'a' } }, execute);
    rerender({ query: { keyword: 'b' } });
    await waitFor(() => expect(result.current.result).toBe('result:b'));
    expect(controllers[0].signal.aborted).toBe(true);
  });

  it('only executes on demand with autoExecute false', async () => {
    const { result, execute } = setup({
      query: { keyword: 'a' },
      autoExecute: false,
    });
    expect(result.current.status).toBe('idle');
    expect(execute).not.toHaveBeenCalled();
    let settled;
    await act(async () => {
      settled = await result.current.execute();
    });
    expect(settled).toMatchObject({ status: 'success', result: 'result:a' });
  });

  it('executes when autoExecute turns on', async () => {
    const { result, rerender, execute } = setup({
      query: { keyword: 'a' },
      autoExecute: false,
    });
    rerender({ query: { keyword: 'a' }, autoExecute: true });
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(execute).toHaveBeenCalledTimes(1);
  });

  it('execute() re-runs the current query', async () => {
    const { result, execute } = setup({ query: { keyword: 'a' } });
    await waitFor(() => expect(result.current.status).toBe('success'));
    await act(async () => {
      await result.current.execute();
    });
    expect(execute).toHaveBeenCalledTimes(2);
    expect(execute).toHaveBeenLastCalledWith(
      { keyword: 'a' },
      expect.any(AbortController),
    );
  });

  it('uses the latest execute without re-running', async () => {
    const first = vi.fn(async () => 'first');
    const second = vi.fn(async () => 'second');
    const { result, rerender } = renderHook(
      ({ execute }) => useQuery({ query: { keyword: 'a' }, execute }),
      { initialProps: { execute: first } },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    rerender({ execute: second });
    expect(second).not.toHaveBeenCalled();
    await act(async () => {
      await result.current.execute();
    });
    expect(result.current.result).toBe('second');
  });

  it('records a failure without an unhandled rejection', async () => {
    const error = new Error('boom');
    const { result } = setup(
      { query: { keyword: 'a' } },
      vi.fn(() => Promise.reject(error)),
    );
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(error);
  });

  it('settles under StrictMode', async () => {
    const { result } = setup(
      { query: { keyword: 'a' } },
      undefined,
      StrictMode,
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.result).toBe('result:a');
  });
});
