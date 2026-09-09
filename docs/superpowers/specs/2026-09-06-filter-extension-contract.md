# 自定义筛选器接口契约

状态：已定义并接入 `packages/view-engine`。本文规定现有非容器筛选器扩展，包含值编辑器和完整筛选器 UI；不新增筛选 DSL 或容器插件框架。

## 1. 责任边界

| 责任       | 扩展组件                                      | FilterPanel / 宿主                           |
| ---------- | --------------------------------------------- | -------------------------------------------- |
| UI 技术    | 任意 React 组件，可自研或使用任意组件库       | 默认 UI 使用 shadcn / Base UI                |
| 渲染范围   | `value` 仅值区域；`filter` 整个非容器组件主体 | 等宽布局、错误展示、模式与条件树结构         |
| 字段绑定   | 读取固定 `field`，不能改绑                    | 添加条件时绑定；拒绝其他字段和跨作用域输出   |
| 编辑       | 管理未完成的本地输入，发布合法节点            | 保存编辑缓冲、统一编译和能力校验             |
| 查询与保存 | 不通过编辑回调发起查询或保存                  | 点击查询才调用 `onApply`；宿主管理请求与保存 |
| 候选搜索   | 本地过滤或远程候选加载                        | 不把候选搜索词当作筛选条件                   |

完整组件不自动包裹默认 FieldFilter，也不要求使用 lib 的 Select/InputGroup。它负责自己的字段标签、操作和值输入、清空与移除入口以及可访问性。Panel 仍显示校验错误；组件使用 `errors` 和 `errorId` 关联自己的输入。

AND、OR、NOR、ELEMENT_MATCH 的子树和元素作用域继续由面板管理。扩展没有直接改树、改绑字段或新增 Wow 操作符的权限；高级模式下应只声明自己确实能够表达的节点。

## 2. 远程与本地定义

两者使用同样的字段元数据，持久化名称和 JSON 参数：

```json
{
  "field": "customerId",
  "label": "客户",
  "type": "string",
  "operators": ["EQ"],
  "editor": {
    "name": "customer-picker",
    "options": { "placeholder": "不限客户" }
  }
}
```

组件、函数和服务实例不进入远程 JSON。宿主在每个面板的 `extensions.filters` 注册同名实现；业务服务和实例上下文通过 `context` 提供。具体字段路径始终来自已绑定节点，不拼接或移除 `state` 前缀。

## 3. 注册契约

```ts
interface FilterEditorRegistration {
  render?: 'value';
  component: ComponentType<FilterEditorProps>;
  modes: readonly FilterMode[];
  supports?: (node: Readonly<FilterExpression> | undefined) => boolean;
}
interface FilterComponentRegistration extends Omit<
  FilterEditorRegistration,
  'component' | 'render'
> {
  render: 'filter';
  component: ComponentType<FilterComponentProps>;
}
type FilterRegistration =
  FilterEditorRegistration | FilterComponentRegistration;
```

未声明 `render` 等同 `value`，保留现有接入行为。`supports` 判断能否完整表示已有节点，必须是无副作用同步检查；它也会接收未设置状态 `undefined`。不兼容的模式或节点继续寻找下一层实现；名称缺失或兼容检查抛错会显示配置错误。

解析顺序固定：字段 `editor` → 面板 `editors[operator]` → 内置编辑器。逻辑与元素容器始终使用内置结构编辑。

## 4. 组件输入

`FilterEditorProps` 是值编辑器契约：

| 输入       | 语义                                                                           |
| ---------- | ------------------------------------------------------------------------------ |
| `node`     | 当前可编译的编辑节点快照；未设置或不能编译时可能为 undefined，不等同已应用查询 |
| `operator` | 当前操作符，node 未设置时仍可读取                                              |
| `field`    | 固定字段元数据；无字段的查询级特殊节点为 undefined                             |
| `fields`   | 当前根或元素相对作用域内的字段定义                                             |
| `mode`     | simple / advanced                                                              |
| `options`  | 名称引用中的 JSON 配置                                                         |
| `context`  | 宿主运行时上下文                                                               |
| `disabled` | 禁用编辑；组件同时禁用自身交互                                                 |

所有输入按只读使用，不原地修改节点或字段元数据。扩展只通过回调发布变更。

`FilterComponentProps extends FilterEditorProps` 增加：

| 输入        | 语义                                                                      |
| ----------- | ------------------------------------------------------------------------- |
| `id`        | 当前面板/节点的稳定 DOM 标识，不能作为持久化业务 ID                       |
| `operators` | 当前绑定和模式下的操作选项及中文标签；disabled 项只能显示，不能选中       |
| `errors`    | 当前节点的统一错误消息，只读                                              |
| `errorId`   | 有错误时供输入的 aria-describedby 使用；输入可据 errors 设置 aria-invalid |

## 5. 回调契约

| 回调                                | 语义                                                                                  |
| ----------------------------------- | ------------------------------------------------------------------------------------- |
| `onChange(node)`                    | 发布同一字段、当前作用域内的合法 Wow 非容器节点；更新草稿，清除该节点已解决的扩展错误 |
| `onChange(undefined)`               | 有值操作清空值并保留字段/操作/其他参数；无需值的操作移除该节点                        |
| `onValidityChange(false, message?)` | 当前本地输入未完成或无效；即使消息为空也阻止查询，不能使用旧有效值绕过                |
| `onValidityChange(true)`            | 本地输入恢复有效；不能替代合法输出来抹除非法节点/字段错误                             |
| `onOperatorChange(operator)`        | 完整组件请求操作切换；只能选 operators 中的可用项，按面板规则保留兼容值与当前无效状态 |
| `onClear()`                         | 完整组件清空，语义同 onChange(undefined)                                              |
| `onRemove()`                        | 完整组件移除整个节点，无需额外更新其他条件                                            |

onOperatorChange、onClear、onRemove 属于完整组件契约。所有编辑回调都不查询、不保存。切换操作不能通过回调顺序清除尚未解决的无效输入。

清空有值节点时重挂载其编辑器，丢弃旧本地缓冲和回调。卸载、替换组件、操作/模式切换后的旧回调永久失效；同一组件再次出现也不能恢复旧生命周期。组件应自行取消其候选请求；引擎负责拒绝失效回调。禁用期间的变更、切换、清空和移除请求被拒绝。

有效输入只发布合法协议值；不完整文本留在组件本地并报告 invalid。内置原始草稿编辑器另有 `FilterValueEditorProps`，不能把 `FilterDraftNode` 直接当作 onChange 的协议输出。

## 6. 异常与恢复

- 未注册名称、非法输出、越界字段、非法操作和未知参数都不能静默略过条件。
- 单个扩展的渲染失败由错误边界隔离，阻止查询并提供“使用内置编辑器”；完整组件回退后恢复默认字段外框。
- 候选加载错误由组件捕获，保留当前选择；需要补全或重新验证输入时报告 invalid。候选搜索不等于条件编辑。
- 组件局部状态如需跨实例切换或卸载保存，由宿主 context 或保持挂载负责；面板 draft 只保留它收到的编辑树。

## 7. 接入与验证

```tsx
const extensions: FilterExtensions = {
  filters: {
    'customer-picker': {
      render: 'filter',
      component: MyCustomerFilter,
      modes: ['simple', 'advanced'],
    },
  },
};
```

公开类型来自 `@ahoo-wang/fetcher-view-engine/react`，定义引用来自核心入口。实际示例：Storybook → View Engine / Filter Panel → 完整自定义筛选器 · 组件契约。

验收覆盖：旧值编辑器兼容、完整 UI 无默认外框、字段/操作限制、清空/移除不查询、禁用和失效回调、空消息 invalid、同次事件及旧引用的操作切换、渲染异常回退。全局 ViewEngine、实例持久化与容器组件自定义不属于本接口的已实现范围。

验证结果（2026-09-06）：包内 144 项测试、17 个 View Engine Storybook 浏览器场景、包与 Storybook 类型检查、ESLint、构建及全仓 `pnpm test:unit` 通过；全仓 viewer 保留原有 1 项跳过。独立复核确认操作切换不会清除最新无效状态。解锁后已完成人工可视验收：完整组件独立外框、候选搜索、选择、手动查询、清空、移除与撤销均正常；桌面及 414px 窄屏布局、浅色与深色弹层正常。编辑和候选搜索未增加查询次数，已恢复默认预览设置。
