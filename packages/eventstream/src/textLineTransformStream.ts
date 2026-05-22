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

import { SafeTransformer } from './safeTransformer';

/**
 * Transformer that splits text into lines.
 *
 * Accumulates chunks of text and splits them by newline characters ('\n'),
 * emitting each complete line as a separate chunk. Handles partial lines
 * that span multiple input chunks by maintaining an internal buffer.
 */
export class TextLineTransformer extends SafeTransformer<string, string> {
  private buffer = '';

  protected onTransform(
    chunk: string,
    controller: TransformStreamDefaultController<string>,
  ): void {
    this.buffer += chunk;
    const lines = this.buffer.split('\n');
    this.buffer = lines.pop() || '';

    for (const line of lines) {
      this.enqueue(controller, line);
    }
  }

  protected onFlush(
    controller: TransformStreamDefaultController<string>,
  ): void {
    // Only send when buffer is not empty, avoid sending meaningless empty lines
    if (this.buffer) {
      this.enqueue(controller, this.buffer);
    }
  }
}

/**
 * A TransformStream that splits text into lines.
 *
 * @example
 * ```typescript
 * const lineStream = new TextLineTransformStream();
 * const lines = textStream.pipeThrough(lineStream);
 * for await (const line of lines) {
 *   console.log('Line:', line);
 * }
 * ```
 */
export class TextLineTransformStream extends TransformStream<string, string> {
  constructor() {
    super(new TextLineTransformer());
  }
}
