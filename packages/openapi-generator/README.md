你作为资深前端开发工程师，正在开发基于 OpenAPI 规范的 TypeScript 代码生成器。

# @ahoo-wang/fetcher-openapi-generator

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
- @ahoo-wang/fetcher-openapi : 定义了 OpenAPI 规范类型
- @ahoo-wang/fetcher-decorator : Fetcher HTTP 客户端的装饰器支持。使用 TypeScript 装饰器实现简洁、声明式的 API 服务定义。
- @ahoo-wang/fetcher-wow : 内置的 Wow 类型定义系统，当识别 Wow 通用类型，替换为对应的类型
- ts-morph ：使用 ts-morph 生成 TypeScript 文件
- Commander.js ：通过 Commander.js 提供友好的命令行界面
- yaml

## 模块职责划分

- OpenAPIParser：解析器接口，负责解析 OpenAPI 规范. 支持 JSON、YAML 格式
    - JsonOpenAPIParser: JSON 格式解析器
    - YamlOpenAPIParser: YAML 格式解析器
    - CompositeOpenAPIParser: 组合解析器，支持多个解析器进行组合
- GenerateContext: 上下文类，负责生成器类之间的依赖关系
- SchemaGenerator：生成器类，负责生成数据模型（Schema）的 TypeScript 类型定义
- ApiClientGenerator：生成器类，负责生成 ApiClient
- GenerateOptions: 生成器配置类，用于自定义生成器行为
- OpenAPIGenerator：用户最终使用的生成器门面
- ModuleGrouper : 模块分组类，负责将生成的 TypeScript 类型定义分组到对应的模块中
- FilePathResolver: 文件路径解析类，负责将生成的 TypeScript 类型定义保存到对应的文件路径中
- TypeMapper: 类型映射类，负责将 OpenAPI 类型映射到 TypeScript 类型
- NamingResolver:
- utils: 工具类，提供一些常用的工具方法
- cli: 命令行工具

## OpenAPI Example

[demo-openapi](test/demo.json)

## Wow 内置的类型

`OpenAPI.components.schemas.[schemaKey]` , 其中 `schemaKey` 以 `wow.` 开头的为 Wow 内置的类型需要使用 Wow 内置类型：

1. `wow.command.CommandResult`:  使用 @ahoo-wang/fetcher-wow 的 `CommandResult` 接口类型
2. `wow.MessageHeaderSqlType`: `MessageHeaderSqlType`
3. `wow.api.BindingError`: `BindingError`
4. `wow.api.DefaultErrorInfo`: `ErrorInfo`
5. `wow.api.command.DefaultDeleteAggregate`: `DeleteAggregate`
6. `wow.api.command.DefaultRecoverAggregate`: `RecoverAggregate`
7. `wow.api.messaging.FunctionInfoData`: `FunctionInfo`
8. `wow.api.messaging.FunctionKind`: `FunctionKind`
9. `wow.api.modeling.AggregateId`: `AggregateId`
10. `wow.api.query.Condition`: `Condition`
11. `wow.api.query.ListQuery`: `ListQuery`
12. `wow.api.query.Operator`: `Operator`
13. `wow.api.query.PagedQuery`: `PagedQuery`
14. `wow.api.query.Pagination`: `Pagination`
15. `wow.api.query.Projection`: `Projection`
16. `wow.api.query.Sort`: `FieldSort`
17. `wow.api.query.Sort.Direction`: `SortDirection`
18. `wow.command.CommandStage`: `CommandStage`
19. `wow.command.SimpleWaitSignal`: `WaitSignal`
20. `wow.configuration.Aggregate`: `Aggregate`
21. `wow.configuration.BoundedContext`: `BoundedContext`
22. `wow.configuration.WowMetadata`: `WowMetadata`
23. `wow.modeling.DomainEvent`: `DomainEvent`
24. `wow.openapi.BatchResult`: `BatchResult`

## 模块组织

通用规则：当遇到 `.` 时，标识目录层级。但如果分后后的名称为大写，则为接口名称

- Schema 类型定义根据 , `schemaKey` 的命名规范自动组织模块结构
    - 例如schemaKey： `example.cart.AddCartItem` 生成到 `cart/addCartItem.ts` 文件中
- ApiClient 按照，tags 组织模块结构
    - 例如按照，tags： `example.cart.AddCartItem` 生成到 `cart/addCartItem.ts` 文件中

### Data Model 模块组织与命名规范

#### Schema 名称格式

`OpenAPI.components.schemas.[schemaKey]`
schemaKey 名称采用点号分隔的命名规范：

- `serviceName.[aggregateName].[TypeName]`
- `serviceName.[DtoName]`

例如：

- `example.cart.AddCartItem`
- `example.cart.CartAggregatedCondition`
- `example.cart.CartAggregatedDomainEventStream`
- `example.AiMessage.Assistant.ToolCall`
- `example.AiMessage.System`
- `example.SecurityContext`

### 模块组织规则

1. 按照 `.` 分割 schema 名称
2. 从第一个开头字符为大写的名称部分开始，作为接口名称
3. 之前的路径部分作为文件路径组织

示例：

- `prajna.bot.BotCreated` 生成 `prajna/bot.ts`，接口名为 `BotCreated`
- `prajna.BotState` 生成 `prajna.ts`，接口名为 `BotState`
- `prajna.AiMessage.Assistant`、`prajna.AiMessage.Assistant.ToolCall`、`prajna.AiMessage.System` 都生成到
  `prajna/aiMessage.ts` 文件中：
    - `prajna.AiMessage.Assistant` 生成接口 `Assistant`
    - `prajna.AiMessage.Assistant.ToolCall` 生成接口 `AssistantToolCall`
    - `prajna.AiMessage.System` 生成接口 `System`

## 支持的类型

- 基本类型：string, number, integer, boolean
- 数组类型：type[]
- 对象类型：{ prop: type }
- 联合类型：type1 | type2
- 枚举类型："value1" | "value2"
- 引用类型：通过 $ref 引用其他 schema

## License

Apache License 2.0