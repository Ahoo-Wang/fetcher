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

import { type FetchRequest } from './fetchRequest.js';
import { FetcherError } from './fetcherError.js';

/**
 * Exception class thrown when an HTTP request times out.
 *
 * This error is thrown by the timeoutFetch function when a request exceeds its
 * timeout limit. A Fetcher rejects with an {@link ExchangeError} whose `cause`
 * is this error.
 *
 * @example
 * ```typescript
 * try {
 *   await fetcher.get('/users', { timeout: 1000 });
 * } catch (error) {
 *   if (error instanceof ExchangeError && error.cause instanceof FetchTimeoutError) {
 *     console.log(`Request timed out after ${error.cause.request.timeout}ms`);
 *   }
 * }
 * ```
 */
export class FetchTimeoutError extends FetcherError {
  /**
   * The request options that timed out.
   */
  request: FetchRequest;

  /**
   * Creates a new FetchTimeoutError instance.
   *
   * @param request - The request options that timed out
   */
  constructor(request: FetchRequest) {
    const method = request.method || 'GET';
    const message = `Request timeout of ${request.timeout}ms exceeded for ${method} ${request.url}`;
    super(message);
    this.name = 'FetchTimeoutError';
    this.request = request;
    // Fix prototype chain
    Object.setPrototypeOf(this, FetchTimeoutError.prototype);
  }
}

/**
 * Interface that defines timeout capability for HTTP requests.
 *
 * Objects implementing this interface can specify timeout values for HTTP requests.
 */
export interface TimeoutCapable {
  /**
   * Request timeout in milliseconds.
   *
   * When the value is 0, it indicates no timeout should be set.
   * The default value is undefined.
   */
  timeout?: number;
}

/**
 * Resolves request timeout settings, prioritizing request-level timeout settings.
 *
 * @param requestTimeout - Request-level timeout setting
 * @param optionsTimeout - Configuration-level timeout setting
 * @returns Resolved timeout setting
 *
 * @remarks
 * If requestTimeout is defined, it takes precedence over optionsTimeout.
 * Otherwise, optionsTimeout is returned. If both are undefined, undefined is returned.
 */
export function resolveTimeout(
  requestTimeout?: number,
  optionsTimeout?: number,
): number | undefined {
  if (typeof requestTimeout !== 'undefined') {
    return requestTimeout;
  }
  return optionsTimeout;
}

/**
 * Combines abort signals: the result aborts, with that signal's reason, as
 * soon as any of them does. `dispose` detaches the listeners the fallback
 * adds to long-lived caller signals; it is a no-op with `AbortSignal.any`.
 */
function anySignal(signals: AbortSignal[]): {
  signal?: AbortSignal;
  dispose: () => void;
} {
  const noop = () => {};
  if (signals.length <= 1) {
    return { signal: signals[0], dispose: noop };
  }
  if (typeof AbortSignal.any === 'function') {
    return { signal: AbortSignal.any(signals), dispose: noop };
  }
  const controller = new AbortController();
  const aborted = signals.find(signal => signal.aborted);
  if (aborted) {
    controller.abort(aborted.reason);
    return { signal: controller.signal, dispose: noop };
  }
  const onAbort = (event: Event) => {
    controller.abort((event.target as AbortSignal).reason);
    dispose();
  };
  const dispose = () => {
    for (const signal of signals) {
      signal.removeEventListener('abort', onAbort);
    }
  };
  for (const signal of signals) {
    signal.addEventListener('abort', onAbort);
  }
  return { signal: controller.signal, dispose };
}

/**
 * Executes an HTTP request, applying every cancellation source at once.
 *
 * The request is aborted by whichever comes first:
 * - the caller's `signal`,
 * - the caller's `abortController`,
 * - the timeout, when `timeout` is a positive number of milliseconds; it then
 *   rejects with a {@link FetchTimeoutError}.
 *
 * The timeout covers the request up to the response headers; reading the body
 * afterwards is bounded only by the caller's signal or controller. The
 * caller's objects are never modified: the request is not written to and the
 * caller's controller is never aborted by the timeout, so the same request can
 * be sent again.
 *
 * @param request - The request configuration including URL, method, headers, body, and optional timeout
 * @returns Promise that resolves to the Response object
 * @throws FetchTimeoutError if the request times out
 * @throws The abort reason of the caller's signal or controller when it aborts
 * @throws TypeError for network errors
 *
 * @example
 * ```typescript
 * try {
 *   const response = await timeoutFetch({
 *     url: 'https://api.example.com/users',
 *     timeout: 5000,
 *   });
 * } catch (error) {
 *   if (error instanceof FetchTimeoutError) {
 *     console.log(`Request timed out after ${error.request.timeout}ms`);
 *   }
 * }
 * ```
 */
export async function timeoutFetch(request: FetchRequest): Promise<Response> {
  const { url, timeout } = request;
  const signals: AbortSignal[] = [];
  if (request.signal) signals.push(request.signal);
  if (request.abortController) signals.push(request.abortController.signal);

  if (!timeout || timeout <= 0) {
    const { signal, dispose } = anySignal(signals);
    try {
      return await fetch(url, { ...(request as RequestInit), signal });
    } finally {
      dispose();
    }
  }

  const timeoutController = new AbortController();
  const { signal, dispose } = anySignal([...signals, timeoutController.signal]);
  let timerId: ReturnType<typeof setTimeout> | undefined;
  // Rejects even if a fetch implementation ignores the signal.
  const timeoutPromise = new Promise<never>((_, reject) => {
    timerId = setTimeout(() => {
      const error = new FetchTimeoutError(request);
      timeoutController.abort(error);
      reject(error);
    }, timeout);
  });
  try {
    return await Promise.race([
      fetch(url, { ...(request as RequestInit), signal }),
      timeoutPromise,
    ]);
  } finally {
    clearTimeout(timerId);
    dispose();
  }
}
