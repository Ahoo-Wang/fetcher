---
title: 'Serialization and runtime storage'
description: 'Serialization and runtime storage — @ahoo-wang/fetcher-storage 5.0.0'
---

# Serialization and runtime storage

Use a string serializer with `KeyStorage`; use a native `Storage` backend or the exported in-memory implementation. Runtime detection selects a backend, not a durability or availability guarantee.

## Backend selection {#runtime}

`isBrowser(): boolean` only checks `typeof window !== 'undefined'`. `getStorage(): Storage` returns `window.localStorage` in that case, otherwise a **new** `InMemoryStorage` on each call. It does not catch security/access errors or fall back when localStorage is blocked. For SSR request isolation or deliberate sharing, construct and inject the storage explicitly. Browser session storage is selected by passing `storage: window.sessionStorage`; there is no separate automatic session selector.

`InMemoryStorage` implements `Storage` using `Map<string, string>`:

| Member                      | Contract                    |
| --------------------------- | --------------------------- |
| `length`                    | Number of stored keys.      |
| `setItem(key, value): void` | Store/replace string value. |
| `getItem(key): string       | null`                       | Missing key returns null.                        |
| `removeItem(key): void`     | Remove if present.          |
| `key(index): string         | null`                       | Insertion-order key; outside range returns null. |
| `clear(): void`             | Remove every entry.         |

Memory storage does not dispatch native storage events or persist across process/page lifetimes. Its TypeScript API expects strings; do not rely on the runtime string coercion of browser Storage for non-string inputs.

## Serializers {#serializers}

`Serializer<Serialized, Deserialized>` requires `serialize(value: any): Serialized` and `deserialize(value: Serialized): Deserialized`. Optional `deserializeLegacy(value: unknown)` supports old broadcast payloads, not ordinary `get()` reads.

| API                                | Contract                                                                                                                      |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `JsonSerializer`, `jsonSerializer` | Class and singleton wrapping `JSON.stringify` / `JSON.parse`. No schema validation or special handling of Date/BigInt/cycles. |
| `IdentitySerializer<T>`            | Both methods return their input unchanged.                                                                                    |
| `identitySerializer`               | Shared `IdentitySerializer<any>`.                                                                                             |
| `typedIdentitySerializer<T>()`     | Same singleton cast to `IdentitySerializer<T>`, not a new object.                                                             |

JSON stringify can throw for cycles/BigInt, and its runtime output for unsupported top-level values can be undefined despite the string return declaration. Do not persist such values. For a raw string use `typedIdentitySerializer<string>()`; an object identity serializer is not a valid `Serializer<string, T>` for KeyStorage. Custom codecs must agree across readers/writers and throw for malformed input rather than fabricate a valid value.

See [KeyStorage](./key-storage.md) for caching, synchronous failures, broadcast snapshots, and listener cleanup.

## Complete example {#example}

```ts
import {
  KeyStorage,
  InMemoryStorage,
  typedIdentitySerializer,
  type Serializer,
} from '@ahoo-wang/fetcher-storage';

const storage = new InMemoryStorage();
const dateCodec: Serializer<string, Date> = {
  serialize: (value: Date) => value.toISOString(),
  deserialize: value => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) throw new Error('Invalid date');
    return date;
  },
};
const updatedAt = new KeyStorage({
  key: 'updatedAt',
  storage,
  serializer: dateCodec,
});
updatedAt.set(new Date('2026-01-01T00:00:00Z'));
const token = new KeyStorage({
  key: 'token',
  storage,
  serializer: typedIdentitySerializer<string>(),
});
token.set('demo-token');
console.assert(storage.getItem('token') === 'demo-token');
updatedAt.destroy();
token.destroy();
updatedAt.eventBus.destroy();
token.eventBus.destroy();
```

## Public symbols and source {#symbols}

| Symbol                                                        | Implementation                                                                                                      |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| <a id="isbrowser"></a>`isBrowser`                             | [env.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L20)                         |
| <a id="getstorage"></a>`getStorage`                           | [env.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/env.ts#L29)                         |
| <a id="inmemorystorage"></a>`InMemoryStorage`                 | [inMemoryStorage.ts:14](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/inMemoryStorage.ts#L14) |
| <a id="serializer"></a>`Serializer`                           | [serializer.ts:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L19)           |
| <a id="jsonserializer"></a>`JsonSerializer`                   | [serializer.ts:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L41)           |
| <a id="identityserializer"></a>`IdentitySerializer`           | [serializer.ts:65](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L65)           |
| <a id="jsonserializer-instance"></a>`jsonSerializer`          | [serializer.ts:88](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L88)           |
| <a id="identityserializer-instance"></a>`identitySerializer`  | [serializer.ts:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L92)           |
| <a id="typedidentityserializer"></a>`typedIdentitySerializer` | [serializer.ts:94](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/serializer.ts#L94)           |

[Package index](./index.md)
