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

export const STORAGE_EVENT_TYPE = 'storage';

export type StorageListener = (event: StorageEvent) => void;
export type RemoveStorageListener = () => void;

export interface ListenableStorage extends Storage {
  addListener(listener: StorageListener): RemoveStorageListener;
}

export class InMemoryListenableStorage implements ListenableStorage {
  private readonly store: Map<string, string> = new Map();
  private readonly listeners: Set<StorageListener> = new Set();

  get length(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }

  getItem(key: string): string | null {
    const value = this.store.get(key);
    return value !== undefined ? value : null;
  }

  key(index: number): string | null {
    const keys = Array.from(this.store.keys());
    return keys[index] || null;
  }

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
  addListener(listener: StorageListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Removes a listener for storage changes.
   * @param listener - The listener function to remove
   */
  removeListener(listener: StorageListener): boolean {
    return this.listeners.delete(listener);
  }

  private notifyListeners(
    eventInit: StorageEventInit,
  ): void {
    if (window) {
      eventInit.url = eventInit.url || window.location.href;
    }
    eventInit.storageArea = this;
    const event = new StorageEvent(STORAGE_EVENT_TYPE, eventInit);
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in storage change listener:', error);
      }
    });
  }
}

export class BrowserListenableStorage implements ListenableStorage {

  constructor(private readonly storage: Storage) {
  }

  get length(): number {
    return this.storage.length;
  }

  addListener(listener: StorageListener): RemoveStorageListener {
    const wrapper: StorageListener = (event: StorageEvent) => {
      if (event.storageArea === this.storage) {
        listener(event);
      }
    };
    window.addEventListener(STORAGE_EVENT_TYPE, wrapper);
    return () => window.removeEventListener(STORAGE_EVENT_TYPE, wrapper);
  }

  clear(): void {
    this.storage.clear();
  }

  getItem(key: string): string | null {
    return this.storage.getItem(key);
  }

  key(index: number): string | null {
    return this.storage.key(index);
  }

  removeItem(key: string): void {
    return this.storage.removeItem(key);
  }


  setItem(key: string, value: string): void {
    return this.storage.setItem(key, value);
  }


}