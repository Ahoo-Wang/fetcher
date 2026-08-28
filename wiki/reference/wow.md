---
title: Wow reference
description: Complete reference for Wow commands, typed snapshot and event queries, filters, cursors, aggregation, and state loading.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-wow`

`@ahoo-wang/fetcher-wow` maps Wow command and query HTTP contracts to typed
Fetcher clients. It is the low-level client package used by generated Wow
clients and by applications that call Wow endpoints directly.

Use the [Wow CQRS recipe](../recipes/wow-cqrs.md) for a guided end-to-end flow.
Use this page when you need an exact client, method, query shape, default, or
return type.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-wow
```

The first three packages are peer dependencies. Streaming methods use the
event-stream package to decode JSON Server-Sent Events.

## Choose a client

| Goal | Client | Main methods |
| --- | --- | --- |
| Send a command | `CommandClient<C>` | `send`, `sendAndWaitStream` |
| Query materialized snapshots | `SnapshotQueryClient<S, FIELDS>` | `single`, `list`, `paged`, `count`, `aggregate` |
| Return state without snapshot metadata | `SnapshotQueryClient<S, FIELDS>` | `singleState`, `listState`, `pagedState` |
| Query domain-event streams | `EventStreamQueryClient<E, FIELDS>` | `list`, `listStream`, `paged`, `count` |
| Rebuild state by aggregate ID | `LoadStateAggregateClient<S>` | `load`, `loadVersioned`, `loadTimeBased` |
| Rebuild an owner-scoped aggregate | `LoadOwnerStateAggregateClient<S>` | `load`, `loadVersioned`, `loadTimeBased` |
| Create related query clients | `QueryClientFactory<S, FIELDS, E>` | `createSnapshotQueryClient` and related factory methods |

## Shared configuration

All clients accept `ApiMetadata` from `@ahoo-wang/fetcher-decorator`. The
important fields are:

| Field | Purpose |
| --- | --- |
| `fetcher` | A `Fetcher` instance or registered Fetcher name |
| `basePath` | Base URL path prepended to the client's endpoint paths |
| `urlParams.path` | Values for `{tenantId}`, `{ownerId}`, and other path placeholders |
| `headers` | Headers inherited by every client request |
| `timeout` | Default timeout in milliseconds |
| `attributes` | Values shared with Fetcher interceptors |

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
import {
  QueryClientFactory,
  ResourceAttributionPathSpec,
} from '@ahoo-wang/fetcher-wow';

interface CartItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CartOrder {
  status: 'PAID' | 'CANCELLED';
  lines: CartItem[];
}

interface CartState {
  status: 'ACTIVE' | 'CHECKED_OUT';
  items: CartItem[];
  orders: CartOrder[];
}

type CartFields =
  | 'aggregateId'
  | 'ownerId'
  | 'snapshotTime'
  | 'state.status'
  | 'state.items'
  | 'state.orders';

interface CartItemAdded {
  productId: string;
  quantity: number;
}

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

const factory = new QueryClientFactory<
  CartState,
  CartFields,
  CartItemAdded
>({
  fetcher,
  contextAlias: 'sales',
  resourceAttribution: ResourceAttributionPathSpec.OWNER,
  aggregateName: 'cart',
  urlParams: { path: { ownerId: 'u-42' } },
});

const snapshots = factory.createSnapshotQueryClient();
const events = factory.createEventStreamQueryClient();
const stateLoader = factory.createLoadStateAggregateClient();
const ownerStateLoader = factory.createOwnerLoadStateAggregateClient();
```

The factory joins the route in this order:
`contextAlias/resourceAttribution/aggregateName`. The example therefore uses
`sales/owner/{ownerId}/cart` before appending a method-specific endpoint.

`ResourceAttributionPathSpec` provides `NONE`, `TENANT`, `OWNER`, and
`TENANT_OWNER`. Bind every placeholder through `urlParams.path`, either in
shared metadata or in a command request. Missing values cannot produce a valid
request URL.

## Commands

Create a command client with the same route metadata used by the query clients:

```ts
import { HttpMethod } from '@ahoo-wang/fetcher';
import {
  CommandClient,
  CommandHeaders,
  CommandStage,
  ErrorCodes,
} from '@ahoo-wang/fetcher-wow';

interface AddCartItem {
  productId: string;
  quantity: number;
}

const commands = new CommandClient<AddCartItem>({
  fetcher,
  basePath: 'sales/owner/{ownerId}/cart',
  urlParams: { path: { ownerId: 'u-42' } },
});

const result = await commands.send({
  path: 'add_cart_item',
  method: HttpMethod.POST,
  headers: {
    [CommandHeaders.WAIT_STAGE]: CommandStage.SNAPSHOT,
    [CommandHeaders.REQUEST_ID]: crypto.randomUUID(),
  },
  body: { productId: 'book-1', quantity: 2 },
});

if (ErrorCodes.isError(result.errorCode)) {
  throw new Error(`${result.errorCode}: ${result.errorMsg}`);
}
```

The endpoint belongs in `request.path`; `send()` does not accept a separate
endpoint argument.

### Command methods

| Method | Return | Use it when |
| --- | --- | --- |
| `send(request, attributes?)` | `Promise<CommandResult>` | One wait result is enough |
| `sendAndWaitStream(request, attributes?)` | `Promise<CommandResultEventStream>` | You need every wait signal as SSE |

```ts
const stream = await commands.sendAndWaitStream({
  path: 'add_cart_item',
  method: HttpMethod.POST,
  headers: { [CommandHeaders.WAIT_STAGE]: CommandStage.PROJECTED },
  body: { productId: 'book-1', quantity: 2 },
});

for await (const event of stream) {
  console.log(event.data.stage, event.data.aggregateVersion);
}
```

`CommandResult` includes `stage`, `aggregateId`, `aggregateVersion`,
`commandId`, `requestId`, `errorCode`, `errorMsg`, optional `bindingErrors`,
`result`, and `signalTime` together with bounded-context and function metadata.

### Command stages

| Stage | Waits until |
| --- | --- |
| `SENT` | The command is published |
| `PROCESSED` | The aggregate processes the command |
| `SNAPSHOT` | The materialized snapshot is generated |
| `PROJECTED` | Projection processing completes |
| `EVENT_HANDLED` | Event handlers complete |
| `SAGA_HANDLED` | Saga handlers complete |

### Command headers

| Concern | Constants |
| --- | --- |
| Attribution | `TENANT_ID`, `OWNER_ID`, `SPACE_ID` |
| Aggregate | `AGGREGATE_ID`, `AGGREGATE_VERSION`, `COMMAND_AGGREGATE_CONTEXT`, `COMMAND_AGGREGATE_NAME` |
| Waiting | `WAIT_STAGE`, `WAIT_TIME_OUT`, `WAIT_CONTEXT`, `WAIT_PROCESSOR`, `WAIT_FUNCTION` |
| Wait-chain tail | `WAIT_TAIL_STAGE`, `WAIT_TAIL_CONTEXT`, `WAIT_TAIL_PROCESSOR`, `WAIT_TAIL_FUNCTION` |
| Correlation and routing | `REQUEST_ID`, `LOCAL_FIRST`, `COMMAND_TYPE` |

Pass an `AbortController` as `request.abortController` when a command must be
cancellable.

## Snapshot queries

Snapshot methods post to paths below the client's `basePath`.

| Method | Endpoint | Return |
| --- | --- | --- |
| `single<T>(query)` | `snapshot/single` | `T`; defaults to `MaterializedSnapshot<S>` |
| `singleState<T>(query)` | `snapshot/single/state` | `T`; defaults to `S` |
| `list<T>(query)` | `snapshot/list` | `T[]`; defaults to full snapshots |
| `listState<T>(query)` | `snapshot/list/state` | `T[]`; defaults to `S[]` |
| `listStream<T>(query)` | `snapshot/list` | SSE of `T` snapshots |
| `listStateStream<T>(query)` | `snapshot/list/state` | SSE of `T` states |
| `paged<T>(query)` | `snapshot/paged` | `PagedList<T>`; defaults to full snapshots |
| `pagedState<T>(query)` | `snapshot/paged/state` | `PagedList<T>`; defaults to `S` |
| `count(filter)` | `snapshot/count` | `number` |
| `aggregate<Row>(query)` | `snapshot/aggregation` | `Row[]` |
| `aggregateStream<Row>(query)` | `snapshot/aggregation` | SSE of `Row` |

All network query methods accept shared interceptor attributes as the second
argument and an `AbortController` as the third argument.

```ts
import {
  desc,
  filter,
  listQuery,
  projection,
  singleQuery,
} from '@ahoo-wang/fetcher-wow';

type CartListItem = Pick<CartState, 'status' | 'items'>;

const activeStates = await snapshots.listState<CartListItem>(
  listQuery<CartFields>({
    filter: filter.and([
      filter.ownerId('u-42'),
      filter.eq('state.status', 'ACTIVE'),
    ]),
    projection: projection({ include: ['state.status', 'state.items'] }),
    sort: [desc('snapshotTime')],
    limit: 50,
  }),
);

const oneSnapshot = await snapshots.single(
  singleQuery<CartFields>({
    filter: filter.aggregateId('cart-1'),
  }),
);
```

Use `single`/`list` when metadata such as version, owner, timestamps, tags, or
deletion state matters. Use the `*State` variants when the state value alone is
the application contract. Projection does not infer the method's return type;
pass `T` explicitly when the selected fields form a partial object.

### ID helpers

| Method | Behavior |
| --- | --- |
| `getById(id)` | Returns one full snapshot |
| `getStateById(id)` | Returns one state |
| `getByIds(ids)` | Returns full snapshots and short-circuits an empty array |
| `getStateByIds(ids)` | Returns states and short-circuits an empty array |

The helpers match Wow aggregate IDs. They are convenience methods over
`single`, `list`, `filter.aggregateId`, and `filter.aggregateIds`.

## Query builders and defaults

| Builder | Shape | Defaults |
| --- | --- | --- |
| `singleQuery()` | filter/condition, projection, sort | Legacy no-argument form uses match-all |
| `listQuery()` | filter/condition, projection, sort, limit | Filter form uses `limit: 0` (unlimited); legacy condition form uses `10` |
| `pagedQuery()` | filter/condition, projection, sort, pagination | Page `1`, size `10` |
| `pagination()` | `{ index, size }` | Page `1`, size `10` |
| `projection()` | `{ include?, exclude? }` | No projection restriction |
| `asc(field)`, `desc(field)` | `{ field, direction }` | Direction is explicit |

Prefer the `filter` property. The `condition` property and standalone
`Condition` builders are deprecated compatibility APIs.

### Cursor traversal

`cursorQuery()` turns a list query into an exclusive, single-field cursor
query. It adds `gt` for ascending traversal or `lt` for descending traversal
and replaces the query sort with the cursor field.

```ts
import {
  CURSOR_ID_START,
  SortDirection,
  cursorQuery,
  filter,
  listQuery,
} from '@ahoo-wang/fetcher-wow';

const page = await snapshots.list(
  cursorQuery<CartFields>({
    field: 'aggregateId',
    cursorId: CURSOR_ID_START,
    direction: SortDirection.DESC,
    query: listQuery({
      filter: filter.eq('state.status', 'ACTIVE'),
      limit: 100,
    }),
  }),
);

const nextCursor = page.at(-1)?.aggregateId;
```

Use the last returned cursor field as the next `cursorId`. Choose a stable,
unique field; the helper intentionally produces one cursor sort.
`CURSOR_ID_START` (`~`) is the start sentinel for the default descending
direction. An ascending traversal needs a domain-specific sentinel that sorts
below every real ID.

## `FilterExpression`

`filter` is the primary builder. It produces serializable discriminated unions
and validates malformed fields, empty operands, empty collection values,
supported enums, and relative-time option shapes before a request is sent.

| Family | Builders |
| --- | --- |
| Match | `matchAll`, `matchNone` |
| Metadata | `id`, `ids`, `aggregateId`, `aggregateIds`, `tenantId`, `ownerId`, `spaceId` |
| Logic | `and`, `or`, `nor` |
| Equality/comparison | `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between` |
| String | `contains`, `startsWith`, `endsWith` |
| Collection | `isIn`, `notIn`, `containsAll` |
| Presence | `isEmpty`, `isNull`, `isNotNull`, `exists`, `notExists` |
| Lifecycle | `deletion` with `DeletionState.ACTIVE`, `DELETED`, or `ALL` |
| Nested arrays | `elementMatch` |
| Search | `search` with optional fields and `SearchMode` |
| Relative time | `today`, `beforeToday`, `tomorrow`, week/month/year helpers, `recentDays`, `earlierDays` |

```ts
import {
  DeletionState,
  SearchMode,
  StringComparison,
  TimeUnit,
  filter,
} from '@ahoo-wang/fetcher-wow';

const cartFilter = filter.and<CartFields>([
  filter.deletion(DeletionState.ACTIVE),
  filter.contains(
    'state.status',
    'active',
    StringComparison.CASE_INSENSITIVE,
  ),
  filter.elementMatch('state.items',
    filter.and([
      filter.eq('productId', 'book-1'),
      filter.gt('quantity', 0),
    ]),
  ),
  filter.search('book', {
    fields: ['state.status'],
    mode: SearchMode.TERMS,
  }),
  filter.recentDays('snapshotTime', 30, {
    zoneId: 'Asia/Shanghai',
    timeUnit: TimeUnit.MILLISECONDS,
  }),
]);
```

Rules that commonly affect application code:

- `and`, `or`, `nor`, `ids`, `aggregateIds`, `isIn`, `notIn`, and
  `containsAll` require one non-empty readonly array.
- `eq` and `ne` accept JSON scalars, `null`, or an array of JSON scalars.
- Comparison and collection values cannot be `null` or non-finite numbers.
- `elementMatch` predicates use element-relative fields and cannot contain
  root metadata, deletion, or search filters.
- Snapshot state fields are normally addressed through `state.*`; metadata
  fields such as `aggregateId` and `snapshotTime` live at the root.
- Relative-time builders accept `zoneId`, `datePattern`, and `timeUnit`.
  The client validates offset-zone syntax, date-pattern shape, and `timeUnit`;
  the server performs final validation of named IANA zones.

## Aggregation

`AggregationQuery<ROOT_FIELDS, AGGREGATION_FIELDS>` separates root filter fields
from fields visible inside an element expansion.

| Property | Required | Meaning |
| --- | --- | --- |
| `filter` | No | Root-level `FilterExpression` |
| `elements` | No | Ordered parent-to-child array expansion chain |
| `groupBy` | No | Terms, numeric histogram, or date histogram groups |
| `metrics` | Yes | Non-empty tuple of count, numeric, or any-value metrics |
| `sort` | No | Sorts result rows, usually by an alias |
| `limit` | No | Maximum aggregation rows |

### Flat aggregation

```ts
import {
  type AggregationQuery,
  aggregation,
  desc,
  filter,
} from '@ahoo-wang/fetcher-wow';

type CartAggregationFields = 'state.status' | 'ownerId';
type CartSummary = {
  status: string;
  carts: number;
  sampleOwner: string;
};

const summaryQuery: AggregationQuery<
  CartFields,
  CartAggregationFields
> = {
  filter: filter.deletion(DeletionState.ACTIVE),
  groupBy: [aggregation.terms('state.status', 'status')],
  metrics: [
    aggregation.count('carts'),
    aggregation.any('ownerId', 'sampleOwner'),
  ],
  sort: [desc('carts')],
  limit: 20,
};

const summary = await snapshots.aggregate<CartSummary>(summaryQuery);
```

### Nested element aggregation

The first element path is relative to the snapshot root. Each later element
path, its predicate, group field, and metric field is relative to the current
innermost element.

```ts
type LineFields = 'sku' | 'quantity' | 'price';
type RevenueRow = { sku: string; lines: number; revenue: number };

const revenueQuery: AggregationQuery<CartFields, LineFields> = {
  filter: filter.eq('state.status', 'ACTIVE'),
  elements: [
    aggregation.element('state.orders', filter.eq('status', 'PAID')),
    aggregation.element('lines', filter.gt('quantity', 0)),
  ],
  groupBy: [aggregation.terms('sku', 'sku')],
  metrics: [
    aggregation.count('lines'),
    aggregation.sum(
      aggregation.multiply(
        aggregation.field('price'),
        aggregation.field('quantity'),
      ),
      'revenue',
    ),
  ],
  sort: [desc('revenue')],
  limit: 20,
};

const revenue = await snapshots.aggregate<RevenueRow>(revenueQuery);
```

### Aggregation builders

| Builder | Output |
| --- | --- |
| `element(path, predicate?)` | One element-expansion step |
| `terms(field, alias)` | Exact-value group |
| `histogram(field, { interval, alias })` | Numeric buckets; interval must be greater than zero |
| `dateHistogram(field, { unit, alias, timeZone? })` | Calendar buckets; default time zone is `UTC` |
| `field`, `constant` | Expression leaves |
| `add`, `subtract`, `multiply`, `divide` | Binary numeric expressions |
| `count(alias)` | Row count |
| `any(field, alias)` | Any representative field value |
| `sum`, `avg`, `min`, `max` | Numeric expression metrics |

Aliases must be one non-empty field segment and cannot start with the reserved
`__wow` prefix. Constants must be finite numbers.

To stream large result sets, replace `aggregate` with `aggregateStream` and
iterate `event.data`:

```ts
const controller = new AbortController();
const rows = await snapshots.aggregateStream<RevenueRow>(
  revenueQuery,
  undefined,
  controller,
);

for await (const event of rows) {
  console.log(event.data);
}
```

## Domain-event queries

`EventStreamQueryClient<E, FIELDS>` uses the same filter, projection, sort,
pagination, attributes, and cancellation conventions as snapshot queries.

| Method | Endpoint | Return |
| --- | --- | --- |
| `list(query)` | `event/list` | `DomainEventStream<E>[]` |
| `listStream(query)` | `event/list` | SSE of `DomainEventStream<E>` |
| `paged(query)` | `event/paged` | `PagedList<DomainEventStream<E>>` |
| `count(filter)` | `event/count` | `number` |

A `DomainEventStream` contains aggregate, owner, space, command, request,
version, timestamp, header, and event-body data. Event metadata field constants
are available through `DomainEventStreamMetadataFields`.

```ts
import { pagedQuery, pagination } from '@ahoo-wang/fetcher-wow';

const eventPage = await events.paged(
  pagedQuery({
    filter: filter.aggregateId('cart-1'),
    pagination: pagination({ index: 1, size: 20 }),
    sort: [desc('version')],
  }),
);
```

There is no `single` event-stream method; event streams are collection
resources.

## Historical state loading

| Client | Method | Endpoint below `basePath` |
| --- | --- | --- |
| `LoadStateAggregateClient` | `load(id)` | `{id}/state` |
| `LoadStateAggregateClient` | `loadVersioned(id, version)` | `{id}/state/{version}` |
| `LoadStateAggregateClient` | `loadTimeBased(id, createTime)` | `{id}/state/time/{createTime}` |
| `LoadOwnerStateAggregateClient` | `load()` | `state` |
| `LoadOwnerStateAggregateClient` | `loadVersioned(version)` | `state/{version}` |
| `LoadOwnerStateAggregateClient` | `loadTimeBased(createTime)` | `state/time/{createTime}` |

`createTime` is a numeric timestamp expected by the Wow endpoint. All methods
accept attributes followed by an optional `AbortController`.

## Return shapes

| Type | Key fields |
| --- | --- |
| `MaterializedSnapshot<S>` | `state`, aggregate identity, tenant/owner/space, version, event and snapshot times, operators, tags, deletion state |
| `PagedList<T>` | `total`, `list` |
| `DomainEventStream<E>` | aggregate identity, owner/space, command/request IDs, `version`, `header`, `body`, `createTime` |
| `CommandResult` | wait stage, aggregate version, error information, command result, signal metadata |

Use `SnapshotMetadataFields` and `DomainEventStreamMetadataFields` when a UI or
query builder needs stable metadata field names.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| URL still contains `{ownerId}` or `{tenantId}` | Bind the value in `apiMetadata.urlParams.path` or `request.urlParams.path` |
| `listQuery({ filter })` returns more rows than expected | Filter-based list queries default to `limit: 0`; set an explicit limit |
| State filter matches nothing | Snapshot state fields normally require the `state.` prefix |
| `elementMatch` throws before sending | Keep root metadata, deletion, and search filters outside the element predicate |
| Logical or collection builder throws | Pass one non-empty array, for example `filter.and([a, b])` |
| Command returned but the operation failed | Test `ErrorCodes.isError(result.errorCode)` and inspect `bindingErrors` |
| SSE method cannot be consumed | Install the event-stream peer dependency and iterate the returned stream with `for await` |
| UI request must cancel stale work | Pass an `AbortController` as the third query argument, then call `abort()` |

## Source references

- [`packages/wow/src/index.ts:14`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/index.ts#L14)
- [`packages/wow/src/query/snapshot/snapshotQueryClient.ts:121`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/snapshot/snapshotQueryClient.ts#L121)
- [`packages/wow/src/query/filter.ts:582`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/filter.ts#L582)
- [`packages/wow/src/query/aggregation.ts:210`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L210)
- [`skills/fetcher-wow-cqrs/references/api.md:1`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-wow-cqrs/references/api.md#L1)
- [Fetcher Wow skill](../skills/react-and-integrations.md#fetcher-wow-cqrs)
