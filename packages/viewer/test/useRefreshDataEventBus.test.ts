/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)]
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

import { renderHook, act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useRefreshDataEventBus } from '../src';

describe('useRefreshDataEventBus', () => {
  describe('Return value', () => {
    it('returns an object with bus, publish, and subscribe', () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      expect(result.current).toHaveProperty('bus');
      expect(result.current).toHaveProperty('publish');
      expect(result.current).toHaveProperty('subscribe');
      expect(typeof result.current.publish).toBe('function');
      expect(typeof result.current.subscribe).toBe('function');
    });

    it('returns the same bus instance across multiple hooks', () => {
      const { result: result1 } = renderHook(() => useRefreshDataEventBus());
      const { result: result2 } = renderHook(() => useRefreshDataEventBus());

      expect(result1.current.bus).toBe(result2.current.bus);
    });
  });

  describe('publish', () => {
    it('publishes a REFRESH event', async () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = { name: 'handler1', order: 1, handle: vi.fn() };
      result.current.subscribe(handler);

      await result.current.publish();

      expect(handler.handle).toHaveBeenCalledWith('REFRESH');
    });

    it('publishes to multiple subscribers', async () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler1 = { name: 'h1', order: 1, handle: vi.fn() };
      const handler2 = { name: 'h2', order: 2, handle: vi.fn() };
      result.current.subscribe(handler1);
      result.current.subscribe(handler2);

      await result.current.publish();

      expect(handler1.handle).toHaveBeenCalledWith('REFRESH');
      expect(handler2.handle).toHaveBeenCalledWith('REFRESH');
    });

    it('returns a Promise', () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const publishResult = result.current.publish();

      expect(publishResult).toBeInstanceOf(Promise);
    });
  });

  describe('subscribe', () => {
    it('registers a handler and returns true', () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = { name: 'handler1', order: 1, handle: vi.fn() };
      const success = result.current.subscribe(handler);

      expect(success).toBe(true);
    });

    it('does not register duplicate handlers with same name', () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = { name: 'handler1', order: 1, handle: vi.fn() };
      const success1 = result.current.subscribe(handler);
      const success2 = result.current.subscribe(handler);

      expect(success1).toBe(true);
      expect(success2).toBe(false);
    });

    it('notifies handler when event is published', async () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = { name: 'handler1', order: 1, handle: vi.fn() };
      result.current.subscribe(handler);

      await result.current.publish();

      expect(handler.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Cleanup', () => {
    it('removes all handlers on unmount', async () => {
      const { result, unmount } = renderHook(() => useRefreshDataEventBus());

      const handler1 = { name: 'h1', order: 1, handle: vi.fn() };
      const handler2 = { name: 'h2', order: 2, handle: vi.fn() };
      result.current.subscribe(handler1);
      result.current.subscribe(handler2);

      unmount();

      await result.current.publish();

      expect(handler1.handle).not.toHaveBeenCalled();
      expect(handler2.handle).not.toHaveBeenCalled();
    });

    it('handles multiple hooks with cleanup', async () => {
      const { result: result1, unmount: unmount1 } = renderHook(() =>
        useRefreshDataEventBus(),
      );
      const { result: result2, unmount: unmount2 } = renderHook(() =>
        useRefreshDataEventBus(),
      );

      const handler1 = { name: 'h1', order: 1, handle: vi.fn() };
      const handler2 = { name: 'h2', order: 2, handle: vi.fn() };
      result1.current.subscribe(handler1);
      result2.current.subscribe(handler2);

      await result1.current.publish();
      expect(handler1.handle).toHaveBeenCalledTimes(1);
      expect(handler2.handle).toHaveBeenCalledTimes(1);

      unmount1();

      await result1.current.publish();
      expect(handler1.handle).toHaveBeenCalledTimes(1);
      expect(handler2.handle).toHaveBeenCalledTimes(1);

      unmount2();

      await result1.current.publish();
      expect(handler1.handle).toHaveBeenCalledTimes(1);
      expect(handler2.handle).toHaveBeenCalledTimes(1);
    });
  });

  describe('Event flow', () => {
    it('handles rapid publish calls', async () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = { name: 'h1', order: 1, handle: vi.fn() };
      result.current.subscribe(handler);

      await result.current.publish();
      await result.current.publish();
      await result.current.publish();

      expect(handler.handle).toHaveBeenCalledTimes(3);
    });

    it('handles publish before subscribe', async () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const handler = { name: 'h1', order: 1, handle: vi.fn() };
      await result.current.publish();
      result.current.subscribe(handler);
      await result.current.publish();

      expect(handler.handle).toHaveBeenCalledTimes(1);
    });

    it('handles async handlers', async () => {
      const { result } = renderHook(() => useRefreshDataEventBus());

      const asyncHandler = {
        name: 'async-h1',
        order: 1,
        handle: vi.fn().mockResolvedValue(undefined),
      };
      result.current.subscribe(asyncHandler);

      await result.current.publish();

      expect(asyncHandler.handle).toHaveBeenCalledWith('REFRESH');
    });
  });
});
