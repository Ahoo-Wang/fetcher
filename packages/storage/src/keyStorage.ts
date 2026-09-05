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

import type { Serializer } from './serializer';
import { jsonSerializer } from './serializer';
import type { EventHandler, TypedEventBus } from '@ahoo-wang/fetcher-eventbus';
import {
  BroadcastTypedEventBus,
  nameGenerator,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import { getStorage } from './env';

export interface StorageEvent<Deserialized> {
  newValue?: Deserialized | null;
  oldValue?: Deserialized | null;
}

// Kept on the wire so receivers never need to serialize a cloned class instance.
const SERIALIZED_STORAGE_EVENT = '__fetcher_storage_snapshot__';

type SerializedStorageEvent = StorageEvent<unknown> & {
  [SERIALIZED_STORAGE_EVENT]: StorageEvent<string>;
};

const broadcastStorageStates = new WeakMap<
  object,
  {
    owners: number;
    snapshots: WeakMap<object, SerializedStorageEvent>;
    transformer: object;
  }
>();

function deserializeStorageEvent<T>(
  message: unknown,
  serializer: Serializer<string, T>,
): StorageEvent<T> {
  const snapshot = (message as SerializedStorageEvent)[
    SERIALIZED_STORAGE_EVENT
  ];
  if (!snapshot) return message as StorageEvent<T>;
  const newValue =
    snapshot.newValue == null
      ? snapshot.newValue
      : serializer.deserialize(snapshot.newValue);
  let oldValue: T | null | undefined;
  try {
    oldValue =
      snapshot.oldValue == null
        ? snapshot.oldValue
        : serializer.deserialize(snapshot.oldValue);
  } catch {
    // A missing historical value must not discard a valid current value.
  }
  return { newValue, oldValue };
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

  /**
   * Optional default value to return when no value exists in storage
   */
  defaultValue?: Deserialized;
}

/**
 * A storage wrapper that manages a single value associated with a specific key
 * Provides caching and automatic cache invalidation when the storage value changes
 * @template Deserialized The type of the value being stored
 */
export class KeyStorage<
  Deserialized,
> implements StorageListenable<Deserialized> {
  private readonly key: string;
  private readonly serializer: Serializer<string, Deserialized>;
  private readonly storage: Storage;
  public readonly eventBus: TypedEventBus<StorageEvent<Deserialized>>;
  private releaseTransformer?: () => void;
  private readonly defaultValue: Deserialized | null = null;
  private cacheValue: Deserialized | null = null;
  private readonly serializedEvents = new WeakMap<
    object,
    SerializedStorageEvent
  >();
  private readonly keyStorageHandler: EventHandler<StorageEvent<Deserialized>> =
    {
      name: nameGenerator.generate('KeyStorage'),
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
    this.eventBus =
      options.eventBus ??
      new SerialTypedEventBus<StorageEvent<Deserialized>>(
        `KeyStorage:${this.key}`,
      );
    if (this.eventBus instanceof BroadcastTypedEventBus) {
      const bus = this.eventBus;
      let state = broadcastStorageStates.get(bus);
      if (state?.transformer !== bus.messageTransformer) state = undefined;
      if (state?.owners === 0 || (!state && !bus.messageTransformer)) {
        const snapshots = new WeakMap<object, SerializedStorageEvent>();
        const serializer = this.serializer;
        const transformer = {
          serialize: (event: StorageEvent<Deserialized>) =>
            snapshots.get(event) ?? event,
          deserialize: (message: unknown) =>
            deserializeStorageEvent(message, serializer),
        };
        state = { owners: 0, snapshots, transformer };
        bus.messageTransformer = transformer;
        broadcastStorageStates.set(bus, state);
      }
      if (state) {
        this.serializedEvents = state.snapshots;
        state.owners++;
        const ownedState = state;
        this.releaseTransformer = () => {
          // Direct bus subscribers can still receive already posted snapshots.
          ownedState.owners--;
        };
      }
    }
    this.defaultValue = options.defaultValue ?? null;
    this.eventBus.on(this.keyStorageHandler);
  }

  /**
   * Adds a listener for storage changes.
   *
   * The listener will be called whenever the storage value changes,
   * either locally or from other tabs/windows.
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
    this.eventBus.on(listener);
    return () => this.eventBus.off(listener.name);
  }

  /**
   * Retrieves the current value from storage.
   *
   * Uses caching to avoid repeated deserialization. If the value is not in cache,
   * it retrieves it from the underlying storage and deserializes it.
   *
   * @returns The deserialized value, or null if no value exists in storage
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
    this.cacheValue = this.serializer.deserialize(value);
    return this.cacheValue;
  }

  /**
   * Stores a value in storage and notifies all listeners.
   *
   * Serializes the value, stores it in the underlying storage, updates the cache,
   * and emits a change event to all registered listeners.
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
    const oldValue = this.get();
    const serialized = this.serializer.serialize(value);
    const event = this.snapshotEvent(
      { newValue: value, oldValue },
      serialized,
      this.snapshotOldValue(oldValue),
    );
    this.storage.setItem(this.key, serialized);
    this.cacheValue = value;
    this.eventBus.emit(event);
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
    const event = this.snapshotEvent(
      { newValue: null, oldValue },
      null,
      this.snapshotOldValue(oldValue),
    );
    this.storage.removeItem(this.key);
    this.cacheValue = null;
    this.eventBus.emit(event);
  }

  private snapshotOldValue(
    oldValue: Deserialized | null,
  ): string | null | undefined {
    try {
      const stored = this.storage.getItem(this.key);
      if (stored != null) return stored;
      if (oldValue == null) return oldValue === null ? null : undefined;
      return this.serializer.serialize(oldValue);
    } catch {
      // Missing snapshot data must not prevent a cached value from being changed.
      return undefined;
    }
  }

  private snapshotEvent(
    event: StorageEvent<Deserialized>,
    serializedNewValue: string | null,
    serializedOldValue: string | null | undefined,
  ): StorageEvent<Deserialized> {
    if (!this.releaseTransformer) return event;
    const wireEvent: SerializedStorageEvent = {
      [SERIALIZED_STORAGE_EVENT]: {
        newValue: serializedNewValue,
        oldValue: serializedOldValue,
      },
    };
    for (const name of ['newValue', 'oldValue'] as const) {
      try {
        const json = JSON.stringify(event[name]);
        if (json !== undefined) wireEvent[name] = JSON.parse(json);
      } catch {
        // Unsupported JSON values still travel in the serializer's string snapshot.
      }
    }
    this.serializedEvents.set(event, wireEvent);
    return event;
  }

  /**
   * Cleans up resources used by the KeyStorage instance.
   *
   * Removes the internal event handler from the event bus.
   * Should be called when the KeyStorage instance is no longer needed
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
    this.releaseTransformer?.();
    this.releaseTransformer = undefined;
  }
}
