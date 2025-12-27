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

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createExecuteApiHooks } from '../../src/api/createExecuteApiHooks';

describe('createExecuteApiHooks', () => {
  // Mock API object
  const mockApi = {
    getUser: vi.fn((id: string) => Promise.resolve({ id, name: 'John Doe' })),
    createUser: vi.fn((user: { name: string }) =>
      Promise.resolve({ id: '123', ...user }),
    ),
    deleteUser: vi.fn((id: string) => Promise.resolve({ success: true })),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create hooks for each API method', () => {
    const apiHooks = createExecuteApiHooks({ api: mockApi });

    expect(typeof apiHooks.useGetUser).toBe('function');
    expect(typeof apiHooks.useCreateUser).toBe('function');
    expect(typeof apiHooks.useDeleteUser).toBe('function');
  });

  it('should execute API method and update state correctly for successful call', async () => {
    const apiHooks = createExecuteApiHooks({ api: mockApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: false }),
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.status).toBe('idle');

    await act(async () => {
      await result.current.execute('user123');
    });

    expect(mockApi.getUser).toHaveBeenCalledWith('user123');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toEqual({ id: 'user123', name: 'John Doe' });
    expect(result.current.error).toBeUndefined();
    expect(result.current.status).toBe('success');
  });

  it('should handle API method with multiple parameters', async () => {
    const apiHooks = createExecuteApiHooks({ api: mockApi });

    const { result } = renderHook(() =>
      apiHooks.useCreateUser({ appendAbortController: false }),
    );

    await act(async () => {
      await result.current.execute({ name: 'Jane Doe' });
    });

    expect(mockApi.createUser).toHaveBeenCalledWith({ name: 'Jane Doe' });
    expect(result.current.result).toEqual({ id: '123', name: 'Jane Doe' });
  });

  it('should handle API error correctly', async () => {
    const errorApi = {
      getUser: vi.fn((id: string) => Promise.reject(new Error('API Error'))),
    };
    const apiHooks = createExecuteApiHooks({ api: errorApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: false }),
    );

    await act(async () => {
      await result.current.execute('user123');
    });

    expect(errorApi.getUser).toHaveBeenCalledWith('user123');
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.status).toBe('error');
  });

  it('should reset state correctly', async () => {
    const apiHooks = createExecuteApiHooks({ api: mockApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: false }),
    );

    await act(async () => {
      await result.current.execute('user123');
    });

    expect(result.current.status).toBe('success');

    act(() => {
      result.current.reset();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    expect(result.current.status).toBe('idle');
  });

  it('should abort ongoing request', async () => {
    let resolvePromise: (value: any) => void;
    const slowApi = {
      getUser: vi.fn(
        (id: string) =>
          new Promise(resolve => {
            resolvePromise = resolve;
          }),
      ),
    };
    const apiHooks = createExecuteApiHooks({ api: slowApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: false }),
    );

    await act(async () => {
      result.current.execute('user123');
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.abort();
    });

    // Resolve the promise after abort
    act(() => {
      resolvePromise({ id: 'user123', name: 'John Doe' });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeUndefined();
  });

  it('should pass useExecutePromiseOptions to underlying hook', async () => {
    const errorApi = {
      getUser: vi.fn((id: string) => Promise.reject(new Error('Test Error'))),
    };
    const errorApiHooks = createExecuteApiHooks({ api: errorApi });

    const { result: errorResult } = renderHook(() =>
      errorApiHooks.useGetUser({
        propagateError: true,
        appendAbortController: false,
      }),
    );

    await expect(
      act(async () => {
        await errorResult.current.execute('user123');
      }),
    ).rejects.toThrow('Test Error');
  });

  it('should handle empty API object', () => {
    const emptyApi = {};
    const apiHooks = createExecuteApiHooks({ api: emptyApi as any });

    expect(Object.keys(apiHooks)).toHaveLength(0);
  });

  it('should maintain type safety at runtime', () => {
    const typedApi = {
      getUser: (id: string) => Promise.resolve({ id }),
      createUser: (data: { name: string; age: number }) =>
        Promise.resolve({ ...data, id: '123' }),
    };
    const apiHooks = createExecuteApiHooks({ api: typedApi });

    const { result: getResult } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: false }),
    );
    const { result: createResult } = renderHook(() =>
      apiHooks.useCreateUser({ appendAbortController: false }),
    );

    // These should not throw at runtime due to type safety
    expect(typeof getResult.current.execute).toBe('function');
    expect(typeof createResult.current.execute).toBe('function');
  });

  it('should support custom error types', async () => {
    class CustomError extends Error {
      constructor(
        message: string,
        public code: number,
      ) {
        super(message);
        this.name = 'CustomError';
      }
    }

    const customErrorApi = {
      getUser: vi.fn((id: string) =>
        Promise.reject(new CustomError('Custom error', 400)),
      ),
    };
    const apiHooks = createExecuteApiHooks<typeof customErrorApi, CustomError>({
      api: customErrorApi,
    });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: false }),
    );

    await act(async () => {
      await result.current.execute('user123');
    });

    expect(customErrorApi.getUser).toHaveBeenCalledWith('user123');
    expect(result.current.error).toBeInstanceOf(CustomError);
    expect((result.current.error as CustomError).code).toBe(400);
    expect(result.current.error?.message).toBe('Custom error');
  });

  it('should support class methods from prototype chain', async () => {
    class ApiService {
      baseUrl = '/api';

      getUser(id: string) {
        return Promise.resolve({ id, url: this.baseUrl });
      }

      createUser(data: { name: string }) {
        return Promise.resolve({ ...data, id: '123', url: this.baseUrl });
      }
    }

    const apiInstance = new ApiService();
    const apiHooks = createExecuteApiHooks({ api: apiInstance });

    // Should have hooks for both methods
    expect(typeof apiHooks.useGetUser).toBe('function');
    expect(typeof apiHooks.useCreateUser).toBe('function');

    // Test getUser hook
    const { result: getResult } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: false }),
    );

    await act(async () => {
      await getResult.current.execute('user123');
    });

    expect(getResult.current.result).toEqual({ id: 'user123', url: '/api' });

    // Test createUser hook
    const { result: createResult } = renderHook(() =>
      apiHooks.useCreateUser({ appendAbortController: false }),
    );

    await act(async () => {
      await createResult.current.execute({ name: 'John' });
    });

    expect(createResult.current.result).toEqual({
      name: 'John',
      id: '123',
      url: '/api',
    });
  });

  it('should append AbortController when enabled', async () => {
    const mockApiWithController = {
      getUser: vi.fn((id: string, controller?: AbortController) =>
        Promise.resolve({ id, hasController: !!controller }),
      ),
    };
    const apiHooks = createExecuteApiHooks({ api: mockApiWithController });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: true }),
    );

    await act(async () => {
      await result.current.execute('user123');
    });

    expect(mockApiWithController.getUser).toHaveBeenCalledWith(
      'user123',
      expect.any(AbortController),
    );
  });

  it('should not append AbortController when disabled', async () => {
    const mockApiWithoutController = {
      getUser: vi.fn((id: string) => Promise.resolve({ id })),
    };
    const apiHooks = createExecuteApiHooks({ api: mockApiWithoutController });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({ appendAbortController: false }),
    );

    await act(async () => {
      await result.current.execute('user123');
    });

    expect(mockApiWithoutController.getUser).toHaveBeenCalledWith('user123');
    expect(mockApiWithoutController.getUser).not.toHaveBeenCalledWith(
      'user123',
      expect.anything(),
    );
  });
});
