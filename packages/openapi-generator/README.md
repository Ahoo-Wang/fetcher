你作为资深前端开发工程师，正在开发基于 OpenAPI 规范的 TypeScript 代码生成器。
按照以下要求生成代码，要求模块职责清晰，自下而上的开发，即先开发小的基于模块，再逐步开发高层次模块代码，最终完成该lib。

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

```
openapi-generator/
├── src/
│   ├── core/                    # 核心处理逻辑
│   │   ├── generate-context.ts   # 整个生成过程共享该上下文: 保存Project、OpenAPI、以及已处理的 Schema、Operation、SourceFile 等
│   │   ├── parser/             # OpenAPI 解析器
│   │   │   ├── openapi-parser.ts
│   │   │   ├── reference-resolver.ts
│   │   │   └── schema-normalizer.ts
│   │   ├── ast/                # AST 构建模块 (使用 ts-morph)
│   │   │   ├── ast-builder.ts
│   │   │   ├── interface-generator.ts
│   │   │   ├── type-generator.ts
│   │   │   ├── enum-generator.ts
│   │   │   ├── client-generator.ts
│   │   │   └── decorator-applier.ts
│   │   ├── type-generator/     # TypeScript 类型生成逻辑
│   │   │   ├── base-type-mapper.ts
│   │   │   ├── schema-processor.ts
│   │   │   ├── enum-processor.ts
│   │   │   └── union-processor.ts
│   │   └── path-organizer/     # 路径组织逻辑
│   │       ├── module-grouper.ts
│   │       └── naming-converter.ts
│   ├── utils/                  # 工具函数
│   │   ├── ast-utils.ts        # AST 操作辅助函数
│   │   ├── file-utils.ts
│   │   ├── logger.ts
│   │   └── type-utils.ts
│   ├── cli/                    # 命令行接口
│   │   ├── index.ts
│   │   ├── commands/
│   │   │   └── generate.ts
│   │   └── options/
│   │       └── config.ts
│   └── types/                  # 类型定义
│       ├── openapi.ts
│       ├── generator.ts
│       └── config.ts
├── tests/                      # 测试文件
│   ├── unit/
│   └── integration/
└── dist/                       # 编译输出
```

### 关键模块职责说明（基于 ts-morph）

#### 1. AST 构建模块 (core/ast)

- **ast-builder.ts**: 主构建器，管理 ts-morph Project 和 SourceFile
- **interface-generator.ts**: 使用 ts-morph 生成接口声明
- **type-generator.ts**: 使用 ts-morph 生成类型别名
- **enum-generator.ts**: 使用 ts-morph 生成枚举
- **client-generator.ts**: 使用 ts-morph 生成 API 客户端类
- **decorator-applier.ts**: 使用 ts-morph 应用装饰器

#### 2. AST 工具模块 (utils/ast-utils)

提供 ts-morph 操作的辅助函数：

- 创建和操作节点
- 处理导入声明
- 管理类型引用
- 格式化生成的代码

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
    - 例如schemaKey： `example.cart.AddCartItem` 生成到 `cart/types.ts` 文件中
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

- `example.bot.BotCreated` 生成 `example/bot.ts`，接口名为 `BotCreated`
- `example.BotState` 生成 `example.ts`，接口名为 `BotState`
- `example.AiMessage.Assistant`、`example.AiMessage.Assistant.ToolCall`、`example.AiMessage.System` 都生成到
  `example/aiMessage.ts` 文件中：
    - `example.AiMessage.Assistant` 生成接口 `Assistant`
    - `example.AiMessage.Assistant.ToolCall` 生成接口 `AssistantToolCall`
    - `example.AiMessage.System` 生成接口 `System`