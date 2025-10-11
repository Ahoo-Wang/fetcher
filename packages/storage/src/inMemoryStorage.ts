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

export class InMemoryStorage implements Storage {
  private readonly store: Map<string, string> = new Map();

  /**
   * Gets the number of items stored in the storage.
   */
  get length(): number {
    return this.store.size;
  }

  /**
   * Clears all items from the storage.
   */
  clear(): void {
    this.store.clear();
  }

  /**
   * Gets an item from the storage.
   * @param key - The key of the item to retrieve
   * @returns The value of the item, or null if the item does not exist
   */
  getItem(key: string): string | null {
    const value = this.store.get(key);
    return value !== undefined ? value : null;
  }

  /**
   * Gets the key at the specified index.
   * @param index - The index of the key to retrieve
   * @returns The key at the specified index, or null if the index is out of bounds
   */
  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

  /**
   * Removes an item from the storage.
   * @param key - The key of the item to remove
   */
  removeItem(key: string): void {
    this.store.delete(key);
  }

  /**
   * Sets an item in the storage.
   * @param key - The key of the item to set
   * @param value - The value to set
   */
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}