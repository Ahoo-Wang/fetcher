---
title: Wow 参考
description: 发送 Wow 命令，并构建类型化快照、事件、过滤、分页与聚合查询。
pageClass: reference-page
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

## Client 导航

| Client                              | 主要任务                                                        |
| ----------------------------------- | --------------------------------------------------------------- |
| `CommandClient<C>`                  | 发送命令，或等待命令结果 SSE Stage                              |
| `SnapshotQueryClient<S, FIELDS>`    | Single、List、Paged、Count、Cursor、Stream 与 Aggregation Query |
| `EventStreamQueryClient<E, FIELDS>` | 查询和流式读取领域事件                                          |
| `LoadStateAggregateClient<S>`       | 按 Aggregate ID 加载聚合状态                                    |
| `LoadOwnerStateAggregateClient<S>`  | 按 Owner-scoped Route 加载状态                                  |
| `QueryClientFactory`                | 根据共享 `ApiMetadata` 构建相关 Client                          |

所有构造函数都消费 `ApiMetadata` 形状的配置。`{ownerId}` 等路由参数放入
`urlParams.path`；未解析 Placeholder 属于请求构造错误，不是服务端 Query。

## FilterExpression 家族

| 家族   | 代表 Builder                                                  |
| ------ | ------------------------------------------------------------- |
| 比较   | `eq`、`ne`、`gt`、`gte`、`lt`、`lte`、`between`               |
| 字符串 | `contains`、`startsWith`、`endsWith`，可传 `StringComparison` |
| 集合   | `isIn`、`notIn`、`containsAll`、`elementMatch`                |
| 存在性 | `isEmpty`、Null/Exists 检查、`search`、相对时间 Builder       |
| 逻辑   | `and`、`or`、`nor`，都会校验 Operand 形状                     |

数组优先 Builder 接收一个 Readonly Tuple 或 Array，让嵌套表达式可组合，并在网络请求
前完成校验。

## Aggregation 契约

Aggregation Query 包含可选的有序 `elements`、可选 `filter`、`groupBy`、一个或多个
`metrics`、可选 Sort 和 Limit。`TERMS`、`HISTOGRAM`、`DATE_HISTOGRAM` 负责分组；
`COUNT` 与 `NUMERIC` 产生指标。

处理嵌套数组时，第一个 Element Path 相对 Snapshot Root。后续 Element Path、Filter、
Group Field 和 Metric Field 都相对当前最内层 Element。示例必须明确展示作用域变化。

## 源码与 Agent 参考

- 公共导出：[`packages/wow/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/index.ts)
- Agent 精确 API：[`skills/fetcher-wow-cqrs/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-wow-cqrs/references/api.md)
- Skill：[`$fetcher-wow-cqrs`](../skills/react-and-integrations.md#fetcher-wow-cqrs)

参阅[构建 Wow CQRS 客户端](../recipes/wow-cqrs.md)，了解流式查询和嵌套聚合。
