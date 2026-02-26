import { channelRegistry } from './channel';
import { ChannelType, Message } from './';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const NotificationCenterEventType = 'NOTIFICATION_CENTER_EVENT';
const NotificationCenterEventHandler = 'NOTIFICATION_CENTER_EVENT_HANDLER';

export interface NotificationCenterEvent {
  type: ChannelType;
  message: Message;
}

export class NotificationCenter {
  public readonly eventBus: BroadcastTypedEventBus<NotificationCenterEvent>;

  constructor() {
    const delegate = new SerialTypedEventBus<NotificationCenterEvent>(
      NotificationCenterEventType,
    );
    this.eventBus = new BroadcastTypedEventBus<NotificationCenterEvent>({
      delegate,
    });

    this.eventBus.on({
      name: NotificationCenterEventHandler,
      once: false,
      handle: async (event: NotificationCenterEvent) => {
        await this.sendNotification(event.type, event.message);
      },
    });
  }

  private async sendNotification(
    type: ChannelType,
    message: Message,
  ): Promise<void> {
    const channel = channelRegistry.get(type);
    if (!channel) {
      throw new Error(`Channel ${type} is not registered`);
    }
    await channel.send(message);
  }

  publish(type: ChannelType, message: Message): Promise<void> {
    return this.eventBus.emit({ type, message });
  }

  off() {
    this.eventBus.off(NotificationCenterEventHandler);
  }

  destroy() {
    this.off();
    this.eventBus.destroy();
  }
}

export const notificationCenter = new NotificationCenter();

window.addEventListener('beforeunload', () => {
  notificationCenter.destroy();
});
