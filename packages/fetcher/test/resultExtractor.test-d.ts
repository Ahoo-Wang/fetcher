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
import { describe, expectTypeOf, it } from 'vitest';
import {
  ArrayBufferResultExtractor,
  BlobResultExtractor,
  BytesResultExtractor,
  type FetchExchange,
  JsonResultExtractor,
  type ResultExtractor,
  ResultExtractors,
  TextResultExtractor,
} from '../src';

// #2039: the body extractors are extractors of the body, not of a Promise.
describe('built-in body extractors', () => {
  it('are ResultExtractors of the body type', () => {
    expectTypeOf(TextResultExtractor).toExtend<ResultExtractor<string>>();
    expectTypeOf(BlobResultExtractor).toExtend<ResultExtractor<Blob>>();
    expectTypeOf(ArrayBufferResultExtractor).toExtend<
      ResultExtractor<ArrayBuffer>
    >();
    expectTypeOf(BytesResultExtractor).toExtend<
      ResultExtractor<Uint8Array<ArrayBuffer>>
    >();
    expectTypeOf(JsonResultExtractor).toExtend<
      ResultExtractor<{ id: string }>
    >();
    expectTypeOf(ResultExtractors.Text).toExtend<ResultExtractor<string>>();
  });

  it('return a Promise of the body', () => {
    expectTypeOf(TextResultExtractor)
      .parameter(0)
      .toEqualTypeOf<FetchExchange>();
    expectTypeOf(TextResultExtractor).returns.toEqualTypeOf<Promise<string>>();
    expectTypeOf(BlobResultExtractor).returns.toEqualTypeOf<Promise<Blob>>();
  });
});
