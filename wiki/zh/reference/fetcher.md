---
title: Fetcher 参考
description: 配置 Fetcher、发送 HTTP 请求、提取结果并处理请求失败。
pageClass: reference-page
---

# `@ahoo-wang/fetcher`

核心包在平台 `fetch` 之上提供 URL 模板、拦截器、超时、状态校验和类型化结果提取。

## 安装

```bash
pnpm add @ahoo-wang/fetcher
```

## 创建客户端

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

export const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
  headers: { 'Content-Type': 'application/json' },
});
```

### `FetcherOptions`

| 选项               | 默认值                | 用途                                 |
| ------------------ | --------------------- | ------------------------------------ |
| `baseURL`          | `''`                  | 相对请求 URL 的前缀                  |
| `headers`          | JSON 内容类型         | 合并到每个请求的请求头               |
| `timeout`          | 不超时                | 默认超时毫秒数                       |
| `urlTemplateStyle` | `UriTemplate`         | URI Template 或 Express 风格路径参数 |
| `interceptors`     | 新建默认管理器        | 替换完整拦截器链                     |
| `validateStatus`   | `200 <= status < 300` | 判断响应是否成功                     |

`validateStatus` 只配置默认拦截器管理器。显式传入 `interceptors` 后，该选项不再生效。

## 发送请求

```ts
import { ResultExtractors } from '@ahoo-wang/fetcher';
import { api } from './api';

interface User {
  id: string;
  name: string;
}

const user = await api.get<User>(
  '/users/{id}',
  {
    urlParams: {
      path: { id: 'u-42' },
      query: { expand: 'team' },
    },
  },
  { resultExtractor: ResultExtractors.Json },
);
```

`fetch`、`get`、`post`、`put`、`patch`、`delete`、`head`、`options` 和
`trace` 默认返回 `Response`。已有完整 `FetchRequest` 时使用 `request()`；它默认
返回 `FetchExchange`。

单次请求的请求头和超时会覆盖客户端默认值。默认请求体拦截器会把普通对象序列化为 JSON。

## 提取结果

| 提取器                         | 结果                 |
| ------------------------------ | -------------------- |
| `ResultExtractors.Response`    | 原生 `Response`      |
| `ResultExtractors.Json`        | 已解析 JSON          |
| `ResultExtractors.Text`        | 文本正文             |
| `ResultExtractors.Blob`        | `Blob`               |
| `ResultExtractors.ArrayBuffer` | `ArrayBuffer`        |
| `ResultExtractors.Bytes`       | `Uint8Array`         |
| `ResultExtractors.Exchange`    | 完整 `FetchExchange` |

自定义 `ResultExtractor` 接收已完成的 exchange，并可返回同步值或 Promise。

## API 导航

| API                                         | 默认结果        | 适用场景                            |
| ------------------------------------------- | --------------- | ----------------------------------- |
| `fetch(url, init?, options?)`               | `Response`      | 已有 URL 和可选请求初始化           |
| `get` / `post` / `put` / `patch` / `delete` | `Response`      | 调用处已确定 HTTP 方法              |
| `exchange(request, options?)`               | `FetchExchange` | 基础设施需要完整生命周期容器        |
| `request<R>(request, options?)`             | 提取后的 `R`    | 已有完整 `FetchRequest`             |
| `resolveExchange(request, options?)`        | `FetchExchange` | 适配器需要在 I/O 前检查解析后的请求 |
| `NamedFetcher(name, options?)`              | 已注册客户端    | 服务按名称解析共享客户端            |

`fetcher` 是以 `default` 注册的默认 `NamedFetcher`；其他命名客户端可通过
`fetcherRegistrar.get(name)` 解析。应用代码优先显式导出客户端，只在围绕命名客户端
设计的集成边界使用注册表。

## 请求契约

`FetchRequestInit` 在平台 `RequestInit` 之上增加 `urlParams`、`timeout`、类型化
Headers、普通对象 Body 和 `abortController`。

### 解析顺序

1. 请求 Headers 通过浅合并覆盖客户端 Headers。
2. 单次请求 Timeout 覆盖客户端 Timeout。
3. 路径和查询参数被解析进最终 URL。
4. 请求体拦截器把普通对象序列化为 JSON。
5. 请求、响应和错误拦截器修改同一个 `FetchExchange`。
6. 结果提取器只执行一次，结果由 Exchange 缓存。

`attributes` 在 `FetchExchange` 上转换为 `Map<string, unknown>`。多个拦截器共享
数据时使用带命名空间的 Key；不要把请求级可变状态放到 `Fetcher` 实例上。

### URL 参数

```ts
await api.get('/teams/{teamId}/users/{userId}', {
  urlParams: {
    path: { teamId: 'platform', userId: 'u-42' },
    query: { include: ['roles', 'permissions'], active: true },
  },
});
```

默认使用 `{userId}` 形式的 URI Template。只有既有路由使用 `:userId` 时才选择
Express 风格；一个客户端中不要混用两种风格。

## 取消与超时

调用方拥有取消行为时传入 `abortController`。配置的超时使用同一取消路径并抛出
`FetchTimeoutError`。单次请求 Timeout 优先于客户端默认值；两者都省略时 Fetcher
不主动超时。

## 拦截器与错误

`fetcher.interceptors` 暴露请求、响应和错误注册表。处理器名称唯一，按 `order`
升序运行；使用 `use()` 注册、`eject()` 移除。

当错误类型会影响用户体验时，可捕获以下公开类型：

- `HttpStatusValidationError`：响应未通过 `validateStatus`。
- `FetchTimeoutError`：达到配置的超时时间。
- `ExchangeError`：请求处理失败，并保留 exchange 上下文。
- `FetcherError`：Fetcher 专用错误的基类。

拦截器处理失败后，必须让 Exchange 保持后续拦截器和结果提取器可以理解的状态。
仅当非 2xx 响应本来就是预期结果时使用 `IGNORE_VALIDATE_STATUS`，不要用它掩盖未知
服务端失败。

## 源码与 Agent 参考

- 公共导出：[`packages/fetcher/src/index.ts`](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/index.ts)
- Agent 精确 API：[`skills/fetcher-integration/references/api.md`](https://github.com/Ahoo-Wang/fetcher/blob/main/skills/fetcher-integration/references/api.md)
- Skill：[`$fetcher-integration`](../skills/http-and-services.md#fetcher-integration)

继续阅读[请求与结果](../learn/requests-and-results.md)和
[拦截器、错误与超时](../learn/interceptors-errors-timeouts.md)。
