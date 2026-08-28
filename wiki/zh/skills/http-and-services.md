---
title: HTTP 与服务 Skills
description: 为直接请求、声明式服务、类型化事件和存储选择 Fetcher Skill。
pageClass: skills-page
---

# HTTP 与服务 Skills

这四个 Skill 覆盖基础包。先从直接的 Fetcher 请求开始，只有当应用真正承担某项
职责时才加入更高层 Skill。

## `$fetcher-integration`

**适用于：** `Fetcher`、`NamedFetcher`、请求选项、URL 参数、拦截器、结果提取、
取消、超时和状态校验。

**不适用于：** 装饰器元数据、React 状态、生成式客户端，或已经拥有专用 Skill
的认证协议。

```text
$fetcher-integration 为计费 API 增加可复用 NamedFetcher。
返回类型化 JSON，8 秒后超时，并在状态校验失败时保留响应上下文。
```

精确签名来自
[`skills/fetcher-integration/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-integration/references/api.md)。

继续阅读 [Fetcher 参考](../reference/fetcher.md)。

## `$fetcher-decorator-service`

**适用于：** 使用 `@api`、HTTP 方法装饰器、参数装饰器、生命周期钩子和生成元数据
定义类服务。

**前置条件：** 必须启用 TypeScript 装饰器元数据，并在服务加载前初始化
`reflect-metadata`。

```text
$fetcher-decorator-service 定义类型安全的 UserService，包含获取、创建和删除接口。
复用现有 NamedFetcher，并支持 AbortSignal。
```

如果真实任务是配置共享客户端而不是声明服务方法，先使用 `$fetcher-integration`。

继续阅读 [Decorator 参考](../reference/decorator.md)。

## `$fetcher-eventbus`

**适用于：** 串行、并行和广播投递，处理器生命周期，命名事件，以及跨标签页
Messenger 选择。

```text
$fetcher-eventbus 在标签页之间发布类型化 SessionExpired 事件。
使用内置降级链，并返回清理函数。
```

根据可观察行为选择语义：串行保持处理器顺序，并行缩短总等待时间，广播跨浏览器
上下文投递。

继续阅读 [事件总线参考](../reference/eventbus.md)。

## `$fetcher-storage`

**适用于：** 浏览器存储或 `InMemoryStorage` 支持的类型化值、序列化、默认值、
监听器和跨标签页同步。

```text
$fetcher-storage 以类型化 JSON 持久化当前工作区。
非浏览器渲染时使用内存降级，并清理监听器。
```

Skill 会区分状态持久化与事件投递。如果消息本身就是领域事件，使用
`$fetcher-eventbus`。

继续阅读 [Storage 参考](../reference/storage.md)。
