/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may receive a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRefreshDataEventBus } from '../../src';

describe('useRefreshDataEventBus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should return publish, subscribe functions and bus', () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      expect(result.current.publish).toBeDefined();
      expect(typeof result.current.publish).toBe('function');
      expect(result.current.subscribe).toBeDefined();
      expect(typeof result.current.subscribe).toBe('function');
      expect(result.current.bus).toBeDefined();
    });
  });

  describe('subscribe', () => {
    it('should return true when subscribing a handler', () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = vi.fn();
      const subscribed = result.current.subscribe({
        name: 'test-handler',
        handle: handler,
      });

      expect(subscribed).toBe(true);
    });
  });

  describe('publish', () => {
    it('should trigger subscribed handlers when published', async () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = vi.fn();
      result.current.subscribe({
        name: 'test-handler',
        handle: handler,
      });

      await act(async () => {
        await result.current.publish();
      });

      expect(handler).toHaveBeenCalled();
    });

    it('should not trigger handlers after unsubscribe', async () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = vi.fn();
      result.current.subscribe({
        name: 'test-handler',
        handle: handler,
      });

      result.current.bus.off('test-handler');

      await act(async () => {
        await result.current.publish();
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('cleanup on unmount', () => {
    it('should clean up handlers on unmount', () => {
      const { result, unmount } = renderHook(() => useRefreshDataEventBus());

      result.current.subscribe({ name: 'handler1', handle: vi.fn() });
      result.current.subscribe({ name: 'handler2', handle: vi.fn() });

      expect(result.current.bus.handlers.length).toBe(2);

      unmount();

      expect(result.current.bus.handlers.length).toBe(0);
    });
  });
});
