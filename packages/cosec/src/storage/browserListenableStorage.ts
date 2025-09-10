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

import { ListenableStorage, RemoveStorageListener, STORAGE_EVENT_TYPE, StorageListener } from './listenableStorage';

/**
 * A wrapper around the browser's native Storage (localStorage or sessionStorage)
 * that implements the ListenableStorage interface by using the browser's native storage events.
 */
export class BrowserListenableStorage implements ListenableStorage {

  /**
   * Creates a new BrowserListenableStorage instance.
   * @param storage - The native Storage object to wrap (e.g., localStorage or sessionStorage)
   */
  constructor(private readonly storage: Storage) {
  }

  /**
   * Gets the number of items stored in the storage.
   */
  get length(): number {
    return this.storage.length;
  }

  /**
   * Adds a listener for storage changes.
   * @param listener - The listener function to be called when storage changes
   * @returns A function that can be called to remove the listener
   */
  addListener(listener: StorageListener): RemoveStorageListener {
    const wrapper: StorageListener = (event: StorageEventInit) => {
      if (event.storageArea === this.storage) {
        listener(event);
      }
    };
    window.addEventListener(STORAGE_EVENT_TYPE, wrapper);
    return () => window.removeEventListener(STORAGE_EVENT_TYPE, wrapper);
  }

  /**
   * Clears all items from the storage.
   */
  clear(): void {
    this.storage.clear();
  }

  /**
   * Gets an item from the storage.
   * @param key - The key of the item to retrieve
   * @returns The value of the item, or null if the item does not exist
   */
  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  /**
   * Gets the key at the specified index.
   * @param index - The index of the key to retrieve
   * @returns The key at the specified index, or null if the index is out of bounds
   */
  key(index: number): string | null {
    return this.storage.key(index);
  }

  /**
   * Removes an item from the storage.
   * @param key - The key of the item to remove
   */
  removeItem(key: string): void {
    this.storage.removeItem(key);
  }

  /**
   * Sets an item in the storage.
   * @param key - The key of the item to set
   * @param value - The value to set
   */
  setItem(key: string, value: string): void {
    this.storage.setItem(key, value);
  }
}