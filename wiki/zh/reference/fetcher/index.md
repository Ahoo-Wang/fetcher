---
prev: false
title: 'Fetcher 参考'
description: '使用显式结果提取、有序拦截器和原生 Fetch 取消的 HTTP 请求客户端。'
---

# Fetcher 参考

使用显式结果提取、有序拦截器和原生 Fetch 取消的 HTTP 请求客户端。

## 安装与运行时

```sh
pnpm add @ahoo-wang/fetcher
```

5.0.0 为消费者声明 Node >=18.20.8。仓库开发另要求 Node >=20.20.2 / pnpm 10.34.5。所用功能依赖的浏览器/运行时 API 也必须存在，engine 范围不代表每个 Web API（如 Response.bytes）均可用。

## 选择入口

用 `get`/`post` 获取原生 `Response`；需要解析数据时选择 `ResultExtractors.Json`。需要 exchange 本身时用 `request`/`exchange`，只有消费者需要按名称查找时才用 `NamedFetcher`。应用接入流程见 [HTTP 指南](../../guides/http/shared-client.md)。

## 选择专题

| 专题                                           | 用途                                                                                                                                                                                                                                                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [客户端与注册](client.md)                      | 创建 `Fetcher` 以共享 URL、请求头、超时和拦截器策略。请求仍调用运行时全局 `fetch`；客户端不管理连接池，也不需要 `destroy()`。                                                                                                                                                                                     |
| [请求、请求头与正文](requests.md)              | `FetchRequest` 在 `FetchRequestInit` 上增加必填的 `url: string`。`FetchRequestInit<BODY>` 扩展原生 `RequestInit`，将头替换为 `RequestHeaders`、正文替换为 `RequestBodyType`，并增加 `timeout`、`urlParams`、`abortController`。原生 credentials、cache、mode、redirect、integrity 等受支持的 Fetch 选项继续透传。 |
| [URL 构建与模板](urls.md)                      | `UrlBuilder` 组合基础 URL、路径替换值和查询记录，不发起请求，也不实现通用 RFC URI-template 展开。                                                                                                                                                                                                                 |
| [Exchange 与结果提取](results.md)              | 结果提取器决定运行时返回值，与 `request<R>` 或 `get<R>` 的 TypeScript 泛型独立。在 `RequestOptions.resultExtractor` 中选择提取器。                                                                                                                                                                                |
| [拦截器管线](interceptors.md)                  | 拦截器修改共享 `FetchExchange`，返回 `void \| Promise<void>`，不返回替代 exchange。`RequestInterceptor`、`ResponseInterceptor`、`ErrorInterceptor`是`Interceptor`的结构化特例，必填`name`、`order`、`intercept(exchange)`。                                                                                       |
| [错误、超时与取消](errors-and-cancellation.md) | Fetcher 默认管线拒绝 200–299 之外的 HTTP 状态。原生 fetch 本身会正常返回这些响应，因此处理 Fetcher 请求失败时应检查 exchange。                                                                                                                                                                                    |

## 最小完整示例

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

type User = { id: string; name: string };
const client = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 3000,
});
export async function loadUser(id: string): Promise<User> {
  return client.get<User>(
    '/users/{id}',
    { urlParams: { path: { id } } },
    { resultExtractor: ResultExtractors.Json },
  );
}
```

[完整公开符号索引](./symbols.md)

端点必须返回 JSON 用户数据。传输、未接受的 HTTP 状态或 JSON 解析失败会使 `loadUser` 拒绝，应在应用边界捕获。泛型不会校验载荷字段。
