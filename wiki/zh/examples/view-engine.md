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

打开 [View Engine → 开发接入 → 最小接入](http://localhost:6006/?path=/story/view-engine-扩展接入-最小接入--minimal)。展示页面保持初始状态，由你手动操作；断言放在独立回归故事中：

```bash
pnpm exec vitest run --project=storybook stories/view-engine/QuickStart.test.stories.tsx
```

先用 `pnpm exec playwright install chromium` 安装 Chromium，或设置 `VIEW_ENGINE_BROWSER_CHANNEL=chrome` 使用已安装的 Chrome。完整业务与深色窄容器回归位于 `stories/view-engine/orders`。

| 操作                     | 预期结果                                         |
| ------------------------ | ------------------------------------------------ |
| 打开页面                 | 显示 SO-202609-1001、SO-202609-1002，共 3 条记录 |
| 下一页                   | 显示 SO-202609-1003                              |
| 金额改为 10000，暂不查询 | 当前结果保持不变                                 |
| 按 Enter                 | 只显示 SO-202609-1001                            |
| 清空已应用金额条件值     | 恢复全部 3 条记录的查询范围，筛选控件保留        |
| 金额升序                 | 第一页显示 SO-202609-1002、SO-202609-1003        |

## 销售订单全链路

从[完整订单工作台](http://localhost:6006/?path=/story/view-engine-全链路体验--workbench)开始。创建两台显示器、合计 2,400 元的订单，由销售提交、主管审核、财务收款，再放行、备货、发货和签收；登记开票、核对结算后关闭。订单详情会指出下一步动作和责任岗位，可直接交接并保留当前订单。售后订单直到关闭才离开队列；刷新失败时可在详情内重试，不重复执行业务写入。

章节分别覆盖预付与账期放行、分批发货、拒收重发、退货、退款和开票冲减，共用 18 笔一致的订单样本，每个故事独立初始化。查询和视图设置使用公开引擎；业务表单、校验和写入放在 `packages/view-engine/examples/react/sales-order/`。重置恢复业务记录；视图持久化单独演示，不保存业务订单。

```bash
VIEW_ENGINE_BROWSER_CHANNEL=chrome pnpm exec vitest run --project=storybook stories/view-engine/orders
```

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
