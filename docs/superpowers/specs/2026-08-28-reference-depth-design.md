# Fetcher 全量参考文档深化设计

## 背景

Fetcher 文档站已经完成信息架构重写，`reference/` 与 `zh/reference/` 为 12 个 Package
提供了独立页面。不过除 Wow 外，其余页面仍以概览、能力列表和少量示例为主，开发者无法在
一个页面内准确查到方法签名、默认值、返回结构、失败边界与生命周期约束。结果是 Reference
页面仍需要跳回源码或 Agent Skill 才能完成普通开发任务。

本次改造保持现有路由、导航与主题不变，把全部 Package Reference 统一升级为“可查询、可复制、
可诊断”的开发者手册。已经深化的 Wow Reference 是内容深度和组织方式的基线，但其他页面按各自
领域调整章节，不机械复制 Wow 的目录。

## 目标

1. 让开发者在单个 Package Reference 页面内完成 API 选择、配置、调用、返回值处理和故障定位。
2. 所有事实都可追溯到当前 `packages/*/src` 公共导出、类型声明和运行时实现。
3. 英文与中文页面保持相同的 API 事实、示例结构、默认值和边界说明。
4. 示例以实际公开入口导入，能够通过 TypeScript 类型检查或对应 CLI/构建验证。
5. `llms.txt` 与 `llms-full.txt` 由现有生成器同步更新，不维护第二份手写索引。

## 非目标

- 不调整 VitePress 主题、CSS、页面布局、侧栏和顶栏。
- 不增加 Package、依赖、文档生成器或 TypeDoc 流程。
- 不修改运行时代码、公开 API、Storybook 或 Skill 内容。
- 不为每个导出类型复制完整源码；Reference 只展示完成开发任务所需的公开契约。
- 不拆分现有 Package Reference 路由。

## 用户与核心任务

主要用户是直接使用 Fetcher Package 的 TypeScript/React 开发者，以及排查集成问题的维护者。
每个页面应支持以下任务：

1. 判断该 Package 是否解决当前问题，以及需要安装哪些 Peer Dependency。
2. 在多个 Client、Hook、Decorator、Transport 或 Component 中选择正确入口。
3. 找到公开方法/组件的输入、返回值、默认值和异常或失败方式。
4. 复制一个类型正确、上下文完整的最小示例。
5. 理解资源所有权、取消、清理、并发、缓存或序列化等生命周期约束。
6. 通过故障现象表快速定位配置、类型、运行时或协议层问题。
7. 跳转到带行号的公共导出与关键实现源码。

## 统一页面契约

除 Package 特有章节外，每个 Reference 页面按以下顺序组织：

1. **定位与边界**：一句话说明用途、适用场景和不适用场景。
2. **安装**：Package、Peer Dependency、运行时前置条件。
3. **入口选择**：用表格映射开发目标到 Client、Hook、Decorator、Class 或 CLI。
4. **共享配置/基础模型**：说明构造参数、Provider、Registry、Transport 或配置文件。
5. **核心 API**：方法/组件矩阵，包含参数、返回值、默认值、同步/异步或 Endpoint。
6. **类型化示例**：覆盖最常用成功路径，示例导入必须完整。
7. **高级契约**：按 Package 领域解释 Interceptor、并发、序列化、流、生命周期或生成流程。
8. **返回结构与错误边界**：区分 HTTP 错误、业务错误、解析错误、取消和资源清理。
9. **故障定位**：`现象 → 检查项` 表格，覆盖最常见误用。
10. **源码参考**：采用 `[file:line](...#Lline)` 格式链接公共导出与关键实现。

页面不要求相同标题名称，但必须完整回答上述问题。表格用于方法矩阵和枚举映射；连续流程和
细微语义使用短段落与示例，不为追求表格而压缩必要解释。

## Package 分组与领域深度

### 核心 HTTP

- **Fetcher**：构造配置、HTTP 方法、请求合并顺序、URL 模板、ResultExtractor、Interceptor
  阶段、状态校验、超时/取消和错误类型。
- **Decorator**：Class/Endpoint/Parameter Decorator 矩阵、Metadata 合并、继承、返回类型、
  自动执行和取消。

### 事件与流

- **EventBus**：Serial/Parallel/Broadcast 语义、Typed/Named Event、Handler 返回值、
  Messenger 选择、错误传播和销毁。
- **EventStream**：SSE Frame、TransformStream Pipeline、Response Helper、JSON 解码、
  终止/取消和转换错误。
- **Storage**：KeyStorage 配置、Serializer、Storage 选择、Listener、删除与销毁语义。

### 类型、生成与集成

- **OpenAPI**：Document/Path/Operation/Schema/Reference/Extension 类型族，类型包边界与零运行时。
- **Generator**：CLI、配置文件、输出、插件/模板入口、Wow 发现规则、错误与可复现验证命令。
- **OpenAI**：高层 Client、Fetcher 组合、Chat Completion、流式 Chunk、取消和协议错误。
- **CoSec**：配置、Token Storage、Refresh、Interceptor 顺序、Resource Attribution 与安全边界。

### React 与 Viewer

- **React**：Provider/Fetcher 来源、Promise/Query Hook 矩阵、Debounce、Fullscreen、
  Notification、Wow Hooks、状态所有权和取消。
- **Viewer**：Viewer/View/FetcherViewer、Registry、Cell/Filter/Input、保存视图、事件、
  LocalStorage/回调持久化、组件扩展与失败边界。

### Wow

Wow Reference 已达到目标深度。本次只做一致性检查，不重复扩写；若其他页面引入统一术语，
仅修正必要的交叉链接或措辞。

### Reference Index

索引页继续按责任选择 Package，但增加每页覆盖范围和“Reference / Recipe / Skill / Storybook”
的使用分工，不复制子页面 API。

## 事实验证策略

每个页面按以下证据优先级编写：

1. `packages/<name>/src/index.ts` 及其 re-export 链决定公共入口。
2. 公开 Class、Function、Type、Enum 的源定义决定签名、默认值和运行时行为。
3. Package Test 与 Integration Test 用于确认边界行为和可运行用法。
4. Package README 与对应 `skills/*/references/api.md` 只作为定位线索；与源码冲突时以源码为准。
5. 文档不得描述未导出的符号、推断不存在的默认值，或把服务端校验写成客户端校验。

每个任务完成时记录已核对的公共入口和关键实现文件，Reviewer 必须再次检查高风险事实：默认值、
返回泛型、取消/清理、并发顺序、CLI 选项和错误传播。

## 示例契约

- 示例使用 `@ahoo-wang/*` 公共 Package 导入，不使用内部相对路径。
- 每个代码块包含理解该片段所需的导入；只有紧邻且明确延续前一代码块时允许复用变量。
- 涉及 Projection、Partial Result 或泛型 Row 时显式标注返回类型，避免运行时部分对象被声明为完整类型。
- Streaming 示例展示 `for await` 或 Reader 生命周期，并说明取消方式。
- React 示例展示 Provider/Fetcher 来源和 Hook 所有权，不在 render 期间创建不稳定实例。
- CLI 示例给出完整命令和输入/输出路径。
- 人类说明文档不增加文本快照测试；可复制 TypeScript 示例通过临时编译文件验证，CLI 示例运行真实构建产物。

## 双语规则

- `wiki/reference/<package>.md` 与 `wiki/zh/reference/<package>.md` 同批修改。
- 标题可以自然本地化，但章节顺序、表格行、API 名称、默认值和示例必须对称。
- 中文正文使用开发者熟悉的 API 英文名，不强行翻译 Class、Hook、Decorator、Stream 等标识。
- Reviewer 按页面对检查双语事实，不能只比较文件长度。

## 验证与质量门禁

每个 Package 组完成后执行：

1. `git diff --check`
2. 对新增 TypeScript 示例执行 Bundler Module Resolution 的临时 `tsc --noEmit` 检查；检查文件不提交。
3. Generator CLI 示例使用已构建的 `packages/generator/dist/cli.js` 对真实 Fixture 运行。
4. 最终执行 `pnpm --dir wiki build`，确认 Mermaid、Markdown、路由和 76 页 LLM 生成均成功。
5. 最终执行 `pnpm test:unit`，满足仓库提交门禁。
6. 独立 Reviewer 对 `origin/main...HEAD` 做事实、双语、示例和范围审查。

现有 Chunk Size、Vite Native Config 与 jsdom 能力 Warning 可记录为既有噪声；新增 Error、失效链接、
缺页、类型错误或生成物漂移必须阻断提交。

## 交付与提交边界

实施按领域分组提交，便于审查与回退：

1. 核心 HTTP：Fetcher、Decorator。
2. 事件与流：EventBus、EventStream、Storage。
3. 类型与生成：OpenAPI、Generator。
4. 集成：OpenAI、CoSec。
5. React 与 Viewer。
6. Reference Index、跨页一致性、LLM 生成物和最终验证。

每个提交只包含对应中英文页面。`llms.txt` 与 `llms-full.txt` 在最终提交统一生成，避免每组提交重复产生
大体积机械差异。

## 完成标准

- 11 个待深化 Package 的中英文 Reference 全部满足统一页面契约。
- Wow 页面保持现有深度且交叉链接正确。
- Reference Index 能准确引导到 12 个 Package。
- 所有公开 API 事实可由当前源码定位，源码链接包含行号锚点。
- 核心示例类型检查通过，Generator 示例可由真实 CLI 验证。
- 英文与中文 API 事实对称。
- Wiki 构建、LLM 生成、完整单元测试和独立审查通过。
- 不包含主题、导航、运行时代码、Package API 或依赖变更。
