---
title: 构造 URL、请求头与请求体
description: 显式设置路径和查询参数，并按服务端契约选择请求体格式。
---

# 构造 URL、请求头与请求体

## 前提

使用[第一个请求](../../start/first-request.md)的 ESM TypeScript 项目并运行本地服务。用下面的完整请求替换客户端调用；夹具仅接受不带查询参数的 `/users/1`。

## 定位资源

```ts
import { Fetcher, ResultExtractors } from '@ahoo-wang/fetcher';

const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const user = await api.get<{ id: number; name: string }>(
  '/users/{id}',
  {
    urlParams: { path: { id: 1 } },
    headers: { Accept: 'application/json' },
  },
  { resultExtractor: ResultExtractors.Json },
);
console.log(user.name);
```

最终路径是 `/users/1`，输出为 `Ada`。路径值填充 URI 模板占位符。对于支持资料展开的业务端点，在 `urlParams` 中与 `path` 并列添加 `query: { include: 'profile' }`，地址会成为 `/users/1?include=profile`。查询值编码为 URL 参数。该变体需要业务服务；精确匹配的教程夹具会为它返回 404。若服务要求在查询参数中传 JSON，请显式序列化嵌套业务对象。

## 发送请求体

对于实现了 `POST /users` 并返回新用户 JSON 的业务服务，调用：

```ts
const created = await api.post<{ id: number; name: string }>(
  '/users',
  { body: { name: 'Lin' } },
  { resultExtractor: ResultExtractors.Json },
);
console.log(created.id);
```

这一步需要集成服务：本地教程服务没有创建路由。请实现该路由或使用真实 API。请求体拦截器将对象序列化为 JSON。使用 `FormData`、`Blob` 或 `URLSearchParams` 时直接作为 `body` 传入；拦截器移除显式 Content-Type，让原生传输设置正确格式或 boundary。字符串与二进制请求体不会被转换成 JSON 对象。

## 检查结果与处理失败

通过浏览器开发者工具或服务测试检查最终 URL、方法、请求头与序列化请求体。请求头按大小写不敏感的名称合并，请求级值优先；使用支持的头部输入，不要展开 `Headers` 实例。在调用处处理序列化、传输、HTTP 状态和 JSON 解析失败。POST 是写操作，结果不确定时应先确认服务端幂等契约再重试。

这些 JSON 调用不创建监听器。测试结束后停止本地夹具；通过[取消指南](./cancellation.md)停止不再需要的活动请求。

参阅[请求输入](../../reference/fetcher/requests.md)、[URL 规则](../../reference/fetcher/urls.md)与[请求生命周期](../../architecture/request-lifecycle.md)。
