---
title: 本地 Viewer 示例
description: 使用应用持有的状态，对本地数据过滤、排序、分页并保存视图。
---

# 本地 Viewer 示例

::: warning 维护期（已弃用）
`@ahoo-wang/fetcher-viewer` 已进入维护期（弃用），仅维护现有功能，不再新增功能。数据视图能力的后续演进由 [`@ahoo-wang/fetcher-view-engine`](../guides/view-engine/index.md) 承担，新项目请使用 View Engine。本页保留供存量项目维护参考；两者模型与 API 不同，迁移需要适配。
:::

这个浏览器示例使用四个用户，无需后端。应用先对完整数据集过滤、排序，再截取请求页。`Viewer` 接收计算后的 `{ list, total }`；它不会替你转换传入的行数据。

## 在自己的应用中运行

使用 Vite 脚手架支持的当前 Node 版本（Node 22.12+ 可作为基线）。Fetcher 库声明 Node >=18.20.8，这不代表当前 Vite 工具能在 Node 18 上运行。本示例使用 React 19 和 Ant Design 6。

```bash
pnpm create vite local-viewer --template react-ts
cd local-viewer
pnpm install
pnpm add @ahoo-wang/fetcher@5.0.0 @ahoo-wang/fetcher-viewer@5.0.0 \
  @ahoo-wang/fetcher-react@5.0.0 @ahoo-wang/fetcher-wow@5.0.0 \
  @ahoo-wang/fetcher-decorator@5.0.0 @ahoo-wang/fetcher-eventstream@5.0.0 \
  @ahoo-wang/fetcher-eventbus@5.0.0 @ahoo-wang/fetcher-storage@5.0.0 \
  @ahoo-wang/fetcher-openapi@5.0.0 @ahoo-wang/fetcher-cosec@5.0.0 \
  react@^19.2.8 react-dom@^19.2.8 antd@^6.6.3 \
  @ant-design/icons@^6.3.4 dayjs@^1.11.23
```

上述命令显式包含 Viewer 声明的完整 peer 依赖图，包括 `fetcher-react` 间接要求的 CoSec。安装这些包不意味着本地示例需要 Wow 或 CoSec 服务。`immer`、`dequal` 和 `reflect-metadata` 等直接依赖由包管理器传递安装。不要将仓库中的 `workspace:` 或 `catalog:` 写法复制到消费者项目。

创建 `src/LocalViewer.tsx`，复制下列完整文件。数据、定义、已保存视图和应用组件都在其中，无需 Storybook fixture。

<<< @/../stories/docs/LocalViewer.tsx

将 `src/main.tsx` 替换为以下完整入口。脚手架的 `index.html` 已包含 `<div id="root"></div>`；这里不导入默认演示 CSS。

```tsx
import { createRoot } from 'react-dom/client';
import 'antd/dist/reset.css';
import { LocalViewer } from './LocalViewer';

createRoot(document.getElementById('root')!).render(<LocalViewer />);
```

```bash
pnpm dev
```

打开 Vite 输出的本地地址。`LocalViewer` 自身提供 Ant Design 的 `App` 和 `FullscreenProvider`。

## 观察结果

1. 第一页包含 **Ada、Lin**；点击第 **2** 页，显示 **Grace、Zoe**。
2. 回到第 **1** 页。点击一次 **Name** 表头：显示 **Ada、Grace**；再点击一次：显示 **Zoe、Lin**（降序）。
3. 在 **Active** 中选择 **是**，再点击 **搜索**。只剩 **Grace、Ada**，并保持降序。选择 **否** 可筛选不活跃用户；选择 **未设置** 并再次搜索可移除此条件。
4. 点击 **另存为**，将视图命名为 **Active descending** 并确认。应用显示 **Saved: Active descending**。
5. 在左侧选择 **All users**：恢复 **Ada、Lin**。再选择 **Active descending**：恢复 **Grace、Ada**、真值条件和降序表头。切换视图回到第 1 页；保存的是每页条数，不是页码。

本示例只实现 Active 布尔过滤和 Name 升降序排序。遇到其他条件或排序字段时，显示错误并清空表格。新增界面能力时再扩展对应的本地计算；这不是通用 Wow 查询解释器。

## 状态与后端边界

应用在 React 内存中持有 `savedViews`，接受修改后调用相应操作的成功回调，Viewer 随后更新内部视图集合。刷新或卸载应用会丢失已保存视图。若要持久保存，应先等待存储/API 操作完成，再调用成功回调；失败时显示错误，不报告成功。

`dataUrl` 和 `countUrl` 是定义要求的元数据。此处的普通数据加载和视图计数回调使用本地函数。工具栏还提供面向服务端的数据监控：本例应保持铃铛监控关闭，它的计数轮询需要真实兼容接口。本例不提供本地监控服务或后端。

需要远端行数据时，将应用的计算函数替换为请求，再把返回的 `PagedList` 传给 `dataSource`。身份认证、授权、错误处理和持久存储仍由应用与服务端负责。根据实际协议选择 [View、Viewer 或 FetcherViewer](../architecture/integration-decisions)。

## 在本仓库运行与验证

仓库开发要求 Node >=20.20.2、pnpm 10.34.5。在仓库根目录执行：

```bash
pnpm install
pnpm storybook
```

打开 [Docs → Local Viewer → Local Data](http://localhost:6006/?path=/story/docs-local-viewer--local-data)，手动执行上述操作；重新加载可恢复初始状态。自动交互验证在独立回归故事中执行。

无头运行相同的浏览器验证：

```bash
pnpm exec vitest run --project=storybook stories/docs/LocalViewer.test.stories.tsx
```

验证会检查表格行集合与顺序、过滤结果和保存设置的恢复。回调文字只是额外的保存确认，不能代替对实际显示行的验证。
