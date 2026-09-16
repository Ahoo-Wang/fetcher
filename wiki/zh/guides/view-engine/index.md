---
prev: false
next: false
title: View Engine 数据视图
description: 面向 Wow 业务应用的可配置数据视图引擎，正按第一性原理设计重写。
---

# View Engine 数据视图

View Engine 正在重写。旧实现以 git tag `view-engine-legacy` 冻结；新包按[架构设计](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/docs/design.md)从空树自下而上生长。

设计以三个事实为基础，其余全部由此推出：

| 事实             | 推论                                                                 |
| ---------------- | -------------------------------------------------------------------- |
| 定义是代码       | 没有定义服务与定义版本；保存的视图在打开时校验                       |
| 配置是数据       | 只持久化 `ViewInstance` 与个人偏好；乐观 revision 加幂等 `requestId` |
| 运行状态是临时的 | 草稿、结果与选择只活在一个打开的 `ViewRuntime` 中                    |

任务指南随交付步骤逐步回到这里：先 Record 工作台，再 Analysis，最后 Dashboard。在此之前，目标 API 见包内 [README](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/README.zh-CN.md)，模块边界、`ViewStore` 端口与交付顺序见设计文档。
