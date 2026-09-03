# Fetcher Wow CQRS API Reference

## Contents

- [Core Concepts](#core-concepts)
- [Package Imports](#package-imports)
- [Constructors (All Use ApiMetadata)](#constructors-all-use-apimetadata)
- [CommandClient<C>](#commandclientc)
  - [Setup](#setup)
  - [send(commandRequest, attributes?)](#sendcommandrequest-attributes)
  - [sendAndWaitStream(commandRequest, attributes?)](#sendandwaitstreamcommandrequest-attributes)
  - [CommandStage Values](#commandstage-values)
  - [CommandHeaders Constants](#commandheaders-constants)
  - [CommandRequest<C>](#commandrequestc)
  - [CommandResult Fields](#commandresult-fields)
- [SnapshotQueryClient<S, FIELDS>](#snapshotqueryclients-fields)
  - [Setup](#setup-1)
  - [Query Methods](#query-methods)
  - [Aggregation Methods](#aggregation-methods)
  - [ID-Based Lookup Methods](#id-based-lookup-methods)
- [EventStreamQueryClient<DomainEventBody, FIELDS>](#eventstreamqueryclientdomaineventbody-fields)
  - [Setup](#setup-2)
  - [Methods](#methods)
- [LoadStateAggregateClient<S>](#loadstateaggregateclients)
- [LoadOwnerStateAggregateClient<S>](#loadownerstateaggregateclients)
- [QueryClientFactory<S, FIELDS, DomainEventBody>](#queryclientfactorys-fields-domaineventbody)
  - [Setup](#setup-3)
  - [ResourceAttributionPathSpec](#resourceattributionpathspec)
  - [Factory Methods](#factory-methods)
- [Cursor Queries](#cursor-queries)
- [Filter Expressions](#filter-expressions)
- [AggregationQuery](#aggregationquery)
- [Query DSL Conditions](#query-dsl-conditions)
  - [Comparison Operators](#comparison-operators)
  - [String Operators](#string-operators)
  - [Collection Operators](#collection-operators)
  - [Null/Boolean Operators](#nullboolean-operators)
  - [Date Operators](#date-operators)
  - [ID Operators](#id-operators)
  - [State Operators](#state-operators)
  - [Logical Operators](#logical-operators)
- [Key Types](#key-types)
  - [MaterializedSnapshot<S>](#materializedsnapshots)
  - [PagedList<T>](#pagedlistt)
  - [CommandBody<C>](#commandbodyc)
  - [Pagination](#pagination)
- [Generated Clients](#generated-clients)
- [Example: Complete Cart Flow](#example-complete-cart-flow)
- [Key Dependencies](#key-dependencies)

The `@ahoo-wang/fetcher-wow` package provides Fetcher clients and query helpers for Wow CQRS and DDD patterns.

## Core Concepts

The Wow framework implements CQRS + Event Sourcing + DDD:

- **Commands** - Write operations that modify aggregate state
- **Queries** - Read operations that retrieve snapshot or event data
- **Aggregates** - Domain entities maintaining state and enforcing invariants
- **Events** - Immutable records of state changes

## Package Imports

```typescript
import '@ahoo-wang/fetcher-eventstream'; // Optional: SSE support loads transitively with fetcher-wow
import type { JsonServerSentEvent } from '@ahoo-wang/fetcher-eventstream';
import { ContentTypeValues, HttpMethod } from '@ahoo-wang/fetcher';
import {
  // Command
  CommandClient,
  CommandHeaders,
  CommandStage,
  // Query clients
  SnapshotQueryClient,
  EventStreamQueryClient,
  QueryClientFactory,
  LoadStateAggregateClient,
  LoadOwnerStateAggregateClient,
  ResourceAttributionPathSpec,
  SortDirection,
  aggregation,
  AggregationGroupType,
  AggregationMetricType,
  AggregationExpressionType,
  AggregationExpressionOperator,
  AggregationDateUnit,
  AggregationFunction,
  DeletionState,
  FilterOperator,
  SearchMode,
  StringComparison,
  TimeUnit,
  filter,
  listQuery,
  DEFAULT_CURSOR_SIZE,
  MAX_CURSOR_SIZE,
  MAX_CURSOR_SORT_FIELDS,
  cursorQuery,
  // Sort helpers
  asc,
  desc,
  // Deprecated Condition builders (compatibility only)
  and,
  or,
  nor,
  raw,
  eq,
  ne,
  gt,
  lt,
  gte,
  lte,
  between,
  contains,
  startsWith,
  endsWith,
  match,
  isIn,
  notIn,
  allIn,
  elemMatch,
  isNull,
  notNull,
  isTrue,
  isFalse,
  exists,
  today,
  beforeToday,
  tomorrow,
  thisWeek,
  nextWeek,
  lastWeek,
  thisMonth,
  lastMonth,
  recentDays,
  earlierDays,
  active,
  all,
  deleted,
  spaceId,
  id,
  ids,
  aggregateId,
  aggregateIds,
  tenantId,
  ownerId,
  // Types
  type CommandRequest,
  type CommandResult,
  type CommandBody,
  type MaterializedSnapshot,
  type PagedList,
  type ListQuery,
  type PagedQuery,
  type SingleQuery,
  type FilterExpression,
  type QueryField,
  type ElementFilterExpression,
  type MetadataFilter,
  type EqualityFilterValue,
  type SearchFilterOptions,
  type RelativeTimeFilterOptions,
  type FilterListQuery,
  type FilterPagedQuery,
  type FilterSingleQuery,
  type CursorQuery,
  type CursorPage,
  type ListQueryRequest,
  type PagedQueryRequest,
  type SingleQueryRequest,
  type AggregationQuery,
  type AggregationElement,
  type AggregationGroup,
  type AggregationMetric,
  type HistogramAggregationOptions,
  type DateHistogramAggregationOptions,
  type DynamicDocument,
} from '@ahoo-wang/fetcher-wow';
```

---

## Constructors (All Use ApiMetadata)

All Wow clients accept `ApiMetadata` (from `@ahoo-wang/fetcher-decorator`) in their constructor. Plain objects matching the ApiMetadata shape (`{ fetcher, basePath }`) work at runtime.

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import type { ApiMetadata } from '@ahoo-wang/fetcher-decorator';

const fetcher = new Fetcher({ baseURL: 'http://localhost:8080/' });

// Constructor signature for ALL clients: constructor(apiMetadata?: ApiMetadata)
// Pass a plain object satisfying ApiMetadata shape:
const apiMetadata: ApiMetadata = {
  fetcher,
  basePath: 'owner/{ownerId}/cart',
};
```

**CommandClient**, **SnapshotQueryClient**, **EventStreamQueryClient**, **LoadStateAggregateClient**, **LoadOwnerStateAggregateClient** all share this same constructor pattern.

### Path Parameter Substitution (`{ownerId}`, `{tenantId}`)

Templates in `basePath` (and `path`) are filled from `urlParams.path` on each request. Unbound placeholders are left as-is (and log a warning); bind them per call:

```typescript
// CommandRequest.urlParams / query request urlParams
await commandClient.send({
  path: 'items',
  urlParams: { path: { ownerId: 'owner-123' } },
  body: { productId: 'p-1', quantity: 2 },
});
// → POST {baseURL}/owner/owner-123/cart/items
```

Alternatively, CoSec's resource-attribution interceptor can fill `{tenantId}`/`{ownerId}` automatically from the JWT payload — see the `fetcher-cosec-auth` skill.

### Space Attribution

For space-scoped aggregates, `CommandHeaders.SPACE_ID` (`Command-Space-Id`) attributes a command to a space, and the `spaceId(value)` condition filters queries by space. Snapshots expose `spaceId` via `MaterializedSnapshot`.

---

## CommandClient<C>

Sends commands to modify aggregate state.

### Setup

```typescript
const commandClient = new CommandClient<AddCartItem>({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});
```

### send(commandRequest, attributes?)

Sends a command and waits for a `CommandResult`. The `CommandRequest` carries the command path and request configuration.

```typescript
interface AddCartItem {
  productId: string;
  quantity: number;
}

const result: CommandResult = await commandClient.send({
  path: 'add_cart_item',
  method: HttpMethod.POST,
  headers: {
    [CommandHeaders.WAIT_STAGE]: CommandStage.SNAPSHOT,
  },
  body: {
    productId: 'product-123',
    quantity: 2,
  },
});
```

### sendAndWaitStream(commandRequest, attributes?)

Sends a command and receives results as a `Promise<CommandResultEventStream>` (a `ReadableStream<JsonServerSentEvent<CommandResult>>`).

```typescript
const stream = await commandClient.sendAndWaitStream({
  path: 'add_cart_item',
  method: HttpMethod.POST,
  headers: { Accept: ContentTypeValues.TEXT_EVENT_STREAM },
  body: { productId: 'product-123', quantity: 2 },
});

for await (const event of stream) {
  console.log('Received:', event.data); // CommandResult
}
```

### CommandStage Values

- `SENT` - Command published to command bus
- `PROCESSED` - Command processed by aggregate root
- `SNAPSHOT` - Snapshot generated
- `PROJECTED` - Events projected
- `EVENT_HANDLED` - Events processed by event handlers
- `SAGA_HANDLED` - Events processed by Saga

### CommandHeaders Constants

- `CommandHeaders.TENANT_ID` - Tenant context (`Command-Tenant-Id`)
- `CommandHeaders.OWNER_ID` - Owner context (`Command-Owner-Id`)
- `CommandHeaders.AGGREGATE_ID` - Aggregate root ID (`Command-Aggregate-Id`)
- `CommandHeaders.AGGREGATE_VERSION` - Expected version (`Command-Aggregate-Version`)
- `CommandHeaders.WAIT_STAGE` - Wait stage (`Command-Wait-Stage`)
- `CommandHeaders.WAIT_TIME_OUT` - Wait timeout (`Command-Wait-Timeout`)
- `CommandHeaders.WAIT_CONTEXT` - Wait context (`Command-Wait-Context`)
- `CommandHeaders.WAIT_PROCESSOR` - Wait processor (`Command-Wait-Processor`)
- `CommandHeaders.WAIT_FUNCTION` - Wait function (`Command-Wait-Function`)
- `CommandHeaders.REQUEST_ID` - Request ID for idempotency (`Command-Request-Id`)
- `CommandHeaders.LOCAL_FIRST` - Prefer local processing (`Command-Local-First`)
- `CommandHeaders.COMMAND_TYPE` - Command type (`Command-Type`)

### CommandRequest<C>

```typescript
interface CommandRequest<C extends object> extends ParameterRequest<
  CommandBody<C>
> {
  urlParams?: CommandUrlParams;
  headers?: CommandRequestHeaders;
  body?: CommandBody<C>; // CommandBody<C> = RemoveReadonlyFields<C>
}
```

### CommandResult Fields

`CommandResult` extends: Identifier, WaitCommandIdCapable, CommandStageCapable, NamedBoundedContext, AggregateNameCapable, AggregateId, ErrorInfo, CommandId, RequestId, FunctionInfoCapable, CommandResultCapable, SignalTimeCapable, NullableAggregateVersionCapable.

Key fields: `id`, `waitCommandId`, `stage`, `contextName`, `aggregateName`, `aggregateId`, `aggregateVersion?`, `commandId`, `requestId`, `errorCode`, `errorMsg`, `bindingErrors?`, `signalTime`, `result`.

---

## SnapshotQueryClient<S, FIELDS>

Queries materialized snapshots (current aggregate state).

### Setup

```typescript
const snapshotClient = new SnapshotQueryClient<CartState>({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});
```

### Query Methods

```typescript
// Count matching snapshots
const count: number = await snapshotClient.count(filter.matchAll());

// List snapshots (returns MaterializedSnapshot<S>[])
const list = await snapshotClient.list({
  filter: filter.matchAll(),
  sort: [{ field: 'eventTime', direction: SortDirection.DESC }], // 'ASC' | 'DESC'; or use desc('eventTime')
  limit: 10,
});

// List snapshots as SSE stream
const stream = await snapshotClient.listStream({ filter: filter.matchAll() });
for await (const event of stream) {
  console.log(event.data);
}

// List only state objects (returns S[])
const states = await snapshotClient.listState({ filter: filter.matchAll() });

// List states as SSE stream
const stateStream = await snapshotClient.listStateStream({
  filter: filter.matchAll(),
});

// Paged snapshots (returns PagedList<MaterializedSnapshot<S>>)
const paged = await snapshotClient.paged({
  filter: filter.matchAll(),
  pagination: { index: 1, size: 20 },
});
// PagedList: { total: number, list: T[] }

// Paged states (returns PagedList<S>)
const pagedState = await snapshotClient.pagedState({
  filter: filter.matchAll(),
  pagination: { index: 1, size: 20 },
});

// Forward-only cursor pages (no total count)
const cursorPage = await snapshotClient.cursor(
  cursorQuery({ filter: filter.matchAll(), size: 20 }),
);
const stateCursorPage = await snapshotClient.cursorState(
  cursorQuery({ filter: filter.matchAll(), size: 20 }),
);
// CursorPage<T>: { list: T[], nextCursor: string | null }

// Single snapshot
const snapshot = await snapshotClient.single({
  filter: filter.eq('aggregateId', 'cart-123'),
});

// Single state
const state = await snapshotClient.singleState({
  filter: filter.eq('aggregateId', 'cart-123'),
});
```

### Aggregation Methods

```typescript
type CartFields = 'state.status' | 'state.items';
type ItemFields = 'productId' | 'price' | 'quantity';

type ProductSummary = {
  product: string;
  itemCount: number;
  revenue: number;
};

const revenue = aggregation.multiply(
  aggregation.field<ItemFields>('price'),
  aggregation.field<ItemFields>('quantity'),
);

const aggregationQuery: AggregationQuery<CartFields, ItemFields> = {
  filter: filter.eq('state.status', 'COMPLETED'),
  elements: [aggregation.element('state.items', filter.gt('quantity', 0))],
  groupBy: [aggregation.terms('productId', 'product')],
  metrics: [
    aggregation.count('itemCount'),
    aggregation.sum(revenue, 'revenue'),
  ],
};

const summaries =
  await snapshotClient.aggregate<ProductSummary>(aggregationQuery);
const summaryStream =
  await snapshotClient.aggregateStream<ProductSummary>(aggregationQuery);
```

```typescript
aggregate<
  Row extends DynamicDocument = DynamicDocument,
  AGGREGATION_FIELDS extends string = string,
>(
  query: AggregationQuery<FIELDS, AGGREGATION_FIELDS>,
  attributes?: Record<string, any>,
  abortController?: AbortController,
): Promise<Row[]>;

aggregateStream<
  Row extends DynamicDocument = DynamicDocument,
  AGGREGATION_FIELDS extends string = string,
>(
  query: AggregationQuery<FIELDS, AGGREGATION_FIELDS>,
  attributes?: Record<string, any>,
  abortController?: AbortController,
): Promise<ReadableStream<JsonServerSentEvent<Row>>>;
```

`QueryApi` requires both aggregation methods and `cursor`, so custom
implementations must provide all three. `SnapshotQueryApi` additionally
requires `cursorState`.
`SnapshotQueryClient` and `EventStreamQueryClient` submit to
`snapshot/aggregation` and `event/aggregation`, respectively;
`aggregateStream` requests an SSE result stream.

### ID-Based Lookup Methods

```typescript
// Get full snapshot by aggregate ID
const snapshot = await snapshotClient.getById('cart-123');

// Get state only by aggregate ID
const state = await snapshotClient.getStateById('cart-123');

// Get multiple snapshots by IDs
const snapshots = await snapshotClient.getByIds(['cart-123', 'cart-456']);

// Get multiple states by IDs
const states = await snapshotClient.getStateByIds(['cart-123', 'cart-456']);
```

---

## EventStreamQueryClient<DomainEventBody, FIELDS>

Queries domain event stream history.

### Setup

```typescript
const eventClient = new EventStreamQueryClient({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});
```

### Methods

```typescript
const count = await eventClient.count(filter.matchAll());
const list = await eventClient.list({ filter: filter.matchAll() });
const stream = await eventClient.listStream({ filter: filter.matchAll() });
const paged = await eventClient.paged({
  filter: filter.matchAll(),
  pagination: { index: 1, size: 20 },
});
const cursorPage = await eventClient.cursor(
  cursorQuery({ filter: filter.matchAll(), size: 20 }),
);

type EventStreamFields = 'body';
type EventFields = 'name';
const eventAggregationQuery: AggregationQuery<EventStreamFields, EventFields> =
  {
    elements: [aggregation.element('body')],
    groupBy: [aggregation.terms('name', 'eventType')],
    metrics: [aggregation.count('count')],
  };
const eventCounts = await eventClient.aggregate(eventAggregationQuery);
const eventCountStream = await eventClient.aggregateStream(
  eventAggregationQuery,
);
```

Event aggregation expands the event array at `body`. Event fields are then
relative to that element; payload fields are nested below its `body` field.
Both aggregation methods use `event/aggregation`.

---

## LoadStateAggregateClient<S>

Loads aggregate state by ID, version, or time.

```typescript
const stateClient = new LoadStateAggregateClient<CartState>({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});

const state = await stateClient.load('cart-123');
const versioned = await stateClient.loadVersioned('cart-123', 5);
const timeBased = await stateClient.loadTimeBased('cart-123', Date.now());
```

## LoadOwnerStateAggregateClient<S>

Owner-specific aggregate state client (no ID required, uses owner context from path).

```typescript
const ownerClient = new LoadOwnerStateAggregateClient<CartState>({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});

const state = await ownerClient.load();
const versioned = await ownerClient.loadVersioned(5);
const timeBased = await ownerClient.loadTimeBased(Date.now());
```

---

## QueryClientFactory<S, FIELDS, DomainEventBody>

Factory for creating pre-configured typed query clients.

### Setup

```typescript
const factory = new QueryClientFactory({
  fetcher,
  contextAlias: 'example',
  aggregateName: 'cart',
  resourceAttribution: ResourceAttributionPathSpec.OWNER,
});
```

### ResourceAttributionPathSpec

- `NONE` - No prefix
- `TENANT` - Path: `/tenant/{tenantId}/...`
- `OWNER` - Path: `/owner/{ownerId}/...`
- `TENANT_OWNER` - Path: `/tenant/{tenantId}/owner/{ownerId}/...`

### Factory Methods

```typescript
const snapshotClient = factory.createSnapshotQueryClient();
const eventClient = factory.createEventStreamQueryClient();
const stateClient = factory.createLoadStateAggregateClient();
const ownerStateClient = factory.createOwnerLoadStateAggregateClient();
```

---

## Cursor Queries

Wow V9 cursor queries are forward-only and return no total count. Pass the
opaque `nextCursor` unchanged to the next request.

```typescript
let query = cursorQuery({
  filter: filter.eq('state.status', 'PAID'),
  sort: [asc('state.createdAt')],
  size: 100,
});

const first: CursorPage<MaterializedSnapshot<CartState>> =
  await snapshotClient.cursor(query);

if (first.nextCursor) {
  query = cursorQuery({ ...query, cursor: first.nextCursor });
  const second = await snapshotClient.cursor(query);
}
```

`DEFAULT_CURSOR_SIZE` is `10`; `size` must be between `1` and
`MAX_CURSOR_SIZE` (`2147483646`). A request accepts at most
`MAX_CURSOR_SORT_FIELDS` (`32`) explicit sort fields. Snapshot and event-stream
cursors use `snapshot/cursor`, `snapshot/cursor/state`, and `event/cursor`.

## Filter Expressions

Wow 8.11+ queries use a discriminated `FilterExpression` with `op` as the
wire discriminator. Builders are grouped under `filter` so they do not collide
with the legacy `Condition` helpers:

```typescript
const expression = filter.and([
  filter.deletion(DeletionState.ACTIVE),
  filter.eq('state.status', 'PAID'),
  filter.elementMatch('state.items', filter.gt('quantity', 0)),
  filter.search('event sourcing', {
    mode: SearchMode.PHRASE,
    fields: ['state.title', 'state.description'],
  }),
  filter.yesterday('state.createdAt', {
    zoneId: 'Asia/Shanghai',
    timeUnit: TimeUnit.MILLISECONDS,
  }),
]);

await snapshotClient.count(expression);
await snapshotClient.list({ filter: expression, limit: 10 });
// The factories infer FilterListQuery when filter is supplied.
const query = listQuery({ filter: expression });
```

`listQuery({ filter })` defaults `limit` to `0` (unlimited), matching current
Wow V9. Legacy `listQuery({ condition })` keeps the previous default page size.

Available builders:

- Logical: `matchAll`, `matchNone`, `and`, `or`, `nor`
- Metadata: `id`, `ids`, `aggregateId`, `aggregateIds`, `tenantId`, `ownerId`, `spaceId`
- Comparison: `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`
- String: `contains`, `startsWith`, `endsWith`; pass `StringComparison` as the third argument
- Collection: `isIn`, `notIn`, `containsAll`
- Presence: `isEmpty`, `isEmptyString`, `isNotEmptyString`, `isNull`, `isNotNull`, `exists`, `notExists`
- Scope/search: `deletion`, `elementMatch`, `search(query, options?: SearchFilterOptions)`
- Relative time: `today`, `beforeToday`, `tomorrow`, `thisWeek`, `nextWeek`, `lastWeek`, `thisMonth`, `lastMonth`, `yesterday`, `nextMonth`, `lastYear`, `thisYear`, `nextYear`, `recentDays`, `earlierDays`

`and`, `or`, `nor`, `ids`, `aggregateIds`, `isIn`, `notIn`, and `containsAll`
accept one non-empty `readonly` array and throw `TypeError` for an empty array:

```typescript
const statuses = ['PAID', 'SHIPPED'] as const;
filter.and([filter.eq('state.status', 'PAID')]);
filter.ids(['snapshot-1', 'snapshot-2']);
filter.aggregateIds(['cart-1', 'cart-2']);
filter.isIn('state.status', statuses);
filter.notIn('state.status', ['CANCELLED']);
filter.containsAll('state.tags', ['wow', 'cqrs']);
```

`eq` and `ne` accept a JSON scalar or `null`; use `isIn`/`notIn` for multiple
values. Query field segments may start with `@`.

`isEmptyString` matches exactly `""`. `isNotEmptyString` requires the field to
exist, be non-null, and differ from `""`. Whitespace-only strings are not empty.

Relative-time builders accept JVM `ZoneId` and `DateTimeFormatter` options:

```typescript
interface RelativeTimeFilterOptions {
  zoneId?: string;
  datePattern?: string;
  timeUnit?: TimeUnit;
}

filter.search(query, options?: SearchFilterOptions);
filter.today(field, options?);
filter.beforeToday(field, time, options?);
filter.tomorrow(field, options?);
filter.thisWeek(field, options?);
filter.nextWeek(field, options?);
filter.lastWeek(field, options?);
filter.thisMonth(field, options?);
filter.lastMonth(field, options?);
filter.yesterday(field, options?);
filter.nextMonth(field, options?);
filter.lastYear(field, options?);
filter.thisYear(field, options?);
filter.nextYear(field, options?);
filter.recentDays(field, days, options?);
filter.earlierDays(field, days, options?);
```

`SearchFilterOptions` has optional `fields` and `mode`; `mode` defaults to
`SearchMode.TERMS`. Relative-time `timeUnit` defaults to `TimeUnit.MILLISECONDS`.
`days` must be a positive JVM `Int`.

`SingleQueryRequest`, `ListQueryRequest`, and `PagedQueryRequest` accept either
the filter-based request types or the existing condition-based request types.
`count` likewise accepts `FilterExpression | Condition`. The legacy Condition
API remains available for servers in the compatibility window.

`elementMatch` accepts `ElementFilterExpression`, whose relative field type is
independent from the outer query fields and excludes metadata filters,
`deletion`, and `search`, including inside nested `and`/`or`/`nor` expressions.

## AggregationQuery

`AggregationQuery<ROOT_FIELDS, AGGREGATION_FIELDS = ROOT_FIELDS>` accepts
these fields:

- `filter?: FilterExpression<ROOT_FIELDS>`
- `elements?: AggregationElement[]`
- `groupBy?: AggregationGroup<AGGREGATION_FIELDS>[]`
- `metrics: [AggregationMetric<AGGREGATION_FIELDS>, ...AggregationMetric<AGGREGATION_FIELDS>[]]` (non-empty)
- `sort?: FieldSort[]`
- `limit?: number`

Each `AggregationElement` has a `path` and optional `filter`.
`elements[].filter` is an `ElementFilterExpression`.
Elements form an ordered expansion chain. The first path is root-relative;
later element paths, group fields, and metric expression fields are relative
to the current innermost element.

`AggregationGroup` is one of:

- `TERMS`: `field`, `alias`
- `HISTOGRAM`: `field`, `alias`, `interval`
- `DATE_HISTOGRAM`: `field`, `alias`, `unit`, optional `timeZone`

`AggregationMetric` is one of:

- `COUNT`: `alias`
- `NUMERIC`: `function`, `expression`, `alias`
- `ANY`: `field`, `alias`

`AggregationFunction` values are `SUM`, `AVG`, `MIN`, and `MAX`.
`AggregationDateUnit` values are `YEAR`, `QUARTER`, `MONTH`, `WEEK`, `DAY`,
`HOUR`, `MINUTE`, and `SECOND`. Aggregation expressions use these
discriminators:

- `AggregationExpressionType.FIELD`: `field`
- `AggregationExpressionType.CONSTANT`: `value`
- `AggregationExpressionType.BINARY`: `operator`, `left`, `right`

`AggregationExpressionOperator` values are `ADD`, `SUBTRACT`, `MULTIPLY`, and
`DIVIDE`. Use the `aggregation` builders rather than hand-writing these shapes:

```typescript
aggregation.element(path, predicate?);
aggregation.field(field);
aggregation.constant(value);
aggregation.add(left, right);
aggregation.subtract(left, right);
aggregation.multiply(left, right);
aggregation.divide(left, right);
aggregation.terms(field, alias);
aggregation.histogram(field, { interval, alias });
aggregation.dateHistogram(field, { unit, alias, timeZone }); // timeZone defaults to UTC
aggregation.any(field, alias);
aggregation.count(alias);
aggregation.sum(expression, alias);
aggregation.avg(expression, alias);
aggregation.min(expression, alias);
aggregation.max(expression, alias);
```

`ANY` is a metric, not a group. It returns one non-null scalar from the current
group, or `null` when no value exists. Its field is relative to the innermost
element. Wow requires the field to support `AGGREGATE_TERMS` and rejects
collection cardinality. MongoDB uses a `$max` accumulator while Elasticsearch
uses a one-bucket `terms` aggregation, so the selected value is intentionally
unspecified. Sorting by an `ANY` alias is an expensive metric sort.

Wow validates the complete aggregation's field capabilities, cardinality,
aliases, sort fields, and expression depth on the server. Fetcher only validates
field-path and alias syntax that can be known locally. The `Row` generic describes
aggregation result rows only; Fetcher does not perform runtime decoding.

## Query DSL Conditions (Deprecated)

The complete Condition API (`Condition`, `ConditionCapable`, `Operator`,
builders, helpers, and operator locales) is deprecated. Use `FilterExpression`
and `filter.*`; keep Condition only while talking to a legacy Wow server.

### Comparison Operators

```typescript
eq('status', 'active'); // Equal
ne('status', 'inactive'); // Not equal
gt('age', 18); // Greater than
lt('score', 100); // Less than
gte('rating', 4.0); // Greater than or equal
lte('price', 100); // Less than or equal
between('salary', 50000, 100000); // Between two values
```

### String Operators

```typescript
contains('email', '@company.com');
startsWith('username', 'j');
endsWith('domain', '.com');
match('description', 'keywords'); // Full-text search
```

### Collection Operators

```typescript
isIn('status', 'active', 'pending', 'review');
notIn('role', 'guest', 'banned');
allIn('tags', 'react', 'typescript');
elemMatch('items', eq('quantity', 0));
```

### Null/Boolean Operators

```typescript
isNull('deletedAt');
notNull('email');
isTrue('isActive');
isFalse('isDeleted');
exists('phoneNumber');
```

### Date Operators

```typescript
today('createdAt');
beforeToday('lastLogin', someTime); // Field is before today (time value is compared server-side)
tomorrow('scheduledDate');
thisWeek('updatedAt');
nextWeek('startDate');
lastWeek('endDate');
thisMonth('createdDate');
lastMonth('expirationDate');
recentDays('createdAt', 5); // Last N days including today
earlierDays('createdAt', 3); // More than N days ago
```

### ID Operators

```typescript
id('abc-123');
ids(['abc-123', 'def-456']);
aggregateId('agg-789');
aggregateIds(['agg-1', 'agg-2']);
tenantId('tenant-abc');
ownerId('owner-123');
```

### State Operators

```typescript
import { DeletionState } from '@ahoo-wang/fetcher-wow';

active(); // Not deleted (shorthand for deleted(DeletionState.ACTIVE))
deleted(DeletionState.DELETED); // Is deleted
all(); // No filter ({ operator: Operator.ALL } — not tied to deletion state)
```

### Logical Operators

```typescript
and(
  eq('tenantId', 'tenant-123'),
  or(
    contains('email', '@company.com'),
    isIn('department', 'engineering', 'marketing'),
  ),
  between('salary', 50000, 100000),
);

nor(eq('status', 'banned')); // Nor (not or)

raw({ $text: { $search: 'keywords' } }); // Raw condition
```

---

## Key Types

### MaterializedSnapshot<S>

Full snapshot with metadata. Fields: `state`, `aggregateId`, `tenantId`, `ownerId`, `version`, `eventId`, `firstEventTime`, `eventTime`, `snapshotTime`, `firstOperator`, `operator`, `tags`, `deleted`.

### PagedList<T>

```typescript
interface PagedList<T> {
  total: number;
  list: T[];
}
```

### CommandBody<C>

```typescript
type CommandBody<C> = RemoveReadonlyFields<C>;
```

### Pagination

```typescript
interface Pagination {
  index: number;
  size: number;
}
```

---

## Generated Clients

When using `@ahoo-wang/fetcher-generator`, clients are auto-generated:

```typescript
import { Fetcher, HttpMethod } from '@ahoo-wang/fetcher';
import {
  CartCommandClient,
  CartStreamCommandClient,
} from './generated/example/cart/commandClient';
import { cartQueryClientFactory } from './generated/example/cart/queryClient';

const fetcher = new Fetcher({ baseURL: 'http://localhost:8080/' });
const cartCommandClient = new CartCommandClient({ fetcher });
const cartStreamCommandClient = new CartStreamCommandClient({ fetcher });

// Send command using generated client
await cartCommandClient.addCartItem({
  method: HttpMethod.POST,
  body: { productId: 'prod-1', quantity: 1 },
});

// Streaming version (stream client, same generated method)
const stream = await cartStreamCommandClient.addCartItem({
  method: HttpMethod.POST,
  body: { productId: 'prod-1', quantity: 1 },
});

// Query clients from factory
const snapshotClient = cartQueryClientFactory.createSnapshotQueryClient();
const eventClient = cartQueryClientFactory.createEventStreamQueryClient();
const stateClient = cartQueryClientFactory.createLoadStateAggregateClient();
```

---

## Example: Complete Cart Flow

```typescript
import { Fetcher, HttpMethod } from '@ahoo-wang/fetcher';
import '@ahoo-wang/fetcher-eventstream';
import {
  CommandClient,
  SnapshotQueryClient,
  CommandHeaders,
  CommandStage,
  filter,
} from '@ahoo-wang/fetcher-wow';

const fetcher = new Fetcher({ baseURL: 'http://localhost:8080/' });

const commandClient = new CommandClient({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});

const snapshotClient = new SnapshotQueryClient({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});

// Send command
const result = await commandClient.send({
  path: 'add_cart_item',
  method: HttpMethod.POST,
  headers: { [CommandHeaders.WAIT_STAGE]: CommandStage.SNAPSHOT },
  body: { productId: 'prod-123', quantity: 2 },
});

// Query updated state
const cart = await snapshotClient.getStateById(result.aggregateId);

// Stream real-time updates
const stream = await snapshotClient.listStateStream({
  filter: filter.eq('aggregateId', result.aggregateId),
});
for await (const event of stream) {
  console.log('Cart updated:', event.data);
}
```

---

## Key Dependencies

- `@ahoo-wang/fetcher` - Core HTTP client
- `@ahoo-wang/fetcher-eventstream` - SSE streaming support (loads transitively with fetcher-wow)
- `@ahoo-wang/fetcher-decorator` - ApiMetadata type, decorators for auto-implemented methods
- `@ahoo-wang/fetcher-wow` - Wow CQRS/DDD types and clients
