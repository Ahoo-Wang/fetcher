# `@ahoo-wang/fetcher-react`

面向 Fetcher 请求、查询状态、存储、事件、Wow 查询、CoSec 安全与数据监控的 React
Hooks。组件需要持有异步状态和取消行为时使用。

## 安装

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

按导入的集成安装对应 peer 包：EventStream、EventBus、Storage、Wow 或 CoSec。

## 示例

```tsx
import { ResultExtractors } from '@ahoo-wang/fetcher';
import { useFetcher } from '@ahoo-wang/fetcher-react';

interface User {
  id: string;
  name: string;
}

export function UserProfile({ id }: { id: string }) {
  const { loading, result, error, execute } = useFetcher<User>({
    resultExtractor: ResultExtractors.Json,
  });

  return (
    <section>
      <button
        disabled={loading}
        onClick={() => void execute({ url: `/api/users/${id}` })}
      >
        加载用户
      </button>
      {error && <p role="alert">无法加载用户</p>}
      {result && <p>{result.name}</p>}
    </section>
  );
}
```

## 按任务选择 Hook

- 异步核心：Promise 状态、执行、查询状态、防抖与最新引用。
- Fetcher：请求执行、JSON 查询、手动或防抖刷新。
- API 对象：从返回 Promise 的方法派生 execute/query Hooks。
- 状态：类型化 KeyStorage 与事件总线订阅。
- Wow：单条、列表、分页、计数与列表流查询。
- CoSec：安全 Provider、用户状态与路由守卫。
- 监控：轮询与数据变化通知。

## 文档

- [React 数据流](https://fetcher.ahoo.me/zh/learn/react-data-flow)
- [React 参考](https://fetcher.ahoo.me/zh/reference/react)
- [交互式 Hook Story](https://fetcher.ahoo.me/storybook/)

[English](./README.md) · [许可证](../../LICENSE)
