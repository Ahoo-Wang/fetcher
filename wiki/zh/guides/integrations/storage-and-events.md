---
next: false
title: 共享状态与事件
description: 验证本地状态与顺序投递，再按需启用浏览器标签页通知。
---

# 共享状态与事件

使用存储保存当前值，使用事件通知消费者。先运行确定性的内存检查，仅在应用确有需要时添加跨标签页投递。

安装时还需要解析该包声明的全部 peer 依赖；完整清单见[包接入前提](../../reference/storage/index.md)。以下服务路由和身份由应用提供，不由安装过程创建。

## 1. 安装并运行本地检查

安装 `@ahoo-wang/fetcher-storage` 和 `@ahoo-wang/fetcher-eventbus`，在已安装这些包的运行时调用以下函数：

```ts
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface Preferences {
  theme: 'light' | 'dark';
}

export async function checkStateAndEvents() {
  const preferences = new KeyStorage<Preferences>({
    key: 'preferences',
    storage: new InMemoryStorage(),
    defaultValue: { theme: 'light' },
  });
  const remove = preferences.addListener({
    name: 'render-preferences',
    order: 0,
    handle: event => {
      console.log(event.newValue);
    },
  });
  const saved = new SerialTypedEventBus<{ id: string }>('user-saved');
  const calls: string[] = [];
  saved.on({
    name: 'cache',
    order: 10,
    handle: () => {
      calls.push('cache');
    },
  });
  saved.on({
    name: 'toast',
    order: 20,
    once: true,
    handle: () => {
      calls.push('toast');
    },
  });
  try {
    preferences.set({ theme: 'dark' });
    if (preferences.get()?.theme !== 'dark')
      throw new Error('Storage check failed');
    await saved.emit({ id: '42' });
    await saved.emit({ id: '43' });
    if (calls.join(',') !== 'cache,toast,cache')
      throw new Error('Delivery check failed');
  } finally {
    remove();
    preferences.destroy();
    preferences.eventBus.destroy();
    saved.destroy();
  }
}
```

成功执行即验证了存储值、处理器升序调用和一次性通知。`set()` 同步写入并更新缓存，但不等待异步监听器。如需等待本地事件投递，使用 `await bus.emit()`。

## 2. 显式选择持久化方式

`InMemoryStorage` 不跨页面重载保存。浏览器 localStorage 持久化字符串，`KeyStorage` 默认以 JSON 序列化。其默认事件总线是本地的：独立创建两个存储实例不会自动组成跨标签页响应式系统。解析失败、存储访问受限和配额错误都可能抛出；由应用决定保留内存回退还是显示错误，并在相应边界处理。

## 3. 添加浏览器标签页通知

在有存储访问权限、可用跨标签页 messenger 的两个同源浏览器标签页内执行：

```ts
import { KeyStorage, type StorageEvent } from '@ahoo-wang/fetcher-storage';
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

export function watchTheme(onTheme: (theme: string) => void) {
  const bus = new BroadcastTypedEventBus({
    delegate: new SerialTypedEventBus<StorageEvent<string>>('app-theme'),
  });
  const theme = new KeyStorage<string>({
    key: 'app-theme',
    storage: localStorage,
    eventBus: bus,
    defaultValue: 'light',
  });
  const remove = theme.addListener({
    name: 'render-theme',
    order: 0,
    handle: event => {
      onTheme(event.newValue ?? 'light');
    },
  });
  onTheme(theme.get() ?? 'light');
  return {
    set: (value: 'light' | 'dark') => theme.set(value),
    dispose() {
      remove();
      theme.destroy();
      bus.destroy();
    },
  };
}
```

每个标签页调用 `const theme = watchTheme(renderTheme)`，其中 renderTheme 更新你的 UI。在其中一个标签页调用 `theme.set('dark')`，检查两边 UI。所有者卸载时调用 `theme.dispose()`。本例独占总线，不要销毁其他所有者仍在共享的总线。

两个标签页使用相同 key 和通道。存储适配器为广播值安装序列化桥接；共享总线必须只代表一个 key，并使用兼容序列化器。消息是通知，不是持久队列或冲突解决协议，也不会等待所有远端标签页确认送达。

## 失败与清理检查

处理器名称唯一，同名重复注册返回 false。处理器错误会被记录，不会阻止其他处理器。只有消费者相互独立时才使用 `ParallelTypedEventBus`，其 emit 等待本地处理器，不等待远端确认。KeyStorage 的 destroy 只移除内部监听器；应用监听器和独占总线需分别清理。销毁不会删除存储值。

参见[存储生命周期](../../reference/storage/key-storage)、[序列化与环境](../../reference/storage/serialization-and-runtime)、[事件投递](../../reference/eventbus/events-and-delivery)及[广播 messenger](../../reference/eventbus/broadcast-and-messengers)。

[keyStorage.ts:242](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/storage/src/keyStorage.ts#L242) 选择默认本地总线。

[评估集成边界](../../architecture/integration-decisions.md)；[返回本组任务](./index.md)。
