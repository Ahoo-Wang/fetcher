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

import { Serializer, typedIdentitySerializer } from './serializer';
import {
  EventHandler,
  SerialTypedEventBus,
  TypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

export interface StorageEvent<Deserialized> {
  newValue?: Deserialized | null;
  oldValue?: Deserialized | null;
}

/**
 * A function that removes a storage listener when called.
 */
export type RemoveStorageListener = () => void;

export interface StorageListenable<Deserialized> {
  /**
   * Adds a listener for storage changes.
   * @param listener - The listener function to be called when storage changes
   * @returns A function that can be called to remove the listener
   */
  addListener(
    listener: EventHandler<StorageEvent<Deserialized>>,
  ): RemoveStorageListener;
}

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
   * Optional storage instance. Defaults to localStorage
   */
  storage?: Storage;

  /**
   * Optional event bus for cross-tab communication. Defaults to SerialTypedEventBus
   */
  eventBus?: TypedEventBus<StorageEvent<Deserialized>>;
}

/**
 * A storage wrapper that manages a single value associated with a specific key
 * Provides caching and automatic cache invalidation when the storage value changes
 * @template Deserialized The type of the value being stored
 */
export class KeyStorage<Deserialized>
  implements StorageListenable<Deserialized> {
  private readonly key: string;
  private readonly serializer: Serializer<string, Deserialized>;
  private readonly storage: Storage;
  private readonly eventBus: TypedEventBus<StorageEvent<Deserialized>>;
  private cacheValue: Deserialized | null = null;
  private readonly keyStorageHandler: EventHandler<StorageEvent<Deserialized>> = {
    name: 'KeyStorage',
    handle: (event: StorageEvent<Deserialized>) => {
      this.cacheValue = event.newValue ?? null;
    },
  };

  /**
   * Creates a new KeyStorage instance
   * @param options Configuration options for the storage
   */
  constructor(options: KeyStorageOptions<Deserialized>) {
    this.key = options.key;
    this.serializer = options.serializer ?? typedIdentitySerializer();
    this.storage = options.storage ?? window.localStorage;
    this.eventBus =
      options.eventBus ??
      new SerialTypedEventBus<StorageEvent<Deserialized>>(
        `KeyStorage:${this.key}`,
      );
    this.eventBus.on(this.keyStorageHandler);
  }

  addListener(
    listener: EventHandler<StorageEvent<Deserialized>>,
  ): RemoveStorageListener {
    this.eventBus.on(listener);
    return () => this.eventBus.off(listener.name);
  }

  get(): Deserialized | null {
    if (this.cacheValue) {
      return this.cacheValue;
    }
    const value = this.storage.getItem(this.key);
    if (!value) {
      return null;
    }
    this.cacheValue = this.serializer.deserialize(value);
    return this.cacheValue;
  }

  set(value: Deserialized): void {
    const oldValue = this.get();
    const serialized = this.serializer.serialize(value);
    this.storage.setItem(this.key, serialized);
    this.cacheValue = value;
    this.eventBus.emit({
      newValue: value,
      oldValue: oldValue,
    });
  }

  remove(): void {
    const oldValue = this.get();
    this.storage.removeItem(this.key);
    this.cacheValue = null;
    this.eventBus.emit({
      oldValue: oldValue,
      newValue: null,
    });
  }

  destroy() {
    this.eventBus.off(this.keyStorageHandler.name);
  }
}
