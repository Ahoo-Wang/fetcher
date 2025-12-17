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

/**
 * Default maximum number of retry attempts for failed fetch requests.
 * Used when no custom maxRetryCount is specified in DataMonitorOptions.
 * @constant
 * @type {number}
 * @default 3
 */
const DEFAULT_MAX_RETRY_COUNT: number = 3;

/**
 * Configuration options for initializing a DataMonitor instance.
 *
 * @interface DataMonitorOptions
 * @property {string} key - Storage key for persisting monitor configurations
 * @property {number} maxRetryCount - Maximum retry attempts for failed requests
 * @property {boolean} browserNotification - Enable/disable browser notifications
 *
 * @example
 * ```typescript
 * const options: DataMonitorOptions = {
 *   key: 'my-monitor',
 *   maxRetryCount: 3,
 *   browserNotification: true
 * };
 * ```
 */
export interface DataMonitorOptions {
  key: string;
  maxRetryCount: number;
  browserNotification: boolean;
}

/**
 * DataMonitor class for monitoring data changes by periodically fetching data
 * and notifying when changes are detected. It supports retry logic for failed fetches
 * and persists monitor states using MonitorStorage.
 *
 * Key features:
 * - Periodic data fetching with configurable intervals
 * - Deep equality change detection
 * - Exponential backoff retry logic for failed requests
 * - Browser notification support
 * - Event-driven architecture with TypedEventBus
 * - Persistent storage of monitor configurations
 * - TypeScript generic support for type-safe monitoring
 *
 * Usage:
 * ```typescript
 * const monitor = new DataMonitor({
 *   key: 'my-app-monitor',
 *   maxRetryCount: 3,
 *   browserNotification: true
 * });
 *
 * await monitor.registerMonitor({
 *   id: 'api-data',
 *   fetchRequest: { url: '/api/data', method: 'GET' },
 *   interval: 30000,
 *   notifyContent: { title: 'Data Changed', message: 'API data updated' }
 * });
 * ```
 *
 * @class DataMonitor
 * @property {DataMonitorOptions} options - Configuration options for the monitor
 * @property {MonitorStorage} monitorStorage - Storage instance for persisting monitor configs
 * @property {{[key: string]: MonitorState}} monitors - In-memory monitor states
 * @property {TypedEventBus<DataUpdatedEvent>} eventBus - Event bus for data change notifications
 */
export class DataMonitor {
  private readonly options: DataMonitorOptions;
  private monitorStorage: MonitorStorage;
  private monitors: { [key: string]: MonitorState } = {};

  eventBus: TypedEventBus<DataUpdatedEvent>;

  /**
   * Creates a new DataMonitor instance with the specified configuration.
   *
   * The constructor initializes the monitor storage, event bus, and loads
   * any previously persisted monitor configurations to resume monitoring.
   *
   * @param {DataMonitorOptions} options - Configuration options for the monitor
   * @param {string} options.key - The key to use for storing monitor configurations (default: 'react-fetcher-monitor')
   * @param {number} options.maxRetryCount - The maximum number of retry attempts for failed fetches (default: 3)
   * @param {boolean} options.browserNotification - Whether to enable browser notifications (default: true)
   *
   * @example
   * ```typescript
   * const monitor = new DataMonitor({
   *   key: 'weather-app-monitor',
   *   maxRetryCount: 5,
   *   browserNotification: false
   * });
   * ```
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
   *
   * This method is called automatically during construction and:
   * 1. Retrieves all saved monitor configurations from storage
   * 2. Converts each config to a monitor state
   * 3. Starts monitoring for each configuration
   * 4. Requests browser notification permissions if enabled
   *
   * @private
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Called automatically, but can be used to reinitialize
   * monitor.init();
   * ```
   */
  init(): void {
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
   *
   * This method:
   * 1. Clears any existing interval for the monitor
   * 2. Sets up a new setInterval to periodically fetch data
   * 3. Updates the monitor state with the new interval ID
   *
   * @param {MonitorState} monitor - The monitor state to start monitoring
   * @returns {void}
   *
   * @example
   * ```typescript
   * const state = monitor.asState(config);
   * monitor.startMonitoring(state);
   * // Now fetches data every config interval milliseconds
   * ```
   */
  startMonitoring(monitor: MonitorState): void {
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
   *
   * This method safely clears the active interval and updates the monitor state
   * to reflect that monitoring has stopped.
   *
   * @param {MonitorState} monitor - The monitor state to stop monitoring
   * @returns {void}
   *
   * @example
   * ```typescript
   * const state = monitor.getMonitor('my-monitor');
   * monitor.stopMonitoring(state);
   * // Interval cleared, no more automatic fetches
   * ```
   */
  stopMonitoring(monitor: MonitorState): void {
    if (monitor.timeIntervalId) {
      clearInterval(monitor.timeIntervalId);
      monitor.timeIntervalId = undefined;
      this.monitors[monitor.id] = monitor;
    }
  }

  /**
   * Registers a new monitor configuration. Fetches initial data, persists the config,
   * and starts monitoring.
   *
   * This method performs the complete setup for a new monitor:
   * 1. Fetches the initial data to populate latestData
   * 2. Persists the configuration using MonitorStorage
   * 3. Creates a monitor state and adds it to memory
   * 4. Starts the monitoring interval
   *
   * @param {MonitorConfig} monitorConfig - The monitor configuration to register
   * @returns {Promise<void>} Resolves when the monitor is fully registered and started
   * @throws {Error} If the initial data fetch fails after all retries
   *
   * @example
   * ```typescript
   * await monitor.registerMonitor({
   *   id: 'user-data',
   *   fetchRequest: { url: '/api/user', method: 'GET' },
   *   interval: 60000,
   *   notifyContent: { title: 'User Data', message: 'Data updated' }
   * });
   * ```
   */
  async registerMonitor(monitorConfig: MonitorConfig): Promise<void> {
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
   *
   * This method cleanly removes a monitor:
   * 1. Stops the monitoring interval
   * 2. Removes the monitor state from memory
   * 3. Deletes the persisted configuration
   *
   * @param {string} id - The monitor ID to unregister
   * @returns {void}
   *
   * @example
   * ```typescript
   * monitor.unregisterMonitor('user-data');
   * // Monitor stopped and completely removed
   * ```
   */
  unregisterMonitor(id: string): void {
    // stop monitoring
    this.stopMonitoring(this.monitors[id]);
    // remove monitor
    delete this.monitors[id];
    // remove monitorConfig
    this.monitorStorage.removeMonitor(id);
  }

  /**
   * Retrieves the current state of a monitor by its ID.
   *
   * @param {string} id - The monitor ID to retrieve
   * @returns {MonitorState} The current monitor state
   *
   * @example
   * ```typescript
   * const state = monitor.getMonitor('weather-monitor');
   * console.log('Latest data:', state.latestData);
   * ```
   */
  getMonitor(id: string): MonitorState {
    return this.monitors[id];
  }

  /**
   * Clears all monitors by unregistering each one.
   * This stops all monitoring activities and removes all persisted configurations.
   *
   * @returns {void}
   *
   * @example
   * ```typescript
   * monitor.clearMonitors();
   * // All monitors stopped and removed
   * ```
   */
  clearMonitors(): void {
    Object.keys(this.monitors).forEach(id => {
      this.unregisterMonitor(id);
    });
    this.monitors = {};
  }

  /**
   * Updates the monitor with new data. If the data has changed, persists the update
   * and triggers notification if configured.
   *
   * This method is called internally when new data is fetched. It:
   * 1. Checks if the new data differs from the current data
   * 2. Updates the monitor state with new data
   * 3. Persists the changes to storage
   * 4. Emits a data updated event
   * 5. Sends browser notification if configured
   *
   * @param {string} id - The monitor ID to update
   * @param {any} latestData - The new data to update with
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Called internally, but can be used for manual updates
   * monitor.update('custom-monitor', { value: 42 });
   * ```
   */
  update(id: string, latestData: any): void {
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
   *
   * This method handles the HTTP request and retry logic:
   * - Uses the Fetcher library to make the request
   * - Parses the JSON response
   * - Implements exponential backoff (1s, 2s, 4s, etc.) on failures
   * - Throws error after max retries are exhausted
   *
   * @private
   * @param {MonitorConfig} monitor - The monitor configuration containing the fetch request
   * @param {number} [retry=0] - Current retry attempt count (internal use)
   * @returns {Promise<any>} Promise resolving to the fetched data
   * @throws {Error} If all retry attempts fail
   *
   * @example
   * ```typescript
   * // Called internally during monitoring
   * const data = await monitor.fetchLatestData(config);
   * ```
   */
  private async fetchLatestData(
    monitor: MonitorConfig,
    retry: number = 0,
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

  /**
   * Requests permission for browser notifications if enabled.
   * This is called during initialization to ensure notifications can be sent.
   *
   * @private
   * @returns {void}
   */
  private requestNotificationPermission(): void {
    if (this.options.browserNotification) {
      if (!Notification) return;
      if (Notification.permission === 'granted') return;

      Notification.requestPermission().then();
    }
  }

  /**
   * Sends a browser notification with the specified content.
   * Only sends if browser notifications are enabled and permission is granted.
   *
   * @private
   * @param {NotifyContent} content - The notification content to display
   * @returns {void}
   *
   * @example
   * ```typescript
   * // Called internally when data changes
   * monitor.sendNotification({
   *   title: 'Data Updated',
   *   message: 'New data available'
   * });
   * ```
   */
  private sendNotification(content: NotifyContent): void {
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
   * Used to detect changes in fetched data for triggering notifications.
   *
   * Supports:
   * - Primitive types (string, number, boolean, etc.)
   * - Objects with recursive comparison
   * - Arrays with element-by-element comparison
   * - null and undefined handling
   *
   * @private
   * @param {any} left - First value to compare
   * @param {any} right - Second value to compare
   * @returns {boolean} True if values are deeply equal
   *
   * @example
   * ```typescript
   * monitor.isEqual({a: 1, b: 2}, {a: 1, b: 2}); // true
   * monitor.isEqual({a: 1}, {a: 2}); // false
   * monitor.isEqual([1, 2], [1, 2]); // true
   * ```
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
   * The timeIntervalId is initialized to 0 and will be set when monitoring starts.
   *
   * @private
   * @param {MonitorConfig} monitorConfig - The monitor configuration to convert
   * @returns {MonitorState} The monitor state with interval ID initialized
   *
   * @example
   * ```typescript
   * const config = { id: 'test', fetchRequest: {...}, interval: 1000 };
   * const state = monitor.asState(config);
   * // state.timeIntervalId === 0
   * ```
   */
  private asState(monitorConfig: MonitorConfig): MonitorState {
    return {
      ...monitorConfig,
      timeIntervalId: 0,
    };
  }
}
