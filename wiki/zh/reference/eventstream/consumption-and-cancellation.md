---
title: '消费、取消与安全转换器'
description: '消费、取消与安全转换器 — @ahoo-wang/fetcher-eventstream 5.0.0'
---

# 消费、取消与安全转换器

ReadableStream 同时只能有一个活动 reader。将流交给 UI 或其他转换器之前，应确定由哪一层拥有读取和取消责任。

## 异步迭代 {#iteration}

`isReadableStreamAsyncIterableSupported` 是模块求值时捕获的布尔值。全局 ReadableStream 存在但不支持原生异步迭代时，包安装原型方法，返回 `new ReadableStreamAsyncIterable<T>(stream)`。原生迭代器不会被修改，保留平台语义。

| `ReadableStreamAsyncIterable<T>` 成员 | 契约                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| 构造器 `(stream)`                     | 立即 `getReader()` 并锁流，已有锁时抛错。                                       |
| `locked`                              | 包装器所有权标记，初始 true。                                                   |
| `next()`                              | 返回 `Promise<IteratorResult<T>>`，EOF 或读取失败时释放锁，读取失败继续抛出。   |
| `return()`                            | 取消 reader，debug 记录取消失败，释放锁并返回 done；for-await 中 break 调用它。 |
| `releaseLock(): boolean`              | 只释放一次，成功 true；已释放或释放抛错返回 false，后者 debug 记录；不取消。    |
| `throw(error)`                        | 记录并释放锁，返回 done，不重新抛错，也不取消。                                 |
| `[Symbol.asyncIterator]()`            | 返回同一包装器，不是可复用的独立 reader 工厂。                                  |

主动提前终止使用 `return()`；单独释放锁会保留活动源。消费响应正文后，释放锁或取消都不会使正文可重复使用。手动获取 reader 时，应在提前退出时取消，并在 finally 释放。网络控制器和只覆盖响应头的超时边界见 [Fetcher 取消](../fetcher/errors-and-cancellation.md)。

## SafeTransformer {#transformers}

`SafeTransformer<I, O>` 实现原生 `Transformer<I, O>`。子类实现 protected `onTransform(chunk, controller): void | Promise<void>`，可重写 `onFlush(controller)`、`onError(error, phase)`；`TransformerPhase` 为 `'transform' | 'flush'`。

终止后 `transform` 忽略后续 chunk。钩子出错时会捕获、标记终止、调用受保护的错误钩子，再 `safeError` 让 reader 观察到失败。`flush` 同样捕获，并在 finally 标记终止。`onError` 自身抛错被抑制，避免替换原始失败。protected `enqueue`、`terminate` 返回布尔值；`terminate` 操作控制器前先标记状态。

## 控制器辅助函数 {#controllers}

`StreamController<T>` 为 `ReadableStreamDefaultController<T> | TransformStreamDefaultController<T>`。`safeEnqueue(controller, chunk)`、`safeError(controller, reason)`、`safeTerminate(transformController)` 成功返回 true；控制器操作抛出原生 TypeError（含匹配的跨 realm 原生 TypeError）时返回 false，其他错误继续传出。它们不校验负载，也不会仅根据错误名称 TypeError 就吞掉任意异常。

每条管线使用新的转换器，其缓冲/终止状态属于该流。管线取消遵循原生 Web Streams 行为；这里不引入重试、缓冲上限配置或重连策略。

## 完整示例 {#example}

```ts
import {
  ReadableStreamAsyncIterable,
  SafeTransformer,
} from '@ahoo-wang/fetcher-eventstream';

let cancelled = false;
const source = new ReadableStream<number>({
  start(controller) {
    controller.enqueue(1);
  },
  cancel() {
    cancelled = true;
  },
});
const iterator = new ReadableStreamAsyncIterable(source);
for await (const value of iterator) {
  console.assert(value === 1);
  break;
}
console.assert(cancelled && !source.locked);

class Double extends SafeTransformer<number, number> {
  protected onTransform(
    value: number,
    controller: TransformStreamDefaultController<number>,
  ) {
    this.enqueue(controller, value * 2);
  }
}
const transform = new TransformStream(new Double());
void transform;
```

## 公开符号与源码 {#symbols}

| 符号                                                                                        | 实现                                                                                                                                            |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="readablestreamasynciterable"></a>`ReadableStreamAsyncIterable`                       | [readableStreamAsyncIterable.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreamAsyncIterable.ts#L54) |
| <a id="isreadablestreamasynciterablesupported"></a>`isReadableStreamAsyncIterableSupported` | [readableStreams.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreams.ts#L37)                         |
| <a id="transformerphase"></a>`TransformerPhase`                                             | [safeTransformer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L19)                         |
| <a id="safetransformer"></a>`SafeTransformer`                                               | [safeTransformer.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L44)                         |
| <a id="streamcontroller"></a>`StreamController`                                             | [streamController.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L24)                       |
| <a id="safeterminate"></a>`safeTerminate`                                                   | [streamController.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L87)                       |
| <a id="safeenqueue"></a>`safeEnqueue`                                                       | [streamController.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L105)                     |
| <a id="safeerror"></a>`safeError`                                                           | [streamController.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L125)                     |

[包索引](./index.md)
