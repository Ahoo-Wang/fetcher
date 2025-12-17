import { FetchRequest } from '@ahoo-wang/fetcher';

const DEFAULT_MONITOR_INTERVAL: number = 1000 * 60 * 5;


export interface DataUpdatedEvent {
  eventId:number;
  latestData: any;
  content?: NotifyContent;
}

export type MonitorMap = {
  [key: string]: MonitorConfig;
};

export interface NotifyContent {
  title: string;
  message: string;
}

export interface MonitorConfig<T = any> {
  id: string;
  latestData?: T;
  fetchRequest: FetchRequest;
  notifyContent?: NotifyContent;
  interval: number;
}

export interface MonitorState<T = any> extends MonitorConfig<T> {
  timeIntervalId: number | undefined;
}
