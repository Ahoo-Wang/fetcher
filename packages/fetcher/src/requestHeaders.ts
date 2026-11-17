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

import type { RequestHeaders } from './fetchRequest.js';

/** Reads a header regardless of its spelling. The last matching key wins. */
export function getHeader(
  headers: RequestHeaders | undefined,
  name: string,
): string | undefined {
  const lowerName = name.toLowerCase();
  const key = Object.keys(headers ?? {})
    .reverse()
    .find(key => key.toLowerCase() === lowerName);
  return key === undefined ? undefined : headers?.[key];
}

/** Removes every spelling of a header from the supplied record. */
export function deleteHeader(headers: RequestHeaders, name: string): void {
  const lowerName = name.toLowerCase();
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === lowerName) {
      delete headers[key];
    }
  }
}

/** Replaces every spelling of a header with `name`, as an own data field. */
function putHeader(
  headers: RequestHeaders,
  name: string,
  value: string | undefined,
): void {
  deleteHeader(headers, name);
  Object.defineProperty(headers, name, {
    value,
    enumerable: true,
    writable: true,
    configurable: true,
  });
}

/** Replaces a header, retaining the supplied spelling; undefined removes it. */
export function setHeader(
  headers: RequestHeaders,
  name: string,
  value: string | undefined,
): void {
  if (value === undefined) deleteHeader(headers, name);
  else putHeader(headers, name, value);
}

/** Merges records with case-insensitive replacement by the last layer. */
export function mergeHeaders(
  ...headers: (RequestHeaders | undefined)[]
): RequestHeaders {
  const merged: RequestHeaders = {};
  for (const record of headers) {
    for (const [name, value] of Object.entries(record ?? {})) {
      setHeader(merged, name, value);
    }
  }
  return merged;
}

/**
 * Merges the header layers of a request a `Fetcher` has yet to send,
 * keeping removals. Like {@link mergeHeaders}, a later layer replaces every
 * spelling of a name; but an `undefined` (or `null`) value stays in the
 * result as `undefined` instead of being dropped. The Fetcher's own merge
 * then removes its default too, as it does for `{ Authorization: undefined }`
 * passed to it directly. `mergeRequest` and the decorator merge with this;
 * the Fetcher's final merge drops the markers, so `fetch` never sees them.
 */
export function mergeHeaderOverrides(
  ...headers: (RequestHeaders | undefined)[]
): RequestHeaders {
  const merged: RequestHeaders = {};
  for (const record of headers) {
    for (const [name, value] of Object.entries(record ?? {})) {
      putHeader(merged, name, value ?? undefined);
    }
  }
  return merged;
}
