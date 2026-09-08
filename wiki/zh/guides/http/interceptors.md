---
next: false
title: 扩展请求管线
description: 在输入已就绪的阶段注册拦截器，并在所属功能结束时移除。
---

# 扩展请求管线

## 前提

运行[本地 HTTP 示例](../../examples/http.md)，理解[请求与结果提取的分界](./results.md)。拦截器操作单次请求共享的上下文 `FetchExchange`。静态请求头使用[客户端默认值](./shared-client.md)即可；每次请求动态处理才需要拦截器。

## 在调用前注册

```ts
import { Fetcher, setHeader } from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
const name = 'example-request-source';
api.interceptors.request.use({
  name,
  order: 0,
  intercept(exchange) {
    setHeader(exchange.ensureRequestHeaders(), 'X-Request-Source', 'docs');
  },
});
try {
  const response = await api.get('/users/1');
  console.log(await response.json());
} finally {
  api.interceptors.request.eject(name);
}
```

将代码保存到教程客户端文件，按现有编译命令运行。JSON 响应包含 Ada。夹具不回显请求头；通过受控 fetch 替身或服务端请求记录验证 `X-Request-Source: docs`。同名重复注册返回 false，因此应按所有者注册一次，而不是每次请求注册。

## 选择阶段

request、response 与 error 注册表分别按 `order` 升序执行。默认请求链进行请求体转换、URL 解析和 fetch。上例 order 为零，位于默认请求体转换之后、URL 解析和传输之前。不能假设 URL 已解析，也不能把序列化后的 body 换回对象却不重新处理请求体。

使用响应拦截器读取响应元数据时，不要消费之后提取器需要读取的 body。默认 HTTP 状态校验也在此阶段；若要观察拒绝状态，需要明确执行顺序。错误拦截器处理请求与响应阶段的错误。JSON 结果解析在其后执行，应在应用调用处处理提取失败。

## 失败与清理

移除一个功能时不要清空整个注册表，否则会一并移除内建传输或状态处理。像示例一样，在所有者结束时按名称 eject。拦截器抛错会导致请求失败。清除 `exchange.error` 恢复时必须提供可用响应，而且响应阶段不会重跑。核心没有通用重试策略；只实现服务契约允许的重放行为。

参阅[注册与排序](../../reference/fetcher/interceptors.md)、[请求生命周期](../../architecture/request-lifecycle.md)与[失败处理](./failures.md)。
