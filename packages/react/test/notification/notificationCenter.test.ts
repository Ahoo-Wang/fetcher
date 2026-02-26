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
import { NotificationCenter, notificationCenter } from '../../src/notification/notificationCenter';
import { Message } from '../../src/notification';
import * as channelModule from '../../src/notification/channel';

vi.mock('../../src/notification/channel', () => ({
  channelRegistry: {
    get: vi.fn(),
  },
}));

describe('NotificationCenter', () => {
  const mockChannel = {
    send: vi.fn().mockResolvedValue(undefined),
  };

  const mockChannelRegistry = channelModule.channelRegistry as any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockChannelRegistry.get.mockReturnValue(mockChannel);
  });

  describe('notificationCenter singleton', () => {
    it('should export a singleton instance', () => {
      expect(notificationCenter).toBeInstanceOf(NotificationCenter);
    });

    it('should have eventBus', () => {
      expect(notificationCenter.eventBus).toBeDefined();
    });
  });

  describe('publish', () => {
    it('should publish event to eventBus', async () => {
      const message: Message = {
        title: 'Test',
        payload: { body: 'Test body' },
      };

      await notificationCenter.publish('browser', message);

      expect(mockChannel.send).toHaveBeenCalledWith(message);
    });

    it('should emit event when channel is registered', async () => {
      const emitSpy = vi.spyOn(notificationCenter.eventBus, 'emit');
      const message: Message = {
        title: 'Test',
        payload: { body: 'Test body' },
      };

      await notificationCenter.publish('browser', message);

      expect(emitSpy).toHaveBeenCalledWith({
        type: 'browser',
        message,
      });
    });
  });

  describe('off', () => {
    it('should remove event handler from eventBus', () => {
      const offSpy = vi.spyOn(notificationCenter.eventBus, 'off');
      notificationCenter.off();
      expect(offSpy).toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('should call off and destroy eventBus', () => {
      const destroySpy = vi.spyOn(notificationCenter.eventBus, 'destroy');
      const offSpy = vi.spyOn(notificationCenter.eventBus, 'off');

      notificationCenter.destroy();

      expect(offSpy).toHaveBeenCalled();
      expect(destroySpy).toHaveBeenCalled();
    });
  });

  describe('constructor', () => {
    it('should create eventBus with delegate', () => {
      const center = new NotificationCenter();
      expect(center.eventBus).toBeDefined();
    });

    it('should subscribe to eventBus automatically', async () => {
      const center = new NotificationCenter();
      const message: Message = {
        title: 'Test',
        payload: { body: 'Test body' },
      };

      await center.publish('browser', message);

      expect(mockChannel.send).toHaveBeenCalledWith(message);
    });
  });
});
