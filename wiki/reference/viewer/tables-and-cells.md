---
title: 'Tables, columns and cells'
description: 'Tables, columns and cells — @ahoo-wang/fetcher-viewer 5.0.0'
---

# Tables, columns and cells

`ViewTable<RecordType>` maps FieldDefinition and ViewColumn to Ant Design columns and receives an array of records. It does not paginate/query the server. Required props are fields, columns, dataSource, enableRowSelection and viewTableSetting (false or settings); optional attributes forwards table props, tableSize defaults middle.

## Rendering and selection

Column names are dotted paths. Rendering priority is field.render, primary-key renderer, registered typed cell, then TextCell fallback. Field attributes are also spread onto the column and can override generated settings: use them deliberately. Primary keys/fixed columns pin to the start; action column pins to end. A table settings popover is attached to the action-column header only when both actionColumn and viewTableSetting are supplied. TableSettingPanel edits initialColumns and emits onChange; TableFieldItem is its row control. Neither persists configuration.

Selection keys are local to useViewTableState; clearSelectedRowKeys/reset clear the key array. ViewTableRef exposes those functions. onSelectChange receives selected records, onSortChanged receives an array of Ant Design sorter results only for sort actions. Changing dataSource does not automatically clear selection. mapToTableRecord chooses the primary key, existing key or row index. Table attributes are spread before fixed scroll/size/onChange props; those final settings remain implementation-owned.

## Cell contracts

All cells take `data: {value,record,index}` and optional renderer-specific attributes. `typedCellRender(type, attributes?)` returns a `(value,record,index) => ReactNode` function or undefined for unknown type. Built-ins are text, primary-key, action/actions, tag/tags, datetime, calendar-time, image/image-group, link, currency and avatar; use the exported *_CELL_TYPE values instead of guessing keys.

DateTimeCell defaults `YYYY-MM-DD HH:mm:ss`; invalid/missing dates render `-`. CalendarTimeCell builds a relative calendar formatter from DEFAULT_CALENDAR_FORMATS. formatCurrency accepts numbers/strings, uses Intl.NumberFormat, and defaults CNY/symbol/2 decimals/zh-CN/grouping true/fallback `-`. Nonfinite parsed input uses fallback; invalid Intl options can still throw. This is display formatting, not decimal-money arithmetic. ActionCell renders truthy data.value as a link button and passes the current record to attributes.onClick; ActionsCell combines primary and secondary actions. AvatarCell uses isValidImageSrc to choose an image versus initials/text; ImageCell only checks for an empty value, and ImageGroupCell checks for a nonempty array. None performs a network availability check. User render/actions are not caught by a universal error boundary.

| Cell               | Value / attributes / empty behavior                                                                                                                                                                      |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TextCell           | Stringified value; null, undefined and empty string render `-`; TextProps.children overrides display.                                                                                                    |
| PrimaryKeyCell     | Value is link text, copyable defaults true; attributes.onClick receives record.                                                                                                                          |
| TagCell / TagsCell | Blank tag renders nothing; tags uses a string array and attributes keyed by tag text, optional Space props.                                                                                              |
| LinkCell           | Email values get mailto; other values default target blank and rel noopener noreferrer. Explicit href wins; javascript/data/vbscript schemes become `#`. Caller-supplied target/rel remain caller-owned. |
| ImageCell          | Empty value renders Empty; ImageProps can override src and other image settings.                                                                                                                         |
| ImageGroupCell     | Empty/nonarray value renders Empty; first image is the preview, more than one adds a count badge; default alt is Preview image.                                                                          |
| AvatarCell         | Empty value renders an empty Avatar, valid source an image, other text initials; attributes can override native Avatar props.                                                                            |
| CurrencyCell       | format in attributes configures formatCurrency; children overrides formatted text.                                                                                                                       |
| CalendarTimeCell   | Default sameDay/nextDay/lastDay labels are Chinese today/tomorrow/yesterday with HH:mm; other dates use the full default date format.                                                                    |

Cell-specific props, CurrencyFormatOptions, CalendarFormats and all exact constants appear below. The component examples in [Cells.stories.tsx](https://github.com/Ahoo-Wang/fetcher/blob/main/stories/viewer/Cells.stories.tsx#L1) cover interactive rendering.

## Complete example

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

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./symbols). Runtime defaults and failure behavior are described above.

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

Implementation defaults: `options = DEFAULT_CURRENCY_FORMAT_OPTIONS`.

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

## Related topics

[Models and state ownership](./models-and-state) · [View and Viewer composition](./view-and-viewer) · [Saved-view panels and persistence callbacks](./saved-views) · [FetcherViewer remote integration](./fetcher-viewer) · [Filters and editable panels](./filters) · [Registries, inputs and fullscreen button](./registries-and-inputs) · [Toolbar, refresh and locale](./toolbar-and-locale)
