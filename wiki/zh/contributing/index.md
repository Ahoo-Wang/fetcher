---
title: 贡献
description: 在本地配置 Fetcher，并选择正确的开发、测试或文档工作流。
---

# 贡献

Fetcher 是版本锁步的 Monorepo。保持变更聚焦，同步更新受影响的包与文档，先运行最小
相关检查，再运行仓库级检查。

## 选择工作流

- [开发](./development.md)：安装、构建、包布局、代码风格与版本。
- [测试](./testing.md)：单元、集成、浏览器、Wiki 与 Storybook 检查。
- [文档](./documentation.md)：双语 Wiki、README、Mermaid 与源码校验规则。

## Pull Request 基线

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm lint
pnpm test:unit
```

变更涉及集成、Wiki 或 Storybook 时，增加对应聚焦检查。Pull Request 只使用 squash
合并；标题使用 `feat:`、`fix:`、`test:`、`docs:` 等 Conventional Commit 前缀。
