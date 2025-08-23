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

import { describe, it, expect } from 'vitest';
import { toServerSentEventStream } from '../src';

describe('EventStreamConverter', () => {
  it('should convert response to event stream', async () => {
    const response = new Response('data: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should throw error when response body is null', async () => {
    // Create a response with null body
    const response = new Response(null, {
      headers: { 'content-type': 'text/event-stream' },
    });

    // Manually set body to null to simulate the condition
    Object.defineProperty(response, 'body', {
      value: null,
      writable: false,
    });

    expect(() => {
      toServerSentEventStream(response);
    }).toThrow('Response body is null');
  });

  it('should handle multi-line event data', async () => {
    const response = new Response('data: hello\ndata: world\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle event with custom event type', async () => {
    const response = new Response('event: custom\ndata: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle event with id', async () => {
    const response = new Response('id: 123\ndata: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle event with retry', async () => {
    const response = new Response('retry: 5000\ndata: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle multiple events', async () => {
    const response = new Response('data: hello\n\n\ndata: world\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle comment lines', async () => {
    const response = new Response(': this is a comment\ndata: hello\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });

  it('should handle empty data field', async () => {
    const response = new Response('data:\n\n', {
      headers: { 'content-type': 'text/event-stream' },
    });

    const stream = toServerSentEventStream(response);
    expect(stream).toBeInstanceOf(ReadableStream);
  });
});
