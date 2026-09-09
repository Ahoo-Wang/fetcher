---
next: false
title: 完整 View Engine 示例
description: 与 Storybook 共用源码的数据视图，实际执行本地筛选、排序与分页。
---

# 完整 View Engine 示例

## 运行与验证

仓库开发需要 Node >=20.20.2 和 pnpm 10.34.5：

```bash
pnpm install
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm storybook
```

打开 [View Engine → 快速开始 → 第一个数据视图](http://localhost:6006/?path=/story/view-engine-快速开始--minimal)。展示页面保持初始状态，由你手动操作；断言放在独立回归故事中：

```bash
pnpm exec vitest run --project=storybook stories/view-engine/QuickStart.test.stories.tsx
```

先用 `pnpm exec playwright install chromium` 安装 Chromium，或设置 `VIEW_ENGINE_BROWSER_CHANNEL=chrome` 使用已安装的 Chrome。该命令还会验证已有的五类扩展和深色窄容器场景。

| 操作                   | 预期结果                                  |
| ---------------------- | ----------------------------------------- |
| 打开页面               | 显示 ORDER-001、ORDER-002，共 3 条记录    |
| 下一页                 | 显示 ORDER-003                            |
| 金额改为 200，暂不查询 | 当前结果保持不变                          |
| 按 Enter               | 只显示 ORDER-002                          |
| 清空已应用金额条件值   | 恢复全部 3 条记录的查询范围，筛选控件保留 |
| 金额升序               | 第一页显示 ORDER-003、ORDER-001           |

## 完整共享组件

以下源码就是 Storybook Minimal 故事使用的组件，仅导入公开包入口。本地数据源只支持定义中声明的金额下限、AND 和普通分页；更多操作符应由业务 QueryApi 实现。示例返回完整记录，没有提供视图保存服务，因此保存不可用。后续接入见[保存视图指南](../guides/view-engine/saved-views.md)。

<<< @/../stories/docs/RecordViewExample.tsx

## 接入独立 React 应用

在包发布之前，先构建并验证本地归档：

```bash
pnpm --filter @ahoo-wang/fetcher-view-engine... build
node packages/view-engine/scripts/verify-package.mjs
pnpm --filter @ahoo-wang/fetcher-view-engine pack --pack-destination /tmp/view-engine-pack
```

打包命令会输出归档文件名。在 React 19 TypeScript 应用中，使用 `pnpm add` 安装该 `.tgz` 的绝对路径，满足包声明的 peer 依赖，复制共享组件并渲染 `<RecordViewExample />`。如果环境中的内部依赖版本尚未发布，也需要打包相应工作区依赖；包验证脚本会联合验证工作区构建产物，不会执行发布。

这验证的是浏览器界面和本地记录数据源。鉴权、视图持久化和后端查询行为仍由应用接入负责，参阅 [ViewHost 契约](../reference/view-engine/view-host.md)。
