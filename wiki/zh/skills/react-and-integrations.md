---
title: React 与集成 Skills
description: 为 React 状态、数据 Viewer、CoSec 认证与 Wow CQRS 选择 Fetcher Skill。
pageClass: skills-page
---

# React 与集成 Skills

这些 Skill 把 Fetcher 组合为应用级行为。先调用最具体的 Skill，让 Agent 只加载
当前任务需要的契约。

## `$fetcher-react-hooks`

**适用于：** Promise 与请求状态、Query Hooks、取消、防抖、Storage Hooks、
事件订阅、安全上下文和 Wow Hooks。

```text
$fetcher-react-hooks 构建防抖搜索 Hook，明确展示加载、空、错误、成功和重置状态，
并忽略过期响应。
```

继续阅读 [React 参考](../reference/react.md)。

## `$fetcher-viewer-components`

**适用于：** `Viewer`、`FetcherViewer`、Filter、Registry、Table、Cell、保存视图、
远程选择、Locale 和端到端数据探索流程。

```text
$fetcher-viewer-components 构建订单 Viewer，包含状态筛选、服务端分页、保存视图，
以及可见的加载、空和错误状态。
```

先在 Storybook 审查交互状态，再用 [Viewer 参考](../reference/viewer.md)核对组件契约。

## `$fetcher-cosec-auth`

**适用于：** `CoSecConfigurer`、JWT 存储、设备与空间归属、授权拦截器、刷新、
401/403 行为和登出清理。

```text
$fetcher-cosec-auth 为服务端 Fetcher 配置 Token 刷新、空间归属，
并显式处理未认证与禁止访问。不要在浏览器 Bundle 中暴露凭据。
```

继续阅读 [CoSec 参考](../reference/cosec.md)。

## `$fetcher-wow-cqrs`

**适用于：** 命令投递、命令等待流、快照与事件查询、数组优先 Filter、聚合、
归属路径、生成式 Wow 客户端和对应 React Hooks。

```text
$fetcher-wow-cqrs 为购物车增加类型化命令，以及分页和聚合快照查询。
根据当前 Wow 契约核对路径与字段语义。
```

继续阅读 [Wow 参考](../reference/wow.md)或
[Wow CQRS 场景](../recipes/wow-cqrs.md)。

## 组合顺序

一个任务跨多个包时，从基础设施到界面依次加载：

```text
Fetcher 请求 → 认证或 Wow 客户端 → React Hook → Viewer
```

每层保留自己的错误和清理边界。不要把 CoSec 刷新失败隐藏成通用的 Viewer 空状态。
