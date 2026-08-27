---
title: '@ahoo-wang/fetcher-wow'
description: 'Wow framework integration for Fetcher providing DDD + Event Sourcing + CQRS support with typed command clients, snapshot query clients, event stream queries, and aggregate root interaction patterns.'
---

# @ahoo-wang/fetcher-wow

The `@ahoo-wang/fetcher-wow` package provides the client-side integration layer for the [Wow](https://github.com/Ahoo-Wang/wow) DDD + Event Sourcing + CQRS framework. It delivers typed command clients for sending domain commands, snapshot query clients for reading aggregate state, event stream query clients for replaying domain events, and a rich `FilterExpression` query DSL with sorting and pagination.

## Installation

```bash
pnpm add @ahoo-wang/fetcher-wow
```

## Architecture Overview

```mermaid
graph TB
    subgraph sg_1 ["Command Side (Write)"]
        CC["CommandClient<br>send + sendAndWaitStream"]
    end

    subgraph sg_2 ["Query Side (Read)"]
        SQC["SnapshotQueryClient&lt;S&gt;<br>query snapshots"]
        ESQC["EventStreamQueryClient<br>query domain events"]
        LSAC["LoadStateAggregateClient<br>load by ID"]
        LOSAC["LoadOwnerStateAggregateClient<br>load owner state"]
    end

    subgraph sg_3 ["Query DSL"]
        COND["FilterExpression<br>filter.and / filter.or"]
        SORT["FieldSort<br>sort by field"]
        PAGE["PagedQuery / ListQuery<br>pagination"]
        OP["FilterOperator<br>EQ, NE, IN, BETWEEN..."]
    end

    subgraph sg_4 ["Factories"]
        QCF["QueryClientFactory&lt;S, FIELDS&gt;<br>creates all query clients"]
    end

    QCF --> SQC
    QCF --> ESQC
    QCF --> LSAC
    QCF --> LOSAC

    CC --> |"POST command"| API["Wow Server API"]
    SQC --> |"POST query"| API
    ESQC --> |"POST + SSE"| API
    LSAC --> |"GET by ID"| API

    SQC --> COND
    SQC --> SORT
    SQC --> PAGE
    COND --> OP

    style CC fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style SQC fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style ESQC fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style LSAC fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style LOSAC fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style QCF fill:#161b22,stroke:#30363d,color:#e6edf3
    style COND fill:#161b22,stroke:#30363d,color:#e6edf3
    style SORT fill:#161b22,stroke:#30363d,color:#e6edf3
    style PAGE fill:#161b22,stroke:#30363d,color:#e6edf3
    style OP fill:#161b22,stroke:#30363d,color:#e6edf3
    style API fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

## Command Side (Write Model)

### CommandClient

The `CommandClient` uses [decorator](./decorator.md)-based API methods to send commands to Wow aggregate roots. It supports both standard command execution and SSE streaming for long-running commands.

```typescript
import { CommandClient } from '@ahoo-wang/fetcher-wow';
import { ApiMetadata } from '@ahoo-wang/fetcher-decorator';
import { Fetcher } from '@ahoo-wang/fetcher';

const commandClient = new CommandClient({
  fetcher: new Fetcher({ baseURL: 'http://localhost:8080/' }),
  basePath: 'owner/{ownerId}/cart',
});

// Send a command and wait for result
const result = await commandClient.send({
  body: {
    productId: 'product-1',
    quantity: 2,
  },
  headers: {
    'Command-Wait-Stage': 'SNAPSHOT',
  },
});

console.log('Aggregate ID:', result.aggregateId);
console.log('Command ID:', result.commandId);
```

Source: [packages/wow/src/command/commandClient.ts:77-148](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/command/commandClient.ts#L77-L148)

### CommandRequest

Commands are wrapped in a `CommandRequest` that supports:

- `body` -- the command payload wrapped with `CommandBody<C>`
- `headers` -- typed command headers for wait strategies, tenant/owner/aggregate identification
- `urlParams` -- path parameters for aggregate routing

### Command Headers

| Header                      | Constant                           | Description                |
| --------------------------- | ---------------------------------- | -------------------------- |
| `Command-Tenant-Id`         | `CommandHeaders.TENANT_ID`         | Tenant identifier          |
| `Command-Owner-Id`          | `CommandHeaders.OWNER_ID`          | Owner identifier           |
| `Command-Space-Id`          | `CommandHeaders.SPACE_ID`          | Space identifier           |
| `Command-Aggregate-Id`      | `CommandHeaders.AGGREGATE_ID`      | Aggregate instance ID      |
| `Command-Aggregate-Version` | `CommandHeaders.AGGREGATE_VERSION` | Expected aggregate version |
| `Command-Wait-Stage`        | `CommandHeaders.WAIT_STAGE`        | Wait processing stage      |
| `Command-Wait-Timeout`      | `CommandHeaders.WAIT_TIME_OUT`     | Wait timeout duration      |
| `Command-Wait-Context`      | `CommandHeaders.WAIT_CONTEXT`      | Wait processing context    |
| `Command-Request-Id`        | `CommandHeaders.REQUEST_ID`        | Request correlation ID     |
| `Command-Local-First`       | `CommandHeaders.LOCAL_FIRST`       | Execute locally first      |

Source: [packages/wow/src/command/commandHeaders.ts](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/command/commandHeaders.ts)

### CommandResult

The result returned after command execution:

```mermaid
classDiagram
    class CommandResult {
        +id: string
        +waitCommandId: string
        +stage: CommandStage
        +contextName: string
        +aggregateName: string
        +aggregateId: string
        +aggregateVersion: number
        +commandId: string
        +requestId: string
        +errorCode: string
        +errorMsg: string
        +signalTime: number
        +result: any
    }

    class CommandResultEventStream {
        <<type>>
        ReadableStream~JsonServerSentEvent~CommandResult~~
    }

    CommandResult --> CommandResultEventStream

    style CommandResult fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style CommandResultEventStream fill:#161b22,stroke:#30363d,color:#e6edf3
```

Source: [packages/wow/src/command/commandResult.ts:74-110](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/command/commandResult.ts#L74-L110)

### CommandStage

The `CommandStage` enum defines the processing stages at which a command's wait-strategy can signal completion. It is used as the value of the `Command-Wait-Stage` header and the `CommandResult.stage` field:

| Stage           | Value             | Completion Signal                                 |
| --------------- | ----------------- | ------------------------------------------------- |
| `SENT`          | `'SENT'`          | Command published to the command bus/queue        |
| `PROCESSED`     | `'PROCESSED'`     | Command processed by the aggregate root           |
| `SNAPSHOT`      | `'SNAPSHOT'`      | Snapshot generated (aggregate state materialized) |
| `PROJECTED`     | `'PROJECTED'`     | Events projected to read models                   |
| `EVENT_HANDLED` | `'EVENT_HANDLED'` | Events processed by event handlers                |
| `SAGA_HANDLED`  | `'SAGA_HANDLED'`  | Events processed by Saga processes                |

Source: [packages/wow/src/command/types.ts:54-84](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/command/types.ts#L54-L84)

### Command Flow

```mermaid
sequenceDiagram
autonumber

    participant C as Client
    participant CC as CommandClient
    participant S as Wow Server
    participant AGG as Aggregate Root

    C->>CC: send(commandRequest)
    CC->>S: POST /owner/{ownerId}/cart/add_cart_item
    S->>AGG: Handle command
    AGG-->>S: Domain events produced
    S-->>CC: CommandResult (with wait stage)
    CC-->>C: CommandResult

    Note over C,AGG: For streaming:<br>sendAndWaitStream returns<br>ReadableStream of CommandResult events
```

## Query Side (Read Model)

### SnapshotQueryClient

The primary client for reading aggregate state. Supports counting, listing, paging, and streaming snapshot queries.

```typescript
import { SnapshotQueryClient, filter } from '@ahoo-wang/fetcher-wow';

const client = new SnapshotQueryClient<CartState>(apiMetadata);

// Count
const count = await client.count(filter.matchAll());

// List
const items = await client.list({
  filter: filter.matchAll(),
  limit: 100,
});

// Paged
const page = await client.paged({
  filter: filter.matchAll(),
  pagination: { index: 1, size: 10 },
});

// Single by ID
const cart = await client.getStateById('cart-123');

// Multiple by IDs
const carts = await client.getStateByIds(['cart-1', 'cart-2']);
```

#### SnapshotQueryClient Methods

| Method                       | Endpoint                 | Returns                                                                 | Description                |
| ---------------------------- | ------------------------ | ----------------------------------------------------------------------- | -------------------------- |
| `count(filter)`              | `/snapshot/count`        | `Promise<number>`                                                       | Count matching aggregates  |
| `list(listQuery)`            | `/snapshot/list`         | `Promise<MaterializedSnapshot<S>[]>`                                    | List snapshots             |
| `listStream(listQuery)`      | `/snapshot/list`         | `Promise<ReadableStream<JsonServerSentEvent<MaterializedSnapshot<S>>>>` | List as SSE stream         |
| `listState(listQuery)`       | `/snapshot/list/state`   | `Promise<S[]>`                                                          | List state only            |
| `listStateStream(listQuery)` | `/snapshot/list/state`   | `Promise<ReadableStream<JsonServerSentEvent<S>>>`                       | State as SSE stream        |
| `paged(pagedQuery)`          | `/snapshot/paged`        | `Promise<PagedList<MaterializedSnapshot<S>>>`                           | Paginated snapshots        |
| `pagedState(pagedQuery)`     | `/snapshot/paged/state`  | `Promise<PagedList<S>>`                                                 | Paginated state            |
| `single(singleQuery)`        | `/snapshot/single`       | `Promise<MaterializedSnapshot<S>>`                                      | Single snapshot            |
| `singleState(singleQuery)`   | `/snapshot/single/state` | `Promise<S>`                                                            | Single state               |
| `getById(id)`                | --                       | `Promise<MaterializedSnapshot<S>>`                                      | Get by aggregate ID        |
| `getStateById(id)`           | --                       | `Promise<S>`                                                            | Get state by ID            |
| `getByIds(ids)`              | --                       | `Promise<MaterializedSnapshot<S>[]>`                                    | Get multiple by IDs        |
| `getStateByIds(ids)`         | --                       | `Promise<S[]>`                                                          | Get multiple states        |
| `aggregate(query)`           | `/snapshot/aggregation`  | `Promise<Row[]>`                                                        | Aggregate snapshots        |
| `aggregateStream(query)`     | `/snapshot/aggregation`  | `Promise<ReadableStream<JsonServerSentEvent<Row>>>`                     | Aggregate snapshots as SSE |

For compatibility with existing implementations, `SnapshotQueryApi` declares
`aggregate?` and `aggregateStream?` as optional. `SnapshotQueryClient`
implements both as required methods.

Source: [packages/wow/src/query/snapshot/snapshotQueryClient.ts:119-516](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/snapshot/snapshotQueryClient.ts#L119-L516)

#### Snapshot Aggregation

```typescript
import {
  aggregation,
  filter,
  type AggregationQuery,
} from '@ahoo-wang/fetcher-wow';

type CartFields = 'state.status' | 'state.items';
type ItemFields = 'productId' | 'price' | 'quantity';
type ProductSummary = {
  product: string;
  representativeProduct: string | null;
  itemCount: number;
  revenue: number;
};

const revenue = aggregation.multiply(
  aggregation.field<ItemFields>('price'),
  aggregation.field<ItemFields>('quantity'),
);

const query: AggregationQuery<CartFields, ItemFields> = {
  filter: filter.eq('state.status', 'COMPLETED'),
  elements: [aggregation.element('state.items', filter.gt('quantity', 0))],
  groupBy: [aggregation.terms('productId', 'product')],
  metrics: [
    aggregation.any('productId', 'representativeProduct'),
    aggregation.count('itemCount'),
    aggregation.sum(revenue, 'revenue'),
  ],
};

const summaries = await client.aggregate<ProductSummary>(query);
const summaryStream = await client.aggregateStream<ProductSummary>(query);
```

`aggregation.any(field, alias)` returns one non-null scalar per current group,
or `null` when no value exists, without adding a group key. Selection is
intentionally unspecified across backends and executions. The field is relative
to the innermost element; Wow rejects collection or non-terms-capable fields.
Sorting by an `ANY` alias is an expensive metric sort.

### QueryClientFactory

A factory that creates all query clients for a given aggregate, pre-configured with the correct base path:

```typescript
import {
  QueryClientFactory,
  ResourceAttributionPathSpec,
} from '@ahoo-wang/fetcher-wow';

const factory = new QueryClientFactory<CartState, CartFields, CartDomainEvent>({
  contextAlias: 'example',
  aggregateName: 'cart',
  resourceAttribution: ResourceAttributionPathSpec.OWNER,
});

// Create individual clients
const snapshotClient = factory.createSnapshotQueryClient();
const stateClient = factory.createLoadStateAggregateClient();
const ownerStateClient = factory.createOwnerLoadStateAggregateClient();
const eventClient = factory.createEventStreamQueryClient();
```

| Factory Method                          | Creates                            | Description                   |
| --------------------------------------- | ---------------------------------- | ----------------------------- |
| `createSnapshotQueryClient()`           | `SnapshotQueryClient<S, FIELDS>`   | Snapshot queries with filters |
| `createLoadStateAggregateClient()`      | `LoadStateAggregateClient<S>`      | Load by ID, version, or time  |
| `createOwnerLoadStateAggregateClient()` | `LoadOwnerStateAggregateClient<S>` | Load owner's aggregate state  |
| `createEventStreamQueryClient()`        | `EventStreamQueryClient`           | Domain event stream queries   |

Source: [packages/wow/src/query/queryClients.ts:62-214](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/queryClients.ts#L62-L214)

## Query DSL

### FilterExpression

Use the `filter` builder for new queries. It creates typed
`FilterExpression` values that are placed in a request's `filter` property.

```typescript
import {
  filter,
  SearchMode,
  StringComparison,
  TimeUnit,
} from '@ahoo-wang/fetcher-wow';

const activeCarts = filter.and([
  filter.isIn('state.status', ['ACTIVE', 'PENDING']),
  filter.between('state.createdAt', '2024-01-01', '2024-12-31'),
  filter.contains(
    'state.ownerName',
    'ahoowang',
    StringComparison.CASE_INSENSITIVE,
  ),
]);

const request = { filter: activeCarts, limit: 100 };

const fullText = filter.search('event sourcing', {
  mode: SearchMode.PHRASE,
  fields: ['state.title', 'state.description'],
});

const yesterday = filter.yesterday('state.createdAt', {
  zoneId: 'Asia/Shanghai',
  timeUnit: TimeUnit.MILLISECONDS,
});
```

| Category       | `filter` builders                                                                                                                                                                                                                                                                                                                                                                                                                                                            | Notes                                                                                                                                                                                                                            |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Logical        | `matchAll()`, `matchNone()`, `and(operands)`, `or(operands)`, `nor(operands)`                                                                                                                                                                                                                                                                                                                                                                                                | Logical builders accept one `readonly` array with at least one operand.                                                                                                                                                          |
| Metadata       | `id(value)`, `ids(values)`, `aggregateId(value)`, `aggregateIds(values)`, `tenantId(value)`, `ownerId(value)`, `spaceId(value)`                                                                                                                                                                                                                                                                                                                                              | Plural builders accept one non-empty `readonly` array.                                                                                                                                                                           |
| Comparison     | `eq(field, value)`, `ne(field, value)`, `gt(field, value)`, `gte(field, value)`, `lt(field, value)`, `lte(field, value)`, `between(field, lowerBound, upperBound)`                                                                                                                                                                                                                                                                                                           | Values are JSON scalar values; equality also accepts `null` and arrays.                                                                                                                                                          |
| String         | `contains(field, value, stringComparison?)`, `startsWith(...)`, `endsWith(...)`                                                                                                                                                                                                                                                                                                                                                                                              | `stringComparison` defaults to `StringComparison.CASE_SENSITIVE`.                                                                                                                                                                |
| Collection     | `isIn(field, values)`, `notIn(field, values)`, `containsAll(field, values)`                                                                                                                                                                                                                                                                                                                                                                                                  | Collection builders accept one non-empty `readonly` array.                                                                                                                                                                       |
| Presence       | `isEmpty(field)`, `isNull(field)`, `isNotNull(field)`, `exists(field)`, `notExists(field)`                                                                                                                                                                                                                                                                                                                                                                                   | Field presence builders.                                                                                                                                                                                                         |
| Scope / search | `deletion(state)`, `elementMatch(field, predicate)`, `search(query, options?)`                                                                                                                                                                                                                                                                                                                                                                                               | `deletion` accepts `DeletionState.ACTIVE`, `DELETED`, or `ALL`; `SearchFilterOptions` accepts `fields` and `mode` (`SearchMode.TERMS` by default); element predicates cannot contain root metadata, deletion, or search filters. |
| Relative time  | `today(field, options?)`, `beforeToday(field, time, options?)`, `tomorrow(field, options?)`, `thisWeek(field, options?)`, `nextWeek(field, options?)`, `lastWeek(field, options?)`, `thisMonth(field, options?)`, `lastMonth(field, options?)`, `yesterday(field, options?)`, `nextMonth(field, options?)`, `lastYear(field, options?)`, `thisYear(field, options?)`, `nextYear(field, options?)`, `recentDays(field, days, options?)`, `earlierDays(field, days, options?)` | `options` may contain `zoneId`, `datePattern`, and `timeUnit` (`TimeUnit.MILLISECONDS` by default); `days` must be a positive JVM `Int`.                                                                                         |

Source: [packages/wow/src/query/filter.ts](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/filter.ts)

### Legacy Conditions

`Condition`, its helpers such as `all()` and `and(...)`, and `Operator` remain
exported for compatibility but are deprecated. Existing client methods accept
legacy conditions where their type permits; use `FilterExpression` and
`filter.*` for new code. `raw()` has no `FilterExpression` replacement.

### Sorting and Pagination

```typescript
import { filter, SortDirection } from '@ahoo-wang/fetcher-wow';

// Paged query with sorting (pagination.index starts at 1)
const query = {
  filter: filter.matchAll(),
  pagination: { index: 1, size: 20 },
  sort: [{ field: 'createdAt', direction: SortDirection.DESC }],
};

// List query (limit only, no pagination)
const list = {
  filter: filter.matchAll(),
  limit: 100,
};
```

### Cursor Pagination

For large datasets, cursor-based pagination is more efficient than offset-based pagination. It avoids the performance degradation of deep offset queries by using a cursor ID to track position:

```typescript
import {
  cursorQuery,
  CURSOR_ID_START,
  filter,
  SortDirection,
} from '@ahoo-wang/fetcher-wow';

// First page — start from the beginning
const firstPage = cursorQuery({
  query: {
    filter: filter.matchAll(),
    limit: 50,
    projection: { include: ['id', 'name'] },
  },
  cursorId: CURSOR_ID_START, // '~' — start from the beginning
  field: 'id',
  direction: SortDirection.ASC,
});

// Subsequent pages — use the last item's cursor ID from the previous result
const nextPage = cursorQuery({
  query: { filter: filter.matchAll(), limit: 50 },
  cursorId: lastItemId, // cursor ID from the previous page
  field: 'id',
  direction: SortDirection.ASC,
});
```

### Projection

Control which fields are returned by the query using `projection` — include only the fields you need to reduce payload size:

```typescript
import { filter, projection } from '@ahoo-wang/fetcher-wow';

// Include only specific fields
const query = {
  filter: filter.matchAll(),
  pagination: { index: 1, size: 20 },
  projection: projection({ include: ['id', 'name', 'status'] }),
};

// Exclude fields
const query2 = {
  filter: filter.matchAll(),
  pagination: { index: 1, size: 20 },
  projection: projection({ exclude: ['internalNotes', 'metadata'] }),
};
```

Source: [packages/wow/src/query/cursorQuery.ts](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/cursorQuery.ts), [packages/wow/src/query/projection.ts](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/projection.ts)

## Module Structure

```mermaid
graph TB
    subgraph sg_1 ["@ahoo-wang/fetcher-wow"]
        direction TB
        CMD["command/<br>CommandClient, headers, types"]
        QRY["query/<br>Query DSL, conditions, operators"]
        SNAP["query/snapshot/<br>SnapshotQueryClient"]
        EVNT["query/event/<br>EventStreamQueryClient"]
        STATE["query/state/<br>LoadStateAggregateClient"]
        CFG["configuration/<br>wowMetadata"]
        TYPES["types/<br>DDD modeling types"]
    end

    CMD --> QRY
    QRY --> SNAP
    QRY --> EVNT
    QRY --> STATE
    TYPES --> CMD
    TYPES --> QRY
    CFG --> CMD

    style CMD fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style QRY fill:#161b22,stroke:#30363d,color:#e6edf3
    style SNAP fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style EVNT fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style STATE fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style CFG fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
    style TYPES fill:#2d333b,stroke:#6d5dfc,color:#e6edf3
```

Source: [packages/wow/src/index.ts](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/index.ts)

## Key Exports

| Export                                                                                                                                                      | Module            | Description                                      |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- | ------------------------------------------------ |
| `CommandClient`                                                                                                                                             | `command/`        | Decorator-based command sending client           |
| `CommandRequest`                                                                                                                                            | `command/`        | Typed command request with headers               |
| `CommandResult`                                                                                                                                             | `command/`        | Command execution result                         |
| `CommandResultEventStream`                                                                                                                                  | `command/`        | SSE stream of command results                    |
| `CommandBody<C>`                                                                                                                                            | `command/`        | Command body wrapper type                        |
| `CommandHeaders`                                                                                                                                            | `command/`        | Header name constants                            |
| `QueryClientFactory`                                                                                                                                        | `query/`          | Factory for creating all query clients           |
| `QueryClientOptions`                                                                                                                                        | `query/`          | Configuration for query clients                  |
| `SnapshotQueryClient`                                                                                                                                       | `query/snapshot/` | Snapshot query operations                        |
| `EventStreamQueryClient`                                                                                                                                    | `query/event/`    | Domain event stream queries                      |
| `LoadStateAggregateClient`                                                                                                                                  | `query/state/`    | Load aggregate state by ID/version/time          |
| `LoadOwnerStateAggregateClient`                                                                                                                             | `query/state/`    | Load owner's aggregate state                     |
| `FilterExpression`                                                                                                                                          | `query/`          | Typed query-filter union                         |
| `filter`                                                                                                                                                    | `query/`          | `FilterExpression` builders for new queries      |
| `SearchMode`, `TimeUnit`                                                                                                                                    | `query/`          | Search and relative-time option enums            |
| `AggregationQuery`                                                                                                                                          | `query/`          | Typed snapshot aggregation request               |
| `aggregation`                                                                                                                                               | `query/`          | Aggregation query builders                       |
| `AggregationGroupType`, `AggregationMetricType`, `AggregationExpressionType`, `AggregationExpressionOperator`, `AggregationDateUnit`, `AggregationFunction` | `query/`          | Aggregation schema enums                         |
| `SnapshotQueryClient.aggregate()`                                                                                                                           | `query/snapshot/` | Run an aggregation and return result rows        |
| `SnapshotQueryClient.aggregateStream()`                                                                                                                     | `query/snapshot/` | Run an aggregation and stream result rows as SSE |
| `Condition`, `all()`, `and(...)`, `Operator`                                                                                                                | `query/`          | Deprecated compatibility API                     |
| `listQuery()`                                                                                                                                               | `query/`          | Create a list query                              |
| `pagedQuery()`                                                                                                                                              | `query/`          | Create a paged query                             |
| `singleQuery()`                                                                                                                                             | `query/`          | Create a single query                            |
| `FieldSort`                                                                                                                                                 | `query/`          | Sort specification                               |
| `ResourceAttributionPathSpec`                                                                                                                               | `types/`          | Path spec for tenant/owner scoping               |

## Generated Clients

The [Generator](./generator.md) package automatically generates typed command and query clients for each aggregate found in the OpenAPI spec. For example, for a `Cart` aggregate in bounded context `example`:

```typescript
// Generated command client
const commandClient = new CartCommandClient();
const result = await commandClient.addCartItem({
  body: { productId: 'p1', quantity: 1 },
});

// Generated query client factory
const factory = cartQueryClientFactory;
const snapshotClient = factory.createSnapshotQueryClient();
const cartState = await snapshotClient.singleState({
  filter: filter.aggregateId('cart-1'),
});
```

## Cross-References

- **[Fetcher](./fetcher.md)** -- Core HTTP client; all Wow clients use Fetcher for HTTP transport
- **[Decorator](./decorator.md)** -- `CommandClient` and `SnapshotQueryClient` use `@api`, `@post`, `@body` decorators
- **[EventStream](./eventstream.md)** -- Streaming queries (`listStream`, `sendAndWaitStream`) use `JsonEventStreamResultExtractor`
- **[Generator](./generator.md)** -- The generator reads OpenAPI specs and produces typed Wow clients
- **[React](./react.md)** -- `useSingleQuery`, `useListQuery`, `usePagedQuery` hooks target Wow query clients
- **[Viewer](./viewer.md)** -- The FetcherViewer component uses Wow query clients for data display
