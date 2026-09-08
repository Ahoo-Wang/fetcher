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
import { Fetcher } from '@ahoo-wang/fetcher';
import { useFetcherQuery } from '@ahoo-wang/fetcher-react';

const api = new Fetcher({ baseURL: '/api' });
type User = { id: string; name: string };

export function UserSearch() {
  const search = useFetcherQuery<{ name: string }, User[]>({
    fetcher: api,
    url: '/users/search',
    initialQuery: { name: '' },
    autoExecute: true,
  });
  return (
    <section>
      <label>
        Name
        <input
          onChange={event => search.setQuery({ name: event.target.value })}
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

`useFetcherQuery` 将查询对象作为 POST body，默认提取 JSON。它不是将查询追加到 URL 的 GET Hook。需要其他传输或服务方法时，用 `useQuery` 提供自己的执行器，并把执行器第三个 `AbortController` 参数传给实际操作。

## 验证查询变化

挂载时空名称查询加载全部用户。输入 Ada 后检查网络请求：方法 POST、URL `/api/users/search`、body `{ "name": "Ada" }`。输出应包含 Ada。延迟第一个响应再修改名称，只有最新执行可以发布结果。

`initialQuery` 提供初值。这个非受控输入方案使用 `setQuery`；若由父组件控制查询，使用受控 `query` 属性。`autoExecute` 默认 true，这里显式写出。需要“应用”按钮时设为 false，先调用 `setQuery(next)`，再调用 `execute()` 执行当前查询。初始化时 `query` 和 `initialQuery` 均未定义，才没有查询可执行。将已定义的 `query` 属性改为 `undefined` 会保留保存的查询，还可能再次触发旧查询，并不会暂停执行。暂停自动执行应设置 `autoExecute: false`；取消已经运行的操作需要另外调用 `abort()`。查询检查仅排除 `undefined`，发送前仍要验证业务字段。

## 失败与生命周期

让应用端点返回 HTTP 500，确认输出显示 Hook 错误。非法响应 JSON 也会成为执行错误。取消或卸载会使当前执行失效；只有连接控制器的操作才会停止实际工作。结果属于组件，没有全局缓存失效或跨组件请求去重。

继续阅读[防抖](./debounce.md)、[查询参考](../../reference/react/promise-and-query-state.md)与[资源归属](../../architecture/state-and-resources.md)。
