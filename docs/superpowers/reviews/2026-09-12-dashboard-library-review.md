# Dashboard 布局库与产品交互对照

核验日期：2026-09-12。源码固定到 Metabase `99f918928c9809b87f1e39e3e594f5c97dd31265`、Superset `3e7bdec53bb7830b524a4b2b53478332b00d9c72` 的主分支快照；不代表稳定发行版本已包含所有功能。此轮核验源码和官方文档，未部署两套产品做用户走查。

## 已确认的实现

| 产品     | 布局机制                                                                        | 可借鉴的交互                                                              |
| -------- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Metabase | `react-grid-layout` 的 Responsive；卡片保存 x/y/w/h，映射 col/row/size_x/size_y | 桌面编辑态移动、调宽高；移动端布局不回写桌面；显示栅格；浏览/编辑明确区分 |
| Superset | `react-dnd` + HTML5 backend；`re-resizable`；自有行、列、标签页结构             | 从组件区拖入容器；插入位置/禁止放置提示；尺寸约束；结构化排版             |

Metabase 的 package.json 声明 react-grid-layout ^1.5.3；不应直接沿用其依赖版本到当前项目。Superset 同时声明 dnd-kit，但仪表盘 DragDroppable 实际仍使用 react-dnd；不能用 package.json 中存在某库来推断具体交互已迁移。

源码：[Metabase GridLayout](https://github.com/metabase/metabase/blob/99f918928c9809b87f1e39e3e594f5c97dd31265/frontend/src/metabase/dashboard/components/grid/GridLayout.tsx)、[DashboardGrid](https://github.com/metabase/metabase/blob/99f918928c9809b87f1e39e3e594f5c97dd31265/frontend/src/metabase/dashboard/components/DashboardGrid.tsx)、[Superset DragDroppable](https://github.com/apache/superset/blob/3e7bdec53bb7830b524a4b2b53478332b00d9c72/superset-frontend/src/dashboard/components/dnd/DragDroppable.tsx)、[ResizableContainer](https://github.com/apache/superset/blob/3e7bdec53bb7830b524a4b2b53478332b00d9c72/superset-frontend/src/dashboard/components/resizable/ResizableContainer.tsx)、[组件类型](https://github.com/apache/superset/blob/3e7bdec53bb7830b524a4b2b53478332b00d9c72/superset-frontend/src/dashboard/util/componentTypes.ts)。

## 功能参考

Metabase 支持图表/表格、文本标题、链接、iframe、标签页、预设分区；筛选器逐卡绑定；点击图表可以钻取、跳转或更新仪表盘筛选。也有全屏、自动刷新、导出、订阅和历史版本等产品能力。具体嵌入和商业功能需按使用版本/套餐核对。[概览](https://www.metabase.com/docs/latest/dashboards/introduction)、[交互](https://www.metabase.com/docs/latest/dashboards/interactive)、[筛选器](https://www.metabase.com/docs/latest/dashboards/filters)。

Superset 提供图表及行/列/标签页/标题/Markdown/分隔线组件；原生筛选可配置默认值与作用范围；交叉筛选由支持交互的图表发出，并按作用范围筛选目标图表。标签页可以用 URL 定位分享。[使用文档](https://superset.apache.org/user-docs/using-superset/creating-your-first-dashboard/)、[交叉筛选源码](https://github.com/apache/superset/blob/3e7bdec53bb7830b524a4b2b53478332b00d9c72/superset-frontend/src/dashboard/util/crossFilters.ts)。

## 当前项目的选择

| 选择                                                                        | 能解决的问题                                                     | 项目代价/边界                                                                                      |
| --------------------------------------------------------------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| [react-grid-layout](https://github.com/react-grid-layout/react-grid-layout) | 二维拖放、宽高缩放、碰撞/紧凑布局、断点布局、序列化              | 若产品要 Metabase 式画布，优先验证；模型需从顺序+columnSpan改为明确坐标/宽高，处理旧配置与内容高度 |
| [GridStack](https://github.com/gridstack/gridstack.js)                      | 嵌套网格、跨网格拖入拖出、触摸、保存恢复；当前提供 React wrapper | 需要嵌套布局时再比较；验证 React 状态与其 DOM/布局引擎同步                                         |
| 当前 dnd-kit + CSS Grid                                                     | 面板顺序、列跨度、键盘等价操作、提交前预览                       | 适合当前模型；不是完整二维布局引擎。若新增二维碰撞、自动紧凑和高度缩放，不继续自写这些算法         |
| react-dnd + re-resizable                                                    | 类 Superset 的容器式页面编辑                                     | 基础交互已有，布局树/碰撞/放置规则仍由产品实现，当前没有采用必要                                   |

建议：产品交互优先借鉴 Metabase 的明确编辑模式、卡片菜单和可视化筛选绑定。若确认二维画布需求，以 react-grid-layout 做一个局部布局替换验证，不扩大到整个运行时。保留 DashboardRuntime、独立 position、筛选编译、权限和保存协议；布局库只处理几何与交互。

演进顺序：先完善现有编辑与恢复体验；再按明确需求加入高度缩放、撤销/重做和布局模板；随后是点击联动/钻取；标签页、订阅、导出和嵌入各自独立验收。不能把引入布局库等同于完成这些产品功能或获得生产准入。

替换验收：拖放后位置/分页/选择不重建；布局移动不查询；Escape取消不保存；只读禁用；断点变化不破坏桌面布局；缩放后的图表重测；鼠标、触摸、键盘和读屏分别验证。当前未因本次调研新增或替换依赖。

实施状态：用户随后确认采用 Metabase 方案，现已接入 react-grid-layout 2.2.4 并移除 dnd-kit。上表的“当前 dnd-kit”描述指选型前实现。最终验证见 [交付报告](2026-09-12-dashboard-delivery.md)。
