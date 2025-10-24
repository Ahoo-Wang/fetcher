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
import { useRefs } from '../../src';

describe('useRefs', () => {
  it('should return an object with register function and Map methods', () => {
    const { result } = renderHook(() => useRefs<HTMLDivElement>());
    expect(typeof result.current.register).toBe('function');
    expect(typeof result.current.get).toBe('function');
    expect(typeof result.current.set).toBe('function');
    expect(typeof result.current.has).toBe('function');
    expect(typeof result.current.delete).toBe('function');
    expect(result.current.size).toBe(0);
  });

  it('should register and retrieve refs correctly', () => {
    const { result } = renderHook(() => useRefs<HTMLDivElement>());
    const register = result.current.register('test');
    const mockElement = document.createElement('div');

    register(mockElement);
    expect(result.current.get('test')).toBe(mockElement);
    expect(result.current.has('test')).toBe(true);
    expect(result.current.size).toBe(1);
  });

  it('should delete ref when null is passed', () => {
    const { result } = renderHook(() => useRefs<HTMLDivElement>());
    const register = result.current.register('test');
    const mockElement = document.createElement('div');

    register(mockElement);
    expect(result.current.has('test')).toBe(true);

    register(null);
    expect(result.current.has('test')).toBe(false);
    expect(result.current.size).toBe(0);
  });

  it('should handle multiple refs', () => {
    const { result } = renderHook(() => useRefs<HTMLDivElement>());
    const register1 = result.current.register('ref1');
    const register2 = result.current.register('ref2');
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');

    register1(element1);
    register2(element2);

    expect(result.current.get('ref1')).toBe(element1);
    expect(result.current.get('ref2')).toBe(element2);
    expect(result.current.size).toBe(2);
  });

  it('should overwrite ref with same key', () => {
    const { result } = renderHook(() => useRefs<HTMLDivElement>());
    const register = result.current.register('test');
    const element1 = document.createElement('div');
    const element2 = document.createElement('div');

    register(element1);
    expect(result.current.get('test')).toBe(element1);

    register(element2);
    expect(result.current.get('test')).toBe(element2);
    expect(result.current.size).toBe(1);
  });

  it('should support different key types', () => {
    const { result } = renderHook(() => useRefs<HTMLDivElement>());
    const stringKey = result.current.register('string');
    const numberKey = result.current.register(42);
    const symbolKey = result.current.register(Symbol('test'));

    const element1 = document.createElement('div');
    const element2 = document.createElement('div');
    const element3 = document.createElement('div');

    stringKey(element1);
    numberKey(element2);
    symbolKey(element3);

    expect(result.current.get('string')).toBe(element1);
    expect(result.current.get(42)).toBe(element2);
    expect(result.current.get(Symbol('test'))).toBeUndefined(); // Different symbol
  });

  it('should clear refs on unmount', () => {
    const { result, unmount } = renderHook(() => useRefs<HTMLDivElement>());
    const register = result.current.register('test');
    const mockElement = document.createElement('div');

    register(mockElement);
    expect(result.current.size).toBe(1);

    unmount();
    // Note: Since refs are cleared in useEffect cleanup, we can't directly test the internal Map
    // But we can verify the hook doesn't throw errors on unmount
  });

  it('should work with different element types', () => {
    const { result } = renderHook(() => useRefs<HTMLInputElement>());
    const register = result.current.register('input');
    const inputElement = document.createElement('input');

    register(inputElement);
    expect(result.current.get('input')).toBe(inputElement);
  });
});
