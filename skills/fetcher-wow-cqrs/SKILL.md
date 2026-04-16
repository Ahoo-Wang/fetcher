---
name: fetcher-wow-cqrs
description: Use Wow CQRS/DDD patterns with Fetcher. Use when users mention Wow, CQRS, DDD, commands, queries, aggregates, command client, query client, or domain-driven design.
---

# fetcher-wow-cqrs

Skill for working with the Wow framework's CQRS (Command Query Responsibility Segregation) and DDD (Domain-Driven Design) patterns in Fetcher.

## Trigger Conditions

This skill activates when:
- User mentions **Wow**, **CQRS**, **DDD**, **commands**, or **queries**
- User wants **aggregate**, **command client**, or **query client**
- User asks about **domain-driven design patterns**
- User references **event sourcing** or **domain events**

## Core Concepts

### Wow Framework Architecture

The Wow framework implements CQRS + Event Sourcing + DDD:
- **Commands** - Write operations that modify aggregate state
- **Queries** - Read operations that retrieve snapshot or event data
- **Aggregates** - Domain entities that maintain state and enforce invariants
- **Events** - Immutable records of state changes

### Package

```typescript
import '@ahoo-wang/fetcher-eventstream'; // Required for SSE streaming
import {
  CommandClient,
  CommandRequest,
  CommandResult,
  CommandStage,
  CommandHttpHeaders,
  HttpMethod,
  SnapshotQueryClient,
  EventStreamQueryClient,
  QueryClientFactory,
  // Condition builders
  and, or, eq, ne, gt, lt, gte, lte,
  contains, isIn, notIn, between, allIn,
  startsWith, endsWith, match, elemMatch,
  isNull, notNull, isTrue, isFalse, exists,
  today, beforeToday, tomorrow, thisWeek, nextWeek, lastWeek,
  thisMonth, lastMonth, recentDays, earlierDays,
  active, all, deleted,
  id, ids, aggregateId, aggregateIds, tenantId, ownerId,
} from '@ahoo-wang/fetcher-wow';
```

---

## CommandClient

Sends commands to modify aggregate state.

### Setup

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import '@ahoo-wang/fetcher-eventstream';
import { CommandClient, CommandRequest, HttpMethod, CommandHttpHeaders, CommandStage } from '@ahoo-wang/fetcher-wow';

const fetcher = new Fetcher({
  baseURL: 'http://localhost:8080/',
});

const commandClient = new CommandClient({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});
```

### CommandClient.send()

Sends a command and waits for the result.

```typescript
// Define command payload
interface AddCartItem {
  productId: string;
  quantity: number;
}

type AddCartItemCommand = CommandRequest<AddCartItem>;

// Build command request
const command: AddCartItemCommand = {
  method: HttpMethod.POST,
  headers: {
    [CommandHttpHeaders.WAIT_STAGE]: CommandStage.SNAPSHOT, // Wait for snapshot
  },
  body: {
    productId: 'product-123',
    quantity: 2,
  },
};

// Send command and wait for result
const result = await commandClient.send('add_cart_item', command);
console.log(result); // CommandResult
```

**CommandStage options:**
- `CommandStage.EVENT` - Wait for event to be persisted
- `CommandStage.SNAPSHOT` - Wait for snapshot to be updated

### CommandClient.sendAndWaitStream()

Sends a command and receives results as a stream of SSE events.

```typescript
const stream = await commandClient.sendAndWaitStream('add_cart_item', command);

for await (const event of stream) {
  console.log('Stage:', event.stage);
  console.log('Data:', event.data);
  if (event.type === 'complete') {
    console.log('Command completed');
  }
}
```

---

## SnapshotQueryClient

Queries materialized snapshots (current state of aggregates).

### Setup

```typescript
import { SnapshotQueryClient, all, ListQuery, PagedQuery, SingleQuery } from '@ahoo-wang/fetcher-wow';

const snapshotClient = new SnapshotQueryClient<CartState>({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});
```

### Methods

#### count(condition)

Count snapshots matching a condition.

```typescript
const count = await snapshotClient.count(all());
```

#### list(listQuery)

Retrieve a list of materialized snapshots.

```typescript
const list = await snapshotClient.list({
  condition: all(),
  sort: [{ field: 'eventTime', order: 'desc' }],
  limit: 10,
});
```

#### listStream(listQuery)

Retrieve snapshots as a stream of SSE events.

```typescript
const stream = await snapshotClient.listStream({
  condition: all(),
});

for await (const event of stream) {
  console.log('Snapshot:', event.data);
}
```

#### listState(listQuery)

Retrieve only the state (not metadata) as a list.

```typescript
const states = await snapshotClient.listState({
  condition: all(),
});
```

#### listStateStream(listQuery)

Retrieve states as a stream of SSE events.

```typescript
const stream = await snapshotClient.listStateStream({
  condition: all(),
});
```

#### paged(pagedQuery)

Retrieve a paged list of snapshots.

```typescript
const paged = await snapshotClient.paged({
  condition: all(),
  page: 1,
  size: 20,
  sort: [{ field: 'createdAt', order: 'desc' }],
});
// Returns: { items: [...], total: number, page: number, size: number }
```

#### pagedState(pagedQuery)

Retrieve a paged list of states.

```typescript
const paged = await snapshotClient.pagedState({
  condition: all(),
  page: 1,
  size: 20,
});
```

#### single(singleQuery)

Retrieve a single snapshot.

```typescript
const snapshot = await snapshotClient.single({
  condition: eq('id', 'cart-123'),
});
```

#### singleState(singleQuery)

Retrieve a single state.

```typescript
const state = await snapshotClient.singleState({
  condition: eq('id', 'cart-123'),
});
```

---

## EventStreamQueryClient

Queries domain event streams (event history).

### Setup

```typescript
import { EventStreamQueryClient, all, ListQuery, PagedQuery } from '@ahoo-wang/fetcher-wow';

const eventClient = new EventStreamQueryClient({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
});
```

### Methods

#### count(condition)

Count event streams matching a condition.

```typescript
const count = await eventClient.count(all());
```

#### list(listQuery)

Retrieve a list of domain event streams.

```typescript
const events = await eventClient.list({
  condition: all(),
});
```

#### listStream(listQuery)

Retrieve event streams as a stream of SSE events.

```typescript
const stream = await eventClient.listStream({
  condition: all(),
});

for await (const event of stream) {
  console.log('Event:', event.data);
}
```

#### paged(pagedQuery)

Retrieve a paged list of event streams.

```typescript
const paged = await eventClient.paged({
  condition: all(),
  page: 1,
  size: 20,
});
```

---

## Query DSL Conditions

Build complex query conditions using the condition builder.

### Import

```typescript
import {
  and, or, nor,
  eq, ne, gt, lt, gte, lte,
  contains, startsWith, endsWith, match,
  isIn, notIn, allIn, elemMatch,
  isNull, notNull, isTrue, isFalse, exists,
  today, beforeToday, tomorrow,
  thisWeek, nextWeek, lastWeek,
  thisMonth, lastMonth,
  recentDays, earlierDays,
  active, all, deleted,
  id, ids, aggregateId, aggregateIds, tenantId, ownerId,
  raw,
} from '@ahoo-wang/fetcher-wow';
```

### Comparison Operators

```typescript
eq('status', 'active')       // Equal
ne('status', 'inactive')    // Not equal
gt('age', 18)               // Greater than
lt('score', 100)            // Less than
gte('rating', 4.0)         // Greater than or equal
lte('price', 100)          // Less than or equal
between('salary', 50000, 100000)  // Between two values
```

### String Operators

```typescript
contains('email', '@company.com')  // Contains substring
startsWith('username', 'j')       // Starts with prefix
endsWith('domain', '.com')         // Ends with suffix
match('description', 'keywords')  // Full-text search
```

### Collection Operators

```typescript
isIn('status', 'active', 'pending', 'review')  // In list
notIn('role', 'guest', 'banned')              // Not in list
allIn('tags', 'react', 'typescript')          // Contains all values
elemMatch('items', eq('quantity', 0))         // Array element matches
```

### Null/Boolean Operators

```typescript
isNull('deletedAt')     // Is null
notNull('email')        // Is not null
isTrue('isActive')      // Is true
isFalse('isDeleted')    // Is false
exists('phoneNumber')   // Field exists
```

### Date Operators

```typescript
today('createdAt')             // Is today
beforeToday('lastLogin', 7)   // Within last N days
tomorrow('scheduledDate')     // Is tomorrow
thisWeek('updatedAt')         // Within this week
nextWeek('startDate')         // Within next week
lastWeek('endDate')           // Within last week
thisMonth('createdDate')      // Within this month
lastMonth('expirationDate')   // Within last month
recentDays('createdAt', 5)    // Last N days (including today)
earlierDays('createdAt', 3)   // More than N days ago
```

### ID Operators

```typescript
id('abc-123')                    // By ID
ids('abc-123', 'def-456')        // By multiple IDs
aggregateId('agg-789')           // By aggregate ID
aggregateIds('agg-1', 'agg-2')  // By multiple aggregate IDs
tenantId('tenant-abc')           // By tenant ID
ownerId('owner-123')             // By owner ID
```

### State Operators

```typescript
active()   // Not deleted
deleted()  // Is deleted
all()      // All (no filter)
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
)
```

### Special Operators

```typescript
// Raw condition for advanced queries
raw({ $text: { $search: 'keywords' } })
```

---

## QueryClientFactory

Factory for creating pre-configured typed query clients.

### Setup

```typescript
import { QueryClientFactory, ResourceAttributionPathSpec } from '@ahoo-wang/fetcher-wow';

const factory = new QueryClientFactory({
  contextAlias: 'example',
  aggregateName: 'cart',
  resourceAttribution: ResourceAttributionPathSpec.OWNER,
  fetcher,
});
```

### ResourceAttributionPathSpec Options

- `ResourceAttributionPathSpec.TENANT` - Path: `/tenant/{tenantId}/...`
- `ResourceAttributionPathSpec.OWNER` - Path: `/owner/{ownerId}/...`
- `ResourceAttributionPathSpec.TENANT_AND_OWNER` - Path: `/tenant/{tenantId}/owner/{ownerId}/...`

### Methods

#### createSnapshotQueryClient()

```typescript
const snapshotClient = factory.createSnapshotQueryClient();
const carts = await snapshotClient.listState({ condition: all() });
```

#### createLoadStateAggregateClient()

Load aggregate state by ID.

```typescript
const stateClient = factory.createLoadStateAggregateClient();
const cart = await stateClient.load('cart-123');
```

#### createOwnerLoadStateAggregateClient()

Load current owner's aggregate state.

```typescript
const ownerClient = factory.createOwnerLoadStateAggregateClient();
const cart = await ownerClient.load('cart-123');
```

#### createEventStreamQueryClient()

```typescript
const eventClient = factory.createEventStreamQueryClient();
const events = await eventClient.list({ condition: all() });
```

---

## Real-time Updates with SSE

### Streaming Command Results

```typescript
const stream = await commandClient.sendAndWaitStream('add_cart_item', command);

for await (const event of stream) {
  console.log(event.stage);  // CommandStage
  console.log(event.data);   // Result data
  if (event.type === 'complete') break;
}
```

### Streaming Query Results

```typescript
// Stream snapshot updates
const snapshotStream = await snapshotClient.listStream({
  condition: all(),
});

for await (const event of snapshotStream) {
  console.log('Snapshot updated:', event.data);
}

// Stream event stream updates
const eventStream = await eventClient.listStream({
  condition: all(),
});

for await (const event of eventStream) {
  console.log('New event:', event.data);
}
```

---

## Generated Clients

When using `@ahoo-wang/fetcher-generator`, clients are auto-generated:

### Command Client

```typescript
import { cartCommandClient, CartCommandEndpointPaths } from './generated/example/cart/commandClient';

// Using auto-generated client
await cartCommandClient.addCartItem({
  method: HttpMethod.POST,
  body: { productId: 'prod-1', quantity: 1 },
});

// Streaming version
import { cartStreamCommandClient } from './generated/example/cart/commandClient';

const stream = await cartStreamCommandClient.addCartItem({
  method: HttpMethod.POST,
  body: { productId: 'prod-1', quantity: 1 },
});
```

### Query Client Factory

```typescript
import { cartQueryClientFactory } from './generated/example/cart/queryClient';

// Create typed clients
const snapshotClient = cartQueryClientFactory.createSnapshotQueryClient();
const eventClient = cartQueryClientFactory.createEventStreamQueryClient();
const stateClient = cartQueryClientFactory.createLoadStateAggregateClient();
```

---

## Example: Complete Cart Flow

```typescript
import { Fetcher } from '@ahoo-wang/fetcher';
import '@ahoo-wang/fetcher-eventstream';
import {
  CommandClient,
  SnapshotQueryClient,
  CommandRequest,
  HttpMethod,
  CommandHttpHeaders,
  CommandStage,
  and,
  eq,
  all,
} from '@ahoo-wang/fetcher-wow';

// Setup
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
const result = await commandClient.send('add_cart_item', {
  method: HttpMethod.POST,
  headers: { [CommandHttpHeaders.WAIT_STAGE]: CommandStage.SNAPSHOT },
  body: { productId: 'prod-123', quantity: 2 },
});

// Query updated state
const cart = await snapshotClient.singleState({
  condition: eq('id', result.aggregateId),
});

console.log('Cart:', cart.state);

// Stream real-time updates
const stream = await snapshotClient.listStateStream({
  condition: eq('id', result.aggregateId),
});

for await (const event of stream) {
  console.log('Cart updated:', event.data);
}
```

---

## Key Dependencies

- `@ahoo-wang/fetcher` - Core HTTP client
- `@ahoo-wang/fetcher-eventstream` - SSE streaming support (required)
- `@ahoo-wang/fetcher-wow` - Wow CQRS/DDD types and clients
- `@ahoo-wang/fetcher-cosec` - ID generation (`idGenerator`)
