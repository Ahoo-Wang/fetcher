---
title: Viewer reference
description: Compose typed filters, tables, saved views, and Fetcher-backed Viewer flows.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-viewer`

`@ahoo-wang/fetcher-viewer` is a React + Ant Design data-view system. Use it for a typed field definition, filters, columns, saved views, and table workflows; it is not a generic data-fetch cache. Choose the highest level that owns the behavior you want.

## Install

```bash
pnpm add react react-dom antd @ant-design/icons dayjs \
  @ahoo-wang/fetcher-viewer
```

The package has Fetcher, React, Wow, storage, event, decorator, OpenAPI, and event-stream peer dependencies. Supply the Ant Design app contexts required by your application. The published root barrel is the public API boundary. [packages/viewer/src/index.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/index.ts#L14)

## Component selection and ownership

| Component | It owns | Caller owns |
| --- | --- | --- |
| `ViewTable<RecordType>` | Table columns, typed cells, selection UI | `fields`, `columns`, row data, sort / selection callbacks, loading and empty/error presentation. |
| `View<RecordType>` | Filter panel, pagination, sort, controlled/uncontrolled view state | Data loading and the external state values/callbacks when using controlled mode. |
| `Viewer<RecordType>` | Active saved view, side panel, top bar, and composition of `View` | `PagedList` data, `onLoadData`, and persistence callbacks. |
| `FetcherViewer<RecordType>` | Definition/view/data queries, command clients, default-view persistence, and composition | Default Fetcher registration and the Viewer backend contract. |

`Viewer` explicitly does not fetch rows or remotely persist views. `FetcherViewer` uses the default Fetcher and built-in viewer endpoints. [packages/viewer/src/viewer/Viewer.tsx:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L39) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L48)

## Core models and callbacks

`ViewDefinition` supplies `id`, `name`, typed `fields`, `availableFilters`, `dataUrl`, and `countUrl`. A `FieldDefinition` has `name`, `type`, `label`, `primaryKey`, optional custom `render`, and optional Ant Design sorter configuration. `ViewState` persists the view identity, `PERSONAL`/`SHARED` type, `SYSTEM`/`CUSTOM` source, default flag, filters, columns, table size, page size, condition, optional internal condition, and sorters. [packages/viewer/src/viewer/types.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L15) [packages/viewer/src/viewer/types.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/types.ts#L35)

| `Viewer` group | Required / important contract |
| --- | --- |
| Initial view | `defaultViews`, `defaultView`, and `definition`; missing fields are merged into a selected view. |
| Rows | `dataSource: PagedList<RecordType>` and `pagination` (`false` disables it); `loading` is optional. |
| Data callback | `onLoadData(condition, oneBasedPage, pageSize, sorter?)` receives state changes. |
| View callback | `onSwitchView(view)` observes a switch. |
| Persistence | `onCreateView`, `onUpdateView`, `onDeleteView` receive the proposed view and an `onSuccess(newView)` continuation. Call it only after remote success. |
| Actions | `onGetRecordCount`, primary/secondary/batch actions, row selection, primary-key click, table setting, action column. |

`ViewerRef` has `getCondition`, `getActiveView`, and `clearSelectedRowKeys`; `ViewRef` also has `reset` and `updateTableSize`. [packages/viewer/src/viewer/Viewer.tsx:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L34) [packages/viewer/src/view/View.tsx:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L47)

### Exact public component contracts

| Component | Required props | Optional props / callbacks | Ref and defaults |
| --- | --- | --- | --- |
| `View<RecordType>` | `fields`, `availableFilters`, `dataSource`, `showFilter`, `filterMode`, `defaultColumns`, `defaultPageSize`, `defaultTableSize`, `pagination`, `enableRowSelection` | all `external*` / `externalUpdate*` controlled pairs; `defaultActiveFilters`, `defaultPage`, `defaultSorter`, `defaultCondition`, `actionColumn`, `loading`, `onChange`, selection and primary-key callbacks | `ViewRef`: table reset/selection plus `getCondition`, `updateTableSize`, `reset`. Internal hook fallbacks are page `1`, page size `10`, table size `middle`, `all()`, `[]`; required props remain required at this component boundary. |
| `Viewer<RecordType>` | `defaultViews`, `defaultView`, `definition`, `dataSource`, `pagination` | `loading`, `onLoadData`, `onSwitchView`, three persistence callbacks, count/action/table/selection/fullscreen props | `ViewerRef`: `getCondition`, `getActiveView`, `clearSelectedRowKeys`. It passes `enableRowSelection ?? true` to its internal `View`; that is not a required `Viewer` prop. |
| `FetcherViewer<RecordType>` | `viewerDefinitionId`, `pagination` | `ownerId`, `tenantId`, `defaultViewId`, action/table/selection props, `enhanceDataSource`, `onSwitchView` | `FetcherViewerRef`: `refreshData`, `clearSelectedRowKeys`, `getPageQuery`, `getActiveView`, `getViewerDefinition`; `ownerId` / `tenantId` default to `'(0)'`. |

The exported `useRefreshDataEventBus(subscriberId?)` returns the shared broadcast `bus`, `publish(subscriberId?)`, and `subscribe(handler, subscriberId?)`. A hook instance prefixes and tracks only the handler names that it successfully registers; cleanup removes those names on unmount or subscriber-ID change, without removing handlers from another instance that shares the same ID. Subscribe from an effect for a component-scoped handler, and do not assume a manual unsubscribe API exists. [packages/viewer/src/hooks/useRefreshDataEventBus.ts:15](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L15) [packages/viewer/src/hooks/useRefreshDataEventBus.ts:36](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L36) [packages/viewer/src/hooks/useRefreshDataEventBus.ts:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/hooks/useRefreshDataEventBus.ts#L71)

```tsx
import { Viewer } from '@ahoo-wang/fetcher-viewer';
import type { PagedList } from '@ahoo-wang/fetcher-wow';
import type { ViewDefinition, ViewState } from '@ahoo-wang/fetcher-viewer';

type UserRow = { id: string; name: string };

export function UsersViewer(props: {
  definition: ViewDefinition;
  views: ViewState[];
  activeView: ViewState;
  data: PagedList<UserRow>;
}) {
  return <Viewer<UserRow>
    defaultViews={props.views}
    defaultView={props.activeView}
    definition={props.definition}
    dataSource={props.data}
    pagination={{ showSizeChanger: false }}
    enableRowSelection={false}
    onLoadData={(condition, page, size, sorter) => {
      void loadUsers(condition, page, size, sorter);
    }}
  />;
}

declare function loadUsers(...args: unknown[]): Promise<void>;
```

## State and saved-view persistence

`View` supports uncontrolled `default*` state and controlled `external*` / matching `externalUpdate*` pairs for filters, columns, page, page size, table size, condition, and sorter. Its `filterMode` is `none`, `normal`, or `editable`; its `onChange` receives composed condition, one-based page, page size, and sorters. Defaults include page `1`, page size `10`, table size `middle`, `all()` condition, and empty sorter. [packages/viewer/src/view/View.tsx:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L66) [packages/viewer/src/view/View.tsx:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/View.tsx#L106) [packages/viewer/src/view/hooks/useViewState.ts:171](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/view/hooks/useViewState.ts#L171)

Keep controlled pairs together: a supplied external value without its update callback leaves the caller unable to own the next state. At the `Viewer` level, successful create/update/delete continuations update its local view collection; a failed persistence action should leave the previous visible state usable and surface an error in the caller-owned action flow. [packages/viewer/src/viewer/Viewer.tsx:127](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/viewer/Viewer.tsx#L127)

`FetcherViewer` keeps the last selected default view ID in a module-scope `KeyStorage` named `fetcher-viewer-local-default-view-id`; `KeyStorage` defaults to browser storage when none is supplied. Selection priority is explicit `defaultViewId`, then local stored ID, then the `isDefault` view, then the first view. [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L72) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:358](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L358) [packages/storage/src/keyStorage.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L47)

## Filters, cells, inputs, and registries

Public built-ins are `TagInput`, `NumberRange`, `RemoteSelect`, and `Fullscreen`; filters include `TypedFilter`, `AssemblyFilter`, ID, text, number, select, boolean, date/time, and their panels; cells include text, primary key, link, avatar, image, image group, tag(s), currency, date/time, calendar time, and action(s). `RemoteSelect` defaults to a 300 ms trailing debounce, `uniqueKey: 'value'`, and merges remote, initial, and additional options. [packages/viewer/src/components/RemoteSelect.tsx:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L29) [packages/viewer/src/components/RemoteSelect.tsx:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L59)

`filterRegistry` is preloaded with `id`, `text`, `number`, `select`, `bool`, and `datetime`; an unknown `TypedFilter` uses `FallbackFilter`. `cellRegistry` contains the documented cell types; `typedCellRender` returns `undefined` for an unregistered type. [packages/viewer/src/filter/filterRegistry.ts:73](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/filterRegistry.ts#L73) [packages/viewer/src/filter/TypedFilter.tsx:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TypedFilter.tsx#L30) [packages/viewer/src/table/cell/cellRegistry.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/cellRegistry.ts#L67) [packages/viewer/src/table/cell/TypedCell.tsx:117](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TypedCell.tsx#L117)

Register a custom type once before the first render, and keep its identifier stable because server-side view definitions may persist it. `register` throws on a duplicate; use `has` before a development-time registration, and do not clear a shared registry during component render. [packages/viewer/src/registry/componentRegistry.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/registry/componentRegistry.ts#L37) [packages/viewer/src/registry/componentRegistry.ts:98](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/registry/componentRegistry.ts#L98)

```tsx
import type { CellProps } from '@ahoo-wang/fetcher-viewer';
import { cellRegistry } from '@ahoo-wang/fetcher-viewer';

function ScoreCell({ data }: CellProps) {
  return <strong>{String(data.value)}</strong>;
}

if (!cellRegistry.has('score')) cellRegistry.register('score', ScoreCell);
```

## FetcherViewer data flow and failure boundaries

`FetcherViewer` loads the definition, saved views, then a paged POST query using `definition.dataUrl`; it combines a view's `internalCondition` with its visible condition, and accepts optional async `enhanceDataSource`. It exposes `refreshData`, `clearSelectedRowKeys`, `getPageQuery`, `getActiveView`, and `getViewerDefinition` through its ref. [packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L27) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L40)

| State | Owner and behavior |
| --- | --- |
| `ViewTable` / `View` / `Viewer` loading | Caller passes `loading`; caller owns transport errors and retry UI. |
| Empty rows | The data source is caller-owned at these three levels; render product-specific empty semantics. |
| `FetcherViewer` loading | Renders a spinner while definition or views load. |
| Definition error | `FetcherViewer` renders its built-in definition-error UI. |
| Views error | The views hook returns an error, but `FetcherViewer` ignores it; with no views/default view it reaches the final spinner and can remain there. |
| Data request error | The data hook returns an error, but `FetcherViewer` neither exposes nor renders it. |
| `enhanceDataSource` rejection | The async effect has no rejection handling, so it is neither exposed nor rendered by `FetcherViewer`. |

The component requires a configured default Fetcher before mount. It uses default `ownerId` and `tenantId` of `'(0)'`; changing those changes the remote view query. [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L81) [packages/viewer/src/fetcherviewer/FetcherViewer.tsx:286](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L286)

## Diagnose and scenarios

| Symptom | Check |
| --- | --- |
| Custom filter/cell is missing | Register its exact field `type` before rendering; `TypedFilter` falls back, while `typedCellRender` returns `undefined`. |
| View seems to ignore external state | Provide both `external*` and matching `externalUpdate*`; do not mix ownership accidentally. |
| Saved view appears before persistence | Invoke the mutation continuation only after the remote operation succeeds. |
| Unexpected default view | Check `defaultViewId`, local `fetcher-viewer-local-default-view-id`, `isDefault`, then source order. |
| FetcherViewer remains unavailable | Check default Fetcher registration, definition endpoint, views endpoint, and `viewerDefinitionId`. |
| Need views/data/enhancement error UI | Do not use `FetcherViewer` for that path: compose public `useViewerDefinition`, `useViewerViews`, and `useFetchData` with `Viewer`, then retain and render each error yourself. |

- Full caller-owned Viewer flows: [success](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--complete-flow), [empty](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--empty-result), [caller error and retry](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-viewer--caller-owned-error-and-retry)
- FetcherViewer flows: [remote success](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--remote-success), [definition error](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--definition-request-error), [imperative methods](https://fetcher.ahoo.me/storybook/?path=/story/viewer-flows-fetcherviewer--imperative-methods)
- Component galleries: [filters](https://fetcher.ahoo.me/storybook/?path=/story/viewer-filters--typed-gallery), [cells](https://fetcher.ahoo.me/storybook/?path=/story/viewer-tables-cells--gallery), and [inputs](https://fetcher.ahoo.me/storybook/?path=/story/viewer-inputs--remote-loading-and-success)

Continue with [Build a data viewer](../recipes/data-viewer.md).
