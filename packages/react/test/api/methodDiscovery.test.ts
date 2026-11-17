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

import { runInNewContext } from 'node:vm';
import { act, renderHook } from '@testing-library/react';
import {
  collectMethods,
  createExecuteApiHooks,
  createQueryApiHooks,
} from '../../src';

const factories = [
  ['createExecuteApiHooks', createExecuteApiHooks],
  ['createQueryApiHooks', createQueryApiHooks],
] as const;

describe('generated hook names that collide are reported (#2017)', () => {
  class Base {
    async load(input: string): Promise<string> {
      return `base:${input}`;
    }
  }
  class Service extends Base {
    async Load(input: string): Promise<string> {
      return `service:${input}`;
    }
  }

  it.each(factories)('%s: inherited methods', (_, create) => {
    expect(() => create({ api: new Service() })).toThrow(
      /"Load" and "load".*"useLoad"/,
    );
  });

  it.each(factories)('%s: a plain object', (_, create) => {
    const api = {
      search: async (query: string) => query,
      Search: async (query: string) => query.toUpperCase(),
    };
    expect(() => create({ api })).toThrow(/"search" and "Search".*"useSearch"/);
  });

  it.each(factories)('%s: an override of the same name', (_, create) => {
    class Override extends Base {
      override async load(input: string): Promise<string> {
        return `override:${input}`;
      }
    }
    const hooks = create({ api: new Override() });
    expect(Object.keys(hooks)).toEqual(['useLoad']);
  });

  it('the override is the method a hook calls', async () => {
    class Override extends Base {
      override async load(input: string): Promise<string> {
        return `override:${input}`;
      }
    }
    const hooks = createExecuteApiHooks({ api: new Override() });
    const { result } = renderHook(() => hooks.useLoad());
    await act(async () => {
      await result.current.execute('input');
    });
    expect(result.current.result).toBe('override:input');
  });
});

describe('collectMethods stops at the Object.prototype of any realm (#2045)', () => {
  const local = {
    async search(query: string) {
      return query;
    },
  };
  const foreign = runInNewContext(
    '({ async search(query) { return query; } })',
  ) as typeof local;

  it('collects the same methods for a local and a foreign object', () => {
    expect([...collectMethods(local).keys()]).toEqual(['search']);
    expect([...collectMethods(foreign).keys()]).toEqual(['search']);
  });

  it.each(factories)('%s: one hook for a foreign service', (_, create) => {
    expect(Object.keys(create({ api: foreign }))).toEqual(['useSearch']);
  });

  it('keeps a foreign class method named like a built-in', () => {
    const service = runInNewContext(
      `new (class Service {
        async search(query) { return query; }
        async toString() { return 'service'; }
      })()`,
    ) as object;
    expect([...collectMethods(service).keys()].sort()).toEqual([
      'search',
      'toString',
    ]);
  });

  it('a foreign service method still runs', async () => {
    await expect(collectMethods(foreign).get('search')!('ok')).resolves.toBe(
      'ok',
    );
  });
});
