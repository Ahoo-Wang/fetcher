---
title: 让分页与排序真正改变行
description: 先按条件过滤和排序，再按从 1 开始的页码切片。
---

# 让分页与排序真正改变行

## 前提

先完成[本地行](./local-data.md)，运行完整 [LocalViewer 实现](../../examples/viewer.md)。四个用户、每页两行，便于观察翻页。替换成服务请求前，先理解这个已经工作的适配层。

## 从回调追踪到数据源

`LocalViewer.tsx` 中的 `onLoadData={load}` 接收条件、从 1 开始的页码、每页大小和可选排序。`load` 将这些值传入 `queryUsers`，更新 React 的 `data` 状态，再由 `Viewer` 通过 `dataSource` 接收。

查看维护中示例的 `queryUsers`：从全部符合条件的用户开始，验证支持的排序字段，对新数组按 Name 排序，最后返回 `list: rows.slice((page - 1) * size, page * size)` 与 `total: rows.length`。total 是过滤后、切页前的数量。只排序当前页会导致跨页顺序错误。

## 验证结果

1. 未操作的初始状态，第 1 页是 Ada、Lin。选择第 2 页，显示 Grace、Zoe。
2. 返回第 1 页，点击 Name 一次，升序显示 Ada、Grace。
3. 再点击 Name，降序显示 Zoe、Lin。
4. 再翻页，确认显示剩余的排序用户，而不是原先未排序的切片。

示例故意关闭了每页大小选择器，使验证固定。若要开放页大小选择，移除这一 UI 限制，并继续在适配层使用回调传入的 size，后续请求不要写死两行。

## 失败与清理

示例对不支持的排序字段或多个排序字段显示错误并清空表格。只开启适配层能够处理的控件。接入远端时，条件、分页与排序必须一起发送，仅允许当前请求替换数据；快速翻页后取消或忽略旧响应。HTTP 失败应显示错误，不能悄悄当作成功的空列表。

示例切换视图回到第 1 页；保存视图存储页大小，不存当前页码。本地计算没有等待中的网络资源。引入请求时参阅[远端数据](./remote-data.md)。

参阅[表格契约](../../reference/viewer/tables-and-cells.md)、[查询排序与分页](../../reference/wow/query-options.md)及[资源归属](../../architecture/state-and-resources.md)。
