---
title: 选择并验证返回结果
description: 按调用者需要选择 Response、exchange 或 JSON，并验证实际返回内容。
---

# 选择并验证返回结果

## 前提

使用 [HTTP 示例](../../examples/http.md)，其中 `/users/1` 返回包含数字 `id` 与字符串 `name` 的 JSON。执行下面调用时保持服务运行。

## 选择返回值

| 调用                         | 默认值          | 适用情况                             |
| ---------------------------- | --------------- | ------------------------------------ |
| `get`、`post` 等 HTTP 方法   | `Response`      | 需要响应头、状态码或原生 body 读取器 |
| `request`                    | `FetchExchange` | 需要请求、响应和错误上下文           |
| 显式 `ResultExtractors.Json` | 解析后的 JSON   | 服务函数应直接返回数据               |

[完整客户端源码](../../examples/http.md)显式选择 JSON，并检查 `id === 1`、`name === 'Ada'`。先运行它。若需要保留响应元数据，用以下内容替换客户端正文：

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const response = await api.get('/users/1');
console.log(response.status);
const value: unknown = await response.json();
if (
  typeof value !== 'object' ||
  value === null ||
  !('name' in value) ||
  typeof value.name !== 'string'
)
  throw new Error('Expected a user name');
console.log(value.name);
```

输出先是状态 `200`，然后是 `Ada`。这个小型边界检查验证调用方实际使用的字段；生产 schema 可能需要更多检查。仅添加 TypeScript 泛型不会验证网络数据。

## 按内容选择提取方式

纯文本用 Text，二进制用 Blob 或 ArrayBuffer，SSE 用流提取器。204 响应没有 JSON 文档；端点故意不返回 body 时使用 Response。响应体只读取一次；需要独立读取器时在消费前 clone。

提取缓存只属于一个 exchange。它不是跨请求响应缓存；缓存中的已拒绝提取 Promise 也不会因再次读取同一 body 而恢复。

## 失败与清理

JSON 解码在请求/响应拦截器管线之后执行。即使 HTTP 200，非法 JSON 仍可能直接拒绝；应在 await 边界处理，不能只依赖错误拦截器。自定义提取器也可能抛错。完整消费 JSON 或文本会结束该 body；若持有流读取器，所有者结束时要取消并释放它。验证后停止夹具。

继续阅读[失败处理](./failures.md)、[结果参考](../../reference/fetcher/results.md)与[失败模型](../../architecture/failure-model.md)。
