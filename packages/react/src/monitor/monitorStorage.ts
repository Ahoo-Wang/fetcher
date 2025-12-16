import { KeyStorage, KeyStorageOptions } from '@ahoo-wang/fetcher-storage';
import { MonitorConfig } from './types';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { DEFAULT_COSEC_TOKEN_KEY } from '@ahoo-wang/fetcher-cosec';

export const DEFAULT_MONITOR_KEY = 'react-fetcher-monitor';

export interface MonitorStorageOptions extends Partial<
  Omit<KeyStorageOptions<Map<string, MonitorConfig>>, 'serializer'>
> {}

export class MonitorStorage extends KeyStorage<Map<string, MonitorConfig>> {
  constructor({
    key = DEFAULT_MONITOR_KEY,
    eventBus = new BroadcastTypedEventBus({
      delegate: new SerialTypedEventBus(DEFAULT_COSEC_TOKEN_KEY),
    }),
    ...reset
  }: MonitorStorageOptions) {
    super({ key, eventBus, ...reset });
  }

  setMonitor(monitorState: MonitorConfig): void {
    const monitors: Map<string, MonitorConfig> = this.get() ?? new Map();
    monitors.set(monitorState.id, monitorState);
    this.set(monitors);
  }

  removeMonitor(id: string): void {
    const monitors: Map<string, MonitorConfig> = this.get() ?? new Map();
    monitors.delete(id);
    this.set(monitors);
  }

  getMonitor(id: string): MonitorConfig | undefined {
    const monitors: Map<string, MonitorConfig> = this.get() ?? new Map();
    return monitors.get(id);
  }
}
