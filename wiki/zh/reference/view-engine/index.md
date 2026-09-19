---
prev: false
title: View Engine API 参考
description: 视图引擎的公开入口与契约；参考页随重写逐步补齐。
---

# View Engine API 参考

该包正在重写，尚无已发布的 API。目标入口由[架构设计](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/view-engine/docs/design/)固定：

| 入口                             | 内容                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `@ahoo-wang/fetcher-view-engine` | 模型类型、纯内核（`validate*` / `compile*` / `project*`）、运行时、`ViewStore` 端口、`MemoryViewStore` |
| `/react`                         | 钩子与无样式控制器                                                                                     |
| `/ui`                            | 默认组件、默认视图、工作台                                                                             |
| `/styles.css`、`/themes/*`       | 默认样式与主题，显式导入                                                                               |

模型、内核、运行时、存储与组件的参考页随各入口交付时补齐。旧版参考见 git tag `view-engine-legacy`。
