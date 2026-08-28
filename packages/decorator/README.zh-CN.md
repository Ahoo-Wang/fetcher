# `@ahoo-wang/fetcher-decorator`

使用方法和参数装饰器，把 HTTP 服务定义为 TypeScript 类。稳定服务接口比重复组装请求更
清晰时使用该包。

## 安装

```bash
pnpm add @ahoo-wang/fetcher @ahoo-wang/fetcher-decorator reflect-metadata
```

Peer 依赖为 `@ahoo-wang/fetcher`。启用 `experimentalDecorators` 与
`emitDecoratorMetadata`，并在启动时导入一次 `reflect-metadata`。

## 示例

```ts
import 'reflect-metadata';
import { Fetcher } from '@ahoo-wang/fetcher';
import { api, get, path } from '@ahoo-wang/fetcher-decorator';

interface User {
  id: string;
  name: string;
}

const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });

@api('/users', { fetcher })
class UserService {
  @get('/{id}')
  getUser(@path('id') id: string): Promise<User> {
    throw new Error('Replaced by @api');
  }
}

const user = await new UserService().getUser('u-42');
```

## 核心能力

- 类级 API 元数据与方法级覆盖。
- GET、POST、PUT、PATCH、DELETE（`del`）、HEAD 和 OPTIONS 装饰器。
- 路径、查询、请求头、请求体、完整请求和 exchange attribute 参数。
- Fetcher 选择、结果提取、URL 参数与生命周期 Hook。

## 文档

- [声明式服务实战](https://fetcher.ahoo.me/zh/recipes/declarative-services)
- [Decorator 参考](https://fetcher.ahoo.me/zh/reference/decorator)

[English](./README.md) · [许可证](../../LICENSE)
