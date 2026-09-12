# DashboardView 交付验证

分支：`feat/dashboard-composition`，基础为已 squash 合并的 PR #1451（`73832625`），提交前同步到 main `d9d6d438`。本报告覆盖后续仪表盘组合能力和用户确认的 Metabase 式布局；不声明已获生产准入。

## 交付边界

- 独立仪表盘配置与草稿、创建/保存/另存、冲突与未知写入恢复；首次保存沿用运行时身份和面板状态。
- 记录/分析引用、重复引用独立位置；显式字段映射与命名转换；草稿/应用/保存分离。
- 每阶段读取预算、排队与取消；结果/元数据预算；权限撤销和过期响应防护。
- DashboardView 复用记录和分析内容；默认筛选/面板配置和错误恢复；独立分页与刷新。
- Metabase 式二维布局采用 react-grid-layout；未发布 columnSpan 契约已替换为 x/y/w/h。布局库只负责几何交互，不持有查询或业务状态。
- 动作携带自身结果口径；口径切换卸载旧动作与其对话框。异步宿主写入前仍必须检查 isCurrent。

## 对抗性审查

契约、运行时及最终交互经过独立代码审查。修复过：创建回执恢复覆盖编辑、同步回调中 suspend 遗留位置、旧请求错误污染新结果、旧结果动作混用新口径、A→B→A 旧动作复活、portal 取消被拦截等问题。审查通过只表示本次发现已处理，不能替代部署与实际用户验收。

## 真实服务证据

用户指定的开发服务，OpenAPI 版本 Wow 9.0.18。环境变量门控测试 `test/dashboard/realService.test.ts` 已通过：3 面板、2 前端定义、重复记录引用；8 次真实读取（6 paged、2 aggregation）；FAILED→SUCCEEDED 过滤结果核对；局部分页/刷新隔离；无业务写入。

底层仅有 `compensation.execution_failed` 聚合，因此不是跨业务后端或跨租户验证。测试没有记录行内容；未提供写宿主，保存操作被拒绝。

## 可重复检查

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine... build
npm_config_workspace_concurrency=1 pnpm test:unit
VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm test:storybook
node packages/view-engine/scripts/verify-package.mjs
node --expose-gc packages/view-engine/scripts/verify-dashboard-budget.mjs
node packages/view-engine/scripts/verify-dashboard-regression.mjs <baseline>/packages/view-engine/dist/index.js
node --test wiki/test/documentation.test.mjs
pnpm --dir wiki build
```

全仓单测按工作区串行，保留原覆盖率阈值与测试超时。一次并发构建/测试运行出现旧 UI 用例超时，不能作为通过证据；后续以串行运行结果验收。Metabase 布局替换后的串行全仓检查最终通过（exit 0），包含源码覆盖率、编译产物、类型和Viewer回归。

性能脚本比较固定输入的本地无界面处理，2 次预热与 5 次测量，不是网络/真实浏览器 SLA。结果/元数据脚本测量最大配置下 1/6/20 个仪表盘，每个12面板；GC堆差仅作诊断，不宣称泄漏证明。发布包脚本解包真实 tgz，检查公开导出、严格类型、React/CSS 和 core 导入隔离，复用本机已安装依赖，不等同于独立联网 npm 安装。

## 未验证的生产准入项目

真实触摸设备、读屏实际操作、业务用户走查；多业务数据源/跨租户认证、生产宿主权限撤销、真实服务端保存/冲突/幂等、浏览器跨域配置、发布流水线与回滚演练。订阅、导出、嵌入和图表交叉筛选不由布局库自动提供，属于独立产品能力。

## Metabase 布局检查记录（内容卡片修订前）

- 真实 Chrome Storybook：92 文件通过、2 文件跳过，366 测试全部通过（119.88s）。首次新增依赖预优化造成的旧缓存失败已由完整干净重跑替代。
- 真实鼠标二维拖动与宽高缩放：订单仍保留 SO-11 / 第2页；宽6→4、高18→20；Escape 在活动缩放中恢复尺寸381×944并移除placeholder。
- 原生数值宽度6→4，撤销回6，重做回4，取消编辑回6且保存恢复禁用。深色1440与320屏幕观察通过，320屏幕页面scrollWidth305、卡片281，无页面横向溢出。最终768宽度复查：页面scrollWidth753，网格729，内容局部滚动且无页面横向溢出。未将实际200%浏览器缩放或真机触摸列为已验证。
- 移除活动拖动/缩放源：真实RGL/jsdom回归均通过，不保留placeholder、不渲染已删除业务内容、其它卡片DOM保持。
- 发布tgz：11公开目标、447个逐字节一致的dist文件、2个core运行模块、严格NodeNext和20个React示例模块通过；SHA256 c50cc8a9c14c08c538c4a12e5c7b2e6f7c032ee8b72dba4d219172df075e5c5f。
- 最终配置下真实开发服务重跑通过，13.14s，仍为8读取、0写入。
- 最大配置元数据预算复测仍为127926272B；释放后运行时数量归零。原始数据见 [预算记录](2026-09-12-dashboard-budget.json)。
- baseline 73832625实际引擎消费新版MemoryViewHost混合数据通过；记录仍能查询，新客户端的dashboard默认项不变。本地固定输入的4项中位数比较均未超过“增加10%且20ms”阈值；这不是服务延迟或浏览器帧率证据。见 [性能记录](2026-09-12-dashboard-performance.json)。
- 独立布局契约与UI审查均PASS；修复了拖动中移除源的库监听清理顺序及视觉/分页编号不一致。必要构建集成将react-grid-layout加入现有external列表，避免浏览器产物require('react')。

- 最终 View Engine 源码测试：1539通过、3跳过；编译产物测试1539通过、3跳过。覆盖率 statements95.38%、branches91.22%、functions97.03%、lines97.25%，保持原阈值。补充了原生数字Enter提交/越界拒绝回归。

- 最终全仓 `npm_config_workspace_concurrency=1 pnpm test:unit`：exit 0；全包ESLint与`git diff --check`通过。文档索引在最终源码格式化后重建，11项文档测试通过。

- 最终文档站构建通过（17.56s）。远端 CI 结果以 PR 检查为准。

## PR 提交前复验

已同步 main `d9d6d438`（包括 lucide-react 更新），重新通过 frozen-lockfile 安装、依赖构建、源码/故事 ESLint、全仓串行单测（View Engine 源码与编译产物均1539通过、3跳过）、11项文档测试、366项Chrome交互、发布包检查和文档站构建。以上归档SHA为同步后的发布包。

Storybook 显式预优化懒加载的 react-grid-layout，防止首次遇到依赖时重载正在执行的故事；不修改产品构建或测试阈值。

清除本工作区 Storybook 依赖优化缓存后的完整验证：366项通过（103.42s），无测试中途优化重载。

## PR 审查修订

核实并修复4条Codex意见：本地草稿独立导航/管理入口（保持权威列表不变）、创建前检查宿主create服务、无参数转换器清除旧无效状态、引用重载失败时释放已清除对象的元数据预算。新增或扩充反例，确认修复前失败、修复后通过。

CI导航门禁通过归入现有“数据视图”章节修复，故事ID不变；20条Codacy意见均为CSS空行规则，已修正且验证非空白内容未变。Node20保存提示测试改为等待明确保存完成状态，避免把请求过程中的按钮禁用当成完成。

修订后全仓单测、366项Chrome故事交互、完整 `verify:view-engine`（本地Chromium，包含宿主、发布包、生产构建及性能/可访问性fixture）和文档站构建均通过。此处生产构建fixture结果不替代真实部署准入。

## Markdown、链接与图片卡片修订

移除“位置与尺寸”数值入口，保留拖拽、缩放、键盘替代和撤销/取消。新增Markdown、链接、图片卡片，统一布局与持久化；静态内容不创建查询位置、不参与全局筛选。数据卡片显式使用kind:view。图片使用URL、替代文本与说明，不包含上传服务；Markdown不执行原始HTML，统一校验链接协议，正文限制64KiB。

独立对抗审查发现并修复编辑弹窗跨实例/恢复残留和已删除卡片被旧表单复活的问题；当前门禁PASS。回归覆盖并发内容修改、布局变化保留、危险URL、图片失败、Escape取消和静态内容零查询。

本修订最终验证全部通过：

- 源码/故事ESLint、依赖及包构建、全仓串行pnpm test:unit；View Engine源码与编译产物均1554通过、3跳过，函数覆盖率97.02%，未修改阈值。
- Chrome Storybook 368测试通过；11项文档测试与文档站构建通过。
- 完整verify:view-engine（Chromium）：发布包451个dist文件一致、严格消费者类型/core隔离、HTTP/IndexedDB宿主、生产Storybook导航及性能/可访问性fixture通过。tgz SHA256：7ad3fe06ecd4ebe1ccc1713ac941a744defc9697c3e4dedc22c295065e89418f。
- 实际浏览器确认Markdown渲染、危险链接拒绝、有效链接添加并保存、512×512图片在卡片内等比显示，“位置与尺寸”入口不存在。

本修订没有重跑真实开发服务；上文8读取/0写入属于前一修订证据。真实触摸设备、读屏走查、业务用户与生产宿主准入仍未验证；本地生产构建通过不代表生产部署验收完成。

## 第二轮 PR 审查修订

核实并修复9条新增意见：运行位置在注册前拒绝仪表盘；位置数据源在查询时解析当前宿主，保留分页及结果，并忽略已取消请求迟到的授权错误；绑定编辑状态跟随远端baseline更新；转换器Editor和applicable异常局部隔离；跳过不相关位置的通知；显式dispose后允许重建runtime；创建范围随当前权限归一化；只读临时筛选有效性与持久会话分离。

独立复审额外发现通知过滤遗漏候选发现/原视图能力变化，已通过独立DashboardView测试先复现再修复；私有能力快照跟踪增删，不重建位置、不增加查询。最终独立gate PASS。

远端9b9492a4的Engineering Quality失败为persistence测试格式，已按原Prettier格式修复；Node24失败为全源码依赖图转译超过默认5秒，未报告循环依赖。仅此静态结构扫描配置15秒超时，产品性能门槛、全局测试超时和覆盖率阈值不变。本机Node24静态扫描4项通过。

本轮源码/编译产物测试各1566通过、3跳过；全仓串行pnpm test:unit通过。View Engine覆盖率statements95.48%、branches91.39%、functions97.04%、lines97.30%；Chrome Storybook368项通过。11项文档测试、类型检查、ESLint及整PR改动文件格式检查通过。

本轮完整verify:view-engine（本地Chromium）和文档站构建通过，包含发布包、HTTP/IndexedDB宿主、生产Storybook导航、性能及可访问性fixture。发布包SHA256：67a60011d17f18e78a3cba3dd1607fc9b415e4e104bef2873cc558bd80612585。真实开发服务未重跑，生产准入边界仍同上；远端新提交检查需另行确认。

## 全局工具栏整理

将数据面板、Markdown、链接、图片添加入口收进顶部“添加”菜单；查询、刷新、全局筛选与布局操作使用现有Lucide图标并保留文字。复用现有DropdownMenu，弹窗仍由同一Settings生命周期管理，通过Portal挂载工具栏入口，不新增依赖或更改查询/保存契约。

浏览器验证：菜单打开图片表单、取消焦点返回添加按钮；390px窄屏菜单边界102–294px、页面scrollWidth375px，无页面横向溢出；方向键打开和Escape关闭均正常。窄屏覆盖已恢复到默认尺寸。27项内容/视图定向测试通过，包含header位置、图标、取消焦点和权限变化。

工具栏修订最终：包构建、ESLint、全仓串行单测（View Engine源码/编译各1566通过、3跳过）、368项Chrome故事与格式检查通过。首次全仓运行的既有日期选择器用例5秒超时，由该文件8项独立复验和完整重跑通过替代，未调整超时。本轮未重复完整生产fixture或真实服务验证。

## 新建与另存为的可见范围统一

提取两处实际共用的ViewScopeField，使用既有RadioGroup、相同标签/说明/禁用样式；新建仪表盘替换原生select。保持权限实时变化的范围归一化，禁用选项保留并说明无创建权限。27项新建/另存为/权限定向测试、包构建、ESLint和格式检查通过；实际浏览器确认方向键切换到公共视图。

可见范围修订最终全仓串行单测通过（View Engine源码/编译产物各1566通过、3跳过），368项Chrome故事通过。该修订未重复生产fixture或真实服务验证。

## 紧凑卡片与元信息收纳

数据卡片头压缩为标题、刷新图标和更多菜单；来源、接收时间、实际查询口径及全局筛选说明收进数据详情，编辑原视图位于更多菜单。已绑定筛选显示数量快捷入口；加载、错误及旧结果警告保留在主界面。分析结果复用原渲染器的compact呈现，独立分析视图默认展示不变；记录内容关闭selectable，不改变查询/分页/保存逻辑。

真实浏览器：四个卡片头均44px，所有表格选择框消失；详情打开/关闭与焦点返回通过。390px网格完成响应式布局后scrollWidth375px、卡片头右边界362px，详情弹窗纵向254–590px，未越界。临时viewport覆盖已恢复。新回归覆盖元信息默认隐藏、详情可读取、筛选快捷入口、打开详情零查询和位置身份保持；分析口径详情也覆盖到现有执行结果。

本轮包构建、ESLint、全仓串行单测通过（源码/编译各1567通过、3跳过）；11项文档测试通过。源声明位置索引通过生成脚本更新，未手改生成文件。

紧凑卡片修订最终368项Chrome故事与文档站构建通过；本轮未重复完整生产fixture或真实服务测试，保留原生产准入边界。

## 转换器迟到回调与管理器类型描述

核实3条新增评论为2项实际问题（管理器类型描述的2条评论重复）。补充反例先复现4项失败：切换“不参与”、切换其他转换器、卸载界面后旧onChange/onValidityChange仍改写会话，以及仪表盘管理行被描述为数据视图。

TransformEditorSession沿用既有Filter EditorSession的已提交代次/生命周期检查，回调只调用当前已提交编辑器的处理器；卸载、替换编辑器再切回时旧回调无效。全局筛选section key纳入runtime.identity，避免跨仪表盘复用本地编辑器。ViewManagerRow使用与导航一致的三类aria-description。修复后36项定向测试通过，包含新增编辑器A→B→A反例；包构建、ESLint及公开符号索引检查通过。

本轮最终全仓串行单测通过（源码/编译各1572通过、3跳过），368项Chrome故事通过，未改覆盖率或超时门槛；未重复真实服务或完整生产fixture验证。

## 三类型 EmbeddedView 与架构整理

EmbeddedView支持保存的dashboard、record、analysis，拥有独立浏览位置，宿主仍拥有engine。基于保存baseline初始化，不修改工作台选择；临时筛选、分页与排序不写保存会话，管理员也保持位置dirty=false。仪表盘嵌入用于“业务仪表盘”场景，示例ID为view-engine-embedded-view--dashboard；记录、分析及三类型的同实例独立展示均有故事。

架构审查与修订见[EmbeddedView架构记录](2026-09-12-embedded-view-architecture.md)。已拆开保存实例/运行位置、引用错误/查询错误；DataViewContent共享记录/分析结果呈现；全局预算继续覆盖所有嵌入。旧DashboardPosition别名由DataViewPosition统一。

独立审查曾发现并发受理拒绝静默，现共享查询边界保留旧请求和结果并发布可重试错误；初次分析失败也能从刷新恢复。浏览器还发现同名嵌入的landmark重复，现由可选展示title传递上下文名称到面板、筛选和分页；重复嵌入由宿主提供有区分的标题。独立复审PASS，6个嵌入故事（含双记录展开筛选、双分析、双仪表盘）可访问性验证通过。

EmbeddedView最终检查全部通过：源码/编译各1601通过、3跳过，全仓串行单测通过；374项Chrome故事通过；完整verify:view-engine（Chromium）包含公共类型、457个dist文件逐字节一致、2个core运行模块、HTTP/IndexedDB宿主、生产导航及性能/可访问性fixture；文档站构建20.32s通过。最终tgz SHA256：7dae87724d956978a2be8bc369251ab49e1c098228321d042357898ad7f2c1e8。源码格式与文档生成检查通过。真实业务服务未重跑，生产准入边界维持上文记录。
