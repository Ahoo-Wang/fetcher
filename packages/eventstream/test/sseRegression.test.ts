/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 */
import { describe, expect, it } from 'vitest';
import { TextLineTransformer } from '../src';

async function parse(chunks: string[]) {
  const bytes = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks)
        controller.enqueue(new TextEncoder().encode(chunk));
      controller.close();
    },
  });
  const events = [];
  for await (const event of new Response(bytes, {
    headers: { 'Content-Type': 'text/event-stream' },
  }).requiredEventStream())
    events.push(event);
  return events;
}

describe('SSE protocol regressions', () => {
  it.each([
    ['data: one\r\rdata: two\r\r'],
    ['data: one\r', '', '\n\r', '\ndata: two\n\n'],
    ['data: one\n\ndata: two\r\n\r\n'],
  ])(
    'recognizes each legal line ending across chunks: %j',
    async (...chunks) => {
      expect((await parse(chunks)).map(event => event.data)).toEqual([
        'one',
        'two',
      ]);
    },
  );

  it('emits CR-terminated lines before the connection closes', async () => {
    const lines: string[] = [];
    await new TextLineTransformer().transform('data: live\r\r', {
      enqueue: (line: string) => lines.push(line),
    } as any);
    expect(lines).toEqual(['data: live', '']);
  });

  it('ignores whitespace-only unknown fields inside a JSON event', async () => {
    const response = new Response('data: {"value":\n \ndata: 1}\n\n', {
      headers: { 'Content-Type': 'text/event-stream' },
    });
    const result = [];
    for await (const event of response.requiredJsonEventStream())
      result.push(event.data);
    expect(result).toEqual([{ value: 1 }]);
  });

  it.each([
    ['Text/Event-Stream; charset=utf-8', true],
    ['text/event-stream-extra', false],
    ['application/json; note=text/event-stream', false],
  ])('matches the complete media type: %s', (contentType, expected) => {
    expect(
      new Response('', { headers: { 'Content-Type': contentType } })
        .isEventStream,
    ).toBe(expected);
  });

  it('resets event type on an empty block while retaining the last event ID', async () => {
    const events = await parse(['id: keep\nevent: custom\n\ndata: next\n\n']);
    expect(events).toEqual([
      { event: 'message', data: 'next', id: 'keep', retry: undefined },
    ]);
  });

  it('compares field names literally, including fields without a colon', async () => {
    const events = await parse([
      'DATA: ignored\nEVENT: custom\nDATA\n\ndata: valid\n\n',
    ]);
    expect(events).toEqual([
      { event: 'message', data: 'valid', id: '', retry: undefined },
    ]);
  });
});
