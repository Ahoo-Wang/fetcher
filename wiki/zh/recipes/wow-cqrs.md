---
title: 构建 Wow CQRS 客户端
description: 发送 Wow 命令，并通过类型筛选、分页、流和聚合查询物化快照。
---

# 构建 Wow CQRS 客户端

服务端暴露 Wow 命令与查询契约时，使用 `@ahoo-wang/fetcher-wow`。将聚合根 Base Path 保存在客户端元数据中，不要在每次调用重复。

## 配置客户端

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

## 发送命令

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

`sendAndWaitStream()` 接受相同请求并返回命令结果 SSE 事件。

## 使用 FilterExpression 查询

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

`and`、`or`、`ids`、`aggregateIds`、`isIn`、`notIn`、`containsAll` 等数组优先 Builder 接受一个非空 readonly 数组。空数组会在请求前抛出 `TypeError`。

## 流式查询结果

```ts
for await (const event of await snapshots.listStateStream(
  listQuery({ filter: active, limit: 0 }),
)) {
  console.log(event.data.items);
}
```

所有者必须能取消流时，向查询客户端方法传递 AbortController 参数。

## 聚合嵌套状态

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

`state.items` 成为活动 Element 后，`productId` 与 `quantity` 均相对该 Element。Metrics 必须非空。Alias 只能包含一个 Segment，且不能使用保留的 `__wow` 前缀。

## React

`@ahoo-wang/fetcher-react` 提供 Single、List、Paged、Count 和 List Stream Hooks，包装相同查询客户端。Filter 和 Pagination 保持在共享领域代码中，让 Hook 管理加载、结果、错误、重载与取消。
