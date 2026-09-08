---
title: '注册表、输入与全屏按钮'
description: '注册表、输入与全屏按钮 — @ahoo-wang/fetcher-viewer 5.0.0'
---

# 注册表、输入与全屏按钮

`TypedComponentRegistry<Type,Props>` 按类型键存储 React FunctionComponent；create(entries = []) 创建并注册。register 遇到重复键抛错，get 缺失时 undefined，unregister 缺失键无操作，clear 清空。types/entries 返回数组，size/has 查询当前状态。注册表可变且不响应式，渲染后注册不会自动重渲染；扩展在渲染前注册一次，只退注册自己拥有的项。

单例 filterRegistry/cellRegistry 使用相同契约。TypedFilter 选择 filterRegistry 并提供回退，typedCellRender 使用 cellRegistry，缺失返回 undefined。替换已有项需要先 unregister 再 register；清空单例会移除所有消费者的内置项。自定义过滤器需保留 FilterRef/getValue/getState/reset 契约，不能只画输入框。

| 输入                         | 默认值、返回与失败                                                                                                                                                                  |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NumberRange                  | value !== undefined 时受控，否则 defaultValue 初始化本地值。单值变成 [value,undefined]，onChange 返回双槽数组；min/max/precision 传 InputNumber，起止相互约束，清空槽为 undefined。 |
| TagInput&lt;T&gt;            | 关闭弹层的 tags Select，逗号/中文逗号/分号/中文分号/空格分词；allowClear true；默认字符串恒等 serializer，onChange 返回 T[]。                                                       |
| NumberTagValueItemSerializer | serialize 用 toString，deserialize 用 parseFloat，可能生成 NaN，不做校验。                                                                                                          |
| RemoteSelect                 | 必填 search(text): Promise&lt;Option[]&gt;，默认防抖 300ms、leading false/trailing true，初始 options []、additionalOptions []、uniqueKey value。                                   |
| Fullscreen                   | 使用 useFullscreen 的独立 Ant Design 按钮，可传 target、enterIcon/exitIcon，不提供 fullscreen context。                                                                             |

RemoteSelect 将 result（没有时用初始 options）放在 additionalOptions 前，重复键保留首项，禁用本地文本过滤，loading 时清空显示选项。已有 result 后忽略 trim 为空的搜索。Hook 丢弃旧结果，但 search 没有 controller 参数，不能保证物理取消请求。默认执行器吸收失败，没有专门搜索错误 UI，需要时由 search 报告。卸载清除定时器并作废执行状态。稳定数组避免无谓重算。

输入回调/serializer 可以抛错，不被统一捕获。浏览器全屏权限失败仍通过 React Hook 的 promise 拒绝。见 [输入 stories](https://github.com/Ahoo-Wang/fetcher/blob/main/stories/viewer/Inputs.stories.tsx#L1)。

## 完整示例

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

## 公开签名与类型

以下签名按当前根入口可达声明核对。`?` 表示可省略；泛型/接口只约束编译期，继承项与关联类型可从 [符号索引](./symbols) 定位。运行时默认值和失败行为以本页上文为准。

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

## 相关专题

[模型与状态所有权](./models-and-state) · [View 与 Viewer 组合](./view-and-viewer) · [已保存视图面板与持久化回调](./saved-views) · [FetcherViewer 远端集成](./fetcher-viewer) · [过滤器与可编辑面板](./filters) · [表格、列与单元格](./tables-and-cells) · [工具栏、刷新与本地化](./toolbar-and-locale)
