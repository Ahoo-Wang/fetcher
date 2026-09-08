---
title: '序列化与运行时存储'
description: '序列化与运行时存储 — @ahoo-wang/fetcher-storage 5.0.0'
---

# 序列化与运行时存储

`KeyStorage` 使用字符串序列化器；后端可选择原生 `Storage` 或导出的内存实现。运行时检测只负责选后端，不保证持久性或可用性。

## 后端选择 {#runtime}

`isBrowser(): boolean` 只检查 `typeof window !== 'undefined'`。`getStorage(): Storage` 在浏览器返回 `window.localStorage`，否则每次返回**新的** `InMemoryStorage`。它不捕获安全/访问错误，也不会在 localStorage 被阻止时回退。SSR 请求隔离或需要共享时，应显式构造并注入存储。浏览器会话存储通过 `storage: window.sessionStorage` 选择，没有独立的自动会话选择器。

`InMemoryStorage` 使用 `Map<string, string>` 实现 `Storage`：

| 成员                           | 契约                                  |
| ------------------------------ | ------------------------------------- |
| `length`                       | 已保存的键数。                        |
| `setItem(key, value): void`    | 保存或替换字符串。                    |
| `getItem(key): string \| null` | 缺失返回 null。                       |
| `removeItem(key): void`        | 存在则移除。                          |
| `key(index): string \| null`   | 返回插入顺序对应的键，越界返回 null。 |
| `clear(): void`                | 删除全部条目。                        |

内存存储不触发原生 storage 事件，也不会跨进程/页面生命周期持久化。TypeScript API 要求字符串，不能依赖浏览器 Storage 对非字符串参数的运行时强制转换。

## 序列化器 {#serializers}

`Serializer<Serialized, Deserialized>` 要求 `serialize(value: any): Serialized` 与 `deserialize(value: Serialized): Deserialized`。可选 `deserializeLegacy(value: unknown)` 用于旧广播负载，不用于普通 `get()` 读取。

| API                                | 契约                                                                                                    |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `JsonSerializer`、`jsonSerializer` | 类与单例，包装 `JSON.stringify` / `JSON.parse`，不做 Schema 校验，也不特殊处理 Date、BigInt、循环引用。 |
| `IdentitySerializer<T>`            | 两个方法都原样返回输入。                                                                                |
| `identitySerializer`               | 共享 `IdentitySerializer<any>`。                                                                        |
| `typedIdentitySerializer<T>()`     | 将同一单例转换为 `IdentitySerializer<T>`，不新建对象。                                                  |

JSON stringify 对循环引用/BigInt 可能抛错；对于不支持的顶层值，即便返回声明是 string，运行时仍可能返回 undefined，不要持久化这些值。原始字符串使用 `typedIdentitySerializer<string>()`；对象 identity 序列化器不能作为 KeyStorage 的 `Serializer<string, T>`。自定义编解码器必须在读写方一致，并应拒绝无效输入，不应伪造有效值。

缓存、同步失败、广播快照及解绑见 [KeyStorage](./key-storage.md)。

## 完整示例 {#example}

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

## 公开符号与源码 {#symbols}

| 符号                                                          | 实现                                                                                                                |
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

[包索引](./index.md)
