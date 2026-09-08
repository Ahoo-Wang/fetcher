# Fetcher Wiki Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task in this session. Steps use checkbox (`- [x]`) syntax for tracking. Do not delegate unless the user selects parallel execution.

**Status:** 已实施并验证；按全新文档范围验收，见设计稿与覆盖报告。

**Goal:** 完整重写双语文档站，提供按包复杂度拆分的可靠 Reference，以及参考 Wow 的 Mermaid 阅读体验。

**Architecture:** 继续使用 VitePress 和 Markdown，Reference 按公开 API 家族拆分。复用现有导航、LLM 生成脚本和 Mermaid 渲染器，以浏览器行为验证展示契约。

**Tech Stack:** TypeScript、Vue、VitePress 1.6.x、现有 vitepress-mermaid-renderer、Node 内置测试、现有 Playwright。

**Spec:** `docs/superpowers/specs/2026-09-08-wiki-rewrite-design.md`。

## Global Constraints

- 事实基线为当前工作树 Fetcher 5.0.0；实施前核对 git HEAD 和所有适用 AGENTS.md。
- 工作目录 `/Users/ahoo/.codex/worktrees/c52e/fetcher`，不覆盖主检出的未提交内容。
- 中文完整镜像英文；每页 frontmatter 含 title、description。
- 不修改 SDK API，不新增包或依赖，不包含发布部署。
- 如果现有 Mermaid 渲染器无法满足交互要求，先呈现具体缺口和依赖变更，再取得批准；不能悄悄删减需求。
- 仓库开发环境为 Node >=20.20.2、pnpm 10.34.5；消费者要求逐包读取。
- Mermaid 节点 fills `#2d333b`、borders `#6d5dfc`、text `#e6edf3`；sequenceDiagram 使用 autonumber；换行用 `<br>`。
- 不手改 llms.txt、llms-full.txt 或 dist；以实际公开导出验证文档，不以内部源码目录推断公开 API。
- 单次完成整个站点；任务中的样板和检查点不是缩减范围。提交/推送/部署仅在用户明确请求时执行，提交前 `pnpm test:unit` 必须通过。

## 文件职责与接口

| 文件 | 职责 |
| --- | --- |
| `wiki/reference/<package>/index.md` 及设计稿列出的专题文件 | 包入口、符号到专题锚点的索引与契约 |
| `wiki/zh/reference/<package>/` | 对应完整中文内容 |
| `wiki/{index.md,start/,learn/,recipes/,skills/,contributing/}` 及 `wiki/zh/` 对应目录 | 全站首页、教程、实战与维护内容 |
| `wiki/.vitepress/config/{index,en,zh,mermaid}.ts` | 路由、导航、搜索、sitemap、图表配置 |
| `wiki/.vitepress/theme/{index.ts,custom.css}` | 阅读样式、Mermaid 初始化与生命周期 |
| `wiki/scripts/generate-llms-full.mjs` | 英中规范页面清单及生成输出 |
| `wiki/test/documentation.test.mjs` | 双语/Reference 路径及 LLM 覆盖检查，用 node:test，无新框架 |
| `docs/superpowers/plans/2026-09-08-wiki-reference-coverage.md` | 从公开导出核对得到的符号、专题、源码和验证证据账目 |

页面间接口为设计稿指定的 `/reference/<package>/<topic>`，中文添加 `/zh`；概览页规范 URL 以 `/` 结尾。所有后续任务使用此路径约定。

## Task 1：建立覆盖基线与可运行结构检查

- [x] 读取根、wiki、各包 AGENTS.md；执行 `git status --short`、`git branch --show-current`、`node --version`、`pnpm --version`。确认当前隔离工作树；若 detached HEAD，按仓库约束从 main 建分支并确认设计基线差异。
- [x] 运行 `pnpm install --frozen-lockfile`，不升级锁文件。记录实际安装的 Mermaid 渲染器版本；主检出中的 1.2.0 只能提供接口线索，不能作为本树验证结果。
- [x] 创建覆盖账目：每包一节，列出递归公开导出的符号、所属专题和锚点、实现位置、示例/测试证据。用 TypeScript checker 的 `getExportsOfModule` 核对重导出，用 package.json 的 exports 核对入口；不要把 notification 等未导出目录纳入公开覆盖。
- [x] 创建 `wiki/test/documentation.test.mjs`，使用下列真实契约检查作为起点；复杂度任务完成后逐步加入专题路径和 LLM 检查。

```js
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
const pages = ['reference/fetcher/index.md', 'reference/storage/index.md'];
test('reference entry pages exist in both languages with metadata', () => {
  for (const page of pages) {
    for (const prefix of ['', 'zh/']) {
      const source = readFileSync(new URL(`../${prefix}${page}`, import.meta.url), 'utf8');
      assert.match(source, /^---\r?\n/);
      assert.match(source, /^title: .+/m);
      assert.match(source, /^description: .+/m);
    }
  }
});
```

- [x] 执行 `node --test wiki/test/documentation.test.mjs`，确认因新入口页缺失失败；不为凑检查通过创建空白页。

## Task 2：Fetcher 与 Storage 完整参考样板

**Files:** 新建两种语言的 `reference/fetcher/{index,client,requests,urls,results,interceptors,errors-and-cancellation}.md` 和 `reference/storage/{index,key-storage,serialization-and-runtime}.md`；更新覆盖账目。

- [x] 读取 Fetcher 根公开导出对应实现及测试；按表记录客户端默认值、合并顺序、HTTP 方法返回值、URL/头/体转换、Extractor、拦截器顺序、超时与外部取消的区别。
- [x] 编写上述 Fetcher 英文专题，每个行为说明定位到实现源码行，入口页链接所有公开符号；必要辅助类型归入所属主题。
- [x] 逐页完成 Fetcher 中文内容，保持签名、默认值和示例一致。
- [x] 读取 KeyStorage、env、InMemoryStorage、Serializer 及测试；完成 Storage 两种语言页面，明确删除与销毁、订阅解绑、跨上下文事件及序列化失败行为。
- [x] 从完整示例提取临时 `.ts` 文件，使用公开包入口，通过 `pnpm exec tsc --noEmit --strict --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck <example-file>` 检查。装饰器与 JSX 示例使用包自己的编译选项，不能强套此基础命令。
- [x] 运行结构检查和 `pnpm --dir wiki build`；修复失效链接，再作为其余包的写作基线。

## Task 3：Decorator

**Files:** 双语 `reference/decorator/{index,services-and-endpoints,parameters,execution}.md`。

- [x] 核对 apiDecorator、endpointDecorator、parameterDecorator、reflection、requestExecutor、executeLifeCycle 及测试。
- [x] 写服务/端点选择与装饰器参数矩阵，写参数位置/绑定规则，写合并、继承、返回提取、生命周期和取消；完整翻译。
- [x] 按包 tsconfig 验证完整服务示例；记录公开符号覆盖，加入页面清单，运行结构检查与 wiki build。

## Task 4：EventBus 与 EventStream

**Files:** 双语 `reference/eventbus/{index,events-and-delivery,broadcast-and-messengers}.md`、`reference/eventstream/{index,sse-pipeline,json-and-results,consumption-and-cancellation}.md`。

- [x] 核对串行/并行/广播实现和 messengers；说明事件类型、处理器返回值、失败传播、订阅与销毁，不将并发投递描述成保证顺序。
- [x] 核对文本行、SSE、JSON 转换及 Response/Extractor、ReadableStream 工具；说明帧边界、终止标记、解析失败、取消与 reader 所有权。
- [x] 完成英中页面；用本地 ReadableStream 构造正常帧、跨 chunk 帧和无效 JSON 示例，验证输出/失败与说明一致。
- [x] 将每页及符号纳入账目与结构检查，运行 wiki build。

## Task 5：OpenAPI 与 Generator

**Files:** 双语 `reference/openapi/{index,documents-and-operations,schemas-and-references,security-and-extensions}.md`、`reference/generator/{index,cli,configuration,generated-output,programmatic-api,wow-discovery}.md`。

- [x] 核对 OpenAPI 类型族与引用/扩展边界；以实际类型声明解释 3.0/3.1 表达范围，不宣称运行时校验。
- [x] 读取 Generator CLI、types、根 CodeGenerator、配置解析、输出管理和 aggregateResolver；写精确选项、默认值、配置失败/覆盖行为、公开 API 与内部实现边界。
- [x] 为 Wow discovery 写命中与不命中矩阵：root tags、inline requestBody、200 response 指向 wow.CommandOk、snapshot_state.single 与 snapshot.count。
- [x] 完成英中页面，运行 `pnpm --filter @ahoo-wang/fetcher-generator... build`；从 generator 包目录对现有 test/demo.spec.json 和 CQRS eval 输入运行 `node dist/cli.js generate -i <绝对输入路径> -o <临时输出路径> -t tsconfig.json`。执行时以实际绝对路径替换两个参数，禁止写入源码生成目录。
- [x] 检查生成类型与客户端编译结果，更新覆盖账目，运行结构检查与 wiki build。

## Task 6：OpenAI 与 CoSec

**Files:** 双语 `reference/openai/{index,client-and-completions,streaming}.md`、`reference/cosec/{index,configuration,tokens-and-refresh,interceptors-and-attribution}.md`。

- [x] 核对 OpenAI、ChatClient、completionStreamResultExtractor 和类型；只说明此包实现的 Chat 能力，写请求响应、chunk、终止与取消。
- [x] 核对 CoSec configurer、token manager/storage/refresher、各拦截器和归属信息；画实际调用顺序并说明并发刷新、重试、失败和清理。
- [x] 完成英中内容，使用 mock/local response 验证流示例；鉴权示例不放真实凭据，不宣称已接入外部服务。
- [x] 运行结构检查、需要时的 Mermaid 修复和 wiki build。

## Task 7：React

**Files:** 双语 `reference/react/{index,fetcher-hooks,promise-and-query-state,api-hooks,debounce,storage-and-events,cosec,wow,monitoring-and-utilities}.md`。

- [x] 递归核对根导出的 api/core/cosec/storage/fetcher/wow/eventbus/dataMonitor；对每个 Hook 记录输入、返回状态、自动执行条件、依赖变化及卸载处理。
- [x] 编写基础请求、Promise/Query 与工厂专题；把通用错误/取消规则放在状态专题，其他页链接并列出特例。
- [x] 编写 debounce、Storage/EventBus、CoSec、Wow、monitor/utilities，涵盖 fullscreen 等公开辅助 API；不增加 notification 页面。
- [x] 完成中文镜像，按 React 包 JSX/类型配置检查示例，核对已有状态/竞争/取消测试证据。
- [x] 更新公开覆盖，运行结构检查与 wiki build。

## Task 8：Wow

**Files:** 双语 `reference/wow/{index,configuration,commands,snapshot-queries,filters,query-options,cursor-queries,aggregations,events-and-history,shared-types}.md`。

- [x] 核对 configuration/command/query/types 的公开 API，分别记录传输配置、命令阶段/头/结果和快照查询方法/返回结构。
- [x] 写 filters 操作符与组合、query-options 的分页/投影/排序、cursor 的遍历和退出边界；明确每个默认值。
- [x] 写聚合 flat/nested/builders，事件查询与历史状态，shared-types 中的领域、权限、消息和端点公共类型。
- [x] 完成中文镜像与类型正确示例，核对符号覆盖后运行结构检查及 wiki build。

## Task 9：Viewer

**Files:** 双语 `reference/viewer/{index,models-and-state,view-and-viewer,saved-views,fetcher-viewer,filters,tables-and-cells,registries-and-inputs,toolbar-and-locale}.md`。

- [x] 核对公开 models、View/Viewer/FetcherViewer、状态 hooks 与 client；说明受控状态、回调、保存失败、刷新和结果一致性，不从组件名推测行为。
- [x] 分开编写本地视图管理与远端 Viewer 集成；列明 props、事件、持久化所有权。
- [x] 编写过滤器、列与单元格、注册表/输入、工具栏/语言专题，入口符号表覆盖公开子组件与工具函数。
- [x] 完成中文；用当前 Storybook 的实际 story 路径链接交互示例，不重写 Storybook。
- [x] 检查 JSX 示例、结构与 wiki build。

## Task 10：全站教程与首页重写

**Files:** 两种语言的 `index.md`、`start/*.md`、`learn/*.md`、`recipes/*.md`、`skills/*.md`、`contributing/*.md`。

- [x] 重写 Start 四页：选择需求、安装、首次请求与错误处理、按需选包；区分库使用者与仓库贡献者 Node 要求。
- [x] 重写 Learn 五页，按请求/结果→错误/超时→管线→流→React 组织；每页链接具体 Reference 专题。
- [x] 重写七个 Recipes，每篇给完整任务输入、关键步骤、结果、失败边界和下一步，不复制 Reference API 表。
- [x] 核对 skills/plugins.json 和实际 Skill 安装/入口，重写五个 Skills 页面；重写四个 Contributing 页面，命令与根 package.json 一致。
- [x] 重写双语首页：定位、一个完整请求示例、开始使用按钮、按需求的生态入口；使用 VitePress 原生布局及现有品牌资源。
- [x] 检查所有完整示例及双语事实，运行 wiki build。

## Task 11：导航与 LLM 输出

**Files:** `wiki/.vitepress/config/{en,zh,index}.ts`、所有旧 `reference/<package>.md`、`wiki/scripts/generate-llms-full.mjs`、`wiki/test/documentation.test.mjs`。

- [x] en/zh 配置使用设计中的顶栏和包专题侧栏；确保更具体的包前缀匹配完整专题树，并提供回包索引链接。
- [x] 删除旧单页、包入口的旧章节索引与兼容路由，只保留新的包目录和专题。
- [x] sitemap 使用当前页面集合，无需旧页面排除规则。
- [x] 所有站内链接指向当前专题，英文和中文入口均可访问。
- [x] 更新 PAGE_SECTIONS 到全部规范新页面；英文或中文缺失都让生成器抛错，不能只警告后发布不完整语料。
- [x] 扩展结构检查：全部规范页双语存在、frontmatter 完整、生成的 `<doc path="...">` 集合包含所有规范路径。用 `assert.deepEqual(new Set(actual), new Set(expected))` 对比集合。
- [x] 运行 `pnpm --dir wiki generate:llms`、`node --test wiki/test/documentation.test.mjs`、`pnpm --dir wiki build`，检查 sitemap 和生成语料。

## Task 12：Mermaid 阅读交互与站点样式

**Files:** `wiki/.vitepress/theme/{index.ts,custom.css}`、`wiki/.vitepress/config/mermaid.ts`；如现有 API 必须局部适配，则适配放在 `wiki/.vitepress/theme/mermaid.ts`，不引入第二套渲染器。

- [x] 阅读锁文件安装版本的 d.ts、README 和渲染实现，找到 MermaidToolbarOptions 的实际接入点。主检出 1.2.0 类型声明中 toolbar 不属于 MermaidRendererOptions，不能直接把猜测属性传给 createMermaidRenderer。
- [x] 启动 `pnpm --dir wiki dev --host 127.0.0.1`，选择现有 flowchart/sequenceDiagram 页面录入基线：现有按钮、滚轮、展开和焦点行为。
- [x] 通过该版本真实支持的配置接口选择 dialog 模式，显示 zoomIn/zoomOut/resetView/toggleFullscreen，设置中文/英文工具提示；只实现已确认缺口的最小适配。
- [x] 保持原始 Mermaid 源码用于失败展示，使用现有深色图表变量；验证主题切换和多图/路由变化不会重复初始化或残留监听。
- [x] 对照 Wow Mermaid.vue 验证拖动、Ctrl/Command 滚轮、普通滚动、适配重置、Esc/空白关闭、焦点限制与恢复、背景滚动锁、触屏工具栏；对未满足的行为先写最小浏览器复现，再修补并重跑。
- [x] 调整 custom.css 的正文宽度/行高/标题/代码/表格和响应式间距；保持焦点样式、减少动态偏好及局部横向滚动。
- [x] Mermaid 展示验证完成后运行 wiki build；记录桌面/移动、英中、深浅主题截图和实际检查结论。

## Task 13：整体交付验证

- [x] 自审公开符号账目，确保没有未归属项，抽查 API 签名、默认值和失败说明对应当前源码。
- [x] 运行 `pnpm --dir wiki fix:mermaid`，检查是否波及无关文档并收窄；运行 `pnpm --dir wiki build` 与 `node --test wiki/test/documentation.test.mjs`。
- [x] 使用 `pnpm --dir wiki preview --host 127.0.0.1` 验证最终产物：首页→首次请求→专题，跨包切换，英中对应页，搜索，所有 Mermaid 操作；覆盖 390px 手机和桌面视口。
- [x] 对源码变更对应的包运行测试/构建；本任务原则上不修改包源码。准备提交时必须执行 `pnpm test:unit`。
- [x] 执行 `git diff --check`、`git status --short`，核对没有 SDK 修改、无关格式化和手改生成产物。
- [x] 向用户交付变更摘要、预览入口、真实验证结果和剩余阻塞；没有部署请求则不发布。不得以计划完成冒充站点完成。

## 自审记录

设计的 12 包拆分对应任务 2–9；全站内容任务 10；双语/生成任务 11；视觉和 Wow Mermaid 契约任务 12；覆盖和最终浏览器验证任务 1、13。API 事实核对安排在每个包任务中，未将内部符号推测成公共契约。当前计划不声称已验证 Mermaid 锁定版本行为。

完成证据见 `2026-09-08-wiki-reference-coverage.md`。按用户最新要求交付全新文档，不保留旧文档兼容层。
