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
import type { FetchExchange } from '@ahoo-wang/fetcher';
import {
  EventStreamConvertError,
  EventStreamIncompleteError,
  jsonEventStreamResultExtractor,
  toServerSentEventStream,
} from '../src';

function sse(text: string): Response {
  return new Response(text, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}

async function collect<T>(stream: ReadableStream<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of stream) items.push(item);
  return items;
}

describe('eventstream errors', () => {
  it('can be subclassed without resetting the prototype', () => {
    class AppConvertError extends EventStreamConvertError {}
    class AppIncompleteError extends EventStreamIncompleteError {}
    expect(new AppConvertError(sse(''))).toBeInstanceOf(AppConvertError);
    expect(new AppIncompleteError()).toBeInstanceOf(AppIncompleteError);
  });

  it('rejects converting a body twice with EventStreamConvertError', () => {
    const response = sse('data: a\n\n');
    toServerSentEventStream(response);
    expect(() => toServerSentEventStream(response)).toThrow(
      EventStreamConvertError,
    );
  });
});

describe('jsonEventStreamResultExtractor', () => {
  const exchangeOf = (response: Response) =>
    ({ requiredResponse: response }) as unknown as FetchExchange;

  it('ends at the terminating event without yielding it', async () => {
    const extract = jsonEventStreamResultExtractor<{ n: number }>(
      event => event.data === '[DONE]',
    );
    const stream = await extract(
      exchangeOf(sse('data: {"n":1}\n\ndata: [DONE]\n\n')),
    );
    expect((await collect(stream)).map(event => event.data)).toEqual([
      { n: 1 },
    ]);
  });

  it('errors when the stream ends before the terminating event', async () => {
    const extract = jsonEventStreamResultExtractor(
      event => event.data === '[DONE]',
    );
    const stream = await extract(exchangeOf(sse('data: {"n":1}\n\n')));
    await expect(collect(stream)).rejects.toBeInstanceOf(
      EventStreamIncompleteError,
    );
  });
});
