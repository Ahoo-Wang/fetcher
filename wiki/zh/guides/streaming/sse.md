---
title: 读取并关闭事件流
description: 读取并关闭事件流 — Fetcher
---

# 读取并关闭事件流

SSE 响应在事件到达期间保持打开。HTTP 获取、帧解析、JSON 转换和消费者清理是不同职责。

## 前提与端点

在已有的浏览器 TypeScript 应用中安装 `@ahoo-wang/fetcher-eventstream@^5.0.0` 及其 peer `@ahoo-wang/fetcher@^5.0.0`。应用打包器需要能够从 HTML 加载 `src/main.ts`；运行环境需要 Fetch、Response body 和 ReadableStream。以下提供完整消费函数与浏览器入口。导入模块不会启动长流，入口显式调用函数后继续执行。

应用必须提供 `GET /events`，返回 HTTP 200、`Content-Type: text/event-stream`，随后输出这些完整帧（包括空行）：

```text
data: {"value":"Hello"}

data: [DONE]

```

服务端应在事件可用时及时 flush。该路由不属于本地 HTTP 教程夹具。Node 中向函数传入绝对服务 URL，并按[安装](../../start/installation.md)中的 ESM 设置编译；下方 DOM 入口仅用于浏览器。

## 导出消费函数

保存为 `src/events.ts`。调用者传入自己的 signal，并通过回调接收文本；HTTP、JSON 和流读取失败会拒绝返回的 Promise。

```ts
import '@ahoo-wang/fetcher-eventstream';
import { toJsonServerSentEventStream } from '@ahoo-wang/fetcher-eventstream';

interface Token {
  value: string;
}

export async function consumeEvents(
  url: string,
  signal: AbortSignal,
  onToken: (value: string) => void,
): Promise<void> {
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const raw = response.eventStream();
  if (!raw) throw new Error('Missing response body');
  const events = toJsonServerSentEventStream<Token>(
    raw,
    event => event.data === '[DONE]',
  );
  for await (const event of events) onToken(event.data.value);
}
```

导入会注册 Response 助手。终止标记在 JSON 解析前检查，`[DONE]` 不交给 `onToken`。正常结束或读取失败会释放迭代读取器的锁；回调抛错导致提前退出时，迭代器也会取消读取器。`Token` 静态类型不验证事件数据。

## 由浏览器入口启动、停止并处理失败

在应用 `index.html` 的 body 中放入以下元素，使用它作为该示例的模块入口（若已有入口 script，应替换它，不要重复加载）：

```html
<button id="stop" type="button">Stop</button>
<output id="events" aria-live="polite"></output>
<script type="module" src="/src/main.ts"></script>
```

保存为 `src/main.ts`。入口先连接 Stop 与页面离开动作，再以非阻塞方式启动一次消费。控制器属于入口，不隐藏在消费模块内。

```ts
import { consumeEvents } from './events';

const stop = document.querySelector<HTMLButtonElement>('#stop');
const output = document.querySelector<HTMLOutputElement>('#events');
if (!stop || !output) throw new Error('Missing Stop button or events output');

const controller = new AbortController();
stop.addEventListener('click', () => controller.abort(), {
  signal: controller.signal,
});
window.addEventListener('pagehide', () => controller.abort(), {
  once: true,
  signal: controller.signal,
});

void consumeEvents('/events', controller.signal, value => {
  output.textContent += value;
})
  .catch(error => {
    output.textContent = controller.signal.aborted
      ? 'Cancelled'
      : `Error: ${error instanceof Error ? error.message : String(error)}`;
  })
  .finally(() => {
    controller.abort();
    stop.disabled = true;
  });
```

启动现有应用开发服务器并打开页面。上述有限输入会显示 `Hello`，正常结束后 Stop 禁用。若服务保持流打开且暂不发送新事件，入口依然可以继续执行，点击 Stop 应使输出显示 `Cancelled`。重新加载页面会创建新的控制器并开始另一次消费。

## 结果、错误与清理

入口的 catch 同时处理最初 HTTP 获取失败和之后的 JSON／流读取失败；例如把某个 data 改为非法 JSON，应显示 Error。finally 在成功、失败或取消后终止本次控制器，清理用其 signal 注册的按钮与 pagehide 监听器，并禁用已结束的 Stop 按钮。页面离开也会主动 abort。不要在模块顶层 await 整段长流，否则静态导入它的入口会等待模块求值结束。

流停滞时检查服务端是否为每个事件发送了空行。不要对同一已消费 body 再次调用 eventStream。仅用内存 Response 检查 Hello/DONE 可以验证解析，但不能证明网络取消；取消检查需要让受控传输观察传入的 signal，并使等待中的读取结束。这里没有自动重连、去重或通用重试。

详见 [SSE 管线](../../reference/eventstream/sse-pipeline.md)、[JSON 结果](../../reference/eventstream/json-and-results.md)、[取消](../../reference/eventstream/consumption-and-cancellation.md)和[集成边界](../../architecture/integration-decisions.md)。
