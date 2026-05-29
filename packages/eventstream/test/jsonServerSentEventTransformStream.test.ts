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
import type { ServerSentEvent } from '../src';
import {
  JsonServerSentEventTransform,
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

  it('should call terminate detector during transformation', async () => {
    let detectorCallCount = 0;
    let lastEvent: ServerSentEvent | undefined;

    const terminateDetector: TerminateDetector = (event: ServerSentEvent) => {
      detectorCallCount++;
      lastEvent = event;
      return false; // Don't terminate, just track calls
    };

    const transformStream = new JsonServerSentEventTransformStream<any>(
      terminateDetector,
    );

    const writable = transformStream.writable;
    const readable = transformStream.readable;
    const writer = writable.getWriter();
    const reader = readable.getReader();

    const testEvent: ServerSentEvent = {
      data: '{"message": "test"}',
      event: 'message',
    };

    // Write and immediately close to avoid hanging
    writer.write(testEvent);
    writer.close();

    // Read result
    const result = await reader.read();
    expect(result.done).toBe(false);
    expect(result.value?.data).toEqual({ message: 'test' });

    // Verify detector was called
    expect(detectorCallCount).toBe(1);
    expect(lastEvent).toEqual(testEvent);
  });

  it('should handle terminate detector errors gracefully', async () => {
    const errorMessage = 'Terminate detector error';
    const terminateDetector: TerminateDetector = () => {
      throw new Error(errorMessage);
    };

    const transformStream = new JsonServerSentEventTransformStream<any>(
      terminateDetector,
    );

    const writable = transformStream.writable;
    const readable = transformStream.readable;
    const writer = writable.getWriter();
    const reader = readable.getReader();

    const testEvent: ServerSentEvent = {
      data: '{"message": "test"}',
      event: 'message',
    };

    // Write event that will trigger the error
    writer.write(testEvent);

    // The stream should error due to the terminate detector throwing
    await expect(async () => {
      await reader.read();
    }).rejects.toThrow(errorMessage);
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

  it('should handle invalid JSON gracefully', async () => {
    const transformStream = new JsonServerSentEventTransformStream<any>();
    const writable = transformStream.writable;
    const readable = transformStream.readable;

    const writer = writable.getWriter();
    const reader = readable.getReader();

    const inputEvent: ServerSentEvent = {
      data: '{"invalid": json}', // Invalid JSON - missing quote
      event: 'message',
    };

    writer.write(inputEvent);

    // The stream should error due to invalid JSON
    await expect(async () => {
      await reader.read();
    }).rejects.toThrow();
  });

  it('should handle terminate detector that returns true', async () => {
    const terminateDetector: TerminateDetector = (event: ServerSentEvent) =>
      event.event === 'terminate';

    const transformStream = new JsonServerSentEventTransformStream<any>(
      terminateDetector,
    );
    const writable = transformStream.writable;
    const readable = transformStream.readable;

    const writer = writable.getWriter();
    const reader = readable.getReader();

    const terminateEvent: ServerSentEvent = {
      data: '{"message": "terminate"}',
      event: 'terminate',
    };

    // Write terminate event - this should terminate the stream
    writer.write(terminateEvent);

    // Should get no events since stream was terminated
    const result = await reader.read();
    expect(result.done).toBe(true);
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




describe('JsonServerSentEventTransform terminated guard', () => {
  it('should drop all chunks after termination', () => {
    const terminateDetector: TerminateDetector = (event) =>
      event.event === 'terminate';

    const transformer = new JsonServerSentEventTransform<any>(terminateDetector);
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
      terminate: vi.fn(),
    };

    // Normal event
    transformer.transform(
      { data: '{"msg":"before"}', event: 'message' },
      controller as any,
    );
    expect(controller.enqueue).toHaveBeenCalledTimes(1);

    // Terminate event
    transformer.transform(
      { data: '{"msg":"end"}', event: 'terminate' },
      controller as any,
    );
    expect(controller.terminate).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledTimes(1);

    // After termination: normal chunk is silently dropped
    transformer.transform(
      { data: '{"msg":"after"}', event: 'message' },
      controller as any,
    );
    // enqueue/terminate/error not called again
    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.terminate).toHaveBeenCalledTimes(1);
    expect(controller.error).not.toHaveBeenCalled();
  });

  it('should drop chunks after JSON parse error', () => {
    const transformer = new JsonServerSentEventTransform<any>();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
      terminate: vi.fn(),
    };

    // Invalid JSON triggers catch → safeError → terminated
    transformer.transform(
      { data: '{invalid json}', event: 'message' },
      controller as any,
    );
    expect(controller.error).toHaveBeenCalledTimes(1);

    // Second chunk: silently dropped because terminated=true
    transformer.transform(
      { data: '{"msg":"after"}', event: 'message' },
      controller as any,
    );
    expect(controller.error).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).not.toHaveBeenCalled();
  });

  it('should not throw when enqueue fails on already-closed stream', () => {
    const transformer = new JsonServerSentEventTransform<any>();
    const controller = {
      enqueue: vi.fn(() => {
        throw new TypeError('stream closed');
      }),
      error: vi.fn(),
      terminate: vi.fn(),
    };

    // safeEnqueue suppresses the TypeError — no error propagation, no terminated flag
    expect(() => {
      transformer.transform(
        { data: '{"msg":"test"}', event: 'message' },
        controller as any,
      );
    }).not.toThrow();
    expect(controller.error).not.toHaveBeenCalled();
    expect(controller.enqueue).toHaveBeenCalledTimes(1);

    // Stream is NOT terminated (safeEnqueue handled it), next chunk still processes
    // But enqueue keeps failing with TypeError, so safeEnqueue keeps suppressing
    transformer.transform(
      { data: '{"msg":"after"}', event: 'message' },
      controller as any,
    );
    expect(controller.enqueue).toHaveBeenCalledTimes(2);
    expect(controller.error).not.toHaveBeenCalled();
  });

  it('should not throw when controller.error also fails on already-closed stream', () => {
    const transformer = new JsonServerSentEventTransform<any>();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(() => {
        throw new TypeError('error on closed stream');
      }),
      terminate: vi.fn(),
    };

    // Invalid JSON → catch → safeError → TypeError suppressed by safeError
    expect(() => {
      transformer.transform(
        { data: '{invalid}', event: 'message' },
        controller as any,
      );
    }).not.toThrow();
    // safeError was called (and its TypeError was suppressed)
    expect(controller.error).toHaveBeenCalledTimes(1);

    // After terminated: chunks are dropped, controller.error is never called again
    transformer.transform(
      { data: '{"msg":"after"}', event: 'message' },
      controller as any,
    );
    expect(controller.error).toHaveBeenCalledTimes(1);
  });

  it('should handle terminateDetector that throws', () => {
    const terminateDetector: TerminateDetector = () => {
      throw new Error('detector broken');
    };

    const transformer = new JsonServerSentEventTransform<any>(terminateDetector);
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
      terminate: vi.fn(),
    };

    // Detector throws → catch → controller.error → terminated
    transformer.transform(
      { data: '{"msg":"test"}', event: 'message' },
      controller as any,
    );
    expect(controller.error).toHaveBeenCalledTimes(1);

    // Subsequent chunks are dropped
    transformer.transform(
      { data: '{"msg":"after"}', event: 'message' },
      controller as any,
    );
    expect(controller.error).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).not.toHaveBeenCalled();
  });
});
