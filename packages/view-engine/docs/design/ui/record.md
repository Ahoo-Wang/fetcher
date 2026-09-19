# UI 层：Record 视图

Record 工作台的结果区组件。三种视图共用的骨架、状态条、值显示与 `FilterPanel` 见 [README.md](README.md)；控制器见 [react.md#userecordtable](../react.md#userecordtable)。

## ResultToolbar 的三组

- 工具栏左端是选择态与宿主的批量动作，右端按**职责**分三组，组间 8px、组内无缝：`[表格｜卡片]`（布局切换）、`[列设置][排序]`（表格怎么显示手上这些行）、`[刷新]`（数据新鲜度，留着自动刷新间隔将来并进来的位置，不必重排）。四个同样粗细的描边按钮排成一行，说不出哪几个是一回事，也说不出哪个重要；
- **份量**：工具栏在结果之上，不该与结果争。组里的按钮一律 `ghost`，只有宿主的批量动作是 `outline`，同屏唯一的 primary 仍是筛选的 Apply。布局切换是唯一的例外——它那一圈描边正是"一个控件两个档位"与"两个按钮"的差别所在，靠 `ToggleGroup spacing={0}` 在调用处取得（`ui/components` 是上游源码，不就地改）。（见 test/resultToolbar.test.tsx「ResultToolbar grouping and weight」）

## ColumnSettings：列的顺序、显隐、固定与汇总

- 列设置是一个 popover，不是一串勾选项：**列显示什么、按什么顺序、固定在哪边、底下汇总什么**是同一个问题——"一行长什么样"——此前却分在三处（勾选列表管显隐，顺序只能改配置，固定与汇总根本没有入口）；
- 顶部一句说明，其后一行一列：拖动手柄 · 显隐勾选框 · 列名 · （字段声明了 `summary` 时）汇总函数下拉 · 固定开关（固定时图标实心）；
- **三个区域，列不跨区**：主键列固定在左侧，宿主的操作列固定在右侧，其余在中间自由排序。两个固定行照常显示自己的固定方式与手柄，但一律禁用——一个按下去什么也不发生的开关，比一个明说自己不能动的开关更糟。操作列不是配置里的列（宿主交的是 render 槽位），宿主没有交 `row` 槽位时这一行根本不出现；
- 排序只覆盖**已显示**的列：隐藏的字段在配置里没有位置，也就没有顺序可拖，它的手柄禁用，勾上之后落在中间区的末尾。提交的顺序是「左区已显示的列 + 中间区的新顺序」，主键因此永远在最前——一份把主键排在第二位的配置会被存下来，然后被表格悄悄推翻；
- **最后一列不许取消**：只剩一列时该勾选框禁用，说明行补上 `label.columns.last-visible` 说明原因，而不是留一个点了没反应的勾选框；
- 汇总下拉只出现在字段声明了 `summary` 的列上，选项是"不汇总"加该字段声明的那几个函数，写入 `config.summaries`。配置里一个字段可以带多个函数（表格照样全画出来），而这个控件一列只给一个：选中一个就替换掉该列原有的；
- 固定开关按 不固定 → 左 → 右 → 不固定 循环，写入 `table.columns[].pinned`；取消固定时那个键被**删掉**而不是置为 `undefined`——配置是 JSON，`{ pinned: undefined }` 与没有这个键在 `dequal` 眼里不是一回事，会让一个刚固定又取消的视图在整次打开里一直显示"未保存"；
- **拖放用现成的库**（`@dnd-kit/react` + `@dnd-kit/dom`，走 catalog，MIT），不自写：它带指针与键盘传感器、拖动预览与一个 live region。只有可拖的行注册成 sortable item，固定行根本不是放置目标，这就是"列不跨区"在实现上的保证。库的 `OptimisticSortingPlugin` 按 [interaction-primitives 设计](../../../../docs/superpowers/specs/2026-09-13-view-engine-interaction-primitives-design.md) 关掉：它在指针移动时就重排 DOM，恰好让读取落点时的下标失效；落点由 drop 报出的 source／target 两个 id 算出；
- **键盘**：手柄可聚焦，方向键把这一行在区域内上下移一位；按空格拾起后方向键交给库，两边各有单一播报源（`isDragging` 时本地处理器让路）。库的英文播报换成目录里的句子，落定的结果由设置自己的 live region 说一次——拖的和按方向键的是同一句，不重复朗读。（见 test/columnSettings.test.tsx、test/accessibility.test.tsx「record, with the column settings open」）

## SortSettings：按钮上读得出的排序

- 表头的点击切换一次只表达一列，说不清几列之间谁先谁后。工具栏的排序按钮把当前排序读成话——字段名加方向（"订单编号 ↓"，方向另有一句 sr-only 的词），多于一条时是第一条加 `+{n}`；
- 打开是一个小编辑器：逐条列出字段、序号与方向，方向可翻转、条目可移除，底下的字段选择器只列**可排序且尚未用到**的字段，全部用完即禁用。新字段追加在末尾并按升序——它是既有字段的并列打破者，插在别处等于悄悄改变了行主要按什么排；
- 定义里没有任何 `sortable` 字段时整个控件不渲染：一个只能打开一屏空编辑器的按钮，是一个通向哪儿也不去的按钮；
- 排序仍是"改完一次性应用"，与表头切换同一条路径（`setSort` 是一次 `edit` 加一次 `apply`）——表格画的是上一次成功结果，不重跑就看不到改动。（见 test/sortSettings.test.tsx）

## RecordTable 与 RecordCards

- `RecordTable` 的 `selectable` 默认为 true，工作台与 `EmbeddedView` 不受影响；
- 关掉时汇总行的口径标签（`total`／`page`）没有多出来的格子可占，于是标在首列之上，而不是顶掉首列自己的汇总。

- `RecordTable` 暂不接 TanStack：控制器已经是表格模型，列语义、排序、选择与分页都从它来，再叠一层只是把同一份状态写两遍。等列宽拖拽与列序拖拽真的要做时再引入，那时它提供的才是新能力。（见 test/ui.test.tsx「RecordTable on its own」「RecordCards on its own」「the summary row」）
