---
title: 文档
description: 保持 Fetcher Wiki、README、示例、图表与包 Skill 准确且中英文对齐。
---

# 文档

## 事实来源

Wiki 负责学习路径、实战指南与参考；根目录和包 README 是简短入口。记录符号、签名、
默认值或失败行为前，先核对公开包入口以及实现或测试。

## 双语对齐

除生成产物外，每个英文 Wiki 页面都应在 `wiki/zh/` 下相同路径拥有中文对应页。标题、
示例、链接和图表保持同构；自然翻译解释，但不要翻译 API 标识符。

每个页面以唯一标题和描述开始：

```yaml
---
title: 第一个请求
description: 安装 Fetcher，并在五分钟内完成类型化 HTTP 请求。
---
```

## 示例与安全

- 最小有用示例应可复制。
- 使用 `example.com`、`example.test`、固定假 ID 和明显占位符。
- 文档或 Storybook 中禁止出现凭据、私有主机、个人数据或实时服务调用。
- 涉及密钥时说明浏览器与服务端信任边界。

## Mermaid

使用现有深色配色；时序图使用 `autonumber`；节点标签内使用 `<br>`。构建前校验：

```bash
pnpm --dir wiki fix:mermaid
pnpm --dir wiki build
```

## 生成产物

不要手工编辑 `wiki/llms.txt`、`wiki/llms-full.txt` 或 `wiki/.vitepress/dist/`。
构建输出和生成客户端代码必须从源重新生成。

## 审查清单

- 英文与中文文件同时变更。
- 名称、签名、默认值与错误匹配源码。
- 内部链接指向规范的 Start、Learn、Recipes、Reference 或 Contributing 路径。
- 代码与图表通过构建。
- 包公开 API 变更同时更新对应 `skills/*/references/api.md`。
