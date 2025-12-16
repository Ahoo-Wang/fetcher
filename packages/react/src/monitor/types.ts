import { FetchRequest } from '@ahoo-wang/fetcher';


const DEFAULT_MONITOR_INTERVAL: number = 1000 * 60 * 5;

export interface NotifyConfig {
  title: string;
  message: string;
}

export interface MonitorConfig<T = any> {
  id: string;
  latestData?: T;
  fetchRequest: FetchRequest;
  notifyConfig?: NotifyConfig;
  interval: number;
}


export interface MonitorState<T = any> extends MonitorConfig<T> {
  timeIntervalId: number | undefined;
}
