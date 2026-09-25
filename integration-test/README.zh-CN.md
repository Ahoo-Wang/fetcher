# 集成测试

该工作区使用真实 HTTP 服务验证已构建的 Fetcher 包。它与确定性的包单元测试明确分离。

## 测试范围

用例按是否离开本机分为两组。

| 项目       | 位置                      | 命令                    | CI                                   |
| ---------- | ------------------------- | ----------------------- | ------------------------------------ |
| `required` | `test/`（除 `external/`） | `pnpm test:it`          | `integration-test.yml`，必需检查     |
| `external` | `test/external/`          | `pnpm test:it:external` | `integration-external.yml`，仅供参考 |

`required` 覆盖核心 Fetcher 与 Decorator 请求（`test/fetcher/`、`test/decorator/`），对着本地
JSONPlaceholder 运行。运行前，`test/jsonplaceholder/globalSetup.ts` 在空闲端口上按
JSONPlaceholder 自身的运行方式启动 [json-server](https://github.com/typicode/json-server) 0.17：
写操作是模拟的（`POST` 返回 201 与新 id，`PUT`/`PATCH` 返回替换或合并后的帖子，`DELETE` 返回
`{}`，下一次请求看到的数据不变），支持 `?userId=` 过滤与 `/users/1/posts` 这类嵌套路由。
`test/jsonplaceholder/db.json` 是真实数据集的一小部分（用户 1–2 及其帖子、相册、待办、评论）。
服务地址以 `JSONPLACEHOLDER_BASE_URL` 发布，`typicodeFetcher` 读取它；自己设置该变量则不启动
本地服务，同样的用例可以对着其他主机运行：

```bash
JSONPLACEHOLDER_BASE_URL=https://jsonplaceholder.typicode.com pnpm test:it
```

`test/external/` 收纳所有访问公网主机的用例：提供 LLM 测试变量时，对 `FETCHER_LLM_BASE_URL`
指向的 OpenAI 兼容服务执行流式与非流式调用。

第三方超时并不说明本仓库有问题，所以这些用例不阻塞合并与发布：参考性工作流在改动其所测包的
PR、每次推送 `main` 与 `5.x`、以及每天定时运行它们，随后再对着线上站点跑一遍 JSONPlaceholder
用例，以发现本地数据与真实服务之间的偏差。参考运行变红仍值得一看。

只依赖本地资源的新用例放在 `test/`；访问 CI 作业之外主机的用例放在 `test/external/`。
JSONPlaceholder 用例需要本地数据中没有的记录时，从真实数据集复制到 `db.json`。

Wow 客户端与生成代码的用例已随 Wow 相关包迁到
[Wow 仓库](https://github.com/Ahoo-Wang/Wow/tree/main/typescript)，在那里对着同一提交构建的
Wow 服务端运行。

## 前置条件

- 安装根目录依赖。
- 测试前构建全部包。
- `pnpm test:it` 无需其他准备：它自己启动 JSONPlaceholder。
- LLM 测试变量只通过环境提供，禁止提交具体值。

## 测试

在仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:it            # 必需用例，本地 JSONPlaceholder
pnpm test:it:external   # 访问公网的用例
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
