---
title: '过滤器与可编辑面板'
description: '过滤器与可编辑面板 — @ahoo-wang/fetcher-viewer 5.0.0'
---

# 过滤器与可编辑面板

Viewer 过滤器目前生成旧 Wow Condition，不生成新 FilterExpression。FilterValue 包装 `{condition}`；FilterState 保留 UI operator 和原始 value，即使当前值不是有效查询。

| 组件 / 类型键             | 操作符 / 默认值                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| TextFilter / text         | 默认 EQ，另有 NE、CONTAINS、STARTS_WITH、ENDS_WITH、IN、NOT_IN。                                                     |
| IdFilter / id             | 默认 ID，另有 IDS，切换时转换单值/数组。                                                                             |
| NumberFilter / number     | 默认 EQ，另有 NE、GT、LT、GTE、LTE、BETWEEN、IN、NOT_IN，切换单值/范围/tag 输入。                                    |
| SelectFilter / select     | 默认 IN，另有 NOT_IN，多选，options 放 value props。                                                                 |
| BoolFilter / bool         | 默认 ExtendedOperator.UNDEFINED，另有 TRUE/FALSE，无值输入。                                                         |
| TypedFilter type datetime | 内置日期实现注册在 datetime；DateTimeFilter 及其转换器不是根导出，使用此分发器。                                     |
| AssemblyFilter            | 必填 supportedOperators，可被 operator.supportedOperators 覆盖。空列表抛错；合法 defaultValue 优先，否则用首操作符。 |

FilterProps 要求 field `{name,label}`；operator/value 可提供 UI 参数/defaultValue，conditionOptions 传旧查询选项，ref 暴露 getValue/getState/reset，onChange 接收 FilterValue 或 undefined。useFilterState 初始化 operator/value，不会每次 prop 变化都变成受控值；setter 先转换/校验/解析再通知。ExtendedOperator.UNDEFINED 不生成条件。默认校验拒绝 null/undefined/空字符串/空数组，对 EMPTY_VALUE_OPERATORS 接受无值，BETWEEN 要求恰好两个非空边界。NumberFilter 使用较宽松的自身数值输入校验。isValidValue 仅拒绝 null/undefined，不校验有限数值；信任边界校验需另行提供。

FilterPanel 收集子 ref，用旧 and(...) 组合有效条件，无有效子项时为 all()。Search 调用 onSearch(condition, conditionMap, stateMap)。Reset 只重置子值，不隐式搜索；Enter 搜索，但 IME 组合期间除外。resetButton 默认显示，false 隐藏。EditableFilterPanel 增删定义、调用 onChange(activeFilters)，filters 引用改变时同步。AvailableFilterSelect 返回新选中可用项，排除已有 active key。Modal open/close 归父级。

datetime 分发器对普通日期使用毫秒，before-today 使用本地 HH:mm:ss 文本，相对天数使用整数。范围末端恰为零点时扩展为当天结束。无效/禁用值会省略，不作为错误条件发送。FallbackFilter 显示不支持类型提示。组件本身不请求数据；定制见 [注册表](./registries-and-inputs)。

## 完整示例

```tsx
import { FilterPanel } from '@ahoo-wang/fetcher-viewer';
import type { ActiveFilter } from '@ahoo-wang/fetcher-viewer';
import { Operator } from '@ahoo-wang/fetcher-wow';
const filters: ActiveFilter[] = [
  {
    key: 'name',
    type: 'text',
    field: { name: 'state.name', label: 'Name' },
    operator: { defaultValue: Operator.CONTAINS },
    value: { defaultValue: 'Ada' },
  },
];
export function SearchPanel() {
  return (
    <FilterPanel
      filters={filters}
      onSearch={condition => console.log(condition)}
    />
  );
}
```

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./index#public-symbols) 定位。运行时默认值和失败行为以本页上文为准。

### OPERATOR_zh_CN {#api-OPERATOR_zh_CN}

```ts
declare const OPERATOR_zh_CN: SelectOperatorLocale;
```

[packages/viewer/src/filter/operator/locale/operator.zh_CN.ts:16](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/operator/locale/operator.zh_CN.ts#L16)

### ExtendedOperator {#api-ExtendedOperator}

```ts
export enum ExtendedOperator {
  UNDEFINED = 'UNDEFINED',
}
```

[packages/viewer/src/filter/operator/types.ts:16](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/operator/types.ts#L16)

### SelectOperator {#api-SelectOperator}

```ts
export type SelectOperator = ExtendedOperator | Operator;
```

[packages/viewer/src/filter/operator/types.ts:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/operator/types.ts#L20)

### SelectOperatorLocale {#api-SelectOperatorLocale}

```ts
export type SelectOperatorLocale = {
  [K in Operator]: string;
} & {
  [K in ExtendedOperator]: string;
};
```

[packages/viewer/src/filter/operator/types.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/operator/types.ts#L22)

### AvailableFilterSelect {#api-AvailableFilterSelect}

```ts
export function AvailableFilterSelect(
  props: AvailableFilterSelectProps,
): import('react').JSX.Element;
```

[packages/viewer/src/filter/panel/AvailableFilterSelect.tsx:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/AvailableFilterSelect.tsx#L57)

### AvailableFilter {#api-AvailableFilter}

```ts
export interface AvailableFilter extends AttributesCapable {
  key: Key;
  field: FilterField;
  component: FilterType;
  value?: FilterValueProps;
  operator?: FilterOperatorProps;
  conditionOptions?: ConditionOptions;
}
```

[packages/viewer/src/filter/panel/AvailableFilterSelect.tsx:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/AvailableFilterSelect.tsx#L31)

### AvailableFilterGroup {#api-AvailableFilterGroup}

```ts
export interface AvailableFilterGroup {
  label: string;
  filters: AvailableFilter[];
}
```

[packages/viewer/src/filter/panel/AvailableFilterSelect.tsx:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/AvailableFilterSelect.tsx#L40)

### AvailableFilterSelectRef {#api-AvailableFilterSelectRef}

```ts
export interface AvailableFilterSelectRef {
  getValue(): AvailableFilter[];
}
```

[packages/viewer/src/filter/panel/AvailableFilterSelect.tsx:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/AvailableFilterSelect.tsx#L45)

### AvailableFilterSelectProps {#api-AvailableFilterSelectProps}

```ts
export interface AvailableFilterSelectProps
  extends StyleCapable, RefAttributes<AvailableFilterSelectRef> {
  filters: AvailableFilterGroup[];
  activeFilters?: ActiveFilter[];
}
```

[packages/viewer/src/filter/panel/AvailableFilterSelect.tsx:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/AvailableFilterSelect.tsx#L49)

### AvailableFilterSelectModal {#api-AvailableFilterSelectModal}

```ts
export function AvailableFilterSelectModal(
  props: AvailableFiltersModalProps,
): React.JSX.Element;
```

[packages/viewer/src/filter/panel/AvailableFilterSelectModal.tsx:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/AvailableFilterSelectModal.tsx#L29)

### AvailableFiltersModalProps {#api-AvailableFiltersModalProps}

```ts
export interface AvailableFiltersModalProps extends Omit<ModalProps, 'onOk'> {
  availableFilters: Omit<AvailableFilterSelectProps, 'ref'>;
  onSave?: (filters: AvailableFilter[]) => void;
}
```

[packages/viewer/src/filter/panel/AvailableFilterSelectModal.tsx:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/AvailableFilterSelectModal.tsx#L24)

### EditableFilterPanel {#api-EditableFilterPanel}

```ts
export function EditableFilterPanel(
  props: EditableFilterPanelProps,
): React.JSX.Element;
```

[packages/viewer/src/filter/panel/EditableFilterPanel.tsx:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/EditableFilterPanel.tsx#L35)

### EditableFilterPanelProps {#api-EditableFilterPanelProps}

```ts
export interface EditableFilterPanelProps extends Omit<
  FilterPanelProps,
  'actions'
> {
  availableFilters: AvailableFilterGroup[];
  onChange?: (filters: ActiveFilter[]) => void;
}
```

[packages/viewer/src/filter/panel/EditableFilterPanel.tsx:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/EditableFilterPanel.tsx#L27)

### FilterPanel {#api-FilterPanel}

```ts
export function FilterPanel(props: FilterPanelProps): React.JSX.Element;
```

[packages/viewer/src/filter/panel/FilterPanel.tsx:92](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/FilterPanel.tsx#L92)

### ActiveFilter {#api-ActiveFilter}

```ts
export interface ActiveFilter extends Omit<
  TypedFilterProps,
  'onChange' | 'ref'
> {
  key: Key;
  onRemove?: () => void;
}
```

[packages/viewer/src/filter/panel/FilterPanel.tsx:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/FilterPanel.tsx#L29)

### FilterPanelConditionCapableRef {#api-FilterPanelConditionCapableRef}

```ts
export interface FilterPanelConditionCapableRef {
  getCondition(): Condition | undefined;
}
```

[packages/viewer/src/filter/panel/FilterPanel.tsx:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/FilterPanel.tsx#L37)

### FilterPanelRef {#api-FilterPanelRef}

```ts
export interface FilterPanelRef extends FilterPanelConditionCapableRef {
  search(): void;
  reset(): void;
}
```

[packages/viewer/src/filter/panel/FilterPanel.tsx:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/FilterPanel.tsx#L47)

### FilterPanelProps {#api-FilterPanelProps}

```ts
export interface FilterPanelProps extends RefAttributes<FilterPanelRef> {
  row?: RowProps;
  col?: ColProps;
  actionsCol?: ColProps;
  filters: ActiveFilter[];
  actions?: React.ReactNode;
  onSearch?: (
    finalCondition: Condition,
    activeFilterValues: Map<Key, Condition>,
    filterStates: Map<Key, FilterState>,
  ) => void;
  resetButton?: boolean | Omit<ButtonProps, 'onClick'>;
  searchButton?: Omit<ButtonProps, 'onClick'>;
}
```

[packages/viewer/src/filter/panel/FilterPanel.tsx:61](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/FilterPanel.tsx#L61)

### RemovableTypedFilter {#api-RemovableTypedFilter}

```ts
export function RemovableTypedFilter(
  props: RemovableTypedFilterProps,
): React.JSX.Element;
```

[packages/viewer/src/filter/panel/RemovableTypedFilter.tsx:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/RemovableTypedFilter.tsx#L26)

### RemovableTypedFilterProps {#api-RemovableTypedFilterProps}

```ts
export interface RemovableTypedFilterProps extends TypedFilterProps {
  onRemove?: () => void;
}
```

[packages/viewer/src/filter/panel/RemovableTypedFilter.tsx:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/panel/RemovableTypedFilter.tsx#L22)

### AssemblyFilter {#api-AssemblyFilter}

```ts
export function AssemblyFilter({
  ref,
  ...props
}: AssemblyFilterProps): import('react').JSX.Element;
```

[packages/viewer/src/filter/AssemblyFilter.tsx:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/AssemblyFilter.tsx#L45)

### ValueInputRender {#api-ValueInputRender}

```ts
export type ValueInputRender = (
  filterState: UseFilterStateReturn,
) => ReactNode | null;
```

[packages/viewer/src/filter/AssemblyFilter.tsx:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/AssemblyFilter.tsx#L30)

### AssemblyFilterProps {#api-AssemblyFilterProps}

```ts
export interface AssemblyFilterProps<
  ValuePropsType extends FilterValueProps = FilterValueProps,
> extends FilterProps<ValuePropsType> {
  supportedOperators: SelectOperator[];
  onOperatorChangeValueConverter?: OnOperatorChangeValueConverter;
  validate?: ValidateValue;
  conditionValueParser?: ConditionValueParser;
  filterValueConverter?: FilterValueConverter;
  valueInputRender?: ValueInputRender;
}
```

[packages/viewer/src/filter/AssemblyFilter.tsx:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/AssemblyFilter.tsx#L34)

### BoolFilter {#api-BoolFilter}

```ts
export function BoolFilter(props: FilterProps): import('react').JSX.Element;
```

[packages/viewer/src/filter/BoolFilter.tsx:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/BoolFilter.tsx#L28)

```ts
BoolFilter;
```

[packages/viewer/src/filter/BoolFilter.tsx:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/BoolFilter.tsx#L42)

### BOOL_FILTER {#api-BOOL_FILTER}

```ts
declare const BOOL_FILTER: 'bool';
```

[packages/viewer/src/filter/BoolFilter.tsx:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/BoolFilter.tsx#L22)

### FallbackFilter {#api-FallbackFilter}

```ts
export function FallbackFilter({
  type,
  ref,
}: TypedFilterProps): React.JSX.Element;
```

[packages/viewer/src/filter/FallbackFilter.tsx:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/FallbackFilter.tsx#L20)

```ts
FallbackFilter;
```

[packages/viewer/src/filter/FallbackFilter.tsx:44](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/FallbackFilter.tsx#L44)

### filterRegistry {#api-filterRegistry}

```ts
declare const filterRegistry: TypedComponentRegistry<
  string,
  FilterProps<import('./types').FilterValueProps>
>;
```

[packages/viewer/src/filter/filterRegistry.ts:73](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/filterRegistry.ts#L73)

### IdFilter {#api-IdFilter}

```ts
export function IdFilter(props: FilterProps): import('react').JSX.Element;
```

[packages/viewer/src/filter/IdFilter.tsx:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/IdFilter.tsx#L48)

```ts
IdFilter;
```

[packages/viewer/src/filter/IdFilter.tsx:73](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/IdFilter.tsx#L73)

### ID_FILTER {#api-ID_FILTER}

```ts
declare const ID_FILTER: 'id';
```

[packages/viewer/src/filter/IdFilter.tsx:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/IdFilter.tsx#L25)

### IdOnOperatorChangeValueConverter {#api-IdOnOperatorChangeValueConverter}

```ts
declare const IdOnOperatorChangeValueConverter: OnOperatorChangeValueConverter;
```

[packages/viewer/src/filter/IdFilter.tsx:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/IdFilter.tsx#L27)

### NumberFilter {#api-NumberFilter}

```ts
export function NumberFilter(props: FilterProps): import('react').JSX.Element;
```

[packages/viewer/src/filter/NumberFilter.tsx:67](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/NumberFilter.tsx#L67)

```ts
NumberFilter;
```

[packages/viewer/src/filter/NumberFilter.tsx:141](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/NumberFilter.tsx#L141)

### NUMBER_FILTER {#api-NUMBER_FILTER}

```ts
declare const NUMBER_FILTER: 'number';
```

[packages/viewer/src/filter/NumberFilter.tsx:26](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/NumberFilter.tsx#L26)

### NumberOnOperatorChangeValueConverter {#api-NumberOnOperatorChangeValueConverter}

```ts
declare const NumberOnOperatorChangeValueConverter: OnOperatorChangeValueConverter;
```

[packages/viewer/src/filter/NumberFilter.tsx:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/NumberFilter.tsx#L49)

### SelectFilter {#api-SelectFilter}

```ts
export function SelectFilter(
  props: FilterProps<SelectFilterValueProps>,
): import('react').JSX.Element;
```

[packages/viewer/src/filter/SelectFilter.tsx:48](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/SelectFilter.tsx#L48)

```ts
SelectFilter;
```

[packages/viewer/src/filter/SelectFilter.tsx:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/SelectFilter.tsx#L69)

### SELECT_FILTER {#api-SELECT_FILTER}

```ts
declare const SELECT_FILTER: 'select';
```

[packages/viewer/src/filter/SelectFilter.tsx:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/SelectFilter.tsx#L25)

### SelectFilterValueProps {#api-SelectFilterValueProps}

```ts
export interface SelectFilterValueProps
  extends
    FilterValueProps,
    Omit<
      SelectProps,
      | 'defaultValue'
      | 'mode'
      | 'value'
      | 'allowClear'
      | 'onChange'
      | 'placeholder'
    > {}
```

[packages/viewer/src/filter/SelectFilter.tsx:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/SelectFilter.tsx#L27)

### SelectOnOperatorChangeValueConverter {#api-SelectOnOperatorChangeValueConverter}

```ts
declare const SelectOnOperatorChangeValueConverter: OnOperatorChangeValueConverter;
```

[packages/viewer/src/filter/SelectFilter.tsx:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/SelectFilter.tsx#L40)

### TextFilter {#api-TextFilter}

```ts
export function TextFilter(props: FilterProps): import('react').JSX.Element;
```

[packages/viewer/src/filter/TextFilter.tsx:53](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TextFilter.tsx#L53)

```ts
TextFilter;
```

[packages/viewer/src/filter/TextFilter.tsx:97](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TextFilter.tsx#L97)

### TEXT_FILTER {#api-TEXT_FILTER}

```ts
declare const TEXT_FILTER: 'text';
```

[packages/viewer/src/filter/TextFilter.tsx:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TextFilter.tsx#L25)

### TextOnOperatorChangeValueConverter {#api-TextOnOperatorChangeValueConverter}

```ts
declare const TextOnOperatorChangeValueConverter: OnOperatorChangeValueConverter;
```

[packages/viewer/src/filter/TextFilter.tsx:27](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TextFilter.tsx#L27)

### TypedFilter {#api-TypedFilter}

```ts
export function TypedFilter(
  props: TypedFilterProps,
): React.FunctionComponentElement<TypedFilterProps>;
```

[packages/viewer/src/filter/TypedFilter.tsx:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TypedFilter.tsx#L30)

```ts
TypedFilter;
```

[packages/viewer/src/filter/TypedFilter.tsx:45](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TypedFilter.tsx#L45)

### FilterType {#api-FilterType}

```ts
export type FilterType = string;
```

[packages/viewer/src/filter/TypedFilter.tsx:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TypedFilter.tsx#L20)

### TypedFilterProps {#api-TypedFilterProps}

```ts
export interface TypedFilterProps
  extends FilterProps, TypeCapable<FilterType> {}
```

[packages/viewer/src/filter/TypedFilter.tsx:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/TypedFilter.tsx#L22)

### FilterField {#api-FilterField}

```ts
export interface FilterField extends NamedCapable {
  label: string;
  type?: string;
  format?: string;
}
```

[packages/viewer/src/filter/types.ts:28](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L28)

### FilterRef {#api-FilterRef}

```ts
export interface FilterRef {
  getValue(): FilterValue | undefined;
  getState(): FilterState;
  reset(): void;
}
```

[packages/viewer/src/filter/types.ts:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L34)

### FilterState {#api-FilterState}

```ts
export interface FilterState {
  operator: SelectOperator;
  value: Optional;
}
```

[packages/viewer/src/filter/types.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L42)

### FilterLabelProps {#api-FilterLabelProps}

```ts
export interface FilterLabelProps extends StyleCapable {}
```

[packages/viewer/src/filter/types.ts:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L47)

### FilterOperatorProps {#api-FilterOperatorProps}

```ts
export interface FilterOperatorProps extends Omit<
  SelectProps<SelectOperator>,
  'value' | 'options' | 'mode'
> {
  locale?: SelectOperatorLocale;
  supportedOperators?: SelectOperator[];
}
```

[packages/viewer/src/filter/types.ts:49](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L49)

### FilterValueProps {#api-FilterValueProps}

```ts
export interface FilterValueProps extends StyleCapable {
  defaultValue?: any;
  placeholder?: string;
  [key: string]: any;
}
```

[packages/viewer/src/filter/types.ts:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L57)

### FilterValue {#api-FilterValue}

```ts
export interface FilterValue extends ConditionCapable {}
```

[packages/viewer/src/filter/types.ts:64](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L64)

### FilterProps {#api-FilterProps}

```ts
export interface FilterProps<
  ValuePropsType extends FilterValueProps = FilterValueProps,
>
  extends AttributesCapable, RefAttributes<FilterRef>, StyleCapable {
  field: FilterField;
  label?: FilterLabelProps;
  operator?: FilterOperatorProps | null;
  value?: ValuePropsType | null;
  onChange?: (value?: FilterValue) => void;
  conditionOptions?: ConditionOptions;
}
```

[packages/viewer/src/filter/types.ts:66](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L66)

### FilterComponent {#api-FilterComponent}

```ts
export type FilterComponent = React.FunctionComponent<FilterProps>;
```

[packages/viewer/src/filter/types.ts:78](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/types.ts#L78)

### useFilterState {#api-useFilterState}

```ts
export function useFilterState(
  options: UseFilterStateOptions,
): UseFilterStateReturn;
```

[packages/viewer/src/filter/useFilterState.ts:101](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L101)

### OnOperatorChangeValueConverter {#api-OnOperatorChangeValueConverter}

```ts
export type OnOperatorChangeValueConverter = (
  beforeOperator: SelectOperator,
  afterOperator: SelectOperator,
  value: Optional,
) => Optional;
```

[packages/viewer/src/filter/useFilterState.ts:24](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L24)

### OnChange {#api-OnChange}

```ts
export type OnChange = (condition: Optional<FilterValue>) => void;
```

[packages/viewer/src/filter/useFilterState.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L29)

### ValidateValue {#api-ValidateValue}

```ts
export type ValidateValue = (operator: Operator, value: Optional) => boolean;
```

[packages/viewer/src/filter/useFilterState.ts:30](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L30)

### ConditionValueParser {#api-ConditionValueParser}

```ts
export type ConditionValueParser = (
  operator: Operator,
  value: Optional,
) => Optional;
```

[packages/viewer/src/filter/useFilterState.ts:31](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L31)

### FilterValueConverter {#api-FilterValueConverter}

```ts
export type FilterValueConverter = (
  filterValue: FilterValue,
) => Optional<FilterValue>;
```

[packages/viewer/src/filter/useFilterState.ts:35](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L35)

### TrueValidateValue {#api-TrueValidateValue}

```ts
declare const TrueValidateValue: ValidateValue;
```

[packages/viewer/src/filter/useFilterState.ts:38](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L38)

### UseFilterStateOptions {#api-UseFilterStateOptions}

```ts
export interface UseFilterStateOptions extends RefAttributes<FilterRef> {
  field?: string;
  operator: SelectOperator;
  value: Optional;
  conditionOptions?: ConditionOptions;
  onOperatorChangeValueConverter?: OnOperatorChangeValueConverter;
  validate?: ValidateValue;
  conditionValueParser?: ConditionValueParser;
  filterValueConverter?: FilterValueConverter;
  onChange?: OnChange;
}
```

[packages/viewer/src/filter/useFilterState.ts:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L42)

### UseFilterStateReturn {#api-UseFilterStateReturn}

```ts
export interface UseFilterStateReturn {
  operator: SelectOperator;
  value: Optional;
  setOperator: (operator: SelectOperator) => void;
  setValue: (value: Optional) => void;
  reset: () => void;
}
```

[packages/viewer/src/filter/useFilterState.ts:54](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/useFilterState.ts#L54)

### isValidBetweenValue {#api-isValidBetweenValue}

```ts
export function isValidBetweenValue(value: any): boolean;
```

[packages/viewer/src/filter/utils.ts:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/utils.ts#L29)

### isValidValue {#api-isValidValue}

```ts
export function isValidValue(value: any): boolean;
```

[packages/viewer/src/filter/utils.ts:57](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/utils.ts#L57)

### currentTimeZone {#api-currentTimeZone}

```ts
export function currentTimeZone(): string;
```

[packages/viewer/src/filter/utils.ts:78](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/filter/utils.ts#L78)

## 相关专题

[模型与状态所有权](./models-and-state) · [View 与 Viewer 组合](./view-and-viewer) · [已保存视图面板与持久化回调](./saved-views) · [FetcherViewer 远端集成](./fetcher-viewer) · [表格、列与单元格](./tables-and-cells) · [注册表、输入与全屏按钮](./registries-and-inputs) · [工具栏、刷新与本地化](./toolbar-and-locale)
