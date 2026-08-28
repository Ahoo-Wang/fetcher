---
title: Wow reference
description: Send Wow commands and build typed snapshot, event, filter, pagination, and aggregation queries.
pageClass: reference-page
---

# `@ahoo-wang/fetcher-wow`

The Wow integration maps Wow command and query HTTP contracts to typed Fetcher
clients. Use it only against a server that exposes Wow endpoints.

## Install

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-wow
```

## Commands

```ts
import { Fetcher, HttpMethod } from '@ahoo-wang/fetcher';
import {
  CommandClient,
  CommandHeaders,
  CommandStage,
} from '@ahoo-wang/fetcher-wow';

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
const commands = new CommandClient<{ productId: string }>({
  fetcher,
  basePath: 'owner/{ownerId}/cart',
  urlParams: { path: { ownerId: 'u-42' } },
});

const result = await commands.send({
  path: 'add_item',
  method: HttpMethod.POST,
  headers: { [CommandHeaders.WAIT_STAGE]: CommandStage.SNAPSHOT },
  body: { productId: 'book-1' },
});
```

`CommandClient.send(request, attributes?)` waits for a `CommandResult`.
`sendAndWaitStream()` accepts the same request and returns command-result SSE
events. The endpoint belongs in `request.path`.

## Queries and filters

`SnapshotQueryClient` queries materialized snapshots. `EventStreamQueryClient`
streams domain events. `QueryClientFactory` creates snapshot, event, and state
clients from shared bounded-context and aggregate metadata.

```ts
import { filter, listQuery } from '@ahoo-wang/fetcher-wow';

const query = listQuery({
  filter: filter.and([
    filter.ownerId('u-42'),
    filter.eq('state.status', 'ACTIVE'),
  ]),
  limit: 50,
});
```

`filter` is the primary `FilterExpression` builder. Collection and logical
operators accept one non-empty readonly array and validate before the request.
The older `Condition` builders remain useful where a component API explicitly
requires `Condition`.

## Query shapes

| Builder                                           | Result                                            |
| ------------------------------------------------- | ------------------------------------------------- |
| `singleQuery()`                                   | One matching document                             |
| `listQuery()`                                     | Bounded list                                      |
| `pagedQuery()`                                    | `PagedList<T>` with pagination                    |
| `cursorQuery()`                                   | Stable cursor traversal                           |
| `pagination()`, `projection()`, `asc()`, `desc()` | Reusable query parts                              |
| `aggregation`                                     | Groups, expressions, metrics, and nested elements |

Metadata, modeling, messaging, ABAC, command result, snapshot, and domain-event
types are also exported for generated clients and application contracts.

## Client map

| Client                              | Primary job                                                         |
| ----------------------------------- | ------------------------------------------------------------------- |
| `CommandClient<C>`                  | Send a command or wait for command-result SSE stages                |
| `SnapshotQueryClient<S, FIELDS>`    | Single, list, paged, count, cursor, stream, and aggregation queries |
| `EventStreamQueryClient<E, FIELDS>` | Query and stream domain events                                      |
| `LoadStateAggregateClient<S>`       | Load aggregate state by aggregate ID                                |
| `LoadOwnerStateAggregateClient<S>`  | Load state by owner-scoped route                                    |
| `QueryClientFactory`                | Build related clients from shared `ApiMetadata`                     |

All constructors consume `ApiMetadata`-shaped configuration. Put route
parameters such as `{ownerId}` in `urlParams.path`; unresolved placeholders are
a request-construction error, not a server-side query.

## Filter expression families

| Family     | Representative builders                                               |
| ---------- | --------------------------------------------------------------------- |
| Comparison | `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `between`                       |
| String     | `contains`, `startsWith`, `endsWith` with optional `StringComparison` |
| Collection | `isIn`, `notIn`, `containsAll`, `elementMatch`                        |
| Presence   | `isEmpty`, null/existence checks, `search`, relative-time builders    |
| Logic      | `and`, `or`, `nor`, each validating its operand shape                 |

Array-first builders accept one readonly tuple or array. This keeps nested
expressions composable and allows validation before a network request.

## Aggregation contract

An aggregation query contains optional ordered `elements`, optional `filter`,
`groupBy`, one or more `metrics`, optional sort, and a limit. `TERMS`,
`HISTOGRAM`, and `DATE_HISTOGRAM` group values; `COUNT` and `NUMERIC` produce
metrics.

For nested arrays, the first element path is relative to snapshot root. Later
element paths, filters, group fields, and metric fields are relative to the
current innermost element. Make that change of scope visible in examples.

## Source and agent reference

- Public exports: [`packages/wow/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/index.ts)
- Detailed agent API: [`skills/fetcher-wow-cqrs/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-wow-cqrs/references/api.md)
- Skill: [`$fetcher-wow-cqrs`](../skills/react-and-integrations.md#fetcher-wow-cqrs)

See [Build a Wow CQRS client](../recipes/wow-cqrs.md) for streaming and nested
aggregation examples.
