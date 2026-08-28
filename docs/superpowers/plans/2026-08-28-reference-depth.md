# Fetcher 全量参考文档深化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 把除 Wow 外的全部 Fetcher Package Reference 与索引升级为可查询、可复制、可诊断的中英文开发者手册。

**Architecture:** 保持现有 VitePress 路由、导航和主题，通过统一页面契约深化每个 Package 的中英文 Reference。每组任务先从公共导出和运行时实现建立事实表，再重写双语页面、验证高风险示例，并形成独立提交；最后统一生成 LLM 产物和运行全量门禁。

**Tech Stack:** TypeScript、React、VitePress、Markdown、pnpm、Vitest、Fetcher Monorepo Packages

**Spec:** `docs/superpowers/specs/2026-08-28-reference-depth-design.md`

## Global Constraints

- 不修改 `packages/*` 运行时代码、公开 API、依赖、主题、CSS、导航、Storybook 或 Skill。
- 英文 `wiki/reference/*.md` 与中文 `wiki/zh/reference/*.md` 同批修改，并保持 API 事实对称。
- `FilterExpression` 是 Wow 主 API；本计划不重复改写已经深化的 Wow Reference。
- 所有源码引用使用 `[file:line](https://github.com/Ahoo-Wang/fetcher/blob/main/file#Lline)`。
- 示例只从 `@ahoo-wang/*` 公共入口导入；Projection/Partial Result 显式声明返回泛型。
- 不增加文本快照测试；TypeScript 示例用临时编译文件验证，临时文件不得提交。
- `wiki/llms.txt` 与 `wiki/llms-full.txt` 只在最终任务统一生成。
- 每次提交前执行 `pnpm test:unit`；每组至少执行 `git diff --check` 和 `pnpm --dir wiki build`。

---

### Task 1: 核心 HTTP Reference — Fetcher 与 Decorator

**Files:**
- Modify: `wiki/reference/fetcher.md`
- Modify: `wiki/zh/reference/fetcher.md`
- Modify: `wiki/reference/decorator.md`
- Modify: `wiki/zh/reference/decorator.md`

**Interfaces:**
- Consumes: `packages/fetcher/src/index.ts`、`packages/decorator/src/index.ts` 公开导出与对应 Test。
- Produces: Fetcher 请求生命周期、URL/Result/Interceptor 契约，以及 Decorator Metadata/Parameter/Inheritance 契约的完整双语参考。

- [ ] **Step 1: 建立 Fetcher 公共契约清单**

```bash
rg -n '^export \*|^export \{' packages/fetcher/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)' packages/fetcher/src/*.ts
rg -n 'constructor\(|fetch\(|get\(|post\(|put\(|patch\(|delete\(' packages/fetcher/src/fetcher.ts
```

记录并核对 `FetcherOptions`、请求方法、Request Merge 顺序、URL Template、
`ResultExtractor`、Interceptor 顺序、Status Validation、Timeout、AbortController 和公开错误类型。

- [ ] **Step 2: 重写 Fetcher 中英文页面**

两页都包含：定位与安装、Client 配置表、HTTP 方法矩阵、`FetchRequestInit`、URL
解析优先级、ResultExtractor 选择、Interceptor Pipeline、Timeout/取消、错误矩阵、故障定位、
带行号源码链接。最小示例必须展示 Path + Query 参数、类型化 JSON 结果和一次取消。

- [ ] **Step 3: 建立 Decorator 公共契约清单**

```bash
rg -n '^export \*|^export \{' packages/decorator/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)' packages/decorator/src/*.ts
rg -n 'export function (api|endpoint|get|post|put|patch|del|request|path|query|header|body|attribute)' packages/decorator/src
```

核对 `ApiMetadata`、Endpoint Decorator、Parameter Decorator、`ParameterRequest`、返回类型、
Fetcher 选择、AbortController、继承 Metadata 和实例生命周期。

- [ ] **Step 4: 重写 Decorator 中英文页面**

两页都包含：Decorator 选择表、完整 Service 示例、Class/Method/Parameter 矩阵、Metadata
合并顺序、请求执行、返回/取消、继承与实例复用、常见失败、带行号源码链接。

- [ ] **Step 5: 验证 Task 1**

创建不提交的 `.reference-core-check.ts`，组合页面中的 Fetcher 与 Decorator 最小示例，然后运行：

```bash
pnpm exec tsc --ignoreConfig --noEmit --skipLibCheck --target ES2022 \
  --module ESNext --moduleResolution Bundler --experimentalDecorators \
  .reference-core-check.ts
pnpm --dir wiki build
git diff --check
```

删除 `.reference-core-check.ts`，确认 `git status --short` 只显示四个目标页面和计划文件。

- [ ] **Step 6: 提交 Task 1**

```bash
pnpm test:unit
git add docs/superpowers/plans/2026-08-28-reference-depth.md \
  wiki/reference/fetcher.md wiki/zh/reference/fetcher.md \
  wiki/reference/decorator.md wiki/zh/reference/decorator.md
git commit -m "docs: deepen core HTTP references"
```

### Task 2: 事件、流与存储 Reference

**Files:**
- Modify: `wiki/reference/eventbus.md`
- Modify: `wiki/zh/reference/eventbus.md`
- Modify: `wiki/reference/eventstream.md`
- Modify: `wiki/zh/reference/eventstream.md`
- Modify: `wiki/reference/storage.md`
- Modify: `wiki/zh/reference/storage.md`

**Interfaces:**
- Consumes: `packages/eventbus/src/index.ts`、`packages/eventstream/src/index.ts`、`packages/storage/src/index.ts` 与 Transport/Stream/Serializer 实现。
- Produces: Delivery Semantics、SSE Pipeline、Storage Lifecycle 的完整双语参考。

- [ ] **Step 1: 审计 EventBus 并重写双语页面**

```bash
rg -n '^export \*|^export \{' packages/eventbus/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)' packages/eventbus/src
rg -n 'emit|publish|subscribe|destroy|close|Serial|Parallel|Broadcast' packages/eventbus/src packages/eventbus/test
```

页面必须包含 Serial/Parallel/Broadcast 选择矩阵、Typed/Named Event、Handler 返回与顺序、
Messenger 选择、跨 Tab 能力、错误传播、取消订阅与销毁、故障定位和源码链接。

- [ ] **Step 2: 审计 EventStream 并重写双语页面**

```bash
rg -n '^export \*|^export \{' packages/eventstream/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)' packages/eventstream/src
rg -n 'TransformStream|ResultExtractor|to.*Stream|cancel|abort|close' packages/eventstream/src packages/eventstream/test
```

页面必须包含 SSE Frame、Response Helper、转换 API、Text → Line → SSE → JSON Pipeline、
ReadableStream 消费、终止/取消、转换错误、故障定位和源码链接。

- [ ] **Step 3: 审计 Storage 并重写双语页面**

```bash
rg -n '^export \*|^export \{' packages/storage/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)' packages/storage/src packages/storage/test
```

页面必须包含 KeyStorage 构造配置、方法矩阵、Serializer、Storage Runtime 选择、Listener、
`remove`/`destroy` 区别、跨上下文行为、故障定位和源码链接。

- [ ] **Step 4: 验证 Task 2**

把三个页面的核心 TypeScript 示例组合到不提交的 `.reference-events-check.ts`，执行：

```bash
pnpm exec tsc --ignoreConfig --noEmit --skipLibCheck --target ES2022 \
  --module ESNext --moduleResolution Bundler .reference-events-check.ts
pnpm --dir wiki build
git diff --check
```

删除临时文件并确认六个页面的英文/中文方法矩阵行数对应。

- [ ] **Step 5: 提交 Task 2**

```bash
pnpm test:unit
git add wiki/reference/eventbus.md wiki/zh/reference/eventbus.md \
  wiki/reference/eventstream.md wiki/zh/reference/eventstream.md \
  wiki/reference/storage.md wiki/zh/reference/storage.md
git commit -m "docs: deepen event and storage references"
```

### Task 3: OpenAPI 与 Generator Reference

**Files:**
- Modify: `wiki/reference/openapi.md`
- Modify: `wiki/zh/reference/openapi.md`
- Modify: `wiki/reference/generator.md`
- Modify: `wiki/zh/reference/generator.md`

**Interfaces:**
- Consumes: `packages/openapi/src/index.ts` 类型 re-export、`packages/generator/src`、CLI、配置与 Fixture。
- Produces: OpenAPI 类型导航与 Generator CLI/配置/输出/失败契约的完整双语参考。

- [ ] **Step 1: 审计 OpenAPI 类型面并重写双语页面**

```bash
sed -n '1,240p' packages/openapi/src/index.ts
rg -n '^export (interface|type|enum|const)' packages/openapi/src
```

页面必须包含 Export Group、Document/Info/Server/Path/Operation/Parameter/RequestBody/Response/
Schema/Security/Callback/Reference/Extension 类型族、`ReferenceObject` 分支、OpenAPI 3.0/3.1
边界、类型包零运行时、故障定位和源码链接。

- [ ] **Step 2: 审计 Generator CLI 与配置**

```bash
node packages/generator/dist/cli.js --help
rg -n '^export \*|^export \{' packages/generator/src/index.ts
rg -n 'program\.|option\(|interface .*Config|type .*Config|default' packages/generator/src packages/generator/*.ts
```

核对 CLI Option、配置文件名、输入格式、输出目录、模板/插件入口、Wow 发现规则、错误消息和退出状态。

- [ ] **Step 3: 重写 Generator 中英文页面**

页面必须包含安装与运行、CLI 完整表、配置契约、输出树、Pipeline、Programmatic API、Wow
发现矩阵、可复现失败定位和带行号源码链接。不得把未导出的内部 Helper 描述为公共 API。

- [ ] **Step 4: 运行真实 Generator 验证**

```bash
pnpm --filter @ahoo-wang/fetcher-generator build
cd packages/generator
node dist/cli.js generate \
  -i test/demo.spec.json \
  -o /tmp/fetcher-reference-generator-check \
  -t tsconfig.json
cd ../..
find /tmp/fetcher-reference-generator-check -type f -print -quit
pnpm --dir wiki build
git diff --check
```

配置文件缺失的现有 Warning 可以出现；生成失败、空输出或 TypeScript 错误必须修正文档或示例。

- [ ] **Step 5: 提交 Task 3**

```bash
pnpm test:unit
git add wiki/reference/openapi.md wiki/zh/reference/openapi.md \
  wiki/reference/generator.md wiki/zh/reference/generator.md
git commit -m "docs: deepen OpenAPI references"
```

### Task 4: OpenAI 与 CoSec Reference

**Files:**
- Modify: `wiki/reference/openai.md`
- Modify: `wiki/zh/reference/openai.md`
- Modify: `wiki/reference/cosec.md`
- Modify: `wiki/zh/reference/cosec.md`

**Interfaces:**
- Consumes: `packages/openai/src/index.ts`、`packages/cosec/src/index.ts` 及 Client/Interceptor/Token 实现。
- Produces: OpenAI 协议调用与 CoSec Token/Auth 生命周期的完整双语参考。

- [ ] **Step 1: 审计 OpenAI 并重写双语页面**

```bash
rg -n '^export \*|^export \{' packages/openai/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)' packages/openai/src
```

页面必须包含高层 Client 与自定义 Fetcher 两种入口、配置、Chat Completion Request/Result、
Stream Chunk、SSE 消费、AbortController、HTTP/协议错误、故障定位和源码链接。

- [ ] **Step 2: 审计 CoSec 并重写双语页面**

```bash
rg -n '^export \*|^export \{' packages/cosec/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)' packages/cosec/src
rg -n 'token|refresh|interceptor|storage|resource|destroy|clear' packages/cosec/src packages/cosec/test
```

页面必须包含 Config 表、Token 获取/存储/刷新、Interceptor Pipeline、Resource Attribution、
并发刷新、清理、安全边界、故障定位和源码链接；不得建议记录或持久化敏感 Token 明文。

- [ ] **Step 3: 验证 Task 4**

组合不含真实 Secret 的 `.reference-integrations-check.ts`，执行：

```bash
pnpm exec tsc --ignoreConfig --noEmit --skipLibCheck --target ES2022 \
  --module ESNext --moduleResolution Bundler .reference-integrations-check.ts
pnpm --dir wiki build
git diff --check
```

删除临时文件，并确认示例只使用假 URL、占位 Token Provider 和内存测试数据。

- [ ] **Step 4: 提交 Task 4**

```bash
pnpm test:unit
git add wiki/reference/openai.md wiki/zh/reference/openai.md \
  wiki/reference/cosec.md wiki/zh/reference/cosec.md
git commit -m "docs: deepen integration references"
```

### Task 5: React 与 Viewer Reference

**Files:**
- Modify: `wiki/reference/react.md`
- Modify: `wiki/zh/reference/react.md`
- Modify: `wiki/reference/viewer.md`
- Modify: `wiki/zh/reference/viewer.md`

**Interfaces:**
- Consumes: `packages/react/src/index.ts`、`packages/viewer/src/index.ts` 与对应 Hook/Component Test、Story。
- Produces: React 状态/所有权和 Viewer 组件/Registry/持久化的完整双语参考。

- [ ] **Step 1: 审计 React 公开 Hook**

```bash
rg -n '^export \*|^export \{' packages/react/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)|^export function use' packages/react/src
rg -n 'renderHook|describe\(' packages/react/test packages/react/src -g '*.test.ts' -g '*.test.tsx'
```

建立 Provider/Fetcher 来源、Promise/Query/Debounced/Fullscreen/Notification/DataMonitor/CoSec/Wow
Hook 矩阵，核对参数、状态、执行时机、取消和返回所有权。

- [ ] **Step 2: 重写 React 中英文页面**

页面必须包含安装与 Provider、Hook 选择表、通用 Promise State、Fetcher Query、Debounce、
Fullscreen、Notification、CoSec/Wow 集成、稳定依赖与取消、故障定位和源码链接。

- [ ] **Step 3: 审计 Viewer 公开组件与 Registry**

```bash
rg -n '^export \*|^export \{' packages/viewer/src/index.ts
rg -n '^export (class|interface|type|enum|const|function)' packages/viewer/src
rg -n 'export (const|function).*Registry|create.*Registry|Viewer|FetcherViewer|View<' packages/viewer/src
```

核对 `Viewer`、`View`、`FetcherViewer`、Input/Filter/Cell、Registry、View State、保存/管理回调、
LocalStorage、事件与组件所有权。

- [ ] **Step 4: 重写 Viewer 中英文页面**

页面必须包含组件选择、核心模型、Props/Callback 矩阵、Registry 扩展、Filter/Cell/Input、
View 持久化、FetcherViewer 数据流、Loading/Empty/Error、故障定位、Storybook 与源码链接。

- [ ] **Step 5: 验证 Task 5**

创建不提交的 `.reference-react-viewer-check.tsx`，至少实例化 Provider、一个 Query Hook 类型、
`Viewer` 与一个 Registry 扩展，然后执行：

```bash
pnpm exec tsc --ignoreConfig --noEmit --skipLibCheck --target ES2022 \
  --module ESNext --moduleResolution Bundler --jsx react-jsx \
  .reference-react-viewer-check.tsx
pnpm test:storybook
pnpm --dir wiki build
git diff --check
```

删除临时文件，确认 React 与 Viewer 页面链接到对应 Storybook 场景而不是重复交互说明。

- [ ] **Step 6: 提交 Task 5**

```bash
pnpm test:unit
git add wiki/reference/react.md wiki/zh/reference/react.md \
  wiki/reference/viewer.md wiki/zh/reference/viewer.md
git commit -m "docs: deepen React and Viewer references"
```

### Task 6: Reference Index、双语一致性与最终门禁

**Files:**
- Modify: `wiki/reference/index.md`
- Modify: `wiki/zh/reference/index.md`
- Verify: `wiki/reference/wow.md`
- Verify: `wiki/zh/reference/wow.md`
- Modify generated: `wiki/llms.txt`
- Modify generated: `wiki/llms-full.txt`

**Interfaces:**
- Consumes: 12 个最终 Package Reference、Spec、前五个任务提交。
- Produces: 完整 Reference 导航说明、最终 LLM 语料和可合并验证证据。

- [ ] **Step 1: 重写中英文 Reference Index**

索引必须包含按责任选择表、层级图、每个 Package Reference 的覆盖范围、Reference/Recipe/Skill/
Storybook 分工，以及 12 个有效路由。索引不复制子页方法矩阵。

- [ ] **Step 2: 执行双语事实审计**

```bash
for name in fetcher decorator eventbus eventstream storage openapi generator openai cosec react viewer wow; do
  printf '%s ' "$name"
  rg -c '^#{1,3} ' "wiki/reference/$name.md"
  rg -c '^#{1,3} ' "wiki/zh/reference/$name.md"
done
```

逐页检查方法表行、Enum/默认值、代码块导入、错误边界和源码链接；数量差异必须由自然语言拆行解释，
不能代表遗漏章节。

- [ ] **Step 3: 检查源码链接格式与范围**

```bash
rg -n 'github.com/Ahoo-Wang/fetcher/blob/main/' wiki/reference wiki/zh/reference
git diff --name-only origin/main...HEAD
git diff --check origin/main...HEAD
```

所有新增源码链接必须带 `#L`，变更范围只能包含 Spec、Plan、Reference 页面和 LLM 生成物。

- [ ] **Step 4: 生成最终 LLM 产物并构建 Wiki**

```bash
pnpm --dir wiki generate:llms
git add wiki/llms.txt wiki/llms-full.txt
pnpm --dir wiki generate:llms
git diff --quiet -- wiki/llms.txt wiki/llms-full.txt
pnpm --dir wiki build
```

生成器必须报告 76 页、0 缺失；第二次生成后 Working Tree 相对已暂存产物不得产生额外差异。

- [ ] **Step 5: 运行完整仓库门禁**

```bash
pnpm test:unit
pnpm lint
pnpm test:storybook
git diff --check origin/main...HEAD
```

若 `pnpm lint` 自动修改文件，重新运行受影响页面的 Wiki 构建和差异检查。

- [ ] **Step 6: 独立审查并修复 Findings**

Reviewer 必须核对：公共导出真实性、方法签名/默认值、复制示例、双语对称、失效链接、生成物、范围和
合并就绪度。Critical/Important 全部修复；有事实影响的 Minor 同样修复。

- [ ] **Step 7: 提交最终索引与生成物**

```bash
pnpm test:unit
git diff --check
git add wiki/reference/index.md wiki/zh/reference/index.md \
  wiki/llms.txt wiki/llms-full.txt
git commit -m "docs: complete reference depth rewrite"
```

- [ ] **Step 8: 准备 PR 证据**

```bash
git status --short --branch
git log --oneline origin/main..HEAD
git diff --stat origin/main...HEAD
```

PR 描述列出 6 个领域提交、本地门禁结果、76 页 LLM 生成结果和独立 Review 结论；合并继续遵循
Squash-only、远程 CI 全绿、零未解决线程和不使用管理员绕过的仓库流程。
