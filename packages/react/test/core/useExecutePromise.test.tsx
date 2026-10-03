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

import { StrictMode, useEffect, useLayoutEffect } from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import { useExecutePromise } from '../../src';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useExecutePromise', () => {
  it('resolves to the success state and tracks it', async () => {
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useExecutePromise<string>({ onSuccess }),
    );
    let settled;
    await act(async () => {
      settled = await result.current.execute(async () => 'data');
    });
    expect(settled).toEqual({
      status: 'success',
      loading: false,
      result: 'data',
      error: undefined,
    });
    expect(result.current).toMatchObject({ status: 'success', result: 'data' });
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith('data');
  });

  it('resolves to the error state instead of rejecting', async () => {
    const error = new Error('boom');
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useExecutePromise<string, Error>({ onError }),
    );
    let settled;
    await act(async () => {
      settled = await result.current.execute(() => Promise.reject(error));
    });
    expect(settled).toMatchObject({ status: 'error', error });
    expect(result.current).toMatchObject({ status: 'error', error });
    expect(onError).toHaveBeenCalledExactlyOnceWith(error);
  });

  it('shows loading while the supplier runs and passes it a controller', async () => {
    const pending = deferred<string>();
    const supplier = vi.fn(() => pending.promise);
    const { result } = renderHook(() => useExecutePromise<string>());
    let execution!: Promise<unknown>;
    act(() => {
      execution = result.current.execute(supplier);
    });
    expect(result.current.status).toBe('loading');
    expect(supplier).toHaveBeenCalledExactlyOnceWith(
      expect.any(AbortController),
    );
    await act(async () => {
      pending.resolve('done');
      await execution;
    });
    expect(result.current.result).toBe('done');
  });

  it('cancels the execution in flight when a newer one starts', async () => {
    const first = deferred<string>();
    const onAbort = vi.fn();
    const onSuccess = vi.fn();
    const { result } = renderHook(() =>
      useExecutePromise<string>({ onAbort, onSuccess }),
    );
    let firstController!: AbortController;
    let firstExecution!: Promise<unknown>;
    act(() => {
      firstExecution = result.current.execute(controller => {
        firstController = controller;
        return first.promise;
      });
    });
    let second;
    await act(async () => {
      second = await result.current.execute(async () => 'second');
    });
    expect(firstController.signal.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(second).toMatchObject({ status: 'success', result: 'second' });

    let firstSettled;
    await act(async () => {
      first.resolve('first');
      firstSettled = await firstExecution;
    });
    expect(firstSettled).toMatchObject({ status: 'idle' });
    expect(result.current.result).toBe('second');
    expect(onSuccess).toHaveBeenCalledExactlyOnceWith('second');
  });

  it('abort() cancels the execution in flight and returns to idle', async () => {
    const pending = deferred<string>();
    const onAbort = vi.fn();
    const { result } = renderHook(() => useExecutePromise<string>({ onAbort }));
    let controller!: AbortController;
    let execution!: Promise<unknown>;
    act(() => {
      execution = result.current.execute(c => {
        controller = c;
        return pending.promise;
      });
    });
    act(() => result.current.abort());
    expect(controller.signal.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe('idle');
    await act(async () => {
      pending.resolve('late');
      await execution;
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeUndefined();
  });

  it('abort() keeps a settled result; reset() clears it', async () => {
    const onAbort = vi.fn();
    const { result } = renderHook(() => useExecutePromise<string>({ onAbort }));
    await act(async () => {
      await result.current.execute(async () => 'data');
    });
    act(() => result.current.abort());
    expect(result.current.result).toBe('data');
    expect(onAbort).not.toHaveBeenCalled();
    act(() => result.current.reset());
    expect(result.current).toMatchObject({ status: 'idle', result: undefined });
  });

  it('reset() cancels the execution in flight so it cannot write back', async () => {
    const pending = deferred<string>();
    const { result } = renderHook(() => useExecutePromise<string>());
    let execution!: Promise<unknown>;
    act(() => {
      execution = result.current.execute(() => pending.promise);
    });
    act(() => result.current.reset());
    await act(async () => {
      pending.resolve('late');
      await execution;
    });
    expect(result.current).toMatchObject({ status: 'idle', result: undefined });
  });

  it('treats an AbortError from a signal of the caller as idle', async () => {
    const { result } = renderHook(() => useExecutePromise<string>());
    let settled;
    await act(async () => {
      settled = await result.current.execute(() =>
        Promise.reject(new DOMException('aborted', 'AbortError')),
      );
    });
    expect(settled).toMatchObject({ status: 'idle' });
    expect(result.current.status).toBe('idle');
  });

  it('cancels on unmount', () => {
    const onAbort = vi.fn();
    let controller!: AbortController;
    const { result, unmount } = renderHook(() =>
      useExecutePromise<string>({ onAbort }),
    );
    act(() => {
      result.current.execute(c => {
        controller = c;
        return new Promise(() => {});
      });
    });
    unmount();
    expect(controller.signal.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  it('does not start work once unmounted', async () => {
    const supplier = vi.fn(async () => 'data');
    const { result, unmount } = renderHook(() => useExecutePromise<string>());
    const { execute } = result.current;
    unmount();
    await expect(execute(supplier)).resolves.toMatchObject({ status: 'idle' });
    expect(supplier).not.toHaveBeenCalled();
  });

  it('settles an execution started on mount under StrictMode', async () => {
    let latest: ReturnType<typeof useExecutePromise<string>> | undefined;
    function Probe() {
      const state = useExecutePromise<string>();
      latest = state;
      const { execute } = state;
      useEffect(() => {
        execute(async () => 'mounted');
      }, [execute]);
      return null;
    }
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    );
    await waitFor(() => expect(latest?.status).toBe('success'));
    expect(latest?.result).toBe('mounted');
  });

  it('settles an execution started in a layout effect under StrictMode', async () => {
    let latest: ReturnType<typeof useExecutePromise<string>> | undefined;
    const supplier = vi.fn(async () => 'mounted');
    function Probe() {
      const state = useExecutePromise<string>();
      latest = state;
      const { execute } = state;
      useLayoutEffect(() => {
        execute(supplier);
      }, [execute]);
      return null;
    }
    render(
      <StrictMode>
        <Probe />
      </StrictMode>,
    );
    await waitFor(() => expect(latest?.status).toBe('success'));
    expect(latest?.result).toBe('mounted');
  });

  it('reports callback failures without failing the execution', async () => {
    const consoleError = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const { result } = renderHook(() =>
      useExecutePromise<string>({
        onSuccess: () => {
          throw new Error('callback');
        },
        onAbort: () => {
          throw new Error('abort callback');
        },
      }),
    );
    let settled;
    await act(async () => {
      result.current.execute(() => new Promise(() => {}));
      settled = await result.current.execute(async () => 'data');
    });
    expect(settled).toMatchObject({ status: 'success', result: 'data' });
    expect(consoleError).toHaveBeenCalledTimes(2);
  });

  it('awaits onSuccess before execute resolves', async () => {
    const order: string[] = [];
    const { result } = renderHook(() =>
      useExecutePromise<string>({
        onSuccess: async () => {
          await Promise.resolve();
          order.push('onSuccess');
        },
      }),
    );
    await act(async () => {
      await result.current.execute(async () => 'data');
      order.push('resolved');
    });
    expect(order).toEqual(['onSuccess', 'resolved']);
  });

  it('keeps its functions and returned object stable', async () => {
    const { result, rerender } = renderHook(
      ({ onSuccess }) => useExecutePromise<string>({ onSuccess }),
      { initialProps: { onSuccess: vi.fn() } },
    );
    const first = result.current;
    rerender({ onSuccess: vi.fn() });
    expect(result.current).toBe(first);
    await act(async () => {
      await result.current.execute(async () => 'data');
    });
    expect(result.current.execute).toBe(first.execute);
    expect(result.current.abort).toBe(first.abort);
    expect(result.current.reset).toBe(first.reset);
  });

  it('calls the latest callbacks', async () => {
    const stale = vi.fn();
    const fresh = vi.fn();
    const { result, rerender } = renderHook(
      ({ onSuccess }) => useExecutePromise<string>({ onSuccess }),
      { initialProps: { onSuccess: stale } },
    );
    rerender({ onSuccess: fresh });
    await act(async () => {
      await result.current.execute(async () => 'data');
    });
    expect(stale).not.toHaveBeenCalled();
    expect(fresh).toHaveBeenCalledExactlyOnceWith('data');
  });
});
