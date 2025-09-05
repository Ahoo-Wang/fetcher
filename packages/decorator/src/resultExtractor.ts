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

import {
  ExchangeResultExtractor,
  JsonResultExtractor,
  ResponseResultExtractor,
  ResultExtractor,
  TextResultExtractor,
} from '@ahoo-wang/fetcher';
import {
  EventStreamResultExtractor,
  JsonEventStreamResultExtractor,
} from '@ahoo-wang/fetcher-eventstream';

/**
 * Interface with result extractor capability
 * Defines an optional resultExtractor property
 */
export interface ResultExtractorCapable {
  resultExtractor?: ResultExtractor<any>;
}

/**
 * ResultExtractors is an object that maps result extractor names to their corresponding
 * extractor functions. These extractors are used to process and extract data from different
 * types of responses or results in the application.
 *
 * Each property represents a specific type of result extractor:
 * - Exchange: Handles exchange-related result extraction
 * - Response: Handles general response result extraction
 * - Json: Handles JSON format result extraction
 * - Text: Handles plain text result extraction
 * - EventStream: Handles server-sent event stream result extraction
 * - JsonEventStream: Handles JSON server-sent event stream result extraction
 */
export const ResultExtractors = {
  Exchange: ExchangeResultExtractor,
  Response: ResponseResultExtractor,
  Json: JsonResultExtractor,
  Text: TextResultExtractor,
  EventStream: EventStreamResultExtractor,
  JsonEventStream: JsonEventStreamResultExtractor,
  DEFAULT: JsonResultExtractor,
};
