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
 * A wrapper class that converts a ReadableStream into an AsyncIterable.
 * This allows consuming a ReadableStream using for-await...of loops.
 */
export class ReadableStreamAsyncIterable<T> implements AsyncIterable<T> {
  private readonly reader: ReadableStreamDefaultReader<T>;
  private locked: boolean = true;

  /**
   * Creates a new ReadableStreamAsyncIterable instance.
   * @param stream - The ReadableStream to wrap.
   */
  constructor(private readonly stream: ReadableStream<T>) {
    this.reader = stream.getReader();
  }

  releaseLock() {
    if (this.locked) {
      try {
        this.reader.releaseLock();
        this.locked = false;
      } catch (error) {

      }
    }
  }

  [Symbol.asyncIterator]() {
    return this;
  }

  async next(): Promise<IteratorResult<T>> {
    try {
      const { done, value } = await this.reader.read();
      if (done) {
        this.releaseLock();
        return { done: true, value: undefined };
      }

      return { done: false, value };
    } catch (error) {
      this.releaseLock();
      throw error;
    }
  }

  async return(): Promise<IteratorResult<T>> {
    // Release the reader lock when iteration is manually stopped
    try {
      await this.reader.cancel();
    } finally {
      this.releaseLock();
    }
    return { done: true, value: undefined };
  }

  async throw(error: any): Promise<IteratorResult<T>> {
    // Ensure the reader lock is released before throwing
    this.releaseLock();
    return { done: true, value: undefined };
  }
}
