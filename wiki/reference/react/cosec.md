---
title: 'Security hooks and route guards'
description: 'Security hooks and route guards — @ahoo-wang/fetcher-react 5.0.0'
---

# Security hooks and route guards

`SecurityProvider` requires an existing `TokenStorage` and children, then makes `useSecurity` state available through context. Token creation/refresh belongs to CoSec; a route guard only decides which React node to render and is not a server authorization boundary.

| API                                       | Contract                                                                                                                                                                                |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useSecurity(tokenStorage, options = {})` | Returns currentUser, authenticated, signIn, signOut; missing token uses `ANONYMOUS_USER` (sub anonymous, empty jti, zero iat/exp).                                                      |
| `signIn(tokenOrAsyncProvider)`            | Await provider if supplied, store token, invoke onSignIn. Returns Promise&lt;void&gt;; provider/storage/callback failures propagate.                                                    |
| `signOut()`                               | Remove token and invoke onSignOut; synchronous exceptions propagate.                                                                                                                    |
| `useSecurityContext()`                    | Returns context; throws outside SecurityProvider.                                                                                                                                       |
| `RouteGuard`                              | Authenticated: children. Otherwise calls onUnauthorized and returns fallback (omitted renders nothing).                                                                                 |
| `RefreshableRouteGuard`                   | Requires tokenManager. Refreshes when isRefreshNeeded and isRefreshable; authenticated children win, otherwise refreshing node or fallback. Default refreshing text is `Refreshing...`. |

`RouteGuard.onUnauthorized` runs during render and can run repeatedly; it is not an effect-based navigation callback. Avoid setting unrelated React state or sending requests from it. `RefreshableRouteGuard` logs refresh errors; it does not expose a local error state or cancel the token manager on unmount. The manager and storage remain application-owned. Context updates follow storage subscriptions, not an independent timer that recomputes authentication every second. Switching tokenStorage changes subscription and action targets; callbacks read latest options.

## Complete example

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

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./index#public-symbols). Runtime defaults and failure behavior are described above.

### SecurityProvider {#api-SecurityProvider}

```ts
export function SecurityProvider({
  tokenStorage,
  children,
  ...useSecurityOptions
}: SecurityContextOptions): import('react').JSX.Element;
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
  options: UseSecurityOptions = {},
): UseSecurityReturn;
```

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

```ts
export function RouteGuard({
  children,
  fallback,
  onUnauthorized,
}: RouteGuardProps):
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
export function RefreshableRouteGuard({
  children,
  fallback,
  refreshing,
  tokenManager,
}: RefreshableRouteGuardProps): import('react').JSX.Element;
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

## Related topics

[Fetcher hooks](./fetcher-hooks) · [Promise and query state](./promise-and-query-state) · [API hook factories](./api-hooks) · [Debounced execution](./debounce) · [Storage and event subscriptions](./storage-and-events) · [Wow query hooks](./wow) · [Monitoring, refs and fullscreen](./monitoring-and-utilities)
