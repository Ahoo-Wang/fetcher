---
title: 处理 HTTP、传输与解析失败
description: 保留 exchange 上下文，并在应用边界处理结果提取失败。
---

# 处理 HTTP、传输与解析失败

## 前提

启动 [HTTP 示例](../../examples/http.md)中的本地服务；`/missing` 返回 HTTP 404。先用这个确定性失败验证处理方式，再排查外部服务。

## 保留原因与响应

```ts
import {
  ExchangeError,
  Fetcher,
  HttpStatusValidationError,
} from '@ahoo-wang/fetcher';
const api = new Fetcher({ baseURL: 'http://127.0.0.1:8787' });
try {
  await api.get('/missing');
} catch (error) {
  if (error instanceof ExchangeError) {
    if (error.cause instanceof HttpStatusValidationError) {
      console.error('HTTP', error.exchange.response?.status);
    } else {
      console.error('Transport or pipeline failure', error.cause);
    }
  } else {
    throw error;
  }
}
```

将代码保存到首次请求的客户端文件，执行相同编译和运行命令。预期输出 `HTTP 404`。默认状态校验接受 200–299；原生 fetch 返回了响应，不代表 Fetcher 将所有状态视为成功。

## 判断失败所属层

| 观察                                      | 下一步                                                 |
| ----------------------------------------- | ------------------------------------------------------ |
| `ExchangeError` 的 cause 是 HTTP 状态错误 | 检查状态与服务契约，区分认证、权限、资源缺失与服务故障 |
| `ExchangeError` 没有响应                  | 检查网络、DNS、TLS、CORS 或取消，查看 `cause`          |
| `cause` 是 `FetchTimeoutError`            | 检查请求截止时间与[超时归属](./cancellation.md)        |
| JSON 或自定义提取期间拒绝                 | 检查实际响应内容与提取逻辑，不一定是 `ExchangeError`   |
| HTTP 成功但业务结果失败                   | 按应用业务结果规则处理                                 |

复现传输失败时，停止本地服务再请求 `/users/1`；应得到没有 HTTP 响应的拒绝。解析失败需要受控服务返回 HTTP 200 和非法 JSON，再选择 Json；教程夹具没有该路由。围绕提取 await 捕获，因为解析在错误拦截器阶段之外。

## 明确恢复策略并清理

显示应用错误状态，为可安全重复的操作提供手动重试。核心 Fetcher 没有安装通用重试循环。结果不确定的写操作可能已经生效，请求 ID 和幂等规则必须来自服务契约。错误拦截器可以清除 `exchange.error` 恢复，但必须提供有效响应；响应阶段不会自动再次执行。错误拦截器自己抛出的异常也可能直接逃出。

记录 exchange 时不要泄露 token 或敏感请求体。页面或任务结束时取消活动请求，验证结束后停止本地夹具。

参阅[错误类型](../../reference/fetcher/errors-and-cancellation.md)、[拦截器](./interceptors.md)与[失败边界](../../architecture/failure-model.md)。
