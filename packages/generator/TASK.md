你作为资深前端开发工程师，正在开发基于 OpenAPI 规范的 TypeScript 代码生成器。
按照以下要求生成代码，要求模块职责清晰，自下而上的开发，即先开发小的基于模块，再逐步开发高层次模块代码，最终完成该lib:

1. 将 输入文件解析为 OpenAPI 对象
2. 将 OpenAPI 解析为 模块定义
    1. 数据模型定义
    2. 客户端定义
        1. 命令客户端
        2. 查询客户端
3. 基于定义文件，生成代码

# @ahoo-wang/fetcher-generator

基于 OpenAPI 规范的 TypeScript 代码生成器，专注于生成数据模型（Schema）、 请求和响应体类型定义 以及 ApiClient。

## 功能特性

- 根据 OpenAPI 规范生成 生成数据模型（Schema）、 请求和响应体类型定义 以及 ApiClient
- 智能模块路径组织，根据命名规范自动分组
- 支持 $ref 引用解析
- 支持基本类型、数组、对象、联合类型和枚举类型
- 命令行支持,支持通过 npx 运行

## 技术栈

- vite
- vitest
- typescript
- [@ahoo-wang/fetcher-openapi](../openapi) : 定义了 OpenAPI 规范类型
- [@ahoo-wang/fetcher-decorator](../decorator) : Fetcher HTTP 客户端的装饰器支持。使用 TypeScript 装饰器实现简洁、声明式的
  API 服务定义。
- [@ahoo-wang/fetcher-wow](../wow) : 内置的 Wow 类型定义系统，当识别 Wow 通用类型，替换为对应的类型
- ts-morph ：使用 ts-morph 生成 TypeScript 文件
- Commander.js ：通过 Commander.js 提供友好的命令行界面
- yaml

## OpenAPI Example

[demo-openapi](test/compensation-spec.json)

## 预期生成的模块文件

[expected](expected/execution_failed)

## Wow 内置的类型

`OpenAPI.components.schemas.[schemaKey]` , 其中 `schemaKey` 以 `wow.` 开头的为 Wow 内置的类型需要使用 Wow 内置类型：

```typescript
export const IMPORT_WOW_PATH = '@ahoo-wang/fetcher-wow';

export const WOW_TYPE_MAPPING = {
  'wow.command.CommandResult': 'CommandResult',
  'wow.MessageHeaderSqlType': 'MessageHeaderSqlType',
  'wow.api.BindingError': 'BindingError',
  'wow.api.DefaultErrorInfo': 'ErrorInfo',
  'wow.api.command.DefaultDeleteAggregate': 'DeleteAggregate',
  'wow.api.command.DefaultRecoverAggregate': 'RecoverAggregate',
  'wow.api.messaging.FunctionInfoData': 'FunctionInfo',
  'wow.api.messaging.FunctionKind': 'FunctionKind',
  'wow.api.modeling.AggregateId': 'AggregateId',
  'wow.api.query.Condition': 'Condition',
  'wow.api.query.ListQuery': 'ListQuery',
  'wow.api.query.Operator': 'Operator',
  'wow.api.query.PagedQuery': 'PagedQuery',
  'wow.api.query.Pagination': 'Pagination',
  'wow.api.query.Projection': 'Projection',
  'wow.api.query.Sort': 'FieldSort',
  'wow.api.query.Sort.Direction': 'SortDirection',
  'wow.command.CommandStage': 'CommandStage',
  'wow.command.SimpleWaitSignal': 'WaitSignal',
  'wow.configuration.Aggregate': 'Aggregate',
  'wow.configuration.BoundedContext': 'BoundedContext',
  'wow.configuration.WowMetadata': 'WowMetadata',
  'wow.modeling.DomainEvent': 'DomainEvent',
  'wow.openapi.BatchResult': 'BatchResult',
};
```

## 模块组织

通用规则：当遇到 `.` 时，标识目录层级。但如果分后后的名称为大写，则为接口名称

- DataModel Interface ,按照 Schema 类型定义，根据  `schemaKey` 的命名规范自动组织模块结构
    - 例如 schemaKey： `example.cart.AddCartItem` 生成到 `cart/types.ts` 文件中
- ApiClient 按照，tags 、 operation 组织模块结构
    - 例如，tags： `example.cart` 生成 `cart/cartClient.ts` 文件中

### Data Model 模块组织与命名规范

#### Schema 名称格式

`OpenAPI.components.schemas.[schemaKey]`
schemaKey 名称采用点号分隔的命名规范：

- `serviceName.[aggregateName].[TypeName]`
- `serviceName.[DtoName]`

### 模块组织规则

1. 按照 `.` 分割 schema 名称
2. 从第一个开头字符为大写的名称部分开始，作为接口名称
3. 之前的路径部分作为文件路径组织

例如：

- `example.cart.AddCartItem` : 写入 `example/cart/types.ts` 文件中
- `example.cart.CartAggregatedCondition` : 写入 `example/cart/types.ts` 文件中
- `example.cart.CartAggregatedDomainEventStream`: 写入 `example/cart/types.ts` 文件中
- `example.AiMessage.Assistant`、`example.AiMessage.Assistant.ToolCall`、`example.AiMessage.System` 都生成到
  `example/types.ts` 文件中：
    - `example.AiMessage.Assistant` 生成接口 `AiMessageAssistant`
    - `example.AiMessage.Assistant.ToolCall` 生成接口 `AiMessageAssistantToolCall`
    - `example.AiMessage.System` 生成接口 `AiMessageSystem`

### Client 模块组织与命名规范

Client 按照 tags 组织。

1. 按照 `.` 分割 tag 名称
2. 最后的一个名称作为接口名称
3. 当 单个 operation 存在多个 tag 时，多个 tag 相关的接口均需要写入接口函数

例如：

- `example.cart` : 写入 `cart/cartClient.ts` 文件中
- `order-query-controller`: 写入 `./orderQueryControllerClient.ts`
- `customer`: 写入 `./customerClient.ts`

#### 函数规范

函数名称基于 operationId。

函数名称采用驼峰命名法，函数参数采用 PascalCase 命名法。





