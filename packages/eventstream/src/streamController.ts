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

/**
 * Union type representing a stream controller that supports safe operations.
 *
 * Both ReadableStreamDefaultController and TransformStreamDefaultController
 * share the `enqueue()` and `error()` methods. TransformStreamDefaultController
 * additionally provides `terminate()`. This union type allows the safe
 * utility functions to work with either controller kind.
 *
 * @template T - The type of chunks the controller handles
 */
export type StreamController<T> =
  | ReadableStreamDefaultController<T>
  | TransformStreamDefaultController<T>;

/**
 * Executes an action and suppresses TypeError, returning a boolean indicating success.
 *
 * This is the shared implementation for all safe* controller functions.
 * Stream controller methods (terminate, enqueue, error) throw TypeError when
 * the stream is already closed or errored. This helper catches that TypeError
 * and returns false, while re-throwing any non-TypeError exceptions.
 *
 * @param action - The controller operation to attempt
 * @returns true if the action succeeded, false if a TypeError was caught
 */
function suppressTypeError(action: () => void): boolean {
  try {
    action();
    return true;
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    return false;
  }
}

/**
 * Safely terminates a TransformStream controller, ignoring the TypeError
 * that occurs if the stream has already been terminated.
 *
 * After controller.terminate() is called, upstream may still push chunks
 * before the backpressure signal propagates, causing transform() to be
 * invoked again. A second call to controller.terminate() throws TypeError,
 * which this function suppresses.
 *
 * @param controller - The TransformStream controller to terminate
 * @returns true if termination succeeded, false if the stream was already closed
 */
export function safeTerminate<T>(
  controller: TransformStreamDefaultController<T>,
): boolean {
  return suppressTypeError(() => controller.terminate());
}

/**
 * Safely enqueues a chunk to a stream controller, ignoring the TypeError
 * that occurs if the stream has already been closed or errored.
 *
 * After a stream is terminated or errored, upstream may still push chunks
 * before the signal propagates. Calling controller.enqueue() on a closed
 * stream throws TypeError, which this function suppresses.
 *
 * @param controller - The stream controller to enqueue to
 * @param chunk - The chunk to enqueue
 * @returns true if the chunk was enqueued, false if the stream was already closed
 */
export function safeEnqueue<T>(
  controller: StreamController<T>,
  chunk: T,
): boolean {
  return suppressTypeError(() => controller.enqueue(chunk));
}

/**
 * Safely errors a stream controller, ignoring the TypeError
 * that occurs if the stream has already been closed or errored.
 *
 * After a stream is terminated or errored, subsequent error signals may
 * arrive before the backpressure propagates. Calling controller.error()
 * on an already-closed stream throws TypeError, which this function
 * suppresses. Non-TypeError exceptions are re-thrown.
 *
 * @param controller - The stream controller to error
 * @param reason - The error reason to pass to the controller
 * @returns true if the error was set, false if the stream was already closed
 */
export function safeError<T>(
  controller: StreamController<T>,
  reason: any,
): boolean {
  return suppressTypeError(() => controller.error(reason));
}
