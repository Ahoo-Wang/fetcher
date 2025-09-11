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

import { createListenableStorage, ListenableStorage, StorageListener } from './listenableStorage';
import { Serializer, typedIdentitySerializer } from '../serializer';

/**
 * Options for configuring KeyStorage
 */
export interface KeyStorageOptions<Deserialized> {
  /**
   * The key used to store and retrieve values from storage
   */
  key: string;

  /**
   * Optional serializer for converting values to and from storage format
   * Defaults to IdentitySerializer if not provided
   */
  serializer?: Serializer<string, Deserialized>;

  /**
   * Optional storage implementation
   * Defaults to the result of createListenableStorage() if not provided
   */
  storage?: ListenableStorage;
}

/**
 * A storage wrapper that manages a single value associated with a specific key
 * Provides caching and automatic cache invalidation when the storage value changes
 * @template Deserialized The type of the value being stored
 */
export class KeyStorage<Deserialized> {
  private readonly key: string;
  private readonly serializer: Serializer<string, Deserialized>;
  private readonly storage: ListenableStorage;
  private cacheValue: Deserialized | null = null;

  /**
   * Listener for storage change events
   * Invalidates the cache when the relevant key is modified
   */
  private readonly listener: StorageListener = (event) => {
    if (event.key !== this.key) {
      return;
    }
    this.cacheValue = null;
    if (event.newValue) {
      this.refreshCache(event.newValue);
    }
  };

  /**
   * Refreshes the cached value by deserializing the provided string
   * @param value The serialized value to deserialize and cache
   */
  private refreshCache(value: string) {
    this.cacheValue = this.serializer.deserialize(value);
  }

  /**
   * Creates a new KeyStorage instance
   * @param options Configuration options for the storage
   */
  constructor(options: KeyStorageOptions<Deserialized>) {
    this.key = options.key;
    this.serializer = options.serializer ?? typedIdentitySerializer();
    this.storage = options.storage ?? createListenableStorage();
    this.storage.addListener(this.listener);
  }

  /**
   * Gets the value associated with the key from storage
   * Uses cached value if available, otherwise retrieves from storage and caches it
   * @returns The deserialized value or null if no value is found
   */
  get(): Deserialized | null {
    if (this.cacheValue) {
      return this.cacheValue;
    }
    const value = this.storage.getItem(this.key);
    if (!value) {
      return null;
    }
    this.refreshCache(value);
    return this.cacheValue;
  }

  /**
   * Sets the value associated with the key in storage
   * Also updates the cached value
   * @param value The value to serialize and store
   */
  set(value: Deserialized): void {
    const serialized = this.serializer.serialize(value);
    this.storage.setItem(this.key, serialized);
    this.cacheValue = value;
  }

  /**
   * Removes the value associated with the key from storage
   * Also clears the cached value
   */
  remove(): void {
    this.storage.removeItem(this.key);
    this.cacheValue = null;
  }
}