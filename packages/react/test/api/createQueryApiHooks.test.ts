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

import { act, renderHook, waitFor } from '@testing-library/react';
import {
  collectMethods,
  createQueryApiHooks,
  methodNameToHookName,
} from '../../src';

describe('methodNameToHookName', () => {
  it('prefixes use and capitalizes', () => {
    expect(methodNameToHookName('getUser')).toBe('useGetUser');
    expect(() => methodNameToHookName('')).toThrow();
  });
});

describe('collectMethods', () => {
  class Base {
    base = 'base';
    async inherited() {
      return this.base;
    }
    async overridden() {
      return 'base';
    }
  }
  class Api extends Base {
    own = async () => 'own';
    async overridden() {
      return 'api';
    }
    get accessor() {
      throw new Error('getters must not run');
    }
  }

  it('collects own and inherited methods bound to the object, nearest first', async () => {
    const methods = collectMethods(new Api());
    expect([...methods.keys()].sort()).toEqual([
      'inherited',
      'overridden',
      'own',
    ]);
    expect(await methods.get('inherited')!()).toBe('base');
    expect(await methods.get('overridden')!()).toBe('api');
  });

  it('collects the methods of a plain object', () => {
    const methods = collectMethods({ a: async () => 1, b: 2 });
    expect([...methods.keys()]).toEqual(['a']);
  });
});

describe('createQueryApiHooks', () => {
  const api = {
    search: vi.fn(
      async (
        query: { keyword: string },
        attributes?: Record<string, any>,
        _abortController?: AbortController,
      ) => ({ query, attributes }),
    ),
  };
  const hooks = createQueryApiHooks({ api });

  beforeEach(() => api.search.mockClear());

  it('runs the method with the controlled query, attributes and controller', async () => {
    const { result } = renderHook(() =>
      hooks.useSearch({ query: { keyword: 'a' }, attributes: { tenant: 't' } }),
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    expect(api.search).toHaveBeenCalledExactlyOnceWith(
      { keyword: 'a' },
      { tenant: 't' },
      expect.any(AbortController),
    );
    expect(result.current.result).toEqual({
      query: { keyword: 'a' },
      attributes: { tenant: 't' },
    });
  });

  it('runs again when the query changes and on demand', async () => {
    const { result, rerender } = renderHook(
      ({ keyword }) => hooks.useSearch({ query: { keyword } }),
      { initialProps: { keyword: 'a' } },
    );
    await waitFor(() => expect(result.current.status).toBe('success'));
    rerender({ keyword: 'b' });
    await waitFor(() =>
      expect(result.current.result?.query).toEqual({ keyword: 'b' }),
    );
    await act(async () => {
      await result.current.execute();
    });
    expect(api.search).toHaveBeenCalledTimes(3);
  });

  it('waits while the query is undefined', () => {
    const { result } = renderHook(() => hooks.useSearch());
    expect(result.current.status).toBe('idle');
    expect(api.search).not.toHaveBeenCalled();
  });

  it('records a failure', async () => {
    const error = new Error('boom');
    api.search.mockRejectedValueOnce(error);
    const { result } = renderHook(() =>
      hooks.useSearch({ query: { keyword: 'a' } }),
    );
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(error);
  });
});
