import type { NotificationChannel } from './';
import type { Message, ChannelType } from '../';

export const BROWSER_NOTIFICATION_TYPE: ChannelType = 'browser';

/** Without a local onClick, clicks focus the window and follow HTTP(S) data.navigationUrl. */
export type BrowserNotificationPayload = NotificationOptions;

class BrowserNotificationChannel implements NotificationChannel<BrowserNotificationPayload> {
  async send(message: Message<BrowserNotificationPayload>): Promise<void> {
    try {
      if (!this.isSupported()) {
        return;
      }

      let permission = window.Notification.permission;
      if (permission === 'default') {
        permission = await this.requestPermission();
      }

      if (permission !== 'granted') {
        console.warn('The user has not granted permission for notification');
        return;
      }

      const notification = new Notification(message.title, message.payload);
      notification.addEventListener(
        'click',
        message.onClick ??
          (() => {
            window.focus();
            const navigationUrl = message.payload.data?.navigationUrl;
            if (typeof navigationUrl === 'string' && navigationUrl) {
              let url: URL;
              try {
                url = new URL(navigationUrl, window.location.href);
              } catch {
                return;
              }
              if (url.protocol === 'http:' || url.protocol === 'https:') {
                window.location.assign(url.href);
              }
            }
          }),
        { once: true },
      );
    } catch (e) {
      console.error('send notification failed.', e);
      return;
    }
  }

  private requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      throw new Error('The browser is not supported notification service');
    }

    return Notification.requestPermission();
  }

  private isSupported(): boolean {
    return 'Notification' in window;
  }
}

export default new BrowserNotificationChannel();
