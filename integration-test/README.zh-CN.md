# 集成测试

该工作区使用真实 HTTP 服务验证已构建的 Fetcher 包。它与确定性的包单元测试明确分离。

## 测试范围

- 针对 JSONPlaceholder 的核心 Fetcher 与 Decorator 请求。
- 提供 LLM 测试变量时，对 OpenAI 兼容服务执行流式与非流式调用。

Wow 客户端与生成代码的用例已随 Wow 相关包迁到
[Wow 仓库](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)，在那里对着同一提交构建的
Wow 服务端运行。

## 前置条件

- 安装根目录依赖。
- 测试前构建全部包。
- JSONPlaceholder 测试需要外网访问。
- LLM 测试变量只通过环境提供，禁止提交具体值。

## 测试

在仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:it
```

诊断时运行单个测试：

```bash
pnpm --dir integration-test vitest run test/fetcher/typicodeFetcher.test.ts
```

## 可选 LLM 环境变量

- `FETCHER_LLM_BASE_URL`
- `FETCHER_LLM_API_KEY`
- `FETCHER_LLM_MODEL`

这些测试会联系配置的供应商，并可能产生成本。除非需要实时集成证据，否则不要放入普通
本地测试。

## 失败诊断

1. 先构建；工作区导入无法解析通常意味着包产物缺失或过期。
2. 区分网络/供应商失败与包单元回归。
3. 完成后取消设置凭据环境变量。

[English](./README.md)
