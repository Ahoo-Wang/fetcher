---
title: 'Wow Reference'
description: '@ahoo-wang/fetcher-wow 5.0.0 API reference'
---

# Wow

类型化 Wow 命令/查询客户端、过滤/游标/聚合构造器及领域线上模型。包声明 Node &gt;=18.20.8，依赖 Fetcher/decorator/eventstream peers。构造器在本地运行，客户端示例需要实际 Wow 端点。

## 安装

```sh
pnpm add @ahoo-wang/fetcher-wow
```

同时满足 [package.json](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/package.json#L1) 中的 peerDependencies；包版本基线为 5.0.0。

## 最小示例

```ts
import {
  QueryClientFactory,
  createQueryApiMetadata,
} from '@ahoo-wang/fetcher-wow';
interface User {
  id: string;
  name: string;
}
const options = { contextAlias: 'accounts', aggregateName: 'user' };
const factory = new QueryClientFactory<User>(options);
const snapshots = factory.createSnapshotQueryClient();
const history = factory.createLoadStateAggregateClient();
console.log(createQueryApiMetadata(options).basePath); // accounts/user
export { snapshots, history };
```

## 专题

- [客户端配置与元数据](/zh/reference/wow/configuration)
- [命令与等待结果](/zh/reference/wow/commands)
- [快照查询](/zh/reference/wow/snapshot-queries)
- [过滤表达式与旧条件](/zh/reference/wow/filters)
- [投影、排序与分页](/zh/reference/wow/query-options)
- [游标查询](/zh/reference/wow/cursor-queries)
- [聚合构造器](/zh/reference/wow/aggregations)
- [事件与历史状态](/zh/reference/wow/events-and-history)
- [共享领域类型与工具](/zh/reference/wow/shared-types)

## 公开符号索引 {#public-symbols}

| 符号                                   | 专题                                                                            |
| -------------------------------------- | ------------------------------------------------------------------------------- |
| `AbacTagKey`                           | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AbacTagKey)                             |
| `AbacTagValue`                         | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AbacTagValue)                           |
| `AbacTaggable`                         | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AbacTaggable)                           |
| `AbacTags`                             | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AbacTags)                               |
| `AbacTagsApplied`                      | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AbacTagsApplied)                        |
| `Aggregate`                            | [客户端配置与元数据](/zh/reference/wow/configuration#api-Aggregate)                             |
| `AggregateId`                          | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AggregateId)                            |
| `AggregateIdCapable`                   | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AggregateIdCapable)                     |
| `AggregateNameCapable`                 | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AggregateNameCapable)                   |
| `AggregationDateUnit`                  | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationDateUnit)                            |
| `AggregationElement`                   | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationElement)                             |
| `AggregationExpression`                | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationExpression)                          |
| `AggregationExpressionOperator`        | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationExpressionOperator)                  |
| `AggregationExpressionType`            | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationExpressionType)                      |
| `AggregationFunction`                  | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationFunction)                            |
| `AggregationGroup`                     | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationGroup)                               |
| `AggregationGroupType`                 | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationGroupType)                           |
| `AggregationMetric`                    | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationMetric)                              |
| `AggregationMetricType`                | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationMetricType)                          |
| `AggregationQuery`                     | [聚合构造器](/zh/reference/wow/aggregations#api-AggregationQuery)                               |
| `AliasAggregate`                       | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AliasAggregate)                         |
| `AliasBoundedContext`                  | [共享领域类型与工具](/zh/reference/wow/shared-types#api-AliasBoundedContext)                    |
| `AnyAggregationMetric`                 | [聚合构造器](/zh/reference/wow/aggregations#api-AnyAggregationMetric)                           |
| `ApplyAbacTags`                        | [共享领域类型与工具](/zh/reference/wow/shared-types#api-ApplyAbacTags)                          |
| `ApplyResourceTags`                    | [命令与等待结果](/zh/reference/wow/commands#api-ApplyResourceTags)                              |
| `ApplyResourceTagsCommand`             | [命令与等待结果](/zh/reference/wow/commands#api-ApplyResourceTagsCommand)                       |
| `BatchResult`                          | [命令与等待结果](/zh/reference/wow/commands#api-BatchResult)                                    |
| `BeforeTodayFilter`                    | [过滤表达式与旧条件](/zh/reference/wow/filters#api-BeforeTodayFilter)                           |
| `BetweenFilter`                        | [过滤表达式与旧条件](/zh/reference/wow/filters#api-BetweenFilter)                               |
| `BinaryAggregationExpression`          | [聚合构造器](/zh/reference/wow/aggregations#api-BinaryAggregationExpression)                    |
| `BindingError`                         | [共享领域类型与工具](/zh/reference/wow/shared-types#api-BindingError)                           |
| `BodyCapable`                          | [共享领域类型与工具](/zh/reference/wow/shared-types#api-BodyCapable)                            |
| `BoundedContext`                       | [客户端配置与元数据](/zh/reference/wow/configuration#api-BoundedContext)                        |
| `CalendarFilter`                       | [过滤表达式与旧条件](/zh/reference/wow/filters#api-CalendarFilter)                              |
| `CollectionFilter`                     | [过滤表达式与旧条件](/zh/reference/wow/filters#api-CollectionFilter)                            |
| `CommandBody`                          | [命令与等待结果](/zh/reference/wow/commands#api-CommandBody)                                    |
| `CommandClient`                        | [命令与等待结果](/zh/reference/wow/commands#api-CommandClient)                                  |
| `CommandHeaders`                       | [命令与等待结果](/zh/reference/wow/commands#api-CommandHeaders)                                 |
| `CommandId`                            | [命令与等待结果](/zh/reference/wow/commands#api-CommandId)                                      |
| `CommandRequest`                       | [命令与等待结果](/zh/reference/wow/commands#api-CommandRequest)                                 |
| `CommandRequestHeaders`                | [命令与等待结果](/zh/reference/wow/commands#api-CommandRequestHeaders)                          |
| `CommandResult`                        | [命令与等待结果](/zh/reference/wow/commands#api-CommandResult)                                  |
| `CommandResultArray`                   | [命令与等待结果](/zh/reference/wow/commands#api-CommandResultArray)                             |
| `CommandResultCapable`                 | [命令与等待结果](/zh/reference/wow/commands#api-CommandResultCapable)                           |
| `CommandResultEventStream`             | [命令与等待结果](/zh/reference/wow/commands#api-CommandResultEventStream)                       |
| `CommandStage`                         | [命令与等待结果](/zh/reference/wow/commands#api-CommandStage)                                   |
| `CommandStageCapable`                  | [命令与等待结果](/zh/reference/wow/commands#api-CommandStageCapable)                            |
| `CommandUrlParams`                     | [命令与等待结果](/zh/reference/wow/commands#api-CommandUrlParams)                               |
| `ComparableFilterLiteral`              | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ComparableFilterLiteral)                     |
| `ComparisonFilter`                     | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ComparisonFilter)                            |
| `CompensationTarget`                   | [命令与等待结果](/zh/reference/wow/commands#api-CompensationTarget)                             |
| `Condition`                            | [过滤表达式与旧条件](/zh/reference/wow/filters#api-Condition)                                   |
| `ConditionCapable`                     | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ConditionCapable)                            |
| `ConditionOptionKey`                   | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ConditionOptionKey)                          |
| `ConditionOptions`                     | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ConditionOptions)                            |
| `ConstantAggregationExpression`        | [聚合构造器](/zh/reference/wow/aggregations#api-ConstantAggregationExpression)                  |
| `CountAggregationMetric`               | [聚合构造器](/zh/reference/wow/aggregations#api-CountAggregationMetric)                         |
| `CreateTimeCapable`                    | [共享领域类型与工具](/zh/reference/wow/shared-types#api-CreateTimeCapable)                      |
| `CursorPage`                           | [游标查询](/zh/reference/wow/cursor-queries#api-CursorPage)                                     |
| `CursorQuery`                          | [游标查询](/zh/reference/wow/cursor-queries#api-CursorQuery)                                    |
| `DEFAULT_CURSOR_SIZE`                  | [游标查询](/zh/reference/wow/cursor-queries#api-DEFAULT_CURSOR_SIZE)                            |
| `DEFAULT_OWNER_ID`                     | [共享领域类型与工具](/zh/reference/wow/shared-types#api-DEFAULT_OWNER_ID)                       |
| `DEFAULT_PAGINATION`                   | [投影、排序与分页](/zh/reference/wow/query-options#api-DEFAULT_PAGINATION)                      |
| `DEFAULT_PROJECTION`                   | [投影、排序与分页](/zh/reference/wow/query-options#api-DEFAULT_PROJECTION)                      |
| `DateHistogramAggregationGroup`        | [聚合构造器](/zh/reference/wow/aggregations#api-DateHistogramAggregationGroup)                  |
| `DateHistogramAggregationOptions`      | [聚合构造器](/zh/reference/wow/aggregations#api-DateHistogramAggregationOptions)                |
| `DaysFilter`                           | [过滤表达式与旧条件](/zh/reference/wow/filters#api-DaysFilter)                                  |
| `DeleteAggregate`                      | [命令与等待结果](/zh/reference/wow/commands#api-DeleteAggregate)                                |
| `DeleteAggregateCommand`               | [命令与等待结果](/zh/reference/wow/commands#api-DeleteAggregateCommand)                         |
| `DeletedCapable`                       | [共享领域类型与工具](/zh/reference/wow/shared-types#api-DeletedCapable)                         |
| `DeletionFilter`                       | [过滤表达式与旧条件](/zh/reference/wow/filters#api-DeletionFilter)                              |
| `DeletionState`                        | [过滤表达式与旧条件](/zh/reference/wow/filters#api-DeletionState)                               |
| `DescriptionCapable`                   | [共享领域类型与工具](/zh/reference/wow/shared-types#api-DescriptionCapable)                     |
| `DomainEvent`                          | [事件与历史状态](/zh/reference/wow/events-and-history#api-DomainEvent)                          |
| `DomainEventStream`                    | [事件与历史状态](/zh/reference/wow/events-and-history#api-DomainEventStream)                    |
| `DomainEventStreamHeader`              | [事件与历史状态](/zh/reference/wow/events-and-history#api-DomainEventStreamHeader)              |
| `DomainEventStreamMetadataFields`      | [事件与历史状态](/zh/reference/wow/events-and-history#api-DomainEventStreamMetadataFields)      |
| `DynamicDocument`                      | [共享领域类型与工具](/zh/reference/wow/shared-types#api-DynamicDocument)                        |
| `DynamicDocumentArray`                 | [共享领域类型与工具](/zh/reference/wow/shared-types#api-DynamicDocumentArray)                   |
| `EMPTY_ABAC_TAGS`                      | [共享领域类型与工具](/zh/reference/wow/shared-types#api-EMPTY_ABAC_TAGS)                        |
| `EMPTY_PAGED_LIST`                     | [投影、排序与分页](/zh/reference/wow/query-options#api-EMPTY_PAGED_LIST)                        |
| `EMPTY_VALUE_OPERATORS`                | [过滤表达式与旧条件](/zh/reference/wow/filters#api-EMPTY_VALUE_OPERATORS)                       |
| `ElementFilterExpression`              | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ElementFilterExpression)                     |
| `ElementLogicalFilter`                 | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ElementLogicalFilter)                        |
| `ElementMatchFilter`                   | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ElementMatchFilter)                          |
| `EqualityFilter`                       | [过滤表达式与旧条件](/zh/reference/wow/filters#api-EqualityFilter)                              |
| `EqualityFilterValue`                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-EqualityFilterValue)                         |
| `ErrorCodes`                           | [共享领域类型与工具](/zh/reference/wow/shared-types#api-ErrorCodes)                             |
| `ErrorInfo`                            | [共享领域类型与工具](/zh/reference/wow/shared-types#api-ErrorInfo)                              |
| `EventIdCapable`                       | [共享领域类型与工具](/zh/reference/wow/shared-types#api-EventIdCapable)                         |
| `EventStreamQueryApi`                  | [事件与历史状态](/zh/reference/wow/events-and-history#api-EventStreamQueryApi)                  |
| `EventStreamQueryClient`               | [事件与历史状态](/zh/reference/wow/events-and-history#api-EventStreamQueryClient)               |
| `EventStreamQueryEndpointPaths`        | [事件与历史状态](/zh/reference/wow/events-and-history#api-EventStreamQueryEndpointPaths)        |
| `EventTimeCapable`                     | [共享领域类型与工具](/zh/reference/wow/shared-types#api-EventTimeCapable)                       |
| `FieldAggregationExpression`           | [聚合构造器](/zh/reference/wow/aggregations#api-FieldAggregationExpression)                     |
| `FieldPresenceFilter`                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-FieldPresenceFilter)                         |
| `FieldSort`                            | [投影、排序与分页](/zh/reference/wow/query-options#api-FieldSort)                               |
| `FilterCapable`                        | [过滤表达式与旧条件](/zh/reference/wow/filters#api-FilterCapable)                               |
| `FilterExpression`                     | [过滤表达式与旧条件](/zh/reference/wow/filters#api-FilterExpression)                            |
| `FilterListQuery`                      | [投影、排序与分页](/zh/reference/wow/query-options#api-FilterListQuery)                         |
| `FilterLiteral`                        | [过滤表达式与旧条件](/zh/reference/wow/filters#api-FilterLiteral)                               |
| `FilterOperator`                       | [过滤表达式与旧条件](/zh/reference/wow/filters#api-FilterOperator)                              |
| `FilterPagedQuery`                     | [投影、排序与分页](/zh/reference/wow/query-options#api-FilterPagedQuery)                        |
| `FilterQueryable`                      | [投影、排序与分页](/zh/reference/wow/query-options#api-FilterQueryable)                         |
| `FilterSingleQuery`                    | [投影、排序与分页](/zh/reference/wow/query-options#api-FilterSingleQuery)                       |
| `FirstEventTimeCapable`                | [共享领域类型与工具](/zh/reference/wow/shared-types#api-FirstEventTimeCapable)                  |
| `FirstOperatorCapable`                 | [共享领域类型与工具](/zh/reference/wow/shared-types#api-FirstOperatorCapable)                   |
| `FunctionInfo`                         | [共享领域类型与工具](/zh/reference/wow/shared-types#api-FunctionInfo)                           |
| `FunctionInfoCapable`                  | [共享领域类型与工具](/zh/reference/wow/shared-types#api-FunctionInfoCapable)                    |
| `FunctionKind`                         | [共享领域类型与工具](/zh/reference/wow/shared-types#api-FunctionKind)                           |
| `HistogramAggregationGroup`            | [聚合构造器](/zh/reference/wow/aggregations#api-HistogramAggregationGroup)                      |
| `HistogramAggregationOptions`          | [聚合构造器](/zh/reference/wow/aggregations#api-HistogramAggregationOptions)                    |
| `Identifier`                           | [共享领域类型与工具](/zh/reference/wow/shared-types#api-Identifier)                             |
| `LOGICAL_OPERATORS`                    | [过滤表达式与旧条件](/zh/reference/wow/filters#api-LOGICAL_OPERATORS)                           |
| `ListQuery`                            | [投影、排序与分页](/zh/reference/wow/query-options#api-ListQuery)                               |
| `ListQueryRequest`                     | [投影、排序与分页](/zh/reference/wow/query-options#api-ListQueryRequest)                        |
| `LoadOwnerStateAggregateClient`        | [事件与历史状态](/zh/reference/wow/events-and-history#api-LoadOwnerStateAggregateClient)        |
| `LoadOwnerStateAggregateEndpointPaths` | [事件与历史状态](/zh/reference/wow/events-and-history#api-LoadOwnerStateAggregateEndpointPaths) |
| `LoadStateAggregateClient`             | [事件与历史状态](/zh/reference/wow/events-and-history#api-LoadStateAggregateClient)             |
| `LoadStateAggregateEndpointPaths`      | [事件与历史状态](/zh/reference/wow/events-and-history#api-LoadStateAggregateEndpointPaths)      |
| `LogicalField`                         | [过滤表达式与旧条件](/zh/reference/wow/filters#api-LogicalField)                                |
| `LogicalFilter`                        | [过滤表达式与旧条件](/zh/reference/wow/filters#api-LogicalFilter)                               |
| `MAX_CURSOR_SIZE`                      | [游标查询](/zh/reference/wow/cursor-queries#api-MAX_CURSOR_SIZE)                                |
| `MAX_CURSOR_SORT_FIELDS`               | [游标查询](/zh/reference/wow/cursor-queries#api-MAX_CURSOR_SORT_FIELDS)                         |
| `MatchFilter`                          | [过滤表达式与旧条件](/zh/reference/wow/filters#api-MatchFilter)                                 |
| `MaterializedSnapshot`                 | [快照查询](/zh/reference/wow/snapshot-queries#api-MaterializedSnapshot)                         |
| `MediumMaterializedSnapshot`           | [快照查询](/zh/reference/wow/snapshot-queries#api-MediumMaterializedSnapshot)                   |
| `MessageHeaderSqlType`                 | [共享领域类型与工具](/zh/reference/wow/shared-types#api-MessageHeaderSqlType)                   |
| `MetadataFilter`                       | [过滤表达式与旧条件](/zh/reference/wow/filters#api-MetadataFilter)                              |
| `MetadataValueFilter`                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-MetadataValueFilter)                         |
| `MetadataValuesFilter`                 | [过滤表达式与旧条件](/zh/reference/wow/filters#api-MetadataValuesFilter)                        |
| `Named`                                | [共享领域类型与工具](/zh/reference/wow/shared-types#api-Named)                                  |
| `NamedAggregate`                       | [共享领域类型与工具](/zh/reference/wow/shared-types#api-NamedAggregate)                         |
| `NamedBoundedContext`                  | [共享领域类型与工具](/zh/reference/wow/shared-types#api-NamedBoundedContext)                    |
| `NullableAggregateVersionCapable`      | [命令与等待结果](/zh/reference/wow/commands#api-NullableAggregateVersionCapable)                |
| `NumericAggregationMetric`             | [聚合构造器](/zh/reference/wow/aggregations#api-NumericAggregationMetric)                       |
| `Operator`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-Operator)                                    |
| `OperatorCapable`                      | [共享领域类型与工具](/zh/reference/wow/shared-types#api-OperatorCapable)                        |
| `OperatorLocale`                       | [过滤表达式与旧条件](/zh/reference/wow/filters#api-OperatorLocale)                              |
| `OwnerId`                              | [共享领域类型与工具](/zh/reference/wow/shared-types#api-OwnerId)                                |
| `PagedList`                            | [投影、排序与分页](/zh/reference/wow/query-options#api-PagedList)                               |
| `PagedQuery`                           | [投影、排序与分页](/zh/reference/wow/query-options#api-PagedQuery)                              |
| `PagedQueryRequest`                    | [投影、排序与分页](/zh/reference/wow/query-options#api-PagedQueryRequest)                       |
| `Pagination`                           | [投影、排序与分页](/zh/reference/wow/query-options#api-Pagination)                              |
| `Projection`                           | [投影、排序与分页](/zh/reference/wow/query-options#api-Projection)                              |
| `ProjectionCapable`                    | [投影、排序与分页](/zh/reference/wow/query-options#api-ProjectionCapable)                       |
| `QueryApi`                             | [快照查询](/zh/reference/wow/snapshot-queries#api-QueryApi)                                     |
| `QueryClientFactory`                   | [客户端配置与元数据](/zh/reference/wow/configuration#api-QueryClientFactory)                    |
| `QueryClientOptions`                   | [客户端配置与元数据](/zh/reference/wow/configuration#api-QueryClientOptions)                    |
| `QueryField`                           | [过滤表达式与旧条件](/zh/reference/wow/filters#api-QueryField)                                  |
| `Queryable`                            | [投影、排序与分页](/zh/reference/wow/query-options#api-Queryable)                               |
| `ReadableDomainEventStream`            | [事件与历史状态](/zh/reference/wow/events-and-history#api-ReadableDomainEventStream)            |
| `RecoverAggregate`                     | [命令与等待结果](/zh/reference/wow/commands#api-RecoverAggregate)                               |
| `RecoverAggregateCommand`              | [命令与等待结果](/zh/reference/wow/commands#api-RecoverAggregateCommand)                        |
| `RecoverableType`                      | [共享领域类型与工具](/zh/reference/wow/shared-types#api-RecoverableType)                        |
| `RelativeTimeFilterOptions`            | [过滤表达式与旧条件](/zh/reference/wow/filters#api-RelativeTimeFilterOptions)                   |
| `RequestId`                            | [命令与等待结果](/zh/reference/wow/commands#api-RequestId)                                      |
| `ResourceAttributionPathSpec`          | [共享领域类型与工具](/zh/reference/wow/shared-types#api-ResourceAttributionPathSpec)            |
| `ScopesCapable`                        | [客户端配置与元数据](/zh/reference/wow/configuration#api-ScopesCapable)                         |
| `SearchFilter`                         | [过滤表达式与旧条件](/zh/reference/wow/filters#api-SearchFilter)                                |
| `SearchFilterOptions`                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-SearchFilterOptions)                         |
| `SearchMode`                           | [过滤表达式与旧条件](/zh/reference/wow/filters#api-SearchMode)                                  |
| `SignalTimeCapable`                    | [命令与等待结果](/zh/reference/wow/commands#api-SignalTimeCapable)                              |
| `SingleQuery`                          | [投影、排序与分页](/zh/reference/wow/query-options#api-SingleQuery)                             |
| `SingleQueryRequest`                   | [投影、排序与分页](/zh/reference/wow/query-options#api-SingleQueryRequest)                      |
| `SmallMaterializedSnapshot`            | [快照查询](/zh/reference/wow/snapshot-queries#api-SmallMaterializedSnapshot)                    |
| `SnapshotMetadataFields`               | [快照查询](/zh/reference/wow/snapshot-queries#api-SnapshotMetadataFields)                       |
| `SnapshotQueryApi`                     | [快照查询](/zh/reference/wow/snapshot-queries#api-SnapshotQueryApi)                             |
| `SnapshotQueryClient`                  | [快照查询](/zh/reference/wow/snapshot-queries#api-SnapshotQueryClient)                          |
| `SnapshotQueryEndpointPaths`           | [快照查询](/zh/reference/wow/snapshot-queries#api-SnapshotQueryEndpointPaths)                   |
| `SnapshotTimeCapable`                  | [共享领域类型与工具](/zh/reference/wow/shared-types#api-SnapshotTimeCapable)                    |
| `SortCapable`                          | [投影、排序与分页](/zh/reference/wow/query-options#api-SortCapable)                             |
| `SortDirection`                        | [投影、排序与分页](/zh/reference/wow/query-options#api-SortDirection)                           |
| `SpaceIdCapable`                       | [共享领域类型与工具](/zh/reference/wow/shared-types#api-SpaceIdCapable)                         |
| `StateCapable`                         | [共享领域类型与工具](/zh/reference/wow/shared-types#api-StateCapable)                           |
| `StateEvent`                           | [事件与历史状态](/zh/reference/wow/events-and-history#api-StateEvent)                           |
| `StringComparison`                     | [过滤表达式与旧条件](/zh/reference/wow/filters#api-StringComparison)                            |
| `StringFilter`                         | [过滤表达式与旧条件](/zh/reference/wow/filters#api-StringFilter)                                |
| `TenantId`                             | [共享领域类型与工具](/zh/reference/wow/shared-types#api-TenantId)                               |
| `TermsAggregationGroup`                | [聚合构造器](/zh/reference/wow/aggregations#api-TermsAggregationGroup)                          |
| `TimeUnit`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-TimeUnit)                                    |
| `UrlPathParams`                        | [共享领域类型与工具](/zh/reference/wow/shared-types#api-UrlPathParams)                          |
| `Version`                              | [共享领域类型与工具](/zh/reference/wow/shared-types#api-Version)                                |
| `WILDCARD_ABAC_TAG_VALUES`             | [共享领域类型与工具](/zh/reference/wow/shared-types#api-WILDCARD_ABAC_TAG_VALUES)               |
| `WaitCommandIdCapable`                 | [命令与等待结果](/zh/reference/wow/commands#api-WaitCommandIdCapable)                           |
| `WaitSignal`                           | [命令与等待结果](/zh/reference/wow/commands#api-WaitSignal)                                     |
| `WowMetadata`                          | [客户端配置与元数据](/zh/reference/wow/configuration#api-WowMetadata)                           |
| `active`                               | [过滤表达式与旧条件](/zh/reference/wow/filters#api-active)                                      |
| `aggregateId`                          | [过滤表达式与旧条件](/zh/reference/wow/filters#api-aggregateId)                                 |
| `aggregateIds`                         | [过滤表达式与旧条件](/zh/reference/wow/filters#api-aggregateIds)                                |
| `aggregation`                          | [聚合构造器](/zh/reference/wow/aggregations#api-aggregation)                                    |
| `all`                                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-all)                                         |
| `allIn`                                | [过滤表达式与旧条件](/zh/reference/wow/filters#api-allIn)                                       |
| `and`                                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-and)                                         |
| `asc`                                  | [投影、排序与分页](/zh/reference/wow/query-options#api-asc)                                     |
| `beforeToday`                          | [过滤表达式与旧条件](/zh/reference/wow/filters#api-beforeToday)                                 |
| `between`                              | [过滤表达式与旧条件](/zh/reference/wow/filters#api-between)                                     |
| `contains`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-contains)                                    |
| `createQueryApiMetadata`               | [客户端配置与元数据](/zh/reference/wow/configuration#api-createQueryApiMetadata)                |
| `cursorQuery`                          | [游标查询](/zh/reference/wow/cursor-queries#api-cursorQuery)                                    |
| `dateOptions`                          | [过滤表达式与旧条件](/zh/reference/wow/filters#api-dateOptions)                                 |
| `defaultProjection`                    | [投影、排序与分页](/zh/reference/wow/query-options#api-defaultProjection)                       |
| `deleted`                              | [过滤表达式与旧条件](/zh/reference/wow/filters#api-deleted)                                     |
| `desc`                                 | [投影、排序与分页](/zh/reference/wow/query-options#api-desc)                                    |
| `earlierDays`                          | [过滤表达式与旧条件](/zh/reference/wow/filters#api-earlierDays)                                 |
| `elemMatch`                            | [过滤表达式与旧条件](/zh/reference/wow/filters#api-elemMatch)                                   |
| `endsWith`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-endsWith)                                    |
| `eq`                                   | [过滤表达式与旧条件](/zh/reference/wow/filters#api-eq)                                          |
| `exists`                               | [过滤表达式与旧条件](/zh/reference/wow/filters#api-exists)                                      |
| `filter`                               | [过滤表达式与旧条件](/zh/reference/wow/filters#api-filter)                                      |
| `getPropertyValue`                     | [共享领域类型与工具](/zh/reference/wow/shared-types#api-getPropertyValue)                       |
| `gt`                                   | [过滤表达式与旧条件](/zh/reference/wow/filters#api-gt)                                          |
| `gte`                                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-gte)                                         |
| `id`                                   | [过滤表达式与旧条件](/zh/reference/wow/filters#api-id)                                          |
| `ids`                                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ids)                                         |
| `ignoreCaseOptions`                    | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ignoreCaseOptions)                           |
| `isFalse`                              | [过滤表达式与旧条件](/zh/reference/wow/filters#api-isFalse)                                     |
| `isIn`                                 | [过滤表达式与旧条件](/zh/reference/wow/filters#api-isIn)                                        |
| `isNull`                               | [过滤表达式与旧条件](/zh/reference/wow/filters#api-isNull)                                      |
| `isTrue`                               | [过滤表达式与旧条件](/zh/reference/wow/filters#api-isTrue)                                      |
| `isValidateCondition`                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-isValidateCondition)                         |
| `lastMonth`                            | [过滤表达式与旧条件](/zh/reference/wow/filters#api-lastMonth)                                   |
| `lastWeek`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-lastWeek)                                    |
| `listQuery`                            | [投影、排序与分页](/zh/reference/wow/query-options#api-listQuery)                               |
| `lt`                                   | [过滤表达式与旧条件](/zh/reference/wow/filters#api-lt)                                          |
| `lte`                                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-lte)                                         |
| `match`                                | [过滤表达式与旧条件](/zh/reference/wow/filters#api-match)                                       |
| `ne`                                   | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ne)                                          |
| `nextWeek`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-nextWeek)                                    |
| `nor`                                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-nor)                                         |
| `notIn`                                | [过滤表达式与旧条件](/zh/reference/wow/filters#api-notIn)                                       |
| `notNull`                              | [过滤表达式与旧条件](/zh/reference/wow/filters#api-notNull)                                     |
| `or`                                   | [过滤表达式与旧条件](/zh/reference/wow/filters#api-or)                                          |
| `ownerId`                              | [过滤表达式与旧条件](/zh/reference/wow/filters#api-ownerId)                                     |
| `pagedList`                            | [投影、排序与分页](/zh/reference/wow/query-options#api-pagedList)                               |
| `pagedQuery`                           | [投影、排序与分页](/zh/reference/wow/query-options#api-pagedQuery)                              |
| `pagination`                           | [投影、排序与分页](/zh/reference/wow/query-options#api-pagination)                              |
| `projection`                           | [投影、排序与分页](/zh/reference/wow/query-options#api-projection)                              |
| `raw`                                  | [过滤表达式与旧条件](/zh/reference/wow/filters#api-raw)                                         |
| `recentDays`                           | [过滤表达式与旧条件](/zh/reference/wow/filters#api-recentDays)                                  |
| `singleQuery`                          | [投影、排序与分页](/zh/reference/wow/query-options#api-singleQuery)                             |
| `spaceId`                              | [过滤表达式与旧条件](/zh/reference/wow/filters#api-spaceId)                                     |
| `startsWith`                           | [过滤表达式与旧条件](/zh/reference/wow/filters#api-startsWith)                                  |
| `tenantId`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-tenantId)                                    |
| `thisMonth`                            | [过滤表达式与旧条件](/zh/reference/wow/filters#api-thisMonth)                                   |
| `thisWeek`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-thisWeek)                                    |
| `today`                                | [过滤表达式与旧条件](/zh/reference/wow/filters#api-today)                                       |
| `tomorrow`                             | [过滤表达式与旧条件](/zh/reference/wow/filters#api-tomorrow)                                    |

## 旧章节链接

旧版参考链接仍可定位到下列专题。

| 旧章节 | 新专题 |
| --- | --- |
| <span id="选择-client"></span>选择 Client | [阅读对应专题](/zh/reference/wow/index.md) |
| <span id="共享配置"></span>共享配置 | [阅读对应专题](/zh/reference/wow/configuration.md) |
| <span id="命令"></span>命令 | [阅读对应专题](/zh/reference/wow/commands.md) |
| <span id="command-方法"></span>Command 方法 | [阅读对应专题](/zh/reference/wow/commands.md) |
| <span id="command-stage"></span>Command Stage | [阅读对应专题](/zh/reference/wow/commands.md) |
| <span id="command-header"></span>Command Header | [阅读对应专题](/zh/reference/wow/commands.md) |
| <span id="snapshot-query"></span>Snapshot Query | [阅读对应专题](/zh/reference/wow/query-options.md) |
| <span id="id-helper"></span>ID Helper | [阅读对应专题](/zh/reference/wow/snapshot-queries.md) |
| <span id="query-builder-与默认值"></span>Query Builder 与默认值 | [阅读对应专题](/zh/reference/wow/query-options.md) |
| <span id="cursor-遍历"></span>Cursor 遍历 | [阅读对应专题](/zh/reference/wow/cursor-queries.md) |
| <span id="filterexpression"></span>FilterExpression | [阅读对应专题](/zh/reference/wow/filters.md) |
| <span id="aggregation"></span>Aggregation | [阅读对应专题](/zh/reference/wow/aggregations.md) |
| <span id="扁平聚合"></span>扁平聚合 | [阅读对应专题](/zh/reference/wow/aggregations.md) |
| <span id="嵌套-element-聚合"></span>嵌套 Element 聚合 | [阅读对应专题](/zh/reference/wow/aggregations.md) |
| <span id="aggregation-builder"></span>Aggregation Builder | [阅读对应专题](/zh/reference/wow/aggregations.md) |
| <span id="domain-event-query"></span>Domain Event Query | [阅读对应专题](/zh/reference/wow/events-and-history.md) |
| <span id="历史状态加载"></span>历史状态加载 | [阅读对应专题](/zh/reference/wow/events-and-history.md) |
| <span id="返回结构"></span>返回结构 | [阅读对应专题](/zh/reference/wow/shared-types.md) |
| <span id="故障定位"></span>故障定位 | [阅读对应专题](/zh/reference/wow/index.md) |
| <span id="源码参考"></span>源码参考 | [阅读对应专题](/zh/reference/wow/index.md) |
