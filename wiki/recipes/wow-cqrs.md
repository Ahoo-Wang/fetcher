---
title: Build a Wow CQRS Client
description: Send Wow commands and query materialized snapshots with typed filters, pagination, streaming, and aggregation.
---

# Build a Wow CQRS Client

Use `@ahoo-wang/fetcher-wow` when the server exposes Wow command and query contracts. Keep aggregate base paths in client metadata rather than repeating them.

## Configure clients

```ts
import { Fetcher, HttpMethod } from '@ahoo-wang/fetcher';
import type { ApiMetadata } from '@ahoo-wang/fetcher-decorator';
import {
  CommandClient,
  CommandHeaders,
  CommandStage,
  SnapshotQueryClient,
} from '@ahoo-wang/fetcher-wow';

interface AddCartItem {
  productId: string;
  quantity: number;
}

interface CartState {
  status: 'ACTIVE' | 'CHECKED_OUT';
  items: Array<{ productId: string; quantity: number }>;
}

const wowFetcher = new Fetcher({ baseURL: 'https://wow.example.com' });
const clientMetadata: ApiMetadata = {
  fetcher: wowFetcher,
  basePath: 'owner/{ownerId}/cart',
  urlParams: { path: { ownerId: 'user-42' } },
};

const commands = new CommandClient<AddCartItem>(clientMetadata);
const snapshots = new SnapshotQueryClient<CartState>(clientMetadata);
```

## Send a command

```ts
const result = await commands.send({
  path: 'add_cart_item',
  method: HttpMethod.POST,
  headers: {
    [CommandHeaders.WAIT_STAGE]: CommandStage.SNAPSHOT,
  },
  body: { productId: 'book-1', quantity: 2 },
});

console.log(result.aggregateId, result.stage, result.errorCode);
```

`sendAndWaitStream()` accepts the same request and returns command-result SSE events.

## Query with FilterExpression

```ts
import { filter, listQuery, pagedQuery } from '@ahoo-wang/fetcher-wow';

const active = filter.and([
  filter.ownerId('user-42'),
  filter.eq('state.status', 'ACTIVE'),
]);

const list = await snapshots.list(listQuery({ filter: active, limit: 50 }));

const page = await snapshots.pagedState(
  pagedQuery({
    filter: active,
    pagination: { index: 1, size: 20 },
  }),
);
```

Array-first builders such as `and`, `or`, `ids`, `aggregateIds`, `isIn`, `notIn`, and `containsAll` require one non-empty readonly array. An empty array throws `TypeError` before the request.

## Stream query results

```ts
for await (const event of await snapshots.listStateStream(
  listQuery({ filter: active, limit: 0 }),
)) {
  console.log(event.data.items);
}
```

Use an AbortController parameter on query-client methods when the owner must cancel the stream.

## Aggregate nested state

```ts
import { aggregation } from '@ahoo-wang/fetcher-wow';

const rows = await snapshots.aggregate({
  filter: active,
  elements: [aggregation.element('state.items')],
  groupBy: [aggregation.terms('productId', 'productId')],
  metrics: [
    aggregation.count('cartCount'),
    aggregation.sum(aggregation.field('quantity'), 'quantity'),
  ],
});
```

After `state.items` becomes the active element, `productId` and `quantity` are relative to that element. Metrics must be non-empty. Aliases contain one segment and cannot start with the reserved `__wow` prefix.

## React

`@ahoo-wang/fetcher-react` exposes single, list, paged, count, and list-stream hooks that wrap the same query clients. Keep filters and pagination in shared domain code; let the hook manage loading, result, error, reload, and cancellation.
