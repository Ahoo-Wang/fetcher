import { NotificationChannel, BROWSER_NOTIFICATION_TYPE } from './';
import browserNotification from './browserNotification';
import { ChannelType } from '../';

class NotificationChannelRegistry {
  private readonly registry: Map<ChannelType, NotificationChannel> = new Map();

  get types(): ChannelType[] {
    return Array.from(this.registry.keys());
  }

  get entries(): [ChannelType, NotificationChannel][] {
    return Array.from(this.registry.entries());
  }

  get size(): number {
    return this.registry.size;
  }

  has(type: ChannelType): boolean {
    return this.registry.has(type);
  }

  clear(): void {
    this.registry.clear();
  }

  register(type: ChannelType, channel: NotificationChannel): void {
    if (this.registry.has(type)) {
      throw new Error(`Channel for type ${type} already registered.`);
    }
    this.registry.set(type, channel);
  }

  unregister(type: ChannelType): void {
    this.registry.delete(type);
  }

  get(type: ChannelType): NotificationChannel | undefined {
    return this.registry.get(type);
  }

  static create(
    channels: [ChannelType, NotificationChannel][] = [],
  ): NotificationChannelRegistry {
    const registry = new NotificationChannelRegistry();
    channels.forEach(([type, channel]) => registry.register(type, channel));
    return registry;
  }
}

export const channelRegistry: NotificationChannelRegistry =
  NotificationChannelRegistry.create([
    [BROWSER_NOTIFICATION_TYPE, browserNotification],
  ]);
