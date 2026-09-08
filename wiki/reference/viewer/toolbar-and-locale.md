---
title: 'Toolbar, refresh and locale'
description: 'Toolbar, refresh and locale — @ahoo-wang/fetcher-viewer 5.0.0'
---

# Toolbar, refresh and locale

TopBar combines view actions, filter/panel toggles, row density, refresh, monitor, share and fullscreen controls. Its props include activeView/views/viewerDefinitionId, selected records and mutation callbacks. Buttons use application callbacks; saving is not an implicit local-storage operation.

| API                 | Behavior / defaults                                                                                                                                |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| RefreshDataBarItem  | Publishes to the definition-scoped refresh bus; no separate onClick prop is exposed.                                                               |
| AutoRefreshBarItem  | viewId + viewerDefinitionId; choices default 1/3/5 minutes plus Never (0). Selection stored per view under view:refresh. No selection means Never. |
| FilterBarItem       | defaultShowFilter initializes and synchronizes local active state; onChange receives toggled boolean.                                              |
| ColumnHeightBarItem | defaultTableSize and onChange drive density selection.                                                                                             |
| DataMonitorBarItem  | Delegates to React useDataMonitor; count polling is separate from refresh-data publishing.                                                         |
| FullscreenBarItem   | Reads React fullscreen context; renders nothing outside a provider.                                                                                |
| ShareLinkBarItem    | Copies window.location.href; clipboard failures show an error message. Does not serialize the active filter state.                                 |
| BarItem / Point     | Presentational icon-active marker / separator dot; no independent data logic.                                                                      |

`useRefreshDataEventBus(subscriberId?)` defaults its scope to React useId. Returns bus, publish(overrideId?): Promise&lt;void&gt;, subscribe(handler,overrideId?): boolean. It prefixes handler names with target subscriber ID and filters delivery by that ID. Unmount/scope change removes only handlers registered by that hook instance; shared bus remains alive. A definition ID lets Viewer and refresh controls coordinate. Duplicate final handler names can fail registration; no automatic distinct suffix is generated for them. Timer changes/unmount clear AutoRefresh intervals; timer callbacks can overlap and do not serialize network requests.

`useLocale()` returns local React locale state and setLocale. Defaults are Chinese. setLocale shallow-merges top-level defined keys onto defaults, so supplying a partial nested object replaces that entire nested section. It is not a global LocaleProvider and changing one hook instance does not update every component. Locale declares only the currently supported strings; many controls still contain Chinese literals/fallbacks. Do not promise a site-wide English switch through this hook. `OPERATOR_zh_CN` is the separate filter-operator label map. Locale and generated wire fields do not alter server language or query behavior.

## Complete example

```tsx
import { useEffect } from 'react';
import { useRefreshDataEventBus } from '@ahoo-wang/fetcher-viewer';
export function Refresh({ reload }: { reload: () => Promise<void> }) {
  const { subscribe, publish } = useRefreshDataEventBus('users');
  useEffect(() => {
    subscribe({ name: 'reload-users', handle: reload });
  }, [subscribe, reload]);
  return (
    <button
      onClick={() => {
        void publish().catch(console.error);
      }}
    >
      Refresh users
    </button>
  );
}
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### useRefreshDataEventBus {#api-useRefreshDataEventBus}

```ts
export function useRefreshDataEventBus(
  subscriberId?: string,
): RefreshDataEventBusReturn;
```

[packages/viewer/src/hooks/useRefreshDataEventBus.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L29)

### RefreshDataEvent {#api-RefreshDataEvent}

```ts
export interface RefreshDataEvent {
  type: 'REFRESH';
  subscriberId: string;
}
```

[packages/viewer/src/hooks/useRefreshDataEventBus.ts:10](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L10)

### RefreshDataEventBusReturn {#api-RefreshDataEventBusReturn}

```ts
export interface RefreshDataEventBusReturn {
  bus: BroadcastTypedEventBus<RefreshDataEvent>;
  publish: (subscriberId?: string) => Promise<void>;
  subscribe: (
    handler: EventHandler<RefreshDataEvent>,
    subscriberId?: string,
  ) => boolean;
}
```

[packages/viewer/src/hooks/useRefreshDataEventBus.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L15)

### AutoRefreshBarItem {#api-AutoRefreshBarItem}

```ts
export function AutoRefreshBarItem(
  options: AutoRefreshBarItemProps,
): import('react').JSX.Element;
```

Implementation defaults: `items = DefaultAutoRefreshItems`.

[packages/viewer/src/topbar/AutoRefreshBarItem.tsx:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/AutoRefreshBarItem.tsx#L52)

### AutoRefreshItem {#api-AutoRefreshItem}

```ts
export interface AutoRefreshItem {
  label: string;
  key: string;
  refreshInterval: number;
}
```

[packages/viewer/src/topbar/AutoRefreshBarItem.tsx:9](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/AutoRefreshBarItem.tsx#L9)

### AutoRefreshBarItemProps {#api-AutoRefreshBarItemProps}

```ts
export interface AutoRefreshBarItemProps {
  items?: AutoRefreshItem[];
  viewId: string;
  viewerDefinitionId: string;
}
```

[packages/viewer/src/topbar/AutoRefreshBarItem.tsx:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/AutoRefreshBarItem.tsx#L15)

### BarItem {#api-BarItem}

```ts
export function BarItem(props: BarItemProps): React.JSX.Element;
```

[packages/viewer/src/topbar/BarItem.tsx:9](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/BarItem.tsx#L9)

### BarItemProps {#api-BarItemProps}

```ts
export interface BarItemProps {
  icon: React.ReactNode;
  active: boolean;
}
```

[packages/viewer/src/topbar/BarItem.tsx:4](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/BarItem.tsx#L4)

### ColumnHeightBarItem {#api-ColumnHeightBarItem}

```ts
export function ColumnHeightBarItem(
  props: ColumnHeightBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/ColumnHeightBarItem.tsx:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/ColumnHeightBarItem.tsx#L15)

### ColumnHeightBarItemProps {#api-ColumnHeightBarItemProps}

```ts
export interface ColumnHeightBarItemProps extends TopBarItemProps {
  defaultTableSize: SizeType;
  onChange?: (size: SizeType) => void;
}
```

[packages/viewer/src/topbar/ColumnHeightBarItem.tsx:10](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/ColumnHeightBarItem.tsx#L10)

### DataMonitorBarItem {#api-DataMonitorBarItem}

```ts
export function DataMonitorBarItem(
  props: DataMonitorBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/DataMonitorBarItem.tsx:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/DataMonitorBarItem.tsx#L20)

### DataMonitorBarItemProps {#api-DataMonitorBarItemProps}

```ts
export interface DataMonitorBarItemProps extends TopBarItemProps {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;
  notification: DataMonitorNotificationConfig;
  interval?: number;
}
```

[packages/viewer/src/topbar/DataMonitorBarItem.tsx:11](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/DataMonitorBarItem.tsx#L11)

### FilterBarItem {#api-FilterBarItem}

```ts
export function FilterBarItem(
  props: FilterBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/FilterBarItem.tsx:12](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/FilterBarItem.tsx#L12)

### FilterBarItemProps {#api-FilterBarItemProps}

```ts
export interface FilterBarItemProps extends TopBarItemProps {
  defaultShowFilter: boolean;
  onChange?: (show: boolean) => void;
}
```

[packages/viewer/src/topbar/FilterBarItem.tsx:7](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/FilterBarItem.tsx#L7)

### FullscreenBarItem {#api-FullscreenBarItem}

```ts
export function FullscreenBarItem(
  props: FullscreenBarItemProps,
): import('react').JSX.Element | null;
```

[packages/viewer/src/topbar/FullscreenBarItem.tsx:11](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/FullscreenBarItem.tsx#L11)

### FullscreenBarItemProps {#api-FullscreenBarItemProps}

```ts
export interface FullscreenBarItemProps
  extends UseFullscreenOptions, TopBarItemProps {}
```

[packages/viewer/src/topbar/FullscreenBarItem.tsx:8](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/FullscreenBarItem.tsx#L8)

### Point {#api-Point}

```ts
export function Point(): import('react').JSX.Element;
```

[packages/viewer/src/topbar/Point.tsx:1](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/Point.tsx#L1)

### RefreshDataBarItem {#api-RefreshDataBarItem}

```ts
export function RefreshDataBarItem(
  props: RefreshDataBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/RefreshDataBarItem.tsx:11](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/RefreshDataBarItem.tsx#L11)

### RefreshDataBarItemProps {#api-RefreshDataBarItemProps}

```ts
export interface RefreshDataBarItemProps extends TopBarItemProps {
  viewerDefinitionId?: string;
}
```

[packages/viewer/src/topbar/RefreshDataBarItem.tsx:7](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/RefreshDataBarItem.tsx#L7)

### ShareLinkBarItem {#api-ShareLinkBarItem}

```ts
export function ShareLinkBarItem(
  props: ShareLinkBarItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/topbar/ShareLinkBarItem.tsx:8](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/ShareLinkBarItem.tsx#L8)

### ShareLinkBarItemProps {#api-ShareLinkBarItemProps}

```ts
export interface ShareLinkBarItemProps extends TopBarItemProps {}
```

[packages/viewer/src/topbar/ShareLinkBarItem.tsx:6](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/ShareLinkBarItem.tsx#L6)

### TopBar {#api-TopBar}

```ts
export function TopBar<RecordType>(
  props: TopBarProps<RecordType>,
): React.JSX.Element;
```

[packages/viewer/src/topbar/TopBar.tsx:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/TopBar.tsx#L107)

### TopBarProps {#api-TopBarProps}

::: details Expand all fields and members

```ts
export interface TopBarProps<
  RecordType,
> extends TopbarActionsCapable<RecordType> {
  title: string;
  viewerDefinitionId: string;
  activeView: ViewState;
  views: ViewState[];
  viewChanged: boolean;
  onReset?: () => void;
  tableSelectedItems: RecordType[];
  showViewPanel: boolean;
  onShowViewPanelChange?: (showViewPanel: boolean) => void;
  showFilter: boolean;
  onShowFilterChange?: (show: boolean) => void;
  defaultTableSize: SizeType;
  onTableSizeChange?: (size: SizeType) => void;
  onCreateView: (view: ViewState, onSuccess?: () => void) => void;
  onUpdateView: (view: ViewState, onSuccess?: () => void) => void;
  onDeleteView: (view: ViewState, onSuccess?: () => void) => void;
  fullscreenTarget?: RefObject<HTMLElement | null>;
  dataMonitorProps?: {
    viewId: string;
    countUrl: string;
    viewName: string;
    condition: Condition;
    notification: DataMonitorNotificationConfig;
  };
}
```

:::

[packages/viewer/src/topbar/TopBar.tsx:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/TopBar.tsx#L35)

### TopBarItemProps {#api-TopBarItemProps}

```ts
export interface TopBarItemProps extends StyleCapable {}
```

[packages/viewer/src/topbar/types.ts:3](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/topbar/types.ts#L3)

### Locale {#api-Locale}

::: details Expand all fields and members

```ts
export interface Locale {
  personalView?: string;
  sharedView?: string;
  view?: {
    viewName?: string;
    viewType?: {
      name?: string;
      personal?: string;
      shared?: string;
    };
  };
  filterPanel?: {
    addFilterTitle?: string;
    searchButtonTitle?: string;
  };
  topBar?: {
    tableSize?: {
      middle?: string;
      small?: string;
    };
    autoRefresh?: {
      title?: string;
    };
  };
  selectedCountLabel?: string;
  createViewMethod?: {
    create?: string;
    saveAs?: string;
  };
  viewPanel?: {
    saveButton?: string;
    cancelButton?: string;
  };
}
```

:::

[packages/viewer/src/locale/Locale.ts:1](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/locale/Locale.ts#L1)

### useLocale {#api-useLocale}

```ts
export function useLocale(): UseLocaleReturn;
```

[packages/viewer/src/locale/useLocale.ts:12](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/locale/useLocale.ts#L12)

### UseLocaleReturn {#api-UseLocaleReturn}

```ts
export interface UseLocaleReturn {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}
```

[packages/viewer/src/locale/useLocale.ts:7](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/locale/useLocale.ts#L7)

## Related topics

[Models and state ownership](./models-and-state) · [View and Viewer composition](./view-and-viewer) · [Saved-view panels and persistence callbacks](./saved-views) · [FetcherViewer remote integration](./fetcher-viewer) · [Filters and editable panels](./filters) · [Tables, columns and cells](./tables-and-cells) · [Registries, inputs and fullscreen button](./registries-and-inputs)
