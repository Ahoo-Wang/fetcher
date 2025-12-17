import {
  DataUpdatedEvent,
  MonitorConfig,
  MonitorState,
  NotifyContent,
} from './types';
import { DEFAULT_MONITOR_KEY, MonitorStorage } from './monitorStorage';
import { fetcherRegistrar, getFetcher } from '@ahoo-wang/fetcher';
import {
  ParallelTypedEventBus,
  TypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const DEFAULT_MAX_RETRY_COUNT: number = 3;

export interface DataMonitorOptions {
  key: string;
  maxRetryCount: number;
  browserNotification: boolean;
}

/**
 * DataMonitor class for monitoring data changes by periodically fetching data
 * and notifying when changes are detected. It supports retry logic for failed fetches
 * and persists monitor states using MonitorStorage.
 */
export class DataMonitor {
  private readonly options: DataMonitorOptions;
  private monitorStorage: MonitorStorage;
  private monitors: { [key: string]: MonitorState } = {};

  eventBus: TypedEventBus<DataUpdatedEvent>;

  /**
   * Creates a new DataMonitor instance.
   * @param key The key to use for storing monitor configurations
   * @param maxRetryCount The maximum number of retry attempts
   * @param options Configuration options for the monitor
   */
  constructor({
    key = DEFAULT_MONITOR_KEY,
    maxRetryCount = DEFAULT_MAX_RETRY_COUNT,
    browserNotification = true,
  }: DataMonitorOptions) {
    this.options = { key, maxRetryCount, browserNotification };

    this.monitorStorage = new MonitorStorage({ key: key });
    this.eventBus = new ParallelTypedEventBus<DataUpdatedEvent>(key);
    this.init();
  }

  /**
   * Initializes the monitor by loading persisted monitor configurations
   * and starting monitoring for each one.
   */
  init() {
    const monitorConfigs = this.monitorStorage.get() ?? {};

    Object.values(monitorConfigs).forEach((monitorConfig: MonitorConfig) => {
      const state = this.asState(monitorConfig);
      this.monitors[monitorConfig.id] = state;
      this.startMonitoring(state);
    });

    this.requestNotificationPermission();
  }

  /**
   * Starts monitoring for the given monitor state by setting up a periodic interval
   * to fetch and check for data changes.
   * @param monitor The monitor state to start monitoring
   */
  startMonitoring(monitor: MonitorState) {
    // clear previous interval
    this.stopMonitoring(monitor);

    monitor.timeIntervalId = setInterval(async () => {
      const latestData = await this.fetchLatestData(monitor);
      this.update(monitor.id, latestData);
    }, monitor.interval);
    this.monitors[monitor.id] = monitor;
  }

  /**
   * Stops monitoring for the given monitor state by clearing the interval.
   * @param monitor The monitor state to stop monitoring
   */
  stopMonitoring(monitor: MonitorState) {
    if (monitor.timeIntervalId) {
      clearInterval(monitor.timeIntervalId);
      monitor.timeIntervalId = undefined;
      this.monitors[monitor.id] = monitor;
    }
  }

  /**
   * Registers a new monitor configuration. Fetches initial data, persists the config,
   * and starts monitoring.
   * @param monitorConfig The monitor configuration to register
   */
  async registerMonitor(monitorConfig: MonitorConfig) {
    // fetch latestData
    monitorConfig.latestData = await this.fetchLatestData(monitorConfig);
    // persist monitorConfig
    this.monitorStorage.setMonitor(monitorConfig);

    // add monitor
    const state = this.asState(monitorConfig);
    this.monitors[monitorConfig.id] = state;
    // start monitoring
    this.startMonitoring(state);
  }

  /**
   * Unregisters a monitor by stopping monitoring, removing from memory,
   * and deleting persisted configuration.
   * @param id The monitor ID to unregister
   */
  unregisterMonitor(id: string) {
    // stop monitoring
    this.stopMonitoring(this.monitors[id]);
    // remove monitor
    delete this.monitors[id];
    // remove monitorConfig
    this.monitorStorage.removeMonitor(id);
  }

  getMonitor(id: string): MonitorState {
    return this.monitors[id];
  }

  clearMonitors(): void {
    Object.keys(this.monitors).forEach(id => {
      this.unregisterMonitor(id);
    });
    this.monitors = {};
  }

  /**
   * Updates the monitor with new data. If the data has changed, persists the update
   * and triggers notification if configured.
   * @param id The monitor ID
   * @param latestData The new data to update with
   */
  update(id: string, latestData: any) {
    const monitor = this.monitors[id];
    if (!monitor) {
      return;
    }

    if (!this.isEqual(monitor.latestData, latestData)) {
      // data has changed
      monitor.latestData = latestData;
      this.monitors[id] = monitor;
      // persist latestData
      this.monitorStorage.setMonitor(monitor);
      // if onChange is set, onChange
      this.eventBus
        .emit({
          eventId: Date.now(),
          latestData: latestData,
          content: monitor.notifyContent,
        })
        .then();
      // send browser notification
      if (monitor.notifyContent) {
        this.sendNotification(monitor.notifyContent);
      }
    }
  }

  /**
   * Fetches the latest data for the given monitor configuration.
   * Implements exponential backoff retry logic on failures.
   * @param monitor The monitor configuration containing the fetch request
   * @param retry Current retry attempt count (internal use)
   * @returns Promise resolving to the fetched data
   */
  private async fetchLatestData(
    monitor: MonitorConfig,
    retry = 0,
  ): Promise<any> {
    try {
      const currentFetcher = getFetcher(fetcherRegistrar.default);

      const exchange = await currentFetcher.exchange(monitor.fetchRequest, {});

      return await exchange.requiredResponse.json();
    } catch (e) {
      if (retry < this.options.maxRetryCount) {
        // Exponential backoff: wait 1s, 2s, 4s, etc.
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

  private requestNotificationPermission(): void {
    if (this.options.browserNotification) {
      if (!Notification) return;
      if (Notification.permission === 'granted') return;

      Notification.requestPermission().then();
    }
  }

  private sendNotification(content: NotifyContent) {
    if (this.options.browserNotification) {
      if (!Notification) return;
      if (Notification.permission === 'granted') {
        new Notification(content.title, {
          body: content.message,
        });
      }
    }
  }

  /**
   * Performs a deep equality check between two values.
   * @param left First value to compare
   * @param right Second value to compare
   * @returns True if values are deeply equal
   */
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

  /**
   * Converts a MonitorConfig to a MonitorState by adding the timeIntervalId.
   * @param monitorConfig The monitor configuration
   * @returns The monitor state
   */
  private asState(monitorConfig: MonitorConfig): MonitorState {
    return {
      ...monitorConfig,
      timeIntervalId: 0,
    };
  }
}
