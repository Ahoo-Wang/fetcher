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

import { act, cleanup, renderHook } from '@testing-library/react';
import { createExecuteApiHooks, createQueryApiHooks } from '../../src/api';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

it.each([
  [createExecuteApiHooks, 'in'],
  [createQueryApiHooks, 'in'],
  [createExecuteApiHooks, 'own'],
  [createQueryApiHooks, 'own'],
  [createExecuteApiHooks, 'descriptor'],
  [createQueryApiHooks, 'descriptor'],
] as const)(
  'reports only real getter hooks at the first reflection lookup %#',
  (createHooks, reflection) => {
    const reads = { ready: 0, load: 0 };
    const hooks = createHooks({
      api: {
        get ready() {
          reads.ready++;
          return true;
        },
        get load() {
          reads.load++;
          return async () => 'loaded';
        },
        async other() {
          return 'other';
        },
      },
    });
    const exists = (key: string) =>
      reflection === 'in'
        ? key in hooks
        : reflection === 'own'
          ? Object.hasOwn(hooks, key)
          : Object.getOwnPropertyDescriptor(hooks, key) !== undefined;
    expect(reads).toEqual({ ready: 0, load: 0 });
    expect(exists('useReady')).toBe(false);
    expect(exists('useReady')).toBe(false);
    expect(reads).toEqual({ ready: 1, load: 0 });
    expect(exists('useLoad')).toBe(true);
    expect(exists('useLoad')).toBe(true);
    const load = hooks.useLoad;
    expect(load).toBeTypeOf('function');
    expect(hooks.useLoad).toBe(load);
    expect(exists('useOther')).toBe(true);
    expect(Object.keys(hooks)).toEqual(['useLoad', 'useOther']);
    expect(reads).toEqual({ ready: 1, load: 1 });
  },
);

it.each([createExecuteApiHooks, createQueryApiHooks])(
  'collects API methods without evaluating accessors',
  createHooks => {
    class Api {
      state = { ready: true };
      get ready() {
        return this.state.ready;
      }
      async list() {
        return [];
      }
    }
    const hooks = createHooks({ api: new Api() });
    expect(Object.keys(hooks)).toEqual(['useList']);
    expect(hooks.useList).toBeTypeOf('function');
  },
);

it.each([createExecuteApiHooks, createQueryApiHooks])(
  'keeps a method hook when a non-function getter maps to the same name',
  createHooks => {
    const hooks = createHooks({
      api: {
        async load() {
          return 'loaded';
        },
        get Load() {
          return false;
        },
      },
    });
    expect(Object.keys(hooks)).toEqual(['useLoad']);
    expect(hooks.useLoad).toBeTypeOf('function');
  },
);

it.each([createExecuteApiHooks, createQueryApiHooks])(
  'includes function-valued getters when enumerating or copying generated hooks',
  createHooks => {
    let reads = 0;
    class Api {
      get load() {
        reads++;
        return async () => 'loaded';
      }
      get ready() {
        return true;
      }
    }
    const hooks = createHooks({ api: new Api() });
    expect(reads).toBe(0);
    expect(Object.keys(hooks)).toEqual(['useLoad']);
    expect({ ...hooks }).toEqual({ useLoad: hooks.useLoad });
    expect(Object.assign({}, hooks)).toEqual({ useLoad: hooks.useLoad });
    expect(reads).toBe(1);
  },
);

it.each([
  [createExecuteApiHooks, false],
  [createQueryApiHooks, false],
  [createExecuteApiHooks, true],
  [createQueryApiHooks, true],
] as const)(
  'allows replacing getter hooks before and after lazy resolution %#',
  (createHooks, cached) => {
    let reads = 0;
    const hooks = createHooks({
      api: {
        get load() {
          reads++;
          return async () => 'loaded';
        },
        async other() {
          return 'other';
        },
      },
    });
    if (cached) expect(hooks.useLoad).toBeTypeOf('function');
    const replacement = createHooks({
      api: {
        async other() {
          return 'replacement';
        },
      },
    }).useOther;
    hooks.useLoad = replacement;
    hooks.useOther = replacement;
    expect(reads).toBe(cached ? 1 : 0);
    expect(hooks.useLoad).toBe(replacement);
    expect(hooks.useOther).toBe(replacement);
    expect({ ...hooks }).toEqual({
      useLoad: replacement,
      useOther: replacement,
    });
    expect(reads).toBe(cached ? 1 : 0);
  },
);

it('lazily exposes function-valued API getters bound to the API instance', async () => {
  let getterReads = 0;
  class BaseApi {
    prefix = 'base';
    get load() {
      getterReads++;
      return async function (this: BaseApi, id: string) {
        return `${this.prefix}:${id}`;
      };
    }
  }
  class Api extends BaseApi {
    prefix = 'instance';
    get ready(): boolean {
      throw new Error('Ordinary getters must not run during hook creation');
    }
  }
  const api = new Api();
  const executeHooks = createExecuteApiHooks({ api });
  const queryHooks = createQueryApiHooks({ api });
  expect(getterReads).toBe(0);

  const executor = renderHook(() => executeHooks.useLoad());
  const query = renderHook(() =>
    queryHooks.useLoad({ initialQuery: 'query', autoExecute: false }),
  );
  await act(async () => {
    await executor.result.current.execute('execute');
    await query.result.current.execute();
  });
  expect(executor.result.current.result).toBe('instance:execute');
  expect(query.result.current.result).toBe('instance:query');
  const executeHook = executeHooks.useLoad;
  const queryHook = queryHooks.useLoad;
  expect(executeHooks.useLoad).toBe(executeHook);
  expect(queryHooks.useLoad).toBe(queryHook);
  expect(getterReads).toBe(2);
});

describe.each([createExecuteApiHooks, createQueryApiHooks])(
  'API hook name collisions %#',
  createHooks => {
    it.each([false, true])(
      'uses the last function when the later getter returns a function: %s',
      async laterIsFunction => {
        let reads = 0;
        const hooks = createHooks({
          api: {
            get load() {
              reads++;
              return async () => 'first';
            },
            get Load() {
              reads++;
              return laterIsFunction ? async () => 'last' : false;
            },
          },
        });
        expect(reads).toBe(0);
        expect(Object.keys(hooks)).toEqual(['useLoad']);
        const hook = hooks.useLoad;
        expect({ ...hooks }).toEqual({ useLoad: hook });
        expect(Object.assign({}, hooks)).toEqual({ useLoad: hook });
        const resolvedReads = reads;
        const { result } = renderHook(() =>
          hook({ initialQuery: 'query', autoExecute: false }),
        );
        await act(async () => {
          await result.current.execute();
        });
        expect(result.current.result).toBe(laterIsFunction ? 'last' : 'first');
        expect(reads).toBe(resolvedReads);
      },
    );

    it('ignores an earlier non-function getter when a later getter returns a method', async () => {
      let reads = 0;
      const hooks = createHooks({
        api: {
          get load() {
            reads++;
            return false;
          },
          get Load() {
            reads++;
            return async () => 'last';
          },
        },
      });
      expect(reads).toBe(0);
      const { result } = renderHook(() =>
        hooks.useLoad({ initialQuery: 'query', autoExecute: false }),
      );
      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.result).toBe('last');
      expect(Object.keys(hooks)).toEqual(['useLoad']);
    });

    it.each([false, true])(
      'preserves method order when an ordinary method precedes a getter returning a function: %s',
      async laterIsFunction => {
        let reads = 0;
        const hooks = createHooks({
          api: {
            async load() {
              return 'first';
            },
            get Load() {
              reads++;
              return laterIsFunction ? async () => 'last' : false;
            },
          },
        });
        expect(reads).toBe(0);
        const { result } = renderHook(() =>
          hooks.useLoad({ initialQuery: 'query', autoExecute: false }),
        );
        await act(async () => {
          await result.current.execute();
        });
        expect(result.current.result).toBe(laterIsFunction ? 'last' : 'first');
        expect(reads).toBe(1);
        expect(Object.keys(hooks)).toEqual(['useLoad']);
      },
    );

    it('preserves method order when a getter precedes an ordinary method', async () => {
      let reads = 0;
      const hooks = createHooks({
        api: {
          get load() {
            reads++;
            return async () => 'first';
          },
          async Load() {
            return 'last';
          },
        },
      });
      expect(reads).toBe(0);
      const { result } = renderHook(() =>
        hooks.useLoad({ initialQuery: 'query', autoExecute: false }),
      );
      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.result).toBe('last');
      expect(Object.keys(hooks)).toEqual(['useLoad']);
    });

    it.each(['own', 'inherited'])(
      'lazily creates hooks for %s accessors through a Proxy get trap',
      async placement => {
        const reads = { getter: 0, proxy: 0 };
        class Api {
          prefix = 'instance';
          get load() {
            reads.getter++;
            return undefined;
          }
        }
        const target = new Api();
        if (placement === 'own') {
          Object.defineProperty(
            target,
            'load',
            Object.getOwnPropertyDescriptor(Api.prototype, 'load')!,
          );
        }
        const api = new Proxy(target, {
          get(target, key, receiver) {
            if (key === 'load') {
              reads.proxy++;
              return async function (this: Api) {
                return `${this.prefix}:proxy`;
              };
            }
            return Reflect.get(target, key, receiver);
          },
        });
        const hooks = createHooks({ api });
        expect(reads).toEqual({ getter: 0, proxy: 0 });
        expect('useLoad' in hooks).toBe(true);
        const hook = Reflect.get(hooks, 'useLoad');
        const { result } = renderHook(() =>
          hook({ initialQuery: 'query', autoExecute: false }),
        );
        await act(async () => {
          await result.current.execute();
        });
        expect(result.current.result).toBe('instance:proxy');
        expect(Object.keys(hooks)).toEqual(['useLoad']);
        expect(Reflect.get(hooks, 'useLoad')).toBe(hook);
        expect(reads).toEqual({ getter: 0, proxy: 1 });
      },
    );

    it('creates hooks for inherited ordinary properties through the original Proxy', async () => {
      let reads = 0;
      class Api {
        prefix = 'instance';
        async load() {
          return 'prototype';
        }
      }
      const api = new Proxy(new Api(), {
        get(target, key, receiver) {
          if (key === 'load') {
            reads++;
            return async function (this: Api) {
              return `${this.prefix}:proxy`;
            };
          }
          return Reflect.get(target, key, receiver);
        },
      });
      const hooks = createHooks({ api });
      const hook = hooks.useLoad;
      const { result } = renderHook(() =>
        hook({ initialQuery: 'query', autoExecute: false }),
      );
      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.result).toBe('instance:proxy');
      expect(Object.keys(hooks)).toEqual(['useLoad']);
      expect(hooks.useLoad).toBe(hook);
      expect(reads).toBe(1);
    });

    it('creates hooks for ordinary API properties supplied by a Proxy get trap', async () => {
      const api = new Proxy(
        { prefix: 'instance', load: async () => 'placeholder' },
        {
          get(target, key, receiver) {
            if (key === 'load') {
              return async function (this: { prefix: string }) {
                return `${this.prefix}:proxy`;
              };
            }
            return Reflect.get(target, key, receiver);
          },
        },
      );
      const hooks = createHooks({ api });
      expect(Object.keys(hooks)).toEqual(['useLoad']);
      const { result } = renderHook(() =>
        hooks.useLoad({ initialQuery: 'query', autoExecute: false }),
      );
      await act(async () => {
        await result.current.execute();
      });
      expect(result.current.result).toBe('instance:proxy');
    });
  },
);
