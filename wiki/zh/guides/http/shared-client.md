---
title: 复用共享 HTTP 客户端
description: 配置可复用的服务地址、请求头和超时，并明确身份状态归属。
---

# 复用共享 HTTP 客户端

## 前提

完成[安装](../../start/installation.md)，启动 [HTTP 示例](../../examples/http.md)的服务。它通过 `GET /users/1` 返回 JSON `{ "id": 1, "name": "Ada" }`。运行环境需要支持 Fetch；核心包不依赖 React 或平台服务。

## 创建并复用客户端

在应用的 `api.ts` 中导出供相同配置调用复用的客户端：

```ts
import { Fetcher } from '@ahoo-wang/fetcher';

export const api = new Fetcher({
  baseURL: 'http://127.0.0.1:8787',
  headers: { Accept: 'application/json' },
  timeout: 5_000,
});
```

在服务模块导入 `api`，调用 `await api.get('/users/1')`，再对返回的 `Response` 执行 `await response.json()`，或显式选择 [JSON 提取器](./results.md)。结果应包含 Ada。第二次调用复用配置，但会创建新 exchange 并再次发送 HTTP 请求。

上线前换成应用 API 地址。浏览器跨域请求需要服务端 CORS 配置；HTTPS 页面不能任意访问 HTTP API。不要向不可信地址发送认证头。

## 按所有者设置默认值

请求头覆盖同名客户端头；请求级超时覆盖客户端超时。稳定的应用配置放在客户端，每次调用特有的参数放在请求中。可变默认值不提供身份隔离：服务端应使用请求或会话范围的客户端，或显式设置每次请求的授权头，不要为每个进入的用户修改全局客户端 token。

共享客户端不是共享响应缓存。这里没有自动跨请求去重或通用重试。

## 失败与清理

在能够展示或报告错误的应用边界捕获拒绝。示例请求全部结束后，用 Ctrl+C 关闭本地夹具。这里没有客户端连接池销毁 API；停用客户端前由资源所有者[取消活动请求](./cancellation.md)。若功能在长生命周期客户端上注册了自定义拦截器，结束时移除自己拥有的注册。

继续阅读[构造请求](./requests.md)、[客户端参考](../../reference/fetcher/client.md)和[状态归属](../../architecture/state-and-resources.md)。
