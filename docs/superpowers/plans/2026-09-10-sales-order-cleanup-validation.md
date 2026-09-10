# 销售订单 Storybook 清理与验证

日期：2026-09-10。信息架构与示例清理完成；整体验收未全绿，现有跨标签 localStorage CAS 存在可复现的一致性缺陷。

## 本轮变更

- 全链路入口提供业务、开发接入和专项边界三条阅读路径；保留五个订单业务章节。
- 扩展接入下分最小接入与业务扩展，步骤顺序为 1–4。专项场景按查询、表格、视图管理、组件与恢复排序。
- 最小接入只使用与 wiki 共用的 RecordViewExample；重复完整工作台展示和全链路回归删除，窄屏回归迁入 Lifecycle。回归目录对齐公开章节，Release 回归文件名称对齐实际测试对象。
- 删除 OrderExample.tsx 与 orders.ts 转发层，示例、HTTP 开发适配、测试和独立包验证直接使用 OrderWorkbench 和现有视图工厂。
- 作用域隔离下沉至工作台会话：更换 scopeKey 重建业务状态，切换主题保留当前订单。先用失败测试确认，再修复。
- 独立包验证暴露 Array.at 与 ES2020 验收要求冲突，改为普通下标访问，未提高应用编译要求。
- 更新当前中英文指南、包 README 和生成文档；新增 stories/view-engine/README.md 说明唯一维护入口及专项夹具边界。
- 导航校验覆盖所有故事中的章节链接，不再只检查首页。

## 验证结果

环境：Node 24.11.0、pnpm 10.34.5、Chrome 153.0.8010.37、macOS arm64。

| 检查                                                | 结果                                                                                                               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `npm_config_workspace_concurrency=1 pnpm test:unit` | 通过；View Engine 普通与编译模式各 1004 项                                                                         |
| `pnpm build`                                        | 通过，包含全部工作区及中英文 wiki                                                                                  |
| `pnpm test:storybook`（Chrome）                     | 324 项通过，81 个文件通过，2 个开发文件按配置跳过                                                                  |
| ES2020 修正后的受影响模型、服务、UI 单测            | 19 项通过                                                                                                          |
| ES2020 修正后的 orders 浏览器回归                   | 26 项通过                                                                                                          |
| `pnpm lint:view-engine`                             | 通过                                                                                                               |
| `pnpm build-storybook`                              | 通过；17 个导航目标、163 个独立回归故事及 HTTP 实验隔离通过                                                        |
| 独立安装包验证                                      | 通过；17 个示例模块、11 个公开目标、309 个打包文件一致性通过                                                       |
| 本地视图持久化验证                                  | 通过；JSON 恢复、五类扩展、视图与订单隔离、管理操作与系统视图保护                                                  |
| 主题 CSS 验证                                       | 通过                                                                                                               |
| 生产构建页面验收                                    | 通过；100 行/30 列/100 筛选字段，明暗色 1440/390px，无未审查的 axe A/AA 问题，错误/空态/加载态及 20 次挂载释放通过 |
| 文档生成与文档测试                                  | 通过，11 项文档测试                                                                                                |
| `git diff --check`                                  | 通过                                                                                                               |
| `pnpm verify:view-engine` 总入口                    | **失败**于跨标签 CAS；后续构建与页面验收已独立执行并通过                                                           |
| 外部 `pnpm test:it`                                 | 未执行；本机 8080 Wow 服务健康检查无法连接                                                                         |

全仓单元与 Storybook 全量测试后，仅有三处 Array.at 兼容性改动；对应单测、订单浏览器回归和独立包验证已重新执行。

## 未解决的并发缺陷

原有 `packages/view-engine/scripts/verify-http-view-host.mjs` 第 296 行期望同一旧版本并发保存的结果是一个 saved、一个 REVISION_CONFLICT，实际重复出现两个 saved。没有删除断言、增加延迟或以重跑通过作为验收。

临时诊断记录显示：两个标签使用相同 storageKey 和 navigator.locks 排他锁。第一个标签写入新 revision 后，第二个标签进入临界区仍读取旧 revision，再次写入成功。说明目前浏览器 localStorage 与 Web Locks 组合的跨标签可见性不能满足该 CAS 契约；不是 UI 超时，也不是测试传入了两个不同的旧版本。

HTTP JSON 恢复、权限撤销/恢复和读取超时/取消断言在 CAS 前已执行；CAS 后的原生排队取消断言未执行。诊断临时脚本已清理，原始验证脚本仍可复现。下一步需要单独解决存储适配的事务一致性；本轮没有修改引擎核心或降低测试要求。

本机日志：`/tmp/sales-cleanup-unit.log`、`/tmp/sales-cleanup-stories.log`、`/tmp/sales-cleanup-verification.log`、`/tmp/sales-cas-diagnostic.log`；生产页面验收产物：`/tmp/sales-cleanup-verification/chromium/`。

未修改公开 API、依赖或构建配置，未提交或发布。

## 主题页面回归补充

用户后续指出主题页面报错。此前主题脚本未设置 VIEW_ENGINE_THEME_URL，只执行 CSS 检查；公开故事没有断言订单内容成功加载，因此上表的主题结果不能视为页面验收。

已同时移除主题示例中的卡片操作区和表格操作列，并让宿主使用相同的定义与实例。新增 Themes.test.stories.tsx，从公开故事验证订单加载、明暗/密度切换后保留输入及卡片切换。新增回归先失败后通过；设置真实主题页面 URL 后，完整主题浏览器脚本也已通过。
