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
import '@ahoo-wang/fetcher-eventstream'; // Required side-effect import for SSE
import { ContentTypeValues, HttpMethod } from '@ahoo-wang/fetcher';
import {
  // Command
  CommandClient,
  CommandRequest,
  CommandResult,
  CommandBody,
  CommandHeaders,
  CommandStage,
  // Query clients
  SnapshotQueryClient,
  EventStreamQueryClient,
  QueryClientFactory,
  LoadStateAggregateClient,
  LoadOwnerStateAggregateClient,
  // Types
  MaterializedSnapshot,
  PagedList,
  ListQuery,
  PagedQuery,
  SingleQuery,
  ResourceAttributionPathSpec,
  // Condition builders
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
  id,
  ids,
  aggregateId,
  aggregateIds,
  tenantId,
  ownerId,
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

Key fields: `id`, `waitCommandId`, `stage`, `contextAlias`, `contextName`, `aggregateName`, `aggregateId`, `aggregateVersion?`, `commandId`, `requestId`, `errorCode`, `errorMsg`, `signalTime`, `result`.

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
const count: number = await snapshotClient.count(all());

// List snapshots (returns MaterializedSnapshot<S>[])
const list = await snapshotClient.list({
  condition: all(),
  sort: [{ field: 'eventTime', direction: 'desc' }],
  limit: 10,
});

// List snapshots as SSE stream
const stream = await snapshotClient.listStream({ condition: all() });
for await (const event of stream) {
  console.log(event.data);
}

// List only state objects (returns S[])
const states = await snapshotClient.listState({ condition: all() });

// List states as SSE stream
const stateStream = await snapshotClient.listStateStream({ condition: all() });

// Paged snapshots (returns PagedList<MaterializedSnapshot<S>>)
const paged = await snapshotClient.paged({
  condition: all(),
  pagination: { index: 1, size: 20 },
});
// PagedList: { total: number, list: T[] }

// Paged states (returns PagedList<S>)
const pagedState = await snapshotClient.pagedState({
  condition: all(),
  pagination: { index: 1, size: 20 },
});

// Single snapshot
const snapshot = await snapshotClient.single({
  condition: aggregateId('cart-123'),
});

// Single state
const state = await snapshotClient.singleState({
  condition: aggregateId('cart-123'),
});
```

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
const count = await eventClient.count(all());
const list = await eventClient.list({ condition: all() });
const stream = await eventClient.listStream({ condition: all() });
const paged = await eventClient.paged({
  condition: all(),
  pagination: { index: 1, size: 20 },
});
```

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

## Query DSL Conditions

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
beforeToday('lastLogin', 7); // Within last N days
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
active(); // Not deleted (shorthand for deleted(DeletionState.ACTIVE))
deleted(DeletionState.DELETED); // Is deleted
all(); // No filter (shorthand for deleted(DeletionState.ALL))
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
  aggregateId,
  all,
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
  condition: aggregateId(result.aggregateId),
});
for await (const event of stream) {
  console.log('Cart updated:', event.data);
}
```

---

## Key Dependencies

- `@ahoo-wang/fetcher` - Core HTTP client
- `@ahoo-wang/fetcher-eventstream` - SSE streaming support (required side-effect import)
- `@ahoo-wang/fetcher-decorator` - ApiMetadata type, decorators for auto-implemented methods
- `@ahoo-wang/fetcher-wow` - Wow CQRS/DDD types and clients
