---
title: 拦截器、错误与超时
description: 扩展 Fetcher 管线，并定位状态码、网络、取消和超时故障。
---

# 拦截器、错误与超时

## 在正确阶段增加拦截器

```ts
import {
  FETCH_INTERCEPTOR_ORDER,
  type RequestInterceptor,
} from '@ahoo-wang/fetcher';

const requestIdInterceptor: RequestInterceptor = {
  name: 'RequestIdInterceptor',
  order: FETCH_INTERCEPTOR_ORDER - 100,
  intercept(exchange) {
    exchange.request.headers = {
      ...exchange.request.headers,
      'X-Request-Id': crypto.randomUUID(),
    };
  },
};

api.interceptors.request.use(requestIdInterceptor);
```

请求拦截器负责修改请求，响应拦截器负责响应策略，错误拦截器负责恢复。除非每个读取方都使用克隆，否则不要让多个拦截器读取同一个响应体。

使用 `eject(name)` 按名称移除拦截器。重复名称会被拒绝，不会覆盖已有拦截器。

## 状态码错误

默认校验器只接受 2xx。可以按客户端调整：

```ts
const api = new Fetcher({
  validateStatus: status => status >= 200 && status < 400,
});
```

被拒绝的响应会产生 `HttpStatusValidationError`，然后进入错误拦截器。最终未处理错误是 `ExchangeError`，其 `exchange.response` 仍保留状态码与请求头。

## 网络与拦截器错误

原生 Fetch 或任意拦截器抛出的异常会成为 `exchange.error`。如果错误拦截器没有清除它，Fetcher 抛出 `ExchangeError`。在将问题判断为 HTTP 状态错误前，先检查 `error.cause` 和 `error.exchange.request.url`。

## 超时与取消

请求级超时覆盖客户端超时。`0` 或省略超时会禁用计时器。

```ts
import { FetchTimeoutError } from '@ahoo-wang/fetcher';

try {
  await api.get('/reports', { timeout: 1_000 });
} catch (error) {
  if (
    error instanceof ExchangeError &&
    error.cause instanceof FetchTimeoutError
  ) {
    console.error(error.cause.timeout, error.cause.request.url);
  }
}
```

调用方也需要取消时，提供 `AbortController`：

```ts
const abortController = new AbortController();
const request = api.get('/reports', { abortController });
abortController.abort();
await request;
```

超时使用同一个 Controller 并抛出 `FetchTimeoutError`。手动取消会将平台 Abort 错误保留为 Exchange Cause。

## 最短定位顺序

1. 读取 `ExchangeError.message` 和 `cause`。
2. 检查解析后的请求 URL、方法、请求头和超时。
3. 如果存在响应，在读取响应体前检查状态码和内容类型。
4. 检查自定义拦截器顺序，以及错误拦截器是否清除了原始错误。
5. 在修改重试行为前，先通过模拟网络边界复现。
