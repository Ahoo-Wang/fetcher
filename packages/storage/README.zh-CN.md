# @ahoo-wang/fetcher-storage

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-storage.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-storage.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-storage)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

一个轻量级的跨环境存储库，具有基于键的存储和自动环境检测功能。为浏览器 localStorage 和内存存储提供一致的 API，并支持变更通知。

## 特性

- 🌐 跨环境支持（浏览器和 Node.js）
- 📦 超轻量级（~2KB gzip）
- 🔔 存储变更事件监听
- 🔄 自动环境检测和降级处理
- 🛠️ 基于键的存储、缓存和序列化
- 🔧 自定义序列化支持
- 📝 完整的 TypeScript 支持

## 安装

```bash
npm install @ahoo-wang/fetcher-storage
```

## 使用方法

### 环境检测和存储选择

```typescript
import { getStorage, isBrowser } from '@ahoo-wang/fetcher-storage';

// 检查是否在浏览器环境中运行
console.log('是否为浏览器:', isBrowser());

// 获取当前环境的合适存储
const storage = getStorage(); // 浏览器中使用 localStorage，Node.js 中使用 InMemoryStorage

// 像标准 Storage API 一样使用
storage.setItem('key', 'value');
const value = storage.getItem('key');
```

### 基于键的存储和缓存

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// 为特定键创建类型化的存储
const userStorage = new KeyStorage<{ name: string; age: number }>({
  key: 'user',
});

// 设置和获取值，自动缓存
userStorage.set({ name: 'John', age: 30 });
const user = userStorage.get(); // {name: 'John', age: 30}

// 监听此特定键的变更
const removeListener = userStorage.addListener(event => {
  console.log('用户变更:', event.newValue, '来自:', event.oldValue);
});

// 使用完毕后清理
removeListener();
```

### 自定义序列化

```typescript
import { KeyStorage, JsonSerializer } from '@ahoo-wang/fetcher-storage';

// 使用 JSON 序列化（默认）
const jsonStorage = new KeyStorage<any>({
  key: 'data',
  serializer: new JsonSerializer(),
});

jsonStorage.set({ message: 'Hello World', timestamp: Date.now() });
const data = jsonStorage.get(); // {message: 'Hello World', timestamp: 1234567890}
```

### 内存存储

```typescript
import { InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// 创建内存存储（在任何环境中都能工作）
const memoryStorage = new InMemoryStorage();

// 像标准 Storage API 一样使用
memoryStorage.setItem('temp', 'data');
console.log(memoryStorage.getItem('temp')); // 'data'
console.log(memoryStorage.length); // 1
```

### 高级配置

```typescript
import { KeyStorage, InMemoryStorage } from '@ahoo-wang/fetcher-storage';

// 自定义存储和事件总线
const customStorage = new KeyStorage<string>({
  key: 'custom',
  storage: new InMemoryStorage(), // 使用内存存储而不是 localStorage
  // eventBus: customEventBus, // 自定义事件总线用于通知
});
```

## API 参考

### 环境工具

#### `isBrowser(): boolean`

检查当前环境是否为浏览器。

#### `getStorage(): Storage`

返回合适的存储实现：

- 浏览器：`window.localStorage`（带可用性检查）
- 非浏览器：`InMemoryStorage` 实例

### KeyStorage

用于管理类型化值、缓存和变更通知的存储包装器。

```typescript
new KeyStorage<T>(options: KeyStorageOptions<T>)
```

#### 选项

- `key: string` - 存储键
- `serializer?: Serializer<string, T>` - 自定义序列化器（默认：JsonSerializer）
- `storage?: Storage` - 自定义存储（默认：getStorage()）
- `eventBus?: TypedEventBus<StorageEvent<T>>` - 自定义事件总线

#### 方法

- `get(): T | null` - 获取缓存的值
- `set(value: T): void` - 设置值并缓存和通知
- `remove(): void` - 移除值并清除缓存
- `addListener(handler: EventHandler<StorageEvent<T>>): RemoveStorageListener` - 添加变更监听器

### InMemoryStorage

Storage 接口的内存实现。

```typescript
new InMemoryStorage();
```

使用 Map 实现所有标准 Storage 方法。

### 序列化器

#### `JsonSerializer`

将值序列化为 JSON 字符串。

#### `typedIdentitySerializer<T>()`

恒等序列化器，直接传递值而不修改。

## TypeScript 支持

完整的 TypeScript 支持，包括泛型和类型推断：

```typescript
// 类型化存储
const userStorage = new KeyStorage<User>({ key: 'user' });

// 类型安全操作
userStorage.set({ id: 1, name: 'John' });
const user = userStorage.get(); // User | null
```

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)
