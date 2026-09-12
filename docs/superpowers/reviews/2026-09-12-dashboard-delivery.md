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

## Metabase 布局最终检查记录

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
