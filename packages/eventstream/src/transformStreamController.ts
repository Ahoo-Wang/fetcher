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
  try {
    controller.terminate();
    return true;
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    return false;
  }
}

/**
 * Safely enqueues a chunk to a TransformStream controller, ignoring the
 * TypeError that occurs if the stream has already been closed or errored.
 *
 * After a stream is terminated or errored, upstream may still push chunks
 * before the signal propagates. Calling controller.enqueue() on a closed
 * stream throws TypeError, which this function suppresses.
 *
 * @param controller - The TransformStream controller to enqueue to
 * @param chunk - The chunk to enqueue
 * @returns true if the chunk was enqueued, false if the stream was already closed
 */
export function safeEnqueue<T>(
  controller: TransformStreamDefaultController<T>,
  chunk: T,
): boolean {
  try {
    controller.enqueue(chunk);
    return true;
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    return false;
  }
}

/**
 * Safely errors a TransformStream controller, ignoring the TypeError
 * that occurs if the stream has already been closed or errored.
 *
 * After a stream is terminated or errored, subsequent error signals may
 * arrive before the backpressure propagates. Calling controller.error()
 * on an already-closed stream throws TypeError, which this function
 * suppresses. Non-TypeError exceptions are re-thrown.
 *
 * @param controller - The TransformStream controller to error
 * @param reason - The error reason to pass to the controller
 * @returns true if the error was set, false if the stream was already closed
 */
export function safeError<T>(
  controller: TransformStreamDefaultController<T>,
  reason: any,
): boolean {
  try {
    controller.error(reason);
    return true;
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error;
    }
    return false;
  }
}
