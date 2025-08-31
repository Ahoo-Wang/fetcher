/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { describe, expect, it } from 'vitest';
import { EventStreamConvertError } from '../src';

describe('EventStreamConvertError', () => {
  it('should create an instance with all parameters', () => {
    const response = new Response('test');
    const errorMsg = 'Test error message';
    const cause = new Error('Original error');

    const error = new EventStreamConvertError(response, errorMsg, cause);

    expect(error).toBeInstanceOf(EventStreamConvertError);
    expect(error).toBeInstanceOf(Error);
    expect(error.response).toBe(response);
    expect(error.message).toBe(errorMsg);
    expect(error.cause).toBe(cause);
    expect(error.name).toBe('EventStreamConvertError');
  });

  it('should create an instance with only response and message', () => {
    const response = new Response('test');
    const errorMsg = 'Test error message';

    const error = new EventStreamConvertError(response, errorMsg);

    expect(error).toBeInstanceOf(EventStreamConvertError);
    expect(error.response).toBe(response);
    expect(error.message).toBe(errorMsg);
    expect(error.cause).toBeUndefined();
  });

  it('should create an instance with only response', () => {
    const response = new Response('test');

    const error = new EventStreamConvertError(response);

    expect(error).toBeInstanceOf(EventStreamConvertError);
    expect(error.response).toBe(response);
    expect(error.message).toBe('An error occurred in the fetcher');
    expect(error.cause).toBeUndefined();
  });
});