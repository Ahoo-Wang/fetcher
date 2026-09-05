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
import type {
  BroadcastTypedEventBus,
  EventHandler,
  TypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import {
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

type BroadcastStorageState = {
  key: string;
  serializer?: object;
  defaultSerializer?: boolean;
  transformer?: object;
  snapshots?: WeakMap<object, SerializedStorageEvent>;
};
const BROADCAST_STORAGE_STATES = Symbol.for(
  '@ahoo-wang/fetcher-storage/broadcast-storage-states',
);
const sharedState = globalThis as typeof globalThis & {
  [BROADCAST_STORAGE_STATES]?: WeakMap<object, BroadcastStorageState>;
};
const broadcastStorageStates =
  sharedState[BROADCAST_STORAGE_STATES] ??
  new WeakMap<object, BroadcastStorageState>();
if (!sharedState[BROADCAST_STORAGE_STATES]) {
  Object.defineProperty(sharedState, BROADCAST_STORAGE_STATES, {
    value: broadcastStorageStates,
  });
}

function deserializeStorageEvent<T>(
  message: unknown,
  serializer: Serializer<string, T>,
): StorageEvent<T> {
  const snapshot = (message as SerializedStorageEvent)[
    SERIALIZED_STORAGE_EVENT
  ];
  if (!snapshot && !serializer.deserializeLegacy) {
    return message as StorageEvent<T>;
  }
  const event = snapshot ?? (message as StorageEvent<unknown>);
  const deserialize = (value: unknown): T =>
    snapshot
      ? serializer.deserialize(value as string)
      : serializer.deserializeLegacy!(value);
  const decoded: StorageEvent<T> = {};
  if (Object.prototype.hasOwnProperty.call(event, 'newValue')) {
    const value = event.newValue;
    decoded.newValue =
      value === null
        ? null
        : value === undefined
          ? undefined
          : deserialize(value);
  }
  if (Object.prototype.hasOwnProperty.call(event, 'oldValue')) {
    try {
      const value = event.oldValue;
      decoded.oldValue =
        value === null
          ? null
          : value === undefined
            ? undefined
            : deserialize(value);
    } catch {
      // An unavailable historical value must not discard a valid current value.
      decoded.oldValue = undefined;
    }
  }
  return decoded;
}

function serializeStorageEvent<T>(
  event: StorageEvent<T>,
  serializer: Serializer<string, T>,
  serializedNewValue?: string | null,
): SerializedStorageEvent {
  const snapshot: StorageEvent<string> = {};
  const wireEvent: SerializedStorageEvent = {
    [SERIALIZED_STORAGE_EVENT]: snapshot,
  };
  if (Object.prototype.hasOwnProperty.call(event, 'newValue')) {
    const value = event.newValue;
    snapshot.newValue =
      serializedNewValue !== undefined
        ? serializedNewValue
        : value === null
          ? null
          : value === undefined
            ? undefined
            : serializer.serialize(value);
    wireEvent.newValue = value;
  }
  if (Object.prototype.hasOwnProperty.call(event, 'oldValue')) {
    const value = event.oldValue;
    try {
      snapshot.oldValue =
        value === null
          ? null
          : value === undefined
            ? undefined
            : serializer.serialize(value);
    } catch {
      // An unavailable historical snapshot must not discard the current value.
      snapshot.oldValue = undefined;
    }
    wireEvent.oldValue = value;
  }
  Object.defineProperty(wireEvent, 'toJSON', {
    value: () => {
      const jsonEvent: SerializedStorageEvent = {
        [SERIALIZED_STORAGE_EVENT]: snapshot,
      };
      for (const name of ['newValue', 'oldValue'] as const) {
        try {
          Object.assign(
            jsonEvent,
            JSON.parse(JSON.stringify({ [name]: wireEvent[name] })),
          );
        } catch {
          // JSON-incompatible values still travel in the string snapshot.
        }
      }
      return jsonEvent;
    },
  });
  return wireEvent;
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
   * Optional event bus for cross-tab communication. Defaults to SerialTypedEventBus.
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
  private readonly defaultValue: Deserialized | null = null;
  private cacheValue: Deserialized | null = null;
  private readonly serializedEvents?: WeakMap<object, SerializedStorageEvent>;
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
    if ('messageTransformer' in this.eventBus) {
      const bus = this.eventBus as TypedEventBus<StorageEvent<Deserialized>> &
        Pick<
          BroadcastTypedEventBus<StorageEvent<Deserialized>>,
          'messageTransformer'
        >;
      let state = broadcastStorageStates.get(bus);
      if (!state) {
        state = { key: this.key };
        if (!bus.messageTransformer) {
          const snapshots = new WeakMap<object, SerializedStorageEvent>();
          const serializer = this.serializer;
          bus.messageTransformer = {
            serializeBeforeDispatch: true,
            serialize: (event: StorageEvent<Deserialized>) => {
              const snapshot = snapshots.get(event);
              snapshots.delete(event);
              return snapshot ?? serializeStorageEvent(event, serializer);
            },
            deserialize: (message: unknown) =>
              deserializeStorageEvent(message, serializer),
            fallbackSerialize: (message: unknown, error: unknown) => {
              if (
                typeof error === 'object' &&
                error !== null &&
                'name' in error &&
                error.name === 'DataCloneError' &&
                typeof message === 'object' &&
                message !== null &&
                SERIALIZED_STORAGE_EVENT in message
              ) {
                const snapshot = message[SERIALIZED_STORAGE_EVENT];
                if (
                  typeof snapshot === 'object' &&
                  snapshot !== null &&
                  (Object.prototype.hasOwnProperty.call(snapshot, 'newValue') ||
                    Object.prototype.hasOwnProperty.call(
                      snapshot,
                      'oldValue',
                    )) &&
                  (!('newValue' in snapshot) ||
                    snapshot.newValue == null ||
                    typeof snapshot.newValue === 'string') &&
                  (!('oldValue' in snapshot) ||
                    snapshot.oldValue == null ||
                    typeof snapshot.oldValue === 'string')
                ) {
                  return { [SERIALIZED_STORAGE_EVENT]: snapshot };
                }
              }
              throw error;
            },
          };
          state.transformer = bus.messageTransformer;
          state.serializer = serializer;
          state.defaultSerializer = options.serializer === undefined;
          state.snapshots = snapshots;
        }
        broadcastStorageStates.set(bus, state);
      }
      if (state.key !== this.key) {
        throw new Error(
          'A shared storage event bus requires the same storage key; create a new bus for another key.',
        );
      }
      if (state.snapshots) {
        if (options.serializer === undefined && state.defaultSerializer) {
          this.serializer = state.serializer as Serializer<
            string,
            Deserialized
          >;
        }
        if (state.serializer !== this.serializer) {
          throw new Error(
            'An automatic storage event bus requires the same serializer instance for its lifetime; create a new bus for another serializer.',
          );
        }
        this.serializedEvents = state.snapshots;
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
    if (
      !this.serializedEvents ||
      !('messageTransformer' in this.eventBus) ||
      this.eventBus.messageTransformer !==
        broadcastStorageStates.get(this.eventBus)?.transformer
    )
      return event;
    this.serializedEvents.set(
      event,
      serializeStorageEvent(event, this.serializer, serializedNewValue),
    );
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
  }
}
