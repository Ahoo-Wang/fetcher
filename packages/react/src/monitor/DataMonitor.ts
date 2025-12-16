import { MonitorConfig, MonitorState, NotifyConfig } from './types';
import { DEFAULT_MONITOR_KEY, MonitorStorage } from './monitorStorage';
import { fetcherRegistrar, getFetcher } from '@ahoo-wang/fetcher';

const DEFAULT_MAX_RETRY_COUNT: number = 3;

export interface DataMonitorOptions {
  key: string;
  maxRetryCount: number;
  notify?: (config: NotifyConfig) => void;
}

export class DataMonitor {
  private monitorStorage: MonitorStorage;
  private monitors: Map<string, MonitorState> = new Map<string, MonitorState>();

  private readonly notify?: (config: NotifyConfig) => void;
  private readonly maxRetryCount: number;

  constructor({
    key = DEFAULT_MONITOR_KEY,
    maxRetryCount = DEFAULT_MAX_RETRY_COUNT,
    ...options
  }: DataMonitorOptions) {
    this.monitorStorage = new MonitorStorage({ key: key });
    this.maxRetryCount = maxRetryCount;
    this.notify = options.notify;
    this.init();
  }

  init() {
    const monitorConfigs =
      this.monitorStorage.get() ?? new Map<string, MonitorConfig>();

    monitorConfigs.forEach((monitorConfig: MonitorConfig) => {
      const state = this.asState(monitorConfig);
      this.monitors.set(monitorConfig.id, state);
      this.startMonitoring(state);
    });
  }

  startMonitoring(monitor: MonitorState) {
    // clear previous interval
    this.stopMonitoring(monitor);

    monitor.timeIntervalId = setInterval(async () => {
      const latestData = await this.fetchLatestData(monitor);
      this.update(monitor.id, latestData);
    }, monitor.interval);
    this.monitors.set(monitor.id, monitor);
  }

  stopMonitoring(monitor: MonitorState) {
    if (monitor.timeIntervalId) {
      clearInterval(monitor.timeIntervalId);
      monitor.timeIntervalId = undefined;
      this.monitors.set(monitor.id, monitor);
    }
  }

  async fetchLatestData(monitor: MonitorConfig, retry = 0): Promise<any> {
    try {
      const currentFetcher = getFetcher(fetcherRegistrar.default);

      const response = await currentFetcher.exchange(monitor.fetchRequest, {});

      return await response.extractResult();
    } catch (e) {
      if (retry < this.maxRetryCount) {
        setTimeout(
          () => {
            this.fetchLatestData(monitor, retry + 1);
          },
          1000 * (1 << retry),
        );
      } else {
        throw e;
      }
    }
  }

  update(id: string, latestData: any) {
    const monitor = this.monitors.get(id);
    if (!monitor) {
      return;
    }

    if (!this.isEqual(monitor.latestData, latestData)) {
      // data has changed
      monitor.latestData = latestData;
      this.monitors.set(id, monitor);
      // persist latestData
      this.monitorStorage.setMonitor(monitor);
      // if notify is set, notify
      if (this.notify && monitor.notifyConfig) {
        this.notify(monitor.notifyConfig);
      }
    }
  }

  async registerMonitor(monitorConfig: MonitorConfig) {
    // fetch latestData
    monitorConfig.latestData = await this.fetchLatestData(monitorConfig);
    // persist monitorConfig
    this.monitorStorage.setMonitor(monitorConfig);

    // add monitor
    const state = this.asState(monitorConfig);
    this.monitors.set(monitorConfig.id, state);
    // start monitoring
    this.startMonitoring(state);
  }

  unregisterMonitor(id: string) {
    // stop monitoring
    this.stopMonitoring(this.monitors.get(id)!);
    // remove monitor
    this.monitors.delete(id);
    // remove monitorConfig
    this.monitorStorage.removeMonitor(id);
  }

  // 深比较：判断数据是否相等
  private isEqual(left: any, right: any): boolean {
    if (left === right) return true;
    if (
      left === null ||
      right === null ||
      typeof left !== 'object' ||
      typeof right !== 'object'
    )
      return false;
    if (Array.isArray(left) && Array.isArray(right)) {
      if (left.length !== right.length) return false;
      return left.every((item, index) => this.isEqual(item, right[index]));
    }
    const keysA = Object.keys(left);
    const keysB = Object.keys(right);
    if (keysA.length !== keysB.length) return false;
    return keysA.every(key => this.isEqual(left[key], right[key]));
  }

  private asState(monitorConfig: MonitorConfig): MonitorState {
    return {
      ...monitorConfig,
      timeIntervalId: 0,
    };
  }
}
