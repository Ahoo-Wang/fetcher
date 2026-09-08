---
title: 'Filters and editable panels'
description: 'Filters and editable panels — @ahoo-wang/fetcher-viewer 5.0.0'
---

# Filters and editable panels

Viewer filters currently produce legacy Wow Condition objects. They do not emit the new FilterExpression format. A FilterValue wraps `{condition}`, while a FilterState retains the UI operator and raw value even when that value is not a valid query.

| Component / type key      | Operators / default                                                                                                                                         |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TextFilter / text         | EQ (default), NE, CONTAINS, STARTS_WITH, ENDS_WITH, IN, NOT_IN.                                                                                             |
| IdFilter / id             | ID (default), IDS; single/array conversion on operator switch.                                                                                              |
| NumberFilter / number     | EQ (default), NE, GT, LT, GTE, LTE, BETWEEN, IN, NOT_IN; switches scalar/range/tag input.                                                                   |
| SelectFilter / select     | IN (default), NOT_IN; multiple selection, options in value props.                                                                                           |
| BoolFilter / bool         | ExtendedOperator.UNDEFINED (default), TRUE, FALSE; no value input.                                                                                          |
| TypedFilter type datetime | Built-in date implementation registered under datetime; use this dispatcher because DateTimeFilter and its converters are not root exports.                 |
| AssemblyFilter            | Required supportedOperators; optional operator.supportedOperators overrides. Empty list throws; valid supplied defaultValue wins, otherwise first operator. |

`FilterProps` requires field `{name,label}`; optional operator/value supply UI options/defaultValue, conditionOptions passes legacy query options, ref exposes getValue/getState/reset, onChange receives FilterValue or undefined. `useFilterState` initializes operator/value and does not make them controlled on every prop change. Its setters convert/validate/parse then notify. ExtendedOperator.UNDEFINED yields no condition. Default validation rejects null/undefined/empty strings/empty arrays, accepts EMPTY_VALUE_OPERATORS without a value, and requires exactly two non-null bounds for BETWEEN. NumberFilter uses its own looser numeric-input validation. isValidValue only rejects null/undefined; it is not a finite-number validator. Supply trust-boundary validation separately.

FilterPanel collects each child ref and combines valid conditions with legacy and(...); no valid children produces all(). Search invokes onSearch(condition, conditionMap, stateMap). Reset resets child values without implicitly searching. Enter searches except during IME composition. resetButton defaults visible; false hides it. EditableFilterPanel adds/removes filter definitions, calls onChange(activeFilters), and synchronizes when the filters prop reference changes. AvailableFilterSelect returns newly selected available filters, excluding already active keys. Modal open/close is parent-owned.

The datetime dispatcher uses milliseconds for ordinary dates, before-today local HH:mm:ss text, and integer days for relative-day operators. A midnight range end is expanded to end of day. Invalid/disabled values are omitted rather than sent as an error condition. FallbackFilter displays an unsupported-type message. None of these components fetch data by themselves. For customization see [registries](./registries-and-inputs).

## Complete example

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

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./index#public-symbols). Runtime defaults and failure behavior are described above.

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

## Related topics

[Models and state ownership](./models-and-state) · [View and Viewer composition](./view-and-viewer) · [Saved-view panels and persistence callbacks](./saved-views) · [FetcherViewer remote integration](./fetcher-viewer) · [Tables, columns and cells](./tables-and-cells) · [Registries, inputs and fullscreen button](./registries-and-inputs) · [Toolbar, refresh and locale](./toolbar-and-locale)
