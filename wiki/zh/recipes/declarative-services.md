---
title: 声明式 API 服务
description: 将 TypeScript 装饰器元数据转换为可执行的 Fetcher 服务方法。
---

# 声明式 API 服务

当稳定的服务类比重复请求调用更能表达 HTTP 契约时，使用装饰器。

## 安装并配置 TypeScript

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator reflect-metadata
```

```json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

在应用入口导入一次 `reflect-metadata`。

## 定义服务

```ts
import 'reflect-metadata';
import { Fetcher } from '@ahoo-wang/fetcher';
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

const apiClient = new Fetcher({ baseURL: 'https://api.example.com' });

@api('/users', { fetcher: apiClient })
class UserService {
  @get('/{id}')
  getUser(
    @path('id') id: string,
    @query('include') include = 'profile',
  ): Promise<User> {
    throw new Error('Replaced by @api');
  }

  @post('')
  createUser(@body() user: Omit<User, 'id'>): Promise<User> {
    throw new Error('Replaced by @api');
  }
}
```

`@api` 会用请求执行器替换带端点装饰器的方法。装饰完成后方法体不会被调用；保留抛错方法体，可以让意外的未装饰调用立即失败。

## 调用服务

```ts
const users = new UserService();

const ada = await users.getUser('42');
const lin = await users.createUser({ name: 'Lin' });
```

第一次调用发送：

```text
GET https://api.example.com/users/42?include=profile
```

第二次调用向 `/users` 发送 JSON 请求体。

## 有意覆盖默认值

类元数据提供默认值，端点元数据覆盖类，实例 `apiMetadata` 可在支持的字段上覆盖类级值。优先为每个后端配置一个命名或直接 Fetcher，而不是在每个方法重复请求头与超时。

## 常见故障：缺少元数据

如果 TypeScript 没有生成装饰器元数据，或 `reflect-metadata` 未初始化，参数类型与绑定无法正确解析。检查 TypeScript 选项、导入顺序，以及方法是否同时具备端点装饰器和明确的 `@path`、`@query`、`@body` 绑定。

## 在网络边界测试

Mock `fetch`，构造真实服务并调用方法，然后断言最终方法、URL、请求头和请求体。不要 Mock 正在验证的 RequestExecutor。
