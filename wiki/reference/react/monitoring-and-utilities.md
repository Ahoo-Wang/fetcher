---
title: 'Monitoring, refs and fullscreen'
description: 'Monitoring, refs and fullscreen — @ahoo-wang/fetcher-react 5.0.0'
---

# Monitoring, refs and fullscreen

## Monitoring ownership

`DataMonitorService` and singleton `dataMonitorService` poll a count URL with a legacy Condition as POST JSON. `enable(viewId, countUrl, viewName, condition, notification, interval = 30000)` replaces that view's timer, fetches immediately and persists configuration under `view:dataMonitor`. The first count becomes a baseline; any later unequal count, including a decrease, publishes DATA_CHANGED and attempts a browser notification. Failures are logged. There is no guarantee that overlapping polls are serialized or response-ordered. `disable(viewId)` removes timer/configuration but does not abort already dispatched HTTP I/O. `initialize()` restores enabled configurations with the default interval; custom intervals are not persisted.

`useDataMonitor` returns `isEnabled`, enable/disable/toggle. Condition and notification changes update an enabled service entry. Unmount disables the currently tracked view ID; changing viewId itself does not automatically disable the old entry. Keep one lifecycle owner per view ID and explicitly disable the old ID when migrating ownership. Changes to countUrl/viewName/interval require enabling again. `useDataMonitorEventBus` exposes manual named subscribe/unsubscribe with no automatic cleanup; pair them in an effect. `dataMonitorEventBus.emit` returns Promise&lt;void&gt;. Notification channel registration is internal and is not a root-importable API.

## Utilities

| API                | Return and lifecycle                                                                                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| useLatest(value)   | RefObject updated every render; no rerender notification.                                                                                                            |
| useMounted()       | Stable function reporting effect-mounted state; false before mount/after cleanup.                                                                                    |
| useForceUpdate()   | Callback forcing a render with a reducer increment.                                                                                                                  |
| useRequestId()     | Counter initially 0; generate/invalidate increment, current reads, isLatest compares, reset sets 0. No cancellation by itself.                                       |
| useRefs&lt;T&gt;() | Map-like register/get/set/delete/has/clear/size/iteration. register returns a ref callback; null removes a key. Clears on unmount, mutations do not trigger renders. |

## Fullscreen

`useFullscreen({ target? } = {})` returns fullscreen/getTarget/enter/exit/toggle. Target priority is a dynamically supplied element, target.current, then document.documentElement. Null resets the dynamic override; undefined keeps it. `FullscreenProvider` creates a wrapper div when target is absent; `useFullscreenContext()` returns undefined outside it. The hook tracks document fullscreen-change events and removes listeners on cleanup; it does not automatically exit fullscreen on unmount. DOM utilities require a browser and native fullscreen permission/user activation. Unsupported entry/exit APIs throw; enter/exit/toggle return rejecting Promise&lt;void&gt;. Manual addFullscreenChangeListener must be paired with removeFullscreenChangeListener using the same callback.

## Complete example

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

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### useFullscreen {#api-useFullscreen}

```ts
export function useFullscreen(
  options?: UseFullscreenOptions,
): UseFullscreenReturn;
```

Implementation defaults: `options = {}`.

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

## Related topics

[Fetcher hooks](./fetcher-hooks) · [Promise and query state](./promise-and-query-state) · [API hook factories](./api-hooks) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Security hooks and route guards](./cosec) · [Wow query hooks](./wow)
