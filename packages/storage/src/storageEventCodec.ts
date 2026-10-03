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
 * The cross-tab wire codec of KeyStorage: how a StorageEvent travels through a
 * BroadcastTypedEventBus. Internal; not exported from the package.
 */

import type {
  BroadcastTypedEventBus,
  TypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';
import type { Serializer } from './serializer.js';
import type { StorageEvent } from './keyStorage.js';

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

type BroadcastStorageBus<T> = TypedEventBus<StorageEvent<T>> &
  Pick<BroadcastTypedEventBus<StorageEvent<T>>, 'messageTransformer'>;

/** Wire snapshots taken before dispatch, keyed by the local event object. */
export type StorageEventSnapshots = WeakMap<object, SerializedStorageEvent>;

/**
 * A DataCloneError fallback: retries with only the string snapshot when the
 * live values in the wire event cannot be structured-cloned.
 */
function fallbackSerialize(message: unknown, error: unknown): unknown {
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
        Object.prototype.hasOwnProperty.call(snapshot, 'oldValue')) &&
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
}

/**
 * Binds a KeyStorage to a bus. A bus with a `messageTransformer` slot (a
 * BroadcastTypedEventBus) is claimed for one key and, when it has no
 * transformer yet, gets the automatic codec bound to the serializer.
 *
 * @returns the serializer the instance must use (the bus's, when both use the
 *   default) and the snapshot map when the bus carries the automatic codec
 * @throws when the bus is already bound to another key or serializer
 */
export function bindStorageEventCodec<T>(
  eventBus: TypedEventBus<StorageEvent<T>>,
  key: string,
  serializer: Serializer<string, T>,
  defaultSerializer: boolean,
): { serializer: Serializer<string, T>; snapshots?: StorageEventSnapshots } {
  if (!('messageTransformer' in eventBus)) return { serializer };
  const bus = eventBus as BroadcastStorageBus<T>;
  let state = broadcastStorageStates.get(bus);
  if (!state) {
    state = { key };
    if (!bus.messageTransformer) {
      const snapshots: StorageEventSnapshots = new WeakMap();
      bus.messageTransformer = {
        serializeBeforeDispatch: true,
        serialize: (event: StorageEvent<T>) => {
          const snapshot = snapshots.get(event);
          snapshots.delete(event);
          return snapshot ?? serializeStorageEvent(event, serializer);
        },
        deserialize: (message: unknown) =>
          deserializeStorageEvent(message, serializer),
        fallbackSerialize,
      };
      state.transformer = bus.messageTransformer;
      state.serializer = serializer;
      state.defaultSerializer = defaultSerializer;
      state.snapshots = snapshots;
    }
    broadcastStorageStates.set(bus, state);
  }
  if (state.key !== key) {
    throw new Error(
      'A shared storage event bus requires the same storage key; create a new bus for another key.',
    );
  }
  if (!state.snapshots) return { serializer };
  if (defaultSerializer && state.defaultSerializer) {
    serializer = state.serializer as Serializer<string, T>;
  }
  if (state.serializer !== serializer) {
    throw new Error(
      'An automatic storage event bus requires the same serializer instance for its lifetime; create a new bus for another serializer.',
    );
  }
  return { serializer, snapshots: state.snapshots };
}

/**
 * Records the wire snapshot of a local event before dispatch, while the
 * bus still carries the automatic codec (a caller may have replaced it).
 */
export function snapshotStorageEvent<T>(
  eventBus: TypedEventBus<StorageEvent<T>>,
  snapshots: StorageEventSnapshots | undefined,
  event: StorageEvent<T>,
  serializer: Serializer<string, T>,
  serializedNewValue: string | null,
): void {
  if (
    !snapshots ||
    !('messageTransformer' in eventBus) ||
    eventBus.messageTransformer !==
      broadcastStorageStates.get(eventBus)?.transformer
  )
    return;
  snapshots.set(
    event,
    serializeStorageEvent(event, serializer, serializedNewValue),
  );
}
