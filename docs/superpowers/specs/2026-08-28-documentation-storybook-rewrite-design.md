# Fetcher 公开文档与 Storybook 全面重写设计

**日期**：2026-08-28
**状态**：已确认
**范围**：公开 README、双语 Wiki、Skills 入口、Storybook

## 背景

Fetcher 是包含 12 个包的 TypeScript HTTP 客户端生态。目前公开内容按包、技术主题和受众重复展开，用户需要在 README、Wiki 与 Storybook 之间反复判断哪一份才是最新事实。

本次审计得到以下基线：

- 29 个 README，共 25,615 行；
- 74 个公开 Wiki 页面，共 32,797 行；
- 68 个 Storybook Story 文件，共 20,772 行；
- README 与 Wiki 大量重复包介绍、安装方法、API 表格和示例；
- 多个 Story 把长篇营销文案、代码标签页和演示 UI 混在一个巨型组件中；
- Story 中存在公网请求、私有服务地址和硬编码认证信息，无法离线、稳定或安全地运行；
- 当前 Storybook 已安装 Docs、A11y 与 Vitest addon，但没有可从命令行运行的 Storybook Vitest project。

初始检查时工作树没有安装依赖，`pnpm build-storybook` 与 `pnpm --dir wiki build` 因命令不可用而失败。安装锁定依赖后，当前 `pnpm build`、`pnpm test:unit` 和 `pnpm build-storybook` 均通过，证明现有源码、Wiki 与 Storybook 的本地基线可构建。构建仍报告既有的大 chunk、空 `stories/` glob 和 docgen TypeScript project 警告；公开站点部署状态不在本设计验证范围内。

## 目标

1. 以 TypeScript 开发者为首要用户，同时服务首次接触 Fetcher 的用户和需要精确参考的现有用户。
2. 让用户从项目首页到第一个成功请求只经过一条清晰路径。
3. 为常见跨包场景提供任务导向的完整示例。
4. 让 README、Wiki 和 Storybook 各有唯一职责，不再维护三套重复文档。
5. Storybook 中的交互场景必须离线可复现、无凭据、可自动验证。
6. 中英文公开文档保持相同结构、事实和示例语义。

## 非目标

- 不修改任何包的公共 API、运行时行为或发布版本。
- 不兼容现有 Wiki URL、导航顺序或 Story ID，也不提供重定向。
- 不改变 `skills/` 的工作流或 API Reference 内容；公开 Wiki 负责解释如何选择和调用它们。
- 不手工编辑 `wiki/llms.txt`、`wiki/llms-full.txt` 或 `.vitepress/dist/` 等构建产物。
- 不引入文档生成器、示例抽取器或视觉回归平台；允许使用现有 VitePress 主题扩展点和 CSS 改善导航、Reference 与 Skills 的扫描体验。唯一依赖例外是把 workspace catalog 已固定版本的 `@vitest/browser-playwright` 加入根开发依赖，用于 Storybook CI 浏览器测试。
- 不为行数、页面数或 Story 数设目标；只删除重复或没有用户价值的内容。

## 架构决策

采用“任务导向、单一事实来源”架构：

| 载体      | 唯一职责                           | 不再承担                           |
| --------- | ---------------------------------- | ---------------------------------- |
| README    | 定位、安装、最小示例、下一步入口   | 完整 API、架构长文、场景大全       |
| Wiki      | 学习路径、跨包场景、完整人工参考   | 可操作组件演示、README 内容镜像    |
| Storybook | 可操作、可观察、可测试的浏览器行为 | 纯类型参考、营销长文、第二套文档站 |

事实流向保持单向：

```text
src/index.ts exports + implementation + tests
                    ↓
             Wiki canonical content
              ↙                 ↘
      README short entry      Storybook interaction
```

API 名称、签名、默认值和错误行为必须先从包入口与实现核对，再写入 Wiki。README 只摘取完成首次使用所需的最小部分。Storybook 只解释当前可操作场景，并链接到对应 Wiki 页面。

## README 设计

### 根 README

中英文根 README 使用相同结构：

1. 一句话说明 Fetcher 解决什么问题；
2. 五分钟完成的核心请求示例；
3. 按任务选择包，而不是罗列功能；
4. 三条下一步路径：学习、场景、参考；
5. 开发、贡献、许可证与公开站点链接。

删除未经当前构建测量的体积、性能和“完整支持”等断言。徽章只保留版本、CI、许可证、Wiki 和 Storybook 等能帮助用户决策的项目。

### 包 README

12 个包的中英文 README 统一为：

1. 适用问题和不适用问题；
2. 安装命令与 peer dependency 提示；
3. 一个最小、正确、可复制的示例；
4. 3 至 6 个核心能力；
5. 对应 Wiki Reference、Recipe 与 Storybook 链接。

README 不再复制完整属性表、所有导出符号或多个相似示例。

### 贡献者 README

`integration-test/README*` 和 `.github/workflows/README.md` 只保留实际运行方式、环境要求、失败诊断和相关 Wiki 链接，不承担产品介绍。

## Wiki 信息架构

英文位于根路径，中文在 `/zh/` 下完整镜像。顶层导航统一为：

```text
Start
  Overview
  Installation
  First Request
  Choose Packages

Learn
  Request Lifecycle
  URLs, Bodies and Results
  Interceptors, Errors and Timeouts
  Streaming
  React Data Flow

Recipes
  Declarative Services
  Generate an OpenAPI Client
  Stream an OpenAI Response
  Build a Wow CQRS Client
  Add CoSec Authentication
  Share State and Events
  Build a Data Viewer

Skills
  Overview
  HTTP and Services
  Streaming and OpenAI
  OpenAPI and Generation
  React and Integrations

Reference
  Fetcher
  Decorator
  EventBus
  EventStream
  OpenAI
  OpenAPI
  Generator
  React
  Storage
  CoSec
  Wow
  Viewer

Contributing
  Development
  Testing
  Documentation
```

现有内容迁移规则：

- `guide` 的有效内容进入 `Start` 或 `Learn`；
- `architecture` 改写为面向使用者的 `Learn`，不保留实现细节导览；
- `api` 与 `packages` 合并为 `Reference`，每个包只有一个正式参考页；
- 通用测试方法进入 Recipe，仓库测试说明进入 `Contributing/Testing`；
- contributor onboarding 进入 `Contributing`；
- executive、product-manager、staff-engineer onboarding 删除，不迁移角色化重复内容；
- 旧页面在内容迁移完成后删除，不保留占位页或重定向。

每个学习或场景页面遵循固定阅读顺序：用户目标、前置条件、最小实现、预期结果、失败方式、下一步。Reference 页面按导出能力组织，不照搬源码目录。

## Storybook 设计

### 导航

Storybook 使用任务与体验分组，不按 12 个包复制 Wiki：

```text
Overview
HTTP & Streaming
React Hooks
Viewer / Inputs
Viewer / Filters
Viewer / Tables
Viewer / Complete Flows
```

### 保留范围

- Fetcher：请求构建、超时、拦截器和错误等可观察行为；
- EventStream：分块、完整事件、错误和取消；
- EventBus 与 Storage：串行、并行、跨组件或跨标签页行为；
- OpenAI：仅保留本地模拟的流式响应体验；
- React：加载、成功、空结果、错误、取消和防抖等 Hook 状态；
- Wow React Hooks：保留能展示查询状态或分页行为的代表场景；
- Viewer：公共输入、过滤、表格、视图管理和完整用户流程。

Decorator、Generator、OpenAPI、CoSec 和 Wow 的纯 API 演示移入 Wiki。只有确实能提供浏览器可观察行为的场景才留在 Storybook。

### Story 编写规则

- 使用 Storybook 原生 Docs、Controls、Source 与 `play`，不自制代码标签页或文档框架；
- 组件说明限制为用途、关键约束和 Wiki 链接；
- Controls 只暴露用户理解行为所需的公共属性；
- 每个视觉组件覆盖默认状态和具有不同用户意义的状态，不枚举无意义的参数组合；
- 相似的纯展示 Cell 合并为 Gallery；需要独立交互或 Controls 的组件保留单独 Story；
- 完整流程以用户任务命名，例如筛选、分页、切换视图和保存视图；
- Storybook 使用英文标题与说明，双语长文只存在于 Wiki；
- 删除随机 ID、当前时间和依赖执行顺序的输出，fixture 使用固定值；
- 外部图片改为本地静态资源或不会发起网络请求的内联资源。

### 网络与安全

- 所有 HTTP、SSE 和远程选择行为使用现有 MSW 2.x 或本地 fixture；
- Story 不得访问公网、开发环境、私有服务或真实账户；
- Story 与公开文档中不得包含 token、API key、Cookie、个人标识或真实租户信息；
- 当前已发现的硬编码认证信息从 Story 删除，但从 Git 历史删除并不能撤销它，对应凭据必须在仓库之外轮换；
- 错误、超时和取消由 mock 明确触发，不依赖真实网络故障。

### 交互测试

项目已使用 Storybook 10、Vitest 4、`@storybook/addon-vitest` 和 `@vitest/browser`，workspace catalog 已固定 `@vitest/browser-playwright` 与 Playwright 版本。把该 provider 加入根开发依赖，增加独立的 Storybook Vitest project，并提供 `test:storybook` 脚本：

```text
vitest run --project=storybook
```

所有 Story 至少验证能在真实浏览器环境渲染。关键任务使用 `play` 验证操作结果；表单、对话框、筛选、分页、视图切换和错误恢复同时运行无障碍检查。现有单元测试继续验证组件内部和非浏览器逻辑，Story 测试不重复这些断言。

## 内容与示例质量

1. 公共事实以 `packages/*/src/index.ts` 及其导出实现为准。
2. 关键学习路径必须由现有单元/集成测试或可运行 Story 支撑。
3. 普通 Markdown 示例在编写时针对当前 TypeScript API 做最小编译验证，不增加永久示例解析器。
4. 文档只描述已经存在的行为；没有源码、测试或构建证据的能力不写。
5. 中英文页面保持相同标题层级、代码和事实；文字按语言自然表达，不逐句机械翻译。
6. 页面之间使用相对链接；源码证据链接使用固定的 GitHub 文件与行号格式。
7. Mermaid 继续遵循 Wiki 现有深色主题与语法约束。

### 开发者体验规则

- 页面先给出可复制的结果，再解释设计原理；
- 安装命令明确运行环境、peer dependency 和需要导入的副作用模块；
- 示例使用真实导出名和严格 TypeScript，不用 `any` 隐藏类型问题；
- 每个主要场景展示预期返回值或可见结果，避免只写“调用成功”；
- 错误说明包含可搜索的错误类型或消息、常见原因和最短修复路径；
- Reference 为复杂 API 提供参数、默认值、返回类型和失败行为，但不复制源码注释；
- 关键页面提供指向源码、测试或可运行 Story 的下一步链接。

## 错误处理与用户状态

文档示例除成功路径外，应在最靠近使用场景的位置说明：

- 请求错误、非成功响应和超时如何暴露；
- SSE 断开、格式错误与取消如何处理；
- React Hook 的加载、空结果、错误和卸载状态；
- Viewer 的加载、空数据、错误、禁用和无权限状态；
- Generator 输入无效时用户会看到的错误以及修复方向。

Storybook 中的错误状态必须由确定性 fixture 触发，并允许用户恢复或重试；不使用控制台日志代替可见反馈。

## 验证与验收

实施阶段先安装锁定依赖并建立当前基线，再分批重写。最终变更必须通过：

```bash
pnpm install --frozen-lockfile
pnpm build
pnpm test:unit
pnpm lint
pnpm build-storybook
pnpm test:storybook
pnpm --dir wiki fix:mermaid
pnpm --dir wiki build
git diff --check
```

另做以下范围检查：

- 对 README、Wiki、Story 执行凭据与私有域名扫描；
- 检查所有内部链接和导航目标；
- 对照 12 个包入口确认 Reference 没有缺包或虚构导出；
- 对照中英文文件树与标题层级确认双语一致；
- 确认 Storybook 无真实网络请求并能在无凭据环境运行；
- 确认删除的旧 Wiki 页面没有仍被新内容引用；
- 只检查本次修改范围的格式，不对 Wiki 历史基线做全仓机械格式化。

验收结果按三类报告：

- **已验证**：命令或自动检查实际通过；
- **本地验证限制**：环境允许执行但不能证明发布站点；
- **MISSING EVIDENCE**：未执行、外部 CI 或发布状态无法证明的项目。

## 风险与缓解

| 风险                   | 缓解                                                                                |
| ---------------------- | ----------------------------------------------------------------------------------- |
| 全面重写遗漏冷门 API   | 以 12 个包入口导出清单逐项核对 Reference                                            |
| 双语内容再次漂移       | 相同文件树与标题层级，在同一变更中成对修改                                          |
| Story 变成第二套文档   | 限制说明长度，只保留交互与 Canonical Wiki 链接                                      |
| Mock 与真实行为不一致  | MSW 只替代网络边界，Fetcher、Hook 和组件运行真实实现                                |
| 大范围修改难以评审     | 实施计划按 README、Wiki 信息架构、Reference、Storybook 基础设施和交互场景拆分验证点 |
| 删除旧路径影响外部链接 | 已明确接受不兼容，优先保证新用户体验，不增加重定向层                                |

## 明确取舍

- 删除优于保留重复内容；
- 人工策划的任务路径优于自动生成的大型 API 页面；
- 少量代表性、可运行 Story 优于为每个导出符号制造演示；
- 使用现有 VitePress、Storybook、Vitest、Playwright 和 MSW；只增加 catalog 中已有的 `@vitest/browser-playwright` provider，不增加新的依赖类别；
- 不设计自定义文档组件、内容 DSL 或同步工具，只有实际漂移证明人工流程不足时再考虑自动化。
