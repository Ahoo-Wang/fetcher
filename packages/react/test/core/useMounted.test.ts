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
import { useMounted } from '../../src';

describe('useMounted', () => {
  it('should return a function that returns true when component is mounted', () => {
    const { result } = renderHook(() => useMounted());
    expect(typeof result.current).toBe('function');
    expect(result.current()).toBe(true);
  });

  it('should return a function that returns false after component unmounts', () => {
    const { result, unmount } = renderHook(() => useMounted());
    expect(result.current()).toBe(true);

    act(() => {
      unmount();
    });

    expect(result.current()).toBe(false);
  });
});
