// packages/react/src/dataMonitor/useDataMonitor.ts
import { useEffect, useRef, useState } from 'react';
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
  const viewIdRef = useRef(viewId);

  // 保持 ref 与最新 viewId 同步
  useEffect(() => {
    viewIdRef.current = viewId;
  }, [viewId]);

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

  // 组件卸载时清理（仅在组件真正卸载时执行，viewId 变化不会触发）
  useEffect(() => {
    return () => {
      const currentViewId = viewIdRef.current;
      if (dataMonitorService.isEnabled(currentViewId)) {
        dataMonitorService.disable(currentViewId);
      }
    };
  }, []);

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
