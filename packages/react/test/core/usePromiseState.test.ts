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

import { act, renderHook } from '@testing-library/react';
import type { PromiseStatus as PromiseStatusType } from '../../src';
import { PromiseStatus, usePromiseState } from '../../src';

describe('usePromiseState', () => {
  it('starts idle, or in the given status', () => {
    expect(renderHook(() => usePromiseState()).result.current).toMatchObject({
      status: 'idle',
      loading: false,
      result: undefined,
      error: undefined,
    });
    expect(
      renderHook(() => usePromiseState({ initialStatus: 'loading' })).result
        .current,
    ).toMatchObject({ status: 'loading', loading: true });
  });

  it('accepts both the constants and the literals as its status type', () => {
    const literal: PromiseStatusType = 'success';
    expect(literal).toBe(PromiseStatus.SUCCESS);
  });

  it('keeps the last result while loading and drops it on error', () => {
    const { result } = renderHook(() => usePromiseState<string, Error>());
    act(() => result.current.setSuccess('first'));
    expect(result.current).toMatchObject({
      status: 'success',
      result: 'first',
    });

    act(() => result.current.setLoading());
    expect(result.current).toMatchObject({
      status: 'loading',
      loading: true,
      result: 'first',
      error: undefined,
    });

    const error = new Error('boom');
    act(() => result.current.setError(error));
    expect(result.current).toMatchObject({
      status: 'error',
      result: undefined,
      error,
    });

    act(() => result.current.setLoading());
    expect(result.current.error).toBeUndefined();

    act(() => result.current.setIdle());
    expect(result.current).toMatchObject({
      status: 'idle',
      result: undefined,
      error: undefined,
    });
  });

  it('keeps setters and the returned object stable while the state is unchanged', () => {
    const { result, rerender } = renderHook(() => usePromiseState());
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
    act(() => result.current.setLoading());
    expect(result.current.setLoading).toBe(first.setLoading);
    expect(result.current.setSuccess).toBe(first.setSuccess);
    expect(result.current.setError).toBe(first.setError);
    expect(result.current.setIdle).toBe(first.setIdle);
  });
});
