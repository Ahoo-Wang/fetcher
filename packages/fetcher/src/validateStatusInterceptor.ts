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

import { type ResponseInterceptor } from './interceptor';
import { FetchExchange } from './fetchExchange';
import { ExchangeError } from './fetcherError';

/**
 * Error thrown when response status validation fails.
 *
 * This error is thrown by ValidateStatusInterceptor when the response status
 * does not pass the validation defined by the validateStatus function.
 */
export class HttpStatusValidationError extends ExchangeError {
  constructor(exchange: FetchExchange) {
    super(
      exchange,
      `Request failed with status code ${exchange.response?.status} for ${exchange.request.url}`,
    );
    this.name = 'HttpStatusValidationError';
    Object.setPrototypeOf(this, HttpStatusValidationError.prototype);
  }
}

/**
 * Defines whether to resolve or reject the promise for a given HTTP response status code.
 * If `validateStatus` returns `true` (or is set to `null` or `undefined`), the promise will be resolved;
 * otherwise, the promise will be rejected.
 *
 * @param status - HTTP response status code
 * @returns true to resolve the promise, false to reject it
 *
 * @example
 * ```typescript
 * // Default behavior (2xx status codes are resolved)
 * const fetcher = new Fetcher();
 *
 * // Custom behavior (only 200 status code is resolved)
 * const fetcher = new Fetcher({
 *   validateStatus: (status) => status === 200
 * });
 *
 * // Always resolve (never reject based on status)
 * const fetcher = new Fetcher({
 *   validateStatus: (status) => true
 * });
 * ```
 */
type ValidateStatus = (status: number) => boolean;

const DEFAULT_VALIDATE_STATUS: ValidateStatus = (status: number) =>
  status >= 200 && status < 300;

/**
 * The name of the ValidateStatusInterceptor.
 */
export const VALIDATE_STATUS_INTERCEPTOR_NAME = 'ValidateStatusInterceptor';

/**
 * The order of the ValidateStatusInterceptor.
 * Set to Number.MAX_SAFE_INTEGER - 1000 to ensure it runs latest among response interceptors,
 * but still allows other interceptors to run after it if needed.
 */
export const VALIDATE_STATUS_INTERCEPTOR_ORDER = Number.MAX_SAFE_INTEGER - 1000;

/**
 * Response interceptor that validates HTTP status codes.
 *
 * This interceptor implements behavior similar to axios's validateStatus option.
 * It checks the response status code against a validation function and throws
 * an error if the status is not valid.
 *
 * @remarks
 * This interceptor runs at the very beginning of the response interceptor chain to ensure
 * status validation happens before any other response processing. The order is set to
 * VALIDATE_STATUS_INTERCEPTOR_ORDER to ensure it executes early in the response chain,
 * allowing for other response interceptors to run after it if needed. This positioning
 * ensures that invalid responses are caught and handled early in the response processing
 * pipeline, before other response handlers attempt to process them.
 *
 * @example
 * ```typescript
 * // Default behavior (2xx status codes are valid)
 * const interceptor = new ValidateStatusInterceptor();
 *
 * // Custom validation (only 200 status code is valid)
 * const interceptor = new ValidateStatusInterceptor((status) => status === 200);
 *
 * // Always valid (never throws based on status)
 * const interceptor = new ValidateStatusInterceptor((status) => true);
 * ```
 */
export class ValidateStatusInterceptor implements ResponseInterceptor {
  /**
   * Gets the name of this interceptor.
   *
   * @returns The name of this interceptor
   */
  get name(): string {
    return VALIDATE_STATUS_INTERCEPTOR_NAME;
  }

  /**
   * Gets the order of this interceptor.
   *
   * @returns VALIDATE_STATUS_INTERCEPTOR_ORDER, indicating this interceptor should execute early
   */
  get order(): number {
    return VALIDATE_STATUS_INTERCEPTOR_ORDER;
  }

  /**
   * Creates a new ValidateStatusInterceptor instance.
   *
   * @param validateStatus - Function that determines if a status code is valid
   */
  constructor(
    private readonly validateStatus: ValidateStatus = DEFAULT_VALIDATE_STATUS,
  ) {
  }

  /**
   * Validates the response status code.
   *
   * @param exchange - The exchange containing the response to validate
   * @throws HttpStatusValidationError if the status code is not valid
   *
   * @remarks
   * This method runs at the beginning of the response interceptor chain to ensure
   * status validation happens before any other response processing. Invalid responses
   * are caught and converted to HttpStatusValidationError early in the pipeline,
   * preventing other response handlers from attempting to process them. Valid responses
   * proceed through the rest of the response interceptor chain normally.
   */
  intercept(exchange: FetchExchange) {
    // Only validate if there's a response
    if (!exchange.response) {
      return;
    }

    const status = exchange.response.status;
    // If status is valid, do nothing
    if (this.validateStatus(status)) {
      return;
    }
    throw new HttpStatusValidationError(exchange);
  }
}
