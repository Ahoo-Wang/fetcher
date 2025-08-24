# @ahoo-wang/fetcher-decorator

Fetcher HTTP 客户端的装饰器支持。

## 安装

```bash
npm install @ahoo-wang/fetcher-decorator
```

## 使用

```typescript
import { Fetcher, fetcherRegistrar } from '@ahoo-wang/fetcher';
import {
  api,
  get,
  post,
  path,
  query,
  body,
} from '@ahoo-wang/fetcher-decorator';

// 创建并注册 fetcher
const userFetcher = new Fetcher({ baseURL: 'https://api.user-service.com' });
fetcherRegistrar.register('user', userFetcher);

// 使用装饰器定义服务类
@api('/users', { headers: {}, fetcher: 'user', timeout: 10000 })
class UserService {
  @post('/', { headers: {}, timeout: 5000 })
  createUser(@body() user: User): Promise<Response> {
    // 实现将自动生成
    throw new Error('Implementation will be generated automatically.');
  }

  @get('/{id}')
  getUser(
    @path('id') id: number,
    @query('include') include: string,
  ): Promise<Response> {
    throw new Error('Implementation will be generated automatically.');
  }
}

// 使用服务
const userService = new UserService();
userService.createUser({ name: 'John' }).then(response => {
  console.log(response);
});
```

## 装饰器

### 类装饰器

- `@api(basePath, metadata)` - 为类定义 API 元数据

### 方法装饰器

- `@get(path, metadata)` - 定义 GET 端点
- `@post(path, metadata)` - 定义 POST 端点
- `@put(path, metadata)` - 定义 PUT 端点
- `@del(path, metadata)` - 定义 DELETE 端点
- `@patch(path, metadata)` - 定义 PATCH 端点
- `@head(path, metadata)` - 定义 HEAD 端点
- `@options(path, metadata)` - 定义 OPTIONS 端点

### 参数装饰器

- `@path(name)` - 定义路径参数
- `@query(name)` - 定义查询参数
- `@body()` - 定义请求体
- `@header(name)` - 定义头部参数

## 许可证

Apache-2.0
