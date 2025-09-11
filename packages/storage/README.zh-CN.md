# @ahoo-wang/fetcher-storage

一个轻量级的跨环境存储库，具有变更事件监听功能。为浏览器 localStorage/sessionStorage 和内存存储提供一致的 API，并支持变更通知。

[![NPM version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-storage.svg?style=flat-square)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![NPM downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-storage.svg?style=flat-square)](https://www.npmjs.com/package/@ahoo-wang/fetcher-storage)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-storage.svg?style=flat-square)](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)

## 特性

- 🌐 跨环境支持（浏览器和 Node.js）
- 📦 超轻量级（~1KB gzip）
- 🔔 存储变更事件监听
- 🔄 自动环境检测
- 🛠️ 基于键的存储和缓存
- 🔧 自定义序列化支持
- 📝 TypeScript 支持

## 安装

```bash
npm install @ahoo-wang/fetcher-storage
```

## 使用方法

### 基本用法

```typescript
import { createListenableStorage } from '@ahoo-wang/fetcher-storage';

// 自动选择合适的存储实现
const storage = createListenableStorage();

// 像使用常规 Storage API 一样使用
storage.setItem('key', 'value');
const value = storage.getItem('key');

// 监听存储变更
const removeListener = storage.addListener((event) => {
  console.log('存储变更:', event);
});

// 不再需要时移除监听器
removeListener();
```

### 基于键的存储和缓存

```typescript
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

// 为特定键创建存储
const userStorage = new KeyStorage<{ name: string, age: number }>({
  key: 'user'
});

// 设置和获取值
userStorage.set({ name: 'John', age: 30 });
const user = userStorage.get(); // {name: 'John', age: 30}

// 监听此特定键的变更
const removeListener = userStorage.addListener((event) => {
  console.log('用户变更:', event.newValue);
});
```

### 自定义序列化

```typescript
import { KeyStorage, JsonSerializer } from '@ahoo-wang/fetcher-storage';

const jsonStorage = new KeyStorage<any>({
  key: 'data',
  serializer: new JsonSerializer()
});

jsonStorage.set({ message: 'Hello World' });
const data = jsonStorage.get(); // {message: 'Hello World'}
```

### 环境特定的存储

```typescript
import { BrowserListenableStorage, InMemoryListenableStorage } from '@ahoo-wang/fetcher-storage';

// 浏览器存储（包装 localStorage 或 sessionStorage）
const browserStorage = new BrowserListenableStorage(localStorage);

// 内存存储（在任何环境中都能工作）
const memoryStorage = new InMemoryListenableStorage();
```

## API

### createListenableStorage()

工厂函数，根据环境自动返回合适的存储实现：

- 浏览器环境：包装 localStorage 的 `BrowserListenableStorage`
- 非浏览器环境：`InMemoryListenableStorage`

### ListenableStorage

扩展了原生 `Storage` 接口，增加了事件监听功能：

- `addListener(listener: StorageListener): RemoveStorageListener`
- 所有标准 `Storage` 方法（`getItem`、`setItem`、`removeItem` 等）

### KeyStorage

用于管理与特定键关联的单个值的存储包装器：

- 自动缓存和缓存失效
- 键特定的事件监听
- 自定义序列化支持

### 序列化器

- `JsonSerializer`：将值序列化为 JSON 字符串
- `IdentitySerializer`：不进行修改直接传递值

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/master/LICENSE)