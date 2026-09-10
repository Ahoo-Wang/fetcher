# View Engine 扩展性与可导入主题设计

日期：2026-09-10。状态：已实现并完成本地验证。

## 目标与边界

保留当前 record/table 查询、实例持久化和默认外观，提升局部界面组合与主题接入能力。使用方可以导入内置主题或自己的 CSS 主题，也可以显式接入宿主 shadcn 主题。消费构建产物无需 Tailwind 构建或运行时主题注册。

继续使用 Base UI 交互原语、shadcn base-nova 组件、语义颜色和现有 `--fve-*` 命名空间。不引入第二套 UI 库、通用插件生命周期、主题生成器或样式计算引擎。新视图类型、任意表格布局替换、全局偏好存储和国际化不在本次范围内。

## 当前事实

- `components.json` 使用 base-nova、neutral、CSS variables 与 fve 前缀。
- 核心与 React 入口分离；React 入口已导入基础 CSS。
- `ViewExtensions` 提供 filters、cells、globalActions、tableActions、rowActions，optionSources 独立提供候选项。
- 过滤器注册固定于引擎生命周期，渲染与编译来自同一注册；本次保留这一约束。
- `RecordView` 固定组合工具栏、过滤面板、已应用条件、表格与分页。
- 默认主题变量直接声明在最外层 `.fve-root`。Portal 复制计算后的 fve 变量、字体与颜色模式，打开时监听祖先 class、data-theme、style。
- 现有颜色、圆角可配置，但工具栏、控件及表格中仍有固定尺寸。

## 主题交付与使用契约

公开 CSS 子路径：

```tsx
import '@ahoo-wang/fetcher-view-engine/styles.css';
import '@ahoo-wang/fetcher-view-engine/themes/blue.css';
import './my-theme.css';
```

`styles.css` 保留现有基础组件和默认 Neutral 外观。内置 `themes/neutral.css`、`blue.css`、`violet.css`、`green.css`、`orange.css` 仅提供有作用域的语义配色，不复制组件 CSS；neutral 文件用于显式重置局部配色。`themes/shadcn.css` 提供显式宿主映射。

导入主题文件只使该主题可用，必须用 `data-fve-theme` 选择；导入顺序不决定当前主题。不将所有主题写入 `:root`。多个作用域可使用不同主题：

```tsx
<div className="fve-root" data-fve-theme="blue" data-theme="dark">
  <ViewPage {...props} />
</div>
```

主题名称接受任意字符串，不使用封闭枚举，也不要求注册表。未加载或未知主题名称不抛异常，按继承和默认值显示；文档指出该回退不能证明主题已正确导入。

### 自定义主题

用户主题与内置主题遵循同一公开契约：

```css
.fve-root[data-fve-theme='brand'] {
  --fve-primary: light-dark(#1d4ed8, #93c5fd);
  --fve-primary-foreground: light-dark(#ffffff, #172554);
  --fve-ring: light-dark(#1d4ed8, #93c5fd);
  --fve-radius: 0.5rem;
}
```

允许部分覆盖：嵌套作用域未声明的变量继承父作用域，最外层使用默认主题。内置具名配色显式定义完整的公开配色集合，避免从另一套配色继承零散值；配色文件不重置密度与字体。

库默认值和内置主题采用低优先级、明确作用域的 CSS 声明，用户在同一主题根节点的普通未分层 CSS 或行内变量能够覆盖，无需 `!important`。不能承诺任意祖先声明击败子节点的显式值，也不能承诺两份同名用户主题的冲突与顺序无关。

移除局部变量或主题属性后恢复当前父作用域或默认值。内置主题不得污染宿主全局 `--primary` 等变量。

CSS 自定义属性中的 var() 在继承前解析，不能假定子作用域改变基础变量会重新计算继承的派生值。圆角尺度必须在消费位置或显式主题边界依据当前 radius 计算；局部 radius=0 时所有承诺受 radius 控制的组件均应方角。颜色部分覆盖只覆盖显式变量，不承诺自动推导配套颜色；模板必须提醒 primary 与 primary-foreground 配套修改。用户应在目标主题边界定义主题变量，不能依赖子节点重新解释祖先的别名。

自定义 CSS 分为两类：变量主题可自动传到库 Portal；依赖 `.brand [data-slot=...]` 的结构选择器不会跨越 body Portal。必须明确公布这一限制，并为纯视觉扩展优先提供公开变量。字号 token 使用 px/rem 稳定长度，不支持会随内部嵌套重复放大的 em/% 字号；其他尺寸可使用相对实际字号的 em。字体、相对尺寸和 light-dark() 在复制到 Portal 后必须验证实际计算结果，不能只比较变量字符串。

### 公开变量

沿用 background/foreground、primary/primary-foreground、secondary/secondary-foreground、muted/muted-foreground、accent/accent-foreground、popover/popover-foreground、destructive、success、warning、info、border、input、ring、radius，全部加 `--fve-` 前缀。配色来源需在实现中记录官方资源 URL 与固定版本或提交，审核实际前景/背景配对；不将自选配色冒称官方完整 preset。

字体公开 `--fve-font-family`、`--fve-font-size`、`--fve-line-height`。密度公开 `--fve-control-height`、`--fve-table-cell-padding-x`、`--fve-table-cell-padding-y`、`--fve-toolbar-padding-x`、`--fve-toolbar-padding-y`、`--fve-toolbar-gap`。尺寸默认值逐项保持现有对应区域表现；现有 xs/sm/lg size 继续有独立语义，不将所有尺寸压成同一个高度。

`--fve-tw-*` 与未文档化的计算变量不属于主题 API。完整变量表需在公共 API 文档中包含用途、默认值和消费组件，并通过示例实际使用。

## shadcn 宿主接入

导入 `themes/shadcn.css` 后，以 `data-fve-theme="shadcn"` 显式启用，将宿主当前的 `--background`、`--foreground`、`--primary` 等语义变量映射到对应 fve 变量。缺失宿主 token 使用库默认值；映射只读取宿主变量，不反向写入，不产生循环引用。

宿主颜色变量要求为完整 CSS color 值（例如 oklch(...)、hsl(...)、#hex），不自动解析旧版裸 HSL 通道。缺失回退不等同于类型验证：存在但类型错误、循环或无效的用户变量遵循 CSS 行为，不保证恢复库默认值。跨代格式需要用户在自己的 CSS 中显式适配。库不引入颜色解析器。

宿主 shadcn ThemeProvider 继续负责全局主题偏好、持久化与 `.dark` 切换。接入模式读取宿主实际色值；如果宿主只在 html 上定义了深色 token，局部 light 标记不能凭空生成宿主浅色 token，局部异色需由宿主提供对应 token 或切换到内置配色。

保留现有 `.dark`、`data-theme="light|dark"` 兼容约定和最近作用域语义。同一节点显式 data-theme 优先于 dark class。未指定明暗时继承；增加显式 system 时跟随系统偏好，保证颜色变量与组件 dark 状态一致。system 不创建全局偏好存储，也不修改 document 根节点。

## 可选 React 包装与密度

`ViewTheme` 从 `/react` 导出，仅渲染主题作用域 div，转发 div 属性、ref、className 和 style：

```tsx
<ViewTheme theme="brand" appearance="dark" density="compact">
  <ViewPage {...props} />
</ViewTheme>
```

`theme?: string` 映射 `data-fve-theme`；`appearance?: 'light' | 'dark' | 'system'` 映射外观；`density?: 'comfortable' | 'compact'` 映射 `data-fve-density`。省略属性表示继承，不在每个嵌套包装上强行写默认值。相较讨论初版使用 `theme` 取代 `preset`，避免与 shadcn CLI 完整组件风格 preset 混淆。

CSS 方式与包装方式行为一致，不要求 React Context。comfortable 保持原有视觉；compact 调整表格、工具栏与默认尺寸控件，不使用 transform/zoom 或全局 spacing 缩放。显式 size 变体保持可用，日期网格、图标按钮、InputGroup 的对齐和点击区域需共同验证。

字体变量必须实际接入组件的字号尺度；只改包装 div 的 font-size 而保留所有 text-sm/text-xs 的独立 rem 值不算完成。保留标题、正文和辅助文字的相对层次及默认像素表现。CSS 属性是基础接口；ViewTheme 中显式 theme/appearance/density 优先于同名原始 data 属性，不传时保留原始属性。提供类型化的 `ViewThemeStyle`（CSSProperties 加允许 --fve-* 的索引类型），让行内变量覆盖无需 any 断言。

## Portal 与动态更新

沿用 Base UI Portal、Positioner、焦点管理与状态属性。保持默认挂载到 body，不能为继承主题而统一移入裁剪容器。

继续复制触发作用域最终计算值，不依赖 Portal 上重新选择主题名称，避免用户 CSS 选择器在 body 下失效。同步颜色、字体、密度变量与实际明暗状态；更新时替换快照，清除已撤销的值。嵌套 Portal 从所属作用域继承，不串到另一页面。

打开期间覆盖现有属性与新主题/密度属性变化，以及系统明暗变化。所有监听在关闭/卸载时清理。受控 open、defaultOpen、StrictMode 与嵌套弹层均需覆盖。任意 CSSOM 动态插入、替换样式表等无属性变化的自定义更新，不承诺被自动检测；支持的实时切换入口是主题属性、class、行内变量及系统偏好。

自定义主题作用域内含自身 Portal 的第三方组件，需自行采用其主题容器机制；库不拦截任意第三方 Portal。

## 功能扩展：有限区域组合

延续现有业务注册，增加 `RecordView` 的 `renderTableToolbar` 与 `renderPagination` 两个区域渲染回调，并通过 `ViewPage` 透传。保留 toolbarStart 和 FilterPanel.renderToolbar。全局工具栏拥有刷新与展开生命周期，暂不开放整块替换，避免替换 UI 时意外停掉运行行为。

每个回调接收只读 definition、session、默认区域 ReactNode，以及该区域已有的受控操作与状态。表格工具栏提供选择清空、列更新、绑定实例的 refresh；分页提供当前分页状态、是否可前进/后退及受控翻页/改页大小方法。默认节点允许宿主包裹、补充内容；不提供回调时行为完全不变。返回 null 表示明确隐藏该区域。

所有操作复用现有引擎入口与错误处理，绑定产生回调时的实例 ID；保留旧回调后切换实例不能修改新实例。只读上下文不暴露可变内部存储。查询失败时保留现有分页不可用语义，不能通过自定义 UI 绕过。

分页可用性由默认组件与自定义区域共享的计算定义；操作调用时读取当前绑定实例状态并重新检查，不能只信任渲染时的 canNext。加载中、查询失败、未成功查询、末页、cursor 无 nextCursor 均覆盖；cursor 不提供跳页与上一页能力。非法页码/尺寸沿用引擎验证。区域操作返回 Promise<void>（同步操作可返回 void），异步失败保留 rejection 给宿主等待和处理，不以 fire-and-forget 的 run 包装伪装成可等待操作。默认区域继续显示现有错误反馈。

刷新动作只暴露本区域所需的 appliedFilter、querying、selectedRowKeys 等只读语义；不鼓励宿主从草稿推断已应用查询范围。ViewPage 的 OwnedViewPage 当前手动转发属性，必须显式补齐新回调转发，并通过 ViewPage、ViewPageContent、RecordView 三条公开路径验证。

渲染回调置于独立组件和现有错误边界下，发生渲染异常仅影响该区域，并可在输入变化后恢复；宿主异步事件错误仍由受控操作返回/现有操作通道处理，不能声称 React 错误边界捕获所有异步异常。

回调是纯渲染函数，不允许直接在回调中调用 Hooks；有局部状态的扩展返回自己的 React 组件。默认区域节点最多渲染一次，避免重复 ID 和交互控件。回调必须在边界的后代组件内执行，不能在创建边界 JSX 前求值。重试边界按回调与相关语义输入变化恢复，不能按每次创建的新上下文对象持续重试。主题切换、普通查询状态更新不得重挂载宿主扩展而丢失输入/焦点。

为 record-view、全局工具栏、表格工具栏、已应用过滤条件、分页补齐稳定 data-slot；保留已有 slot。只承诺这些语义区域，不承诺内部 DOM 深度和工具类字符串。组件行为仍使用 Base UI 原语，不引入泛化 slots 注册框架。

## 对抗性验收

| 场景                                               | 必须观察到的结果                                           |
| -------------------------------------------------- | ---------------------------------------------------------- |
| 旧调用不传新属性                                   | 默认外观、查询、保存和选择行为保持                         |
| 构建产物逐个导入主题，交换不同主题导入顺序         | 子路径可解析，选定主题不受顺序影响，未选择的主题无副作用   |
| 无 Tailwind 的最小消费应用                         | 基础 CSS、内置主题与用户 CSS 均可直接工作                  |
| 用户部分主题、未知名称、移除覆盖                   | 明确继承/默认回退，不保留旧值，不抛异常                    |
| shadcn 宿主有/无 token，库隔离/接入模式            | 接入映射正确，缺失有回退，宿主不被污染                     |
| 两套主题并列，深浅多层嵌套                         | 最近作用域生效，明暗变量与状态样式一致                     |
| 打开中改变主题、密度、行内变量和系统偏好           | 弹层实际计算样式同步，不要求重新打开                       |
| Dialog 内 Select/Popover，受控默认打开             | 无串色与裁剪，层级、Escape、焦点恢复正确                   |
| StrictMode、反复开关及卸载                         | 无重复/遗留监听与卸载后更新                                |
| 每套配色 light/dark × 默认/紧凑                    | 前景背景、焦点、悬停、选中、错误状态可辨                   |
| 窄容器、长文本、200% 缩放、键盘操作                | 内容不遮挡，不整页溢出，控件可操作                         |
| 切换主题时存在草稿、选择或请求                     | 不重建引擎、不额外查询、不丢状态                           |
| 插槽包裹/替换/隐藏/抛错                            | 默认区域可组合，故障隔离，查询和其他区域保留               |
| 切换实例后调用旧插槽操作                           | 不修改新实例，现有权限/查询保护仍生效                      |
| 旧分页回调在请求开始、到达末页、实例删除后被调用   | 当前状态保护生效，无错误实例写入、重复越界请求或未处理异常 |
| 新回调仅从 ViewPage 传入                           | 运行时确实调用，不是只有类型声明支持                       |
| 嵌套 radius=0、局部改字号、用户变量含 em           | 控件与 Portal 的实际圆角/字号/尺寸符合当前边界             |
| 宿主裸 HSL、无效颜色、变量循环                     | 文档限制明确，不误报为支持的自动回退                       |
| 扩展含 useState，查询和主题反复变化                | 组件身份、局部输入与焦点保留                               |
| 扩展调用原始抛错回调、返回抛错子组件、等待异步失败 | 各异常进入正确通道，其他区域可继续工作                     |

颜色、CSS 级联、密度、Portal 和缩放必须针对构建产物做真实浏览器测试与截图检查。实际颜色比较要考虑透明色合成；不能以 data-theme 属性正确替代视觉正确。内置主题普通文本目标对比度至少 4.5:1，焦点与关键控件边界目标至少 3:1；这属于项目验收标准，自定义用户颜色不保证自动达标。

全部内置配色运行颜色矩阵；复杂键盘与状态生命周期用代表性配色覆盖，避免把每一行为重复成完整笛卡尔积。单元测试负责映射、只读上下文和生命周期；复用现有 Vitest/Storybook/Playwright，不增加框架。

## 交付与验证边界

交付范围为 view-engine 源码、必要的包 CSS 导出及构建输出支持、针对性测试、Storybook 和公共消费示例，以及 API 参考、README 和对应中英文 wiki。新增公开主题路径必须保留 CSS sideEffects，按发布产物验证，不能仅验证源码路径。

必须从打包后的 tarball 在独立目录安装验证；工作区 symlink 或源码 alias 成功不足以验收。覆盖基础 CSS 与主题先后加载、生产 tree-shaking、明确导出路径。React 入口现有源码 CSS 导入是否在产物保留，以构建结果为准；所有快速开始统一显式导入 styles.css，避免依赖未验证的打包副作用。

易用性提供四个完整、可复制运行的例子：内置主题、用户自定义 CSS、宿主 shadcn 映射、含局部状态的区域扩展。主题例子每个都包含 import 与选择标记；不要求阅读内部源码、类型断言或运行主题注册代码。Storybook 显示当前主题名称和对应接入代码，主题选择仅提供已加载的主题。

扩展注册生命周期必须在快速开始说明：filters 在引擎创建前准备好，不能以更新同一 ViewPage props 补注册；异步加载完成后再挂载页面。重新挂载会重置会话，因此不能把重挂载作为无损热更新方案。单元格/操作渲染注册继续沿用已有更新行为，缺失与抛错示例保留。此约束是当前范围的明确限制，不宣称通用插件热加载。

实现阶段运行受影响包及依赖构建、包测试和类型检查、Storybook 浏览器验收、文件级 lint/format；文档更新运行 wiki build。提交前必须按根 AGENTS.md 运行并通过 pnpm test:unit。设计文档本身不等同于功能实现或测试通过。

## 参考

- [Base UI Styling](https://base-ui.com/react/handbook/styling)：无样式原语、状态属性与 CSS 接入。
- [Base UI Popover](https://base-ui.com/react/components/popover)：Portal、定位与交互契约。
- [shadcn Theming](https://ui.shadcn.com/docs/theming)：语义变量、前景背景配对与圆角。
- [shadcn Dark Mode / Vite](https://ui.shadcn.com/docs/dark-mode/vite)：宿主负责主题切换。
- [CSS Variables 规范](https://www.w3.org/TR/css-variables-1/#cycles)：变量在继承前解析与无效值行为。

## 对抗性审查结论（2026-09-10）

本轮为源码与规格静态审查；尚未实现，当前工作树未安装 node_modules，未运行组件或浏览器测试。

发现并修订：分页守卫与异步返回契约不完整、页面属性手动转发风险、派生变量跨主题继承风险、主题格式/Portal 样式范围过度承诺、字体与圆角变量未必实际消费、公开包与复制示例验证不足。修订后需要实现期逐项提供运行证据；文档修订不代表验收通过。

## 规格自审记录

- 区分导入与选择，未知主题回退与加载成功，内置完整配色与用户部分覆盖。
- 区分本地明暗覆盖与宿主已经解析的 token，避免承诺无法生成的宿主浅色值。
- 区分可监听更新与任意 CSSOM 更新，库 Portal 与第三方 Portal。
- 功能插槽限于现有区域，保留刷新生命周期和引擎保护；没有引入新视图类型。
- 实现与本地验证结果见同日实施计划；未进行提交或发布。
