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

import type { AttributesCapable } from './fetchExchange.js';
import type { ResultExtractorCapable } from './resultExtractor.js';
import { ResultExtractors } from './resultExtractor.js';

/**
 * Options for individual requests.
 */
export interface RequestOptions
  extends AttributesCapable, ResultExtractorCapable {}

/** `Fetcher.request` and `exchange` resolve to the `FetchExchange`. */
export const DEFAULT_REQUEST_OPTIONS: RequestOptions = {
  resultExtractor: ResultExtractors.Exchange,
};

/** `Fetcher.fetch` and the method shortcuts resolve to the `Response`. */
export const DEFAULT_FETCH_OPTIONS: RequestOptions = {
  resultExtractor: ResultExtractors.Response,
};

/**
 * Merges two request options objects into one, with the second object taking precedence over the first.
 *
 * @param first - The first request options object (optional)
 * @param second - The second request options object which will override properties from the first (optional)
 * @returns A new RequestOptions object with merged properties
 */
export function mergeRequestOptions(
  first?: RequestOptions,
  second?: RequestOptions,
): RequestOptions {
  // When `second` fully specifies both resultExtractor and attributes,
  // it constitutes a complete override — no merge with `first` is needed.
  // Note: this means `first.attributes` is discarded, not merged.
  if (second && second.resultExtractor && second.attributes) {
    return second;
  }
  return {
    resultExtractor:
      second?.resultExtractor ??
      first?.resultExtractor ??
      DEFAULT_REQUEST_OPTIONS.resultExtractor,
    attributes: second?.attributes ?? first?.attributes,
  };
}
