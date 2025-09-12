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

describe('readableStreams', () => {
  it('should export isReadableStreamAsyncIterableSupported as boolean', async () => {
    // 删除可能存在的 [Symbol.asyncIterator] 实现以模拟不支持环境
    delete ReadableStream.prototype[Symbol.asyncIterator];

    // 清除模块缓存并重新导入
    vi.resetModules();
    const module = await import('../src/readableStreams');
    const { isReadableStreamAsyncIterableSupported } = module;

    expect(typeof isReadableStreamAsyncIterableSupported).toBe('boolean');
    expect(isReadableStreamAsyncIterableSupported).toBe(false);
  });

  it('should add [Symbol.asyncIterator] to ReadableStream when not implemented', async () => {
    // 删除可能存在的 [Symbol.asyncIterator] 实现
    delete ReadableStream.prototype[Symbol.asyncIterator];

    // 清除模块缓存并重新导入
    vi.resetModules();
    await import('../src/readableStreams');

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue('test1');
        controller.enqueue('test2');
        controller.close();
      },
    });

    // 验证 [Symbol.asyncIterator] 已被添加
    expect(typeof stream[Symbol.asyncIterator]).toBe('function');
  });

  it('should be able to iterate over stream when polyfill is added', async () => {
    // 删除可能存在的 [Symbol.asyncIterator] 实现
    delete ReadableStream.prototype[Symbol.asyncIterator];

    // 清除模块缓存并重新导入
    vi.resetModules();
    await import('../src/readableStreams');

    const testData = ['chunk1', 'chunk2', 'chunk3'];
    const stream = new ReadableStream({
      start(controller) {
        testData.forEach(chunk => controller.enqueue(chunk));
        controller.close();
      },
    });

    const results: string[] = [];
    for await (const chunk of stream) {
      results.push(chunk);
    }

    expect(results).toEqual(testData);
  });

  it('should not override [Symbol.asyncIterator] when already implemented', async () => {
    // 创建一个自定义的 [Symbol.asyncIterator] 实现
    const customSymbol = Symbol('customAsyncIterator');
    ReadableStream.prototype[Symbol.asyncIterator] = function() {
      return {
        [customSymbol]: true,
        next: () => Promise.resolve({ done: true, value: undefined }),
      };
    };

    // 清除模块缓存并重新导入
    vi.resetModules();
    await import('../src/readableStreams');

    const stream = new ReadableStream();
    const iterator = stream[Symbol.asyncIterator]();

    // 验证原始实现没有被覆盖
    expect((iterator as any)[customSymbol]).toBe(true);
  });
});
