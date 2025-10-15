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
import {
  ServerSentEvent,
  JsonServerSentEventTransformStream,
  toJsonServerSentEventStream,
  type TerminateDetector,
} from '../src';

describe('JsonServerSentEventTransformStream', () => {
  it('should transform ServerSentEvent to JsonServerSentEvent', async () => {
    const transformStream = new JsonServerSentEventTransformStream<any>();
    const writable = transformStream.writable;
    const readable = transformStream.readable;

    const writer = writable.getWriter();
    const reader = readable.getReader();

    const inputEvent: ServerSentEvent = {
      data: '{"id":1,"name":"test"}',
      event: 'message',
      id: '1',
      retry: 3000,
    };

    writer.write(inputEvent);
    writer.close();

    const result = await reader.read();
    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      data: { id: 1, name: 'test' },
      event: 'message',
      id: '1',
      retry: 3000,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle multiple events', async () => {
    const transformStream = new JsonServerSentEventTransformStream<any>();
    const writable = transformStream.writable;
    const readable = transformStream.readable;

    const writer = writable.getWriter();
    const reader = readable.getReader();

    const inputEvents: ServerSentEvent[] = [
      {
        data: '{"value":1}',
        event: 'update',
        id: '1',
      },
      {
        data: '{"value":2}',
        event: 'update',
        id: '2',
      },
    ];

    for (const event of inputEvents) {
      writer.write(event);
    }
    writer.close();

    const results: any[] = [];
    let result = await reader.read();
    while (!result.done) {
      results.push(result.value);
      result = await reader.read();
    }

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({
      data: { value: 1 },
      event: 'update',
      id: '1',
      retry: undefined,
    });
    expect(results[1]).toEqual({
      data: { value: 2 },
      event: 'update',
      id: '2',
      retry: undefined,
    });
  });

  it('should handle empty data', async () => {
    const transformStream = new JsonServerSentEventTransformStream<any>();
    const writable = transformStream.writable;
    const readable = transformStream.readable;

    const writer = writable.getWriter();
    const reader = readable.getReader();

    const inputEvent: ServerSentEvent = {
      data: 'null',
      event: 'message',
    };

    writer.write(inputEvent);
    writer.close();

    const result = await reader.read();
    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      data: null,
      event: 'message',
      id: undefined,
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should accept terminate detector parameter', () => {
    const terminateDetector: TerminateDetector = (event: ServerSentEvent) =>
      event.event === 'terminate';

    // Verify we can create a transform stream with terminate detector
    const transformStream = new JsonServerSentEventTransformStream<any>(
      terminateDetector,
    );
    expect(transformStream).toBeInstanceOf(JsonServerSentEventTransformStream);
  });

  it('should work without end detector', async () => {
    const transformStream = new JsonServerSentEventTransformStream<any>();
    const writable = transformStream.writable;
    const readable = transformStream.readable;

    const writer = writable.getWriter();
    const reader = readable.getReader();

    const inputEvent: ServerSentEvent = {
      data: '{"test":true}',
      event: 'message',
    };

    writer.write(inputEvent);
    writer.close();

    const result = await reader.read();
    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      data: { test: true },
      event: 'message',
      id: undefined,
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });
});

describe('toJsonServerSentEventStream', () => {
  it('should convert ServerSentEventStream to JsonServerSentEventStream', async () => {
    // Create a mock ServerSentEventStream
    const { readable, writable } = new TransformStream<
      ServerSentEvent,
      ServerSentEvent
    >();
    const writer = writable.getWriter();

    // Write test data
    writer.write({
      data: '{"message":"hello"}',
      event: 'greeting',
    });
    writer.close();

    // Convert to JsonServerSentEventStream
    const jsonStream = toJsonServerSentEventStream<any>(readable as any);

    // Read result
    const reader = jsonStream.getReader();
    const result = await reader.read();

    expect(result.done).toBe(false);
    expect(result.value).toEqual({
      data: { message: 'hello' },
      event: 'greeting',
      id: undefined,
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should support terminate detector in toJsonServerSentEventStream', async () => {
    // Create a mock ServerSentEventStream
    const { readable } = new TransformStream<
      ServerSentEvent,
      ServerSentEvent
    >();

    let detectorCalled = false;
    const terminateDetector: TerminateDetector = (event: ServerSentEvent) => {
      detectorCalled = true;
      return event.event === 'finish';
    };

    // Convert to JsonServerSentEventStream with terminate detector
    const jsonStream = toJsonServerSentEventStream<any>(
      readable as any,
      terminateDetector,
    );

    // Verify the function accepts the terminate detector parameter
    expect(typeof jsonStream).toBe('object');
    expect(jsonStream).toHaveProperty('getReader');
  });
});
