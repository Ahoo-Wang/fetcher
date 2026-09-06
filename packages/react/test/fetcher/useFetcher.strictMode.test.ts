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
import { Fetcher, FetchExchange } from '@ahoo-wang/fetcher';
import type { FetchRequest } from '@ahoo-wang/fetcher';
import { useFetcher } from '../../src/fetcher/useFetcher';

function createDeferredFetcher() {
  const client = new Fetcher();
  let resolve!: (exchange: FetchExchange) => void;
  let reject!: (error: Error) => void;
  const exchange = vi.spyOn(client, 'exchange').mockImplementation(
    () =>
      new Promise<FetchExchange>((yes, no) => {
        resolve = yes;
        reject = no;
      }),
  );
  return {
    client,
    exchange,
    resolve: (value: FetchExchange) => resolve(value),
    reject: (error: Error) => reject(error),
  };
}

it.each(['success', 'failure'] as const)(
  'does not publish a late %s after the attached request controller is externally aborted',
  async outcome => {
    const deferred = createDeferredFetcher();
    const request: FetchRequest = { url: '/externally-aborted' };
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(
      () =>
        useFetcher<string>({
          fetcher: deferred.client,
          propagateError: true,
          onSuccess,
          onError,
        }),
      { wrapper: StrictMode },
    );
    let execution!: Promise<void | Error>;
    act(() => {
      execution = result.current
        .execute(request)
        .catch((error: Error) => error);
      request.abortController!.abort();
    });
    expect(request.abortController?.signal.aborted).toBe(true);
    const failure = new Error('late extraction failure');
    const exchange = new FetchExchange({
      fetcher: deferred.client,
      request,
      resultExtractor: () => {
        if (outcome === 'failure') throw failure;
        return 'late value';
      },
    });
    await act(async () => {
      deferred.resolve(exchange);
      expect(await execution).toBe(outcome === 'failure' ? failure : undefined);
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.exchange).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  },
);

it.each(['success', 'failure'] as const)(
  'ignores an exchange returned after StrictMode cleanup with late %s',
  async outcome => {
    const deferred = createDeferredFetcher();
    const request: FetchRequest = { url: '/once' };
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onAbort = vi.fn();
    let execution!: Promise<void>;
    const { result } = renderHook(
      () => {
        const fetcher = useFetcher<string>({
          fetcher: deferred.client,
          onSuccess,
          onError,
          onAbort,
        });
        const started = useRef(false);
        useEffect(() => {
          if (started.current) return;
          started.current = true;
          execution = fetcher.execute(request);
        }, [fetcher.execute]);
        return fetcher;
      },
      { wrapper: StrictMode },
    );
    expect(deferred.exchange).toHaveBeenCalledTimes(1);
    expect(request.abortController?.signal.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe('idle');
    const exchange = new FetchExchange({
      fetcher: deferred.client,
      request,
      resultExtractor: () => {
        if (outcome === 'failure') throw new Error('obsolete extraction');
        return 'obsolete';
      },
    });
    await act(async () => {
      deferred.resolve(exchange);
      await execution;
    });
    expect(result.current.exchange).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  },
);

it.each(['abort', 'reset'] as const)(
  'preserves %s behavior when the fetcher ignores cancellation',
  async action => {
    const deferred = createDeferredFetcher();
    const request: FetchRequest = { url: '/pending' };
    const onSuccess = vi.fn();
    const onAbort = vi.fn();
    const { result } = renderHook(() =>
      useFetcher<string>({ fetcher: deferred.client, onSuccess, onAbort }),
    );
    let execution!: Promise<void>;
    act(() => {
      execution = result.current.execute(request);
    });
    act(() => result.current[action]());
    expect(result.current.status).toBe('idle');
    expect(request.abortController?.signal.aborted).toBe(action === 'abort');
    const exchange = new FetchExchange({
      fetcher: deferred.client,
      request,
      resultExtractor: () => 'completed',
    });
    await act(async () => {
      deferred.resolve(exchange);
      await execution;
    });
    expect(result.current.status).toBe(action === 'abort' ? 'idle' : 'success');
    expect(result.current.exchange).toBe(
      action === 'abort' ? undefined : exchange,
    );
    expect(result.current.result).toBe(
      action === 'abort' ? undefined : 'completed',
    );
    expect(onSuccess).toHaveBeenCalledTimes(action === 'abort' ? 0 : 1);
    expect(onAbort).toHaveBeenCalledTimes(action === 'abort' ? 1 : 0);
  },
);

it.each([false, true])(
  'preserves error propagation after cancellation=%s',
  async cancelled => {
    const deferred = createDeferredFetcher();
    const onError = vi.fn();
    const { result } = renderHook(() =>
      useFetcher<string>({
        fetcher: deferred.client,
        propagateError: true,
        onError,
      }),
    );
    let execution!: Promise<void | Error>;
    act(() => {
      execution = result.current
        .execute({ url: '/error' })
        .catch(error => error);
    });
    if (cancelled) act(() => result.current.abort());
    const error = new Error('fetch failed');
    await act(async () => {
      deferred.reject(error);
      expect(await execution).toBe(error);
    });
    expect(result.current.exchange).toBeUndefined();
    expect(result.current.error).toBe(cancelled ? undefined : error);
    expect(result.current.status).toBe(cancelled ? 'idle' : 'error');
    expect(onError).toHaveBeenCalledTimes(cancelled ? 0 : 1);
  },
);

it('keeps the exchange started by a reentrant onAbort during StrictMode cleanup', async () => {
  const client = new Fetcher();
  const staleRequest: FetchRequest = { url: '/stale' };
  const currentRequest: FetchRequest = { url: '/current' };
  let resolveStale!: (exchange: FetchExchange) => void;
  let resolveCurrent!: (exchange: FetchExchange) => void;
  let finishAbort!: () => void;
  const stale = new Promise<FetchExchange>(resolve => {
    resolveStale = resolve;
  });
  const current = new Promise<FetchExchange>(resolve => {
    resolveCurrent = resolve;
  });
  const callback = new Promise<void>(resolve => {
    finishAbort = resolve;
  });
  const exchange = vi
    .spyOn(client, 'exchange')
    .mockImplementation(request =>
      request === staleRequest ? stale : current,
    );
  let execute!: ReturnType<typeof useFetcher<string>>['execute'];
  let staleExecution!: Promise<void>;
  let currentExecution!: Promise<void>;
  const onSuccess = vi.fn();
  const onAbort = vi.fn(() => {
    currentExecution = execute(currentRequest);
    return callback;
  });
  const { result } = renderHook(
    () => {
      const hook = useFetcher<string>({ fetcher: client, onSuccess, onAbort });
      const started = useRef(false);
      useEffect(() => {
        execute = hook.execute;
        if (started.current) return;
        started.current = true;
        staleExecution = hook.execute(staleRequest);
      }, [hook.execute]);
      return hook;
    },
    { wrapper: StrictMode },
  );
  expect(exchange).toHaveBeenCalledTimes(2);
  expect(staleRequest.abortController?.signal.aborted).toBe(true);
  expect(currentRequest.abortController?.signal.aborted).toBe(false);
  expect(result.current.loading).toBe(true);
  const currentExchange = new FetchExchange({
    fetcher: client,
    request: currentRequest,
    resultExtractor: () => 'current',
  });
  await act(async () => {
    resolveCurrent(currentExchange);
    await currentExecution;
  });
  expect(result.current.result).toBe('current');
  expect(result.current.exchange).toBe(currentExchange);
  await act(async () => {
    finishAbort();
    resolveStale(
      new FetchExchange({
        fetcher: client,
        request: staleRequest,
        resultExtractor: () => 'stale',
      }),
    );
    await staleExecution;
  });
  expect(result.current.loading).toBe(false);
  expect(result.current.status).toBe('success');
  expect(result.current.result).toBe('current');
  expect(result.current.exchange).toBe(currentExchange);
  expect(onSuccess).toHaveBeenCalledExactlyOnceWith('current');
  expect(onAbort).toHaveBeenCalledTimes(1);
});

it.each(['caller cleanup', 'onAbort callback'] as const)(
  'stays idle when %s repeats the StrictMode cancellation',
  async mode => {
    const deferred = createDeferredFetcher();
    const request: FetchRequest = { url: '/once' };
    let abortAgain!: () => void;
    let execution!: Promise<void>;
    const onSuccess = vi.fn();
    const onError = vi.fn();
    const onAbort = vi.fn(() => {
      if (mode === 'onAbort callback') abortAgain();
    });
    const { result } = renderHook(
      () => {
        const hook = useFetcher<string>({
          fetcher: deferred.client,
          onSuccess,
          onError,
          onAbort,
        });
        const started = useRef(false);
        useEffect(() => {
          abortAgain = hook.abort;
          if (started.current) return;
          started.current = true;
          execution = hook.execute(request);
          if (mode === 'caller cleanup') return () => hook.abort();
        }, [hook.execute, hook.abort]);
        return hook;
      },
      { wrapper: StrictMode },
    );
    expect(deferred.exchange).toHaveBeenCalledTimes(1);
    expect(request.abortController?.signal.aborted).toBe(true);
    expect(onAbort).toHaveBeenCalledTimes(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe('idle');
    await act(async () => {
      deferred.resolve(
        new FetchExchange({
          fetcher: deferred.client,
          request,
          resultExtractor: () => 'obsolete',
        }),
      );
      await execution;
    });
    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.exchange).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(onSuccess).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  },
);

function deferredResult<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

it.each([
  ['exchange', 'success'],
  ['exchange', 'error'],
  ['extract', 'success'],
  ['extract', 'error'],
] as const)(
  'clears retained exchange after external abort during %s with late %s',
  async (stage, outcome) => {
    const deferred = createDeferredFetcher();
    const previous = new FetchExchange({
      fetcher: deferred.client,
      request: { url: '/previous' },
      resultExtractor: () => 'previous',
    });
    deferred.exchange.mockResolvedValueOnce(previous);
    const { result } = renderHook(
      () =>
        useFetcher<string, Error>({
          fetcher: deferred.client,
          propagateError: true,
        }),
      { wrapper: StrictMode },
    );
    await act(async () => {
      await result.current.execute({ url: '/previous' });
    });
    expect(result.current.exchange).toBe(previous);
    const extraction = deferredResult<string>();
    const extractionStarted = deferredResult<void>();
    const request: FetchRequest = { url: '/cancelled' };
    const failure = new Error('late ordinary failure');
    const next = new FetchExchange({
      fetcher: deferred.client,
      request,
      resultExtractor: () => {
        extractionStarted.resolve();
        return extraction.promise;
      },
    });
    let execution!: Promise<void | Error>;
    act(() => {
      execution = result.current
        .execute(request)
        .catch((error: Error) => error);
    });
    if (stage === 'extract') {
      await act(async () => {
        deferred.resolve(next);
        await extractionStarted.promise;
      });
      expect(result.current.exchange).toBe(next);
    }
    act(() => request.abortController!.abort());
    await act(async () => {
      if (stage === 'exchange') deferred.resolve(next);
      if (outcome === 'success') extraction.resolve('cancelled');
      else extraction.reject(failure);
      expect(await execution).toBe(outcome === 'error' ? failure : undefined);
    });
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.exchange).toBeUndefined();
  },
);

it.each(['success', 'error'] as const)(
  'does not clear a newer execution when an externally aborted old %s callback finishes',
  async outcome => {
    const client = new Fetcher();
    const callbackStarted = deferredResult<void>();
    const callbackFinished = deferredResult<void>();
    const failure = new Error('old failure');
    const oldRequest: FetchRequest = { url: '/old' };
    const oldExchange = new FetchExchange({
      fetcher: client,
      request: oldRequest,
      resultExtractor: () => {
        if (outcome === 'error') throw failure;
        return 'old';
      },
    });
    const next = new FetchExchange({
      fetcher: client,
      request: { url: '/new' },
      resultExtractor: () => 'new',
    });
    vi.spyOn(client, 'exchange').mockImplementation(async request =>
      request.url === '/old' ? oldExchange : next,
    );
    const callback = async () => {
      callbackStarted.resolve();
      await callbackFinished.promise;
      await result.current.execute({ url: '/new' });
    };
    const { result } = renderHook(
      () =>
        useFetcher<string, Error>({
          fetcher: client,
          propagateError: true,
          onSuccess: async value => {
            if (value === 'old') await callback();
          },
          onError: callback,
        }),
      { wrapper: StrictMode },
    );
    let oldExecution!: Promise<void | Error>;
    await act(async () => {
      oldExecution = result.current
        .execute(oldRequest)
        .catch((error: Error) => error);
      await callbackStarted.promise;
    });
    act(() => oldRequest.abortController!.abort());
    await act(async () => {
      callbackFinished.resolve();
      expect(await oldExecution).toBe(
        outcome === 'error' ? failure : undefined,
      );
    });
    expect(result.current.status).toBe('success');
    expect(result.current.result).toBe('new');
    expect(result.current.error).toBeUndefined();
    expect(result.current.exchange).toBe(next);
  },
);
