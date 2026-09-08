---
title: 维护准确的文档
description: 维护准确的文档 — Fetcher
---

# 维护准确的文档

## 先核实，再解释

通过 package.json 和 src/index.ts 确认公开导出，再阅读实现和测试，核实签名、默认值、错误及清理。内部文件不能证明支持对应导入。翻译时保留 API 标识符。

## 按用途放置内容

| 内容           | 位置              |
| -------------- | ----------------- |
| 首次成功接入   | Start             |
| 概念与生命周期 | Learn             |
| 完整应用任务   | Recipes           |
| 准确 API 契约  | Reference 包/专题 |
| Agent 工作流程 | Skills            |

包索引将公开符号映射到专题锚点。按独立概念拆分，不为每个符号建页。英文和中文路径对应、内容完整，每页具备 title 和 description。

## 保持导航完整

Reference 新专题加入 .vitepress/config/reference.mjs；该清单为导航、LLM 生成与检查提供顺序。同步两种语言页面。这是全新文档站，只维护当前页面和链接，不保留迁移页或旧章节索引。

## 验证示例和图表

示例包含导入与必要上下文，明确标注应用接口和外部演示服务，不包含私密凭据。通过公开包入口检查类型；生成客户端需真实运行生成器并检查名称，不能编造示例导入。

Mermaid 节点填充使用 #2d333b、边框 #6d5dfc、文字 #e6edf3。sequenceDiagram 使用 autonumber，标签换行用 `<br>`。修改后执行：

```bash
pnpm --dir wiki fix:mermaid
pnpm --dir wiki build
node --test wiki/test/documentation.test.mjs
```

不手改 llms.txt、llms-full.txt 或 .vitepress/dist。公开 SDK API 变更必须在同一次修改中同步对应 skills/*/references/api.md。
