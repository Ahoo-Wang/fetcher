import { NotificationChannel } from './';
import { Message, ChannelType } from '../';

export const BROWSER_NOTIFICATION_TYPE: ChannelType = 'browser';

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
      if (message.onClick) {
        notification.addEventListener('click', message.onClick);
      }
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
