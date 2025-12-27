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
});
