---
title: 'FetcherViewer remote integration'
description: 'FetcherViewer remote integration — @ahoo-wang/fetcher-viewer 5.0.0'
---

# FetcherViewer remote integration

FetcherViewer connects three remote resources: a viewer definition, its visible saved views, and paged data from the definition's dataUrl. Configure the default Fetcher for your service/authentication before mounting. The backend must implement the `viewer` bounded-context endpoints; this is not a generic URL-only grid.

| Input / ref             | Contract                                                                                                                              |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| viewerDefinitionId      | Required identity boundary; definitionId/tenantId/ownerId changes remount internal content to isolate pending state.                  |
| tenantId, ownerId       | Default `(0)` for both; shared view mutations use owner `(shared)`.                                                                   |
| defaultViewId           | Selection priority: explicit match, locally remembered ID, isDefault view, first view.                                                |
| pagination              | Required false or Pagination props; actionColumn, primary/secondary/batch actions and row selection configure presentation.           |
| enhanceDataSource(list) | Optional sync/async row transformation; total is preserved. Only results matching current view/source commit; failures show an alert. |
| FetcherViewerRef        | refreshData, clearSelectedRowKeys, getPageQuery, getActiveView, getViewerDefinition. Getters can return undefined before readiness.   |

## Loading and consistency

`useViewerDefinition(id)` loads one state via a snapshot query initialized from id. Used directly, changing id alone does not replace its initialQuery; remount or manage that boundary yourself. `useViewerViews(definitionId,tenantId,ownerId,target?)` fetches nondeleted matching snapshots for global/current tenant and shared/current owner, limit 999. A missing expected target can trigger a second limit-1 lookup using full identity. `execute(target?)` explicitly reloads; these initialization arguments are not a controlled query prop.

`useFetchData({viewerDefinition,defaultView})` posts a legacy PagedQuery, combines internalCondition with the selected condition using AND, defaults first page and view.pageSize || 10, and exposes dataSource/loading/error/setQuery/reload/getPageQuery. Stale results from a different view/request are hidden. reload runs only when a current valid query exists. Errors are available from this hook; the composite currently does not expose every data-fetch error as a dedicated prop/callback.

Create/update sends a PROCESSED command, checks errorCode and requires finite aggregateVersion. Success is acknowledged only after a newly loaded snapshot matches contextName/aggregateName/aggregateId/tenantId/ownerId/definitionId and version &gt;= command version. Until then the component shows pending/retry UI. Transport/domain errors do not falsely confirm save; identity switching/unmount invalidates pending create/update callbacks via mutationId; deletion has no equivalent guard. Deletion follows a different path: resolved transport triggers reload and success callback without the same version-confirmation flow; do not infer identical guarantees.

The local default view ID uses KeyStorage key `fetcher-viewer-local-default-view-id`. Refresh publishes to a shared definition-scoped bus; it does not automatically clear selected rows. Remote clients exported here include ViewCommandClient/ViewStreamCommandClient, endpoint constants, query factories, CreateView/EditView and event/field models. Streaming command clients return JSON SSE and leave reader cleanup to the caller. The exported Viewer SecurityContext is a data Record, distinct from React's security context.

## Create/update, deletion and row reads are different {#persistence-boundaries}

| Operation                  | Confirmation                                                                                                                                   | Lifetime boundary                                                                                       |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Create/update a saved view | PROCESSED result must succeed and carry finite aggregateVersion; refreshed snapshot must match full identity/definition and reach that version | Unmount invalidates mutationId so old create/update completions cannot confirm the new component's save |
| Delete a saved view        | Resolved transport starts a view reload and immediately calls completion, without awaiting that reload or checking the returned errorCode      | No equivalent mutationId check or create/update snapshot-version confirmation                           |
| Query rows                 | Current request's PagedList after optional enhancement                                                                                         | Request/source matching hides stale data; it is not the saved-view command version barrier              |

The create/update check has no projection-lag upper bound. Retrying confirmation reloads the expected view; it is not proof that the original write can safely be sent again. Tenant/owner remount isolates UI state, while the server still has to authorize every request. The shared default-ID storage key is not automatic tenant-scoped persistence.

## Complete example

```tsx
import { useRef } from 'react';
import { FetcherViewer } from '@ahoo-wang/fetcher-viewer';
import type { FetcherViewerRef } from '@ahoo-wang/fetcher-viewer';
interface User {
  id: string;
  name: string;
}
export function RemoteUsers() {
  const viewer = useRef<FetcherViewerRef>(null);
  return (
    <section>
      <button
        onClick={() => {
          viewer.current?.clearSelectedRowKeys();
          viewer.current?.refreshData();
        }}
      >
        Refresh
      </button>
      <FetcherViewer<User>
        ref={viewer}
        viewerDefinitionId="users"
        tenantId="tenant-a"
        ownerId="user-a"
        pagination={{ showSizeChanger: true }}
      />
    </section>
  );
}
```

Service URLs in examples require application endpoints; type checking does not imply an external service was contacted.

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

### VIEWER_BOUNDED_CONTEXT_ALIAS {#api-VIEWER_BOUNDED_CONTEXT_ALIAS}

```ts
declare const VIEWER_BOUNDED_CONTEXT_ALIAS: 'viewer';
```

[packages/viewer/src/fetcherviewer/client/boundedContext.ts:1](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/boundedContext.ts#L1)

### SecurityContext {#api-SecurityContext}

```ts
export type SecurityContext = Record<string, any>;
```

[packages/viewer/src/fetcherviewer/client/types.ts:10](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/types.ts#L10)

### ViewCommandEndpointPaths {#api-ViewCommandEndpointPaths}

```ts
export enum ViewCommandEndpointPaths {
  CREATE_VIEW = '/tenant/{tenantId}/owner/{ownerId}/view/type/{type}',
  DEFAULT_DELETE_AGGREGATE = '/tenant/{tenantId}/owner/{ownerId}/view/{id}',
  DEFAULT_RECOVER_AGGREGATE = '/tenant/{tenantId}/owner/{ownerId}/view/{id}/recover',
  EDIT_VIEW = '/tenant/{tenantId}/owner/{ownerId}/view/{id}/type/{type}',
}
```

[packages/viewer/src/fetcherviewer/client/view/commandClient.ts:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/commandClient.ts#L26)

### CreateViewCommand {#api-CreateViewCommand}

```ts
export type CreateViewCommand = CommandBody<CreateView>;
```

[packages/viewer/src/fetcherviewer/client/view/commandClient.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/commandClient.ts#L33)

### EditViewCommand {#api-EditViewCommand}

```ts
export type EditViewCommand = CommandBody<EditView>;
```

[packages/viewer/src/fetcherviewer/client/view/commandClient.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/commandClient.ts#L34)

### ViewCommandClient {#api-ViewCommandClient}

```ts
export class ViewCommandClient<R = CommandResult> implements ApiMetadataCapable {
    constructor(public readonly apiMetadata: ApiMetadata = DEFAULT_COMMAND_CLIENT_OPTIONS);
    createView(type: string, commandRequest: CommandRequest<CreateViewCommand>, attributes?: Record<string, any>): Promise<R>;
    defaultDeleteAggregate(id: string, commandRequest?: CommandRequest<DeleteAggregateCommand>, attributes?: Record<string, any>): Promise<R>;
    defaultRecoverAggregate(id: string, commandRequest?: CommandRequest<RecoverAggregateCommand>, attributes?: Record<string, any>): Promise<R>;
    editView(type: string, id: string, commandRequest: CommandRequest<EditViewCommand>, attributes?: Record<string, any>): Promise<R>;
}
```

[packages/viewer/src/fetcherviewer/client/view/commandClient.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/commandClient.ts#L40)

### ViewStreamCommandClient {#api-ViewStreamCommandClient}

```ts
export class ViewStreamCommandClient extends ViewCommandClient<CommandResultEventStream> {
  constructor(apiMetadata: ApiMetadata = DEFAULT_COMMAND_CLIENT_OPTIONS);
}
```

[packages/viewer/src/fetcherviewer/client/view/commandClient.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/commandClient.ts#L106)

### ViewDomainEventTypeMapTitle {#api-ViewDomainEventTypeMapTitle}

```ts
export enum ViewDomainEventTypeMapTitle {
  view_created = '视图已创建',
  view_edited = '视图已修改',
}
```

[packages/viewer/src/fetcherviewer/client/view/queryClient.ts:16](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/queryClient.ts#L16)

### ViewDomainEventType {#api-ViewDomainEventType}

```ts
export type ViewDomainEventType = ViewCreated | ViewEdited;
```

[packages/viewer/src/fetcherviewer/client/view/queryClient.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/queryClient.ts#L21)

### viewQueryClientFactory {#api-viewQueryClientFactory}

```ts
declare const viewQueryClientFactory: QueryClientFactory<
  ViewState,
  string,
  ViewDomainEventType
>;
```

[packages/viewer/src/fetcherviewer/client/view/queryClient.ts:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/queryClient.ts#L23)

### CreateView {#api-CreateView}

```ts
export interface CreateView {
  name: string;
  definitionId: string;
  columns: ViewColumn[];
  filters: ActiveFilter[];
  isDefault: boolean;
  condition?: Condition;
  internalCondition?: Condition;
  pageSize: number;
  sorter?: FieldSort[];
  source: ViewSource;
  tableSize: SizeType;
}
```

[packages/viewer/src/fetcherviewer/client/view/types.ts:75](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/types.ts#L75)

### EditView {#api-EditView}

```ts
export interface EditView {
  name: string;
  definitionId: string;
  columns: ViewColumn[];
  filters: ActiveFilter[];
  isDefault: boolean;
  condition?: Condition;
  internalCondition?: Condition;
  pageSize: number;
  sorter?: FieldSort[];
  source: ViewSource;
  tableSize: SizeType;
}
```

[packages/viewer/src/fetcherviewer/client/view/types.ts:149](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/types.ts#L149)

### ViewCreated {#api-ViewCreated}

```ts
export interface ViewCreated {
  name: string;
  definitionId: string;
  columns: ViewColumn[];
  filters: ActiveFilter[];
  isDefault: boolean;
  condition: Condition;
  internalCondition: Condition;
  pageSize: number;
  sorter: FieldSort[];
  source: ViewSource;
  tableSize: SizeType;
}
```

[packages/viewer/src/fetcherviewer/client/view/types.ts:226](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/types.ts#L226)

### ViewEdited {#api-ViewEdited}

```ts
export interface ViewEdited {
  name: string;
  definitionId: string;
  columns: ViewColumn[];
  filters: ActiveFilter[];
  isDefault: boolean;
  condition: Condition;
  internalCondition: Condition;
  pageSize: number;
  sorter: FieldSort[];
  source: ViewSource;
  tableSize: SizeType;
}
```

[packages/viewer/src/fetcherviewer/client/view/types.ts:303](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/types.ts#L303)

### ViewAggregatedFields {#api-ViewAggregatedFields}

::: details Expand all fields and members

```ts
export enum ViewAggregatedFields {
  AGGREGATE_ID = `aggregateId`,
  TENANT_ID = `tenantId`,
  OWNER_ID = `ownerId`,
  VERSION = `version`,
  EVENT_ID = `eventId`,
  FIRST_OPERATOR = `firstOperator`,
  OPERATOR = `operator`,
  FIRST_EVENT_TIME = `firstEventTime`,
  EVENT_TIME = `eventTime`,
  DELETED = `deleted`,
  STATE = `state`,
  STATE_COLUMNS = `state.columns`,
  STATE_COLUMNS_FIXED = `state.columns.fixed`,
  STATE_COLUMNS_HIDDEN = `state.columns.hidden`,
  STATE_COLUMNS_NAME = `state.columns.name`,
  STATE_COLUMNS_SORT_ORDER = `state.columns.sortOrder`,
  STATE_COLUMNS_WIDTH = `state.columns.width`,
  STATE_CONDITION = `state.condition`,
  STATE_CONDITION_CHILDREN = `state.condition.children`,
  STATE_CONDITION_CHILDREN_CHILDREN = `state.condition.children.children`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN = `state.condition.children.children.children`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_CHILDREN = `state.condition.children.children.children.children`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_FIELD = `state.condition.children.children.children.field`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_OPERATOR = `state.condition.children.children.children.operator`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_OPTIONS = `state.condition.children.children.children.options`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_VALUE = `state.condition.children.children.children.value`,
  STATE_CONDITION_CHILDREN_CHILDREN_FIELD = `state.condition.children.children.field`,
  STATE_CONDITION_CHILDREN_CHILDREN_OPERATOR = `state.condition.children.children.operator`,
  STATE_CONDITION_CHILDREN_CHILDREN_OPTIONS = `state.condition.children.children.options`,
  STATE_CONDITION_CHILDREN_CHILDREN_VALUE = `state.condition.children.children.value`,
  STATE_CONDITION_CHILDREN_FIELD = `state.condition.children.field`,
  STATE_CONDITION_CHILDREN_OPERATOR = `state.condition.children.operator`,
  STATE_CONDITION_CHILDREN_OPTIONS = `state.condition.children.options`,
  STATE_CONDITION_CHILDREN_VALUE = `state.condition.children.value`,
  STATE_CONDITION_FIELD = `state.condition.field`,
  STATE_CONDITION_OPERATOR = `state.condition.operator`,
  STATE_CONDITION_OPTIONS = `state.condition.options`,
  STATE_CONDITION_VALUE = `state.condition.value`,
  STATE_DEFINITION_ID = `state.definitionId`,
  STATE_FILTERS = `state.filters`,
  STATE_FILTERS_CONDITION_OPTIONS = `state.filters.conditionOptions`,
  STATE_FILTERS_FIELD = `state.filters.field`,
  STATE_FILTERS_FIELD_FORMAT = `state.filters.field.format`,
  STATE_FILTERS_FIELD_LABEL = `state.filters.field.label`,
  STATE_FILTERS_FIELD_NAME = `state.filters.field.name`,
  STATE_FILTERS_FIELD_TYPE = `state.filters.field.type`,
  STATE_FILTERS_KEY = `state.filters.key`,
  STATE_FILTERS_LABEL = `state.filters.label`,
  STATE_FILTERS_LABEL_CLASS_NAME = `state.filters.label.className`,
  STATE_FILTERS_LABEL_STYLE = `state.filters.label.style`,
  STATE_FILTERS_OPERATOR = `state.filters.operator`,
  STATE_FILTERS_OPERATOR_DEFAULT_OPERATOR = `state.filters.operator.defaultOperator`,
  STATE_FILTERS_OPERATOR_LOCALE = `state.filters.operator.locale`,
  STATE_FILTERS_OPERATOR_SUPPORTED_OPERATORS = `state.filters.operator.supportedOperators`,
  STATE_FILTERS_TYPE = `state.filters.type`,
  STATE_FILTERS_VALUE = `state.filters.value`,
  STATE_FILTERS_VALUE_CLASS_NAME = `state.filters.value.className`,
  STATE_FILTERS_VALUE_DEFAULT_VALUE = `state.filters.value.defaultValue`,
  STATE_FILTERS_VALUE_PLACEHOLDER = `state.filters.value.placeholder`,
  STATE_FILTERS_VALUE_STYLE = `state.filters.value.style`,
  STATE_ID = `state.id`,
  STATE_INTERNAL_CONDITION = `state.internalCondition`,
  STATE_INTERNAL_CONDITION_CHILDREN = `state.internalCondition.children`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN = `state.internalCondition.children.children`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN = `state.internalCondition.children.children.children`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_CHILDREN = `state.internalCondition.children.children.children.children`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_FIELD = `state.internalCondition.children.children.children.field`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_OPERATOR = `state.internalCondition.children.children.children.operator`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_OPTIONS = `state.internalCondition.children.children.children.options`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_VALUE = `state.internalCondition.children.children.children.value`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_FIELD = `state.internalCondition.children.children.field`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_OPERATOR = `state.internalCondition.children.children.operator`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_OPTIONS = `state.internalCondition.children.children.options`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_VALUE = `state.internalCondition.children.children.value`,
  STATE_INTERNAL_CONDITION_CHILDREN_FIELD = `state.internalCondition.children.field`,
  STATE_INTERNAL_CONDITION_CHILDREN_OPERATOR = `state.internalCondition.children.operator`,
  STATE_INTERNAL_CONDITION_CHILDREN_OPTIONS = `state.internalCondition.children.options`,
  STATE_INTERNAL_CONDITION_CHILDREN_VALUE = `state.internalCondition.children.value`,
  STATE_INTERNAL_CONDITION_FIELD = `state.internalCondition.field`,
  STATE_INTERNAL_CONDITION_OPERATOR = `state.internalCondition.operator`,
  STATE_INTERNAL_CONDITION_OPTIONS = `state.internalCondition.options`,
  STATE_INTERNAL_CONDITION_VALUE = `state.internalCondition.value`,
  STATE_IS_DEFAULT = `state.isDefault`,
  STATE_NAME = `state.name`,
  STATE_PAGE_SIZE = `state.pageSize`,
  STATE_SORTER = `state.sorter`,
  STATE_SORTER_COLUMN_KEY = `state.sorter.columnKey`,
  STATE_SORTER_FIELD = `state.sorter.field`,
  STATE_SORTER_ORDER = `state.sorter.order`,
  STATE_SOURCE = `state.source`,
  STATE_TABLE_SIZE = `state.tableSize`,
  STATE_TYPE = `state.type`,
}
```

:::

[packages/viewer/src/fetcherviewer/client/view/types.ts:421](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/view/types.ts#L421)

### ViewerDefinitionDomainEventTypeMapTitle {#api-ViewerDefinitionDomainEventTypeMapTitle}

```ts
export enum ViewerDefinitionDomainEventTypeMapTitle {
  viewer_definition_saved = 'viewer_definition_saved',
}
```

[packages/viewer/src/fetcherviewer/client/viewer_definition/queryClient.ts:16](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/viewer_definition/queryClient.ts#L16)

### ViewerDefinitionDomainEventType {#api-ViewerDefinitionDomainEventType}

```ts
export type ViewerDefinitionDomainEventType = any;
```

[packages/viewer/src/fetcherviewer/client/viewer_definition/queryClient.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/viewer_definition/queryClient.ts#L20)

### viewerDefinitionQueryClientFactory {#api-viewerDefinitionQueryClientFactory}

```ts
declare const viewerDefinitionQueryClientFactory: QueryClientFactory<
  ViewDefinition,
  string,
  any
>;
```

[packages/viewer/src/fetcherviewer/client/viewer_definition/queryClient.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/viewer_definition/queryClient.ts#L22)

### ViewerDefinitionAggregatedFields {#api-ViewerDefinitionAggregatedFields}

::: details Expand all fields and members

```ts
export enum ViewerDefinitionAggregatedFields {
  AGGREGATE_ID = `aggregateId`,
  TENANT_ID = `tenantId`,
  OWNER_ID = `ownerId`,
  VERSION = `version`,
  EVENT_ID = `eventId`,
  FIRST_OPERATOR = `firstOperator`,
  OPERATOR = `operator`,
  FIRST_EVENT_TIME = `firstEventTime`,
  EVENT_TIME = `eventTime`,
  DELETED = `deleted`,
  STATE = `state`,
  STATE_AVAILABLE_FILTERS = `state.availableFilters`,
  STATE_AVAILABLE_FILTERS_FILTERS = `state.availableFilters.filters`,
  STATE_AVAILABLE_FILTERS_FILTERS_COMPONENT = `state.availableFilters.filters.component`,
  STATE_AVAILABLE_FILTERS_FILTERS_FIELD = `state.availableFilters.filters.field`,
  STATE_AVAILABLE_FILTERS_FILTERS_FIELD_FORMAT = `state.availableFilters.filters.field.format`,
  STATE_AVAILABLE_FILTERS_FILTERS_FIELD_LABEL = `state.availableFilters.filters.field.label`,
  STATE_AVAILABLE_FILTERS_FILTERS_FIELD_NAME = `state.availableFilters.filters.field.name`,
  STATE_AVAILABLE_FILTERS_FILTERS_FIELD_TYPE = `state.availableFilters.filters.field.type`,
  STATE_AVAILABLE_FILTERS_FILTERS_OPERATOR = `state.availableFilters.filters.operator`,
  STATE_AVAILABLE_FILTERS_FILTERS_OPERATOR_DEFAULT_OPERATOR = `state.availableFilters.filters.operator.defaultOperator`,
  STATE_AVAILABLE_FILTERS_FILTERS_OPERATOR_LOCALE = `state.availableFilters.filters.operator.locale`,
  STATE_AVAILABLE_FILTERS_FILTERS_OPERATOR_SUPPORTED_OPERATORS = `state.availableFilters.filters.operator.supportedOperators`,
  STATE_AVAILABLE_FILTERS_FILTERS_VALUE = `state.availableFilters.filters.value`,
  STATE_AVAILABLE_FILTERS_FILTERS_VALUE_CLASS_NAME = `state.availableFilters.filters.value.className`,
  STATE_AVAILABLE_FILTERS_FILTERS_VALUE_DEFAULT_VALUE = `state.availableFilters.filters.value.defaultValue`,
  STATE_AVAILABLE_FILTERS_FILTERS_VALUE_PLACEHOLDER = `state.availableFilters.filters.value.placeholder`,
  STATE_AVAILABLE_FILTERS_FILTERS_VALUE_STYLE = `state.availableFilters.filters.value.style`,
  STATE_AVAILABLE_FILTERS_LABEL = `state.availableFilters.label`,
  STATE_CHECKABLE = `state.checkable`,
  STATE_COUNT_URL = `state.countUrl`,
  STATE_DATA_URL = `state.dataUrl`,
  STATE_FIELDS = `state.fields`,
  STATE_FIELDS_ATTRIBUTES = `state.fields.attributes`,
  STATE_FIELDS_LABEL = `state.fields.label`,
  STATE_FIELDS_NAME = `state.fields.name`,
  STATE_FIELDS_PRIMARY_KEY = `state.fields.primaryKey`,
  STATE_FIELDS_SORTER = `state.fields.sorter`,
  STATE_FIELDS_SORTER_MULTIPLE = `state.fields.sorter.multiple`,
  STATE_ID = `state.id`,
  STATE_NAME = `state.name`,
}
```

:::

[packages/viewer/src/fetcherviewer/client/viewer_definition/types.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/client/viewer_definition/types.ts#L54)

### useViewerDefinition {#api-useViewerDefinition}

```ts
export function useViewerDefinition(
  viewerDefinitionId: string,
): UseViewerDefinitionResult;
```

[packages/viewer/src/fetcherviewer/hooks/useViewerDefinition.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useViewerDefinition.ts#L31)

### UseViewerDefinitionResult {#api-UseViewerDefinitionResult}

```ts
export interface UseViewerDefinitionResult {
  viewerDefinition: ViewDefinition | undefined;
  loading: boolean;
  error: Error | undefined;
}
```

[packages/viewer/src/fetcherviewer/hooks/useViewerDefinition.ts:9](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useViewerDefinition.ts#L9)

### useViewerViews {#api-useViewerViews}

```ts
export function useViewerViews(
  definitionId: string,
  tenantId: string,
  ownerId: string,
  target?: ViewSnapshotTarget,
): UseViewerViewsResult;
```

[packages/viewer/src/fetcherviewer/hooks/useViewerViews.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useViewerViews.ts#L39)

### ViewSnapshotTarget {#api-ViewSnapshotTarget}

```ts
export type ViewSnapshotTarget = AggregateId & {
  ownerId: string;
};
```

[packages/viewer/src/fetcherviewer/hooks/useViewerViews.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useViewerViews.ts#L28)

### UseViewerViewsResult {#api-UseViewerViewsResult}

```ts
export interface UseViewerViewsResult {
  views: ViewState[] | undefined;
  snapshots?: MaterializedSnapshot<ViewState>[];
  loading: boolean;
  error: Error | undefined;
  execute: (target?: ViewSnapshotTarget) => void;
}
```

[packages/viewer/src/fetcherviewer/hooks/useViewerViews.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useViewerViews.ts#L30)

### useFetchData {#api-useFetchData}

```ts
export function useFetchData<RecordType>(
  options: UseFetchDataOptions,
): UseFetchDataReturn<RecordType>;
```

[packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L48)

### UseFetchDataOptions {#api-UseFetchDataOptions}

```ts
export interface UseFetchDataOptions {
  viewerDefinition: ViewDefinition | undefined;
  defaultView: ViewState | undefined;
}
```

[packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L28)

### UseFetchDataReturn {#api-UseFetchDataReturn}

```ts
export interface UseFetchDataReturn<RecordType> {
  dataSource?: PagedList<RecordType>;
  loading: boolean;
  setQuery?: ViewChangeAction;
  error: FetcherError | undefined;
  reload: () => Promise<void>;
  getPageQuery: () => PagedQuery | undefined;
}
```

[packages/viewer/src/fetcherviewer/hooks/useFetchData.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/hooks/useFetchData.ts#L33)

### FetcherViewer {#api-FetcherViewer}

```ts
export function FetcherViewer<RecordType = any>(
  props: FetcherViewerProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:103](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L103)

### FetcherViewerRef {#api-FetcherViewerRef}

```ts
export interface FetcherViewerRef {
  refreshData: () => void;
  clearSelectedRowKeys: () => void;
  getPageQuery: () => PagedQuery | undefined;
  getActiveView: () => ViewState | undefined;
  getViewerDefinition: () => ViewDefinition | undefined;
}
```

[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L62)

### FetcherViewerProps {#api-FetcherViewerProps}

::: details Expand all fields and members

```ts
export interface FetcherViewerProps<RecordType>
  extends
    ViewTableSettingCapable,
    RefAttributes<FetcherViewerRef>,
    TopbarActionsCapable<RecordType> {
  viewerDefinitionId: string;
  ownerId?: string;
  tenantId?: string;
  defaultViewId?: string;
  pagination:
    false | Omit<PaginationProps, 'onChange' | 'onShowSizeChange' | 'total'>;
  actionColumn?: ViewTableActionColumn<RecordType>;
  onClickPrimaryKey?: (id: any, record: RecordType) => void;
  enableRowSelection?: boolean;
  enhanceDataSource?: (
    data: RecordType[],
  ) => RecordType[] | Promise<RecordType[]>;
  onSwitchView?: (view: ViewState) => void;
}
```

:::

[packages/viewer/src/fetcherviewer/FetcherViewer.tsx:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/fetcherviewer/FetcherViewer.tsx#L70)

## Related topics

[Models and state ownership](./models-and-state) · [View and Viewer composition](./view-and-viewer) · [Saved-view panels and persistence callbacks](./saved-views) · [Filters and editable panels](./filters) · [Tables, columns and cells](./tables-and-cells) · [Registries, inputs and fullscreen button](./registries-and-inputs) · [Toolbar, refresh and locale](./toolbar-and-locale)
