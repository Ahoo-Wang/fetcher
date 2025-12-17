import { KeyStorage, KeyStorageOptions } from '@ahoo-wang/fetcher-storage';
import { MonitorConfig, MonitorMap } from './types';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { DEFAULT_COSEC_TOKEN_KEY } from '@ahoo-wang/fetcher-cosec';

/**
 * Default storage key used for persisting monitor configurations.
 * This key is used when no custom key is provided to MonitorStorage.
 * @constant
 * @type {string}
 * @default 'react-fetcher-monitor'
 */
export const DEFAULT_MONITOR_KEY: string = 'react-fetcher-monitor';

/**
 * Configuration options for MonitorStorage initialization.
 * Extends KeyStorageOptions but excludes the serializer option since
 * MonitorMap uses the default JSON serialization.
 *
 * @interface MonitorStorageOptions
 * @extends {Partial<Omit<KeyStorageOptions<MonitorMap>, 'serializer'>>}
 *
 * @example
 * ```typescript
 * const options: MonitorStorageOptions = {
 *   key: 'my-monitors',
 *   eventBus: new BroadcastTypedEventBus()
 * };
 * ```
 */
export interface MonitorStorageOptions extends Partial<
  Omit<KeyStorageOptions<MonitorMap>, 'serializer'>
> {}

/**
 * Storage class for persisting monitor configurations across browser sessions.
 * Extends KeyStorage to provide monitor-specific storage operations.
 *
 * Key features:
 * - Persistent storage of monitor configurations
 * - Cross-tab synchronization via event bus
 * - Type-safe storage operations for MonitorMap
 * - Automatic serialization/deserialization of monitor data
 *
 * The storage uses a default event bus setup with BroadcastTypedEventBus
 * for cross-tab communication and SerialTypedEventBus for ordered events.
 *
 * @class MonitorStorage
 * @extends {KeyStorage<MonitorMap>}
 *
 * @example
 * ```typescript
 * const storage = new MonitorStorage({ key: 'my-monitors' });
 *
 * // Add a monitor
 * storage.setMonitor({
 *   id: 'weather',
 *   fetchRequest: { url: '/api/weather', method: 'GET' },
 *   interval: 300000
 * });
 *
 * // Get all monitors
 * const monitors = storage.get();
 * ```
 */
export class MonitorStorage extends KeyStorage<MonitorMap> {
  /**
   * Creates a new MonitorStorage instance with the specified options.
   *
   * If no eventBus is provided, it creates a default setup with
   * BroadcastTypedEventBus delegating to SerialTypedEventBus for
   * cross-tab synchronization of monitor changes.
   *
   * @param {MonitorStorageOptions} options - Configuration options for storage
   * @param {string} [options.key=DEFAULT_MONITOR_KEY] - Storage key for the monitors
   * @param {TypedEventBus} [options.eventBus] - Custom event bus for synchronization
   *
   * @example
   * ```typescript
   * // Default configuration
   * const storage = new MonitorStorage({});
   *
   * // Custom key
   * const storage = new MonitorStorage({ key: 'app-monitors' });
   * ```
   */
  constructor({
    key = DEFAULT_MONITOR_KEY,
    eventBus = new BroadcastTypedEventBus({
      delegate: new SerialTypedEventBus(DEFAULT_COSEC_TOKEN_KEY),
    }),
    ...reset
  }: MonitorStorageOptions) {
    super({ key, eventBus, ...reset });
  }

  /**
   * Adds or updates a monitor configuration in storage.
   * The monitor is stored under its ID key in the MonitorMap.
   *
   * @param {MonitorConfig} monitorState - The monitor configuration to store
   * @returns {void}
   *
   * @example
   * ```typescript
   * storage.setMonitor({
   *   id: 'api-monitor',
   *   fetchRequest: { url: '/api/data', method: 'GET' },
   *   interval: 60000,
   *   latestData: { value: 42 }
   * });
   * ```
   */
  setMonitor(monitorState: MonitorConfig): void {
    const monitors: MonitorMap = this.get() ?? {};
    monitors[monitorState.id] = monitorState;
    this.set(monitors);
  }

  /**
   * Removes a monitor configuration from storage by its ID.
   * If the monitor doesn't exist, this operation is a no-op.
   *
   * @param {string} id - The ID of the monitor to remove
   * @returns {void}
   *
   * @example
   * ```typescript
   * storage.removeMonitor('api-monitor');
   * // Monitor configuration is deleted from storage
   * ```
   */
  removeMonitor(id: string): void {
    const monitors = this.get() ?? {};
    delete monitors[id];
    this.set(monitors);
  }

  /**
   * Retrieves a specific monitor configuration by its ID.
   *
   * @param {string} id - The ID of the monitor to retrieve
   * @returns {MonitorConfig | undefined} The monitor configuration, or undefined if not found
   *
   * @example
   * ```typescript
   * const monitor = storage.getMonitor('api-monitor');
   * if (monitor) {
   *   console.log('Monitor interval:', monitor.interval);
   * }
   * ```
   */
  getMonitor(id: string): MonitorConfig | undefined {
    const monitors = this.get() ?? {};
    return monitors[id];
  }
}
