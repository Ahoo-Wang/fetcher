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
import { HttpMethod, mergeRequest, ResultExtractors } from '../src';
import { mergeRequestOptions } from '../src/mergeRequest';
import { DEFAULT_REQUEST_OPTIONS } from '../src/fetcher';

describe('mergeRequest', () => {
  it('should return second request when first request is empty', () => {
    const first = {};
    const second = {
      method: HttpMethod.POST,
      urlParams: { path: { id: 1 }, query: { filter: 'active' } },
      headers: { 'Content-Type': 'application/json' },
    };

    const result = mergeRequest(first, second);
    expect(result).toEqual(second);
  });

  it('should return first request when second request is empty', () => {
    const first = {
      method: HttpMethod.GET,
      urlParams: { path: { userId: 123 } },
      headers: { Authorization: 'Bearer token' },
    };
    const second = {};

    const result = mergeRequest(first, second);
    expect(result).toEqual(first);
  });

  it('should merge path parameters', () => {
    const first = {
      urlParams: { path: { id: 1 } },
    };
    const second = {
      urlParams: { path: { action: 'edit' } },
    };

    const result = mergeRequest(first, second);
    expect(result.urlParams?.path).toEqual({ id: 1, action: 'edit' });
  });

  it('should merge query parameters', () => {
    const first = {
      urlParams: { query: { page: 1, limit: 10 } },
    };
    const second = {
      urlParams: { query: { filter: 'active', sort: 'name' } },
    };

    const result = mergeRequest(first, second);
    expect(result.urlParams?.query).toEqual({
      page: 1,
      limit: 10,
      filter: 'active',
      sort: 'name',
    });
  });

  it('should merge headers', () => {
    const first = {
      headers: { 'Content-Type': 'application/json' },
    };
    const second = {
      headers: { Authorization: 'Bearer token' },
    };

    const result = mergeRequest(first, second);
    expect(result.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token',
    });
  });

  it('should give second request precedence for primitive values', () => {
    const first = {
      method: HttpMethod.GET,
      timeout: 1000,
    };
    const second = {
      method: HttpMethod.POST,
      timeout: 2000,
    };

    const result = mergeRequest(first, second);
    expect(result.method).toBe(HttpMethod.POST);
    expect(result.timeout).toBe(2000);
  });

  it('should handle undefined values correctly', () => {
    const first = {
      method: HttpMethod.GET,
      timeout: undefined,
    };
    const second = {
      method: undefined,
      timeout: 2000,
    };

    const result = mergeRequest(first, second);
    expect(result.method).toBe(HttpMethod.GET);
    expect(result.timeout).toBe(2000);
  });

  it('should handle null body values correctly', () => {
    const first = {
      body: null,
    };
    const second = {
      body: undefined,
    };

    const result = mergeRequest(first, second);
    expect(result.body).toBe(null);

    const result2 = mergeRequest(second, first);
    expect(result2.body).toBe(undefined);
  });

  it('should merge complex requests correctly', () => {
    const first = {
      method: HttpMethod.GET,
      urlParams: {
        path: { userId: 123 },
        query: { page: 1 },
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer old-token',
      },
      timeout: 5000,
    };

    const second = {
      method: HttpMethod.POST,
      urlParams: {
        path: { postId: 456 },
        query: { filter: 'active' },
      },
      headers: {
        Authorization: 'Bearer new-token',
      },
      timeout: 3000,
    };

    const result = mergeRequest(first, second);
    expect(result).toEqual({
      method: HttpMethod.POST,
      urlParams: {
        path: { userId: 123, postId: 456 },
        query: { page: 1, filter: 'active' },
      },
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer new-token',
      },
      timeout: 3000,
    });
  });

  it('should preserve signal from second request', () => {
    const abortController = new AbortController();
    const first = {
      signal: undefined,
    };
    const second = {
      signal: abortController.signal,
    };

    const result = mergeRequest(first, second);
    expect(result.signal).toBe(abortController.signal);
  });

  it('should handle empty objects correctly', () => {
    const first = {};
    const second = {};

    const result = mergeRequest(first, second);
    expect(result).toEqual({});
  });
});

describe('mergeRequestOptions', () => {
  it('should return default options when both parameters are undefined', () => {
    const result = mergeRequestOptions(undefined, undefined);

    expect(result.resultExtractor).toBe(DEFAULT_REQUEST_OPTIONS.resultExtractor);
    expect(result.attributes).toBeUndefined();
  });

  it('should return first options when second is undefined', () => {
    const first = {
      resultExtractor: ResultExtractors.Response,
      attributes: { test: 'value' },
    };

    const result = mergeRequestOptions(first, undefined);

    expect(result.resultExtractor).toBe(first.resultExtractor);
    expect(result.attributes).toBe(first.attributes);
  });

  it('should return second options when first is undefined', () => {
    const second = {
      resultExtractor: ResultExtractors.Response,
      attributes: { test: 'value' },
    };

    const result = mergeRequestOptions(undefined, second);

    expect(result.resultExtractor).toBe(second.resultExtractor);
    expect(result.attributes).toBe(second.attributes);
  });

  it('should merge options with second taking precedence', () => {
    const first = {
      resultExtractor: ResultExtractors.Response,
      attributes: { first: 'value1' },
    };

    const second = {
      resultExtractor: ResultExtractors.Exchange,
      attributes: { second: 'value2' },
    };

    const result = mergeRequestOptions(first, second);

    expect(result.resultExtractor).toBe(second.resultExtractor);
    expect(result.attributes).toBe(second.attributes);
  });

  it('should handle partial options correctly', () => {
    const first = {
      resultExtractor: ResultExtractors.Response,
    };

    const second = {
      attributes: { test: 'value' },
    };

    const result = mergeRequestOptions(first, second);

    expect(result.resultExtractor).toBe(first.resultExtractor);
    expect(result.attributes).toBe(second.attributes);
  });

  it('should use default result extractor when neither options provide one', () => {
    const first = {
      attributes: { test: 'first' },
    };

    const second = {
      attributes: { test: 'second' },
    };

    const result = mergeRequestOptions(first, second);

    expect(result.resultExtractor).toBe(DEFAULT_REQUEST_OPTIONS.resultExtractor);
    expect(result.attributes).toBe(second.attributes);
  });
});
