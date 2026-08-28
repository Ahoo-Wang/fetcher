---
title: Wow 参考
description: Wow 命令、类型化快照与事件查询、过滤、游标、聚合和状态加载的完整参考。
pageClass: reference-page
---

# `@ahoo-wang/fetcher-wow`

`@ahoo-wang/fetcher-wow` 把 Wow 的命令和查询 HTTP 契约映射为类型化 Fetcher
客户端。生成的 Wow 客户端和直接调用 Wow 端点的应用都以这个底层包为基础。

需要完整上手流程时阅读 [Wow CQRS 实战](../recipes/wow-cqrs.md)；需要查找准确的
Client、方法、查询结构、默认值或返回类型时使用本页。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator \
  @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-wow
```

前三个包是 Peer Dependency。流式方法使用 EventStream 包解码 JSON Server-Sent
Events。

## 选择 Client

| 目标 | Client | 主要方法 |
| --- | --- | --- |
| 发送命令 | `CommandClient<C>` | `send`、`sendAndWaitStream` |
| 查询物化快照 | `SnapshotQueryClient<S, FIELDS>` | `single`、`list`、`paged`、`count`、`aggregate` |
| 只返回 State，不带快照元数据 | `SnapshotQueryClient<S, FIELDS>` | `singleState`、`listState`、`pagedState` |
| 查询领域事件流 | `EventStreamQueryClient<E, FIELDS>` | `list`、`listStream`、`paged`、`count` |
| 按 Aggregate ID 重建状态 | `LoadStateAggregateClient<S>` | `load`、`loadVersioned`、`loadTimeBased` |
| 重建 Owner-scoped Aggregate | `LoadOwnerStateAggregateClient<S>` | `load`、`loadVersioned`、`loadTimeBased` |
| 创建一组关联查询 Client | `QueryClientFactory<S, FIELDS, E>` | `createSnapshotQueryClient` 等 Factory 方法 |

## 共享配置

所有 Client 都接收 `@ahoo-wang/fetcher-decorator` 的 `ApiMetadata`。关键字段如下：

| 字段 | 用途 |
| --- | --- |
| `fetcher` | `Fetcher` 实例或已注册的 Fetcher 名称 |
| `basePath` | 添加在 Client Endpoint 之前的基础路径 |
| `urlParams.path` | `{tenantId}`、`{ownerId}` 等路径占位符的值 |
| `headers` | 每个 Client 请求继承的 Header |
| `timeout` | 默认超时毫秒数 |
| `attributes` | 与 Fetcher Interceptor 共享的值 |

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

Factory 按 `contextAlias/resourceAttribution/aggregateName` 的顺序拼接路径。所以上例在
追加具体方法的 Endpoint 前使用 `sales/owner/{ownerId}/cart`。

`ResourceAttributionPathSpec` 提供 `NONE`、`TENANT`、`OWNER` 和
`TENANT_OWNER`。每个占位符都必须通过共享 Metadata 或 Command Request 的
`urlParams.path` 绑定；缺少值时无法构造有效请求 URL。

## 命令

使用与查询 Client 相同的路由元数据创建 Command Client：

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

Endpoint 写在 `request.path`；`send()` 不再单独接收 Endpoint 参数。

### Command 方法

| 方法 | 返回值 | 使用场景 |
| --- | --- | --- |
| `send(request, attributes?)` | `Promise<CommandResult>` | 一个等待结果就足够 |
| `sendAndWaitStream(request, attributes?)` | `Promise<CommandResultEventStream>` | 需要通过 SSE 接收每个等待信号 |

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

`CommandResult` 包含 `stage`、`aggregateId`、`aggregateVersion`、
`commandId`、`requestId`、`errorCode`、`errorMsg`、可选 `bindingErrors`、
`result` 和 `signalTime`，以及 Bounded Context 与 Function 元数据。

### Command Stage

| Stage | 等待到 |
| --- | --- |
| `SENT` | 命令已经发布 |
| `PROCESSED` | Aggregate 完成命令处理 |
| `SNAPSHOT` | 物化快照已经生成 |
| `PROJECTED` | Projection 处理完成 |
| `EVENT_HANDLED` | Event Handler 处理完成 |
| `SAGA_HANDLED` | Saga Handler 处理完成 |

### Command Header

| 用途 | 常量 |
| --- | --- |
| 归属 | `TENANT_ID`、`OWNER_ID`、`SPACE_ID` |
| Aggregate | `AGGREGATE_ID`、`AGGREGATE_VERSION`、`COMMAND_AGGREGATE_CONTEXT`、`COMMAND_AGGREGATE_NAME` |
| 等待 | `WAIT_STAGE`、`WAIT_TIME_OUT`、`WAIT_CONTEXT`、`WAIT_PROCESSOR`、`WAIT_FUNCTION` |
| 等待链尾部 | `WAIT_TAIL_STAGE`、`WAIT_TAIL_CONTEXT`、`WAIT_TAIL_PROCESSOR`、`WAIT_TAIL_FUNCTION` |
| 关联与路由 | `REQUEST_ID`、`LOCAL_FIRST`、`COMMAND_TYPE` |

命令需要支持取消时，把 `AbortController` 放入 `request.abortController`。

## Snapshot Query

Snapshot 方法都向 Client `basePath` 下的以下路径发送 POST 请求。

| 方法 | Endpoint | 返回值 |
| --- | --- | --- |
| `single<T>(query)` | `snapshot/single` | `T`；默认为 `MaterializedSnapshot<S>` |
| `singleState<T>(query)` | `snapshot/single/state` | `T`；默认为 `S` |
| `list<T>(query)` | `snapshot/list` | `T[]`；默认为完整 Snapshot |
| `listState<T>(query)` | `snapshot/list/state` | `T[]`；默认为 `S[]` |
| `listStream<T>(query)` | `snapshot/list` | `T` Snapshot SSE |
| `listStateStream<T>(query)` | `snapshot/list/state` | `T` State SSE |
| `paged<T>(query)` | `snapshot/paged` | `PagedList<T>`；默认为完整 Snapshot |
| `pagedState<T>(query)` | `snapshot/paged/state` | `PagedList<T>`；默认为 `S` |
| `count(filter)` | `snapshot/count` | `number` |
| `aggregate<Row>(query)` | `snapshot/aggregation` | `Row[]` |
| `aggregateStream<Row>(query)` | `snapshot/aggregation` | `Row` SSE |

所有网络查询方法都把共享 Interceptor Attributes 作为第二个参数，把
`AbortController` 作为第三个参数。

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

需要 Version、Owner、时间戳、Tag、删除状态等元数据时使用 `single`/`list`；应用契约
只需要 State 值时使用 `*State` 变体。Projection 不会自动推断方法返回类型；选定字段
形成部分对象时，应显式传入 `T`。

### ID Helper

| 方法 | 行为 |
| --- | --- |
| `getById(id)` | 返回一个完整 Snapshot |
| `getStateById(id)` | 返回一个 State |
| `getByIds(ids)` | 返回完整 Snapshot；空数组直接短路 |
| `getStateByIds(ids)` | 返回 State；空数组直接短路 |

这些 Helper 匹配 Wow Aggregate ID，是 `single`、`list`、
`filter.aggregateId` 和 `filter.aggregateIds` 的便捷封装。

## Query Builder 与默认值

| Builder | 结构 | 默认值 |
| --- | --- | --- |
| `singleQuery()` | filter/condition、projection、sort | 无参数的旧式调用使用 Match All |
| `listQuery()` | filter/condition、projection、sort、limit | Filter 形式使用 `limit: 0`（无限制）；旧 Condition 形式使用 `10` |
| `pagedQuery()` | filter/condition、projection、sort、pagination | 第 `1` 页，每页 `10` 条 |
| `pagination()` | `{ index, size }` | 第 `1` 页，每页 `10` 条 |
| `projection()` | `{ include?, exclude? }` | 不限制投影字段 |
| `asc(field)`、`desc(field)` | `{ field, direction }` | 方向显式指定 |

优先使用 `filter` 属性。`condition` 属性和独立 `Condition` Builder 是已弃用的兼容
API。

### Cursor 遍历

`cursorQuery()` 把 List Query 转换为排他的单字段 Cursor Query。升序遍历增加 `gt`，
降序遍历增加 `lt`，并把查询排序替换为 Cursor Field。

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

下一页把最后一条记录的 Cursor Field 作为 `cursorId`。应选择稳定且唯一的字段；该
Helper 会有意生成唯一的 Cursor Sort。`CURSOR_ID_START`（`~`）是默认降序方向的起始
哨兵；升序遍历需要传入一个排序在所有真实 ID 之前的领域专用哨兵。

## `FilterExpression`

`filter` 是主 Builder。它生成可序列化的 Discriminated Union，并在发出请求前校验
非法字段、空 Operand、空集合值、支持的枚举和相对时间选项结构。

| 家族 | Builder |
| --- | --- |
| 匹配 | `matchAll`、`matchNone` |
| 元数据 | `id`、`ids`、`aggregateId`、`aggregateIds`、`tenantId`、`ownerId`、`spaceId` |
| 逻辑 | `and`、`or`、`nor` |
| 相等/比较 | `eq`、`ne`、`gt`、`gte`、`lt`、`lte`、`between` |
| 字符串 | `contains`、`startsWith`、`endsWith` |
| 集合 | `isIn`、`notIn`、`containsAll` |
| 存在性 | `isEmpty`、`isNull`、`isNotNull`、`exists`、`notExists` |
| 生命周期 | `deletion`，接收 `DeletionState.ACTIVE`、`DELETED` 或 `ALL` |
| 嵌套数组 | `elementMatch` |
| 搜索 | `search`，可指定 Field 和 `SearchMode` |
| 相对时间 | `today`、`beforeToday`、`tomorrow`、周/月/年 Helper、`recentDays`、`earlierDays` |

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

应用代码经常遇到的规则：

- `and`、`or`、`nor`、`ids`、`aggregateIds`、`isIn`、`notIn` 和
  `containsAll` 接收一个非空 Readonly Array。
- `eq` 和 `ne` 接收 JSON Scalar、`null` 或 JSON Scalar Array。
- 比较和集合值不能是 `null` 或非有限数字。
- `elementMatch` Predicate 使用 Element-relative Field，不能包含根级元数据、删除或
  Search Filter。
- Snapshot State Field 通常使用 `state.*`；`aggregateId`、`snapshotTime` 等元数据位于
  Root。
- 相对时间 Builder 接收 `zoneId`、`datePattern` 和 `timeUnit`。客户端校验 Offset Zone
  语法、Date Pattern 结构和 `timeUnit`；命名 IANA Zone 由服务端最终校验。

## Aggregation

`AggregationQuery<ROOT_FIELDS, AGGREGATION_FIELDS>` 区分 Root Filter Field 和
Element 展开后可见的 Field。

| 属性 | 必填 | 含义 |
| --- | --- | --- |
| `filter` | 否 | Root-level `FilterExpression` |
| `elements` | 否 | 按 Parent → Child 排列的数组展开链 |
| `groupBy` | 否 | Terms、数值 Histogram 或 Date Histogram Group |
| `metrics` | 是 | Count、Numeric 或 Any-value Metric 的非空 Tuple |
| `sort` | 否 | 对结果 Row 排序，通常使用 Alias |
| `limit` | 否 | 最大 Aggregation Row 数 |

### 扁平聚合

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

### 嵌套 Element 聚合

第一个 Element Path 相对 Snapshot Root。之后每个 Element Path、Predicate、Group
Field 和 Metric Field 都相对当前最内层 Element。

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

### Aggregation Builder

| Builder | 产物 |
| --- | --- |
| `element(path, predicate?)` | 一个 Element 展开步骤 |
| `terms(field, alias)` | 精确值 Group |
| `histogram(field, { interval, alias })` | 数值 Bucket；Interval 必须大于零 |
| `dateHistogram(field, { unit, alias, timeZone? })` | 日历 Bucket；默认时区为 `UTC` |
| `field`、`constant` | Expression Leaf |
| `add`、`subtract`、`multiply`、`divide` | Binary Numeric Expression |
| `count(alias)` | Row Count |
| `any(field, alias)` | 任意一个代表性 Field Value |
| `sum`、`avg`、`min`、`max` | Numeric Expression Metric |

Alias 必须是非空单段 Field，且不能以保留前缀 `__wow` 开头。Constant 必须是有限数字。

大结果集可以把 `aggregate` 替换为 `aggregateStream`，并迭代 `event.data`：

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

## Domain Event Query

`EventStreamQueryClient<E, FIELDS>` 与 Snapshot Query 使用相同的 Filter、Projection、
Sort、Pagination、Attributes 和取消约定。

| 方法 | Endpoint | 返回值 |
| --- | --- | --- |
| `list(query)` | `event/list` | `DomainEventStream<E>[]` |
| `listStream(query)` | `event/list` | `DomainEventStream<E>` SSE |
| `paged(query)` | `event/paged` | `PagedList<DomainEventStream<E>>` |
| `count(filter)` | `event/count` | `number` |

`DomainEventStream` 包含 Aggregate、Owner、Space、Command、Request、Version、
Timestamp、Header 和 Event Body 数据。可通过 `DomainEventStreamMetadataFields` 使用
稳定的事件元数据 Field 常量。

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

Event Stream 是集合资源，因此没有 `single` 方法。

## 历史状态加载

| Client | 方法 | `basePath` 下的 Endpoint |
| --- | --- | --- |
| `LoadStateAggregateClient` | `load(id)` | `{id}/state` |
| `LoadStateAggregateClient` | `loadVersioned(id, version)` | `{id}/state/{version}` |
| `LoadStateAggregateClient` | `loadTimeBased(id, createTime)` | `{id}/state/time/{createTime}` |
| `LoadOwnerStateAggregateClient` | `load()` | `state` |
| `LoadOwnerStateAggregateClient` | `loadVersioned(version)` | `state/{version}` |
| `LoadOwnerStateAggregateClient` | `loadTimeBased(createTime)` | `state/time/{createTime}` |

`createTime` 是 Wow Endpoint 所需的数值时间戳。所有方法都先接收 Attributes，然后接收
可选 `AbortController`。

## 返回结构

| 类型 | 关键字段 |
| --- | --- |
| `MaterializedSnapshot<S>` | `state`、Aggregate 标识、Tenant/Owner/Space、Version、Event/Snapshot Time、Operator、Tag、删除状态 |
| `PagedList<T>` | `total`、`list` |
| `DomainEventStream<E>` | Aggregate 标识、Owner/Space、Command/Request ID、`version`、`header`、`body`、`createTime` |
| `CommandResult` | Wait Stage、Aggregate Version、错误信息、命令结果、Signal 元数据 |

UI 或 Query Builder 需要稳定元数据字段名时，使用 `SnapshotMetadataFields` 和
`DomainEventStreamMetadataFields`。

## 故障定位

| 现象 | 检查项 |
| --- | --- |
| URL 仍包含 `{ownerId}` 或 `{tenantId}` | 在 `apiMetadata.urlParams.path` 或 `request.urlParams.path` 中绑定值 |
| `listQuery({ filter })` 返回数量超出预期 | Filter 形式默认 `limit: 0`；显式设置 Limit |
| State Filter 没有匹配结果 | Snapshot State Field 通常需要 `state.` 前缀 |
| `elementMatch` 在发送前抛错 | Root Metadata、Deletion、Search Filter 应放在 Element Predicate 外部 |
| Logical 或 Collection Builder 抛错 | 传入一个非空数组，例如 `filter.and([a, b])` |
| Command 已返回但操作失败 | 检查 `ErrorCodes.isError(result.errorCode)` 和 `bindingErrors` |
| 无法消费 SSE 方法 | 安装 EventStream Peer Dependency，并用 `for await` 迭代返回的 Stream |
| UI 请求需要取消旧任务 | 把 `AbortController` 作为第三个 Query 参数，然后调用 `abort()` |

## 源码参考

- [`packages/wow/src/index.ts:14`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/index.ts#L14)
- [`packages/wow/src/query/snapshot/snapshotQueryClient.ts:121`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/snapshot/snapshotQueryClient.ts#L121)
- [`packages/wow/src/query/filter.ts:582`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/filter.ts#L582)
- [`packages/wow/src/query/aggregation.ts:210`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/wow/src/query/aggregation.ts#L210)
- [`skills/fetcher-wow-cqrs/references/api.md:1`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-wow-cqrs/references/api.md#L1)
- [Fetcher Wow Skill](../skills/react-and-integrations.md#fetcher-wow-cqrs)
