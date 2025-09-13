# @ahoo-wang/fetcher-react

Fetcher 生态的 React 集成包。提供 React Hooks 和组件，实现无缝的数据获取，支持自动重新渲染和加载状态。

[![npm version](https://img.shields.io/npm/v/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Build Status](https://github.com/Ahoo-Wang/fetcher/actions/workflows/ci.yml/badge.svg)](https://github.com/Ahoo-Wang/fetcher/actions)
[![codecov](https://codecov.io/gh/Ahoo-Wang/fetcher/graph/badge.svg?token=JGiWZ52CvJ)](https://codecov.io/gh/Ahoo-Wang/fetcher)
[![License](https://img.shields.io/npm/l/@ahoo-wang/fetcher-react.svg)](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)
[![npm downloads](https://img.shields.io/npm/dm/@ahoo-wang/fetcher-react.svg)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/%40ahoo-wang%2Ffetcher-react)](https://www.npmjs.com/package/@ahoo-wang/fetcher-react)
[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/Ahoo-Wang/fetcher)

## 功能特性

- 🔄 **React Hooks**: 提供 React hooks 与 Fetcher 无缝集成
- 📦 **轻量级**: 仅 3KiB min+gzip
- 🌐 **TypeScript 支持**: 完整的 TypeScript 支持和全面的类型定义
- 🚀 **现代化**: 使用现代 React 模式和最佳实践构建
- 🧠 **智能缓存**: 内置缓存和自动重新验证
- 📡 **实时更新**: 数据变化时自动更新

## 安装

```bash
npm install @ahoo-wang/fetcher-react
```

## 使用方法

### useKeyStorage Hook

`useKeyStorage` hook 为 KeyStorage 实例提供状态管理。它订阅存储变化并返回当前值以及设置值的函数。

```typescript
import { useKeyStorage } from '@ahoo-wang/fetcher-react/storage';
import { KeyStorage } from '@ahoo-wang/fetcher-storage';

const MyComponent = () => {
  const keyStorage = new KeyStorage<string>({
    key: 'my-key'
  });

  const [value, setValue] = useKeyStorage(keyStorage);

  return (
    <div>
      <p>当前值
:
  {
    value
  }
  </p>
  < button
  onClick = {()
=>
  setValue('new value')
}>
  更新值
  < /button>
  < /div>
)
  ;
};
```

### 更多示例

```typescript
// 处理不同类型的值
const numberStorage = new KeyStorage<number>({ key: 'counter' });
const [count, setCount] = useKeyStorage(numberStorage);

// 处理对象
interface User {
  id: string;
  name: string;
}

const userStorage = new KeyStorage<User>({ key: 'current-user' });
const [user, setUser] = useKeyStorage(userStorage);
```

## API 参考

### useKeyStorage

```typescript
function useKeyStorage<T>(keyStorage: KeyStorage<T>): [T | null, (value: T) => void]
```

为 KeyStorage 实例提供状态管理的 React hook。

**参数:**

- `keyStorage`: 要订阅和管理的 KeyStorage 实例

**返回值:**

- 包含当前存储值和更新函数的元组

## 许可证

[Apache 2.0](https://github.com/Ahoo-Wang/fetcher/blob/main/LICENSE)