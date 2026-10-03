---
title: 为输入驱动请求防抖
description: 延后变化输入的执行，并区分等待中的调度与活动请求。
---

# 为输入驱动请求防抖

## 前提

完成[查询指南](./queries.md)，包括 `POST /api/users/search` 的服务契约与 React 消费者环境。防抖在输入变化期间推迟执行，不会缓存以前的搜索结果。每次按键都不需要发请求时使用它。

## 替换立即执行的查询

将以下完整替代组件保存为 `src/DebouncedUserSearch.tsx`，挂载 `<DebouncedUserSearch />` 替换 `UserSearch`：

```tsx
import { useState } from 'react';
import { Fetcher } from '@ahoo-wang/fetcher';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';

const api = new Fetcher({ baseURL: '/api' });
type User = { id: string; name: string };

export function DebouncedUserSearch() {
  const [query, setQuery] = useState({ name: '' });
  const search = useDebouncedFetcherQuery<{ name: string }, User[]>({
    fetcher: api,
    url: '/users/search',
    query,
    debounce: { delay: 300 },
  });
  return (
    <section>
      <label>
        Name
        <input
          value={query.name}
          onChange={event => setQuery({ name: event.target.value })}
          onKeyDown={event => {
            if (event.key === 'Enter') search.flush();
          }}
        />
      </label>
      <button onClick={search.abort}>Stop</button>
      <output aria-live="polite">
        {search.pending
          ? 'Waiting'
          : search.loading
            ? 'Loading'
            : search.error
              ? String(search.error)
              : search.result?.map(user => user.name).join(', ')}
      </output>
    </section>
  );
}
```

该 Hook 防抖的是查询值而不是调用：首个查询立即发送，之后的变化在查询停止变化 300 ms 后应用。有变化等待时 `pending` 为 true；`flush()` 立即应用它（上例中的回车）；`execute()` 重新发送已应用的查询。`leading` 默认 false，`trailing` 默认 true。这里显式设置延迟，应根据交互需求选择。

## 验证请求减少与最终输入

清空网络记录，快速输入 Ada，等待超过 300 ms 加响应耗时。最后一个请求体应包含 `name: 'Ada'`，结果显示 Ada。挂载时会执行初始空查询，应与输入期间的请求区分。使用该 trailing 配置时，同一轮快速输入的中间按键不会各自发请求。

输入 Ada 并在 300 ms 内按回车：请求立即开始。HTTP 延迟请求期间点击 Stop，确认没有晚到结果。`abort()` 取消活动执行；它不会丢弃等待中的变化，该变化仍会在延迟后应用。要丢弃等待中的变化，把查询改回已应用的值。`pending` 是描述防抖的渲染值，不是网络工作的 loading 状态。

## 失败与清理

HTTP 和 JSON 错误与立即查询一样进入 Hook 状态。新应用的查询在其执行开始时才会取消前一次执行；不能假设第一次按键立即取消已在运行的请求。卸载会取消等待中的调度与拥有的执行。防抖延迟不是请求超时，也不是服务端限流。

参阅[防抖契约](../../reference/react/debounce.md)、[清理资源](./cleanup.md)与[状态归属](../../architecture/state-and-resources.md)。
