# UI 层：Record 视图

Record 工作台的结果区组件。三种视图共用的骨架、状态条、值显示与 `FilterPanel` 见 [README.md](README.md)；控制器见 [react.md#userecordtable](../react.md#userecordtable)。

## RecordTable 与 RecordCards

- `RecordTable` 的 `selectable` 默认为 true，工作台与 `EmbeddedView` 不受影响；
- 关掉时汇总行的口径标签（`total`／`page`）没有多出来的格子可占，于是标在首列之上，而不是顶掉首列自己的汇总。

## 汇总行的口径是数字的一部分

- 口径标签由**结果**决定，不由配置决定：`SummaryRow.scope` 是内核投影出来的，`total` 来自它自己那次覆盖全部命中记录的聚合，`page` 来自屏幕上这几行的加总。汇总查询失败时行不消失——本页合计本身有用——但标签改说「本页」，`tfoot` 上的 `data-scope` 同步改成 `page`，宿主要据此上色也拿得到；
- 同时状态条上多一条 warning（`runtime.summary.page-only`），说明**为什么**只剩本页。两处缺一不可：只改标签，读者未必注意到；只报 warning，行上那个词仍然在撒谎。这条 warning 随结果走而不是随草稿走，因此在编辑器里改点什么不会把它从屏幕上抹掉——见 [../runtime.md#规则](../runtime.md#规则)；
- 二十行的 AVG 被当成四万行的 AVG，是这一行唯一能犯的错，而沉默正是犯它的方式。（见 test/resultIssues.test.tsx「what the screen says about a downgraded total」与 stories/view-engine 的 `TotalCoversThisPageOnly`）

- `RecordTable` 暂不接 TanStack：控制器已经是表格模型，列语义、排序、选择与分页都从它来，再叠一层只是把同一份状态写两遍。等列宽拖拽与列序拖拽真的要做时再引入，那时它提供的才是新能力。（见 test/ui.test.tsx「RecordTable on its own」「RecordCards on its own」「the summary row」）
