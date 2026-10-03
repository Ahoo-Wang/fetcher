---
title: 按输入驱动查询
description: 将查询作为 POST JSON 发送，并展示当前组件拥有的结果。
---

# 按输入驱动查询

## 前提

使用[可运行示例](../../examples/react.md)中的 React 安装和挂载方式。本指南增加不同的业务端点：`POST /api/users/search` 接受 `{ "name": "Ada" }`，返回 `[{ "id": "u-ada", "name": "Ada" }]` 这样的 JSON 数组。空名称返回全部用户。请实现该端点或按服务修改 URL/请求体；已有仅提供 GET 的 Storybook 夹具不支持它。

## 添加查询组件

保存以下内容为 `src/UserSearch.tsx`，按相同 React 入口方式挂载 `<UserSearch />`：

```tsx
import { useState } from 'react';
import { Fetcher } from '@ahoo-wang/fetcher';
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

const api = new Fetcher({ baseURL: '/api' });
type User = { id: string; name: string };

export function UserSearch() {
  const [query, setQuery] = useState({ name: '' });
  const search = useFetcherQuery<{ name: string }, User[]>({
    fetcher: api,
    url: '/users/search',
    query,
  });
  return (
    <section>
      <label>
        Name
        <input
          value={query.name}
          onChange={event => setQuery({ name: event.target.value })}
        />
      </label>
      <button onClick={search.abort}>Cancel</button>
      <output aria-live="polite">
        {search.loading
          ? 'Loading'
          : search.error
            ? String(search.error)
            : search.result?.map(user => user.name).join(', ')}
      </output>
    </section>
  );
}
```

`useFetcherQuery` 将查询对象作为 POST body，默认提取 JSON。它不是将查询追加到 URL 的 GET Hook。需要其他传输或服务方法时，用 `useQuery` 提供自己的执行器，并把执行器第二个 `AbortController` 参数传给实际操作。

## 验证查询变化

挂载时空名称查询加载全部用户。输入 Ada 后检查网络请求：方法 POST、URL `/api/users/search`、body `{ "name": "Ada" }`。输出应包含 Ada。延迟第一个响应再修改名称，只有最新执行可以发布结果。

查询是受控的：它保存在你的 `useState`（或 URL、父组件状态）中，内容变化时 Hook 重新执行。内容按深比较，因此每次渲染重建相等对象不会重新发送。`autoExecute` 默认 true。需要“应用”按钮时设置 `autoExecute: false`，更新查询后调用 `execute()` 发送当前查询。必需输入缺失时传入 `query: undefined`：定义之前不会发送。`undefined` 和 `autoExecute: false` 都不会取消已经运行的操作；需要时调用 `abort()`。`undefined` 是唯一的“未就绪”值；传入查询前仍要验证业务字段。

## 失败与生命周期

让应用端点返回 HTTP 500，确认输出显示 Hook 错误。非法响应 JSON 也会成为执行错误。取消或卸载会使当前执行失效；只有连接控制器的操作才会停止实际工作。结果属于组件，没有全局缓存失效或跨组件请求去重。

继续阅读[防抖](./debounce.md)、[查询参考](../../reference/react/promise-and-query-state.md)与[资源归属](../../architecture/state-and-resources.md)。
