---
title: 筛选配置与组件契约
description: 序列化编辑器属性，纯函数编译表达式，并接入远程候选源。
---

# 筛选配置与组件契约

## 三种表示

| 表示                   | 用途                                                                                     |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `FilterDraftNode`      | 编辑树：id/op/field/editor、原始值/props、operands 或 predicate                          |
| `FilterConfiguration`  | 可 JSON 保存的 `{ mode, root }`；节点包含 id/component/operator/field/props 和可选子节点 |
| Wow `FilterExpression` | 编译后的请求条件，不是 UI 恢复格式                                                       |

`FilterJsonValue` 支持 null、布尔、有限数字、字符串、数组和 JSON 对象。对象属性可为未设置的 `undefined`，序列化时省略；不能把函数、循环引用或 undefined 数组项写入 props。组件名称标识其保存与编译协议。

## 核心函数

| 函数                                                                                    | 返回值 / 行为                              |
| --------------------------------------------------------------------------------------- | ------------------------------------------ |
| `createFilterDraft(expression)`、`newFilterDraft(op, field?)`                           | 创建带 ID 的编辑节点                       |
| `createFilterConfiguration(draft, mode?, fields?, editors?)`                            | 复制原始属性，解析组件身份，形成 JSON 配置 |
| `restoreFilterConfiguration(config)`                                                    | 校验后返回草稿树，模式从 config 读取       |
| `validateFilterConfiguration(value, fields?)`                                           | 断言配置有效，无效输入抛出错误             |
| `compileFilterConfiguration(config, fields, allowedOperators?, compilers?, timeZone?)`  | `{ expression?, errors }`                  |
| `compileFilterDraft(draft, fields, allowedOperators?, compilers?, editors?, timeZone?)` | 通过相同契约序列化并编译                   |
| `clearFilterDraftValues(node, fields, compilers?, editors?, timeZone?)`                 | 按组件语义清空值并保留节点                 |
| `compileBuiltinFilter`、`clearBuiltinFilterProps`                                       | 复用默认组件编译与清空                     |
| `getFieldOperators`、`FILTER_OPERATORS`、`isSimpleFilter`、`sameFilterQuery`            | 能力、元数据、模式与查询比较               |

草稿依赖字段/操作符默认编辑器时，创建配置必须传入 fields/editors。优先级为节点显式 editor、字段 editor、操作符默认值、builtin。编译错误阻止应用；有效但没有实际条件时得到 MATCH_ALL。

## FilterPanel

必填 `value: FilterExpression | null`、`fields`、`onApply(expression)`。可选受控属性包括 `draft/onDraftChange`、`appliedDraft`、`mode/onModeChange`、`onPendingChange`、`onValidityChange`、`timeZone`、`extensions`、`editors`、`allowedOperators`。通过 `querying`、`queryError`、`disabled`、`collapsed`、`renderToolbar`、`className` 接入宿主布局。

value 表示已应用条件；导航会卸载编辑器时，应分别保留 draft 和 appliedDraft。collapsed 隐藏面板主体并保留本地输入缓冲。移动工具栏时使用 `FilterPanelToolbarProps.onModeChange`，保持模式切换保护。普通输入框中的 Enter 查询，弹层中的 Enter 仍由弹层处理。

## FilterRegistration

component 接收只读原始 props、field/operator/mode/context/options、错误、禁用状态及变更/有效性回调。纯函数 `compile(props, context)` 返回表达式或 undefined，可选 clear 返回清空后的 props。modes 必填，supports 可拒绝不兼容绑定。默认 `render: 'value'` 使用 `FilterEditorProps`；`render: 'filter'` 使用含 id/operators/errorId 及 onOperatorChange/onClear/onRemove 的 `FilterComponentProps`。

`FilterCompilerRegistry` 是 ViewEngine/核心辅助函数使用的无头子集。React 接入只需在 `extensions.filters` 注册同一份定义，ViewPage 连接其编译和组件能力。注册的协议不兼容变化时，使用新名称或执行明确的配置迁移。

## 远程候选契约

`FilterOptionSource` 独立于 ViewHost：

```ts
import type { CursorPage, CursorQuery } from '@ahoo-wang/fetcher-wow';
import type {
  FilterOptionItem,
  FilterOptionValue,
} from '@ahoo-wang/fetcher-view-engine';

interface FilterOptionSource {
  search(
    query: Pick<CursorQuery, 'cursor' | 'size'> & { search: string },
    signal: AbortSignal,
  ): Promise<CursorPage<FilterOptionItem>>;
  resolve(
    values: readonly FilterOptionValue[],
    signal: AbortSignal,
  ): Promise<{
    list: FilterOptionItem[];
    missing: FilterOptionValue[];
  }>;
}
```

实际 search 类型为 `Pick<CursorQuery, 'cursor' | 'size'>` 加 search，实现时以导出类型为准。值只允许字符串或有限数字，resolve 必须保留字符串/数字身份并将每个请求 ID 唯一归类。搜索、分页和标签回填分别恢复错误；后续页失败保留已有候选。保存的标签不能替代权限判断和来源校验。
