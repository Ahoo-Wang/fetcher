# `@ahoo-wang/fetcher-react`

面向 Fetcher 请求、查询状态、存储、事件与 CoSec 安全的 React Hooks。组件需要持有异步状态和取消行为时使用。

## 安装

```bash
pnpm add react react-dom @ahoo-wang/fetcher @ahoo-wang/fetcher-react
```

按导入的集成安装对应 peer 包：EventStream、EventBus、Storage 或 CoSec。

> **Wow 查询 Hook 已迁出。** `useSingleQuery`、`useListQuery`、`usePagedQuery`、
> `useCountQuery`、`useListStreamQuery` 等 Wow Hook 现在由
> [Wow 仓库](https://github.com/Ahoo-Wang/Wow/tree/main/typescript) 发布的
> `@ahoo-wang/wow-react` 提供，版本跟随 Wow。数据监控 Hook（`useDataMonitor`、
> `DataMonitorService`）随 `@ahoo-wang/fetcher-viewer` 一起退役。两者在
> `@ahoo-wang/fetcher-react` 5.x 中仍然可用。

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
- CoSec：安全 Provider、用户状态与路由守卫。

## 文档

- [React 数据流](https://fetcher.ahoo.me/zh/guides/react/)
- [React 参考](https://fetcher.ahoo.me/zh/reference/react)
- [交互式 Hook Story](https://fetcher.ahoo.me/storybook/)

[English](./README.md) · [许可证](../../LICENSE)

### 轻量核心入口

通用 Hook 可通过 ESM 子路径 `@ahoo-wang/fetcher-react/core` 导入，包括 `useExecutePromise`、`useQuery` 和 `useDebouncedCallback`。仅使用核心 Hook 时无需加载 HTTP、安全、存储和事件集成模块；原根入口的 ESM/UMD 导出不变。

Fetcher Hook（`useFetcher`、`useFetcherQuery` 及其防抖版本）也可通过 `@ahoo-wang/fetcher-react/fetcher` 导入，它的类型和模块都不加载安全、存储与事件集成——基于这些 Hook 的集成（例如 `@ahoo-wang/wow-react`）从这里导入。

`useExecutePromise.abort()` 会先使当前请求失效，再执行取消回调。即使数据源忽略 AbortSignal，迟到的成功或失败也不会发布；异步 onAbort 回调不会颠倒新请求的调用顺序。

根 ESM 入口与 `/core` 共用核心模块和 FullscreenContext，Provider 与 Hook 可以跨这两个 ESM 入口组合。`pnpm test:package` 验证构建产物互操作，并包含在 build 流程中。`abort()` 先摘除旧 controller 再通知同步监听器，监听器启动的新请求仍可取消。
