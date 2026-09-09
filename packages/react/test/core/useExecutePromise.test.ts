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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLayoutEffect } from 'react';

// Import before mocks
import { useExecutePromise, PromiseStatus } from '../../src';

describe('useExecutePromise', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useExecutePromise<string>());

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
    expect(typeof result.current.execute).toBe('function');
    expect(typeof result.current.reset).toBe('function');
  });

  it('should execute promise successfully', async () => {
    const mockResult = 'success data';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBe(mockResult);
  });

  it('should handle promise rejection', async () => {
    const error = new Error('promise failed');
    const mockProvider = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should reset state to initial values', async () => {
    const mockResult = 'success data';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe(mockResult);

    act(() => {
      result.current.reset();
    });

    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should update states correctly during async execution', async () => {
    // Test the sequence of state changes
    const mockResult = 'test result';
    const mockProvider = vi.fn().mockResolvedValue(mockResult);

    const { result } = renderHook(() => useExecutePromise<string>());

    // Initially should be idle
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);

    // Execute the promise
    await act(async () => {
      await result.current.execute(mockProvider);
    });

    // After execution should be success
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.loading).toBe(false);
    expect(result.current.result).toBe(mockResult);
    expect(result.current.error).toBeUndefined();
  });

  it('should propagate error when propagateError is true', async () => {
    const error = new Error('propagate error');
    const mockProvider = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ propagateError: true }),
    );

    await act(async () => {
      await expect(result.current.execute(mockProvider)).rejects.toThrow(error);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should not propagate error when propagateError is false', async () => {
    const error = new Error('do not propagate');
    const mockProvider = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() =>
      useExecutePromise<string>({ propagateError: false }),
    );

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should default to not propagate error when propagateError is undefined', async () => {
    const error = new Error('default behavior');
    const mockProvider = vi.fn().mockRejectedValue(error);

    const { result } = renderHook(() => useExecutePromise<string>({}));

    await act(async () => {
      await result.current.execute(mockProvider);
    });

    expect(mockProvider).toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.ERROR);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(error);
    expect(result.current.result).toBeUndefined();
  });

  it('should abort ongoing operation', async () => {
    const mockProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
      );

    const { result } = renderHook(() => useExecutePromise<string>());

    // Start an operation
    act(() => {
      result.current.execute(mockProvider);
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.status).toBe(PromiseStatus.LOADING);

    // Abort the operation
    await act(async () => {
      await result.current.abort();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should handle abort when no operation is ongoing', async () => {
    const { result } = renderHook(() => useExecutePromise<string>());

    // Try to abort when no operation is running
    await act(async () => {
      await result.current.abort();
    });

    // Should not change state
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(result.current.result).toBeUndefined();
  });

  it('should call onAbort callback when operation is aborted manually', async () => {
    const onAbortMock = vi.fn();
    const mockProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
      );

    const { result } = renderHook(() =>
      useExecutePromise<string>({ onAbort: onAbortMock }),
    );

    // Start an operation
    act(() => {
      result.current.execute(mockProvider);
    });

    // Abort the operation
    await act(async () => {
      await result.current.abort();
    });

    expect(onAbortMock).toHaveBeenCalledTimes(1);
  });

  it('should call onAbort callback when operation is aborted automatically on unmount', async () => {
    const onAbortMock = vi.fn();
    const mockProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
      );

    const { result, unmount } = renderHook(() =>
      useExecutePromise<string>({ onAbort: onAbortMock }),
    );

    // Start an operation
    act(() => {
      result.current.execute(mockProvider);
    });

    expect(result.current.loading).toBe(true);

    // Unmount the component (should trigger cleanup)
    unmount();

    // onAbort should be called during cleanup
    expect(onAbortMock).toHaveBeenCalledTimes(1);
  });

  it('should abort previous operation when starting new one', async () => {
    const onAbortMock = vi.fn();
    const firstProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('first'), 200)),
      );
    const secondProvider = vi.fn().mockResolvedValue('second');

    const { result } = renderHook(() =>
      useExecutePromise<string>({ onAbort: onAbortMock }),
    );

    // Start first operation
    act(() => {
      result.current.execute(firstProvider);
    });

    expect(result.current.loading).toBe(true);

    // Start second operation (should abort first)
    await act(async () => {
      await result.current.execute(secondProvider);
    });

    expect(onAbortMock).toHaveBeenCalledTimes(1);
    expect(result.current.status).toBe(PromiseStatus.SUCCESS);
    expect(result.current.result).toBe('second');
  });

  it('should ignore stale abort errors after starting a new operation', async () => {
    const firstProvider = vi.fn(
      (abortController: AbortController) =>
        new Promise<string>((_, reject) => {
          abortController.signal.addEventListener('abort', () => {
            setTimeout(() => {
              const abortError = new Error('aborted');
              abortError.name = 'AbortError';
              reject(abortError);
            }, 0);
          });
        }),
    );
    const secondProvider = vi.fn(() => new Promise<string>(() => {}));

    const { result } = renderHook(() => useExecutePromise<string>());

    await act(async () => {
      result.current.execute(firstProvider);
    });

    expect(result.current.status).toBe(PromiseStatus.LOADING);

    await act(async () => {
      result.current.execute(secondProvider);
    });

    expect(result.current.status).toBe(PromiseStatus.LOADING);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    expect(result.current.status).toBe(PromiseStatus.LOADING);
    expect(result.current.loading).toBe(true);
  });

  it('should handle onAbort callback errors gracefully', async () => {
    const onAbortMock = vi.fn().mockRejectedValue(new Error('onAbort error'));
    const mockProvider = vi
      .fn()
      .mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve('success'), 100)),
      );

    // Mock console.warn to capture the warning
    const consoleWarnSpy = vi
      .spyOn(console, 'warn')
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useExecutePromise<string>({ onAbort: onAbortMock }),
    );

    // Start an operation
    act(() => {
      result.current.execute(mockProvider);
    });

    // Abort the operation (should trigger onAbort callback error)
    await act(async () => {
      await result.current.abort();
    });

    // Should have logged the error
    expect(consoleWarnSpy).toHaveBeenCalledWith(
      'useExecutePromise onAbort callback error:',
      expect.any(Error),
    );

    // State should still be reset correctly
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.loading).toBe(false);

    consoleWarnSpy.mockRestore();
  });
});

it('ignores late success and failure after manual abort', async () => {
  for (const rejected of [false, true]) {
    const success = vi.fn(),
      error = vi.fn();
    const pending = pendingPromise<string>();
    const { result, unmount } = renderHook(() =>
      useExecutePromise<string>({ onSuccess: success, onError: error }),
    );
    let execution!: Promise<void>;
    act(() => {
      execution = result.current.execute(() => pending.promise);
    });
    await act(async () => {
      await result.current.abort();
    });
    await act(async () => {
      if (rejected) pending.reject(new Error('late'));
      else pending.resolve('late');
      await execution;
    });
    expect(success).not.toHaveBeenCalled();
    expect(error).not.toHaveBeenCalled();
    expect(result.current.status).toBe(PromiseStatus.IDLE);
    expect(result.current.result).toBeUndefined();
    expect(result.current.error).toBeUndefined();
    unmount();
  }
});

it('keeps invocation order when an asynchronous onAbort is still pending', async () => {
  const first = pendingPromise<string>();
  const cancellation = pendingPromise<void>();
  const onAbort = vi.fn().mockImplementationOnce(() => cancellation.promise);
  const success = vi.fn();
  const { result } = renderHook(() =>
    useExecutePromise<string>({ onAbort, onSuccess: success }),
  );
  let a!: Promise<void>, b!: Promise<void>, c!: Promise<void>;
  const second = vi.fn().mockResolvedValue('second');
  act(() => {
    a = result.current.execute(() => first.promise);
  });
  act(() => {
    b = result.current.execute(second);
  });
  await act(async () => {
    c = result.current.execute(async () => 'third');
    await c;
  });
  await act(async () => {
    cancellation.resolve();
    first.resolve('first');
    await Promise.all([a, b]);
  });
  expect(second).not.toHaveBeenCalled();
  expect(result.current.result).toBe('third');
  expect(success).toHaveBeenCalledTimes(1);
});

it('keeps a request started synchronously by an abort listener cancellable', async () => {
  const first = pendingPromise<string>();
  const second = pendingPromise<string>();
  const { result } = renderHook(() => useExecutePromise<string>());
  let replacementSignal!: AbortSignal;
  let a!: Promise<void>, b!: Promise<void>;
  act(() => {
    a = result.current.execute(controller => {
      controller.signal.addEventListener('abort', () => {
        b = result.current.execute(replacement => {
          replacementSignal = replacement.signal;
          return second.promise;
        });
      });
      return first.promise;
    });
  });
  await act(async () => {
    await result.current.abort();
  });
  expect(replacementSignal.aborted).toBe(false);
  expect(result.current.status).toBe(PromiseStatus.LOADING);
  await act(async () => {
    await result.current.abort();
    first.resolve('first');
    second.resolve('second');
    await Promise.all([a, b]);
  });
  expect(replacementSignal.aborted).toBe(true);
  expect(result.current.status).toBe(PromiseStatus.IDLE);
});

it('does not start a reentrant cancellation request after unmount', async () => {
  const first = pendingPromise<string>();
  const replacement = vi.fn().mockResolvedValue('replacement');
  let start!: ReturnType<typeof useExecutePromise<string>>['execute'];
  let restarted!: Promise<void>;
  const { result, unmount } = renderHook(() =>
    useExecutePromise<string>({
      onAbort: () => {
        restarted = start(replacement);
      },
    }),
  );
  start = result.current.execute;
  let execution!: Promise<void>;
  act(() => {
    execution = start(() => first.promise);
  });
  unmount();
  await restarted;
  first.resolve('obsolete');
  await execution;
  expect(replacement).not.toHaveBeenCalled();
});

it('reports loading for a request started during the layout effect', async () => {
  const pending = pendingPromise<string>();
  const supplier = vi.fn(() => pending.promise);
  let execution!: Promise<void>;
  const { result } = renderHook(() => {
    const hook = useExecutePromise<string>();
    useLayoutEffect(() => {
      execution = hook.execute(supplier);
    }, [hook.execute]);
    return hook;
  });
  await act(async () => {});
  expect(supplier).toHaveBeenCalledTimes(1);
  expect(result.current.loading).toBe(true);
  expect(result.current.status).toBe(PromiseStatus.LOADING);
  await act(async () => {
    pending.resolve('loaded');
    await execution;
  });
  expect(result.current.result).toBe('loaded');
  expect(result.current.loading).toBe(false);
});

function pendingPromise<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}
