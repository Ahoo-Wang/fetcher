---
title: '错误、超时与取消'
description: '错误、超时与取消 — @ahoo-wang/fetcher 5.0.0'
---

# 错误、超时与取消

Fetcher 默认管线拒绝 200–299 之外的 HTTP 状态。原生 fetch 本身会正常返回这些响应，因此处理 Fetcher 请求失败时应检查 exchange。

复用 HTTP 状态接受策略时选择 `validateStatus`，明确只跳过一次校验时才使用请求属性，由调用方取消时使用 AbortSignal。这些入口都不会安排重试。即使装有错误拦截器，成功响应后的 JSON 解析失败仍需调用方捕获。

## 错误类型与状态策略 {#errors}

| API                                   | 契约                                                                                            |
| ------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `FetcherError(message?, cause?)`      | 消息回退到 Error cause 的消息，再回退到通用消息；保存 cause，并复制 Error cause 的 stack。      |
| `ExchangeError(exchange, message?)`   | 保存 exchange，cause 取自 `exchange.error`；消息依次回退到错误消息、响应 statusText、请求 URL。 |
| `HttpStatusValidationError(exchange)` | 状态校验创建，包含状态码与 URL；通常从外层 `ExchangeError.cause` / `.exchange.error` 获取。     |
| `FetchTimeoutError(request)`          | 保存超时请求，消息包含超时、方法（默认 GET）和 URL。                                            |
| `ValidateStatus`                      | `(status: number) => boolean`，用于构造选项或 `new ValidateStatusInterceptor(predicate)`。      |
| `IGNORE_VALIDATE_STATUS`              | 属性键 `'__ignoreValidateStatus__'`，仅字面量 `true` 绕过校验。                                 |

没有响应时状态校验直接跳过。管线失败通常为 `ExchangeError`，但错误拦截器自身抛错及后续提取器失败可以不经过此包装。不要假定每个失败都有响应，也不要假定所有拒绝值都是 Error。

## 超时优先级 {#timeout}

`TimeoutCapable.timeout?: number` 单位为毫秒。`resolveTimeout(requestTimeout?, optionsTimeout?)` 在请求值不是 undefined 时直接返回它（包括零），否则使用客户端值。`timeoutFetch(request): Promise<Response>` 行为如下：

| 输入                                       | 行为                                                                                       |
| ------------------------------------------ | ------------------------------------------------------------------------------------------ |
| 存在 `request.signal`                      | 直接调用原生 fetch，绕过库超时。                                                           |
| 无 signal，timeout 为假值（`0`/undefined） | 不启用定时器；若传入则使用 `abortController.signal`。                                      |
| timeout 为真值                             | 原生 fetch 与定时器竞速；复用调用者控制器或新建控制器，定时器以 `FetchTimeoutError` 中止。 |

不校验正数范围，应有意传入有限正数或零。fetch 返回 Response 时定时器即结束，**不会等待响应正文消费完成**。流的空闲/总时限需要调用者管理取消。

## 所有权与清理 {#cancellation}

成功和失败都会清理定时器。超时分支临时写入的 signal 会移除；内部控制器会清空，让重复使用请求时可创建新控制器。外部控制器仍由调用者拥有，即使它已被中止；它不能复位用于重试，新操作应创建新控制器。

外部取消使用 `signal` 或 `abortController`，失败 exchange 保留原生取消原因。调用者 signal 有意优先于 Fetcher 超时。需要同时控制两者时，由调用者给 signal 设置截止时间，或使用 abortController 配合 timeout。

## 完整示例 {#example}

```ts
import { Fetcher, ExchangeError, FetchTimeoutError } from '@ahoo-wang/fetcher';

const client = new Fetcher({
  baseURL: 'https://api.example.com',
  timeout: 3000,
});
const controller = new AbortController();
try {
  const response = await client.get('/users/1', {
    abortController: controller,
  });
  console.log(await response.json());
} catch (error) {
  if (error instanceof ExchangeError) {
    if (error.cause instanceof FetchTimeoutError) console.error('Timed out');
    else console.error(error.exchange.response?.status, error.cause);
  } else {
    console.error(error);
  }
}
```

## 公开符号与源码 {#symbols}

| 符号                                                                              | 实现                                                                                                                                      |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="fetchererror"></a>`FetcherError`                                           | [fetcherError.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L37)                             |
| <a id="exchangeerror"></a>`ExchangeError`                                         | [fetcherError.ts:86](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L86)                             |
| <a id="fetchtimeouterror"></a>`FetchTimeoutError`                                 | [timeout.ts:33](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L33)                                       |
| <a id="timeoutcapable"></a>`TimeoutCapable`                                       | [timeout.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L60)                                       |
| <a id="resolvetimeout"></a>`resolveTimeout`                                       | [timeout.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L81)                                       |
| <a id="timeoutfetch"></a>`timeoutFetch`                                           | [timeout.ts:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L120)                                     |
| <a id="httpstatusvalidationerror"></a>`HttpStatusValidationError`                 | [validateStatusInterceptor.ts:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L27)   |
| <a id="validatestatus"></a>`ValidateStatus`                                       | [validateStatusInterceptor.ts:62](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L62)   |
| <a id="validate_status_interceptor_name"></a>`VALIDATE_STATUS_INTERCEPTOR_NAME`   | [validateStatusInterceptor.ts:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L70)   |
| <a id="validate_status_interceptor_order"></a>`VALIDATE_STATUS_INTERCEPTOR_ORDER` | [validateStatusInterceptor.ts:77](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L77)   |
| <a id="ignore_validate_status"></a>`IGNORE_VALIDATE_STATUS`                       | [validateStatusInterceptor.ts:97](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L97)   |
| <a id="validatestatusinterceptor"></a>`ValidateStatusInterceptor`                 | [validateStatusInterceptor.ts:126](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L126) |

[包索引](./index.md)
