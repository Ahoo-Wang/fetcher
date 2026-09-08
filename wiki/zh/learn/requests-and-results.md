---
title: 构造请求并选择结果
description: 构造请求并选择结果 — Fetcher
---

# 构造请求并选择结果

构造请求时要明确三件事：请求地址、发送的数据，以及调用者得到的结果。明确这三个边界，服务函数才有稳定的契约。

## 定位资源

```ts
import { Fetcher, JsonResultExtractor } from '@ahoo-wang/fetcher';

const api = new Fetcher({ baseURL: 'https://api.example.com', timeout: 5_000 });
interface User {
  id: string;
  name: string;
}
const user = await api.get<User>(
  '/users/{id}',
  {
    urlParams: { path: { id: '42' }, query: { include: 'profile' } },
  },
  { resultExtractor: JsonResultExtractor },
);
console.log(user.name);
```

`urlParams.path` 填充 URI 模板，`urlParams.query` 编码为查询参数。示例对应 `/users/42?include=profile`。嵌套业务对象应显式序列化，不要依赖对象的默认字符串形式。详见 [URL 规则](../reference/fetcher/urls.md)。

## 发送数据

```ts
import { Fetcher } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'https://api.example.com' });
await api.post('/users', { body: { name: 'Ada' } });
```

请求体拦截器序列化普通对象；FormData、Blob 等原生请求体遵循各自的传输规则。头部合并时请求级值优先；使用受支持的 Headers 输入，不要将 Headers 实例展开成普通对象。详见[请求参考](../reference/fetcher/requests.md)。

## 选择返回契约

| 入口                   | 默认结果      | 适用场景                             |
| ---------------------- | ------------- | ------------------------------------ |
| get、post 等 HTTP 方法 | Response      | 需要状态码、响应头或原生 body 读取器 |
| request                | FetchExchange | 需要完整管线上下文                   |
| 显式结果提取器         | 提取后的值    | 调用者只需要 JSON、文本或指定结构    |

响应体读取一次；多个消费者需要在读取前 clone。JSON 泛型表达静态预期，不验证数据。解析发生在传输之后，即使 HTTP 成功也可能抛错。

下一步：[错误与超时](./interceptors-errors-timeouts.md)，然后理解[请求生命周期](./request-lifecycle.md)。
