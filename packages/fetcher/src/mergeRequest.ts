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

import { FetchRequestInit } from './fetchRequest';
import { UrlParams } from './urlBuilder';
import { mergeRecords } from './utils';

/**
 * Merges two FetcherRequest objects into one.
 *
 * This function combines two FetcherRequest objects, with the second object's properties
 * taking precedence over the first object's properties. Special handling is applied
 * to nested objects like path, query, and headers which are merged recursively.
 * For primitive values, the second object's values override the first's.
 *
 * @param first - The first request object (lower priority)
 * @param second - The second request object (higher priority)
 * @returns A new FetcherRequest object with merged properties
 *
 * @example
 * ```typescript
 * const request1 = {
 *   method: 'GET',
 *   path: { id: 1 },
 *   headers: { 'Content-Type': 'application/json' }
 * };
 *
 * const request2 = {
 *   method: 'POST',
 *   query: { filter: 'active' },
 *   headers: { 'Authorization': 'Bearer token' }
 * };
 *
 * const merged = mergeRequest(request1, request2);
 * // Result: {
 * //   method: 'POST',
 * //   path: { id: 1 },
 * //   query: { filter: 'active' },
 * //   headers: {
 * //     'Content-Type': 'application/json',
 * //     'Authorization': 'Bearer token'
 * //   }
 * // }
 * ```
 */
export function mergeRequest(
  first: FetchRequestInit,
  second: FetchRequestInit,
): FetchRequestInit {
  // If first request is empty, return second request
  if (Object.keys(first).length === 0) {
    return second;
  }

  // If second request is empty, return first request
  if (Object.keys(second).length === 0) {
    return first;
  }

  // Merge nested objects
  const urlParams: UrlParams = {
    path: mergeRecords(first.urlParams?.path, second.urlParams?.path),
    query: mergeRecords(first.urlParams?.query, second.urlParams?.query),
  };

  const headers = {
    ...first.headers,
    ...second.headers,
  };

  // For primitive values, second takes precedence
  const method = second.method ?? first.method;
  const body = second.body ?? first.body;
  const timeout = second.timeout ?? first.timeout;
  const signal = second.signal ?? first.signal;

  // Return merged request with second object's top-level properties taking precedence
  return {
    ...first,
    ...second,
    method,
    urlParams,
    headers,
    body,
    timeout,
    signal,
  };
}