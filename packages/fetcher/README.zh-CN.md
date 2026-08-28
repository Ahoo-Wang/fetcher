# `@ahoo-wang/fetcher`

Fetcher 核心 HTTP 客户端：在平台 `fetch` 之上提供 URL 模板、请求头、JSON 请求体、
拦截器、超时、状态校验和结果提取。

普通 HTTP API 只需使用该包。只有需要装饰器、流式响应、React、认证、Wow 或 Viewer
能力时，才添加集成包。

## 安装

```bash
pnpm add @ahoo-wang/fetcher
```

没有 peer 或运行时依赖。

## 示例

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

interface User {
  id: string;
  name: string;
}

const api = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 10_000,
});

const user = await api.get<User>(
  '/users/{id}',
  { urlParams: { path: { id: 'u-42' } } },
  { resultExtractor: ResultExtractors.Json },
);
```

## 核心能力

- 默认返回原生 `Response`；支持 JSON、文本、Blob、字节或自定义提取。
- URI Template 与 Express 风格路径参数，以及查询参数。
- 有序的请求、响应与错误拦截器。
- 客户端和单次请求超时，并支持 Abort。
- 自定义状态校验和类型化 Fetcher 错误。
- 多后端场景下的命名 Fetcher 注册。

## 文档

- [第一个请求](https://fetcher.ahoo.me/zh/start/first-request)
- [请求生命周期](https://fetcher.ahoo.me/zh/learn/request-lifecycle)
- [Fetcher 参考](https://fetcher.ahoo.me/zh/reference/fetcher)

[English](./README.md) · [许可证](../../LICENSE)
