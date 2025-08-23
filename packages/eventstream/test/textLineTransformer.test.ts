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
import { TextLineTransformer } from '../src';

describe('TextLineTransformer', () => {
  it('should split chunks by newlines', async () => {
    const transformer = new TextLineTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('hello\nworld\n', controller);
    transformer.flush(controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(2);
    expect(controller.enqueue).toHaveBeenNthCalledWith(1, 'hello');
    expect(controller.enqueue).toHaveBeenNthCalledWith(2, 'world');
  });

  it('should handle chunks without newlines', async () => {
    const transformer = new TextLineTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('hello', controller);
    transformer.transform('world', controller);
    transformer.flush(controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenNthCalledWith(1, 'helloworld');
  });

  it('should handle mixed chunks with and without newlines', async () => {
    const transformer = new TextLineTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('hello\nwo', controller);
    transformer.transform('rld\nfoo', controller);
    transformer.transform('\nbar', controller);
    transformer.flush(controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(4);
    expect(controller.enqueue).toHaveBeenNthCalledWith(1, 'hello');
    expect(controller.enqueue).toHaveBeenNthCalledWith(2, 'world');
    expect(controller.enqueue).toHaveBeenNthCalledWith(3, 'foo');
    expect(controller.enqueue).toHaveBeenNthCalledWith(4, 'bar');
  });

  it('should handle empty chunks', async () => {
    const transformer = new TextLineTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('', controller);
    transformer.transform('\n', controller);
    transformer.transform('', controller);
    transformer.flush(controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(1);
    expect(controller.enqueue).toHaveBeenNthCalledWith(1, '');
  });

  it('should handle trailing content without newline', async () => {
    const transformer = new TextLineTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    transformer.transform('hello\nworld', controller);
    transformer.flush(controller);

    expect(controller.enqueue).toHaveBeenCalledTimes(2);
    expect(controller.enqueue).toHaveBeenNthCalledWith(1, 'hello');
    expect(controller.enqueue).toHaveBeenNthCalledWith(2, 'world');
  });

  it('should handle error in transform', async () => {
    const transformer = new TextLineTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    // Force an error by mocking split method
    const originalSplit = String.prototype.split;
    String.prototype.split = vi.fn().mockImplementationOnce(() => {
      throw new Error('Test error');
    });

    transformer.transform('hello\nworld', controller);

    // Restore original split method
    String.prototype.split = originalSplit;

    expect(controller.error).toHaveBeenCalledTimes(1);
    expect(controller.error).toHaveBeenCalledWith(new Error('Test error'));
  });

  it('should handle error in flush', async () => {
    const transformer = new TextLineTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    // Set buffer to a value that will cause an error when accessing it
    Object.defineProperty(transformer, 'buffer', {
      get: () => {
        throw new Error('Test error');
      },
      set: () => {},
      configurable: true,
    });

    transformer.flush(controller);

    expect(controller.error).toHaveBeenCalledTimes(1);
    expect(controller.error).toHaveBeenCalledWith(new Error('Test error'));
  });

  it('should handle empty buffer in flush', async () => {
    const transformer = new TextLineTransformer();
    const controller = {
      enqueue: vi.fn(),
      error: vi.fn(),
    } as any;

    // Set buffer to empty string
    (transformer as any).buffer = '';

    transformer.flush(controller);

    expect(controller.enqueue).not.toHaveBeenCalled();
  });
});
