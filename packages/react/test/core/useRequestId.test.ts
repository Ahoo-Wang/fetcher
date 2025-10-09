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
import { renderHook, act } from '@testing-library/react';
import { useRequestId } from '../../src';

describe('useRequestId', () => {
  it('should initialize with request ID 0', () => {
    const { result } = renderHook(() => useRequestId());

    expect(result.current.current()).toBe(0);
  });

  it('should generate incremental request IDs', () => {
    const { result } = renderHook(() => useRequestId());

    expect(result.current.generate()).toBe(1);
    expect(result.current.generate()).toBe(2);
    expect(result.current.generate()).toBe(3);
  });

  it('should return current request ID', () => {
    const { result } = renderHook(() => useRequestId());

    expect(result.current.current()).toBe(0);

    act(() => {
      result.current.generate();
    });

    expect(result.current.current()).toBe(1);
  });

  it('should check if request ID is latest', () => {
    const { result } = renderHook(() => useRequestId());

    const id1 = result.current.generate(); // 1
    expect(result.current.isLatest(id1)).toBe(true);

    const id2 = result.current.generate(); // 2
    expect(result.current.isLatest(id1)).toBe(false);
    expect(result.current.isLatest(id2)).toBe(true);
  });

  it('should invalidate current request ID', () => {
    const { result } = renderHook(() => useRequestId());

    const id1 = result.current.generate(); // 1
    expect(result.current.isLatest(id1)).toBe(true);

    act(() => {
      result.current.invalidate();
    });

    expect(result.current.isLatest(id1)).toBe(false);
    expect(result.current.current()).toBe(2);
  });

  it('should reset request ID counter', () => {
    const { result } = renderHook(() => useRequestId());

    act(() => {
      result.current.generate();
      result.current.generate();
    });
    expect(result.current.current()).toBe(2);

    act(() => {
      result.current.reset();
    });

    expect(result.current.current()).toBe(0);
  });

  it('should handle multiple operations correctly', () => {
    const { result } = renderHook(() => useRequestId());

    // Generate some IDs
    const id1 = result.current.generate(); // 1
    const id2 = result.current.generate(); // 2

    expect(result.current.isLatest(id1)).toBe(false);
    expect(result.current.isLatest(id2)).toBe(true);

    // Invalidate
    act(() => {
      result.current.invalidate(); // Now 3
    });

    expect(result.current.isLatest(id2)).toBe(false);

    // Reset
    act(() => {
      result.current.reset(); // Back to 0
    });

    expect(result.current.current()).toBe(0);

    // Generate new ID
    const id3 = result.current.generate(); // 1
    expect(result.current.isLatest(id3)).toBe(true);
  });
});
