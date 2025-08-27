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

import { describe, expect, it } from 'vitest';
import { FetcherError } from '../src';

describe('FetcherError', () => {
  it('should create FetcherError with default message', () => {
    const error = new FetcherError();
    expect(error).toBeInstanceOf(FetcherError);
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('FetcherError');
    expect(error.message).toBe('An error occurred in the fetcher');
  });

  it('should create FetcherError with custom message', () => {
    const errorMessage = 'Custom error message';
    const error = new FetcherError(errorMessage);
    expect(error.message).toBe(errorMessage);
  });

  it('should create FetcherError with cause', () => {
    const cause = new Error('Cause error');
    const error = new FetcherError(undefined, cause);
    expect(error.cause).toBe(cause);
    expect(error.message).toBe(cause.message);
  });

  it('should create FetcherError with custom message and cause', () => {
    const errorMessage = 'Custom error message';
    const cause = new Error('Cause error');
    const error = new FetcherError(errorMessage, cause);
    expect(error.message).toBe(errorMessage);
    expect(error.cause).toBe(cause);
  });

  it('should copy stack trace from cause', () => {
    const cause = new Error('Cause error');
    const error = new FetcherError(undefined, cause);
    expect(error.stack).toBe(cause.stack);
  });
});
