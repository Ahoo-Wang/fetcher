# OpenAPI TypeScript Code Generator

基于 OpenAPI 规范的 TypeScript 代码生成器，专注于生成数据模型（Schema）的 TypeScript 类型定义。

## 功能特性

- 根据 OpenAPI 规范生成 TypeScript 接口定义
- 智能模块路径组织，根据命名规范自动分组
- 支持 $ref 引用解析
- 支持基本类型、数组、对象、联合类型和枚举类型

## 安装

```bash
npm install @ahoo-wang/fetcher-openapi-generator
```

## 使用方法

```typescript
import { SchemaGenerator } from '@ahoo-wang/fetcher-openapi-generator';
import { Project } from 'ts-morph';
import type { OpenAPI } from '@ahoo-wang/fetcher-openapi';

// 创建 ts-morph 项目
const project = new Project({
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
    strict: true,
    esModuleInterop: true,
  }
});

// OpenAPI 规范文档
const openAPI: OpenAPI = {
  // ... your OpenAPI spec
};

// 创建生成器实例
const generator = new SchemaGenerator({
  openAPI,
  project
});

// 生成 TypeScript 类型定义
generator.generate();

// 保存生成的文件
await project.save();
```

## 命名规范

生成器会根据 schema 名称的格式自动组织模块结构：

### Schema 名称格式

Schema 名称采用点号分隔的命名规范：

- `serviceName.[aggregateName].[typeName]` 或者 `serviceName.[AggregateState]`

例如：

- `prajna.bot.BotCreated`
- `prajna.BotState`
- `prajna.AiMessage.Assistant`
- `prajna.AiMessage.Assistant.ToolCall`
- `prajna.AiMessage.System`

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