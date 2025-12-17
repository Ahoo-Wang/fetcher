import { FetchRequest } from '@ahoo-wang/fetcher';

/**
 * Represents an event emitted when monitored data has been updated.
 * This event is triggered whenever the DataMonitor detects a change in the fetched data.
 *
 * Key features:
 * - Provides unique event identification
 * - Contains the latest fetched data
 * - Includes optional notification content for UI updates
 *
 * @interface DataUpdatedEvent
 * @property {number} eventId - Unique identifier for the event, typically a timestamp
 * @property {any} latestData - The most recent data fetched from the monitored endpoint
 * @property {NotifyContent} [content] - Optional notification content to display when data changes
 *
 * @example
 * ```typescript
 * const event: DataUpdatedEvent = {
 *   eventId: Date.now(),
 *   latestData: { temperature: 25, humidity: 60 },
 *   content: { title: 'Weather Update', message: 'Temperature has changed' }
 * };
 * ```
 */
export interface DataUpdatedEvent {
  eventId: number;
  latestData: any;
  content?: NotifyContent;
}

/**
 * A map of monitor configurations keyed by their unique IDs.
 * This type is used for storing and retrieving multiple monitor configurations
 * in persistent storage and memory.
 *
 * Key features:
 * - Key-value mapping for efficient lookup
 * - Supports multiple concurrent monitors
 * - Used by MonitorStorage for persistence
 *
 * @type {MonitorMap}
 * @example
 * ```typescript
 * const monitors: MonitorMap = {
 *   'weather-monitor': {
 *     id: 'weather-monitor',
 *     fetchRequest: { url: 'https://api.weather.com', method: 'GET' },
 *     interval: 300000
 *   },
 *   'stock-monitor': {
 *     id: 'stock-monitor',
 *     fetchRequest: { url: 'https://api.stocks.com', method: 'GET' },
 *     interval: 60000
 *   }
 * };
 * ```
 */
export type MonitorMap = {
  [key: string]: MonitorConfig;
};

/**
 * Defines the content for notifications when data changes are detected.
 * Used to display browser notifications or custom alerts to inform users
 * about data updates.
 *
 * Key features:
 * - Structured notification format
 * - Supports title and message content
 * - Compatible with browser Notification API
 *
 * @interface NotifyContent
 * @property {string} title - The title of the notification
 * @property {string} message - The message body of the notification
 *
 * @example
 * ```typescript
 * const notification: NotifyContent = {
 *   title: 'Data Updated',
 *   message: 'New data has been fetched and changes detected'
 * };
 *
 * // Used with browser notifications
 * new Notification(notification.title, { body: notification.message });
 * ```
 */
export interface NotifyContent {
  title: string;
  message: string;
  icon?: string;
}

/**
 * Configuration object for a data monitor.
 * Defines how and when to monitor a specific data source, including
 * the fetch request, monitoring interval, and notification settings.
 *
 * Key features:
 * - Generic type support for type-safe data monitoring
 * - Configurable monitoring intervals
 * - Optional notification content for change alerts
 * - Integration with Fetcher library for HTTP requests
 *
 * @interface MonitorConfig
 * @template T - The type of data being monitored (default: any)
 * @property {string} id - Unique identifier for the monitor
 * @property {T} [latestData] - The most recently fetched data (populated after first fetch)
 * @property {FetchRequest} fetchRequest - The HTTP request configuration for fetching data
 * @property {NotifyContent} [notifyContent] - Optional notification content for data changes
 * @property {number} interval - Monitoring interval in milliseconds
 *
 * @example
 * ```typescript
 * interface WeatherData {
 *   temperature: number;
 *   humidity: number;
 * }
 *
 * const config: MonitorConfig<WeatherData> = {
 *   id: 'weather-monitor',
 *   fetchRequest: {
 *     url: 'https://api.weather.com/current',
 *     method: 'GET'
 *   },
 *   notifyContent: {
 *     title: 'Weather Alert',
 *     message: 'Weather conditions have changed'
 *   },
 *   interval: 300000 // 5 minutes
 * };
 * ```
 */
export interface MonitorConfig<T = any> {
  id: string;
  latestData?: T;
  fetchRequest: FetchRequest;
  notifyContent?: NotifyContent;
  interval: number;
}

/**
 * Runtime state of a data monitor, extending MonitorConfig with interval management.
 * Includes the active interval ID for controlling the monitoring process and
 * represents the current state of an active monitor.
 *
 * Key features:
 * - Extends MonitorConfig with runtime state
 * - Tracks active monitoring intervals
 * - Used internally by DataMonitor for state management
 *
 * @interface MonitorState
 * @extends MonitorConfig
 * @property {number | undefined} timeIntervalId - The ID of the active setInterval, undefined when not monitoring
 *
 * @example
 * ```typescript
 * const state: MonitorState = {
 *   id: 'active-monitor',
 *   latestData: { value: 42 },
 *   fetchRequest: { url: '/api/data', method: 'GET' },
 *   interval: 60000,
 *   timeIntervalId: 12345 // Active monitoring
 * };
 *
 * // When stopped
 * state.timeIntervalId = undefined;
 * ```
 */
export interface MonitorState<T = any> extends MonitorConfig<T> {
  timeIntervalId: number | undefined;
}
