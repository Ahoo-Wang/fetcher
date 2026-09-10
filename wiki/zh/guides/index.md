---
prev: false
next: false
title: 完成应用开发任务
description: 选择 HTTP、服务、流、React、数据视图或平台集成任务。
---

# 完成应用开发任务

按需要完成的任务选择指南。初次接入 Fetcher，先[得到一个可运行结果](../start/index.md)。

- [HTTP 请求](./http/index.md)：支持 Fetch 的运行环境与核心包。连接业务 API 前先运行本地 HTTP 示例。
- [服务客户端](./services/index.md)：少量端点可以直接调用 Fetcher。装饰器需要兼容的 TypeScript 编译器；生成客户端需要完整 OpenAPI 文档与编译步骤。两者都不会创建后端路由。
- [流式消费](./streaming/index.md)：运行环境需要 Fetch、Response body 和 ReadableStream。服务端必须输出 SSE 帧；普通 JSON 响应不是事件流。长时间读取需要由调用者持有取消信号。
- [React 数据流](./react/index.md)：从已具备声明 peer 依赖的 React 应用开始。可运行 React 示例提供确定性后端夹具；生产路由仍归应用负责。
- [View Engine 数据视图](./view-engine/index.md)：使用 shadcn/Base UI 组件、可保存的组件配置、内置筛选/单元格和明确的 ViewHost 服务，从工作区示例开始接入。
- [Ant Design Viewer（维护期，已弃用）](./viewer/index.md)：在具备 Viewer peer 依赖的 React 应用中从本地数据开始。View 展示单个视图；Viewer 还管理视图集合。数据适配层执行查询，持久化归应用所有。
- [平台集成](./integrations/index.md)：Wow 与 CoSec 需要兼容的服务端协议、认证和应用路由。存储与本地事件不需要平台服务。安装前核对所选包的 peer 依赖。

使用[完整示例](../examples/index.md)获得可执行基线；通过[架构与选型](../architecture/index.md)理解资源归属与采用代价。
