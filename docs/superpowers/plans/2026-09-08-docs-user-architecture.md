# Fetcher 使用者与架构文档 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 完整交付以使用者任务和架构决策为主线的双语文档站点，让首次运行、集成选型和 API 查阅各有清晰路径。

**Architecture:** 保留 VitePress、现有主题和 Mermaid 交互。开始使用、开发指南、架构与选型构成阅读路径，包参考负责精确契约。示例复用 Node、TypeScript 和 Storybook，导航与 LLM 输出同步采用当前页面集合。

**Tech Stack:** Fetcher 5.0.0、VitePress 1.6、TypeScript、React、现有 Storybook/Vitest、Node 内置测试工具。

**Spec:** `docs/superpowers/specs/2026-09-08-docs-user-architecture-design.md`

## Global Constraints

- 中文沟通；英文文档与 `wiki/zh/` 完整镜像，每页包含 title、description。
- 不保留旧文档兼容层、迁移页、旧章节索引或重定向。
- 不修改 SDK API，不新增 workspace 包或外部依赖，不修改根 tsconfig。
- 依赖从 package.json exports、根入口递归导出及其实现核对，不凭旧文档推断。
- 当前仓库要求 Node >=20.20.2、pnpm 10.34.5；消费者要求按实际包分别说明。
- 已确认的导航、主题对比度和 VitePress 配置改动属于本设计授权范围；不扩大到其他构建重构。
- Mermaid 使用既有交互；节点 fill #2d333b、border #6d5dfc、text #e6edf3；时序图 autonumber，不写 `<br/>`。
- 生成文件只能通过命令更新。提交前必须通过 pnpm test:unit。未获提交、推送或发布指令时保留本地改动，不自动执行这些操作。
- 当前隔离目录为 `/Users/ahoo/.codex/worktrees/c52e/fetcher`，分支 `codex/docs-user-architecture`，从 origin/main 建立；不重用已合并分支。
- 每任务先读目标目录 AGENTS.md；文案改写不额外添加镜像实现的测试。行为变更复用现有测试环境验证。

## 文件职责与依赖顺序

| 文件                                                           | 职责                                                   |
| -------------------------------------------------------------- | ------------------------------------------------------ |
| `wiki/index.md`、`wiki/start/*.md`                             | 首页、选择起点、安装、首个请求和视图                   |
| `wiki/guides/<group>/*.md`                                     | 完成实际任务                                           |
| `wiki/architecture/*.md`                                       | 选型、状态、依赖与失败边界                             |
| `wiki/reference/<package>/{index,symbols}.md` 及现有专题       | 概览、精确契约、完整索引                               |
| `wiki/examples/*.md`、`wiki/examples/http/`                    | 可运行示例说明及 HTTP 源文件                           |
| `stories/docs/*.stories.tsx`                                   | React 与 Viewer 文档样例，自动被现有 stories glob 发现 |
| `wiki/.vitepress/config/{en,zh,reference}.ts`、`reference.mjs` | 导航与参考清单                                         |
| `wiki/scripts/generate-llms-full.mjs`                          | 页面收集和代码引用展开                                 |
| `wiki/test/{documentation,mermaid-browser}.test.mjs`           | 内容输出与既有交互回归                                 |
| `wiki/.vitepress/theme/custom.css`                             | 文本对比度、代码和表格溢出                             |
| `wiki/AGENTS.md`、贡献与 Skills 页面                           | 与实际结构一致的维护和任务入口                         |

所有 Markdown 页面改动包含相应 `wiki/zh/` 文件。先执行任务 1；任务 2–4 完成示例闭环，任务 5–8 编写内容，任务 9 原子切换路由与生成器，任务 10 验收。中间阶段不宣称站点交付完成。

### Task 1: 建立完整页面与事实核对清单

**Files:** 新建 `docs/superpowers/plans/2026-09-08-docs-content-map.md`；读取现有 wiki、`packages/*/package.json`、`packages/*/src/index.ts` 及递归导出实现。

**Interfaces:** 输入已确认设计；输出逐页旧路径、新路径、动作、相关源码、读者完成标准。此表是后续执行检查表，不进入站点或运行时。

- [x] 检查 git status、branch、main 基线，保留已有设计和计划文件。
- [x] 列出全部现有双语页面；为每页标记重写、合并或删除，合并目标必须出现在下列页面清单。
- [x] 固定新页面列表：start 为 index、installation、first-request、first-view、next-steps；architecture 使用设计中的七页；examples 为 index、http、react、viewer。
- [x] Guides 固定六组：http（index、shared-client、requests、results、failures、cancellation、interceptors）；services（index、declarative-client、generated-client）；streaming（index、sse、chat）；react（index、requests、queries、debounce、cleanup）；viewer（index、local-data、pagination-and-sorting、filters、saved-views、remote-data）；integrations（index、wow、cosec、storage-and-events）。另有 guides/index。
- [x] 遍历 referencePackages 中全部包，记录公开导出对应的专题和锚点；不把上一轮符号数当作当前事实。
- [x] 检查每个现有页面只有一个处理决定，每个新页面有明确读者任务；不留下无人负责的正文或 API。

### Task 2: 首次 HTTP 请求形成可运行闭环

**Files:** 新建 `wiki/examples/http/{server.mjs,client.ts,tsconfig.json}`、`wiki/examples/http.md`；重写 `wiki/start/{installation,first-request}.md`；镜像中文。

**Interfaces:** 本地服务监听 127.0.0.1:8787，GET /users/1 返回 `{ "id": 1, "name": "Ada" }`，其他路径返回 404。客户端读取该端点并验证固定结果；教程展示实际源文件内容。

- [x] 读取 Fetcher 构造、get、ResultExtractors、错误实现和 package engines；从现有示例抽取最少调用。
- [x] server.mjs 使用 node:http 的 createServer；响应 JSON 设置 content-type，成功和 404 均给确定性 body。SIGINT 正常关闭服务。
- [x] client.ts 使用公开包导入和 Json 结果提取，验证 id/name，不匹配时抛 Error；输出 `Ada`。同时验证不存在路径产生文档声明的 HTTP 错误，不能吞掉未知错误。
- [x] 局部 tsconfig 使用 module ESNext、moduleResolution Bundler、strict、outDir ./dist，仅包含 client.ts。当前声明文件的无扩展导出不兼容 NodeNext，因此不使用 shim 或路径别名掩盖问题。采用现有 TypeScript，不修改根配置。
- [x] 编译核心包和示例，终端启动 fixture，然后运行 client；缺失服务时必须非零退出。命令如下：

```bash
pnpm --filter @ahoo-wang/fetcher build
pnpm exec tsc -p wiki/examples/http/tsconfig.json
node wiki/examples/http/server.mjs
# 在另一终端：
node wiki/examples/http/dist/client.js
```

- [x] 两种语言写出新建目录、package.json 的 ESM 设置、依赖安装、每个文件、命令、预期输出与停止服务方式。仓库验证命令与外部消费者命令明确区分。

### Task 3: React 示例覆盖成功、失败与取消

**Files:** 新建 `stories/docs/ReactRequests.stories.tsx`、`wiki/examples/react.md`；复用 `stories/fixtures/http.ts`、`stories/react/FetcherHooks.stories.tsx`；中文镜像。

**Interfaces:** 使用现有 installFetchFixture 和真实 useFetcher/useDebouncedFetcher；用户操作 Load、Fail、Cancel 后可观察状态，不新增请求状态抽象。

- [x] 读取 React AGENTS、Hook 的选项和返回类型、现有 Storybook fixture 清理机制。
- [x] 从现有 FetcherHooks 故事抽出文档所需最小组件，保留 stable Fetcher 实例、加载/结果/错误状态。取消展示按实际 Hook 契约命名，不能捏造 cancelled 状态。
- [x] 为成功、HTTP 失败、慢请求取消添加 play 交互；先断言没有结果，点击后断言 Ada 或错误。取消后等待原请求结束，断言没有迟到成功结果；fixture 在故事结束恢复。
- [x] 复用 storybook/test 的 expect、userEvent、within，不增加测试框架。运行：

```bash
pnpm exec vitest run --project=storybook stories/docs/ReactRequests.stories.tsx
```

- [x] examples/react 给出消费者入口文件、依赖和运行步骤，解释 fixture 模拟边界；链接真实源码片段和任务指南。

### Task 4: Viewer 示例展示真正的数据视图

**Files:** 新建 `stories/docs/LocalViewer.stories.tsx`、`wiki/examples/viewer.md`、`wiki/start/first-view.md`；复用 `stories/fixtures/viewer.ts` 和 `stories/viewer/Viewer.stories.tsx`；中文镜像。

**Interfaces:** Viewer 使用确定性本地用户数据；分页、排序、过滤作用于同一数据集；保存视图由样例应用持有，不暗示组件自动持久化。

- [x] 读取 Viewer AGENTS、View/Viewer/FetcherViewer 和事件回调实现，列出实际 peer 依赖。
- [x] 从 Viewer 故事保留最小 definition、views、dataSource；将现有只显示回调文字的动作接成本地过滤、排序和分页结果。复用现有处理函数；没有时直接在样例组件计算，不建适配器框架。
- [x] 用 play 验证首屏有 Ada，排序改变行顺序，过滤后只保留匹配行，切页改变行集合；保存后切换视图能恢复相应设置。
- [x] 测试对表格作用域中的行/单元格断言，避免全页 findByText 因多个 Ada 匹配不稳定。
- [x] 运行：

```bash
pnpm exec vitest run --project=storybook stories/docs/LocalViewer.stories.tsx
```

- [x] 写明外部消费者完整安装和入口代码、观察结果、应用状态与后端持久化边界；first-view 引用本样例，不复制第二套逻辑。

### Task 5: 首页、开始使用和开发指南

**Files:** 重写 `wiki/index.md`、`wiki/start/{index,installation,first-request}.md`；新建 start/next-steps、guides 和 examples/index；具体页面使用任务 1 清单；中文镜像。

**Interfaces:** 消费任务 2–4 样例；向每个任务末尾输出对应 architecture/reference 链接。

- [x] 首页改为短定义、两个 CTA、短核心调用和三类需求入口；不展示完整包目录或符号计数。
- [x] start/index 按纯 HTTP、React、Viewer 前提引导；next-steps 指向实际下一任务。
- [x] 逐组写 Guides，按前提→可运行步骤→结果→失败与清理→参考组织。每完成一组核对涉及的源码与两种语言。
- [x] 服务生成指南必须给实际 OpenAPI 输入和 CLI 命令；流指南写明结束与取消；集成指南列出 Wow/CoSec 的服务端前提，不将集成声明为通用开箱即用。
- [x] 用任务 1 内容映射逐页核销；检查所有命令的文件、输入和服务均已交代。

### Task 6: 架构决策与责任边界

**Files:** 新建 `wiki/architecture/{index,package-boundaries,runtime-support,request-lifecycle,state-and-resources,failure-model,integration-decisions}.md`；中文镜像。

**Interfaces:** 消费已核对包依赖和真实调用顺序；提供 Guides 与 Reference 引用的统一事实说明。

- [x] 从 package.json 区分 dependencies、peerDependencies、生成期工具；画包依赖图，明确箭头含义。
- [x] 从 Fetcher 调用实现绘制请求时序图，区分 fetch reject、HTTP 非成功、结果提取失败和取消。
- [x] 逐项写浏览器/Node/SSR 前提；客户端可共享与凭据、存储、事件状态的隔离责任分别说明。
- [x] 绘制 React/Viewer 数据与状态所有权图，列出创建、更新、取消、清理和保存的调用方。
- [x] integration-decisions 使用比较表回答直接/装饰器/生成式客户端以及 View/Viewer/FetcherViewer 选择；同时说明不适用条件和成本。
- [x] 每项保证链接实现证据；没有证据的缓存、重试、验证、一致性保证删除。运行 Mermaid 修复后检查 diff，避免脚本扩大改动。

```bash
pnpm --dir wiki fix:mermaid
```

### Task 7: 核心、协议和工具包参考

**Files:** `wiki/reference/{fetcher,decorator,eventbus,eventstream,storage,openapi,generator,openai,cosec}/` 各 index、现有专题、新 symbols；中文镜像；参考任务 1 导出清单。

**Interfaces:** 每个公开符号映射到一个解释实际契约的专题锚点；symbols 索引供任务 9 纳入导航和 LLM。

- [x] 每包先核对 index.ts 递归导出和实现，再处理下一包；按现有 topic 文件组织，除责任明显不同时不新增专题。
- [x] 将 index 的完整符号表移动到 symbols，入口改为用途、完整安装、最小调用、选择与专题导航。
- [x] 专题补齐参数、默认值、结果、错误、生命周期及选择依据；禁止仅搬运声明。
- [x] 核对索引锚点、联合类型表格渲染和中英文契约一致；源码链接更新为当前 main 的实际行号。
- [x] 逐包核销公开导出表，保留未导出内部实现的边界，不为所有符号分别建页。

### Task 8: React、Wow 与 Viewer 深度参考

**Files:** `wiki/reference/{react,wow,viewer}/` 的 index、symbols 及当前专题；中文镜像。

**Interfaces:** 使用任务 3–4 示例、任务 6 所有权模型；输出复杂入口选择和所有公开契约。

- [x] React 按状态、执行、查询、取消与防抖解释，不把通用类型清单放在入门路径。
- [x] Wow 按命令、查询 DSL、分页和共享契约解释；拆开同时承担不相关职责的巨大 shared-types 页面，拆分后的准确文件名写入任务 1 映射并同步清单。
- [x] Viewer 先解释 View/Viewer/FetcherViewer，再写 props、ref、definition、过滤和保存责任；复杂字段必须有含义和限制。
- [x] index 全部符号表移到 symbols；逐个核对公开导出到实际契约，不以移动表格作为完成。
- [x] 使用者审阅路径：从入口选 API、跳示例、查一个默认值、查取消/持久化边界。四步都能完成才核销该包。

### Task 9: 原子切换导航、生成器和维护入口

**Files:** 修改 `wiki/.vitepress/config/{en,zh,reference}.ts`、`reference.mjs`、`wiki/scripts/generate-llms-full.mjs`、`wiki/test/documentation.test.mjs`、`wiki/test/mermaid-browser.test.mjs`、`wiki/.vitepress/theme/custom.css`、`wiki/AGENTS.md`、双语 Skills/Contributing；删除旧 learn、recipes、start/choose-packages。

**Interfaces:** 最终页面清单供 VitePress 和 LLM 使用；保留 referencePackages 的 `{ name, topics }[]` 形状，每包 topics 最后一项为 symbols。

- [x] 替换四个顶栏主入口，资源菜单添加 examples；相同标签一律指向概览。给每个任务组配置合理前后页，包末不跳入无关包。
- [x] 先更新 documentation.test 的 canonical directories 为 start/guides/architecture/reference/examples/skills/contributing；迁移 union 断言到承载真实契约的页，不删除保护。
- [x] 增加实际片段输出断言：LLM corpus 包含 HTTP 客户端调用和 React/Viewer 样例组件内容，且没有未展开的代码引用。
- [x] 使用 VitePress 支持的代码片段引用，生成器只支持本项目实际采用的一种引用形式。用 node:fs/path 读取目标，限制解析在仓库内、检测丢失文件；缺失时报出引用页和文件路径，不静默留空。不引入通用 Markdown 引擎。
- [x] 新页面清单同时校验两种语言；保留“先校验后写入”顺序。生成器修改前跑新断言确认失败，再修改并通过。
- [x] 替换 Mermaid 测试旧路径为 /architecture/request-lifecycle；不改变既有展开/缩放/键盘行为。
- [x] 正文和链接调整为实际背景下 >=4.5:1；不更换品牌或新增组件体系。长表格/代码局部滚动，保留焦点可见性。
- [x] Skills 与贡献页更新新路线、示例命令、文档职责；wiki/AGENTS 的过时目录树替换为当前结构，保留原有安全和内容规则。
- [x] 按内容映射删除所有被替代页面并更新站内引用，不配置 redirects/rewrites。运行：

```bash
pnpm --dir wiki generate:llms
node --test wiki/test/documentation.test.mjs
pnpm --dir wiki build
```

### Task 10: 完整验证与交付

**Files:** 全部修改文件；任务 1 内容映射记载结果与证据。

**Interfaces:** 输出通过/失败/未执行的明确记录，区分样例行为、构建和人工体验；不自动发布。

- [x] 从外部消费者角度在临时目录按文档运行 HTTP 教程，不利用仓库未说明的别名或依赖。
- [x] 运行两条新 Storybook 示例和现有受影响故事；不把静态截图当作交互验证。
- [x] 从新构建启动预览，用真实浏览器检查首页、start、architecture、Viewer 深度参考、搜索和切换语言，覆盖桌面与 390px、深浅主题。
- [x] 检查键盘可达、焦点、搜索命中、语言保持当前路由、图展开关闭、缩放以及页面不溢出。记录实际背景和文本计算颜色，核算对比度。
- [x] 运行已有 Mermaid 回归测试前确认其 WIKI_TEST_URL 指向当前新构建，不能把旧 dev server 内容当作验收证据。
- [x] 完成下列验证；测试失败先定位原因，不盲目重复或放宽断言：

```bash
pnpm --dir wiki build
node --test wiki/test/documentation.test.mjs
pnpm exec vitest run --project=storybook stories/docs/ReactRequests.stories.tsx stories/docs/LocalViewer.stories.tsx
pnpm test:unit
git diff --check
```

- [x] 对照设计 1–12 节及内容映射确认全站完成；报告剩余风险和未执行项。只有页面迁移、公开契约核对和真实运行均完成才可声明重构完成。
- [x] 用户已授权 PR；使用 `docs: restructure documentation around user tasks and architecture` 等 conventional commit；PR、推送和合并按后续明确指令执行。

## 计划自审

- 设计 1–3 → 全局边界、任务 1/9；设计 4–5 → 任务 2–5；设计 6 → 任务 6。
- 设计 7 → 任务 7–8；设计 8 → 任务 2–4/9；设计 9–10 → 任务 9；设计 11–12 → 任务 10 与任务依赖顺序。
- 不改 SDK，不新建测试框架、工作区包或内容管理系统；全部阶段使用已存在的工具和公开 API。
- 样例、源码核对和双语正文必须实际完成；目录和索引迁移不替代完整内容交付。
