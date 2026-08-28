---
title: URL、请求体与结果
description: 构建 Fetcher URL 和请求体，并选择应用真正需要的结果形态。
---

# URL、请求体与结果

## 解析 URL

Fetcher 先合并 `baseURL` 与请求 URL，再应用路径值和查询值。

```ts
const api = new Fetcher({ baseURL: 'https://api.example.com/v1' });

await api.get('/users/{id}', {
  urlParams: {
    path: { id: 'a/b' },
    query: { active: true, page: 2 },
  },
});
```

默认 URI Template Resolver 会对路径值做百分号编码。`UrlTemplateStyle.Express` 支持 `/users/:id`。缺少必填路径值时，会在发送网络请求前抛出异常。

查询值会交给 `URLSearchParams`。优先使用字符串、数字和布尔值，并确保其字符串形式属于服务端契约；嵌套值应显式序列化。

## 合并请求头与超时

客户端默认值会被复制，同名请求级值覆盖它：

```ts
const api = new Fetcher({
  headers: { Accept: 'application/json', 'X-App': 'console' },
  timeout: 5_000,
});

await api.get('/health', {
  headers: { 'X-App': 'worker' },
  timeout: 1_000,
});
```

最终请求使用 `X-App: worker` 和一秒超时。

## 发送请求体

普通对象会通过 `JSON.stringify` 编码。`FormData`、`Blob`、`URLSearchParams`、TypedArray 和 `ReadableStream` 等原生请求体类型会直接传递。

```ts
await api.post('/users', {
  body: { name: 'Ada', role: 'admin' },
});
```

GET 和 HEAD 辅助方法会在 TypeScript 边界排除 `body`。

## 选择结果

HTTP 辅助方法返回 `Response`：

```ts
const response = await api.get('/users/42');
const user = await response.json();
```

当共享客户端应该直接返回其他形态时，使用结果提取器：

```ts
import { JsonResultExtractor } from '@ahoo-wang/fetcher';

const user = await api.get<{ id: string; name: string }>(
  '/users/42',
  {},
  { resultExtractor: JsonResultExtractor },
);
```

内置提取器覆盖 Exchange、Response、JSON、文本、Blob、ArrayBuffer 和 Bytes。响应体通常只能消费一次；多个消费者读取前应先克隆。

## 校验服务端数据

泛型结果类型只表达编译期预期，不会校验 JSON。安全、金额或持久化路径必须在信任边界校验不受信任的响应数据。
