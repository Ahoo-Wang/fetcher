# Data Monitor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现数据变更监控功能，支持轮询 countUrl 检测数据总量变化，变化时发送浏览器通知，点击通知跳转指定页面。

**Architecture:**
- `DataMonitorService` 是全局单例，管理所有监控的轮询定时器，使用 KeyStorage 持久化配置
- `useDataMonitor` hook 暴露监控操作接口给 UI 组件
- `DataMonitorBarItem` 是 TopBar 中的 Bell 图标开关组件
- 复用 `notificationCenter` 发送浏览器原生通知

**Tech Stack:** React, TypeScript, KeyStorage, notificationCenter, fetcher

---

## Task 1: 创建 DataMonitorEventBus

**Files:**
- Create: `packages/react/src/dataMonitor/useDataMonitorEventBus.ts`
- Test: `packages/react/test/dataMonitor/useDataMonitorEventBus.test.ts`

- [ ] **Step 1: 查看现有 EventBus 实现作为参考**

查看 `packages/react/src/eventbus/index.ts` 了解 EventBus 的使用模式：

```bash
cat packages/react/src/eventbus/index.ts
```

- [ ] **Step 2: 创建 useDataMonitorEventBus.ts**

```typescript
// packages/react/src/dataMonitor/useDataMonitorEventBus.ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import type { EventHandler } from '@ahoo-wang/fetcher-eventbus';

const DataMonitorEventType = 'DATA_MONITOR_EVENT';
const DataMonitorEventHandlerName = 'DATA_MONITOR_EVENT_HANDLER';

export interface DataChangedEvent {
  type: 'DATA_CHANGED';
  viewId: string;
  viewName: string;
  previousTotal: number | null;
  currentTotal: number;
}

export interface UseDataMonitorEventBusReturn {
  subscribe: (handler: EventHandler<DataChangedEvent>) => boolean;
  unsubscribe: (handler: EventHandler<DataChangedEvent>) => boolean;
}

const delegate = new SerialTypedEventBus<DataChangedEvent>(DataMonitorEventType);
const bus = new BroadcastTypedEventBus<DataChangedEvent>({ delegate });

export function useDataMonitorEventBus(): UseDataMonitorEventBusReturn {
  const subscribe = (handler: EventHandler<DataChangedEvent>): boolean => {
    return bus.on(handler);
  };

  const unsubscribe = (handler: EventHandler<DataChangedEvent>): boolean => {
    return bus.off(handler.name);
  };

  return {
    subscribe,
    unsubscribe,
  };
}

// 供 Service 内部调用的发布函数
export const dataMonitorEventBus = {
  emit: (event: DataChangedEvent): Promise<void> => {
    return bus.emit(event);
  },
};
```

- [ ] **Step 3: 创建单元测试**

```typescript
// packages/react/test/dataMonitor/useDataMonitorEventBus.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataMonitorEventBus, dataMonitorEventBus } from '../../src/dataMonitor/useDataMonitorEventBus';

describe('useDataMonitorEventBus', () => {
  it('should return subscribe and unsubscribe functions', () => {
    const { result } = renderHook(() => useDataMonitorEventBus());
    
    expect(result.current.subscribe).toBeDefined();
    expect(result.current.unsubscribe).toBeDefined();
  });

  it('should call handler when event is emitted', async () => {
    const handler = vi.fn();
    const { result } = renderHook(() => useDataMonitorEventBus());
    
    result.current.subscribe({
      name: 'test-handler',
      handle: handler,
    });

    await act(async () => {
      await dataMonitorEventBus.emit({
        type: 'DATA_CHANGED',
        viewId: 'view-1',
        viewName: 'Test View',
        previousTotal: 10,
        currentTotal: 20,
      });
    });

    expect(handler).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 4: 运行测试验证**

```bash
pnpm vitest run packages/react/test/dataMonitor/useDataMonitorEventBus.test.ts
```

Expected: PASS

- [ ] **Step 5: 提交**

```bash
git add packages/react/src/dataMonitor/useDataMonitorEventBus.ts packages/react/test/dataMonitor/useDataMonitorEventBus.test.ts
git commit -m "feat(dataMonitor): add useDataMonitorEventBus for data change events"
```

---

## Task 2: 创建 DataMonitorService

**Files:**
- Create: `packages/react/src/dataMonitor/DataMonitorService.ts`
- Test: `packages/react/test/dataMonitor/DataMonitorService.test.ts`

- [ ] **Step 1: 查看 KeyStorage 实现作为参考**

```bash
cat packages/fetcher-storage/src/KeyStorage.ts 2>/dev/null || cat packages/fetcher-storage/src/index.ts 2>/dev/null
```

- [ ] **Step 2: 查看 notificationCenter 实现**

```bash
cat packages/react/src/notification/notificationCenter.ts
```

- [ ] **Step 3: 创建 DataMonitorService.ts**

```typescript
// packages/react/src/dataMonitor/DataMonitorService.ts
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { all } from '@ahoo-wang/fetcher-wow';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import { fetcher } from '@ahoo-wang/fetcher';
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

class DataMonitorService {
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
          all(),
          config.notification || { title: '' }
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
    interval: number = 30000
  ): void {
    // 保存到内存
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

    // 立即获取初始 total
    this.fetchAndCheck(viewId);

    // 启动轮询
    const intervalId = window.setInterval(() => {
      this.fetchAndCheck(viewId);
    }, interval);
    monitoredView.intervalId = intervalId;

    // 保存到 KeyStorage
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
    }
  }

  updateNotification(viewId: string, notification: DataMonitorNotificationConfig): void {
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
    const monitored = this.monitoredViews.get(viewId);
    if (!monitored) return;

    try {
      const currentTotal = await this.fetchCount(monitored.countUrl, monitored.condition);
      const previousTotal = monitored.total;

      if (previousTotal !== null && previousTotal !== currentTotal) {
        // 数据发生变化
        monitored.total = currentTotal;
        this.notify(viewId, monitored.notification, currentTotal, previousTotal);
        
        // 发布事件
        await dataMonitorEventBus.emit({
          type: 'DATA_CHANGED',
          viewId,
          viewName: monitored.viewName,
          previousTotal,
          currentTotal,
        });
      } else {
        monitored.total = currentTotal;
      }
    } catch (error) {
      console.error(`DataMonitor: failed to fetch count for ${viewId}`, error);
    }
  }

  private async fetchCount(url: string, condition: Condition): Promise<number> {
    const response = await fetcher.post<number>(url, {
      body: condition as Record<string, any>,
    });
    return response;
  }

  private notify(
    viewId: string,
    notification: DataMonitorNotificationConfig,
    currentTotal: number,
    previousTotal: number | null
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
```

- [ ] **Step 4: 创建单元测试**

```typescript
// packages/react/test/dataMonitor/DataMonitorService.test.ts
// 注意：此测试仅验证同步方法，不涉及网络调用
// enable/disable 的完整测试需要集成测试环境（msw 等）
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DataMonitorService } from '../../src/dataMonitor/DataMonitorService';

describe('DataMonitorService', () => {
  let service: DataMonitorService;

  beforeEach(() => {
    service = new DataMonitorService();
  });

  describe('updateCondition', () => {
    it('should not throw when updating condition for non-existent view', () => {
      expect(() => {
        service.updateCondition('non-existent', {} as any);
      }).not.toThrow();
    });
  });

  describe('updateNotification', () => {
    it('should not throw when updating notification for non-existent view', () => {
      expect(() => {
        service.updateNotification('non-existent', { title: 'Test' });
      }).not.toThrow();
    });
  });

  describe('isEnabled', () => {
    it('should return false for non-existent view', () => {
      expect(service.isEnabled('non-existent')).toBe(false);
    });
  });
});
```

- [ ] **Step 5: 运行测试验证**

```bash
pnpm vitest run packages/react/test/dataMonitor/DataMonitorService.test.ts
```

Expected: PASS

- [ ] **Step 6: 提交**

```bash
git add packages/react/src/dataMonitor/DataMonitorService.ts packages/react/test/dataMonitor/DataMonitorService.test.ts
git commit -m "feat(dataMonitor): add DataMonitorService for global monitoring"
```

---

## Task 3: 创建 useDataMonitor Hook

**Files:**
- Create: `packages/react/src/dataMonitor/useDataMonitor.ts`
- Test: `packages/react/test/dataMonitor/useDataMonitor.test.ts`

- [ ] **Step 1: 创建 useDataMonitor.ts**

```typescript
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
```

- [ ] **Step 2: 创建单元测试**

```typescript
// packages/react/test/dataMonitor/useDataMonitor.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDataMonitor } from '../../src/dataMonitor/useDataMonitor';
import { dataMonitorService } from '../../src/dataMonitor/DataMonitorService';

vi.mock('../../src/dataMonitor/DataMonitorService', () => ({
  dataMonitorService: {
    isEnabled: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    updateCondition: vi.fn(),
    updateNotification: vi.fn(),
  },
}));

describe('useDataMonitor', () => {
  const defaultOptions = {
    viewId: 'test-view',
    countUrl: '/api/count',
    viewName: 'Test View',
    condition: {} as any,
    notification: { title: 'Test Notification' },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (dataMonitorService.isEnabled as any).mockReturnValue(false);
  });

  it('should return isEnabled as false when service is disabled', () => {
    const { result } = renderHook(() => useDataMonitor(defaultOptions));
    expect(result.current.isEnabled).toBe(false);
  });

  it('should call enable when enable is called', () => {
    const { result } = renderHook(() => useDataMonitor(defaultOptions));
    
    act(() => {
      result.current.enable();
    });

    expect(dataMonitorService.enable).toHaveBeenCalledWith(
      defaultOptions.viewId,
      defaultOptions.countUrl,
      defaultOptions.viewName,
      defaultOptions.condition,
      defaultOptions.notification,
      undefined
    );
  });

  it('should call disable when disable is called', () => {
    (dataMonitorService.isEnabled as any).mockReturnValue(true);
    
    const { result } = renderHook(() => useDataMonitor(defaultOptions));
    
    act(() => {
      result.current.disable();
    });

    expect(dataMonitorService.disable).toHaveBeenCalledWith(defaultOptions.viewId);
  });

  it('should toggle between enable and disable', () => {
    const { result } = renderHook(() => useDataMonitor(defaultOptions));
    
    // Initially disabled - enable should be called
    act(() => {
      result.current.toggle();
    });
    expect(dataMonitorService.enable).toHaveBeenCalled();

    // Now enabled - disable should be called on next toggle
    (dataMonitorService.isEnabled as any).mockReturnValue(true);
    
    act(() => {
      result.current.toggle();
    });
    expect(dataMonitorService.disable).toHaveBeenCalled();
  });
});
```

- [ ] **Step 3: 运行测试验证**

```bash
pnpm vitest run packages/react/test/dataMonitor/useDataMonitor.test.ts
```

Expected: PASS

- [ ] **Step 4: 提交**

```bash
git add packages/react/src/dataMonitor/useDataMonitor.ts packages/react/test/dataMonitor/useDataMonitor.test.ts
git commit -m "feat(dataMonitor): add useDataMonitor hook"
```

---

## Task 4: 创建 index.ts 导出

**Files:**
- Create: `packages/react/src/dataMonitor/index.ts`

- [ ] **Step 1: 创建 index.ts**

```typescript
// packages/react/src/dataMonitor/index.ts
export * from './DataMonitorService';
export * from './useDataMonitor';
export * from './useDataMonitorEventBus';
```

- [ ] **Step 2: 更新 packages/react/src/index.ts**

查看现有导出结构：
```bash
cat packages/react/src/index.ts
```

添加 DataMonitor 相关导出：
```typescript
// 在现有导出后添加
export * from './dataMonitor';
```

- [ ] **Step 3: 提交**

```bash
git add packages/react/src/dataMonitor/index.ts packages/react/src/index.ts
git commit -m "feat(dataMonitor): export dataMonitor modules from react package"
```

---

## Task 5: 创建 DataMonitorBarItem 组件

**Files:**
- Create: `packages/viewer/src/topbar/DataMonitorBarItem.tsx`

- [ ] **Step 1: 查看 BarItem 组件实现**

```bash
cat packages/viewer/src/topbar/BarItem.tsx
```

- [ ] **Step 2: 查看 AutoRefreshBarItem 作为参考**

```bash
cat packages/viewer/src/topbar/AutoRefreshBarItem.tsx
```

- [ ] **Step 3: 创建 DataMonitorBarItem.tsx**

```typescript
// packages/viewer/src/topbar/DataMonitorBarItem.tsx
import { BellOutlined, BellFilled } from '@ant-design/icons';
import { Tooltip } from 'antd';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import { BarItem } from './BarItem';
import {
  useDataMonitor,
  type DataMonitorNotificationConfig,
} from '@ahoo-wang/fetcher-react';
import type { TopBarItemProps } from './types';

export interface DataMonitorBarItemProps extends TopBarItemProps {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;
  notification: DataMonitorNotificationConfig;
}

export function DataMonitorBarItem(props: DataMonitorBarItemProps) {
  const { viewId, countUrl, viewName, condition, notification, ...rest } = props;

  const { isEnabled, toggle } = useDataMonitor({
    viewId,
    countUrl,
    viewName,
    condition,
    notification,
  });

  return (
    <Tooltip placement="top" title={isEnabled ? '关闭数据监控' : '开启数据监控'}>
      <div onClick={toggle}>
        <BarItem
          icon={isEnabled ? <BellFilled /> : <BellOutlined />}
          active={isEnabled}
          {...rest}
        />
      </div>
    </Tooltip>
  );
}
```

- [ ] **Step 4: 更新 packages/viewer/src/topbar/index.ts**

查看现有导出：
```bash
cat packages/viewer/src/topbar/index.ts
```

添加 DataMonitorBarItem 导出：
```typescript
export * from './DataMonitorBarItem';
```

- [ ] **Step 5: 提交**

```bash
git add packages/viewer/src/topbar/DataMonitorBarItem.tsx packages/viewer/src/topbar/index.ts
git commit -m "feat(viewer): add DataMonitorBarItem component"
```

---

## Task 6: 集成到 Viewer 组件

**Files:**
- Modify: `packages/viewer/src/viewer/Viewer.tsx`

- [ ] **Step 1: 查看 Viewer.tsx 结构**

```bash
cat packages/viewer/src/viewer/Viewer.tsx
```

- [ ] **Step 2: 添加导入**

在文件顶部添加：
```typescript
import { DataMonitorBarItem } from '../topbar';
import { dataMonitorService } from '@ahoo-wang/fetcher-react';
```

- [ ] **Step 3: 在 useEffect 中初始化恢复监控**

在 Viewer 组件内添加：
```typescript
useEffect(() => {
  dataMonitorService.initialize();
}, []);
```

- [ ] **Step 4: 在 TopBar 中添加 DataMonitorBarItem**

在 TopBar 组件的 AutoRefreshBarItem 之后添加：
```tsx
<DataMonitorBarItem
  viewId={activeView.id}
  countUrl={definition.countUrl}
  viewName={activeView.name}
  condition={condition}
  notification={{
    title: `视图[${activeView.name}]的数据已发生变化，请查看`,
    navigationUrl: window.location.pathname,
  }}
/>
```

注意：由于 Viewer 不知道当前页面的 navigationUrl，调用方需要能够覆盖这个配置。后续可以通过 props 传入或在 Viewer 层面配置。

- [ ] **Step 5: 提交**

```bash
git add packages/viewer/src/viewer/Viewer.tsx
git commit -m "feat(viewer): integrate DataMonitorBarItem into Viewer"
```

---

## Task 7: 集成测试

**Files:**
- Create: `packages/viewer/test/topbar/DataMonitorBarItem.test.tsx`

- [ ] **Step 1: 创建集成测试**

```typescript
// packages/viewer/test/topbar/DataMonitorBarItem.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataMonitorBarItem } from '../../src';

vi.mock('@ahoo-wang/fetcher-react', () => ({
  useDataMonitor: vi.fn(() => ({
    isEnabled: false,
    toggle: vi.fn(),
  })),
}));

describe('DataMonitorBarItem', () => {
  const defaultProps = {
    viewId: 'test-view',
    countUrl: '/api/count',
    viewName: 'Test View',
    condition: {} as any,
    notification: { title: 'Test Notification' },
  };

  it('should render Bell icon', () => {
    render(<DataMonitorBarItem {...defaultProps} />);
    expect(screen.getByRole('img')).toBeDefined();
  });

  it('should call toggle when clicked', () => {
    const toggleFn = vi.fn();
    vi.mocked(useDataMonitor).mockReturnValue({
      isEnabled: false,
      toggle: toggleFn,
    });

    render(<DataMonitorBarItem {...defaultProps} />);
    fireEvent.click(screen.getByRole('img').closest('div')!);
    
    expect(toggleFn).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: 运行测试**

```bash
pnpm vitest run packages/viewer/test/topbar/DataMonitorBarItem.test.tsx
```

Expected: PASS

- [ ] **Step 3: 提交**

```bash
git add packages/viewer/test/topbar/DataMonitorBarItem.test.tsx
git commit -m "test(viewer): add DataMonitorBarItem tests"
```

---

## Task 8: 最终构建和测试验证

- [ ] **Step 1: 安装依赖**

```bash
pnpm install
```

- [ ] **Step 2: 构建 react 包**

```bash
pnpm build --filter @ahoo-wang/fetcher-react
```

- [ ] **Step 3: 构建 viewer 包**

```bash
pnpm build --filter @ahoo-wang/fetcher-viewer
```

- [ ] **Step 4: 运行所有相关测试**

```bash
pnpm vitest run packages/react/test/dataMonitor/
pnpm vitest run packages/viewer/test/topbar/DataMonitorBarItem.test.tsx
```

- [ ] **Step 5: 提交所有更改**

```bash
git add -A
git commit -m "feat: implement data monitor feature

- Add DataMonitorService for global monitoring management
- Add useDataMonitor hook for React integration
- Add useDataMonitorEventBus for change events
- Add DataMonitorBarItem component for TopBar
- Integrate into Viewer component

Closes #XXXX"
```

---

## 依赖关系

```
Task 1: useDataMonitorEventBus (基础事件系统)
    ↓
Task 2: DataMonitorService (依赖 Task 1)
    ↓
Task 3: useDataMonitor (依赖 Task 2)
    ↓
Task 4: index.ts 导出 (依赖 Task 1-3)
    ↓
Task 5: DataMonitorBarItem (依赖 Task 3, 4)
    ↓
Task 6: Viewer 集成 (依赖 Task 5)
    ↓
Task 7: 测试
    ↓
Task 8: 最终验证
```

---

## 注意事项

1. **条件执行**: 如果 `fetcher` 或 `KeyStorage` 的导入路径不正确，需要根据实际包结构调整
2. **Condition 类型**: `condition` 的具体类型取决于 `@ahoo-wang/fetcher-wow` 的导出，使用 `any` 作为临时方案
3. **Bell 图标**: 需要确认 `@ant-design/icons` 中有 `BellFilled` 图标，如果没有可以使用其他替代图标
