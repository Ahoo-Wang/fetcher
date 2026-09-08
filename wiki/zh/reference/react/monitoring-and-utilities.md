---
title: '监控、ref 与全屏'
description: '监控、ref 与全屏 — @ahoo-wang/fetcher-react 5.0.0'
---

# 监控、ref 与全屏

## 监控所有权

`DataMonitorService` 与单例 `dataMonitorService` 将旧 Condition 作为 POST JSON 轮询 count URL。`enable(viewId, countUrl, viewName, condition, notification, interval = 30000)` 替换该视图定时器、立即查询，并将配置保存到 `view:dataMonitor`。首次计数建立基线，后续任何不同计数（含减少）都会发布 DATA_CHANGED 并尝试浏览器通知。失败记录日志，不保证重叠轮询串行或按响应顺序提交。`disable(viewId)` 删除定时器和配置，不取消已经发出的 HTTP I/O。`initialize()` 以默认间隔恢复启用配置，自定义间隔不持久化。

`useDataMonitor` 返回 isEnabled、enable/disable/toggle；condition 与 notification 变化更新已启用记录。卸载只禁用当前跟踪的 viewId，单独更换 viewId 不自动禁用旧条目。每个 viewId 保持一个生命周期所有者，迁移时显式禁用旧 ID。countUrl/viewName/interval 变化需再次 enable。`useDataMonitorEventBus` 提供手动命名 subscribe/unsubscribe，不自动清理，必须在 effect 中配对；`dataMonitorEventBus.emit` 返回 Promise&lt;void&gt;。通知通道注册是内部实现，不可从根入口导入。

## 工具

| API                | 返回与生命周期                                                                                                        |
| ------------------ | --------------------------------------------------------------------------------------------------------------------- |
| useLatest(value)   | 每次 render 更新 RefObject，不触发重渲染。                                                                            |
| useMounted()       | 返回稳定函数，报告 effect 挂载状态；挂载前/清理后为 false。                                                           |
| useForceUpdate()   | 通过 reducer 递增强制重渲染的回调。                                                                                   |
| useRequestId()     | 计数器从 0 开始；generate/invalidate 递增、current 读取、isLatest 比较、reset 归零，本身不取消操作。                  |
| useRefs&lt;T&gt;() | Map 风格 register/get/set/delete/has/clear/size/遍历；register 返回 ref 回调，null 删除键。卸载清空，修改不触发渲染。 |

## 全屏

`useFullscreen({ target? } = {})` 返回 fullscreen/getTarget/enter/exit/toggle。目标优先级为动态传入元素、target.current、document.documentElement。null 清除动态覆盖，undefined 保留。`FullscreenProvider` 未传 target 时创建 div 包装；`useFullscreenContext()` 在外部返回 undefined。Hook 监听 document 全屏事件并在清理时解绑，但卸载不自动退出全屏。DOM 工具需要浏览器及原生全屏权限/用户激活。不支持的进入/退出 API 会抛错，enter/exit/toggle 返回可能拒绝的 Promise&lt;void&gt;。手动 addFullscreenChangeListener 必须用相同回调配对 removeFullscreenChangeListener。

## 完整示例

```tsx
import {
  FullscreenProvider,
  useFullscreenContext,
} from '@ahoo-wang/fetcher-react';
function Toggle() {
  const fullscreen = useFullscreenContext();
  return (
    <button
      onClick={() => {
        void fullscreen?.toggle().catch(console.error);
      }}
    >
      Toggle fullscreen
    </button>
  );
}
export function Presentation() {
  return (
    <FullscreenProvider>
      <Toggle />
      <p>Content</p>
    </FullscreenProvider>
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

### useFullscreen {#api-useFullscreen}

```ts
export function useFullscreen(
  options?: UseFullscreenOptions,
): UseFullscreenReturn;
```

实现默认值: `options = {}`.

[packages/react/src/core/fullscreen/useFullscreen.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/useFullscreen.ts#L60)

### UseFullscreenOptions {#api-UseFullscreenOptions}

```ts
export interface UseFullscreenOptions {
  target?: RefObject<HTMLElement | null>;
}
```

[packages/react/src/core/fullscreen/useFullscreen.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/useFullscreen.ts#L24)

### UseFullscreenReturn {#api-UseFullscreenReturn}

```ts
export interface UseFullscreenReturn {
  fullscreen: boolean;
  getTarget: () => HTMLElement;
  toggle: (target?: HTMLElement | null) => Promise<void>;
  enter: (target?: HTMLElement | null) => Promise<void>;
  exit: () => Promise<void>;
}
```

[packages/react/src/core/fullscreen/useFullscreen.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/useFullscreen.ts#L31)

### FullscreenProvider {#api-FullscreenProvider}

```ts
export function FullscreenProvider(
  props: FullscreenProviderProps,
): import('react').JSX.Element;
```

[packages/react/src/core/fullscreen/FullscreenContext.tsx:32](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/FullscreenContext.tsx#L32)

### useFullscreenContext {#api-useFullscreenContext}

```ts
export function useFullscreenContext(): FullscreenContextValue | undefined;
```

[packages/react/src/core/fullscreen/FullscreenContext.tsx:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/FullscreenContext.tsx#L44)

### FullscreenContextValue {#api-FullscreenContextValue}

```ts
export type FullscreenContextValue = UseFullscreenReturn;
```

[packages/react/src/core/fullscreen/FullscreenContext.tsx:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/FullscreenContext.tsx#L22)

### FullscreenContext {#api-FullscreenContext}

```ts
declare const FullscreenContext: import('react').Context<
  UseFullscreenReturn | undefined
>;
```

[packages/react/src/core/fullscreen/FullscreenContext.tsx:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/FullscreenContext.tsx#L24)

### FullscreenProviderProps {#api-FullscreenProviderProps}

```ts
export interface FullscreenProviderProps extends UseFullscreenOptions {
  children: ReactNode;
}
```

[packages/react/src/core/fullscreen/FullscreenContext.tsx:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/FullscreenContext.tsx#L28)

### getFullscreenElement {#api-getFullscreenElement}

```ts
export function getFullscreenElement(): HTMLElement | null;
```

[packages/react/src/core/fullscreen/utils.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/utils.ts#L18)

### isFullscreen {#api-isFullscreen}

```ts
export function isFullscreen(): boolean;
```

[packages/react/src/core/fullscreen/utils.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/utils.ts#L27)

### enterFullscreen {#api-enterFullscreen}

```ts
export function enterFullscreen(element: HTMLElement): Promise<void>;
```

[packages/react/src/core/fullscreen/utils.ts:36](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/utils.ts#L36)

### exitFullscreen {#api-exitFullscreen}

```ts
export function exitFullscreen(): Promise<void>;
```

[packages/react/src/core/fullscreen/utils.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/utils.ts#L59)

### addFullscreenChangeListener {#api-addFullscreenChangeListener}

```ts
export function addFullscreenChangeListener(callback: () => void): void;
```

[packages/react/src/core/fullscreen/utils.ts:82](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/utils.ts#L82)

### removeFullscreenChangeListener {#api-removeFullscreenChangeListener}

```ts
export function removeFullscreenChangeListener(callback: () => void): void;
```

[packages/react/src/core/fullscreen/utils.ts:93](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/fullscreen/utils.ts#L93)

### useRequestId {#api-useRequestId}

```ts
export function useRequestId(): UseRequestIdReturn;
```

[packages/react/src/core/useRequestId.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useRequestId.ts#L71)

### UseRequestIdReturn {#api-UseRequestIdReturn}

```ts
export interface UseRequestIdReturn {
  generate: () => number;
  current: () => number;
  isLatest: (requestId: number) => boolean;
  invalidate: () => void;
  reset: () => void;
}
```

[packages/react/src/core/useRequestId.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useRequestId.ts#L19)

### useLatest {#api-useLatest}

```ts
export function useLatest<T>(value: T): RefObject<T>;
```

[packages/react/src/core/useLatest.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useLatest.ts#L47)

### useMounted {#api-useMounted}

```ts
export function useMounted(): () => boolean;
```

[packages/react/src/core/useMounted.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useMounted.ts#L40)

### useRefs {#api-useRefs}

```ts
export function useRefs<T>(): UseRefsReturn<T>;
```

[packages/react/src/core/useRefs.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useRefs.ts#L53)

### UseRefsReturn {#api-UseRefsReturn}

```ts
export interface UseRefsReturn<T> extends Iterable<[Key, T]> {
  register: (key: Key) => (instance: T | null) => void;
  get: (key: Key) => T | undefined;
  set: (key: Key, value: T) => void;
  delete: (key: Key) => boolean;
  has: (key: Key) => boolean;
  clear: () => void;
  readonly size: number;
  keys: () => IterableIterator<Key>;
  values: () => IterableIterator<T>;
  entries: () => IterableIterator<[Key, T]>;
}
```

[packages/react/src/core/useRefs.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useRefs.ts#L21)

### useForceUpdate {#api-useForceUpdate}

```ts
export function useForceUpdate(): () => void;
```

[packages/react/src/core/useForceUpdate.ts:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useForceUpdate.ts#L45)

### DataMonitorNotificationConfig {#api-DataMonitorNotificationConfig}

```ts
export interface DataMonitorNotificationConfig {
  title: string;
  navigationUrl?: string;
}
```

[packages/react/src/dataMonitor/DataMonitorService.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/DataMonitorService.ts#L20)

### DataMonitorService {#api-DataMonitorService}

```ts
export class DataMonitorService {
  initialize(): void;
  enable(
    viewId: string,
    countUrl: string,
    viewName: string,
    condition: Condition,
    notification: DataMonitorNotificationConfig,
    interval: number = 30000,
  ): void;
  disable(viewId: string): void;
  updateCondition(viewId: string, condition: Condition): void;
  updateNotification(
    viewId: string,
    notification: DataMonitorNotificationConfig,
  ): void;
  isEnabled(viewId: string): boolean;
}
```

[packages/react/src/dataMonitor/DataMonitorService.ts:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/DataMonitorService.ts#L45)

### dataMonitorService {#api-dataMonitorService}

```ts
declare const dataMonitorService: DataMonitorService;
```

[packages/react/src/dataMonitor/DataMonitorService.ts:217](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/DataMonitorService.ts#L217)

### useDataMonitor {#api-useDataMonitor}

```ts
export function useDataMonitor(
  options: UseDataMonitorOptions,
): UseDataMonitorReturn;
```

[packages/react/src/dataMonitor/useDataMonitor.ts:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitor.ts#L25)

### UseDataMonitorOptions {#api-UseDataMonitorOptions}

```ts
export interface UseDataMonitorOptions {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;
  notification: DataMonitorNotificationConfig;
  interval?: number;
}
```

[packages/react/src/dataMonitor/useDataMonitor.ts:9](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitor.ts#L9)

### UseDataMonitorReturn {#api-UseDataMonitorReturn}

```ts
export interface UseDataMonitorReturn {
  isEnabled: boolean;
  enable: () => void;
  disable: () => void;
  toggle: () => void;
}
```

[packages/react/src/dataMonitor/useDataMonitor.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitor.ts#L18)

### useDataMonitorEventBus {#api-useDataMonitorEventBus}

```ts
export function useDataMonitorEventBus(): UseDataMonitorEventBusReturn;
```

[packages/react/src/dataMonitor/useDataMonitorEventBus.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitorEventBus.ts#L28)

### DataChangedEvent {#api-DataChangedEvent}

```ts
export interface DataChangedEvent {
  type: 'DATA_CHANGED';
  viewId: string;
  viewName: string;
  previousTotal: number | null;
  currentTotal: number;
}
```

[packages/react/src/dataMonitor/useDataMonitorEventBus.ts:10](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitorEventBus.ts#L10)

### UseDataMonitorEventBusReturn {#api-UseDataMonitorEventBusReturn}

```ts
export interface UseDataMonitorEventBusReturn {
  subscribe: (handler: EventHandler<DataChangedEvent>) => boolean;
  unsubscribe: (handlerName: string) => boolean;
}
```

[packages/react/src/dataMonitor/useDataMonitorEventBus.ts:18](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitorEventBus.ts#L18)

### dataMonitorEventBus {#api-dataMonitorEventBus}

```ts
declare const dataMonitorEventBus: {
  emit: (event: DataChangedEvent) => Promise<void>;
};
```

[packages/react/src/dataMonitor/useDataMonitorEventBus.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/dataMonitor/useDataMonitorEventBus.ts#L44)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [安全 Hook 与路由守卫](./cosec) · [Wow 查询 Hook](./wow)
