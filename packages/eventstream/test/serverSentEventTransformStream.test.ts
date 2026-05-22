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
import {
  ServerSentEventFields,
  ServerSentEventTransformer,
  ServerSentEventTransformStream,
} from '../src';

describe('serverSentEventTransformStream.ts', () => {
  describe('ServerSentEventTransformStream', () => {
    it('should create ServerSentEventTransformStream instance', () => {
      const stream = new ServerSentEventTransformStream();

      expect(stream).toBeInstanceOf(ServerSentEventTransformStream);
      expect(stream).toBeInstanceOf(TransformStream);
    });
  });

  describe('ServerSentEventField', () => {
    it('should define ServerSentEventField enum values', () => {
      expect(ServerSentEventFields.ID).toBe('id');
      expect(ServerSentEventFields.RETRY).toBe('retry');
      expect(ServerSentEventFields.EVENT).toBe('event');
      expect(ServerSentEventFields.DATA).toBe('data');
    });
  });

  describe('ServerSentEventTransformer', () => {
    it('should initialize with default event state', () => {
      const transformer = new ServerSentEventTransformer();

      // We can't directly access private properties, but we can test behavior
      expect(transformer).toBeInstanceOf(ServerSentEventTransformer);
    });

    it('should skip empty lines', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      transformer.transform('', controller);

      expect(controller.enqueue).not.toHaveBeenCalled();
    });

    it('should ignore comment lines', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      transformer.transform(':comment line', controller);

      expect(controller.enqueue).not.toHaveBeenCalled();
    });

    it('should parse event field correctly', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // First send data
      transformer.transform('data:test data', controller);

      // Then send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'message',
          data: 'test data',
        }),
      );
    });

    it('should parse id field correctly', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send id
      transformer.transform('id:123', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          id: '123',
          data: 'test data',
        }),
      );
    });

    it('should parse retry field correctly', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send retry
      transformer.transform('retry:5000', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          retry: 5000,
          data: 'test data',
        }),
      );
    });

    it('should handle invalid retry value', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send invalid retry
      transformer.transform('retry:invalid', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'test data',
        }),
      );
      // retry should not be set
      const event = (controller.enqueue as any).mock.calls[0][0];
      expect(event.retry).toBeUndefined();
    });

    it('should handle field without colon', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send field without colon
      transformer.transform('event', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'message', // event field is case-insensitive and converted to lowercase
          data: 'test data',
        }),
      );
    });

    it('should handle field with leading space in value', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send field with leading space
      transformer.transform('data: test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'test data',
        }),
      );
    });

    it('should handle multiple data lines', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send multiple data lines
      transformer.transform('data:first line', controller);
      transformer.transform('data:second line', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'first line\nsecond line',
        }),
      );
    });

    it('should flush remaining data', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send data without empty line
      transformer.transform('data:test data', controller);

      // Flush should send the event
      transformer.flush(controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'test data',
        }),
      );
    });

    it('should handle errors in transform', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Mock chunk to throw an error
      const chunk = {
        trim: () => {
          throw new Error('Test error');
        },
      } as any;

      transformer.transform(chunk, controller);

      expect(controller.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors in flush', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Mock controller.enqueue to throw an error
      controller.enqueue.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      // Send data
      transformer.transform('data:test data', controller);

      // Flush should handle the error
      transformer.flush(controller);

      expect(controller.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should reset state after sending event', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send first event
      transformer.transform('id:123', controller);
      transformer.transform('data:first event', controller);
      transformer.transform('', controller);

      // Send second event (without id)
      transformer.transform('data:second event', controller);
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledTimes(2);

      // First event should have id
      expect(controller.enqueue).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          id: '123',
          data: 'first event',
        }),
      );

      // Second event should also have id (preserved from first event)
      expect(controller.enqueue).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          id: '123',
          data: 'second event',
        }),
      );
    });

    it('should handle unknown field', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send unknown field
      transformer.transform('unknown:test', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'test data',
        }),
      );
    });

    it('should handle colon at the beginning of line', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send line starting with colon (comment)
      transformer.transform(':comment', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'test data',
        }),
      );
    });

    it('should handle colon at the end of line', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send line ending with colon
      transformer.transform('field:', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'test data',
        }),
      );
    });

    it('should handle multiple colons in line', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send line with multiple colons
      transformer.transform('event:test:event', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'test:event',
          data: 'test data',
        }),
      );
    });

    it('should handle empty field name', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send line with empty field name
      transformer.transform(':test', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'test data',
        }),
      );
    });

    it('should handle empty data', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send empty data
      transformer.transform('data:', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: '',
        }),
      );
    });

    it('should handle whitespace in field name', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Per W3C SSE spec, field names are NOT trimmed, so "  event  " is an unknown field
      transformer.transform('  event  :test', controller);

      // Send data
      transformer.transform('data:test data', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'message',
          data: 'test data',
        }),
      );
    });

    it('should handle whitespace in field value', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Per W3C SSE spec, only a single leading space after colon is stripped, no trailing trim
      transformer.transform('data:  test data  ', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: ' test data  ',
        }),
      );
    });

    it('should ignore id field with NULL character per SSE spec', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send id with NULL character (should be ignored per W3C spec)
      transformer.transform('id:bad\0id', controller);
      // Send data to trigger event
      transformer.transform('data:test', controller);
      transformer.transform('', controller);

      // id should not be set because it contains NULL
      const event = (controller.enqueue as any).mock.calls[0][0];
      expect(event.id).toBe('');
    });

    it('should accept valid id without NULL character', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      transformer.transform('id:valid-123', controller);
      transformer.transform('data:test', controller);
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'valid-123',
        }),
      );
    });

    it('should reject retry value with non-digit characters per SSE spec', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // "5000abc" should be rejected per spec (must consist of only ASCII digits)
      transformer.transform('retry:5000abc', controller);
      transformer.transform('data:test', controller);
      transformer.transform('', controller);

      const event = (controller.enqueue as any).mock.calls[0][0];
      expect(event.retry).toBeUndefined();
    });

    it('should accept retry value with only ASCII digits', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      transformer.transform('retry:5000', controller);
      transformer.transform('data:test', controller);
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          retry: 5000,
        }),
      );
    });

    it('should handle empty data array in flush', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Don't send any data, just flush
      transformer.flush(controller);

      expect(controller.enqueue).not.toHaveBeenCalled();
    });

    it('should handle data with newlines', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Send data with newlines
      transformer.transform('data:line1\nline2', controller);

      // Send empty line to trigger event
      transformer.transform('', controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          data: 'line1\nline2',
        }),
      );
    });

    it('should handle non-Error object in transform error', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Mock chunk to throw a non-Error object
      const chunk = {
        trim: () => {
          throw 'Test error string';
        },
      } as any;

      transformer.transform(chunk, controller);

      // SafeTransformer passes the original error through safeError
      expect(controller.error).toHaveBeenCalledWith('Test error string');
    });

    it('should handle undefined event in flush', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Set event to undefined
      (transformer as any).currentEventState.event = undefined;
      (transformer as any).currentEventState.data = ['test data'];

      // Flush should use 'message' as default event
      transformer.flush(controller);

      expect(controller.enqueue).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'message',
          data: 'test data',
        }),
      );
    });

    it('should handle non-Error object in flush error', async () => {
      const transformer = new ServerSentEventTransformer();
      const controller = {
        enqueue: vi.fn(() => {
          throw 'Test error string';
        }),
        error: vi.fn(),
      } as any;

      // Accumulate data, then flush triggers enqueue which throws
      transformer.transform('data:test data', controller);
      transformer.flush(controller);

      // SafeTransformer catches the error and forwards via safeError
      expect(controller.error).toHaveBeenCalledWith('Test error string');
    });
  });
});
