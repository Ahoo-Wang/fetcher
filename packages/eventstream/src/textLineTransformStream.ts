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

export class TextLineTransformer implements Transformer<string, string> {
  private buffer = '';

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

export class TextLineTransformStream extends TransformStream<string, string> {
  constructor() {
    super(new TextLineTransformer());
  }
}
