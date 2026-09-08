---
title: 'Wow Reference'
description: '@ahoo-wang/fetcher-wow 5.0.0 API reference'
---

# Wow

Typed Wow command and query clients, filter/cursor/aggregation builders and domain wire models. The package declares Node &gt;=18.20.8 and relies on Fetcher/decorator/eventstream peers. Builders run locally; client examples require your Wow endpoints.

## Installation

```sh
pnpm add @ahoo-wang/fetcher-wow
```

Also satisfy peerDependencies in [package.json](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/package.json#L1); this reference targets 5.0.0.

## Minimal example

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

## Topics

- [Client configuration and metadata](/reference/wow/configuration)
- [Commands and wait results](/reference/wow/commands)
- [Snapshot queries](/reference/wow/snapshot-queries)
- [Filter expressions and legacy conditions](/reference/wow/filters)
- [Projection, sorting and pagination](/reference/wow/query-options)
- [Cursor queries](/reference/wow/cursor-queries)
- [Aggregation builders](/reference/wow/aggregations)
- [Events and historical state](/reference/wow/events-and-history)
- [Shared domain types and utilities](/reference/wow/shared-types)

## Public symbol index {#public-symbols}

| Symbol                                 | Topic                                                                                        |
| -------------------------------------- | -------------------------------------------------------------------------------------------- |
| `AbacTagKey`                           | [Shared domain types and utilities](/reference/wow/shared-types#api-AbacTagKey)                           |
| `AbacTagValue`                         | [Shared domain types and utilities](/reference/wow/shared-types#api-AbacTagValue)                         |
| `AbacTaggable`                         | [Shared domain types and utilities](/reference/wow/shared-types#api-AbacTaggable)                         |
| `AbacTags`                             | [Shared domain types and utilities](/reference/wow/shared-types#api-AbacTags)                             |
| `AbacTagsApplied`                      | [Shared domain types and utilities](/reference/wow/shared-types#api-AbacTagsApplied)                      |
| `Aggregate`                            | [Client configuration and metadata](/reference/wow/configuration#api-Aggregate)                           |
| `AggregateId`                          | [Shared domain types and utilities](/reference/wow/shared-types#api-AggregateId)                          |
| `AggregateIdCapable`                   | [Shared domain types and utilities](/reference/wow/shared-types#api-AggregateIdCapable)                   |
| `AggregateNameCapable`                 | [Shared domain types and utilities](/reference/wow/shared-types#api-AggregateNameCapable)                 |
| `AggregationDateUnit`                  | [Aggregation builders](/reference/wow/aggregations#api-AggregationDateUnit)                               |
| `AggregationElement`                   | [Aggregation builders](/reference/wow/aggregations#api-AggregationElement)                                |
| `AggregationExpression`                | [Aggregation builders](/reference/wow/aggregations#api-AggregationExpression)                             |
| `AggregationExpressionOperator`        | [Aggregation builders](/reference/wow/aggregations#api-AggregationExpressionOperator)                     |
| `AggregationExpressionType`            | [Aggregation builders](/reference/wow/aggregations#api-AggregationExpressionType)                         |
| `AggregationFunction`                  | [Aggregation builders](/reference/wow/aggregations#api-AggregationFunction)                               |
| `AggregationGroup`                     | [Aggregation builders](/reference/wow/aggregations#api-AggregationGroup)                                  |
| `AggregationGroupType`                 | [Aggregation builders](/reference/wow/aggregations#api-AggregationGroupType)                              |
| `AggregationMetric`                    | [Aggregation builders](/reference/wow/aggregations#api-AggregationMetric)                                 |
| `AggregationMetricType`                | [Aggregation builders](/reference/wow/aggregations#api-AggregationMetricType)                             |
| `AggregationQuery`                     | [Aggregation builders](/reference/wow/aggregations#api-AggregationQuery)                                  |
| `AliasAggregate`                       | [Shared domain types and utilities](/reference/wow/shared-types#api-AliasAggregate)                       |
| `AliasBoundedContext`                  | [Shared domain types and utilities](/reference/wow/shared-types#api-AliasBoundedContext)                  |
| `AnyAggregationMetric`                 | [Aggregation builders](/reference/wow/aggregations#api-AnyAggregationMetric)                              |
| `ApplyAbacTags`                        | [Shared domain types and utilities](/reference/wow/shared-types#api-ApplyAbacTags)                        |
| `ApplyResourceTags`                    | [Commands and wait results](/reference/wow/commands#api-ApplyResourceTags)                                |
| `ApplyResourceTagsCommand`             | [Commands and wait results](/reference/wow/commands#api-ApplyResourceTagsCommand)                         |
| `BatchResult`                          | [Commands and wait results](/reference/wow/commands#api-BatchResult)                                      |
| `BeforeTodayFilter`                    | [Filter expressions and legacy conditions](/reference/wow/filters#api-BeforeTodayFilter)                  |
| `BetweenFilter`                        | [Filter expressions and legacy conditions](/reference/wow/filters#api-BetweenFilter)                      |
| `BinaryAggregationExpression`          | [Aggregation builders](/reference/wow/aggregations#api-BinaryAggregationExpression)                       |
| `BindingError`                         | [Shared domain types and utilities](/reference/wow/shared-types#api-BindingError)                         |
| `BodyCapable`                          | [Shared domain types and utilities](/reference/wow/shared-types#api-BodyCapable)                          |
| `BoundedContext`                       | [Client configuration and metadata](/reference/wow/configuration#api-BoundedContext)                      |
| `CalendarFilter`                       | [Filter expressions and legacy conditions](/reference/wow/filters#api-CalendarFilter)                     |
| `CollectionFilter`                     | [Filter expressions and legacy conditions](/reference/wow/filters#api-CollectionFilter)                   |
| `CommandBody`                          | [Commands and wait results](/reference/wow/commands#api-CommandBody)                                      |
| `CommandClient`                        | [Commands and wait results](/reference/wow/commands#api-CommandClient)                                    |
| `CommandHeaders`                       | [Commands and wait results](/reference/wow/commands#api-CommandHeaders)                                   |
| `CommandId`                            | [Commands and wait results](/reference/wow/commands#api-CommandId)                                        |
| `CommandRequest`                       | [Commands and wait results](/reference/wow/commands#api-CommandRequest)                                   |
| `CommandRequestHeaders`                | [Commands and wait results](/reference/wow/commands#api-CommandRequestHeaders)                            |
| `CommandResult`                        | [Commands and wait results](/reference/wow/commands#api-CommandResult)                                    |
| `CommandResultArray`                   | [Commands and wait results](/reference/wow/commands#api-CommandResultArray)                               |
| `CommandResultCapable`                 | [Commands and wait results](/reference/wow/commands#api-CommandResultCapable)                             |
| `CommandResultEventStream`             | [Commands and wait results](/reference/wow/commands#api-CommandResultEventStream)                         |
| `CommandStage`                         | [Commands and wait results](/reference/wow/commands#api-CommandStage)                                     |
| `CommandStageCapable`                  | [Commands and wait results](/reference/wow/commands#api-CommandStageCapable)                              |
| `CommandUrlParams`                     | [Commands and wait results](/reference/wow/commands#api-CommandUrlParams)                                 |
| `ComparableFilterLiteral`              | [Filter expressions and legacy conditions](/reference/wow/filters#api-ComparableFilterLiteral)            |
| `ComparisonFilter`                     | [Filter expressions and legacy conditions](/reference/wow/filters#api-ComparisonFilter)                   |
| `CompensationTarget`                   | [Commands and wait results](/reference/wow/commands#api-CompensationTarget)                               |
| `Condition`                            | [Filter expressions and legacy conditions](/reference/wow/filters#api-Condition)                          |
| `ConditionCapable`                     | [Filter expressions and legacy conditions](/reference/wow/filters#api-ConditionCapable)                   |
| `ConditionOptionKey`                   | [Filter expressions and legacy conditions](/reference/wow/filters#api-ConditionOptionKey)                 |
| `ConditionOptions`                     | [Filter expressions and legacy conditions](/reference/wow/filters#api-ConditionOptions)                   |
| `ConstantAggregationExpression`        | [Aggregation builders](/reference/wow/aggregations#api-ConstantAggregationExpression)                     |
| `CountAggregationMetric`               | [Aggregation builders](/reference/wow/aggregations#api-CountAggregationMetric)                            |
| `CreateTimeCapable`                    | [Shared domain types and utilities](/reference/wow/shared-types#api-CreateTimeCapable)                    |
| `CursorPage`                           | [Cursor queries](/reference/wow/cursor-queries#api-CursorPage)                                            |
| `CursorQuery`                          | [Cursor queries](/reference/wow/cursor-queries#api-CursorQuery)                                           |
| `DEFAULT_CURSOR_SIZE`                  | [Cursor queries](/reference/wow/cursor-queries#api-DEFAULT_CURSOR_SIZE)                                   |
| `DEFAULT_OWNER_ID`                     | [Shared domain types and utilities](/reference/wow/shared-types#api-DEFAULT_OWNER_ID)                     |
| `DEFAULT_PAGINATION`                   | [Projection, sorting and pagination](/reference/wow/query-options#api-DEFAULT_PAGINATION)                 |
| `DEFAULT_PROJECTION`                   | [Projection, sorting and pagination](/reference/wow/query-options#api-DEFAULT_PROJECTION)                 |
| `DateHistogramAggregationGroup`        | [Aggregation builders](/reference/wow/aggregations#api-DateHistogramAggregationGroup)                     |
| `DateHistogramAggregationOptions`      | [Aggregation builders](/reference/wow/aggregations#api-DateHistogramAggregationOptions)                   |
| `DaysFilter`                           | [Filter expressions and legacy conditions](/reference/wow/filters#api-DaysFilter)                         |
| `DeleteAggregate`                      | [Commands and wait results](/reference/wow/commands#api-DeleteAggregate)                                  |
| `DeleteAggregateCommand`               | [Commands and wait results](/reference/wow/commands#api-DeleteAggregateCommand)                           |
| `DeletedCapable`                       | [Shared domain types and utilities](/reference/wow/shared-types#api-DeletedCapable)                       |
| `DeletionFilter`                       | [Filter expressions and legacy conditions](/reference/wow/filters#api-DeletionFilter)                     |
| `DeletionState`                        | [Filter expressions and legacy conditions](/reference/wow/filters#api-DeletionState)                      |
| `DescriptionCapable`                   | [Shared domain types and utilities](/reference/wow/shared-types#api-DescriptionCapable)                   |
| `DomainEvent`                          | [Events and historical state](/reference/wow/events-and-history#api-DomainEvent)                          |
| `DomainEventStream`                    | [Events and historical state](/reference/wow/events-and-history#api-DomainEventStream)                    |
| `DomainEventStreamHeader`              | [Events and historical state](/reference/wow/events-and-history#api-DomainEventStreamHeader)              |
| `DomainEventStreamMetadataFields`      | [Events and historical state](/reference/wow/events-and-history#api-DomainEventStreamMetadataFields)      |
| `DynamicDocument`                      | [Shared domain types and utilities](/reference/wow/shared-types#api-DynamicDocument)                      |
| `DynamicDocumentArray`                 | [Shared domain types and utilities](/reference/wow/shared-types#api-DynamicDocumentArray)                 |
| `EMPTY_ABAC_TAGS`                      | [Shared domain types and utilities](/reference/wow/shared-types#api-EMPTY_ABAC_TAGS)                      |
| `EMPTY_PAGED_LIST`                     | [Projection, sorting and pagination](/reference/wow/query-options#api-EMPTY_PAGED_LIST)                   |
| `EMPTY_VALUE_OPERATORS`                | [Filter expressions and legacy conditions](/reference/wow/filters#api-EMPTY_VALUE_OPERATORS)              |
| `ElementFilterExpression`              | [Filter expressions and legacy conditions](/reference/wow/filters#api-ElementFilterExpression)            |
| `ElementLogicalFilter`                 | [Filter expressions and legacy conditions](/reference/wow/filters#api-ElementLogicalFilter)               |
| `ElementMatchFilter`                   | [Filter expressions and legacy conditions](/reference/wow/filters#api-ElementMatchFilter)                 |
| `EqualityFilter`                       | [Filter expressions and legacy conditions](/reference/wow/filters#api-EqualityFilter)                     |
| `EqualityFilterValue`                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-EqualityFilterValue)                |
| `ErrorCodes`                           | [Shared domain types and utilities](/reference/wow/shared-types#api-ErrorCodes)                           |
| `ErrorInfo`                            | [Shared domain types and utilities](/reference/wow/shared-types#api-ErrorInfo)                            |
| `EventIdCapable`                       | [Shared domain types and utilities](/reference/wow/shared-types#api-EventIdCapable)                       |
| `EventStreamQueryApi`                  | [Events and historical state](/reference/wow/events-and-history#api-EventStreamQueryApi)                  |
| `EventStreamQueryClient`               | [Events and historical state](/reference/wow/events-and-history#api-EventStreamQueryClient)               |
| `EventStreamQueryEndpointPaths`        | [Events and historical state](/reference/wow/events-and-history#api-EventStreamQueryEndpointPaths)        |
| `EventTimeCapable`                     | [Shared domain types and utilities](/reference/wow/shared-types#api-EventTimeCapable)                     |
| `FieldAggregationExpression`           | [Aggregation builders](/reference/wow/aggregations#api-FieldAggregationExpression)                        |
| `FieldPresenceFilter`                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-FieldPresenceFilter)                |
| `FieldSort`                            | [Projection, sorting and pagination](/reference/wow/query-options#api-FieldSort)                          |
| `FilterCapable`                        | [Filter expressions and legacy conditions](/reference/wow/filters#api-FilterCapable)                      |
| `FilterExpression`                     | [Filter expressions and legacy conditions](/reference/wow/filters#api-FilterExpression)                   |
| `FilterListQuery`                      | [Projection, sorting and pagination](/reference/wow/query-options#api-FilterListQuery)                    |
| `FilterLiteral`                        | [Filter expressions and legacy conditions](/reference/wow/filters#api-FilterLiteral)                      |
| `FilterOperator`                       | [Filter expressions and legacy conditions](/reference/wow/filters#api-FilterOperator)                     |
| `FilterPagedQuery`                     | [Projection, sorting and pagination](/reference/wow/query-options#api-FilterPagedQuery)                   |
| `FilterQueryable`                      | [Projection, sorting and pagination](/reference/wow/query-options#api-FilterQueryable)                    |
| `FilterSingleQuery`                    | [Projection, sorting and pagination](/reference/wow/query-options#api-FilterSingleQuery)                  |
| `FirstEventTimeCapable`                | [Shared domain types and utilities](/reference/wow/shared-types#api-FirstEventTimeCapable)                |
| `FirstOperatorCapable`                 | [Shared domain types and utilities](/reference/wow/shared-types#api-FirstOperatorCapable)                 |
| `FunctionInfo`                         | [Shared domain types and utilities](/reference/wow/shared-types#api-FunctionInfo)                         |
| `FunctionInfoCapable`                  | [Shared domain types and utilities](/reference/wow/shared-types#api-FunctionInfoCapable)                  |
| `FunctionKind`                         | [Shared domain types and utilities](/reference/wow/shared-types#api-FunctionKind)                         |
| `HistogramAggregationGroup`            | [Aggregation builders](/reference/wow/aggregations#api-HistogramAggregationGroup)                         |
| `HistogramAggregationOptions`          | [Aggregation builders](/reference/wow/aggregations#api-HistogramAggregationOptions)                       |
| `Identifier`                           | [Shared domain types and utilities](/reference/wow/shared-types#api-Identifier)                           |
| `LOGICAL_OPERATORS`                    | [Filter expressions and legacy conditions](/reference/wow/filters#api-LOGICAL_OPERATORS)                  |
| `ListQuery`                            | [Projection, sorting and pagination](/reference/wow/query-options#api-ListQuery)                          |
| `ListQueryRequest`                     | [Projection, sorting and pagination](/reference/wow/query-options#api-ListQueryRequest)                   |
| `LoadOwnerStateAggregateClient`        | [Events and historical state](/reference/wow/events-and-history#api-LoadOwnerStateAggregateClient)        |
| `LoadOwnerStateAggregateEndpointPaths` | [Events and historical state](/reference/wow/events-and-history#api-LoadOwnerStateAggregateEndpointPaths) |
| `LoadStateAggregateClient`             | [Events and historical state](/reference/wow/events-and-history#api-LoadStateAggregateClient)             |
| `LoadStateAggregateEndpointPaths`      | [Events and historical state](/reference/wow/events-and-history#api-LoadStateAggregateEndpointPaths)      |
| `LogicalField`                         | [Filter expressions and legacy conditions](/reference/wow/filters#api-LogicalField)                       |
| `LogicalFilter`                        | [Filter expressions and legacy conditions](/reference/wow/filters#api-LogicalFilter)                      |
| `MAX_CURSOR_SIZE`                      | [Cursor queries](/reference/wow/cursor-queries#api-MAX_CURSOR_SIZE)                                       |
| `MAX_CURSOR_SORT_FIELDS`               | [Cursor queries](/reference/wow/cursor-queries#api-MAX_CURSOR_SORT_FIELDS)                                |
| `MatchFilter`                          | [Filter expressions and legacy conditions](/reference/wow/filters#api-MatchFilter)                        |
| `MaterializedSnapshot`                 | [Snapshot queries](/reference/wow/snapshot-queries#api-MaterializedSnapshot)                              |
| `MediumMaterializedSnapshot`           | [Snapshot queries](/reference/wow/snapshot-queries#api-MediumMaterializedSnapshot)                        |
| `MessageHeaderSqlType`                 | [Shared domain types and utilities](/reference/wow/shared-types#api-MessageHeaderSqlType)                 |
| `MetadataFilter`                       | [Filter expressions and legacy conditions](/reference/wow/filters#api-MetadataFilter)                     |
| `MetadataValueFilter`                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-MetadataValueFilter)                |
| `MetadataValuesFilter`                 | [Filter expressions and legacy conditions](/reference/wow/filters#api-MetadataValuesFilter)               |
| `Named`                                | [Shared domain types and utilities](/reference/wow/shared-types#api-Named)                                |
| `NamedAggregate`                       | [Shared domain types and utilities](/reference/wow/shared-types#api-NamedAggregate)                       |
| `NamedBoundedContext`                  | [Shared domain types and utilities](/reference/wow/shared-types#api-NamedBoundedContext)                  |
| `NullableAggregateVersionCapable`      | [Commands and wait results](/reference/wow/commands#api-NullableAggregateVersionCapable)                  |
| `NumericAggregationMetric`             | [Aggregation builders](/reference/wow/aggregations#api-NumericAggregationMetric)                          |
| `Operator`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-Operator)                           |
| `OperatorCapable`                      | [Shared domain types and utilities](/reference/wow/shared-types#api-OperatorCapable)                      |
| `OperatorLocale`                       | [Filter expressions and legacy conditions](/reference/wow/filters#api-OperatorLocale)                     |
| `OwnerId`                              | [Shared domain types and utilities](/reference/wow/shared-types#api-OwnerId)                              |
| `PagedList`                            | [Projection, sorting and pagination](/reference/wow/query-options#api-PagedList)                          |
| `PagedQuery`                           | [Projection, sorting and pagination](/reference/wow/query-options#api-PagedQuery)                         |
| `PagedQueryRequest`                    | [Projection, sorting and pagination](/reference/wow/query-options#api-PagedQueryRequest)                  |
| `Pagination`                           | [Projection, sorting and pagination](/reference/wow/query-options#api-Pagination)                         |
| `Projection`                           | [Projection, sorting and pagination](/reference/wow/query-options#api-Projection)                         |
| `ProjectionCapable`                    | [Projection, sorting and pagination](/reference/wow/query-options#api-ProjectionCapable)                  |
| `QueryApi`                             | [Snapshot queries](/reference/wow/snapshot-queries#api-QueryApi)                                          |
| `QueryClientFactory`                   | [Client configuration and metadata](/reference/wow/configuration#api-QueryClientFactory)                  |
| `QueryClientOptions`                   | [Client configuration and metadata](/reference/wow/configuration#api-QueryClientOptions)                  |
| `QueryField`                           | [Filter expressions and legacy conditions](/reference/wow/filters#api-QueryField)                         |
| `Queryable`                            | [Projection, sorting and pagination](/reference/wow/query-options#api-Queryable)                          |
| `ReadableDomainEventStream`            | [Events and historical state](/reference/wow/events-and-history#api-ReadableDomainEventStream)            |
| `RecoverAggregate`                     | [Commands and wait results](/reference/wow/commands#api-RecoverAggregate)                                 |
| `RecoverAggregateCommand`              | [Commands and wait results](/reference/wow/commands#api-RecoverAggregateCommand)                          |
| `RecoverableType`                      | [Shared domain types and utilities](/reference/wow/shared-types#api-RecoverableType)                      |
| `RelativeTimeFilterOptions`            | [Filter expressions and legacy conditions](/reference/wow/filters#api-RelativeTimeFilterOptions)          |
| `RequestId`                            | [Commands and wait results](/reference/wow/commands#api-RequestId)                                        |
| `ResourceAttributionPathSpec`          | [Shared domain types and utilities](/reference/wow/shared-types#api-ResourceAttributionPathSpec)          |
| `ScopesCapable`                        | [Client configuration and metadata](/reference/wow/configuration#api-ScopesCapable)                       |
| `SearchFilter`                         | [Filter expressions and legacy conditions](/reference/wow/filters#api-SearchFilter)                       |
| `SearchFilterOptions`                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-SearchFilterOptions)                |
| `SearchMode`                           | [Filter expressions and legacy conditions](/reference/wow/filters#api-SearchMode)                         |
| `SignalTimeCapable`                    | [Commands and wait results](/reference/wow/commands#api-SignalTimeCapable)                                |
| `SingleQuery`                          | [Projection, sorting and pagination](/reference/wow/query-options#api-SingleQuery)                        |
| `SingleQueryRequest`                   | [Projection, sorting and pagination](/reference/wow/query-options#api-SingleQueryRequest)                 |
| `SmallMaterializedSnapshot`            | [Snapshot queries](/reference/wow/snapshot-queries#api-SmallMaterializedSnapshot)                         |
| `SnapshotMetadataFields`               | [Snapshot queries](/reference/wow/snapshot-queries#api-SnapshotMetadataFields)                            |
| `SnapshotQueryApi`                     | [Snapshot queries](/reference/wow/snapshot-queries#api-SnapshotQueryApi)                                  |
| `SnapshotQueryClient`                  | [Snapshot queries](/reference/wow/snapshot-queries#api-SnapshotQueryClient)                               |
| `SnapshotQueryEndpointPaths`           | [Snapshot queries](/reference/wow/snapshot-queries#api-SnapshotQueryEndpointPaths)                        |
| `SnapshotTimeCapable`                  | [Shared domain types and utilities](/reference/wow/shared-types#api-SnapshotTimeCapable)                  |
| `SortCapable`                          | [Projection, sorting and pagination](/reference/wow/query-options#api-SortCapable)                        |
| `SortDirection`                        | [Projection, sorting and pagination](/reference/wow/query-options#api-SortDirection)                      |
| `SpaceIdCapable`                       | [Shared domain types and utilities](/reference/wow/shared-types#api-SpaceIdCapable)                       |
| `StateCapable`                         | [Shared domain types and utilities](/reference/wow/shared-types#api-StateCapable)                         |
| `StateEvent`                           | [Events and historical state](/reference/wow/events-and-history#api-StateEvent)                           |
| `StringComparison`                     | [Filter expressions and legacy conditions](/reference/wow/filters#api-StringComparison)                   |
| `StringFilter`                         | [Filter expressions and legacy conditions](/reference/wow/filters#api-StringFilter)                       |
| `TenantId`                             | [Shared domain types and utilities](/reference/wow/shared-types#api-TenantId)                             |
| `TermsAggregationGroup`                | [Aggregation builders](/reference/wow/aggregations#api-TermsAggregationGroup)                             |
| `TimeUnit`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-TimeUnit)                           |
| `UrlPathParams`                        | [Shared domain types and utilities](/reference/wow/shared-types#api-UrlPathParams)                        |
| `Version`                              | [Shared domain types and utilities](/reference/wow/shared-types#api-Version)                              |
| `WILDCARD_ABAC_TAG_VALUES`             | [Shared domain types and utilities](/reference/wow/shared-types#api-WILDCARD_ABAC_TAG_VALUES)             |
| `WaitCommandIdCapable`                 | [Commands and wait results](/reference/wow/commands#api-WaitCommandIdCapable)                             |
| `WaitSignal`                           | [Commands and wait results](/reference/wow/commands#api-WaitSignal)                                       |
| `WowMetadata`                          | [Client configuration and metadata](/reference/wow/configuration#api-WowMetadata)                         |
| `active`                               | [Filter expressions and legacy conditions](/reference/wow/filters#api-active)                             |
| `aggregateId`                          | [Filter expressions and legacy conditions](/reference/wow/filters#api-aggregateId)                        |
| `aggregateIds`                         | [Filter expressions and legacy conditions](/reference/wow/filters#api-aggregateIds)                       |
| `aggregation`                          | [Aggregation builders](/reference/wow/aggregations#api-aggregation)                                       |
| `all`                                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-all)                                |
| `allIn`                                | [Filter expressions and legacy conditions](/reference/wow/filters#api-allIn)                              |
| `and`                                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-and)                                |
| `asc`                                  | [Projection, sorting and pagination](/reference/wow/query-options#api-asc)                                |
| `beforeToday`                          | [Filter expressions and legacy conditions](/reference/wow/filters#api-beforeToday)                        |
| `between`                              | [Filter expressions and legacy conditions](/reference/wow/filters#api-between)                            |
| `contains`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-contains)                           |
| `createQueryApiMetadata`               | [Client configuration and metadata](/reference/wow/configuration#api-createQueryApiMetadata)              |
| `cursorQuery`                          | [Cursor queries](/reference/wow/cursor-queries#api-cursorQuery)                                           |
| `dateOptions`                          | [Filter expressions and legacy conditions](/reference/wow/filters#api-dateOptions)                        |
| `defaultProjection`                    | [Projection, sorting and pagination](/reference/wow/query-options#api-defaultProjection)                  |
| `deleted`                              | [Filter expressions and legacy conditions](/reference/wow/filters#api-deleted)                            |
| `desc`                                 | [Projection, sorting and pagination](/reference/wow/query-options#api-desc)                               |
| `earlierDays`                          | [Filter expressions and legacy conditions](/reference/wow/filters#api-earlierDays)                        |
| `elemMatch`                            | [Filter expressions and legacy conditions](/reference/wow/filters#api-elemMatch)                          |
| `endsWith`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-endsWith)                           |
| `eq`                                   | [Filter expressions and legacy conditions](/reference/wow/filters#api-eq)                                 |
| `exists`                               | [Filter expressions and legacy conditions](/reference/wow/filters#api-exists)                             |
| `filter`                               | [Filter expressions and legacy conditions](/reference/wow/filters#api-filter)                             |
| `getPropertyValue`                     | [Shared domain types and utilities](/reference/wow/shared-types#api-getPropertyValue)                     |
| `gt`                                   | [Filter expressions and legacy conditions](/reference/wow/filters#api-gt)                                 |
| `gte`                                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-gte)                                |
| `id`                                   | [Filter expressions and legacy conditions](/reference/wow/filters#api-id)                                 |
| `ids`                                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-ids)                                |
| `ignoreCaseOptions`                    | [Filter expressions and legacy conditions](/reference/wow/filters#api-ignoreCaseOptions)                  |
| `isFalse`                              | [Filter expressions and legacy conditions](/reference/wow/filters#api-isFalse)                            |
| `isIn`                                 | [Filter expressions and legacy conditions](/reference/wow/filters#api-isIn)                               |
| `isNull`                               | [Filter expressions and legacy conditions](/reference/wow/filters#api-isNull)                             |
| `isTrue`                               | [Filter expressions and legacy conditions](/reference/wow/filters#api-isTrue)                             |
| `isValidateCondition`                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-isValidateCondition)                |
| `lastMonth`                            | [Filter expressions and legacy conditions](/reference/wow/filters#api-lastMonth)                          |
| `lastWeek`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-lastWeek)                           |
| `listQuery`                            | [Projection, sorting and pagination](/reference/wow/query-options#api-listQuery)                          |
| `lt`                                   | [Filter expressions and legacy conditions](/reference/wow/filters#api-lt)                                 |
| `lte`                                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-lte)                                |
| `match`                                | [Filter expressions and legacy conditions](/reference/wow/filters#api-match)                              |
| `ne`                                   | [Filter expressions and legacy conditions](/reference/wow/filters#api-ne)                                 |
| `nextWeek`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-nextWeek)                           |
| `nor`                                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-nor)                                |
| `notIn`                                | [Filter expressions and legacy conditions](/reference/wow/filters#api-notIn)                              |
| `notNull`                              | [Filter expressions and legacy conditions](/reference/wow/filters#api-notNull)                            |
| `or`                                   | [Filter expressions and legacy conditions](/reference/wow/filters#api-or)                                 |
| `ownerId`                              | [Filter expressions and legacy conditions](/reference/wow/filters#api-ownerId)                            |
| `pagedList`                            | [Projection, sorting and pagination](/reference/wow/query-options#api-pagedList)                          |
| `pagedQuery`                           | [Projection, sorting and pagination](/reference/wow/query-options#api-pagedQuery)                         |
| `pagination`                           | [Projection, sorting and pagination](/reference/wow/query-options#api-pagination)                         |
| `projection`                           | [Projection, sorting and pagination](/reference/wow/query-options#api-projection)                         |
| `raw`                                  | [Filter expressions and legacy conditions](/reference/wow/filters#api-raw)                                |
| `recentDays`                           | [Filter expressions and legacy conditions](/reference/wow/filters#api-recentDays)                         |
| `singleQuery`                          | [Projection, sorting and pagination](/reference/wow/query-options#api-singleQuery)                        |
| `spaceId`                              | [Filter expressions and legacy conditions](/reference/wow/filters#api-spaceId)                            |
| `startsWith`                           | [Filter expressions and legacy conditions](/reference/wow/filters#api-startsWith)                         |
| `tenantId`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-tenantId)                           |
| `thisMonth`                            | [Filter expressions and legacy conditions](/reference/wow/filters#api-thisMonth)                          |
| `thisWeek`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-thisWeek)                           |
| `today`                                | [Filter expressions and legacy conditions](/reference/wow/filters#api-today)                              |
| `tomorrow`                             | [Filter expressions and legacy conditions](/reference/wow/filters#api-tomorrow)                           |
