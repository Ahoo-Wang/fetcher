---
title: '表格、列与单元格'
description: '表格、列与单元格 — @ahoo-wang/fetcher-viewer 5.0.0'
---

# 表格、列与单元格

::: warning 维护期（已弃用）
`@ahoo-wang/fetcher-viewer` 已进入维护期（弃用），仅维护现有功能，不再新增功能。数据视图能力的后续演进由 [`@ahoo-wang/fetcher-view-engine`](../../guides/view-engine/index.md) 承担，新项目请使用 View Engine。本页保留供存量项目维护参考；两者模型与 API 不同，迁移需要适配。
:::

`ViewTable<RecordType>` 将 FieldDefinition/ViewColumn 映射为 Ant Design 列，接收记录数组，不分页或查询服务端。必填 fields、columns、dataSource、enableRowSelection、viewTableSetting（false 或设置）；attributes 可转发表格 props，tableSize 默认 middle。

## 渲染与选择

列名使用点分路径。渲染优先级为 field.render、主键渲染器、已注册类型单元格、TextCell 回退。field.attributes 同时展开到列配置并能覆盖生成值，需要有意识地使用。主键/fixed 列固定 start，操作列固定 end。只有同时提供 actionColumn 和 viewTableSetting，才在操作列头显示设置浮层。TableSettingPanel 编辑 initialColumns 并发送 onChange，TableFieldItem 是条目控件，两者均不持久化配置。

useViewTableState 本地维护选择 key，clearSelectedRowKeys/reset 清空 key 数组，ViewTableRef 暴露这两个方法。onSelectChange 接收记录，onSortChanged 仅在排序操作时收到 Ant Design sorter 数组。dataSource 变化不自动清除选择。mapToTableRecord 优先主键、已有 key、行索引。attributes 在固定 scroll/size/onChange 前展开，最后这些配置仍由实现负责。

## 单元格契约

所有 cell 接收 `data: {value,record,index}` 和可选类型专用 attributes。`typedCellRender(type, attributes?)` 返回 `(value,record,index) => ReactNode`，未知类型为 undefined。内置 text、primary-key、action/actions、tag/tags、datetime、calendar-time、image/image-group、link、currency、avatar；应使用公开 *_CELL_TYPE 常量，不猜键名。

DateTimeCell 默认 `YYYY-MM-DD HH:mm:ss`，无效/缺失日期显示 `-`。CalendarTimeCell 用 DEFAULT_CALENDAR_FORMATS 创建相对日历格式。formatCurrency 接受数值/字符串，用 Intl.NumberFormat，默认 CNY/symbol/2 位小数/zh-CN/分组 true/回退 `-`；解析后的非有限值使用回退，非法 Intl 参数仍可抛错。这是展示格式化，不是精确货币运算。ActionCell 将真值 data.value 显示为链接按钮，将当前记录传给 attributes.onClick，ActionsCell 组合主/次操作。AvatarCell 用 isValidImageSrc 选择图片或缩写/文本；ImageCell 只判断空值，ImageGroupCell 判断非空数组，均不验证网络可访问性。用户 render/actions 不由统一错误边界捕获。

| 单元格             | 值 / attributes / 空值行为                                                                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| TextCell           | 值转字符串，null/undefined/空字符串显示 `-`，TextProps.children 覆盖展示。                                                                                   |
| PrimaryKeyCell     | 值为链接文本，copyable 默认 true，attributes.onClick 接收 record。                                                                                           |
| TagCell / TagsCell | 空白标签不渲染；tags 使用字符串数组，attributes 按标签文本索引，可传 Space props。                                                                           |
| LinkCell           | 邮箱添加 mailto，其他值默认 target blank 和 rel noopener noreferrer；显式 href 优先，javascript/data/vbscript 协议替换为 `#`，显式 target/rel 归调用者负责。 |
| ImageCell          | 空值渲染 Empty，ImageProps 可覆盖 src 等图片选项。                                                                                                           |
| ImageGroupCell     | 空值/非数组渲染 Empty，首图为预览，多图增加数量徽标，alt 默认 Preview image。                                                                                |
| AvatarCell         | 空值为空 Avatar，合法 source 为图像，其他文本作为缩写，attributes 可覆盖 Avatar props。                                                                      |
| CurrencyCell       | attributes.format 配置 formatCurrency，children 覆盖格式化文本。                                                                                             |
| CalendarTimeCell   | 默认 sameDay/nextDay/lastDay 为今天/明天/昨天加 HH:mm，其余日期使用完整默认日期格式。                                                                        |

各 cell props、CurrencyFormatOptions、CalendarFormats 和准确常量见下文；[Cells.stories.tsx](https://github.com/Ahoo-Wang/fetcher/blob/main/stories/viewer/Cells.stories.tsx#L1) 提供交互渲染示例。

## 完整示例

```tsx
import { ViewTable } from '@ahoo-wang/fetcher-viewer';
interface Item {
  id: string;
  price: number;
}
export function Prices() {
  return (
    <ViewTable<Item>
      fields={[
        { name: 'id', label: 'ID', type: 'text', primaryKey: true },
        { name: 'price', label: 'Price', type: 'currency', primaryKey: false },
      ]}
      columns={['id', 'price'].map(name => ({
        name,
        key: name,
        fixed: false,
        hidden: false,
      }))}
      dataSource={[{ id: '1', price: 12.5 }]}
      enableRowSelection={false}
      viewTableSetting={false}
      attributes={{ pagination: false }}
    />
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

### isActionCellProps {#api-isActionCellProps}

```ts
export function isActionCellProps(obj: any): obj is ActionCellProps;
```

[packages/viewer/src/table/cell/ActionCell.tsx:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ActionCell.tsx#L58)

### ActionCell {#api-ActionCell}

```ts
export function ActionCell<RecordType = any>(
  props: ActionCellProps<RecordType>,
): import('react').JSX.Element | null;
```

[packages/viewer/src/table/cell/ActionCell.tsx:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ActionCell.tsx#L122)

### ACTION_CELL_TYPE {#api-ACTION_CELL_TYPE}

```ts
declare const ACTION_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/ActionCell.tsx:23](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ActionCell.tsx#L23)

### ActionCellProps {#api-ActionCellProps}

```ts
export interface ActionCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  Omit<ButtonProps, 'onClick'> & {
    onClick?: (record: RecordType) => void;
  }
> {}
```

[packages/viewer/src/table/cell/ActionCell.tsx:50](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ActionCell.tsx#L50)

### ActionsCell {#api-ActionsCell}

```ts
export function ActionsCell<RecordType = any>(
  props: ActionsCellProps<RecordType>,
): React.JSX.Element;
```

[packages/viewer/src/table/cell/ActionsCell.tsx:241](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ActionsCell.tsx#L241)

### ACTIONS_CELL_TYPE {#api-ACTIONS_CELL_TYPE}

```ts
declare const ACTIONS_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/ActionsCell.tsx:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ActionsCell.tsx#L28)

### ActionsData {#api-ActionsData}

```ts
export interface ActionsData<RecordType = any> {
  primaryAction:
    ActionCellProps<RecordType> | ((record: RecordType) => React.ReactNode);
  moreActionTitle?: string;
  secondaryActions:
    ActionCellProps<RecordType>[] | ((record: RecordType) => React.ReactNode[]);
}
```

[packages/viewer/src/table/cell/ActionsCell.tsx:59](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ActionsCell.tsx#L59)

### ActionsCellProps {#api-ActionsCellProps}

```ts
export interface ActionsCellProps<RecordType = any> extends CellProps<
  ActionsData<RecordType>,
  RecordType,
  {
    onClick: (actionKey: string, value: RecordType) => void;
  }
> {}
```

[packages/viewer/src/table/cell/ActionsCell.tsx:97](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ActionsCell.tsx#L97)

### AvatarCell {#api-AvatarCell}

```ts
export function AvatarCell<RecordType = any>(
  props: AvatarCellProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/AvatarCell.tsx:142](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/AvatarCell.tsx#L142)

### AVATAR_CELL_TYPE {#api-AVATAR_CELL_TYPE}

```ts
declare const AVATAR_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/AvatarCell.tsx:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/AvatarCell.tsx#L39)

### AvatarCellProps {#api-AvatarCellProps}

```ts
export interface AvatarCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  AvatarProps
> {}
```

[packages/viewer/src/table/cell/AvatarCell.tsx:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/AvatarCell.tsx#L69)

### CalendarTimeCell {#api-CalendarTimeCell}

```ts
export function CalendarTimeCell<RecordType = any>(
  props: CalendarTimeProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/CalendarTime.tsx:208](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CalendarTime.tsx#L208)

### CalendarFormats {#api-CalendarFormats}

```ts
export interface CalendarFormats {
  sameDay?: string;
  nextDay?: string;
  nextWeek?: string;
  lastDay?: string;
  lastWeek?: string;
  sameElse?: string;
}
```

[packages/viewer/src/table/cell/CalendarTime.tsx:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CalendarTime.tsx#L40)

### CALENDAR_CELL_TYPE {#api-CALENDAR_CELL_TYPE}

```ts
declare const CALENDAR_CELL_TYPE: 'calendar-time';
```

[packages/viewer/src/table/cell/CalendarTime.tsx:78](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CalendarTime.tsx#L78)

### DEFAULT_CALENDAR_FORMATS {#api-DEFAULT_CALENDAR_FORMATS}

```ts
declare const DEFAULT_CALENDAR_FORMATS: CalendarFormats;
```

[packages/viewer/src/table/cell/CalendarTime.tsx:89](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CalendarTime.tsx#L89)

### CalendarTimeProps {#api-CalendarTimeProps}

```ts
export interface CalendarTimeProps<RecordType = any> extends CellProps<
  string | number | Date | Dayjs,
  RecordType,
  TextProps & {
    formats?: CalendarFormats;
  }
> {}
```

[packages/viewer/src/table/cell/CalendarTime.tsx:129](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CalendarTime.tsx#L129)

### cellRegistry {#api-cellRegistry}

```ts
declare const cellRegistry: TypedComponentRegistry<
  string,
  CellProps<any, any, any>
>;
```

[packages/viewer/src/table/cell/cellRegistry.ts:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/cellRegistry.ts#L67)

### formatCurrency {#api-formatCurrency}

```ts
export function formatCurrency(
  amount: number | string | null,
  options?: CurrencyFormatOptions,
): string;
```

实现默认值: `options = DEFAULT_CURRENCY_FORMAT_OPTIONS`.

[packages/viewer/src/table/cell/currencyFormatter.ts:200](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/currencyFormatter.ts#L200)

### CurrencyFormatOptions {#api-CurrencyFormatOptions}

```ts
export interface CurrencyFormatOptions {
  currency?: string;
  currencyDisplay?: Intl.NumberFormatOptionsCurrencyDisplay;
  decimals?: number;
  locale?: string;
  useGrouping?: boolean;
  fallback?: string;
}
```

[packages/viewer/src/table/cell/currencyFormatter.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/currencyFormatter.ts#L35)

### DEFAULT_CURRENCY_FORMAT_OPTIONS {#api-DEFAULT_CURRENCY_FORMAT_OPTIONS}

```ts
declare const DEFAULT_CURRENCY_FORMAT_OPTIONS: CurrencyFormatOptions;
```

[packages/viewer/src/table/cell/currencyFormatter.ts:117](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/currencyFormatter.ts#L117)

### CurrencyCell {#api-CurrencyCell}

```ts
export function CurrencyCell<RecordType = any>(
  props: CurrencyCellProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/CurrencyCell.tsx:298](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CurrencyCell.tsx#L298)

### CURRENCY_CELL_TYPE {#api-CURRENCY_CELL_TYPE}

```ts
declare const CURRENCY_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/CurrencyCell.tsx:58](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CurrencyCell.tsx#L58)

### CurrencyAttributes {#api-CurrencyAttributes}

```ts
export interface CurrencyAttributes extends TextProps {
  format?: CurrencyFormatOptions;
}
```

[packages/viewer/src/table/cell/CurrencyCell.tsx:102](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CurrencyCell.tsx#L102)

### CurrencyCellProps {#api-CurrencyCellProps}

```ts
export interface CurrencyCellProps<RecordType = any> extends CellProps<
  number | string,
  RecordType,
  CurrencyAttributes
> {}
```

[packages/viewer/src/table/cell/CurrencyCell.tsx:163](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/CurrencyCell.tsx#L163)

### DateTimeCell {#api-DateTimeCell}

```ts
export function DateTimeCell<RecordType = any>(
  props: DateTimeCellProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/DateTimeCell.tsx:146](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/DateTimeCell.tsx#L146)

### DATETIME_CELL_TYPE {#api-DATETIME_CELL_TYPE}

```ts
declare const DATETIME_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/DateTimeCell.tsx:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/DateTimeCell.tsx#L42)

### DateTimeCellProps {#api-DateTimeCellProps}

```ts
export interface DateTimeCellProps<RecordType = any> extends CellProps<
  string | number | Date | Dayjs,
  RecordType,
  TextProps & {
    format?: string | ((dayjs: Dayjs) => string);
  }
> {}
```

[packages/viewer/src/table/cell/DateTimeCell.tsx:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/DateTimeCell.tsx#L72)

### DEFAULT_DATE_TIME_FORMAT {#api-DEFAULT_DATE_TIME_FORMAT}

```ts
declare const DEFAULT_DATE_TIME_FORMAT: 'YYYY-MM-DD HH:mm:ss';
```

[packages/viewer/src/table/cell/DateTimeCell.tsx:78](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/DateTimeCell.tsx#L78)

### ImageCell {#api-ImageCell}

```ts
export function ImageCell<RecordType = any>(
  props: ImageCellProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/ImageCell.tsx:148](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ImageCell.tsx#L148)

### IMAGE_CELL_TYPE {#api-IMAGE_CELL_TYPE}

```ts
declare const IMAGE_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/ImageCell.tsx:39](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ImageCell.tsx#L39)

### ImageCellProps {#api-ImageCellProps}

```ts
export interface ImageCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  ImageProps
> {}
```

[packages/viewer/src/table/cell/ImageCell.tsx:70](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ImageCell.tsx#L70)

### ImageGroupCell {#api-ImageGroupCell}

```ts
export function ImageGroupCell<RecordType = any>(
  props: ImageGroupCellProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/ImageGroupCell.tsx:149](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ImageGroupCell.tsx#L149)

### IMAGE_GROUP_CELL_TYPE {#api-IMAGE_GROUP_CELL_TYPE}

```ts
declare const IMAGE_GROUP_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/ImageGroupCell.tsx:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ImageGroupCell.tsx#L40)

### ImageGroupCellProps {#api-ImageGroupCellProps}

```ts
export interface ImageGroupCellProps<RecordType = any> extends CellProps<
  string[],
  RecordType,
  PreviewGroupProps & Pick<ImageProps, 'alt'>
> {}
```

[packages/viewer/src/table/cell/ImageGroupCell.tsx:71](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/ImageGroupCell.tsx#L71)

### LinkCell {#api-LinkCell}

```ts
export function LinkCell<RecordType = any>(
  props: LinkCellProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/LinkCell.tsx:142](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/LinkCell.tsx#L142)

### LINK_CELL_TYPE {#api-LINK_CELL_TYPE}

```ts
declare const LINK_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/LinkCell.tsx:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/LinkCell.tsx#L52)

### LinkCellProps {#api-LinkCellProps}

```ts
export interface LinkCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  LinkProps
> {}
```

[packages/viewer/src/table/cell/LinkCell.tsx:79](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/LinkCell.tsx#L79)

### PrimaryKeyCell {#api-PrimaryKeyCell}

```ts
export function PrimaryKeyCell<RecordType>(
  props: PrimaryKeyCellProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/PrimaryKeyCell.tsx:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/PrimaryKeyCell.tsx#L29)

### PRIMARY_KEY_CELL_TYPE {#api-PRIMARY_KEY_CELL_TYPE}

```ts
declare const PRIMARY_KEY_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/PrimaryKeyCell.tsx:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/PrimaryKeyCell.tsx#L19)

### PrimaryKeyCellProps {#api-PrimaryKeyCellProps}

```ts
export interface PrimaryKeyCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  Omit<LinkProps, 'onClick'> & {
    onClick?: (record: RecordType) => void;
  }
> {}
```

[packages/viewer/src/table/cell/PrimaryKeyCell.tsx:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/PrimaryKeyCell.tsx#L21)

### TagCell {#api-TagCell}

```ts
export function TagCell<RecordType = any>(
  props: TagCellProps<RecordType>,
): import('react').JSX.Element | null;
```

[packages/viewer/src/table/cell/TagCell.tsx:120](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TagCell.tsx#L120)

### TAG_CELL_TYPE {#api-TAG_CELL_TYPE}

```ts
declare const TAG_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/TagCell.tsx:36](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TagCell.tsx#L36)

### TagCellProps {#api-TagCellProps}

```ts
export interface TagCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  TagProps
> {}
```

[packages/viewer/src/table/cell/TagCell.tsx:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TagCell.tsx#L63)

### TagsCell {#api-TagsCell}

```ts
export function TagsCell<RecordType = any>(
  props: TagsCellProps<RecordType>,
): import('react').JSX.Element | null;
```

[packages/viewer/src/table/cell/TagsCell.tsx:149](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TagsCell.tsx#L149)

### TAGS_CELL_TYPE {#api-TAGS_CELL_TYPE}

```ts
declare const TAGS_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/TagsCell.tsx:41](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TagsCell.tsx#L41)

### TagsCellProps {#api-TagsCellProps}

```ts
export interface TagsCellProps<RecordType = any> extends CellProps<
  string[],
  RecordType,
  Record<string, TagProps>
> {
  space?: SpaceProps;
}
```

[packages/viewer/src/table/cell/TagsCell.tsx:72](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TagsCell.tsx#L72)

### TextCell {#api-TextCell}

```ts
export function TextCell<RecordType = any>(
  props: TextCellProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/cell/TextCell.tsx:122](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TextCell.tsx#L122)

### TEXT_CELL_TYPE {#api-TEXT_CELL_TYPE}

```ts
declare const TEXT_CELL_TYPE: string;
```

[packages/viewer/src/table/cell/TextCell.tsx:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TextCell.tsx#L38)

### TextCellProps {#api-TextCellProps}

```ts
export interface TextCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  TextProps
> {}
```

[packages/viewer/src/table/cell/TextCell.tsx:64](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TextCell.tsx#L64)

### typedCellRender {#api-typedCellRender}

```ts
export function typedCellRender<RecordType = any, Attributes = any>(
  type: CellType,
  attributes?: Attributes,
): CellRenderer<RecordType> | undefined;
```

[packages/viewer/src/table/cell/TypedCell.tsx:117](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TypedCell.tsx#L117)

### CellType {#api-CellType}

```ts
export type CellType = string;
```

[packages/viewer/src/table/cell/TypedCell.tsx:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TypedCell.tsx#L31)

### CellRenderer {#api-CellRenderer}

```ts
export type CellRenderer<RecordType = any> = (
  value: any,
  record: RecordType,
  index: number,
) => React.ReactNode;
```

[packages/viewer/src/table/cell/TypedCell.tsx:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/TypedCell.tsx#L60)

### CellData {#api-CellData}

```ts
export interface CellData<ValueType = any, RecordType = any> {
  value: ValueType;
  record: RecordType;
  index: number;
}
```

[packages/viewer/src/table/cell/types.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/types.ts#L47)

### CellProps {#api-CellProps}

```ts
export interface CellProps<
  ValueType = any,
  RecordType = any,
  Attributes = any,
> extends AttributesCapable<Attributes> {
  data: CellData<ValueType, RecordType>;
}
```

[packages/viewer/src/table/cell/types.ts:100](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/types.ts#L100)

### CellComponent {#api-CellComponent}

```ts
export type CellComponent<
  ValueType = any,
  RecordType = any,
  Attributes = any,
> = React.FC<CellProps<ValueType, RecordType, Attributes>>;
```

[packages/viewer/src/table/cell/types.ts:147](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/types.ts#L147)

### parseDayjs {#api-parseDayjs}

```ts
export function parseDayjs(value: string | number | Date | Dayjs): Dayjs;
```

[packages/viewer/src/table/cell/utils.ts:17](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/utils.ts#L17)

### isNullOrUndefined {#api-isNullOrUndefined}

```ts
export function isNullOrUndefined(value: any): value is null | undefined;
```

[packages/viewer/src/table/cell/utils.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/utils.ts#L24)

### isValidImageSrc {#api-isValidImageSrc}

```ts
export function isValidImageSrc(value: any): value is string;
```

[packages/viewer/src/table/cell/utils.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/cell/utils.ts#L47)

### TableFieldItem {#api-TableFieldItem}

```ts
export function TableFieldItem(
  props: TableFieldItemProps,
): import('react').JSX.Element;
```

[packages/viewer/src/table/setting/TableFieldItem.tsx:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/setting/TableFieldItem.tsx#L69)

### TableFieldItemProps {#api-TableFieldItemProps}

```ts
export interface TableFieldItemProps {
  columnDefinition: FieldDefinition;
  fixed: boolean;
  hidden: boolean;
  onVisibleChange: (hidden: boolean) => void;
}
```

[packages/viewer/src/table/setting/TableFieldItem.tsx:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/setting/TableFieldItem.tsx#L47)

### TableSettingPanel {#api-TableSettingPanel}

```ts
export function TableSettingPanel(
  props: TableSettingPanelProps,
): React.JSX.Element;
```

[packages/viewer/src/table/setting/TableSettingPanel.tsx:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/setting/TableSettingPanel.tsx#L66)

### TableSettingPanelRef {#api-TableSettingPanelRef}

```ts
export interface TableSettingPanelRef {
  reset(): void;
}
```

[packages/viewer/src/table/setting/TableSettingPanel.tsx:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/setting/TableSettingPanel.tsx#L22)

### TableSettingPanelProps {#api-TableSettingPanelProps}

```ts
export interface TableSettingPanelProps extends RefAttributes<TableSettingPanelRef> {
  initialColumns: ViewColumn[];
  onChange?: (columns: ViewColumn[]) => void;
  fields: FieldDefinition[];
  className?: string;
}
```

[packages/viewer/src/table/setting/TableSettingPanel.tsx:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/setting/TableSettingPanel.tsx#L31)

### ColumnsCell {#api-ColumnsCell}

```ts
export interface ColumnsCell {
  type: string;
  attributes?: any;
}
```

[packages/viewer/src/table/types.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/types.ts#L20)

### ViewTableActionColumn {#api-ViewTableActionColumn}

```ts
export interface ViewTableActionColumn<RecordType = any> {
  title: string;
  dataIndex?: string;
  actions: (record: RecordType) => ActionsData<RecordType>;
}
```

[packages/viewer/src/table/types.ts:60](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/types.ts#L60)

### ViewTable {#api-ViewTable}

```ts
export function ViewTable<RecordType>(
  props: ViewTableProps<RecordType>,
): import('react').JSX.Element;
```

[packages/viewer/src/table/ViewTable.tsx:115](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/ViewTable.tsx#L115)

### ViewTableRef {#api-ViewTableRef}

```ts
export interface ViewTableRef {
  clearSelectedRowKeys: () => void;
  reset: () => void;
}
```

[packages/viewer/src/table/ViewTable.tsx:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/ViewTable.tsx#L44)

### ViewTableProps {#api-ViewTableProps}

```ts
export interface ViewTableProps<RecordType = any>
  extends
    AttributesCapable<Omit<TableProps<RecordType>, 'columns' | 'dataSource'>>,
    PrimaryKeyClickHandlerCapable<RecordType>,
    ViewTableSettingCapable,
    TableSizeCapable,
    RefAttributes<ViewTableRef> {
  fields: FieldDefinition[];
  columns: ViewColumn[];
  onColumnsChange?: (columns: ViewColumn[]) => void;
  actionColumn?: ViewTableActionColumn<RecordType>;
  dataSource: RecordType[];
  enableRowSelection: boolean;
  onSortChanged?: (sorter: SorterResult<RecordType>[]) => void;
  onSelectChange?: (items: RecordType[]) => void;
  viewTableSetting: false | ViewTableSetting;
  loading?: boolean;
}
```

[packages/viewer/src/table/ViewTable.tsx:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/ViewTable.tsx#L57)

### useViewTableState {#api-useViewTableState}

```ts
export function useViewTableState(): ViewTableStateReturn;
```

[packages/viewer/src/table/hooks/useViewTableState.ts:52](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/hooks/useViewTableState.ts#L52)

### ViewTableStateReturn {#api-ViewTableStateReturn}

```ts
export interface ViewTableStateReturn {
  selectedRowKeys: Key[];
  setSelectedRowKeys: (keys: Key[]) => void;
  reset: () => void;
  clearSelectedRowKeys: () => void;
}
```

[packages/viewer/src/table/hooks/useViewTableState.ts:21](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/table/hooks/useViewTableState.ts#L21)

## 相关专题

[模型与状态所有权](./models-and-state) · [View 与 Viewer 组合](./view-and-viewer) · [已保存视图面板与持久化回调](./saved-views) · [FetcherViewer 远端集成](./fetcher-viewer) · [过滤器与可编辑面板](./filters) · [注册表、输入与全屏按钮](./registries-and-inputs) · [工具栏、刷新与本地化](./toolbar-and-locale)
