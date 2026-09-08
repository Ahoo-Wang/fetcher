---
title: 安装与环境
description: 区分应用运行条件、可选包依赖与仓库开发工具。
---

# 安装与环境

## 安装核心包

```bash
pnpm add @ahoo-wang/fetcher
# npm install @ahoo-wang/fetcher
```

## 检查你实际使用的包

下表来自当前包的 package.json。浏览器需提供所用功能对应的 Fetch、AbortController 与 Streams API；版本声明不会为运行环境补齐 API。

| 包                                               | Node 声明   | Peer dependencies                                                                                                                                                                                                                                                                                   |
| ------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [fetcher](../reference/fetcher/index.md)         | `>=18.20.8` | 无                                                                                                                                                                                                                                                                                                  |
| [decorator](../reference/decorator/index.md)     | `>=18.20.8` | `@ahoo-wang/fetcher`                                                                                                                                                                                                                                                                                |
| [eventstream](../reference/eventstream/index.md) | `>=18.20.8` | `@ahoo-wang/fetcher`                                                                                                                                                                                                                                                                                |
| [react](../reference/react/index.md)             | `>=18.20.8` | `@ahoo-wang/fetcher`, `@ahoo-wang/fetcher-eventstream`, `@ahoo-wang/fetcher-eventbus`, `@ahoo-wang/fetcher-storage`, `@ahoo-wang/fetcher-wow`, `@ahoo-wang/fetcher-cosec`, `react`, `react-dom`                                                                                                     |
| [viewer](../reference/viewer/index.md)           | `>=18.20.8` | `@ahoo-wang/fetcher`, `@ahoo-wang/fetcher-decorator`, `@ahoo-wang/fetcher-eventbus`, `@ahoo-wang/fetcher-eventstream`, `@ahoo-wang/fetcher-openapi`, `@ahoo-wang/fetcher-react`, `@ahoo-wang/fetcher-storage`, `@ahoo-wang/fetcher-wow`, `@ant-design/icons`, `antd`, `dayjs`, `react`, `react-dom` |

## 功能相关设置

声明式服务需要 `experimentalDecorators`、`emitDecoratorMetadata`；参考[装饰器安装](../reference/decorator/index.md)。Response 流助手通过导入 `@ahoo-wang/fetcher-eventstream` 注册，参考[流结果](../reference/eventstream/json-and-results.md)。React 与 Viewer 的 peer dependencies 按所选版本安装，不能用仅安装核心包的示例代替 UI 项目依赖。

## 如果你贡献仓库代码

本仓库使用 Node `>=20.20.2`、pnpm `10.34.5`。这与上表中的应用消费者要求不同。按照[开发指南](../contributing/development.md)安装 workspace，随后运行对应检查。

安装完成后继续[第一个请求](./first-request.md)。
