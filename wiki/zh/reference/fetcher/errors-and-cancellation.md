---
title: '错误、超时与取消'
description: '错误、超时与取消 — @ahoo-wang/fetcher 5.0.0'
---

# 错误、超时与取消

Fetcher 默认管线拒绝 200–299 之外的 HTTP 状态。原生 fetch 本身会正常返回这些响应，因此处理 Fetcher 请求失败时应检查 exchange。

复用 HTTP 状态接受策略时选择 `validateStatus`，明确只跳过一次校验时才使用请求属性，由调用方取消时使用 AbortSignal。这些入口都不会安排重试。即使装有错误拦截器，成功响应后的 JSON 解析失败仍需调用方捕获。

## 错误类型与状态策略 {#errors}

| API                                             | 契约                                                                                                                                                                                      |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `FetcherError(message?, cause?)`                | 消息回退到 Error cause 的消息，再回退到通用消息；保存 cause。保留自身 stack（失败浮现之处），原始失败及其 stack 留在 `cause` 上。子类无需 `Object.setPrototypeOf` 即可通过 `instanceof`。 |
| `ExchangeError(exchange, message?)`             | 保存 exchange，cause 取自 `exchange.error`；消息依次回退到错误消息、响应 statusText、请求 URL。                                                                                           |
| `HttpStatusValidationError(exchange, problem?)` | 状态校验创建，包含状态码与 URL；exchange 以它本身拒绝（不包装），`.exchange.error` 是同一个错误。响应为 `application/problem+json` 时，`problem` 保存其[问题详情](#problem-details)。     |
| `FetchTimeoutError(request)`                    | 保存超时请求，消息包含超时、方法（默认 GET）和 URL。                                                                                                                                      |
| `ValidateStatus`                                | `(status: number) => boolean`，用于构造选项或 `new ValidateStatusInterceptor(predicate, options?)`。                                                                                      |
| `ValidateStatusOptions`                         | `{ problemDetails?: boolean }`，默认 `true`：被拒绝的问题响应是否把详情读到错误上。                                                                                                       |     |
| `IGNORE_VALIDATE_STATUS`                        | 属性键 `'__ignoreValidateStatus__'`，仅字面量 `true` 绕过校验。                                                                                                                           |

没有响应时状态校验直接跳过。管线失败通常为 `ExchangeError`：状态失败就是 `HttpStatusValidationError` 本身，其他错误（超时、网络、abort reason、请求/响应/错误拦截器抛错）被包装，原错误作为 `cause`。只有后续提取器失败可以不经过此包装。不要假定每个失败都有响应，也不要假定所有拒绝值都是 Error。

## 问题详情 {#problem-details}

被拒绝的响应若标为 `application/problem+json`（RFC 9457，不区分大小写，可带参数），其问题详情会以 `ProblemDetails` 读到 `HttpStatusValidationError.problem`。读取的是响应体副本，因此 `error.exchange.response` 仍未读取，错误消息也保持上述格式。其他响应不会被读取，这类拒绝仍从 `ValidateStatusInterceptor.intercept` 同步抛出。问题响应体不是 JSON 对象时，`problem` 为 undefined，不会替换状态失败。可在客户端（与 `validateStatus` 一样配置默认管理器）或 `ValidateStatusInterceptor` 上用 `problemDetails: false` 关闭。

`ProblemDetails` 包含 `type`（默认 `ABOUT_BLANK_PROBLEM_TYPE`，即 `'about:blank'`）、可选的 `title`、`status`、`detail`、`instance`，以及服务端发送的扩展成员。类型不对的标准成员会被去掉，这是 RFC 要求的忽略方式。`status` 仅供参考，以响应自身的状态码为准。同样的读取也可单独使用：`isProblemDetailsResponse(response)` 判断媒体类型，`readProblemDetails(response)` 读取副本（得到 `undefined` 而不是拒绝），`toProblemDetails(body)` 检查已解析的响应体。

```ts
import { Fetcher, HttpStatusValidationError } from '@ahoo-wang/fetcher';

const client = new Fetcher({ baseURL: 'https://api.example.com' });
try {
  await client.post('/orders', { body: { item: 'book', quantity: 1 } });
} catch (error) {
  if (error instanceof HttpStatusValidationError && error.problem) {
    console.error(error.problem.detail ?? error.problem.title);
  }
}
```

## 超时优先级 {#timeout}

`TimeoutCapable.timeout?: number` 单位为毫秒。`resolveTimeout(requestTimeout?, optionsTimeout?)` 在请求值不是 undefined 时直接返回它（包括零），否则使用客户端值。`timeoutFetch(request, fetchImplementation?): Promise<Response>` 使用 `fetchImplementation` 发送，其类型 `FetchImplementation` 为 `(input: string, init?: RequestInit) => Promise<Response>`（默认在调用时读取全局 `fetch`）。URL 作为第一个参数，并传入干净的 `RequestInit`：不含 `url`、`timeout`、`urlParams` 和 `abortController`，取消通过合并后的 `signal` 传递。行为如下：

| 输入                                     | 行为                                                                                                                                                                                                                         |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| timeout 不是正数（`0`、负数、undefined） | 不启用定时器；原生 fetch 由 `request.signal` 或 `abortController.signal` 中先触发者中止。                                                                                                                                    |
| timeout 为正数                           | 原生 fetch 与定时器竞速，定时器与调用者的 `signal`、`abortController` 组合，先触发者中止。定时器以 `FetchTimeoutError` 拒绝（先拒绝再中止信号，因此在中止时立即拒绝的 fetch 无法替换它），调用者取消以其 abort reason 拒绝。 |

传入有限正数才启用定时器。fetch 返回 Response 时定时器即结束，**不会等待响应正文消费完成**。流的空闲/总时限需要调用者管理取消。无论是否有 `AbortSignal.any`，调用者的 `signal` 与 `abortController` 在收到响应头后仍能取消正文读取；没有它时，每个已发送请求会在调用者信号上保留一个小监听器，直到其中一个信号中止。

## 所有权与清理 {#cancellation}

成功和失败都会清理定时器。`timeoutFetch` 从不写入请求对象，定时器也从不中止外部控制器，因此同一请求可以再次发送。外部控制器仍由调用者拥有，即使它已被中止；它不能复位用于重试，新操作应创建新控制器。

外部取消使用 `signal` 或 `abortController`，失败 exchange 保留取消原因。两者都与 Fetcher 超时同时生效：先触发者中止请求。

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
| <a id="fetchererror"></a>`FetcherError`                                           | [fetcherError.ts:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L40)                             |
| <a id="exchangeerror"></a>`ExchangeError`                                         | [fetcherError.ts:83](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcherError.ts#L83)                             |
| <a id="fetchtimeouterror"></a>`FetchTimeoutError`                                 | [timeout.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L35)                                       |
| <a id="timeoutcapable"></a>`TimeoutCapable`                                       | [timeout.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L60)                                       |
| <a id="resolvetimeout"></a>`resolveTimeout`                                       | [timeout.ts:81](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L81)                                       |
| <a id="fetchimplementation"></a>`FetchImplementation`                             | [timeout.ts:138](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L138)                                     |
| <a id="timeoutfetch"></a>`timeoutFetch`                                           | [timeout.ts:192](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L192)                                     |
| <a id="httpstatusvalidationerror"></a>`HttpStatusValidationError`                 | [validateStatusInterceptor.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L35)   |
| <a id="validatestatus"></a>`ValidateStatus`                                       | [validateStatusInterceptor.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L87)   |
| <a id="validate_status_interceptor_name"></a>`VALIDATE_STATUS_INTERCEPTOR_NAME`   | [validateStatusInterceptor.ts:95](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L95)   |
| <a id="validate_status_interceptor_order"></a>`VALIDATE_STATUS_INTERCEPTOR_ORDER` | [validateStatusInterceptor.ts:102](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L102) |
| <a id="ignore_validate_status"></a>`IGNORE_VALIDATE_STATUS`                       | [validateStatusInterceptor.ts:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L122) |
| <a id="validatestatusinterceptor"></a>`ValidateStatusInterceptor`                 | [validateStatusInterceptor.ts:151](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L151) |
| <a id="validatestatusoptions"></a>`ValidateStatusOptions`                         | [validateStatusInterceptor.ts:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L53)   |
| <a id="problemdetails"></a>`ProblemDetails`                                       | [problemDetails.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L37)                         |
| <a id="about_blank_problem_type"></a>`ABOUT_BLANK_PROBLEM_TYPE`                   | [problemDetails.ts:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L59)                         |
| <a id="isproblemdetailsresponse"></a>`isProblemDetailsResponse`                   | [problemDetails.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L67)                         |
| <a id="readproblemdetails"></a>`readProblemDetails`                               | [problemDetails.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L88)                         |
| <a id="toproblemdetails"></a>`toProblemDetails`                                   | [problemDetails.ts:106](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/problemDetails.ts#L106)                       |

[包索引](./index.md)
