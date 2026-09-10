---
prev: false
title: View Engine API 参考
description: 独立数据视图引擎的公开入口、使用前提与契约。
---

# View Engine API 参考

本文描述当前工作区 5.0.0 契约。该包尚未在公共注册表发布，请按[本地构建与归档步骤](../../examples/view-engine.md)接入。仓库开发需要 Node >=20.20.2、pnpm 10.34.5。React 界面需要 React/ReactDOM ^19.2.8；直接依赖随包安装，其声明的 peer 依赖也需满足。

| 入口                                        | 内容                                                   | 运行时                           |
| ------------------------------------------- | ------------------------------------------------------ | -------------------------------- |
| `@ahoo-wang/fetcher-view-engine`            | 模型、ViewHost、ViewEngine、纯筛选函数、MemoryViewHost | 核心导入不加载 React、DOM 或 CSS |
| `@ahoo-wang/fetcher-view-engine/react`      | ViewPage、RecordView、FilterPanel、表格及内置控件      | React 19 与浏览器 UI             |
| `@ahoo-wang/fetcher-view-engine/styles.css` | 编译后的作用域样式                                     | 应用中导入一次                   |

消费者不需要 Tailwind 或 React Compiler 插件。`fve:` 是 CSS 工具类前缀，不是配置中的组件名前缀。当前实现支持 `kind: 'record'` 与 `layout: 'table' | 'card'`。

| 契约                                 | 阅读主题                   |
| ------------------------------------ | -------------------------- |
| 定义、实例、筛选配置与数据源形状     | [模型](./models.md)        |
| 服务门面、权限、版本与开发存储       | [ViewHost](./view-host.md) |
| 无头生命周期、命令与快照             | [ViewEngine](./engine.md)  |
| 筛选序列化、编译与远程候选           | [筛选契约](./filters.md)   |
| React 所有权、扩展属性、单元格与主题 | [组件](./components.md)    |
| 两个代码入口的全部导出名称           | [符号索引](./symbols.md)   |

接入步骤见[任务指南](../../guides/view-engine/index.md)，可运行基线见[共享示例](../../examples/view-engine.md)。`dev`、引擎内部服务和未导出的 UI 原语不构成额外公开入口。

可用布局由必填的 `ViewDefinition.allowedLayouts` 控制；仅允许一种时不显示切换入口。切换会保留各布局配置，参见[模型契约](./models.md)。
