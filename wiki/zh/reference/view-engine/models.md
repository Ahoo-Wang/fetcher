---
title: 定义与实例模型
description: 保存组件配置，并显式声明记录与数据源能力。
---

# 定义与实例模型

## ViewDefinition

| 属性                                  | 契约                                                                         |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `id`、`title`                         | 共用定义身份与标题                                                           |
| `sourceId`                            | 传给 `host.resolveSource` 的本地标识                                         |
| `rowKey`                              | 相对记录的自有属性路径，指向唯一字符串或有限数字                             |
| `fields`                              | 只读字段定义：`field`、`label`，以及可选 type/group/options/operators/editor |
| `timeZone?`                           | 筛选与日期时间单元格共用时区，省略时使用本地运行环境                         |
| `allowedOperators?`、`filterEditors?` | 定义级操作符限制和编辑器默认值                                               |
| `recordActions?`                      | 全局、表格、行操作的命名引用                                                 |

`ViewFieldDefinition` 还支持 `sortable`、`cellRenderer`、`numberFormat` 和 `summaryFunctions`。`RendererReference` 与 `FilterEditorReference` 都是 `{ name: string, options?: JSON object }`，函数属于运行时注册。

## ViewInstance 与 RecordViewConfig

`ViewInstance` 当前就是 `RecordViewInstance`：包含 `id`、`definitionId`、`title`、可选 `revision`、`scope`、`kind: 'record'` 和 `config`。

| 配置属性       | 保存内容                                      |
| -------------- | --------------------------------------------- |
| `filters`      | `FilterConfiguration`：模式与组件树           |
| `sort`         | Wow `FieldSort[]`                             |
| `pagination`   | `{ mode: 'paged' \| 'cursor', size: number }` |
| `presentation` | `{ layout: 'table', table: { columns } }`     |

scope 为 `{ type: 'personal' }` 或 `{ type: 'public', source: 'system' | 'shared' }`；另存为只接受个人或共享范围。`ViewInstanceList` 返回完整可见 `instances`，以及字符串或 null 的 `defaultInstanceId`。

字段列包含 `id`、`kind: 'field'`、`field`，以及可选 `title`、`width`、`visible`、`pinned`、`renderer`、`summary`。操作列使用 `kind: 'actions'`，没有 field。显式宽度为 64–960 px，导出常量提供最小、最大与默认值（180 px）。`getRecordColumnPinning` 计算主键/操作列的强制固定位置；`orderRecordColumns` 返回展示顺序，不改写保存偏好。

## RecordQuerySource

数据源提供 Wow `QueryApi<RecordData>` 的 `paged` 和/或 `cursor`，以及可选 `aggregate`。方法参数为 `(query, attributes?, abortController?)`，应继续向传输层传递取消信号。查询使用 Wow 请求类型中的 `FilterExpression` 分支，不是旧 `condition` DSL。

普通分页返回 `{ list, total }`；游标分页返回 `{ list, nextCursor }`，末页 `nextCursor: null`。聚合返回生成查询所描述的结果行，应使用汇总辅助函数处理别名。只声明实际支持的模式，元数据与数据源能力必须一致。

`readRecordValue` 读取自有属性与标准点分数组下标，字面点号键优先。`getRecordKey`、`validateRecordRows` 检查稳定身份。信任边界可调用 `validateViewDefinition`、`validateViewInstance`；运行时快照使用 `DeepReadonly`。
