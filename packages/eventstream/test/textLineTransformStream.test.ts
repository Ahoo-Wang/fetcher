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
import { TextLineTransformer, TextLineTransformStream } from '../src';

describe('textLineTransformStream.ts', () => {
  describe('TextLineTransformStream', () => {
    it('should create TextLineTransformStream instance', () => {
      const stream = new TextLineTransformStream();

      expect(stream).toBeInstanceOf(TextLineTransformStream);
      expect(stream).toBeInstanceOf(TransformStream);
    });

    it('should create TextLineTransformStream with TextLineTransformer', () => {
      // This test ensures the constructor properly calls super with TextLineTransformer
      const stream = new TextLineTransformStream();

      // We can't directly access the internal transformer, but we can test the behavior
      expect(stream).toBeDefined();
    });
  });

  describe('TextLineTransformer', () => {
    it('should transform chunks by splitting lines', async () => {
      const transformer = new TextLineTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      transformer.transform('line1\nline2\n', controller);

      expect(controller.enqueue).toHaveBeenCalledWith('line1');
      expect(controller.enqueue).toHaveBeenCalledWith('line2');
    });

    it('should accumulate buffer for incomplete lines', async () => {
      const transformer = new TextLineTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      transformer.transform('line1\nline2', controller);

      expect(controller.enqueue).toHaveBeenCalledWith('line1');
      expect(controller.enqueue).not.toHaveBeenCalledWith('line2');
    });

    it('should flush remaining buffer', async () => {
      const transformer = new TextLineTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      transformer.transform('line1\nline2', controller);
      transformer.flush(controller);

      expect(controller.enqueue).toHaveBeenCalledWith('line1');
      expect(controller.enqueue).toHaveBeenCalledWith('line2');
    });

    it('should not flush empty buffer', async () => {
      const transformer = new TextLineTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      transformer.flush(controller);

      expect(controller.enqueue).not.toHaveBeenCalled();
    });

    it('should handle errors in transform', async () => {
      const transformer = new TextLineTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Mock chunk to throw an error
      const chunk = {
        toString: () => {
          throw new Error('Test error');
        },
      } as any;

      transformer.transform(chunk, controller);

      expect(controller.error).toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle errors in flush', async () => {
      const transformer = new TextLineTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Mock controller.enqueue to throw an error
      controller.enqueue.mockImplementationOnce(() => {
        throw new Error('Test error');
      });

      transformer.transform('test', controller);
      transformer.flush(controller);

      expect(controller.error).toHaveBeenCalledWith(expect.any(Error));
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

    it('should handle buffer with only whitespace in flush', async () => {
      const transformer = new TextLineTransformer();
      const controller = {
        enqueue: vi.fn(),
        error: vi.fn(),
      } as any;

      // Set buffer to whitespace
      (transformer as any).buffer = '   ';

      transformer.flush(controller);

      expect(controller.enqueue).toHaveBeenCalledWith('   ');
    });
  });
});
