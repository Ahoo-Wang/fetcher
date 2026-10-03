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

import type { Serializer } from './serializer.js';
import { jsonSerializer } from './serializer.js';
import type { EventHandler, TypedEventBus } from '@ahoo-wang/fetcher-eventbus';
import {
  nameGenerator,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { getStorage } from './env.js';
import type { StorageEventSnapshots } from './storageEventCodec.js';
import {
  bindStorageEventCodec,
  snapshotStorageEvent,
} from './storageEventCodec.js';

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
   * Defaults to jsonSerializer if not provided
   */
  serializer?: Serializer<string, Deserialized>;

  /**
   * Optional storage instance. Defaults to localStorage in a browser, or a new
   * InMemoryStorage when `window` is undefined (see getStorage())
   */
  storage?: Storage;

  /**
   * Optional event bus for change events. Defaults to a SerialTypedEventBus,
   * which notifies this tab only; pass a BroadcastTypedEventBus to hear other
   * tabs too.
   * A shared bus must represent one storage key. An automatic broadcast codec is
   * bound to the same serializer instance for the bus lifetime, including after destroy().
   * Caller-configured or replaced codecs remain the caller's responsibility.
   */
  eventBus?: TypedEventBus<StorageEvent<Deserialized>>;

  /**
   * Optional default value to return when no value exists in storage
   */
  defaultValue?: Deserialized;
}

/**
 * A storage wrapper that manages a single value associated with a specific key.
 *
 * Values are cached. The cache follows the changes its event bus carries:
 * writes through this instance, through another instance sharing the bus, and
 * — with a BroadcastTypedEventBus — from other tabs. A write by an instance on
 * a different bus, or straight to the backend, is not seen until `reload()`;
 * share a bus between instances that must agree.
 * @template Deserialized The type of the value being stored
 */
export class KeyStorage<
  Deserialized,
> implements StorageListenable<Deserialized> {
  private readonly key: string;
  private readonly serializer: Serializer<string, Deserialized>;
  private readonly storage: Storage;
  public readonly eventBus: TypedEventBus<StorageEvent<Deserialized>>;
  private readonly defaultValue: Deserialized | null = null;
  private cacheValue: Deserialized | null = null;
  private readonly serializedEvents?: StorageEventSnapshots;
  /** Whether this instance created its event bus, and so closes it. */
  private ownsEventBus: boolean;
  // Runs before every other handler, so it sees events in emit order: set()
  // already updated the cache, and a slow listener ahead of it could otherwise
  // let an older event overwrite a newer value.
  private readonly keyStorageHandler: EventHandler<StorageEvent<Deserialized>> =
    {
      name: nameGenerator.generate('KeyStorage'),
      order: Number.MIN_SAFE_INTEGER,
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
    this.serializer = options.serializer ?? jsonSerializer;
    this.storage = options.storage ?? getStorage();
    this.ownsEventBus = options.eventBus === undefined;
    this.eventBus =
      options.eventBus ??
      new SerialTypedEventBus<StorageEvent<Deserialized>>(
        `KeyStorage:${this.key}`,
      );
    const codec = bindStorageEventCodec(
      this.eventBus,
      this.key,
      this.serializer,
      options.serializer === undefined,
    );
    this.serializer = codec.serializer;
    this.serializedEvents = codec.snapshots;
    this.defaultValue = options.defaultValue ?? null;
    this.eventBus.on(this.keyStorageHandler);
  }

  /**
   * Adds a listener for storage changes.
   *
   * The listener will be called whenever the storage value changes through
   * this key's event bus: this tab's changes, and other tabs' changes when the
   * bus is a BroadcastTypedEventBus.
   *
   * Names are unique per bus: when another listener already has this name,
   * the listener is not added and the returned function does nothing. The
   * returned function removes only this listener, never one registered later
   * under the same name.
   *
   * @param listener - The event handler to be called when storage changes
   * @returns A function that can be called to remove the listener
   *
   * @example
   * ```typescript
   * const storage = new KeyStorage<string>({ key: 'userName' });
   * const removeListener = storage.addListener({
   *   name: 'userNameChange',
   *   handle: (event) => {
   *     console.log('User name changed:', event.newValue);
   *   }
   * });
   *
   * // Later, to remove the listener
   * removeListener();
   * ```
   */
  addListener(
    listener: EventHandler<StorageEvent<Deserialized>>,
  ): RemoveStorageListener {
    if (!this.eventBus.on(listener)) {
      // The name is taken by another listener, which this remover must not remove.
      return () => {};
    }
    return () => {
      if (this.eventBus.handlers.includes(listener)) {
        this.eventBus.off(listener.name);
      }
    };
  }

  /**
   * Retrieves the current value from storage.
   *
   * Uses caching to avoid repeated deserialization. If the value is not in cache,
   * it retrieves it from the underlying storage and deserializes it.
   *
   * A stored value that cannot be deserialized (corrupted, or written by
   * another version or program) is removed with a warning and treated as
   * absent, so a bad value never makes every later read, write or removal
   * throw.
   *
   * @returns The deserialized value, or the default value (null unless set) if none is stored
   *
   * @example
   * ```typescript
   * const storage = new KeyStorage<string>({ key: 'userName' });
   * const userName = storage.get();
   * console.log(userName); // 'John Doe' or null
   * ```
   */
  get(): Deserialized | null {
    if (this.cacheValue !== null && this.cacheValue !== undefined) {
      return this.cacheValue;
    }
    const value = this.storage.getItem(this.key);
    if (value === null || value === undefined) {
      return this.defaultValue;
    }
    try {
      this.cacheValue = this.serializer.deserialize(value);
    } catch (error) {
      console.warn(
        `Removing the unreadable stored value of ${this.key}:`,
        error,
      );
      this.storage.removeItem(this.key);
      return this.defaultValue;
    }
    return this.cacheValue;
  }

  /**
   * Reads the stored value again, bypassing the cache: for when another tab
   * may have written it and its change event has not arrived yet. The cached
   * object is kept when the stored text is unchanged, so identity checks on
   * it still hold.
   *
   * @returns The stored value, or the default value if none is stored
   */
  reload(): Deserialized | null {
    const value = this.storage.getItem(this.key);
    if (value === null || value === undefined) {
      this.cacheValue = null;
      return this.defaultValue;
    }
    if (this.cacheValue !== null && this.cacheValue !== undefined) {
      try {
        if (this.serializer.serialize(this.cacheValue) === value) {
          return this.cacheValue;
        }
      } catch {
        // Fall through and read the stored text.
      }
    }
    this.cacheValue = null;
    return this.get();
  }

  /**
   * Stores a value in storage and notifies all listeners.
   *
   * Serializes the value, stores it in the underlying storage, updates the cache,
   * and emits a change event to all registered listeners. Storing `undefined`
   * removes the value (see remove()): it has no serialized form.
   *
   * @param value - The value to store (will be serialized before storage)
   *
   * @example
   * ```typescript
   * const storage = new KeyStorage<string>({ key: 'userName' });
   * storage.set('John Doe');
   * ```
   */
  set(value: Deserialized): void {
    if (value === undefined) {
      this.remove();
      return;
    }
    const oldValue = this.get();
    const serialized = this.serializer.serialize(value);
    const event = this.snapshotEvent({ newValue: value, oldValue }, serialized);
    this.storage.setItem(this.key, serialized);
    this.cacheValue = value;
    this.eventBus.emit(event).catch(error => {
      console.warn(`Storage event error for ${this.key}:`, error);
    });
  }

  /**
   * Removes the value from storage and notifies all listeners.
   *
   * Removes the item from the underlying storage, clears the cache,
   * and emits a change event indicating the value was removed.
   *
   * @example
   * ```typescript
   * const storage = new KeyStorage<string>({ key: 'userName' });
   * storage.remove(); // Removes the stored value
   * ```
   */
  remove(): void {
    const oldValue = this.get();
    const event = this.snapshotEvent({ newValue: null, oldValue }, null);
    this.storage.removeItem(this.key);
    this.cacheValue = null;
    this.eventBus.emit(event).catch(error => {
      console.warn(`Storage event error for ${this.key}:`, error);
    });
  }

  private snapshotEvent(
    event: StorageEvent<Deserialized>,
    serializedNewValue: string | null,
  ): StorageEvent<Deserialized> {
    snapshotStorageEvent(
      this.eventBus,
      this.serializedEvents,
      event,
      this.serializer,
      serializedNewValue,
    );
    return event;
  }

  /**
   * Marks the event bus a subclass created for this instance (and passed in
   * `eventBus`) as owned: destroy() then closes it too.
   */
  protected ownEventBus(): void {
    this.ownsEventBus = true;
  }

  /**
   * Cleans up resources used by the KeyStorage instance.
   *
   * Removes the internal event handler from the event bus, and closes the
   * bus if this instance created it. Should be called when the KeyStorage instance is no longer needed
   * to prevent memory leaks.
   *
   * @example
   * ```typescript
   * const storage = new KeyStorage<string>({ key: 'userName' });
   * // ... use storage ...
   * storage.destroy(); // Clean up resources
   * ```
   */
  destroy() {
    this.eventBus.off(this.keyStorageHandler.name);
    // A bus this instance created (a broadcast channel, say) has no other
    // user: close it rather than leak it.
    if (this.ownsEventBus) {
      this.eventBus.destroy();
    }
  }
}
