import { KeyStorage, KeyStorageOptions } from '@ahoo-wang/fetcher-storage';
import { MonitorConfig, MonitorMap } from './types';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { DEFAULT_COSEC_TOKEN_KEY } from '@ahoo-wang/fetcher-cosec';

export const DEFAULT_MONITOR_KEY = 'react-fetcher-monitor';

export interface MonitorStorageOptions extends Partial<
  Omit<KeyStorageOptions<MonitorMap>, 'serializer'>
> {}

export class MonitorStorage extends KeyStorage<MonitorMap> {
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
    const monitors: MonitorMap = this.get() ?? {};
    monitors[monitorState.id] = monitorState;
    this.set(monitors);
  }

  removeMonitor(id: string): void {
    const monitors = this.get() ?? {};
    delete monitors[id];
    this.set(monitors);
  }

  getMonitor(id: string): MonitorConfig | undefined {
    const monitors = this.get() ?? {};
    return monitors[id];
  }
}
