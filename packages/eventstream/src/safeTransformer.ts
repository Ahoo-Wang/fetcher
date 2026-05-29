/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { safeEnqueue, safeError, safeTerminate } from './streamController';

/**
 * Identifies the lifecycle phase where an error occurred.
 */
export type TransformerPhase = 'transform' | 'flush';

/**
 * Abstract base class for TransformStream transformers with built-in error safety
 * and termination guard.
 *
 * Provides three guarantees that every concrete transformer inherits:
 *
 * 1. **Termination guard** — Once `terminated` is set (via `terminate()` or an
 *    unhandled error), all subsequent chunks are silently dropped in `transform()`.
 *
 * 2. **Safe controller operations** — `enqueue()` delegates to
 *    `safeEnqueue` which suppresses TypeError from already-closed streams.
 *    `terminate()` delegates to `safeTerminate`.
 *
 * 3. **Error boundary** — Unhandled errors in `onTransform()` / `onFlush()`
 *    are caught, the transformer is terminated, and the error is forwarded
 *    via `safeError()`.
 *
 * Subclasses implement `onTransform()` and optionally `onFlush()` instead of
 * the raw `transform()` / `flush()` methods.
 *
 * @template I - The type of input chunks
 * @template O - The type of output chunks
 */
export abstract class SafeTransformer<I, O> implements Transformer<I, O> {
  /**
   * Guard flag indicating the stream has been terminated or errored.
   * Once set, subsequent chunks are silently dropped in `transform()`.
   */

  protected terminated = false;

  /**
   * Transforms an input chunk. Drops immediately if terminated.
   * Delegates to `onTransform()` with error protection.
   * Supports both synchronous and asynchronous `onTransform()` implementations.
   */
  async transform(
    chunk: I,
    controller: TransformStreamDefaultController<O>,
  ): Promise<void> {
    if (this.terminated) {
      return;
    }

    try {
      await this.onTransform(chunk, controller);
    } catch (error) {
      this.terminated = true;
      this.safeOnError(error, 'transform');
      safeError(controller, error);
    }
  }

  /**
   * Called when the stream ends. Always invokes `onFlush()` for cleanup,
   * even if already terminated. Errors in `onFlush()` are caught and
   * forwarded via `safeError()`.
   * Supports both synchronous and asynchronous `onFlush()` implementations.
   */
  async flush(controller: TransformStreamDefaultController<O>): Promise<void> {
    try {
      await this.onFlush(controller);
    } catch (error) {
      this.terminated = true;
      this.safeOnError(error, 'flush');
      safeError(controller, error);
    } finally {
      this.terminated = true;
    }
  }

  /**
   * Safely invokes `onError()`, catching any exception to prevent
   * cleanup logic from breaking the error boundary guarantee.
   */
  private safeOnError(error: unknown, phase: TransformerPhase): void {
    try {
      this.onError(error, phase);
    } catch {
      // onError must not break the error boundary
    }
  }

  /**
   * Marks the transformer as terminated and safely terminates the controller.
   * After calling this, all subsequent chunks are silently dropped.
   */
  protected terminate(controller: TransformStreamDefaultController<O>): boolean {
    this.terminated = true;
    return safeTerminate(controller);
  }

  /**
   * Safely enqueues a chunk to the controller.
   * Suppresses TypeError if the stream is already closed.
   */
  protected enqueue(
    controller: TransformStreamDefaultController<O>,
    chunk: O,
  ): boolean {
    return safeEnqueue(controller, chunk);
  }

  /**
   * Called when an error occurs during `onTransform()` or `onFlush()`.
   * Subclasses can override to clean up internal state (e.g. reset buffers).
   * The stream is already marked as terminated when this is called.
   *
   * @param error - The error that was caught
   * @param phase - The lifecycle phase where the error occurred
   */
  protected onError(error: unknown, phase: TransformerPhase): void {
  }

  /**
   * Transform an input chunk into output chunk(s).
   * Use `this.enqueue(controller, chunk)` instead of `controller.enqueue()`.
   * May return a Promise for asynchronous processing.
   *
   * @param chunk - The input chunk to transform
   * @param controller - The stream controller (use `this.enqueue()` for output)
   */
  protected abstract onTransform(
    chunk: I,
    controller: TransformStreamDefaultController<O>,
  ): void | Promise<void>;

  /**
   * Called when the stream is ending. Override to flush remaining state.
   * May return a Promise for asynchronous processing.
   * Default implementation does nothing.
   *
   * @param controller
   */
  protected onFlush(
    controller: TransformStreamDefaultController<O>,
  ): void | Promise<void> {
    // Default: nothing to flush
  }
}
