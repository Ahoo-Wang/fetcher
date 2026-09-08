---
title: 选择验证边界
description: 选择验证边界 — Fetcher
---

# 选择验证边界

## 让证据对应变更

| 变更           | 命令                                           | 验证内容                             |
| -------------- | ---------------------------------------------- | ------------------------------------ |
| 包行为         | `pnpm --filter @ahoo-wang/fetcher test`        | 聚焦 Vitest 套件                     |
| 全部包行为     | `pnpm test:unit`                               | 包测试、覆盖率及声明的类型检查       |
| 服务集成       | `pnpm test:it`                                 | 需要 integration README 中的服务准备 |
| Storybook 交互 | `pnpm test:storybook`                          | 浏览器交互断言                       |
| 文档           | `pnpm --dir wiki build`                        | 构建和内部链接                       |
| 参考覆盖       | `node --test wiki/test/documentation.test.mjs` | 双语页面元数据与生成语料             |

测试遵循各包已有布局。React 和 Viewer 使用 jsdom，Viewer 加载 test/setup.ts。Storybook 浏览器测试独立于 test:unit。

## 在浏览器检查 Mermaid

启动 `pnpm --dir wiki dev --host 127.0.0.1`，然后执行：

```bash
node --test wiki/test/mermaid-browser.test.mjs
```

检查通过已有 Playwright 依赖调用本机 Chrome；可设置 WIKI_TEST_URL 指向预览服务器。它验证展开图表的对话框语义、键盘退出和焦点恢复。还需观察缩放、拖动、语言、主题、触屏控件与普通页面滚动。

## 提交之前

运行受影响包的测试/构建及 pnpm test:unit。报告实际命令、受服务前置条件阻塞的检查和警告。未执行的集成检查不能证明服务端兼容。
