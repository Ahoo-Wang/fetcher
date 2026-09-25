# 集成测试

该工作区使用真实 HTTP 服务验证已构建的 Fetcher 包。它与确定性的包单元测试明确分离。

## 测试范围

用例按是否离开本机分为两组。

| 项目       | 位置                      | 命令                    | CI                                   |
| ---------- | ------------------------- | ----------------------- | ------------------------------------ |
| `required` | `test/`（除 `external/`） | `pnpm test:it`          | `integration-test.yml`，必需检查     |
| `external` | `test/external/`          | `pnpm test:it:external` | `integration-external.yml`，仅供参考 |

`test/external/` 收纳所有访问公网主机的用例：

- 针对 JSONPlaceholder（`jsonplaceholder.typicode.com`）的核心 Fetcher 与 Decorator 请求。
- 提供 LLM 测试变量时，对 `FETCHER_LLM_BASE_URL` 指向的 OpenAI 兼容服务执行流式与非流式调用。

第三方超时并不说明本仓库有问题，所以这些用例不阻塞合并与发布：参考性工作流在改动其所测包的
PR、每次推送 `main` 与 `5.x`、以及每天定时运行它们。参考运行变红仍值得一看。同样这些包的确定性
行为由各自的单元测试（MSW 模拟）覆盖。

只依赖本地资源的新用例放在 `test/`；访问 CI 作业之外主机的用例放在 `test/external/`。目前没有
`required` 用例，因此 `pnpm test:it` 在没有测试文件时通过。

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
pnpm test:it            # 必需用例
pnpm test:it:external   # 访问公网的用例
```

诊断时运行单个测试：

```bash
pnpm --dir integration-test vitest run test/external/fetcher/typicodeFetcher.test.ts
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
