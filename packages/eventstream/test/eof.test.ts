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
  EventStreamIncompleteError,
  TextLineTransformStream,
  toJsonServerSentEventStream,
  toServerSentEventStream,
} from '../src';

function responseOf(...chunks: string[]): Response {
  const encoder = new TextEncoder();
  return new Response(
    new ReadableStream({
      start(controller) {
        for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
        controller.close();
      },
    }),
  );
}

async function collect<T>(stream: ReadableStream<T>): Promise<T[]> {
  const items: T[] = [];
  for await (const item of stream) items.push(item);
  return items;
}

describe('end of stream', () => {
  it('drops a final line cut off before its terminator', async () => {
    const events = await collect(
      toServerSentEventStream(responseOf('data: a\n\n', 'data: par')),
    );
    expect(events.map(event => event.data)).toEqual(['a']);
  });

  it('still dispatches complete lines that miss only the closing blank line', async () => {
    const events = await collect(
      toServerSentEventStream(responseOf('data: a\n\n', 'data: b\n')),
    );
    expect(events.map(event => event.data)).toEqual(['a', 'b']);
  });

  it('reports retry only on the event that set it', async () => {
    const events = await collect(
      toServerSentEventStream(
        responseOf(
          'retry: 100\ndata: a\n\n',
          'id: 7\ndata: b\n\n',
          'data: c\n\n',
        ),
      ),
    );
    expect(events.map(({ retry, id }) => ({ retry, id }))).toEqual([
      { retry: 100, id: '' },
      { retry: undefined, id: '7' },
      // The last event ID carries over.
      { retry: undefined, id: '7' },
    ]);
  });

  it('errors a JSON stream that ends before its terminating event', async () => {
    const stream = toJsonServerSentEventStream(
      toServerSentEventStream(responseOf('data: {"a":1}\n\n')),
      event => event.data === '[DONE]',
    );
    const received: unknown[] = [];
    await expect(
      (async () => {
        for await (const event of stream) received.push(event.data);
      })(),
    ).rejects.toBeInstanceOf(EventStreamIncompleteError);
    expect(received).toEqual([{ a: 1 }]);
  });

  it('completes a JSON stream that reaches its terminating event', async () => {
    const stream = toJsonServerSentEventStream(
      toServerSentEventStream(
        responseOf('data: {"a":1}\n\n', 'data: [DONE]\n\n'),
      ),
      event => event.data === '[DONE]',
    );
    expect((await collect(stream)).map(event => event.data)).toEqual([
      { a: 1 },
    ]);
  });

  it('completes a JSON stream without a terminate detector at any end', async () => {
    const stream = toJsonServerSentEventStream(
      toServerSentEventStream(responseOf('data: {"a":1}\n\n')),
    );
    expect(await collect(stream)).toHaveLength(1);
  });
});

describe('line splitting', () => {
  it('stays linear for a long line in many chunks', async () => {
    const chunk = 'x'.repeat(1024);
    const count = 4096; // 4 MiB in one line
    const started = performance.now();
    const lines = await collect(
      new ReadableStream<string>({
        start(controller) {
          for (let i = 0; i < count; i++) controller.enqueue(chunk);
          controller.enqueue('\n');
          controller.close();
        },
      }).pipeThrough(new TextLineTransformStream()),
    );
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveLength(chunk.length * count);
    // Quadratic re-splitting took over a second here; linear is ~tens of ms.
    expect(performance.now() - started).toBeLessThan(500);
  });
});
