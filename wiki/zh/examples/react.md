---
title: 可运行的 React 请求样例
description: 使用真实 React Hook 状态验证 Fetcher 请求的成功、失败与取消。
---

# 可运行的 React 请求样例

此组件使用稳定的 `Fetcher` 实例和真实的 `useFetcher` Hook。它展示 Hook 的 `idle`、`loading`、`success` 与 `error` 状态；`abort()` 会让活动请求回到 `idle`，因此样例不会虚构单独的 cancelled 状态。

<<< @/../stories/docs/ReactRequests.tsx

`execute()` 解析为 `void`；数据从 `result` 读取。`reset()` 只清除状态，`abort()` 还会使活动请求失效并中止它。参阅 [Fetcher Hook 参考](../reference/react/fetcher-hooks.md)和 [React 集成任务指南](../skills/react-and-integrations.md)。

## 运行已验证的 fixture

仓库贡献者需要 Node `>=20.20.2`、pnpm `10.34.5`，并已安装仓库依赖。在仓库根目录运行：

```bash
pnpm exec vitest run --project=storybook stories/docs/ReactRequests.test.stories.tsx
```

要手动尝试相同交互，请运行 `pnpm storybook`，打开命令输出的本地地址，然后在侧栏选择 **Docs / React requests**。仓库 Storybook 就是不需要后端的可运行样例。

Storybook fixture 会拦截发往 `https://api.example.test` 的 `fetch`：`/users` 返回 Ada 与 Lin，`/error` 返回 HTTP 500，文档的 `/slow` 请求会在 2000 ms 后解析，除非 AbortSignal 已触发。其他现有 story 继续使用 fixture 的默认 80 ms。每个 story 结束后都会恢复之前的全局 `fetch`。play 测试会断言渲染出的结果或错误；取消场景还会等待超过慢响应时长，再确认被中止的请求没有发布迟到的成功结果。该 fixture 证明浏览器端状态转换，不证明它与你的 API 兼容。

## 在 Vite 应用中使用

下面的消费者设置假设已有 React + TypeScript Vite 应用。本仓库使用 Node `>=20.20.2`、pnpm `10.34.5`、Vite `^8.2.2`、TypeScript `^6.0.3` 以及 React/React DOM `^19.2.8` 验证。已发布的 Fetcher 包自身声明 Node `>=18.20.8`。

显式安装 React 包及其声明的 peer 包图：

```bash
pnpm add @ahoo-wang/fetcher@^5.0.0 \
  @ahoo-wang/fetcher-react@^5.0.0 \
  @ahoo-wang/fetcher-eventstream@^5.0.0 \
  @ahoo-wang/fetcher-eventbus@^5.0.0 \
  @ahoo-wang/fetcher-storage@^5.0.0 \
  @ahoo-wang/fetcher-wow@^5.0.0 \
  @ahoo-wang/fetcher-decorator@^5.0.0 \
  @ahoo-wang/fetcher-cosec@^5.0.0 \
  react@^19.2.8 react-dom@^19.2.8
```

本节把现有 Vite 应用接入现有 API；它不会安装或创建后端。将上面的组件复制到 `src/ReactRequests.tsx`。它默认使用 `/api` 作为基础 URL；请把该路径指向提供以下演示路由的后端，或传入其他 `baseURL`：

| 路由         | 组件使用的响应                                                                                              |
| ------------ | ----------------------------------------------------------------------------------------------------------- |
| `GET /users` | HTTP 200 JSON 数组，例如 `[{ "id": "u-ada", "name": "Ada" }]`                                               |
| `GET /error` | 任意非 2xx 响应；仓库 fixture 使用 HTTP 500 与 `{ "message": "Fixture server error" }`                      |
| `GET /slow`  | 延迟返回的 HTTP 200 JSON 对象，例如 `{ "status": "completed" }`；如果服务端也要停止工作，它必须观察请求取消 |

然后把 Vite 入口文件 `src/main.tsx` 替换为：

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ReactRequests } from './ReactRequests';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReactRequests />
  </StrictMode>,
);
```

保留 Vite 生成的 `index.html`，运行 `pnpm dev` 并打开它输出的地址。只有底层操作观察 AbortSignal 时，取消才能停止浏览器端工作；它不能回滚服务端已经应用的请求。
