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
  private _locked: boolean = true;

  /**
   * Creates a new ReadableStreamAsyncIterable instance.
   * @param stream - The ReadableStream to wrap.
   */
  constructor(private readonly stream: ReadableStream<T>) {
    this.reader = stream.getReader();
  }

  /**
   * Gets the lock status of the reader.
   * @returns True if the reader is currently locked, false otherwise.
   */
  get locked(): boolean {
    return this._locked;
  }

  /**
   * Releases the reader lock if currently locked.
   * This method safely releases the reader lock by catching any potential errors.
   */
  releaseLock() {
    if (!this._locked) return false;
    this._locked = false;
    try {
      this.reader.releaseLock();
      return true;
    } catch (error) {
      console.debug('Failed to release reader lock:', error);
      return false;
    }
  }

  /**
   * Implements the AsyncIterable interface by returning this iterator.
   * @returns The async iterator for this instance.
   */
  [Symbol.asyncIterator]() {
    return this;
  }

  /**
   * Gets the next value from the stream.
   * Reads the next chunk from the stream and returns it as an IteratorResult.
   * If the stream is done, releases the lock and returns a done result.
   * @returns A promise that resolves to an IteratorResult containing the next value or done status.
   * @throws If an error occurs while reading from the stream.
   */
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

  /**
   * Implements the return method of the async iterator.
   * Cancels the stream reader and releases the lock.
   * @returns A promise that resolves to a done IteratorResult.
   */
  async return(): Promise<IteratorResult<T>> {
    try {
      await this.reader.cancel();
    } catch (error) {
      console.debug('Failed to cancel stream reader:', error);
    } finally {
      this.releaseLock();
    }
    return { done: true, value: undefined };
  }

  /**
   * Implements the throw method of the async iterator.
   * Releases the lock and returns a done result.
   * @param error - The error to be thrown.
   * @returns A promise that resolves to a done IteratorResult.
   */
  async throw(error: any): Promise<IteratorResult<T>> {
    // Ensure the reader lock is released before throwing
    this.releaseLock();
    return { done: true, value: undefined };
  }
}
