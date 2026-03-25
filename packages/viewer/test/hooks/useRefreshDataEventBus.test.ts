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

    it('should accept custom subscriberId', () => {
      const { result } = renderHook(() =>
        useRefreshDataEventBus('custom-subscriber-id'),
      );

      expect(result.current.publish).toBeDefined();
      expect(result.current.subscribe).toBeDefined();
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

    it('should register handler with subscriberId prefix', () => {
      const subscriberId = 'my-viewer-id';
      const { result } = renderHook(() => useRefreshDataEventBus(subscriberId));

      result.current.subscribe({
        name: 'test-handler',
        handle: vi.fn(),
      });

      expect(result.current.bus.handlers.length).toBe(1);
      expect(result.current.bus.handlers[0].name).toBe(
        `my-viewer-id:test-handler`,
      );
    });

    it('should allow subscribing with different subscriberId via parameter', () => {
      const { result } = renderHook(() =>
        useRefreshDataEventBus('subscriber-1'),
      );

      result.current.subscribe(
        {
          name: 'test-handler',
          handle: vi.fn(),
        },
        'subscriber-2',
      );

      expect(result.current.bus.handlers.length).toBe(1);
      expect(result.current.bus.handlers[0].name).toBe(
        `subscriber-2:test-handler`,
      );
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

    it('should publish event with subscriberId', async () => {
      const subscriberId = 'my-subscriber';
      const { result } = renderHook(() => useRefreshDataEventBus(subscriberId));

      const handler = vi.fn();
      result.current.subscribe({
        name: 'test-handler',
        handle: handler,
      });

      await act(async () => {
        await result.current.publish(subscriberId);
      });

      expect(handler).toHaveBeenCalledWith({
        type: 'REFRESH',
        subscriberId: subscriberId,
      });
    });
  });

  describe('cleanup on unmount', () => {
    it('should stop triggering handler after unmount', async () => {
      const subscriberId = 'cleanup-subscriber';
      const { result, unmount } = renderHook(() =>
        useRefreshDataEventBus(subscriberId),
      );

      const handler = vi.fn();
      result.current.subscribe({ name: 'handler1', handle: handler });

      unmount();

      await act(async () => {
        await result.current.publish(subscriberId);
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should not affect other subscribers when unmounting', async () => {
      const subscriberId1 = 'subscriber-1';
      const subscriberId2 = 'subscriber-2';

      const { result: result1, unmount: unmount1 } = renderHook(() =>
        useRefreshDataEventBus(subscriberId1),
      );
      const { result: result2 } = renderHook(() =>
        useRefreshDataEventBus(subscriberId2),
      );

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      result1.current.subscribe({
        name: 'Viewer-Refresh-Data',
        handle: handler1,
      });
      result2.current.subscribe({
        name: 'Viewer-Refresh-Data',
        handle: handler2,
      });

      unmount1();

      await act(async () => {
        await result2.current.publish(subscriberId2);
      });

      expect(handler2).toHaveBeenCalledTimes(1);
    });
  });

  describe('subscriber isolation', () => {
    it('should isolate subscribers by different IDs', async () => {
      const subscriberId1 = 'viewer-1';
      const subscriberId2 = 'viewer-2';

      const { result: result1 } = renderHook(() =>
        useRefreshDataEventBus(subscriberId1),
      );
      const { result: result2 } = renderHook(() =>
        useRefreshDataEventBus(subscriberId2),
      );

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      result1.current.subscribe({
        name: 'Viewer-Refresh-Data',
        handle: handler1,
      });
      result2.current.subscribe({
        name: 'Viewer-Refresh-Data',
        handle: handler2,
      });

      await act(async () => {
        await result1.current.publish(subscriberId1);
      });

      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();

      handler1.mockClear();
      handler2.mockClear();

      await act(async () => {
        await result2.current.publish(subscriberId2);
      });

      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should not trigger handler with wrong subscriberId in publish', async () => {
      const subscriberId1 = 'viewer-1';
      const subscriberId2 = 'viewer-2';

      const { result } = renderHook(() =>
        useRefreshDataEventBus(subscriberId1),
      );

      const handler = vi.fn();
      result.current.subscribe({
        name: 'Viewer-Refresh-Data',
        handle: handler,
      });

      await act(async () => {
        await result.current.publish(subscriberId2);
      });

      expect(handler).not.toHaveBeenCalled();
    });
  });
});
