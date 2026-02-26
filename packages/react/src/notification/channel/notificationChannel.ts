import { Message } from '../';

export interface NotificationChannel<Payload = any> {
  send(message: Message<Payload>): Promise<void> | void;
}
