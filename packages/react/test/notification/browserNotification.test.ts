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

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import BrowserNotificationChannel, {
  BROWSER_NOTIFICATION_TYPE,
} from '../../src/notification/channel/browserNotification';
import { Message } from '../../src/notification';

describe('BrowserNotificationChannel', () => {
  const mockNotificationInstance = {
    addEventListener: vi.fn(),
  };

  let mockNotificationClass: any;

  beforeEach(() => {
    mockNotificationClass = vi.fn(() => mockNotificationInstance);
    mockNotificationClass.requestPermission = vi.fn().mockResolvedValue('granted');
    mockNotificationClass.permission = 'granted';
    vi.stubGlobal('Notification', mockNotificationClass);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('BROWSER_NOTIFICATION_TYPE', () => {
    it('should have correct type value', () => {
      expect(BROWSER_NOTIFICATION_TYPE).toBe('browser');
    });
  });

  describe('send', () => {
    it('should send notification when permission is granted', async () => {
      mockNotificationClass.permission = 'granted';

      const message: Message<NotificationOptions> = {
        title: 'Test Title',
        payload: { body: 'Test Body' },
      };

      await BrowserNotificationChannel.send(message);

      expect(mockNotificationClass).toHaveBeenCalledWith('Test Title', {
        body: 'Test Body',
      });
    });

    it('should request permission when permission is default', async () => {
      mockNotificationClass.permission = 'default';

      const message: Message<NotificationOptions> = {
        title: 'Test Title',
        payload: { body: 'Test Body' },
      };

      await BrowserNotificationChannel.send(message);

      expect(mockNotificationClass.requestPermission).toHaveBeenCalled();
    });

    it('should not send notification when permission is denied', async () => {
      mockNotificationClass.permission = 'denied';

      const message: Message<NotificationOptions> = {
        title: 'Test Title',
        payload: { body: 'Test Body' },
      };

      await BrowserNotificationChannel.send(message);

      expect(mockNotificationClass).not.toHaveBeenCalled();
    });

    it('should add click listener when onClick is provided', async () => {
      mockNotificationClass.permission = 'granted';

      const onClick = vi.fn();
      const mockNotificationWithClick = {
        addEventListener: vi.fn(),
      };

      class MockNotification {
        static permission = 'granted';
        static requestPermission = vi.fn().mockResolvedValue('granted');

        constructor(
          public title: string,
          public options?: NotificationOptions,
        ) {
          Object.assign(this, mockNotificationWithClick);
        }
      }

      vi.stubGlobal('Notification', MockNotification);

      const message: Message<NotificationOptions> = {
        title: 'Test Title',
        payload: { body: 'Test Body' },
        onClick,
      };

      await BrowserNotificationChannel.send(message);

      expect(mockNotificationWithClick.addEventListener).toHaveBeenCalledWith('click', onClick);
    });

    it('should handle errors gracefully', async () => {
      mockNotificationClass.permission = 'granted';
      mockNotificationClass.mockImplementation(() => {
        throw new Error('Notification error');
      });

      const message: Message<NotificationOptions> = {
        title: 'Test Title',
        payload: { body: 'Test Body' },
      };

      await expect(BrowserNotificationChannel.send(message)).resolves.not.toThrow();
    });

    it('should do nothing when Notification API is not supported', async () => {
      vi.stubGlobal('Notification', undefined);

      const message: Message<NotificationOptions> = {
        title: 'Test Title',
        payload: { body: 'Test Body' },
      };

      await BrowserNotificationChannel.send(message);

      expect(mockNotificationClass).not.toHaveBeenCalled();
    });
  });
});
