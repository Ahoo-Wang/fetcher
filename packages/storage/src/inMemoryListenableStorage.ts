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

import {
  ListenableStorage,
  RemoveStorageListener,
  StorageListener,
} from './listenableStorage';
import { isBrowser } from './env';

/**
 * An in-memory implementation of ListenableStorage that works in any environment.
 * This implementation stores data in a Map and manually fires storage events when data changes.
 */
export class InMemoryListenableStorage implements ListenableStorage {
  private readonly store: Map<string, string> = new Map();
  private readonly listeners: Set<StorageListener> = new Set();

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
    const oldValue = this.getItem(key);
    if (this.store.has(key)) {
      this.store.delete(key);
      this.notifyListeners({
        key,
        oldValue,
        newValue: null,
      });
    }
  }

  /**
   * Sets an item in the storage.
   * @param key - The key of the item to set
   * @param value - The value to set
   */
  setItem(key: string, value: string): void {
    const oldValue = this.getItem(key);
    this.store.set(key, value);
    this.notifyListeners({ key, oldValue, newValue: value });
  }

  /**
   * Adds a listener for storage changes.
   * @param listener - The listener function to be called when storage changes
   * @returns A function that can be called to remove the listener
   */
  addListener(listener: StorageListener): RemoveStorageListener {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Notifies all listeners of a storage change by creating and dispatching a StorageEvent.
   * @param eventInit - The initialization object for the StorageEvent
   */
  private notifyListeners(eventInit: StorageEventInit): void {
    if (isBrowser() && window.location) {
      eventInit.url = eventInit.url || window.location.href;
    }
    eventInit.storageArea = this;
    this.listeners.forEach(listener => {
      try {
        listener(eventInit);
      } catch (error) {
        console.error('Error in storage change listener:', error);
      }
    });
  }
}
