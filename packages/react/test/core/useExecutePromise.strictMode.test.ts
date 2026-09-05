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
import { StrictMode, useEffect, useRef } from 'react';
import { act, renderHook } from '@testing-library/react';
import { useExecutePromise } from '../../src/core/useExecutePromise';
import { PromiseStatus } from '../../src/core/usePromiseState';

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

it.each([
  ['success', false],
  ['success', true],
  ['error', false],
  ['error', true],
  ['AbortError', false],
  ['AbortError', true],
] as const)(
  'keeps externally aborted %s out of state with propagateError=%s',
  async (outcome, propagateError) => {
    const pending = deferred<string>();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onAbort = vi.fn();
    const { result } = renderHook(
      () =>
        useExecutePromise<string>({
          propagateError,
          onSuccess,
          onError,
          onAbort,
        }),
      { wrapper: StrictMode },
    );
    let controller!: AbortController;
    let execution!: Promise<void | Error>;
    act(() => {
      execution = result.current
        .execute(current => {
          controller = current;
          return pending.promise;
        })
        .catch((error: Error) => error);
      controller.abort();
    });
    const failure = new Error('cancelled supplier failure');
    if (outcome === 'AbortError') failure.name = 'AbortError';
    await act(async () => {
      if (outcome === 'success') pending.resolve('cancelled value');
      else pending.reject(failure);
      expect(await execution).toBe(
        outcome === 'error' && propagateError ? failure : undefined,
      );
    });
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
    expect(onAbort).not.toHaveBeenCalled();
  },
);

it.each(['success', 'failure'] as const)(
  'returns to idle after StrictMode cancellation and ignores late %s',
  async outcome => {
    const pending = deferred<string>();
    const onSuccess = vi.fn();
    const onError = vi.fn();
    let signal!: AbortSignal;
    let execution!: Promise<void>;
    const { result } = renderHook(
      () => {
        const hook = useExecutePromise<string>({ onSuccess, onError });
        const started = useRef(false);
        useEffect(() => {
          if (started.current) return;
          started.current = true;
          execution = hook.execute(controller => {
            signal = controller.signal;
            return pending.promise;
          });
        }, [hook.execute]);
        return hook;
      },
      { wrapper: StrictMode },
    );
    expect(signal.aborted).toBe(true);
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    await act(async () => {
      if (outcome === 'success') pending.resolve('stale');
      else pending.reject(new Error('stale'));
      await execution;
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  },
);

it('preserves the initial status when StrictMode has no request to cancel', () => {
  const onAbort = vi.fn();
  const { result } = renderHook(
    () => useExecutePromise({ initialStatus: PromiseStatus.SUCCESS, onAbort }),
    { wrapper: StrictMode },
  );
  expect(result.current.status).toBe(PromiseStatus.SUCCESS);
  expect(result.current.loading).toBe(false);
  expect(onAbort).not.toHaveBeenCalled();
});

it('keeps the request started by a reentrant onAbort while its callback is pending', async () => {
  const stale = deferred<string>();
  const current = deferred<string>();
  const callback = deferred<void>();
  let execute!: ReturnType<typeof useExecutePromise<string>>['execute'];
  let staleExecution!: Promise<void>;
  let currentExecution!: Promise<void>;
  const onSuccess = vi.fn();
  const onAbort = vi.fn(() => {
    currentExecution = execute(() => current.promise);
    return callback.promise;
  });
  const { result } = renderHook(
    () => {
      const hook = useExecutePromise<string>({ onSuccess, onAbort });
      const started = useRef(false);
      useEffect(() => {
        execute = hook.execute;
        if (started.current) return;
        started.current = true;
        staleExecution = hook.execute(() => stale.promise);
      }, [hook.execute]);
      return hook;
    },
    { wrapper: StrictMode },
  );
  expect(onAbort).toHaveBeenCalledTimes(1);
  expect(result.current.loading).toBe(true);
  await act(async () => {
    current.resolve('current');
    await currentExecution;
  });
  expect(result.current.status).toBe(PromiseStatus.SUCCESS);
  expect(result.current.result).toBe('current');
  await act(async () => {
    callback.resolve();
    stale.resolve('stale');
    await staleExecution;
  });
  expect(result.current.loading).toBe(false);
  expect(result.current.status).toBe(PromiseStatus.SUCCESS);
  expect(result.current.result).toBe('current');
  expect(onSuccess).toHaveBeenCalledExactlyOnceWith('current');
});
