---
title: 保存并恢复视图状态
description: 实现视图修改回调，仅在所选持久化接受改动后报告成功。
---

# 保存并恢复视图状态

## 前提

从[完整本地 Viewer 示例](../../examples/viewer.md)开始。它明确使用 React 内存保存数据，可以无需服务端验证保存行为。是否需要刷新后保留、用户共享或服务端授权，要由应用另外决定。

## 连接保存回调

查看 `LocalViewer.tsx` 的 `onCreateView`、`onUpdateView` 和 `onDeleteView`。创建时用 `crypto.randomUUID` 分配 ID，更新应用的 `savedViews`，再用已接受的视图调用 `onSuccess`。更新按 ID 替换，删除按 ID 移除。`Viewer` 通过这些成功回调修改内部集合。

示例还显示 `Saved: <name>`，使接受动作可观察。点击保存按钮本身不证明已经持久化。由应用决定什么时候修改才算成功。

## 验证恢复

1. 按[过滤指南](./filters.md)应用 Active true 与 Name 降序。
2. 选择**另存为**，输入 **Active descending** 并确认，应出现 **Saved: Active descending**。
3. 切换到 **All users**，第 1 页恢复 Ada、Lin。
4. 切换到 **Active descending**，恢复 Grace、Ada，以及 true 过滤和降序表头。
5. 刷新或重新挂载本地应用，新保存视图消失，因为存储所有者是内存。

保存状态包含每页大小、列、过滤器、条件和排序。示例切换视图从第 1 页开始，当前页码不是保存的偏好。

## 需要时接入真实持久化

将内存回调替换成存储或 API 操作，等待接受后再用确认的视图调用成功回调。创建时保留服务端返回的 ID。后端必须验证定义身份与允许的视图归属。失败时显示错误，不调用成功回调，让用户能够重试或取消。不要把本地更新报告为服务端确认。

localStorage 适配器可在一个浏览器配置内持久化，但不提供服务端共享或权限。`FetcherViewer` 使用独立的 Wow 修改协议，只有满足[远端契约](./remote-data.md)才应采用。

## 清理与错误

所有者切换时停止等待中的应用修改，并忽略属于旧身份的结果。取消网络请求不能撤销服务端修改。组件内存保存不需要外部监听清理；存储订阅与共享总线需要。保留可见失败信息，不要为了关闭对话框就调用成功回调。

参阅[保存视图参考](../../reference/viewer/saved-views.md)、[存储集成](../integrations/storage-and-events.md)与[状态归属](../../architecture/state-and-resources.md)。
