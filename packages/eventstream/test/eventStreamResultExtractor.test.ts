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

import { describe, expect, it, vi } from 'vitest';
import type { FetchRequest } from '@ahoo-wang/fetcher';
import { FetchExchange } from '@ahoo-wang/fetcher';
import {
  EventStreamConvertError,
  EventStreamIncompleteError,
  EventStreamResultExtractor,
  JsonEventStreamResultExtractor,
  jsonEventStreamResultExtractor,
} from '../src';
import { foreignResponse } from './foreignResponse';

const SSE = { 'Content-Type': 'text/event-stream' };

function exchangeOf(response: Response) {
  return new FetchExchange({
    fetcher: {} as any,
    request: { url: '/test' } as FetchRequest,
    response,
  });
}

async function collect<T>(stream: ReadableStream<T>) {
  const values: T[] = [];
  for await (const value of stream) values.push(value);
  return values;
}

describe.each([
  [
    'the global Response',
    (body?: BodyInit | null, init?: ResponseInit) => new Response(body, init),
  ],
  ['a Response from another constructor', foreignResponse],
])('result extractors with %s', (_, createResponse) => {
  it('EventStreamResultExtractor returns the raw event stream', async () => {
    const response = createResponse('data: one\n\ndata: two\n\n', {
      headers: SSE,
    });
    const events = await collect(
      EventStreamResultExtractor(exchangeOf(response)),
    );
    expect(events.map(event => event.data)).toEqual(['one', 'two']);
  });

  it('JsonEventStreamResultExtractor parses each event as JSON', async () => {
    const response = createResponse('data: {"id":1}\n\n', { headers: SSE });
    const events = await collect(
      JsonEventStreamResultExtractor(exchangeOf(response)),
    );
    expect(events.map(event => event.data)).toEqual([{ id: 1 }]);
  });

  it('jsonEventStreamResultExtractor ends at the terminating event', async () => {
    const extractor = jsonEventStreamResultExtractor<{ id: number }>(
      event => event.data === '[DONE]',
    );
    const done = createResponse('data: {"id":1}\n\ndata: [DONE]\n\n', {
      headers: SSE,
    });
    const events = await collect(extractor(exchangeOf(done)));
    expect(events.map(event => event.data)).toEqual([{ id: 1 }]);

    const cut = createResponse('data: {"id":1}\n\n', { headers: SSE });
    await expect(collect(extractor(exchangeOf(cut)))).rejects.toBeInstanceOf(
      EventStreamIncompleteError,
    );
  });

  it('rejects a response that is not an event stream', () => {
    const response = createResponse('{}', {
      headers: { 'Content-Type': 'application/json' },
    });
    expect(() => EventStreamResultExtractor(exchangeOf(response))).toThrow(
      new EventStreamConvertError(
        response,
        'Event stream is not available. Response content-type: [application/json]',
      ),
    );
    expect(() => JsonEventStreamResultExtractor(exchangeOf(response))).toThrow(
      EventStreamConvertError,
    );
  });

  it('rejects an event stream without a body', () => {
    const response = createResponse(null, { headers: SSE });
    expect(() => EventStreamResultExtractor(exchangeOf(response))).toThrow(
      'Response body is null',
    );
  });

  it('rejects an event stream whose body is already used', async () => {
    const response = createResponse('data: one\n\n', { headers: SSE });
    await response.text();
    expect(() => JsonEventStreamResultExtractor(exchangeOf(response))).toThrow(
      'Response body is already used',
    );
  });

  it('cancels the body when the consumer stops early', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: {"id":1}\n\n'));
      },
      cancel() {
        cancelled = true;
      },
    });
    const response = createResponse(body, { headers: SSE });
    for await (const event of JsonEventStreamResultExtractor(
      exchangeOf(response),
    )) {
      expect(event.data).toEqual({ id: 1 });
      break;
    }
    // Cancellation reaches the body through the pipe chain asynchronously.
    await vi.waitFor(() => expect(cancelled).toBe(true));
  });
});
