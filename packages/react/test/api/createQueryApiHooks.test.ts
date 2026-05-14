import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { createQueryApiHooks } from '../../src/api/createQueryApiHooks';

describe('createQueryApiHooks', () => {
  // Mock API object
  const mockApi = {
    getUser: vi.fn(
      (
        query: { id: string },
        attributes?: Record<string, any>,
        abortController?: AbortController,
      ) => Promise.resolve({ id: query.id, name: 'John Doe' }),
    ),
    getUsers: vi.fn(
      (
        query: { page: number; limit: number },
        attributes?: Record<string, any>,
        abortController?: AbortController,
      ) =>
        Promise.resolve([
          { id: '1', name: 'John' },
          { id: '2', name: 'Jane' },
        ]),
    ),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should create hooks for each API method', () => {
    const apiHooks = createQueryApiHooks({ api: mockApi });
    expect(typeof apiHooks.useGetUser).toBe('function');
    expect(typeof apiHooks.useGetUsers).toBe('function');
  });

  it('should execute query and update state correctly for successful call', async () => {
    const apiHooks = createQueryApiHooks({ api: mockApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
      }),
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.result).toEqual({ id: '123', name: 'John Doe' });
    expect(result.current.error).toBeUndefined();
    expect(result.current.status).toBe('success');
    expect(mockApi.getUser).toHaveBeenCalledWith(
      { id: '123' },
      undefined,
      expect.any(AbortController),
    );
  });

  it('should support autoExecute', async () => {
    const apiHooks = createQueryApiHooks({ api: mockApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
        autoExecute: true,
      }),
    );

    // Wait for auto-execution
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.result).toEqual({ id: '123', name: 'John Doe' });
    expect(mockApi.getUser).toHaveBeenCalledWith(
      { id: '123' },
      undefined,
      expect.any(AbortController),
    );
  });

  it('should call onBeforeExecute with abortController and query', async () => {
    const apiHooks = createQueryApiHooks({ api: mockApi });

    let receivedController: AbortController | undefined;
    let receivedQuery: any;

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
        onBeforeExecute: (abortController, query) => {
          receivedController = abortController;
          receivedQuery = query;
        },
      }),
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(receivedController).toBeInstanceOf(AbortController);
    expect(receivedQuery).toEqual({ id: '123' });
  });

  it('should allow query modification in onBeforeExecute', async () => {
    const apiHooks = createQueryApiHooks({ api: mockApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
        onBeforeExecute: (abortController, query) => {
          // Modify query in place
          query.id = 'modified-123';
        },
      }),
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(mockApi.getUser).toHaveBeenCalledWith(
      { id: 'modified-123' },
      undefined,
      expect.any(AbortController),
    );
  });

  it('should support setQuery and getQuery', async () => {
    const apiHooks = createQueryApiHooks({ api: mockApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
      }),
    );

    expect(result.current.getQuery()).toEqual({ id: '123' });

    act(() => {
      result.current.setQuery({ id: '456' });
    });

    expect(result.current.getQuery()).toEqual({ id: '456' });
  });

  it('should handle API error correctly', async () => {
    const errorApi = {
      getUser: vi.fn((query: { id: string }) =>
        Promise.reject(new Error('API Error')),
      ),
    };
    const apiHooks = createQueryApiHooks({ api: errorApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
      }),
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(errorApi.getUser).toHaveBeenCalledWith(
      { id: '123' },
      undefined,
      expect.any(AbortController),
    );
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('API Error');
    expect(result.current.status).toBe('error');
  });

  it('should reset state correctly', async () => {
    const apiHooks = createQueryApiHooks({ api: mockApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
      }),
    );

    await act(async () => {
      await result.current.execute();
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
        (query: { id: string }) =>
          new Promise(resolve => {
            resolvePromise = resolve;
          }),
      ),
    };
    const apiHooks = createQueryApiHooks({ api: slowApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
      }),
    );

    await act(async () => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);

    act(() => {
      result.current.abort();
    });

    act(() => {
      resolvePromise({ id: '123', name: 'John Doe' });
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe('idle');
    expect(result.current.result).toBeUndefined();
  });

  it('should handle empty API object', () => {
    const emptyApi = {};
    const apiHooks = createQueryApiHooks({ api: emptyApi as any });

    expect(Object.keys(apiHooks)).toHaveLength(0);
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
      getUser: vi.fn((query: { id: string }) =>
        Promise.reject(new CustomError('Custom error', 400)),
      ),
    };
    const apiHooks = createQueryApiHooks<
      typeof customErrorApi,
      CustomError
    >({ api: customErrorApi });

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
      }),
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(customErrorApi.getUser).toHaveBeenCalledWith(
      { id: '123' },
      undefined,
      expect.any(AbortController),
    );
    expect(result.current.error).toBeInstanceOf(CustomError);
    expect((result.current.error as CustomError).code).toBe(400);
    expect(result.current.error?.message).toBe('Custom error');
  });

  it('should support class methods from prototype chain', async () => {
    class ApiService {
      baseUrl = '/api';

      getUser(query: { id: string }) {
        return Promise.resolve({ id: query.id, url: this.baseUrl });
      }
    }

    const apiInstance = new ApiService();
    const apiHooks = createQueryApiHooks({ api: apiInstance });

    expect(typeof apiHooks.useGetUser).toBe('function');

    const { result } = renderHook(() =>
      apiHooks.useGetUser({
        initialQuery: { id: '123' },
      }),
    );

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.result).toEqual({ id: '123', url: '/api' });
  });
});
