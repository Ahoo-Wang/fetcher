---
title: 筛选配置与组件契约
description: 序列化编辑器属性，纯函数编译表达式，并接入远程候选源。
---

# 筛选配置与组件契约

## 配置与查询

| 表示                    | 用途                                                                            |
| ----------------------- | ------------------------------------------------------------------------------- |
| `FilterComponentConfig` | 唯一编辑节点：id/component/operator/field/props，以及可选 operands 或 predicate |
| `FilterConfiguration`   | 可 JSON 保存的 `{ mode, root }`，编辑、已应用和已保存快照共用此结构             |
| Wow `FilterExpression`  | 编译后的请求条件，不是 UI 恢复格式                                              |

`FilterJsonValue` 支持 null、布尔、有限数字、字符串、数组和 JSON 对象。对象属性可为未设置的 `undefined`，序列化时省略；不能把函数、循环引用或 undefined 数组项写入 props。组件名称标识其保存与编译协议。

## 核心函数

| 函数                                                                                   | 返回值 / 行为                                                  |
| -------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `newFilterNode(operator, field?, component?)`                                          | 创建带 ID、明确组件引用（默认 builtin）和初始 props 的配置节点 |
| `createFilterConfiguration(root, mode?)`                                               | 复制并校验配置根节点；省略模式时推导模式                       |
| `validateFilterConfiguration(value, fields?, allowedOperators?)`                       | 断言配置有效，无效输入抛出错误                                 |
| `compileFilterConfiguration(config, fields, allowedOperators?, compilers?, timeZone?)` | `{ expression?, errors }`                                      |
| `clearFilterValues(root, fields, compilers?, timeZone?)`                               | 按组件语义清空值并保留节点身份                                 |
| `compileBuiltinFilter`、`clearBuiltinFilterProps`                                      | 复用默认组件编译与清空                                         |
| `getFieldOperators`、`FILTER_OPERATORS`、`isSimpleFilter`、`sameFilterQuery`           | 能力、元数据、模式与查询比较                                   |

直接构造组件 props。面板仅在新建节点时解析字段/操作符默认编辑器；已保存节点始终使用明确组件引用。编译错误阻止应用；有效但没有实际条件时得到 MATCH_ALL。

`getFieldOperators(field)` 仅根据字段类型和显式 `field.operators` 推导能力。字段 `editor` 和定义 `filterEditors` 仅作为新建节点默认值；已有节点以自身 `component` 为准，由该组件注册检查兼容性。因此修改字段默认编辑器不会限制或替换已保存组件。

## FilterPanel

必填 `fields`、`onApply({configuration, expression})`。受控时使用配置值 `value/onChange`；本地所有权使用 `defaultValue`，两者互斥。可选 `appliedValue` 提供已接受的配置基线。模式保存在 `configuration.mode`。其他可选属性包括 `onPendingChange`、`onValidityChange`、`timeZone`、`extensions`、`editors`、`allowedOperators`。通过 `querying`、`queryError`、`disabled`、`collapsed`、`renderToolbar`、`className` 接入宿主布局。

导航会卸载编辑器时，应分别保留编辑配置和已接受配置。collapsed 隐藏面板主体并保留本地输入缓冲。移动工具栏时使用 `FilterPanelToolbarProps.onModeChange`，保持模式切换保护。普通输入框中的 Enter 查询，弹层中的 Enter 仍由弹层处理。

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

## 可恢复的多值文本

`FilterTextValues` 接收 `value?: readonly string[]`、可选受控 `rawText?: string`、报告原始键入的 `onRawTextChange?(text)` 和 `onValueChange(values, rawText)`。未提供 rawText 时由组件保存本地输入缓冲。回车或粘贴确认时，通过一次回调返回新值集合和空缓冲；移除标签时返回剩余值及当前缓冲。受控调用方应在该回调中同时更新 values 和 rawText。输入法确认不会提交值或发起查询。

注册的 `text-values` 编辑器将每次原始编辑保存到 `props.rawText`，未确认输入可跨实例切换恢复。去除首尾空白后非空的 rawText 阻止纯编译，非字符串 rawText 无效。确认会移除 rawText 并保留已确认值；清空同时移除 values 和 rawText。仅空白输入不产生未确认值。独立控件仍可使用可选 `onValidityChange(valid, message?)`，注册组件的有效性由编译结果决定。

使用同一筛选配置进行纯 COUNT/SUM 编译，参见[纯分析编译](./components.md#纯分析编译)。
