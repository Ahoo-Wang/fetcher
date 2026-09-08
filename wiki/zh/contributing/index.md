---
prev: false
title: 贡献一个聚焦的变更
description: 贡献一个聚焦的变更 — Fetcher
---

# 贡献一个聚焦的变更

## 从受影响的边界开始

阅读根 AGENTS.md 以及目标包或 wiki 目录下的规则。先了解已有实现和测试布局，再决定是否需要不同模式。

1. [准备工作区](./development.md)。
2. 在真实公开边界复现问题或定义行为。
3. 实施聚焦变更，同步双语文档。
4. [运行相关检查](./testing.md)，提交前完成仓库要求的检查。

提交标题使用 conventional commits。新工作基于 main，PR 使用 squash 合并。库 API 变更需要同步对应 Skill 参考，并明确版本决策。发布与本地验证是不同步骤。

纯文档变更遵循[文档维护](./documentation.md)；站点构建成功证明链接和渲染可构建，不证明所有 API 示例语义准确。
