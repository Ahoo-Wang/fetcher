import type { Message } from '../index.js';

export interface NotificationChannel<Payload = any> {
  send(message: Message<Payload>): Promise<void> | void;
}
