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

/**
 * Transformer that splits text into lines.
 *
 * This transformer accumulates chunks of text and splits them by newline characters ('\n'),
 * emitting each complete line as a separate chunk. It handles partial lines that span multiple
 * input chunks by maintaining an internal buffer. Lines are emitted without the newline character.
 *
 * The transformer handles various edge cases:
 * - Lines that span multiple input chunks
 * - Empty lines (emitted as empty strings)
 * - Text without trailing newlines (buffered until stream ends)
 * - Mixed line endings (only '\n' is recognized as line separator)
 *
 * @implements {Transformer<string, string>}
 *
 * @example
 * ```typescript
 * const transformer = new TextLineTransformer();
 * // Input: "line1\nline2\npartial"
 * // Output: ["line1", "line2"]
 * // Buffer: "partial"
 *
 * // Later input: "line\n"
 * // Output: ["partialline"]
 * // Buffer: ""
 * ```
 */
export class TextLineTransformer implements Transformer<string, string> {
  private buffer = '';

  /**
   * Transform input string chunk by splitting it into lines.
   *
   * @param chunk Input string chunk
   * @param controller Controller for controlling the transform stream
   */
  transform(
    chunk: string,
    controller: TransformStreamDefaultController<string>,
  ) {
    try {
      this.buffer += chunk;
      const lines = this.buffer.split('\n');
      this.buffer = lines.pop() || '';

      for (const line of lines) {
        controller.enqueue(line);
      }
    } catch (error) {
      controller.error(error);
    }
  }

  /**
   * Flush remaining buffer when the stream ends.
   *
   * @param controller Controller for controlling the transform stream
   */
  flush(controller: TransformStreamDefaultController<string>) {
    try {
      // Only send when buffer is not empty, avoid sending meaningless empty lines
      if (this.buffer) {
        controller.enqueue(this.buffer);
      }
    } catch (error) {
      controller.error(error);
    }
  }
}

/**
 * A TransformStream that splits text into lines.
 *
 * This class provides a convenient way to transform a stream of text chunks into a stream
 * of individual lines. It wraps the TextLineTransformer in a TransformStream for easy
 * integration with other stream processing pipelines.
 *
 * The stream processes text data and emits each line as a separate chunk, handling
 * lines that may span multiple input chunks automatically.
 *
 * @example
 * ```typescript
 * // Create a line-splitting stream
 * const lineStream = new TextLineTransformStream();
 *
 * // Pipe text through it
 * const lines = textStream.pipeThrough(lineStream);
 *
 * // Process each line
 * for await (const line of lines) {
 *   console.log('Line:', line);
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Process SSE response line by line
 * const response = await fetch('/api/stream');
 * const lines = response.body!
 *   .pipeThrough(new TextDecoderStream())
 *   .pipeThrough(new TextLineTransformStream());
 *
 * for await (const line of lines) {
 *   if (line.startsWith('data: ')) {
 *     console.log('SSE data:', line.substring(6));
 *   }
 * }
 * ```
 */
export class TextLineTransformStream extends TransformStream<string, string> {
  /**
   * Creates a new TextLineTransformStream instance.
   *
   * Initializes the stream with a TextLineTransformer that handles the line splitting logic.
   */
  constructor() {
    super(new TextLineTransformer());
  }
}
