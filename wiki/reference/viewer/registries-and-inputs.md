---
title: 'Registries, inputs and fullscreen button'
description: 'Registries, inputs and fullscreen button — @ahoo-wang/fetcher-viewer 5.0.0'
---

# Registries, inputs and fullscreen button

`TypedComponentRegistry<Type,Props>` stores React FunctionComponents by a type key. `create(entries = [])` constructs and registers entries. register throws for duplicates; get returns undefined when missing, unregister is a no-op for missing keys, clear empties the registry. types/entries return arrays and size/has inspect current state. Registries are mutable nonreactive objects; registering after a component renders does not itself force a rerender. Register application extensions once before rendering and unregister only registrations you own.

The singleton filterRegistry and cellRegistry share this contract. TypedFilter chooses filterRegistry and a fallback; typedCellRender uses cellRegistry and returns undefined on a miss. Replacing an existing registration requires unregister then register. Clearing a singleton removes built-ins for all consumers. Custom filter components must preserve FilterRef/getValue/getState/reset, not only draw an input.

| Input                        | Defaults, return and failure                                                                                                                                                                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NumberRange                  | value controls when !== undefined, otherwise defaultValue initializes local state. Scalar becomes [value,undefined]; onChange returns a two-slot array. min/max/precision pass to InputNumber; start/end constrain each other. Clearing emits undefined for that slot. |
| TagInput&lt;T&gt;            | tags Select with closed popup; comma, Chinese comma, semicolons and space delimit tokens; allowClear true. serializer defaults identity string serializer; onChange returns T[].                                                                                       |
| NumberTagValueItemSerializer | toString on serialize, parseFloat on deserialize; may produce NaN, does not perform validation.                                                                                                                                                                        |
| RemoteSelect                 | Required search(text): Promise&lt;Option[]&gt;; debounce defaults 300ms, leading false/trailing true. Initial options [], additionalOptions [], uniqueKey value.                                                                                                       |
| Fullscreen                   | Standalone Ant Design button using useFullscreen, optional target and enterIcon/exitIcon; it does not provide fullscreen context.                                                                                                                                      |

RemoteSelect merges result (or initial options) before additionalOptions, keeps the first duplicate key, and disables local text filtering. It empties displayed options while loading. After a result exists, an empty trimmed search is ignored. Hook state suppresses stale results, but search has no controller argument: the component cannot guarantee physical cancellation of your request. Default executor handling absorbs failures; no explicit search-error UI is exposed, so implement notification in search if needed. Unmount clears the debounce timer and invalidates execution state. Stable option arrays avoid unnecessary recomputation.

Input callbacks and serializers may throw and are not globally caught. Browser fullscreen permission failures remain rejecting promises from the React fullscreen hook. See [input stories](https://github.com/Ahoo-Wang/fetcher/blob/main/stories/viewer/Inputs.stories.tsx#L1).

## Complete example

```tsx
import { RemoteSelect, NumberRange } from '@ahoo-wang/fetcher-viewer';
const choices = [
  { label: 'Ada', value: '1' },
  { label: 'Grace', value: '2' },
];
export function Inputs() {
  return (
    <section>
      <RemoteSelect
        aria-label="User"
        search={async text =>
          choices.filter(choice =>
            choice.label.toLowerCase().includes(text.toLowerCase()),
          )
        }
      />
      <NumberRange
        min={0}
        max={100}
        defaultValue={[10, 20]}
        onChange={range => console.log(range)}
      />
    </section>
  );
}
```

## Public signatures and types

These signatures follow declarations reachable from the current root entry. `?` marks optional input; generics/interfaces only constrain compile-time types. Locate inherited and related types through the [symbol index](./index#public-symbols). Runtime defaults and failure behavior are described above.

### TagInput {#api-TagInput}

```ts
export function TagInput<ValueItemType = string[]>(
  props: TagInputProps<ValueItemType>,
): import('react').JSX.Element;
```

[packages/viewer/src/components/TagInput.tsx:69](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/TagInput.tsx#L69)

```ts
TagInput;
```

[packages/viewer/src/components/TagInput.tsx:109](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/TagInput.tsx#L109)

### TagValueItemSerializer {#api-TagValueItemSerializer}

```ts
export interface TagValueItemSerializer<ValueItemType = string> {
  serialize(value: ValueItemType[]): string[];
  deserialize(value: string[]): ValueItemType[];
}
```

[packages/viewer/src/components/TagInput.tsx:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/TagInput.tsx#L19)

### StringTagValueItemSerializer {#api-StringTagValueItemSerializer}

```ts
declare const StringTagValueItemSerializer: TagValueItemSerializer<string>;
```

[packages/viewer/src/components/TagInput.tsx:25](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/TagInput.tsx#L25)

### NumberTagValueItemSerializer {#api-NumberTagValueItemSerializer}

```ts
declare const NumberTagValueItemSerializer: TagValueItemSerializer<number>;
```

[packages/viewer/src/components/TagInput.tsx:34](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/TagInput.tsx#L34)

### TagInputProps {#api-TagInputProps}

```ts
export interface TagInputProps<ValueItemType = string> extends Omit<
  SelectProps,
  'mode' | 'open' | 'suffixIcon' | 'onChange' | 'value'
> {
  ref?: RefObject<RefSelectProps>;
  serializer?: TagValueItemSerializer<ValueItemType>;
  onChange?: (value: ValueItemType[]) => void;
  value?: Optional<ValueItemType | ValueItemType[]>;
}
```

[packages/viewer/src/components/TagInput.tsx:47](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/TagInput.tsx#L47)

### NumberRange {#api-NumberRange}

```ts
export function NumberRange(
  props: NumberRangeProps,
): import('react').JSX.Element;
```

[packages/viewer/src/components/NumberRange.tsx:40](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/NumberRange.tsx#L40)

### NumberRangeProps {#api-NumberRangeProps}

```ts
export interface NumberRangeProps {
  value?: number | NumberRangeValue;
  defaultValue?: number | NumberRangeValue;
  min?: number;
  max?: number;
  precision?: number;
  placeholder?: string[];
  onChange?: (value: NumberRangeValue) => void;
}
```

[packages/viewer/src/components/NumberRange.tsx:19](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/NumberRange.tsx#L19)

### RemoteSelect {#api-RemoteSelect}

```ts
export function RemoteSelect<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>(props: RemoteSelectProps<ValueType, OptionType>): import('react').JSX.Element;
```

[packages/viewer/src/components/RemoteSelect.tsx:118](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L118)

```ts
RemoteSelect;
```

[packages/viewer/src/components/RemoteSelect.tsx:175](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L175)

### RemoteSelectProps {#api-RemoteSelectProps}

```ts
export interface RemoteSelectProps<
  ValueType = any,
  OptionType extends BaseOptionType | DefaultOptionType = DefaultOptionType,
>
  extends
    Omit<SelectProps<ValueType, OptionType>, 'loading' | 'onSearch'>,
    RefAttributes<RefSelectProps>,
    StyleCapable {
  debounce?: UseDebouncedCallbackOptions;
  search: (search: string) => Promise<OptionType[]>;
  options?: OptionType[];
  uniqueKey?: string;
  additionalOptions?: OptionType[];
}
```

[packages/viewer/src/components/RemoteSelect.tsx:29](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/RemoteSelect.tsx#L29)

### Fullscreen {#api-Fullscreen}

```ts
export function Fullscreen(props: FullScreenProps): import('react').JSX.Element;
```

[packages/viewer/src/components/fullscreen/Fullscreen.tsx:42](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/fullscreen/Fullscreen.tsx#L42)

```ts
Fullscreen;
```

[packages/viewer/src/components/fullscreen/Fullscreen.tsx:63](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/fullscreen/Fullscreen.tsx#L63)

### FullScreenProps {#api-FullScreenProps}

```ts
export interface FullScreenProps extends Omit<
  ButtonProps,
  'icon' | 'onClick' | 'onChange' | 'target'
> {
  target?: RefObject<HTMLElement | null>;
  enterIcon?: ReactNode;
  exitIcon?: ReactNode;
}
```

[packages/viewer/src/components/fullscreen/Fullscreen.tsx:20](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/components/fullscreen/Fullscreen.tsx#L20)

### TypeCapable {#api-TypeCapable}

```ts
export interface TypeCapable<Type = string> {
  type: Type;
}
```

[packages/viewer/src/registry/componentRegistry.ts:22](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/registry/componentRegistry.ts#L22)

### TypedComponentRegistry {#api-TypedComponentRegistry}

```ts
export class TypedComponentRegistry<Type, Props> {
  get types(): Type[];
  get entries(): [Type, FunctionComponent<Props>][];
  get size(): number;
  has(type: Type): boolean;
  clear(): void;
  register(type: Type, component: FunctionComponent<Props>): void;
  unregister(type: Type): void;
  get(type: Type): FunctionComponent<Props> | undefined;
  static create<Type, Props>(
    components: [Type, FunctionComponent<Props>][] = [],
  ): TypedComponentRegistry<Type, Props>;
}
```

[packages/viewer/src/registry/componentRegistry.ts:37](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/src/registry/componentRegistry.ts#L37)

## Related topics

[Models and state ownership](./models-and-state) · [View and Viewer composition](./view-and-viewer) · [Saved-view panels and persistence callbacks](./saved-views) · [FetcherViewer remote integration](./fetcher-viewer) · [Filters and editable panels](./filters) · [Tables, columns and cells](./tables-and-cells) · [Toolbar, refresh and locale](./toolbar-and-locale)
