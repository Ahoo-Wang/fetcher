---
title: 'FetcherViewer 远端集成'
description: 'FetcherViewer 远端集成 — @ahoo-wang/fetcher-viewer 5.0.0'
---

# FetcherViewer 远端集成

FetcherViewer 连接三个远端资源：视图定义、可见保存视图，以及 definition.dataUrl 的分页数据。挂载前配置默认 Fetcher 的服务/认证；后端必须实现 `viewer` 限界上下文端点，不是仅传 URL 的通用表格。

| 输入 / ref              | 契约                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------- |
| viewerDefinitionId      | 必填身份边界，definitionId/tenantId/ownerId 变化重新挂载内部内容以隔离在途状态。                                    |
| tenantId、ownerId       | 均默认 `(0)`；共享视图 mutation 使用 owner `(shared)`。                                                             |
| defaultViewId           | 选择优先级：显式匹配、本地记忆 ID、isDefault 视图、首项。                                                           |
| pagination              | 必填 false 或 Pagination props；actionColumn、主/次/批量操作和行选择控制展示。                                      |
| enhanceDataSource(list) | 可选同步/异步行转换，保留 total；仅当前视图/源对应结果可提交，失败显示 alert。                                      |
| FetcherViewerRef        | refreshData、clearSelectedRowKeys、getPageQuery、getActiveView、getViewerDefinition；就绪前 getter 可为 undefined。 |

## 加载与一致性

`useViewerDefinition(id)` 以 id 初始化快照查询读取单个 state；直接使用时仅改变 id 不替换 initialQuery，应重新挂载或自行管理边界。`useViewerViews(definitionId,tenantId,ownerId,target?)` 查询未删除、定义匹配、全局/当前租户、共享/当前所有者快照，limit 999。预期 target 未出现时，以完整身份追加 limit 1 查询。`execute(target?)` 显式重载，这些初始化参数不是受控 query prop。

`useFetchData({viewerDefinition,defaultView})` POST 旧 PagedQuery，将 internalCondition 与当前 condition 做 AND，默认首个页码及 view.pageSize || 10，暴露 dataSource/loading/error/setQuery/reload/getPageQuery。其他视图/请求的旧结果被隐藏；当前有效查询存在时 reload 才执行。错误从该 Hook 可读，但组合组件目前不为每种数据请求错误暴露专门 prop/回调。

创建/更新发送 PROCESSED 命令，检查 errorCode 并要求有限 aggregateVersion。只有新加载快照的 contextName/aggregateName/aggregateId/tenantId/ownerId/definitionId 全匹配且 version &gt;= 命令版本才确认成功；此前显示等待/重试 UI。传输/领域失败不会错误确认保存，身份切换/卸载通过 mutationId 作废创建/更新的待执行回调；删除没有同等标记检查。删除走另一条路径：传输 Promise 完成即重载并调用成功回调，没有相同版本确认流程，不能推断同等保证。

本地默认视图 ID 存于 `fetcher-viewer-local-default-view-id` KeyStorage。刷新向共享定义作用域总线发布，不自动清除选中行。该专题还覆盖 ViewCommandClient/ViewStreamCommandClient、端点常量、查询工厂、CreateView/EditView 和事件/字段模型。流命令客户端返回 JSON SSE，由调用者清理 reader。Viewer 导出的 SecurityContext 是数据 Record，与 React 安全上下文不同。

## 创建/更新、删除与行读取是不同流程 {#persistence-boundaries}

| 操作              | 确认条件                                                                             | 生命周期边界                                                |
| ----------------- | ------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| 创建/更新保存视图 | PROCESSED 结果成功且具有有限 aggregateVersion；刷新快照匹配完整身份/定义并达到该版本 | 卸载使 mutationId 失效，旧创建/更新完成不能确认新组件的保存 |
| 删除保存视图      | 传输 resolve 后启动重载并立即调用完成回调，不等待重载或检查返回的 errorCode          | 没有同等 mutationId 检查或创建/更新的快照版本确认           |
| 查询行            | 当前请求的 PagedList，可经过增强处理                                                 | 请求/来源匹配隐藏旧数据；不是保存视图命令的版本屏障         |

创建/更新检查不限定投影延迟上界。重试确认是重新加载目标视图，不证明可安全重发原写入。租户/所有者变化 remount 隔离 UI 状态，服务端仍须授权每个请求。共享默认 ID 存储键不自动提供按租户隔离的持久化。

## 完整示例

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

示例中的服务 URL 需要应用实现；类型检查不代表已经访问外部服务。

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

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

::: details 展开完整字段与成员

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

::: details 展开完整字段与成员

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

::: details 展开完整字段与成员

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

## 相关专题

[模型与状态所有权](./models-and-state) · [View 与 Viewer 组合](./view-and-viewer) · [已保存视图面板与持久化回调](./saved-views) · [过滤器与可编辑面板](./filters) · [表格、列与单元格](./tables-and-cells) · [注册表、输入与全屏按钮](./registries-and-inputs) · [工具栏、刷新与本地化](./toolbar-and-locale)
