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

- [React 数据流](https://fetcher.ahoo.me/zh/guides/react/)
- [React 参考](https://fetcher.ahoo.me/zh/reference/react)
- [交互式 Hook Story](https://fetcher.ahoo.me/storybook/)

[English](./README.md) · [许可证](../../LICENSE)

### 轻量核心入口

通用 Hook 可通过 ESM 子路径 `@ahoo-wang/fetcher-react/core` 导入，包括 `useExecutePromise`、`useQuery` 和 `useDebouncedCallback`。仅使用核心 Hook 时无需加载 HTTP、安全、存储和事件集成模块；原根入口的 ESM/UMD 导出不变。

`useExecutePromise.abort()` 会先使当前请求失效，再执行取消回调。即使数据源忽略 AbortSignal，迟到的成功或失败也不会发布；异步 onAbort 回调不会颠倒新请求的调用顺序。

根 ESM 入口与 `/core` 共用核心模块和 FullscreenContext，Provider 与 Hook 可以跨这两个 ESM 入口组合。`pnpm test:package` 验证构建产物互操作，并包含在 build 流程中。`abort()` 先摘除旧 controller 再通知同步监听器，监听器启动的新请求仍可取消。
