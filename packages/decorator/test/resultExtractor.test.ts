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
import { ResultExtractors } from '../src';
import {
  ExchangeResultExtractor,
  JsonResultExtractor,
  ResponseResultExtractor,
  TextResultExtractor,
} from '@ahoo-wang/fetcher';
import {
  EventStreamResultExtractor,
  JsonEventStreamResultExtractor,
} from '@ahoo-wang/fetcher-eventstream';

describe('ResultExtractors object', () => {
  it('should contain all result extractors', () => {
    expect(ResultExtractors.Exchange).toBe(ExchangeResultExtractor);
    expect(ResultExtractors.Response).toBe(ResponseResultExtractor);
    expect(ResultExtractors.Json).toBe(JsonResultExtractor);
    expect(ResultExtractors.Text).toBe(TextResultExtractor);
    expect(ResultExtractors.EventStream).toBe(EventStreamResultExtractor);
    expect(ResultExtractors.JsonEventStream).toBe(
      JsonEventStreamResultExtractor,
    );
  });

  it('should have correct DEFAULT extractor', () => {
    expect(ResultExtractors.DEFAULT).toBe(JsonResultExtractor);
  });
});
