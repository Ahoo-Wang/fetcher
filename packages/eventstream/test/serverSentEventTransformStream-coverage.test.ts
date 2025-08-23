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
import { ServerSentEventTransformStream } from '../src';

describe('ServerSentEventTransformStream Coverage', () => {
  it('should handle field without colon (entire line as field name)', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with field without colon
    writer.write('data\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: '', // Empty data because value is empty when no colon
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle unknown fields gracefully', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with unknown field
    writer.write('unknownfield: some value\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle field with only colon', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with field that is just a colon
    writer.write(':\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle field with colon at the end', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with field that ends with colon
    writer.write('data:\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: '',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle field with colon at the beginning', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with field that starts with colon (this should be treated as comment)
    writer.write(':data: hello\n');
    writer.write('data: world\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'world',
      id: '',
      retry: undefined,
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle NaN retry values gracefully', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event with NaN retry value
    writer.write('retry: not-a-number\n');
    writer.write('data: hello\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toEqual({
      event: 'message',
      data: 'hello',
      id: '',
      retry: undefined, // Should remain undefined for NaN values
    });

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });
});
