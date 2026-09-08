---
title: 创建声明式服务
description: 定义、调用并验证带显式请求绑定的装饰器服务。
---

# 创建声明式服务

适用于具有稳定 HTTP 契约和具名操作的服务。本流程创建读取、创建两个方法，再检查它们真正产生的 HTTP 请求。

## 1. 准备编译器和服务端

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator reflect-metadata
```

使用 TypeScript 旧式装饰器编译；仅剥离类型的工具链不能执行参数装饰器。在定义服务前导入 `reflect-metadata`，并将这些选项合并到应用 tsconfig：

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "strict": true
  }
}
```

示例要求应用提供 `GET /users/{id}?include=profile` 和 `POST /users`，两者均返回 JSON `{ id, name }`。请替换示例域名；这些是应用接口，不是 Fetcher 自带端点。

## 2. 定义并调用两个操作

```ts
import 'reflect-metadata';
import { Fetcher, ExchangeError } from '@ahoo-wang/fetcher';
import {
  api,
  body,
  get,
  path,
  post,
  query,
} from '@ahoo-wang/fetcher-decorator';

interface User {
  id: string;
  name: string;
}
const transport = new Fetcher({ baseURL: 'https://api.example.com' });

@api('/users', { fetcher: transport })
class UserService {
  @get('/{id}')
  getUser(
    @path('id') id: string,
    @query('include') include: string,
  ): Promise<User> {
    throw new Error('Replaced by @api');
  }

  @post('')
  createUser(@body() user: Omit<User, 'id'>): Promise<User> {
    throw new Error('Replaced by @api');
  }
}

export async function runUsers() {
  const users = new UserService();
  try {
    const ada = await users.getUser('42', 'profile');
    const lin = await users.createUser({ name: 'Lin' });
    return { ada, lin };
  } catch (error) {
    if (error instanceof ExchangeError) {
      console.error('HTTP status:', error.exchange.response?.status);
    }
    throw error;
  }
}
```

在应用中调用 `runUsers()`，并在 UI 或服务入口处理其拒绝的 Promise。第一个请求为 `GET https://api.example.com/users/42?include=profile`；第二个向 `/users` 发送 JSON `{"name":"Lin"}`。端点装饰器默认使用 JSON 提取器。

`@api` 会替换端点方法，原方法体和参数默认值初始化器都不会执行。因此写 `include = 'profile'` 不能补上查询参数。像上例一样显式传值，或另外定义普通包装方法。

## 3. 连接真实接口前验证

在隔离测试中将 `globalThis.fetch` 替换为返回 `Response.json({ id: '42', name: 'Ada' })` 的桩，调用 `runUsers()`，断言两个 URL、HTTP 方法和第二个请求体。用 `finally` 恢复原 fetch。这样可以一起验证装饰器和请求管线。

## 失败与生命周期

缺少元数据时检查编译选项和导入顺序；绑定为 undefined 时检查参数顺序与参数装饰器。非 2xx 响应默认以 exchange 错误拒绝，JSON 解析也可能失败。返回类型 `User` 不会验证服务端 JSON。本例完整消费两个响应，没有需要销毁的监听器或流。

继续查阅[服务与端点元数据](../reference/decorator/services-and-endpoints)、[参数绑定](../reference/decorator/parameters)及[执行与取消](../reference/decorator/execution)。

[apiDecorator.ts:140](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/decorator/src/apiDecorator.ts#L140) 实现了方法替换。
