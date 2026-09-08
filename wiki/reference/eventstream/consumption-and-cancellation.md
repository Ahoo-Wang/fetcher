---
title: 'Consumption, cancellation, and safe transforms'
description: 'Consumption, cancellation, and safe transforms — @ahoo-wang/fetcher-eventstream 5.0.0'
---

# Consumption, cancellation, and safe transforms

A ReadableStream has one active reader. Decide which layer owns reading and cancellation before handing a stream to a UI or another transform.

## Async iteration {#iteration}

`isReadableStreamAsyncIterableSupported` is a boolean captured at module evaluation. When the global exists but native async iteration does not, the package installs a prototype method that returns `new ReadableStreamAsyncIterable<T>(stream)`. Native iterators are left untouched and retain their platform semantics.

| `ReadableStreamAsyncIterable<T>` member | Contract                                                                                                                 |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Constructor `(stream)`                  | Immediately calls `getReader()` and locks the stream; an existing lock throws.                                           |
| `locked`                                | Wrapper's ownership flag, initially true.                                                                                |
| `next()`                                | Returns `Promise<IteratorResult<T>>`; releases lock on EOF or read failure; read failures rethrow.                       |
| `return()`                              | Cancels the reader, logs cancellation failure at debug level, releases lock, returns done. Used by `break` in for-await. |
| `releaseLock(): boolean`                | Releases once and returns success; false after release or if release throws (logged at debug level). Does not cancel.    |
| `throw(error)`                          | Logs and releases lock, returns done; does not rethrow or cancel.                                                        |
| `[Symbol.asyncIterator]()`              | Returns the same wrapper; it is not a reusable independent reader factory.                                               |

Use `return()` for intentional early termination. Releasing a lock alone leaves the source active. After consuming a response body, neither reader release nor cancellation makes the body reusable. For a manually acquired reader, cancel on early exit and release in finally. See [Fetcher cancellation](../fetcher/errors-and-cancellation.md) for the network controller and the header-only timeout boundary.

## SafeTransformer {#transformers}

`SafeTransformer<I, O>` implements native `Transformer<I, O>`. Subclasses implement protected `onTransform(chunk, controller): void | Promise<void>` and may override `onFlush(controller)` and `onError(error, phase)`. `TransformerPhase` is `'transform' | 'flush'`.

`transform` ignores later chunks after termination. It catches the hook's error, marks terminated, invokes the guarded error hook, and calls `safeError` so readers observe failure. `flush` catches similarly and marks terminated in finally. Errors thrown by `onError` are suppressed so they cannot replace the original failure. Protected `enqueue` and `terminate` return booleans; `terminate` marks state before operating on the controller.

## Controller helpers {#controllers}

`StreamController<T>` is `ReadableStreamDefaultController<T> | TransformStreamDefaultController<T>`. `safeEnqueue(controller, chunk)`, `safeError(controller, reason)`, and `safeTerminate(transformController)` return true on success, false when the controller operation throws a native TypeError (including matching cross-realm native TypeErrors). Other errors propagate. These helpers do not validate payloads or swallow arbitrary exceptions just because their name says TypeError.

Construct a fresh transformer for each pipeline: its buffered/terminated state belongs to that stream. Pipe cancellation follows native Web Streams behavior; no retry, buffering limit option, or reconnection policy is introduced here.

## Complete example {#example}

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

## Public symbols and source {#symbols}

| Symbol                                                                                      | Implementation                                                                                                                                  |
| ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| <a id="readablestreamasynciterable"></a>`ReadableStreamAsyncIterable`                       | [readableStreamAsyncIterable.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreamAsyncIterable.ts#L54) |
| <a id="isreadablestreamasynciterablesupported"></a>`isReadableStreamAsyncIterableSupported` | [readableStreams.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/readableStreams.ts#L37)                         |
| <a id="transformerphase"></a>`TransformerPhase`                                             | [safeTransformer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L19)                         |
| <a id="safetransformer"></a>`SafeTransformer`                                               | [safeTransformer.ts:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/safeTransformer.ts#L44)                         |
| <a id="streamcontroller"></a>`StreamController`                                             | [streamController.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L24)                       |
| <a id="safeterminate"></a>`safeTerminate`                                                   | [streamController.ts:87](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L87)                       |
| <a id="safeenqueue"></a>`safeEnqueue`                                                       | [streamController.ts:105](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L105)                     |
| <a id="safeerror"></a>`safeError`                                                           | [streamController.ts:125](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/eventstream/src/streamController.ts#L125)                     |

[Package index](./index.md)
