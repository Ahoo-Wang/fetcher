# Storybook 分层与补偿数据 API 验收

日期：2026-09-11；本地工作区验证，未提交、发布或部署。

## 信息架构

- 入门与业务流程：最小接入、完整流程、分业务阶段示例。
- 真实 API 接入：补偿数据与补偿分析。
- 引擎与宿主：实例、生命周期、权限、保存与恢复。
- 数据视图：表格、卡片、排序分页、布局。
- 分析视图：配置执行、图表与结果、性能。
- 查询与筛选：两种视图共用的筛选器。
- 扩展与组件：扩展注册、单元格、基础控件、主题。

CSF 显式 ID 不变；隐藏回归继续独立索引。侧栏排序、维护说明、中英文学习路径同步更新。

## 真实数据验证

默认及实际访问地址：`http://compensation-service.dev.svc.cluster.local/`。

`GET /execution_failed/snapshot/schema` 获取字段能力，`SnapshotQueryClient.paged` 调用 `POST /execution_failed/snapshot/paged`。

应用适配器从 Schema 投影字段与可排序能力，复用 IndexedDBViewHost、ViewEngine、ViewPage / RecordView。数据和分析共用连接 UI；只保存个人视图配置，不保存查询结果，不暴露补偿写操作。

浏览器手动验证：连接、首屏、第二页、重试次数升序、补偿状态等于已成功、中文状态与日期展示。

10:42 的独立真实 HTTP 校验结果：首屏 20 条，第二页 20 条，筛选页 20 条；当时全部记录 586152 条，已成功记录 25112 条。逐条验证筛选页状态与 Schema 枚举值一致。计数是当时服务结果，会随业务变化。

复现命令见 `packages/view-engine/examples/react/compensation/README.md`。

## 检查结果

- 完整 Storybook：352 项通过，89 文件通过，2 文件跳过。
- 补偿连接固定 HTTP 测试：4 项通过；真实服务需显式启用。
- 定向真实快照查询与连接回归：2 项通过。
- view-engine 构建、严格独立应用类型检查、包验证、ESLint 通过。
- 最终 Storybook 静态构建通过，19 导航目标与 169 隐藏回归索引验证通过。
- 中英文 wiki 构建与 11 项文档校验通过。
