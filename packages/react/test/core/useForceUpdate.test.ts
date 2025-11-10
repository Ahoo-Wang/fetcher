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
import { useForceUpdate } from '../../src';

describe('useForceUpdate', () => {
  it('should return a function', () => {
    const { result } = renderHook(() => useForceUpdate());
    expect(typeof result.current).toBe('function');
  });

  it('should force a component to re-render when called', () => {
    let renderCount = 0;

    const { result } = renderHook(() => {
      renderCount++;
      return useForceUpdate();
    });

    // Initial render
    expect(renderCount).toBe(1);

    // Call forceUpdate
    act(() => {
      result.current();
    });

    // Should have re-rendered
    expect(renderCount).toBe(2);

    // Call forceUpdate again
    act(() => {
      result.current();
    });

    // Should have re-rendered again
    expect(renderCount).toBe(3);
  });

  it('should work correctly in a component with state', () => {
    let callCount = 0;

    const { result } = renderHook(() => {
      const forceUpdate = useForceUpdate();

      const incrementAndForceUpdate = () => {
        callCount++;
        forceUpdate();
      };

      return { incrementAndForceUpdate, callCount };
    });

    expect(result.current.callCount).toBe(0);

    act(() => {
      result.current.incrementAndForceUpdate();
    });

    expect(callCount).toBe(1);
  });

  it('should return the same function reference across renders', () => {
    const { result, rerender } = renderHook(() => useForceUpdate());

    const firstRef = result.current;

    // Force a re-render
    act(() => {
      result.current();
    });

    expect(result.current).toBe(firstRef);

    // Another re-render
    rerender();
    expect(result.current).toBe(firstRef);
  });

  it('should handle multiple calls correctly', () => {
    let renderCount = 0;

    const { result } = renderHook(() => {
      renderCount++;
      return useForceUpdate();
    });

    expect(renderCount).toBe(1);

    // Call multiple times
    act(() => result.current());
    act(() => result.current());
    act(() => result.current());

    // Should have re-rendered multiple times
    expect(renderCount).toBe(4); // initial + 3 calls
  });

  it('should handle multiple calls in sequence', () => {
    let renderCount = 0;

    const { result } = renderHook(() => {
      renderCount++;
      return useForceUpdate();
    });

    expect(renderCount).toBe(1);

    // Multiple calls
    act(() => result.current());
    act(() => result.current());
    act(() => result.current());

    // Should have re-rendered for each call
    expect(renderCount).toBe(4); // initial + 3 calls
  });

  it('should not throw error when called after component unmount', () => {
    let forceUpdateFn: (() => void) | undefined;

    const { unmount } = renderHook(() => {
      forceUpdateFn = useForceUpdate();
      return forceUpdateFn;
    });

    // Unmount the component
    unmount();

    // Calling forceUpdate after unmount should not throw
    expect(() => {
      forceUpdateFn!();
    }).not.toThrow();
  });
});
