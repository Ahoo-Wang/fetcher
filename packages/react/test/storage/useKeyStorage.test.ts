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
import { useKeyStorage } from '../../src';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

describe('useKeyStorage', () => {
  let listenableStorage: Storage;
  let keyStorage: KeyStorage<string>;

  beforeEach(() => {
    listenableStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
      key: vi.fn(),
      length: 0,
    };
    keyStorage = new KeyStorage<string>({
      key: 'test-key',
      storage: listenableStorage,
    });
  });

  it('should return initial value as null when no value is set', () => {
    const { result } = renderHook(() => useKeyStorage(keyStorage));

    expect(result.current[0]).toBeNull();
  });

  it('should return the current value from storage', () => {
    keyStorage.set('test-value');

    const { result } = renderHook(() => useKeyStorage(keyStorage));

    expect(result.current[0]).toBe('test-value');
  });

  it('should update the value when setter is called', () => {
    const { result } = renderHook(() => useKeyStorage(keyStorage));

    act(() => {
      result.current[1]('new-value');
    });

    expect(result.current[0]).toBe('new-value');
  });

  it('should work with different value types', () => {
    const numberKeyStorage = new KeyStorage<number>({
      key: 'number-key',
      storage: listenableStorage,
    });

    const { result } = renderHook(() => useKeyStorage(numberKeyStorage));

    act(() => {
      result.current[1](42);
    });

    expect(result.current[0]).toBe(42);
  });
});
