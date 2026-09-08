---
prev: false
title: 'Wow 参考'
description: 'Wow 入口选择、安装与行为契约'
---

# Wow

Wow 客户端适用于实现 Wow 命令与查询协议的服务。构建器在本地创建可序列化数据，构造查询或客户端不会发送 HTTP。泛型描述预期响应，不保证服务端授权、结构校验或投影新鲜度。

## 选择入口

| 需求                 | 入口                                                                          | 先检查                                                         |
| -------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------- |
| 写入并检查执行阶段   | [CommandClient](./commands#api-CommandClient)                                 | URL 身份、命令体与等待策略；HTTP 成功不等于业务成功。          |
| 读取当前状态或快照   | [QueryClientFactory](./configuration#api-QueryClientFactory)                  | 区分纯状态与完整快照结果并选择路径。                           |
| 构造查询而不执行 I/O | [filter](./filters#api-filter) + [pagedQuery](./query-options#api-pagedQuery) | 新 filter/旧 condition 形式不同；list 默认 limit 分别为 0/10。 |
| 遍历变化中的结果集   | [游标查询](./cursor-queries)                                                  | 服务端支持的稳定排序与游标规则。                               |
| 计算分组结果         | [聚合](./aggregations)                                                        | 指标/分组表达式与服务端能力；构建器不计算结果。                |
| 读取事件流或历史状态 | [事件与历史](./events-and-history)                                            | 事件信封与状态载荷的区别及流清理。                             |

## 完整安装前提

```sh
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator @ahoo-wang/fetcher-eventstream @ahoo-wang/fetcher-wow
```

本参考针对 5.0.0。库包声明 Node >=18.20.8；仓库开发要求 Node >=20.20.2、pnpm 10.34.5。命令包含递归内部 peer，包括经 Wow/React/CoSec 引入的包；直接运行依赖自动安装。

## 核心调用

传入已配置 baseURL/认证的 Fetcher。调用 `loadUsers` 才发送请求，并返回 `{list,total}`；服务须实现 accounts/user 的 Wow 快照状态分页端点。本例不联系公共服务。

```ts
import type { Fetcher } from '@ahoo-wang/fetcher';
import { QueryClientFactory, filter, pagedQuery } from '@ahoo-wang/fetcher-wow';

interface User {
  id: string;
  name: string;
}

export async function loadUsers(fetcher: Fetcher) {
  const client = new QueryClientFactory<User>({
    fetcher,
    contextAlias: 'accounts',
    aggregateName: 'user',
  }).createSnapshotQueryClient();
  return client.pagedState(
    pagedQuery({
      filter: filter.matchAll(),
      pagination: { index: 1, size: 20 },
    }),
  );
}
```

## 专题

- [客户端配置与元数据](./configuration)
- [命令与等待结果](./commands)
- [快照查询](./snapshot-queries)
- [过滤表达式与旧条件](./filters)
- [投影、排序与分页](./query-options)
- [游标查询](./cursor-queries)
- [聚合构造器](./aggregations)
- [事件与历史状态](./events-and-history)
- [身份与资源归属](./identity-and-attribution)
- [消息载荷与状态元数据](./messages-and-state)
- [业务错误与文档工具](./errors-and-utilities)
- [旧条件操作符语言包](./operator-locales)
- [完整符号索引](./symbols)

[状态与资源所有权](../../architecture/state-and-resources) · [失败与取消边界](../../architecture/failure-model)
