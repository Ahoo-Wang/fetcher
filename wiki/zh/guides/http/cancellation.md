---
title: 取消请求并设置超时
description: 确定 AbortController 的所有者，并区分获得响应与完整读取 body 的截止时间。
---

# 取消请求并设置超时

## 前提

使用[本地 HTTP 项目](../../start/first-request.md)。引入取消前，先明确每个请求归哪个页面、任务或会话所有。一个控制器对应一次尝试；已经取消的控制器无法重置。

## 取消一次请求

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const controller = new AbortController();
const pending = api.get('/users/1', {
  abortController: controller,
  timeout: 5_000,
});
controller.abort();
try {
  await pending;
} catch (error) {
  if (!controller.signal.aborted) throw error;
  console.log('Request cancelled');
}
```

用此代码替换教程客户端正文后运行。立即取消会输出 `Request cancelled`；这不证明服务端从未收到请求。在 UI 中由所有者保存控制器，加载动作发起请求，停止按钮或所有者清理时调用 abort。

## 选择截止时间

客户端 `timeout` 提供默认值，请求 `timeout` 覆盖它，单位均为毫秒。省略或设为零会关闭库计时器。传 `abortController` 可让主动取消与库计时器组合。若改传原生 `signal`，会直接走 fetch 路径，即使设置了 timeout 也跳过库计时器。

若要限制请求和 body 消费的总时长，在两个 await 外共同持有信号和计时器：

```ts
const controller = new AbortController();
const timer = setTimeout(() => controller.abort(), 5_000);
try {
  const response = await api.get('/users/1', { signal: controller.signal });
  console.log(await response.json());
} finally {
  clearTimeout(timer);
}
```

将此段放入应用异步函数，并在调用边界捕获拒绝。它替代库截止时间，而不是叠加库计时器。内建计时器在原生 fetch 返回响应时结束，不覆盖之后的 JSON 解码或整段 SSE 消费。

## 观察失败并释放资源

库超时表现为 `ExchangeError.cause` 中的 `FetchTimeoutError`；原生取消与后续 body 读取可能以其他形式抛错。取消是预期动作时检查自己持有的 signal，同时继续报告无关失败。检查结束后停止夹具。流消费者还应在 finally 中取消并释放 reader。传输观察到信号时取消才能停止客户端工作；它不会回滚服务端写入。

参阅[错误与取消参考](../../reference/fetcher/errors-and-cancellation.md)、[SSE 清理](../streaming/sse.md)与[失败模型](../../architecture/failure-model.md)。
