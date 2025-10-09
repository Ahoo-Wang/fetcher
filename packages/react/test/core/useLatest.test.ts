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

import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useLatest } from '../../src';

describe('useLatest', () => {
  it('should return a ref with the initial value', () => {
    const { result } = renderHook(() => useLatest(42));
    expect(result.current.current).toBe(42);
  });

  it('should return a ref with the latest value after updates', () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: 1 },
    });

    expect(result.current.current).toBe(1);

    rerender({ value: 2 });
    expect(result.current.current).toBe(2);

    rerender({ value: 3 });
    expect(result.current.current).toBe(3);
  });

  it('should work with object values', () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: { key: 'initial' } },
    });

    expect(result.current.current).toEqual({ key: 'initial' });

    rerender({ value: { key: 'updated' } });
    expect(result.current.current).toEqual({ key: 'updated' });
  });

  it('should work with array values', () => {
    const { result, rerender } = renderHook(({ value }) => useLatest(value), {
      initialProps: { value: [1, 2] },
    });

    expect(result.current.current).toEqual([1, 2]);

    rerender({ value: [3, 4, 5] });
    expect(result.current.current).toEqual([3, 4, 5]);
  });
});
