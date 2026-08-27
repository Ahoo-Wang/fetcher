---
title: 共享状态与事件
description: 使用 Fetcher 包存储类型值，并协调串行、并行和跨标签页任务。
---

# 共享状态与事件

持久或当前值使用存储，瞬时通知使用事件总线。不要把事件总线当作隐式数据库。

## 存储类型值

```ts
import { InMemoryStorage, KeyStorage } from '@ahoo-wang/fetcher-storage';

interface Preferences {
  theme: 'light' | 'dark';
}

const preferences = new KeyStorage<Preferences>({
  key: 'preferences',
  storage: new InMemoryStorage(),
  defaultValue: { theme: 'light' },
});

const removeListener = preferences.addListener({
  name: 'render-preferences',
  order: 0,
  handle: event => console.log(event.newValue),
});

preferences.set({ theme: 'dark' });
console.log(preferences.get()); // { theme: 'dark' }

removeListener();
preferences.destroy();
```

`KeyStorage` 默认以 JSON 序列化，缓存反序列化结果，并通过存储事件使缓存失效。测试或非持久状态使用 `InMemoryStorage`；默认存储由当前环境选择。

## 按顺序运行处理器

```ts
import { SerialTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

interface UserSaved {
  id: string;
}

const saved = new SerialTypedEventBus<UserSaved>('user-saved');

saved.on({
  name: 'cache',
  order: 10,
  handle: event => console.log('cache', event.id),
});
saved.on({
  name: 'toast',
  order: 20,
  once: true,
  handle: event => console.log('toast', event.id),
});

await saved.emit({ id: '42' });
saved.destroy();
```

串行处理器按 Order 升序运行。`once` 处理器运行后会被移除，处理器名称必须唯一。

## 并发运行独立处理器

只有处理器不依赖彼此副作用时才使用 `ParallelTypedEventBus`：

```ts
import { ParallelTypedEventBus } from '@ahoo-wang/fetcher-eventbus';

const bus = new ParallelTypedEventBus<UserSaved>('user-saved');
```

`emit()` 会等待所有处理器。处理器失败由实现记录，不会阻止无关处理器。

## 跨标签页广播

包装一个本地总线：

```ts
import {
  BroadcastTypedEventBus,
  SerialTypedEventBus,
} from '@ahoo-wang/fetcher-eventbus';

const local = new SerialTypedEventBus<UserSaved>('user-saved');
const broadcast = new BroadcastTypedEventBus({ delegate: local });

broadcast.on({
  name: 'refresh-user',
  order: 0,
  handle: event => console.log(event.id),
});

await broadcast.emit({ id: '42' });
broadcast.destroy();
```

事件必须能被选定 Messenger 安全地结构化克隆/序列化。`destroy()` 会关闭跨标签页通信，应在所有者卸载或关闭时调用。

## 选择最小工具

- 单模块拥有值：普通变量可能已经足够。
- 值需要跨刷新：使用浏览器存储支持的 `KeyStorage`。
- 多个本地消费者响应瞬时事件：使用串行总线。
- 消费者独立且耗时：考虑并行总线。
- 其他标签页也要响应：使用广播总线并显式清理。
