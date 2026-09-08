---
title: 用 Viewer 渲染本地行
description: 使用完整定义、初始视图和应用拥有的数据构建无需后端的表格。
---

# 用 Viewer 渲染本地行

## 前提

使用[完整本地 Viewer 示例](../../examples/viewer.md)，其中提供消费者安装、入口文件和维护中的 `LocalViewer.tsx`。它运行于具备 Viewer peer 依赖的 React 环境，不需要 Wow 服务。保持铃铛形数据监控关闭：该独立功能需要真实 count 端点。

## 挂载维护中的实现

按示例“在应用中运行”的步骤挂载 `<LocalViewer />`。仓库验证选择 Storybook 的 **Docs → Local Viewer → Local Data**。play 函数会自动交互；重新加载 story，或使用消费者应用查看未经操作的初始状态。

源码中的三个输入职责不同：

| 输入              | 示例中的职责                                       |
| ----------------- | -------------------------------------------------- |
| `ViewDefinition`  | 声明 ID、Name、Active 字段以及可用的 Active 过滤器 |
| `ViewState`       | 选择可见列、初始条件、排序、分页大小与视图身份     |
| `PagedList<User>` | 通过 `dataSource` 提供当前计算出的行与总数         |

标为 `primaryKey` 的字段提供稳定行身份。初始视图与定义的 `definitionId` 必须一致。`dataUrl`、`countUrl` 是必填元数据；本地加载和计数回调在内存计算，不会请求这两个地址。

## 验证显示行

初始状态第 1 页是 Ada、Lin，总数四，每页两行。第 2 页是 Grace、Zoe。源码的 `queryUsers` 先过滤全量数据，再排序，最后切页；`Viewer` 不会自动变换传入 `dataSource` 的行。

只需要单个视图、不需要保存视图集合时选择 `View`。这里选择 `Viewer`，因为后续任务包括切换与保存。两种组件都不会因为定义中有 URL 就创建远端数据源。

## 失败与清理

示例捕获不支持的本地过滤或排序输入，显示 alert 并清空行。它只实现界面实际提供的控件，不是通用 Wow 查询解释器。本地行和保存视图保存在组件内存，卸载后丢失。同步本地计算不需要请求控制器；远端适配层需要自己取消请求。

继续阅读[分页与排序](./pagination-and-sorting.md)、[模型与状态](../../reference/viewer/models-and-state.md)及 [View/Viewer 归属](../../architecture/state-and-resources.md)。
