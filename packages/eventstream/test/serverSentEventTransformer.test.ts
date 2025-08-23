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

import { describe, it, expect, vi } from 'vitest';
import { ServerSentEventTransformer } from '../src';

describe('ServerSentEventTransformer', () => {
  it('should parse simple event', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('data: hello', controller);
    transformer.transform('', controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined,
    });
  });

  it('should parse event with custom event type', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('event: custom', controller);
    transformer.transform('data: hello', controller);
    transformer.transform('', controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'custom',
      data: 'hello',
      id: '',
      retry: undefined,
    });
  });

  it('should parse event with id', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('id: 123', controller);
    transformer.transform('data: hello', controller);
    transformer.transform('', controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'message',
      data: 'hello',
      id: '123',
      retry: undefined,
    });
  });

  it('should parse event with retry', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('retry: 5000', controller);
    transformer.transform('data: hello', controller);
    transformer.transform('', controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'message',
      data: 'hello',
      id: '',
      retry: 5000,
    });
  });

  it('should parse multi-line data', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('data: hello', controller);
    transformer.transform('data: world', controller);
    transformer.transform('', controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'message',
      data: 'hello\nworld',
      id: '',
      retry: undefined,
    });
  });

  it('should ignore comment lines', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform(': this is a comment', controller);
    transformer.transform('data: hello', controller);
    transformer.transform('', controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined,
    });
  });

  it('should handle empty data field', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('data:', controller);
    transformer.transform('', controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'message',
      data: '',
      id: '',
      retry: undefined,
    });
  });

  it('should handle flush with remaining data', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('data: hello', controller);
    transformer.flush(controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined,
    });
  });

  it('should handle error in transform', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    // Force an error by mocking join method
    const originalJoin = Array.prototype.join;
    Array.prototype.join = vi.fn().mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    transformer.transform('data: hello', controller);
    transformer.transform('', controller);

    // Restore original join method
    Array.prototype.join = originalJoin;

    expect(controller.error).toHaveBeenCalledTimes(1);
    expect(controller.error).toHaveBeenCalledWith(new Error('Test error'));
  });

  it('should handle error in flush', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    // Force an error by mocking join method
    const originalJoin = Array.prototype.join;
    Array.prototype.join = vi.fn().mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    // Add some data to trigger the error
    (transformer as any).currentEvent.data = ['test'];

    transformer.flush(controller);

    // Restore original join method
    Array.prototype.join = originalJoin;

    expect(controller.error).toHaveBeenCalledTimes(1);
    expect(controller.error).toHaveBeenCalledWith(new Error('Test error'));
  });

  it('should handle flush with no data', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    // Clear data to ensure no event is sent
    (transformer as any).currentEvent.data = [];

    transformer.flush(controller);

    expect(controller.enqueue).not.toHaveBeenCalled();
    expect(controller.error).not.toHaveBeenCalled();
  });

  it('should handle unknown fields', () => {
    const transformer = new ServerSentEventTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('unknown: value', controller);
    transformer.transform('data: hello', controller);
    transformer.transform('', controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenCalledWith({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined,
    });
  });
});
