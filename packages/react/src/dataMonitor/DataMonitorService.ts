// packages/react/src/dataMonitor/DataMonitorService.ts
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import { fetcher, ResultExtractors } from '@ahoo-wang/fetcher';
import { notificationCenter } from '../notification/notificationCenter';
import { dataMonitorEventBus } from './useDataMonitorEventBus';

export interface DataMonitorNotificationConfig {
  title: string;
  navigationUrl?: string;
}

interface MonitoredView {
  enabled: boolean;
  countUrl: string;
  viewName: string;
  condition: Condition;
  notification: DataMonitorNotificationConfig;
  total: number | null;
  intervalId: number | null;
}

interface DataMonitorStorage {
  [viewId: string]: {
    enabled: boolean;
    countUrl: string;
    viewName: string;
    condition: Condition;
    notification: DataMonitorNotificationConfig;
  };
}

export class DataMonitorService {
  private monitoredViews: Map<string, MonitoredView> = new Map();
  private storage = new KeyStorage<DataMonitorStorage>({
    key: 'view:dataMonitor',
    defaultValue: {},
  });

  initialize(): void {
    const stored = this.storage.get() || {};
    for (const [viewId, config] of Object.entries(stored)) {
      if (config.enabled) {
        this.enable(
          viewId,
          config.countUrl,
          config.viewName,
          config.condition,
          config.notification || { title: '' },
        );
      }
    }
  }

  enable(
    viewId: string,
    countUrl: string,
    viewName: string,
    condition: Condition,
    notification: DataMonitorNotificationConfig,
    interval: number = 30000,
  ): void {
    // 如果已存在，先禁用以清理旧的 interval
    if (this.monitoredViews.has(viewId)) {
      this.disable(viewId);
    }

    const monitoredView: MonitoredView = {
      enabled: true,
      countUrl,
      viewName,
      condition,
      notification,
      total: null,
      intervalId: null,
    };
    this.monitoredViews.set(viewId, monitoredView);

    this.fetchAndCheck(viewId).then();

    monitoredView.intervalId = window.setInterval(() => {
      this.fetchAndCheck(viewId).then();
    }, interval);

    this.saveToStorage();
  }

  disable(viewId: string): void {
    const monitored = this.monitoredViews.get(viewId);
    if (monitored) {
      if (monitored.intervalId !== null) {
        window.clearInterval(monitored.intervalId);
      }
      this.monitoredViews.delete(viewId);
      this.saveToStorage();
    }
  }

  updateCondition(viewId: string, condition: Condition): void {
    const monitored = this.monitoredViews.get(viewId);
    if (monitored) {
      monitored.condition = condition;
      this.saveToStorage();
      // 立即用新条件获取数据，避免因条件变化导致数量不一致而误发通知
      this.fetchAndCheck(viewId).then();
    }
  }

  updateNotification(
    viewId: string,
    notification: DataMonitorNotificationConfig,
  ): void {
    const monitored = this.monitoredViews.get(viewId);
    if (monitored) {
      monitored.notification = notification;
      this.saveToStorage();
    }
  }

  isEnabled(viewId: string): boolean {
    return this.monitoredViews.has(viewId);
  }

  private async fetchAndCheck(viewId: string): Promise<void> {
    // 检查视图是否仍被监控（避免 disable 后的竞态条件）
    const monitored = this.monitoredViews.get(viewId);
    if (!monitored) return;

    try {
      const currentTotal = await this.fetchCount(
        monitored.countUrl,
        monitored.condition,
      );
      // 再次检查，因为可能在 fetch 过程中被 disable
      const currentMonitored = this.monitoredViews.get(viewId);
      if (!currentMonitored) return;

      const previousTotal = currentMonitored.total;

      if (previousTotal !== null && previousTotal !== currentTotal) {
        currentMonitored.total = currentTotal;
        this.notify(viewId, currentMonitored.notification, currentTotal);

        await dataMonitorEventBus.emit({
          type: 'DATA_CHANGED',
          viewId,
          viewName: currentMonitored.viewName,
          previousTotal,
          currentTotal,
        });
      } else {
        currentMonitored.total = currentTotal;
      }
    } catch (error) {
      console.error(`DataMonitor: failed to fetch count for ${viewId}`, error);
    }
  }

  private async fetchCount(url: string, condition: Condition): Promise<number> {
    return await fetcher.post<number>(
      url,
      {
        body: condition as Record<string, any>,
      },
      {
        resultExtractor: ResultExtractors.Json,
      },
    );
  }

  private notify(
    viewId: string,
    notification: DataMonitorNotificationConfig,
    currentTotal: number,
  ): void {
    const message = {
      title: notification.title,
      payload: {
        body: `当前共 ${currentTotal} 条数据`,
        icon: '/logo.png',
      },
      onClick: () => {
        window.focus();
        if (notification.navigationUrl) {
          window.location.href = notification.navigationUrl;
        }
      },
    };

    notificationCenter.publish('browser', message);
  }

  private saveToStorage(): void {
    const storageData: DataMonitorStorage = {};
    this.monitoredViews.forEach((view, viewId) => {
      storageData[viewId] = {
        enabled: view.enabled,
        countUrl: view.countUrl,
        viewName: view.viewName,
        condition: view.condition,
        notification: view.notification,
      };
    });
    this.storage.set(storageData);
  }
}

export const dataMonitorService = new DataMonitorService();
