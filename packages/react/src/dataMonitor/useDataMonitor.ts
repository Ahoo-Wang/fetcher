// packages/react/src/dataMonitor/useDataMonitor.ts
import { useEffect, useState } from 'react';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import {
  dataMonitorService,
  type DataMonitorNotificationConfig,
} from './DataMonitorService';

export interface UseDataMonitorOptions {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;
  notification: DataMonitorNotificationConfig;
  interval?: number;
}

export interface UseDataMonitorReturn {
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
}

export function useDataMonitor(
  options: UseDataMonitorOptions
): UseDataMonitorReturn {
  const { viewId, countUrl, viewName, condition, notification, interval } = options;
  const [isEnabled, setIsEnabled] = useState(() =>
    dataMonitorService.isEnabled(viewId)
  );

  // 监听 condition 变化
  useEffect(() => {
    if (dataMonitorService.isEnabled(viewId)) {
      dataMonitorService.updateCondition(viewId, condition);
    }
  }, [viewId, condition]);

  // 监听 notification 变化
  useEffect(() => {
    if (dataMonitorService.isEnabled(viewId)) {
      dataMonitorService.updateNotification(viewId, notification);
    }
  }, [viewId, notification]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      if (dataMonitorService.isEnabled(viewId)) {
        dataMonitorService.disable(viewId);
      }
    };
  }, [viewId]);

  const enable = () => {
    dataMonitorService.enable(
      viewId,
      countUrl,
      viewName,
      condition,
      notification,
      interval
    );
    setIsEnabled(true);
  };

  const disable = () => {
    dataMonitorService.disable(viewId);
    setIsEnabled(false);
  };

  const toggle = () => {
    if (isEnabled) {
      disable();
    } else {
      enable();
    }
  };

  return { isEnabled, enable, disable, toggle };
}
