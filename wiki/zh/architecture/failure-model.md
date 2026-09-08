---
title: 失败模型
description: 在失败实际发生的边界处理传输、HTTP、提取、Hook 和流错误。
---

# 失败模型

在操作完成的边界处理失败。收到 HTTP 响应、解码 JSON 和消费事件流是不同操作；前一阶段成功不保证下一阶段成功。

| 失败               | 出现位置                                                                 | 应用决策                                          |
| ------------------ | ------------------------------------------------------------------------ | ------------------------------------------------- |
| 网络拒绝           | 请求拦截管线，通常包装为 `ExchangeError`                                 | 检查底层原因，决定重放是否安全                    |
| 非 2xx HTTP 状态   | 默认状态验证抛出 `HttpStatusValidationError`，通常由 exchange 管理器包装 | 处理服务错误响应和状态；HTTP 2xx 仍需业务结果检查 |
| JSON 或自定义提取  | exchange 管线之后，直接拒绝给 `request()` 调用方                         | 在消费结果处捕获，并验证使用的字段                |
| 错误拦截器自身抛错 | 从错误处理直接传播                                                       | 不假设所有拒绝都是 `ExchangeError`                |
| SSE 读取/转换失败  | 异步迭代流期间                                                           | 处理部分输出并释放 reader                         |

默认状态验证见 [packages/fetcher/src/validateStatusInterceptor.ts:170](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/validateStatusInterceptor.ts#L170)；包装与恢复见 [packages/fetcher/src/interceptorManager.ts:191](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/interceptorManager.ts#L191)；提取见 [packages/fetcher/src/fetcher.ts:234](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/fetcher.ts#L234) 和 [packages/fetcher/src/resultExtractor.ts:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/resultExtractor.ts#L69)。仅在外层检查 `instanceof HttpStatusValidationError` 或 `FetchTimeoutError` 会遗漏包装后的原因；应检查 `ExchangeError` 上下文/cause，见[失败指南](../guides/http/failures.md)和[错误参考](../reference/fetcher/errors-and-cancellation.md)。

## 超时与取消是不同控制

| 请求选项                                      | 传输行为                               | 谁管理截止时间                                  |
| --------------------------------------------- | -------------------------------------- | ----------------------------------------------- |
| 提供 `signal`                                 | 直接传入原生 Fetch，跳过库超时         | 调用方组合取消与所需超时                        |
| 无 `signal`，提供 `abortController`，开启超时 | 库使用该 controller 并增加 timer       | Fetch 结束后库清理 timer；调用方拥有 controller |
| 无 `signal` 和 controller，开启超时           | 库创建 controller 和 timer             | 库清理 timer 和临时请求字段                     |
| 无 `signal`，关闭超时                         | 原生 Fetch，若提供 controller 则使用它 | 调用方                                          |

优先级实现见 [packages/fetcher/src/timeout.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/fetcher/src/timeout.ts#L125)。timer 在 Fetch 竞争结束时清除，不等待后续 `response.json()` 或整个 SSE 流完成。同时提供 `signal` 与 `timeout` 不会组合截止时间。需要完整操作截止时间时，应自行管理 signal 和完整消费生命周期。步骤见[取消指南](../guides/http/cancellation.md)。

取消不会回滚服务端已接收的写操作。超时或丢失响应后重试前，应依据端点的幂等与结果核对契约。

## Hook 改变错误到达组件的方式

`useExecutePromise` 默认把错误存入状态。启用 `propagateError` 后会重新抛出一般错误；识别为 `AbortError` 的错误回到空闲状态。`execute()` 返回 `Promise<void>`，业务数据从 `result` 读取。新执行和卸载会取消 controller，但普通 Promise 必须配合 controller 才能停止工作。见 [packages/react/src/core/useExecutePromise.ts:265](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/core/useExecutePromise.ts#L265) 与 [React 请求指南](../guides/react/requests.md)。

## 流与认证各有具体恢复契约

SSE JSON 转换调用 `JSON.parse`，未处理的转换错误成为流错误，读取失败在迭代时传播。提前 return 或 `break` 会取消 reader 并释放锁；正常结束也释放锁。初始 exchange 成功不代表剩余流成功；没有自动重连、去重或 exactly-once 投递保证。见 [packages/eventstream/src/jsonServerSentEventTransformStream.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/jsonServerSentEventTransformStream.ts#L65)、[packages/eventstream/src/safeTransformer.ts:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L58)、[packages/eventstream/src/readableStreamAsyncIterable.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreamAsyncIterable.ts#L105) 和 [SSE 消费参考](../reference/eventstream/consumption-and-cancellation.md)。

核心默认管线不提供通用重试策略。CoSec 的有限次数 401 刷新路径检查自身授权头及 token 会话，刷新后重放原 exchange。这是认证协议，不是任意错误重试。请求体可重放性、写幂等与服务端结果仍由应用负责。见 [packages/cosec/src/authorizationResponseInterceptor.ts:80](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/cosec/src/authorizationResponseInterceptor.ts#L80)、[CoSec 指南](../guides/integrations/cosec.md)和 [token 刷新参考](../reference/cosec/tokens-and-refresh.md)。
