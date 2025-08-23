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

describe('ServerSentEventTransformStream Branch Coverage', () => {
  it('should handle undefined id in event (cover line 94)', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event without id to test id || '' branch
    writer.write('data: test\n');
    writer.write('\n');
    writer.close();

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBeDefined();
    // When id is undefined, it should default to empty string
    expect(value!.id).toBe('');

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });

  it('should handle undefined id in flush (cover line 161)', async () => {
    const stream = new ServerSentEventTransformStream();
    const writer = stream.writable.getWriter();
    const reader = stream.readable.getReader();

    // Write an event without id and without final newline to test flush
    writer.write('data: test\n');
    writer.close(); // No newline, so it goes through flush

    const { value, done } = await reader.read();
    expect(done).toBe(false);
    expect(value).toBeDefined();
    // When id is undefined in flush, it should default to empty string
    expect(value!.id).toBe('');

    const finalResult = await reader.read();
    expect(finalResult.done).toBe(true);
  });
});
