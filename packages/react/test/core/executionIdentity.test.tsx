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

import {
  Activity,
  StrictMode,
  useEffect,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import { act, render, renderHook, waitFor } from '@testing-library/react';
import {
  ExchangeError,
  Fetcher,
  FetchTimeoutError,
  HttpStatusValidationError,
  type FetchRequest,
} from '@ahoo-wang/fetcher';
import {
  createExecuteApiHooks,
  useExecutePromise,
  useFetcher,
  type UseExecutePromiseReturn,
} from '../../src';

const never = () => new Promise<string>(() => {});

describe('re-entering execute from a cancellation keeps every execution cancelable (#2006)', () => {
  function useReentrant(reenter: { current: boolean }) {
    const controllers: AbortController[] = [];
    let hook!: UseExecutePromiseReturn<string>;
    const view = renderHook(() => {
      hook = useExecutePromise<string>({
        onAbort: () => {
          if (!reenter.current) return;
          reenter.current = false;
          void hook.execute(controller => {
            controllers.push(controller);
            return never();
          });
        },
      });
      return hook;
    });
    const start = () =>
      act(() => {
        void view.result.current.execute(controller => {
          controllers.push(controller);
          return never();
        });
      });
    return { ...view, controllers, start };
  }

  it.each(['unmount', 'abort', 'reset'] as const)(
    'cancels all of them on %s',
    how => {
      const { controllers, start, result, unmount } = useReentrant({
        current: true,
      });
      start();
      start();
      expect(controllers.length).toBeGreaterThanOrEqual(2);
      expect(result.current.status).toBe('loading');
      if (how === 'unmount') unmount();
      else act(() => result.current[how]());
      expect(controllers.map(c => c.signal.aborted)).toEqual(
        controllers.map(() => true),
      );
      if (how !== 'unmount') expect(result.current.status).toBe('idle');
    },
  );

  it('a later execute cancels the re-entered one', () => {
    const { controllers, start, unmount } = useReentrant({ current: true });
    start();
    start();
    const reentered = controllers[controllers.length - 1];
    start();
    expect(reentered.signal.aborted).toBe(true);
    expect(controllers.filter(c => !c.signal.aborted)).toHaveLength(1);
    unmount();
  });

  it('re-entering from an abort listener of the signal', () => {
    const controllers: AbortController[] = [];
    let reenter = true;
    const { result, unmount } = renderHook(() => useExecutePromise<string>());
    const supplier = (controller: AbortController) => {
      controllers.push(controller);
      controller.signal.addEventListener('abort', () => {
        if (!reenter) return;
        reenter = false;
        void result.current.execute(inner => {
          controllers.push(inner);
          return never();
        });
      });
      return never();
    };
    act(() => {
      void result.current.execute(supplier);
    });
    act(() => {
      void result.current.execute(supplier);
    });
    unmount();
    expect(controllers.map(c => c.signal.aborted)).toEqual(
      controllers.map(() => true),
    );
  });
});

describe('a caller signal wrapped by Fetcher returns to idle (#2018)', () => {
  // A fetch that waits for its signal, like a real request in flight.
  function hangingFetcher(started?: () => void) {
    return new Fetcher({
      baseURL: 'https://abort.test',
      fetch: (_input, init) =>
        new Promise<Response>((_resolve, reject) => {
          const signal = init?.signal;
          if (signal?.aborted) return reject(signal.reason);
          signal?.addEventListener('abort', () => reject(signal.reason));
          started?.();
        }),
    });
  }

  it.each(['before sending', 'in flight'] as const)(
    'useFetcher, aborted %s',
    async when => {
      let notify!: () => void;
      const sent = new Promise<void>(resolve => (notify = resolve));
      const fetcher = hangingFetcher(() => notify());
      const onError = vi.fn();
      const { result } = renderHook(() => useFetcher({ fetcher, onError }));
      const caller = new AbortController();
      if (when === 'before sending') caller.abort();
      let pending!: ReturnType<typeof result.current.execute>;
      act(() => {
        pending = result.current.execute({
          url: '/slow',
          signal: caller.signal,
        });
      });
      let state!: Awaited<typeof pending>;
      await act(async () => {
        if (when === 'in flight') {
          await sent;
          caller.abort();
        }
        state = await pending;
      });
      expect(state.status).toBe('idle');
      expect(result.current.status).toBe('idle');
      expect(result.current.error).toBeUndefined();
      expect(onError).not.toHaveBeenCalled();
    },
  );

  it('an execute API hook calling a service with the caller signal', async () => {
    const fetcher = hangingFetcher();
    class Service {
      async load(signal: AbortSignal): Promise<unknown> {
        const exchange = await fetcher.exchange({ url: '/load', signal });
        return exchange.extractResult();
      }
    }
    const hooks = createExecuteApiHooks({ api: new Service() });
    const onError = vi.fn();
    const { result } = renderHook(() => hooks.useLoad({ onError }));
    const caller = new AbortController();
    let pending!: ReturnType<typeof result.current.execute>;
    act(() => {
      pending = result.current.execute(caller.signal);
    });
    let state!: Awaited<typeof pending>;
    await act(async () => {
      await Promise.resolve();
      caller.abort();
      state = await pending;
    });
    expect(state.status).toBe('idle');
    expect(result.current.status).toBe('idle');
    expect(onError).not.toHaveBeenCalled();
  });

  async function failWith(request: FetchRequest, fetcher: Fetcher) {
    const onError = vi.fn();
    const { result } = renderHook(() => useFetcher({ fetcher, onError }));
    let state!: Awaited<ReturnType<typeof result.current.execute>>;
    await act(async () => {
      state = await result.current.execute(request);
    });
    expect(state.status).toBe('error');
    expect(result.current.status).toBe('error');
    expect(onError).toHaveBeenCalledOnce();
    return state.error;
  }

  it('keeps a network failure an error', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://abort.test',
      fetch: async () => {
        throw new TypeError('Failed to fetch');
      },
    });
    const error = await failWith({ url: '/down' }, fetcher);
    expect(error).toBeInstanceOf(ExchangeError);
  });

  it('keeps an HTTP status failure an error', async () => {
    const fetcher = new Fetcher({
      baseURL: 'https://abort.test',
      fetch: async () => new Response('nope', { status: 500 }),
    });
    const error = await failWith({ url: '/500' }, fetcher);
    expect(error).toBeInstanceOf(HttpStatusValidationError);
  });

  it('keeps a timeout an error', async () => {
    const error = await failWith(
      { url: '/slow', timeout: 5 },
      hangingFetcher(),
    );
    expect(error).toBeInstanceOf(ExchangeError);
    expect((error as ExchangeError).cause).toBeInstanceOf(FetchTimeoutError);
  });
});

describe('an execution waiting for effects to reconnect has its identity (#2023)', () => {
  it('Activity reveal: the latest execute decides the result', async () => {
    let latest!: UseExecutePromiseReturn<string>;
    const calls: string[] = [];
    function Probe() {
      latest = useExecutePromise<string>();
      const { execute } = latest;
      useLayoutEffect(() => {
        calls.push('request:layout');
        void execute(async () => {
          calls.push('supplier:layout');
          return 'layout';
        });
      }, [execute]);
      useEffect(() => {
        calls.push('request:passive');
        void execute(async () => {
          calls.push('supplier:passive');
          return 'passive';
        });
      }, [execute]);
      return null;
    }
    const view = render(
      <Activity mode="visible">
        <Probe />
      </Activity>,
    );
    await waitFor(() => expect(latest.result).toBe('passive'));
    view.rerender(
      <Activity mode="hidden">
        <Probe />
      </Activity>,
    );
    view.rerender(
      <Activity mode="visible">
        <Probe />
      </Activity>,
    );
    await act(async () => {});
    expect(calls.slice(-3)).toEqual([
      'request:layout',
      'request:passive',
      'supplier:passive',
    ]);
    expect(latest.result).toBe('passive');
  });

  it.each([
    ['plain', ({ children }: { children: ReactNode }) => <>{children}</>],
    ['StrictMode', StrictMode],
  ] as const)(
    '%s: abort right after execute in a layout effect',
    async (_, wrapper) => {
      const supplier = vi.fn(async () => 'cancelled');
      const { result } = renderHook(
        () => {
          const state = useExecutePromise<string>();
          const { execute, abort } = state;
          useLayoutEffect(() => {
            void execute(supplier);
            abort();
          }, [execute, abort]);
          return state;
        },
        { wrapper },
      );
      await act(async () => {});
      expect(result.current.status).toBe('idle');
      expect(result.current.result).toBeUndefined();
    },
  );

  it('StrictMode: a layout-effect execution still runs after the replay', async () => {
    const { result } = renderHook(
      () => {
        const state = useExecutePromise<string>();
        const { execute } = state;
        useLayoutEffect(() => {
          void execute(async () => 'layout');
        }, [execute]);
        return state;
      },
      { wrapper: StrictMode },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(result.current.result).toBe('layout');
  });

  it('does not run after a real unmount', async () => {
    const supplier = vi.fn(async () => 'late');
    const { result, unmount } = renderHook(() => useExecutePromise<string>());
    const { execute } = result.current;
    unmount();
    const state = await execute(supplier);
    expect(state.status).toBe('idle');
    expect(supplier).not.toHaveBeenCalled();
  });
});
