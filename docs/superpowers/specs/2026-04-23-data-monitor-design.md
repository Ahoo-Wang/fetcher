# Data Monitor 功能设计

## 1. 概述

### 需求描述
在 Viewer 组件中添加数据变更监控功能。当功能开启时，系统定期调用 countUrl 接口获取数据总数（total），当 total 发生变化时发送 Notification 通知用户。

### 核心特性
- **全局性**：不依赖于单个组件，全局 Service 管理所有监控
- **多视图支持**：可同时监控多个 Viewer 中的多个 View
- **持久化**：监控开启/关闭状态通过 KeyStorage 持久化，刷新页面后自动恢复
- **独立性**：与 AutoRefresh 解耦，独立实现

---

## 2. 系统架构

### 2.1 核心组件

| 组件 | 职责 | 位置 |
|------|------|------|
| `DataMonitorService` | 全局单例，管理所有监控的轮询定时器 | packages/react/src/dataMonitor/ |
| `useDataMonitor` | Hook，提供监控操作接口 | packages/react/src/dataMonitor/ |
| `DataMonitorBarItem` | TopBar UI 组件，Bell 图标开关 | packages/viewer/src/topbar/ |
| `useDataMonitorEventBus` | 独立事件总线，发布数据变更事件 | packages/react/src/dataMonitor/ |

### 2.2 数据结构

```typescript
// KeyStorage 持久化结构
// key = viewId (全局唯一)
interface DataMonitorStorage {
  [viewId: string]: {
    enabled: boolean;
    countUrl: string;
    viewName: string;
    condition: Condition;
    notification: DataMonitorNotificationConfig;
  };
}

// Service 内部状态
interface MonitoredView {
  enabled: boolean;
  countUrl: string;
  viewName: string;
  condition: Condition;           // 当前视图的过滤条件
  notification: DataMonitorNotificationConfig;  // 通知配置
  total: number | null;
  intervalId: number | null;
  lastCheckTime: number;
}

// 全局 Service 状态
const monitoredViews: Map<string, MonitoredView>; // key = viewId
```

### 2.3 架构图

```
┌─────────────────────────────────────────────────────────────┐
│                    DataMonitorService                        │
│                     (Singleton)                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  monitoredViews: Map<viewId, MonitoredView>        │   │
│  │  key = viewId (全局唯一)                            │   │
│  │                                                      │   │
│  │  + enable(viewId, countUrl, viewName, condition,   │   │
│  │            notification)                             │   │
│  │  + disable(viewId)                                  │   │
│  │  + updateCondition(viewId, condition)               │   │
│  │  + updateNotification(viewId, notification)        │   │
│  │  + checkAll() → compare totals → notify            │   │
│  │  + isEnabled(viewId): boolean                      │   │
│  └─────────────────────────────────────────────────────┘   │
│                            ↑                                 │
│  KeyStorage (持久化)      │                                 │
└──────────────────────────┼─────────────────────────────────┘
                           │
┌──────────────────────────┼─────────────────────────────────┐
│                          │ useDataMonitor hook              │
│  ┌───────────────────────┼───────────────────────────────┐   │
│  │                       │                               │   │
│  │   Viewer              │   TopBar                       │   │
│  │   activeView.condition ──────► DataMonitorBarItem      │   │
│  │   activeView.name ──────────► notification.title      │   │
│  │                        │   (Bell icon)                 │   │
│  │                        │                               │   │
│  └───────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ DataMonitorEventBus
                            ↓
                      NotificationCenter
                            │
                            ↓
                      Browser Notification
                            │
                            ↓ (点击)
                      window.location.href = navigationUrl
```

---

## 3. 详细设计

### 3.1 DataMonitorService

```typescript
// packages/react/src/dataMonitor/DataMonitorService.ts
import { KeyStorage } from '@ahoo-wang/fetcher-storage';
import { all } from '@ahoo-wang/fetcher-wow';
import type { Condition } from '@ahoo-wang/fetcher-wow';

export interface DataMonitorNotificationConfig {
  title: string;
  navigationUrl?: string;  // 可序列化的 URL，点击通知后跳转
}

class DataMonitorService {
  private monitoredViews: Map<string, MonitoredView> = new Map();
  private storage = new KeyStorage<DataMonitorStorage>({
    key: 'view:dataMonitor',
    defaultValue: {}
  });

  // 页面初始化时调用，恢复所有已开启的监控
  initialize(): void {
    const stored = this.storage.get() || {};
    for (const [viewId, config] of Object.entries(stored)) {
      if (config.enabled) {
        // 恢复监控：启动轮询
        // 注意：恢复时使用 all() 作为初始 condition，后续 view 切换时会更新
        this.enable(viewId, config.countUrl, config.viewName, all(), config.notification || { title: '' });
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
    // 1. 保存到内存（包含 notification 配置）
    // 2. 立即调用 countUrl 获取初始 total
    // 3. 启动 setInterval 轮询
    // 4. 保存到 KeyStorage
  }

  // 更新监控的 condition（当 view 的过滤条件变化时调用）
  updateCondition(viewId: string, condition: Condition): void {
    const monitored = this.monitoredViews.get(viewId);
    if (monitored) {
      monitored.condition = condition;
    }
  }

  // 更新监控的通知配置
  updateNotification(viewId: string, notification: DataMonitorNotificationConfig): void {
    const monitored = this.monitoredViews.get(viewId);
    if (monitored) {
      monitored.notification = notification;
      this.saveToStorage();  // 持久化更新
    }
  }

  disable(viewId: string): void {
    // 1. 清除 setInterval
    // 2. 从内存移除
    // 3. 更新 KeyStorage
  }

  isEnabled(viewId: string): boolean { ... }

  getEnabledViews(): Array<{ viewId: string; countUrl: string; viewName: string; notification: DataMonitorNotificationConfig }> { ... }

  private async checkAll(): void { ... }

  private async fetchCount(url: string, condition: Condition): Promise<number> { ... }

  private saveToStorage(): void { ... }
}

export const dataMonitorService = new DataMonitorService();
```

### 3.2 useDataMonitor Hook

```typescript
// packages/react/src/dataMonitor/useDataMonitor.ts
import { useEffect, useState } from 'react';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import type { DataMonitorNotificationConfig } from './DataMonitorService';

export interface UseDataMonitorOptions {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;  // 当前 view 的 condition
  notification: DataMonitorNotificationConfig;  // 通知配置
  interval?: number;    // 默认 30000ms
}

export interface UseDataMonitorReturn {
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
}

export function useDataMonitor(options: UseDataMonitorOptions): UseDataMonitorReturn {
  const { viewId, countUrl, viewName, condition, notification, interval } = options;
  const [isEnabled, setIsEnabled] = useState(() =>
    dataMonitorService.isEnabled(viewId)
  );

  // 监听 condition 变化，同步到 service
  useEffect(() => {
    if (dataMonitorService.isEnabled(viewId)) {
      dataMonitorService.updateCondition(viewId, condition);
    }
  }, [viewId, condition]);

  // 监听 notification 变化，同步到 service
  useEffect(() => {
    if (dataMonitorService.isEnabled(viewId)) {
      dataMonitorService.updateNotification(viewId, notification);
    }
  }, [viewId, notification]);

  const enable = () => {
    dataMonitorService.enable(viewId, countUrl, viewName, condition, notification, interval);
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

### 3.3 DataMonitorEventBus

```typescript
// packages/react/src/dataMonitor/useDataMonitorEventBus.ts

export interface DataChangedEvent {
  type: 'DATA_CHANGED';
  viewId: string;
  viewName: string;
  previousTotal: number | null;
  currentTotal: number;
}

export interface DataMonitorEventBusReturn {
  subscribe: (handler: EventHandler<DataChangedEvent>) => boolean;
  unsubscribe: (handler: EventHandler<DataChangedEvent>) => boolean;
}

export function useDataMonitorEventBus(): DataMonitorEventBusReturn { ... }
```

### 3.4 DataMonitorBarItem

```typescript
// packages/viewer/src/topbar/DataMonitorBarItem.tsx
import type { Condition } from '@ahoo-wang/fetcher-wow';
import type { DataMonitorNotificationConfig } from '@ahoo-wang/fetcher-react';

export interface DataMonitorBarItemProps extends TopBarItemProps {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;  // 当前 view 的 condition
  notification: DataMonitorNotificationConfig;  // 通知配置
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

### 3.5 KeyStorage 持久化

```typescript
// 存储 key: 'view:dataMonitor'
// 存储格式：key = viewId (全局唯一)
// 注意：所有字段都是可序列化的，支持页面刷新后恢复
{
  "view_1": {
    "enabled": true,
    "countUrl": "/api/po/count",
    "viewName": "采购单列表",
    "condition": { /* serialized Condition object */ },
    "notification": {
      "title": "视图[采购单列表]的数据已发生变化，请查看",
      "navigationUrl": "/purchase-orders"
    }
  },
  "view_2": {
    "enabled": false,
    "countUrl": "/api/pr/count",
    "viewName": "采购需求列表",
    "condition": { /* serialized Condition object */ },
    "notification": {
      "title": "视图[采购需求列表]的数据已发生变化，请查看",
      "navigationUrl": "/purchase-requirements"
    }
  }
}
```

### 3.6 通知流程

复用 `packages/react` 的 `notificationCenter`：

```typescript
import { notificationCenter } from '@ahoo-wang/fetcher-react';

// Service 内部发送通知
private notify(viewId: string, notification: DataMonitorNotificationConfig, currentTotal: number, previousTotal: number | null): void {
  const message = {
    title: notification.title,
    payload: {
      body: `当前共 ${currentTotal} 条数据`,
      icon: '/logo.png',
    } as NotificationOptions,
    onClick: () => {
      window.focus();
      if (notification.navigationUrl) {
        window.location.href = notification.navigationUrl;
      }
    }
  };

  notificationCenter.publish('browser', message);
}
```

**通知渠道**：
- 使用 `notificationCenter.publish('browser', message)` 发送浏览器原生通知
- 应用内通知（后续可扩展其他 Channel）

**点击通知后的行为**：
- 聚焦浏览器窗口
- 跳转到配置的 `navigationUrl`

---

## 4. 页面刷新后恢复流程

```
页面加载
       ↓
DataMonitorService.initialize()
       ↓
从 KeyStorage 加载所有 enabled 配置
       ↓
获取需要恢复的 view 列表
       ↓
对于每个 enabled 的 view：
  ├── 调用 countUrl 获取当前 total
  ├── 启动 setInterval 轮询
  └── 更新内存中状态
       ↓
所有监控恢复完成
```

## 4.1 Condition 同步流程

```
用户改变过滤条件
       ↓
View 组件触发 onChange(condition)
       ↓
useViewerState 更新 condition 状态
       ↓
TopBar 重新渲染（activeView.condition 变了）
       ↓
DataMonitorBarItem 收到新的 condition prop
       ↓
useEffect 监听 condition 变化
       ↓
dataMonitorService.updateCondition(viewId, newCondition)
       ↓
下次轮询使用新的 condition 调用 countUrl
```

---

## 5. UI 设计

### 5.1 DataMonitorBarItem

- **位置**：TopBar 右侧，与 AutoRefreshBarItem 相邻
- **图标**：
  - 开启：`BellFilled` 或 `BellOutlined` + 高亮颜色
  - 关闭：`BellOutlined` + 普通颜色
- **Tooltip**：开启时显示"关闭数据监控"，关闭时显示"开启数据监控"
- **点击**：切换开启/关闭状态

### 5.2 与 AutoRefreshBarItem 对比

| 特性 | AutoRefreshBarItem | DataMonitorBarItem |
|------|-------------------|-------------------|
| 定位 | 控制自动刷新频率 | 控制数据变更监控开关 |
| 图标 | 下拉菜单按钮 | Bell 图标 |
| 配置 | 间隔时间可选 | 无额外配置（固定 30s） |
| 状态持久化 | KeyStorage | KeyStorage |

---

## 6. 集成方式

### 6.1 Viewer 集成

```typescript
// packages/viewer/src/viewer/Viewer.tsx

// 1. 导入
import { DataMonitorBarItem } from '../topbar';
import { dataMonitorService } from '@ahoo-wang/fetcher-react';

// 2. 在 TopBar 中添加（传递 condition 和 notification）
<TopBar<RecordType>
  // ... 其他 props
  // 在 AutoRefreshBarItem 后添加
  <DataMonitorBarItem
    viewId={activeView.id}
    countUrl={definition.countUrl}
    viewName={activeView.name}
    condition={condition}  // 当前视图的过滤条件
    notification={{
      title: `视图[${activeView.name}]的数据已发生变化，请查看`,
      navigationUrl: '/current-page-path'  // 可配置跳转路径
    }}
  />
/>

// 3. 在 useEffect 中初始化恢复监控
useEffect(() => {
  dataMonitorService.initialize();
}, []);
```

### 6.2 通知点击处理

通知点击行为由 `notification.navigationUrl` 配置：

- 点击通知 → `window.focus()` 聚焦窗口 → `window.location.href = navigationUrl` 跳转

如果 `navigationUrl` 为空，则仅聚焦窗口。

---

## 7. 文件结构

```
packages/react/src/
├── dataMonitor/
│   ├── index.ts                          # 导出
│   ├── DataMonitorService.ts             # 全局单例服务
│   ├── useDataMonitor.ts                 # Hook
│   └── useDataMonitorEventBus.ts         # 事件总线
└── notification/
    └── ... (已有)

packages/viewer/src/
└── topbar/
    ├── DataMonitorBarItem.tsx            # TopBar UI 组件
    └── index.ts                          # 导出更新
```

---

## 8. 后续扩展点

- [ ] 支持自定义轮询间隔（通过 DataMonitorBarItem 下拉菜单）
- [ ] 支持选择通知渠道（应用内/浏览器）
- [ ] 在 ViewPanel 中展示所有视图的监控状态列表
- [ ] 支持批量开启/关闭多个视图的监控

---

## 9. 确认事项

- [x] 监控 total 数量变化
- [x] 轮询模式，固定 30s 间隔
- [x] 新增 DataMonitorBarItem（Bell 图标）
- [x] 核心逻辑放在 `packages/react` 中
- [x] 保存 countUrl
- [x] 移除 viewerDefinitionId 层，viewId 全局唯一
- [x] KeyStorage 持久化
- [x] 页面刷新后自动恢复所有已开启的监控
- [x] 多视图同时监控
- [x] 复用 `notificationCenter` 发送通知
- [x] 通知标题由外部传入（DataMonitorNotificationConfig.title）
- [x] 点击通知后跳转到配置的 navigationUrl
- [x] 支持 condition 参数，监控特定条件下的数据
- [x] condition 变化时自动同步到监控服务
- [x] notification 配置可序列化，刷新后仍有效
