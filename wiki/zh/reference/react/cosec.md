---
title: '安全 Hook 与路由守卫'
description: '安全 Hook 与路由守卫 — @ahoo-wang/fetcher-react 5.0.0'
---

# 安全 Hook 与路由守卫

`SecurityProvider` 要求现有 `TokenStorage` 和 children，通过 context 提供 `useSecurity` 状态。令牌创建/刷新由 CoSec 负责；路由守卫仅决定渲染哪个 React 节点，不是服务端授权边界。

| API                                       | 契约                                                                                                                                                         |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `useSecurity(tokenStorage, options = {})` | 返回 currentUser、authenticated、signIn、signOut；无令牌使用 `ANONYMOUS_USER`，其 sub 为 anonymous、jti 为空、iat/exp 为零。                                 |
| `signIn(tokenOrAsyncProvider)`            | 如有 provider 则等待，存储令牌，再调用 onSignIn；返回 Promise&lt;void&gt;，provider/存储/回调失败会传播。                                                    |
| `signOut()`                               | 删除令牌并调用 onSignOut；同步异常传播。                                                                                                                     |
| `useSecurityContext()`                    | 返回上下文，在 SecurityProvider 外抛错。                                                                                                                     |
| `RouteGuard`                              | 已认证渲染 children；否则调用 onUnauthorized 并返回 fallback，省略则无内容。                                                                                 |
| `RefreshableRouteGuard`                   | 必填 tokenManager；isRefreshNeeded 和 isRefreshable 同时成立时刷新。已认证优先渲染 children，否则显示 refreshing 节点或 fallback，默认文字 `Refreshing...`。 |

`RouteGuard.onUnauthorized` 在 render 中运行且可能重复，不是基于 effect 的导航回调；不要用它更新其他 React 状态或发请求。`RefreshableRouteGuard` 仅记录刷新失败，不暴露本地错误状态，也不在卸载时取消 token manager；manager 和 storage 仍归应用所有。context 随存储订阅更新，没有独立每秒重算认证状态的定时器。切换 tokenStorage 会更换订阅和操作目标；回调读取最新 options。

## 完整示例

```tsx
import type { TokenStorage } from '@ahoo-wang/fetcher-cosec';
import {
  SecurityProvider,
  RouteGuard,
  useSecurityContext,
} from '@ahoo-wang/fetcher-react';
function Account() {
  const { currentUser, signOut } = useSecurityContext();
  return <button onClick={signOut}>Sign out {currentUser.sub}</button>;
}
export function SecureApp({ storage }: { storage: TokenStorage }) {
  return (
    <SecurityProvider tokenStorage={storage}>
      <RouteGuard fallback={<p>Please sign in.</p>}>
        <Account />
      </RouteGuard>
    </SecurityProvider>
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

### SecurityProvider {#api-SecurityProvider}

```ts
export function SecurityProvider(
  options: SecurityContextOptions,
): import('react').JSX.Element;
```

[packages/react/src/cosec/SecurityContext.tsx:107](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L107)

### useSecurityContext {#api-useSecurityContext}

```ts
export function useSecurityContext(): SecurityContextValue;
```

[packages/react/src/cosec/SecurityContext.tsx:146](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L146)

### SecurityContextValue {#api-SecurityContextValue}

```ts
export type SecurityContextValue = UseSecurityReturn;
```

[packages/react/src/cosec/SecurityContext.tsx:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L30)

### SecurityContext {#api-SecurityContext}

```ts
declare const SecurityContext: import('react').Context<
  UseSecurityReturn | undefined
>;
```

[packages/react/src/cosec/SecurityContext.tsx:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L41)

### SecurityContextOptions {#api-SecurityContextOptions}

```ts
export interface SecurityContextOptions extends UseSecurityOptions {
  tokenStorage: TokenStorage;
  children: ReactNode;
}
```

[packages/react/src/cosec/SecurityContext.tsx:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/SecurityContext.tsx#L49)

### useSecurity {#api-useSecurity}

```ts
export function useSecurity(
  tokenStorage: TokenStorage,
  options?: UseSecurityOptions,
): UseSecurityReturn;
```

实现默认值: `options = {}`.

[packages/react/src/cosec/useSecurity.ts:150](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/useSecurity.ts#L150)

### ANONYMOUS_USER {#api-ANONYMOUS_USER}

```ts
declare const ANONYMOUS_USER: CoSecJwtPayload;
```

[packages/react/src/cosec/useSecurity.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/useSecurity.ts#L29)

### UseSecurityOptions {#api-UseSecurityOptions}

```ts
export interface UseSecurityOptions {
  onSignIn?: () => void;
  onSignOut?: () => void;
}
```

[packages/react/src/cosec/useSecurity.ts:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/useSecurity.ts#L39)

### UseSecurityReturn {#api-UseSecurityReturn}

```ts
export interface UseSecurityReturn {
  currentUser: CoSecJwtPayload;
  authenticated: boolean;
  signIn: (compositeTokenProvider: CompositeTokenProvider) => Promise<void>;
  signOut: () => void;
}
```

[packages/react/src/cosec/useSecurity.ts:56](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/useSecurity.ts#L56)

### RouteGuard {#api-RouteGuard}

::: details 展开完整字段与成员

```ts
export function RouteGuard(
  options: RouteGuardProps,
):
  | string
  | number
  | bigint
  | boolean
  | import('react').JSX.Element
  | Iterable<ReactNode>
  | Promise<
      | string
      | number
      | bigint
      | boolean
      | import('react').ReactPortal
      | import('react').ReactElement<
          unknown,
          string | import('react').JSXElementConstructor<any>
        >
      | Iterable<ReactNode>
      | null
      | undefined
    >
  | null
  | undefined;
```

:::

[packages/react/src/cosec/RouteGuard.tsx:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/RouteGuard.tsx#L66)

### RouteGuardProps {#api-RouteGuardProps}

```ts
export interface RouteGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  onUnauthorized?: () => void;
}
```

[packages/react/src/cosec/RouteGuard.tsx:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/RouteGuard.tsx#L20)

### RefreshableRouteGuard {#api-RefreshableRouteGuard}

```ts
export function RefreshableRouteGuard(
  options: RefreshableRouteGuardProps,
): import('react').JSX.Element;
```

[packages/react/src/cosec/RefreshableRouteGuard.tsx:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/RefreshableRouteGuard.tsx#L28)

### RefreshableRouteGuardProps {#api-RefreshableRouteGuardProps}

```ts
export interface RefreshableRouteGuardProps extends Omit<
  RouteGuardProps,
  'onUnauthorized'
> {
  refreshing?: ReactNode;
  tokenManager: JwtTokenManager;
}
```

[packages/react/src/cosec/RefreshableRouteGuard.tsx:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/react/src/cosec/RefreshableRouteGuard.tsx#L20)

## 相关专题

[Fetcher 请求 Hook](./fetcher-hooks) · [Promise 与查询状态](./promise-and-query-state) · [API Hook 工厂](./api-hooks) · [防抖执行](./debounce) · [存储与事件订阅](./storage-and-events) · [Wow 查询 Hook](./wow) · [监控、ref 与全屏](./monitoring-and-utilities)
