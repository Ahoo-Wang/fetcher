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
import { channelRegistry } from '../../src/notification/channel';
import { ChannelType, NotificationChannel } from '../../src/notification';

const mockChannel: NotificationChannel = {
  send: vi.fn().mockResolvedValue(undefined),
};

const TEST_CHANNEL_TYPE: ChannelType = 'test-channel';

describe('NotificationChannelRegistry', () => {
  beforeEach(() => {
    if (channelRegistry.has(TEST_CHANNEL_TYPE)) {
      channelRegistry.unregister(TEST_CHANNEL_TYPE);
    }
  });

  describe('register', () => {
    it('should register a channel', () => {
      channelRegistry.register(TEST_CHANNEL_TYPE, mockChannel);
      expect(channelRegistry.get(TEST_CHANNEL_TYPE)).toBe(mockChannel);
      channelRegistry.unregister(TEST_CHANNEL_TYPE);
    });

    it('should throw error when registering duplicate channel', () => {
      channelRegistry.register(TEST_CHANNEL_TYPE, mockChannel);
      expect(() => channelRegistry.register(TEST_CHANNEL_TYPE, mockChannel)).toThrow(
        `Channel for type ${TEST_CHANNEL_TYPE} already registered.`,
      );
      channelRegistry.unregister(TEST_CHANNEL_TYPE);
    });
  });

  describe('unregister', () => {
    it('should unregister a channel', () => {
      channelRegistry.register(TEST_CHANNEL_TYPE, mockChannel);
      channelRegistry.unregister(TEST_CHANNEL_TYPE);
      expect(channelRegistry.get(TEST_CHANNEL_TYPE)).toBeUndefined();
    });

    it('should do nothing when unregistering non-existent channel', () => {
      expect(() => channelRegistry.unregister('non-existent')).not.toThrow();
    });
  });

  describe('get', () => {
    it('should return channel when exists', () => {
      channelRegistry.register(TEST_CHANNEL_TYPE, mockChannel);
      expect(channelRegistry.get(TEST_CHANNEL_TYPE)).toBe(mockChannel);
      channelRegistry.unregister(TEST_CHANNEL_TYPE);
    });

    it('should return undefined when not exists', () => {
      expect(channelRegistry.get('non-existent')).toBeUndefined();
    });
  });

  describe('has', () => {
    it('should return true when channel exists', () => {
      channelRegistry.register(TEST_CHANNEL_TYPE, mockChannel);
      expect(channelRegistry.has(TEST_CHANNEL_TYPE)).toBe(true);
      channelRegistry.unregister(TEST_CHANNEL_TYPE);
    });

    it('should return false when channel does not exist', () => {
      expect(channelRegistry.has('non-existent')).toBe(false);
    });
  });

  describe('clear', () => {
    it('should clear all channels except browser', () => {
      channelRegistry.register(TEST_CHANNEL_TYPE, mockChannel);
      const initialSize = channelRegistry.size;
      channelRegistry.clear();
      expect(channelRegistry.size).toBe(0);
      expect(channelRegistry.has(TEST_CHANNEL_TYPE)).toBe(false);
    });
  });

  describe('properties', () => {
    it('should return correct size', () => {
      channelRegistry.register(TEST_CHANNEL_TYPE, mockChannel);
      expect(channelRegistry.size).toBeGreaterThan(0);
      channelRegistry.unregister(TEST_CHANNEL_TYPE);
    });

    it('should return all types', () => {
      const types = channelRegistry.types;
      expect(Array.isArray(types)).toBe(true);
    });

    it('should return all entries', () => {
      const entries = channelRegistry.entries;
      expect(Array.isArray(entries)).toBe(true);
    });
  });

  describe('browser channel', () => {
    it('should export browser notification type', async () => {
      const { BROWSER_NOTIFICATION_TYPE } = await import('../../src/notification/channel');
      expect(BROWSER_NOTIFICATION_TYPE).toBe('browser');
    });
  });
});
