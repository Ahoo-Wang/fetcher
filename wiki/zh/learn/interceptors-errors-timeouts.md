---
title: 处理错误、超时与取消
description: 处理错误、超时与取消 — Fetcher
---

# 处理错误、超时与取消

先判断失败属于传输、HTTP 状态策略，还是结果提取。重试不能解决所有类型的错误。

## 保留 exchange 上下文

```ts
import { ExchangeError, Fetcher, FetchTimeoutError } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'https://api.example.com' });
try {
  await api.get('/reports', { timeout: 1_000 });
} catch (error) {
  if (error instanceof ExchangeError) {
    if (error.cause instanceof FetchTimeoutError) {
      console.error('Timeout', error.cause.request.timeout);
    } else {
      console.error(error.exchange.response?.status, error.cause);
    }
  } else {
    throw error;
  }
}
```

默认状态策略接受 200–299。状态拒绝进入 exchange 错误；原生网络错误可能根本没有响应。JSON 解析与自定义结果提取在拦截器管线之后执行，因此不一定抛出 ExchangeError。

## 明确取消的所有者

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'https://api.example.com' });
const abortController = new AbortController();
const request = api.get('/reports', { abortController, timeout: 5_000 });
abortController.abort();
await request.catch(error => console.error(error));
```

需要同时使用主动取消和 Fetcher 超时时，传入 abortController。原生 signal 会走直接 fetch 路径，绕过库的超时逻辑。未设置 timeout 或设为零时不启用计时器；请求级 timeout 覆盖客户端值。

## 有意识地调整策略

客户端 validateStatus 配置默认拦截器管理器；自定义管理器自行负责响应策略。错误拦截器可通过清除 exchange.error 恢复，但不会自动重新执行响应校验，也不构成内置重试循环。

查阅[错误与取消](../reference/fetcher/errors-and-cancellation.md)了解准确错误类型，或查阅[拦截器](../reference/fetcher/interceptors.md)了解注册和顺序。
