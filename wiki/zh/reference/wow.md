---
title: Wow 参考
description: 发送 Wow 命令，并构建类型化快照、事件、过滤、分页与聚合查询。
---

# `@ahoo-wang/fetcher-wow`

Wow 集成把 Wow 命令和查询 HTTP 契约映射为类型化 Fetcher 客户端。它只适用于暴露
Wow 端点的服务端。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-wow
```

## 命令

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

`CommandClient.send(request, attributes?)` 等待 `CommandResult`。
`sendAndWaitStream()` 接收相同请求并返回命令结果 SSE 事件。端点应写入 `request.path`。

## 查询与过滤

`SnapshotQueryClient` 查询物化快照；`EventStreamQueryClient` 流式读取领域事件；
`QueryClientFactory` 从共享 bounded-context 和聚合元数据创建快照、事件与状态客户端。

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

`filter` 是主要 `FilterExpression` 构建器。集合和逻辑操作符接收一个非空 readonly
数组，并在请求前校验。旧 `Condition` 构建器仍适用于显式要求 `Condition` 的组件 API。

## 查询形状

| 构建器                                            | 结果                         |
| ------------------------------------------------- | ---------------------------- |
| `singleQuery()`                                   | 一个匹配文档                 |
| `listQuery()`                                     | 有界列表                     |
| `pagedQuery()`                                    | 带分页信息的 `PagedList<T>`  |
| `cursorQuery()`                                   | 稳定游标遍历                 |
| `pagination()`、`projection()`、`asc()`、`desc()` | 可复用查询部分               |
| `aggregation`                                     | 分组、表达式、指标与嵌套元素 |

包还导出元数据、建模、消息、ABAC、命令结果、快照和领域事件类型，供生成客户端和应用
契约使用。

参阅[构建 Wow CQRS 客户端](../recipes/wow-cqrs.md)，了解流式查询和嵌套聚合。
