# Fetcher 文档站完整重写设计

状态：用户已批准，实施与验证完成。

## 目标与范围

以当前工作树的 Fetcher 5.0.0 公开 API 为事实来源，重写英文与中文文档、首页、导航和阅读样式，继续使用 VitePress。新用户能够独立完成首次请求与错误处理；已有用户能够直接定位参数、默认值、返回值、生命周期和失败行为。

实施位置为当前隔离工作树的 `wiki/`。用户链接指向的主检出用于识别同一项目，不将其未跟踪的 `packages/view-engine/` 纳入本次内容基线。实施不修改 SDK API，不新增包或依赖，不包含发布部署。本文替代旧设计中“每包单页、保留导航和主题”的限制。

## 全站阅读路径

| 区域 | 职责与内容 |
| --- | --- |
| 首页 | 定位、完整请求示例、开始使用入口、按需求选择生态能力 |
| Start | 概览、安装、首次请求、选择包；首次请求包含最小错误处理 |
| Learn | 请求与结果、错误与超时、拦截器及生命周期、流、React 数据流 |
| Recipes | 声明式服务、客户端生成、OpenAI 流、Wow CQRS、CoSec、状态与事件、Viewer |
| Reference | 包索引、包入口、按复杂度拆分的专题契约与公开符号索引 |
| Skills | 安装与选择现有技能、按任务使用；不代替面向人的 API 参考 |
| Contributing | 本地开发、测试、文档维护 |

顶栏保留 Start、Learn、Recipes、Reference；Skills 和 Contributing 放入资源菜单，Storybook 保留直接入口。中英路径镜像，语言切换落在对应页面。

## Reference 目录

下列路径均相对于 `wiki/reference/`，中文完整镜像到 `wiki/zh/reference/`。每个目录含 `index.md`：职责、安装、最小示例、专题入口，以及公开符号到所属页面/锚点的映射。符号数量不直接决定页数；同一任务、共享契约紧密相关的符号合并讲解。

| 包目录 | 专题文件（均为 `.md`） | 拆分依据 |
| --- | --- | --- |
| `fetcher/` | `client`、`requests`、`urls`、`results`、`interceptors`、`errors-and-cancellation` | 客户端/注册、请求合并与头/体、URL 解析、结果提取、管线、失败与取消是独立查阅任务 |
| `decorator/` | `services-and-endpoints`、`parameters`、`execution` | 类与端点、参数绑定、元数据/继承/执行生命周期 |
| `eventbus/` | `events-and-delivery`、`broadcast-and-messengers` | 类型/命名事件及串并行投递，与跨上下文传输分开；清理和失败随所属 API 说明 |
| `eventstream/` | `sse-pipeline`、`json-and-results`、`consumption-and-cancellation` | 文本行/SSE 转换、JSON 与 Response/Extractor、迭代/终止/资源释放 |
| `storage/` | `key-storage`、`serialization-and-runtime` | KeyStorage 读写/事件/销毁；序列化器、内存与浏览器存储选择 |
| `openapi/` | `documents-and-operations`、`schemas-and-references`、`security-and-extensions` | 文档/路径/参数/响应、Schema/组件/引用、安全与扩展；明确静态类型能力边界 |
| `generator/` | `cli`、`configuration`、`generated-output`、`programmatic-api`、`wow-discovery` | 命令入口、配置优先级、输出与再生成、公开 CodeGenerator、CQRS 识别规则 |
| `openai/` | `client-and-completions`、`streaming` | 当前包的 OpenAI/ChatClient、请求与响应类型；流式 chunk/终止/取消；不扩写未实现产品 API |
| `cosec/` | `configuration`、`tokens-and-refresh`、`interceptors-and-attribution` | 配置入口、Token 存储/刷新/并发、拦截器与设备/空间/资源归属 |
| `react/` | `fetcher-hooks`、`promise-and-query-state`、`api-hooks`、`debounce`、`storage-and-events`、`cosec`、`wow`、`monitoring-and-utilities` | 按根入口可达的 Hook 家族拆分；每页说明状态、依赖变化、取消及卸载所有权 |
| `wow/` | `configuration`、`commands`、`snapshot-queries`、`filters`、`query-options`、`cursor-queries`、`aggregations`、`events-and-history`、`shared-types` | 命令与查询不同契约；过滤、投影/排序/分页、游标、聚合各有独立参数与返回模型 |
| `viewer/` | `models-and-state`、`view-and-viewer`、`saved-views`、`fetcher-viewer`、`filters`、`tables-and-cells`、`registries-and-inputs`、`toolbar-and-locale` | 数据模型/所有权、组件组合、持久化、远端集成、过滤、表格、扩展、工具栏与本地化 |

导航在包入口及专题页展示当前包的完整专题树，同时提供包索引与其他包的切换入口，不展开全站全部 API。专题页右侧大纲用于查方法或类型，无需每个符号单独建页。

## 内容契约与事实核对

每个专题先说明用途，再提供 API 选择表、签名/参数/默认值/返回值、完整最小示例、相关失败和生命周期边界，以及关联教程和带行号源码链接。不相关的章节不强行填充。入口页介绍安装，专题页仅补充特有前提。

公开覆盖以各包 `package.json` 的 exports 和 `src/index.ts` 递归可达声明为准，同时核对实际实现和测试。内部目录不能自动成为公开 API：当前 React 根入口未导出 notification；Generator 内部生成器和解析器也不能直接作为包根入口推荐。辅助类型和函数按所属专题归档，不能以“见 Skill”替代契约。

英文和中文具有相同的符号覆盖、示例、默认值与边界，中文是完整翻译。区分使用包所需的运行时版本与贡献者的仓库工具链版本；不得将根 package.json 的 Node 要求直接当作所有包的消费者要求。

## 页面与视觉

沿用 VitePress 的布局、搜索、移动导航、主题切换和代码块能力，使用现有品牌色。首页以定位、示例和任务入口为主体；正文优先保证中文排版、标题层级、长签名与表格阅读。保持可见键盘焦点、可访问导航、足够对比度；手机端代码与宽表格局部滚动，正文不横向溢出。

不增加自建搜索、交互演示框架或自定义文档渲染器。业务组件交互链接到已有 Storybook。视觉验收覆盖首页、包入口、长参考页、搜索和移动导航。

### Mermaid 展示（用户追加要求）

参考已读取的 `/Users/ahoo/work/ahoo-git/Wow/documentation/docs/.vitepress/theme/Mermaid.vue`、`mermaid-zoom.mjs` 及主题注册方式。采用其图表阅读交互：

- 图表以内联 SVG 展示，默认适应正文宽度并保持比例。
- 工具栏提供放大、缩小、重置、展开及关闭；桌面悬停或键盘聚焦时显示，触屏设备始终可见。
- 支持拖动平移；Ctrl/Command 加滚轮缩放，普通滚轮保留页面阅读行为。
- 展开后占满视口并自动适配；Esc、关闭按钮或空白区可退出。限制模态内焦点、锁定背景滚动，关闭后恢复触发按钮焦点，路由离开时清理监听器和滚动锁。
- 深浅主题切换后重新渲染，容器尺寸改变时适配。控件文案跟随中英语言。保留 Fetcher 现有 Mermaid 节点深色配色约束，不直接复制 Wow 的默认节点颜色。
- 单图失败显示可读错误提示和图表源码，不使整页不可读；图旁文字仍说明关键结论。

Wow 使用 `mermaid`、`vitepress-plugin-mermaid` 和 `svg-pan-zoom`；Fetcher 当前使用 `vitepress-mermaid-renderer`。参考的是展示和交互契约，不直接替换整套依赖。在实施计划中先核对现有渲染器的扩展接口，再确定最小接入方式；如确需增加依赖，列明具体依赖后按仓库要求取得批准，不在设计阶段安装。

浏览器验收增加：多图页面、长时序图、主题切换、连续打开关闭、缩放重置、普通滚轮、键盘焦点循环与恢复、触屏工具栏和路由切换后背景可滚动。当前依据源码确认参考行为，尚未进行 Wow 站点浏览器验证。

## 路由迁移与构建数据流

Markdown 是文档内容来源；VitePress locale 配置维护导航；现有 `generate-llms-full.mjs` 维护的页面清单同步加入新专题，再由生成器产生 llms 文件。保留现有管线，不另建内容系统。

旧 `/reference/<package>` 与新目录入口统一显示包索引，包索引保留旧章节锚点到对应专题的链接。旧单页源码通过 VitePress rewrites 输出到 `/reference/<package>/migration`，作为简短迁移说明，不进入导航、搜索、sitemap 或 LLM 集合，canonical 指向包入口。

实施验证发现，旧 `<package>.html` 与 `<package>/index.html` 共存时，静态预览服务器会让前者抢占带斜杠的目录 URL。因此采用上述输出分离方案，避免依赖主机自定义重定向；生产预览中的带斜杠/不带斜杠入口及旧锚点已验证。

更新所有站内引用至新路径；新英文/中文导航、搜索和 LLM 页面清单保持一致。`llms.txt`、`llms-full.txt`、构建产物仅通过既有命令生成，不手改。

## 验证与交付

1. 为每个包建立公开导出到专题锚点的覆盖映射；逐项核对声明、默认值、运行时边界，不能以页面存在代替覆盖。
2. 使用当前 workspace 包入口检查完整 TypeScript 示例；涉及生成器的示例在临时目录真实生成并检查产物。需要服务的示例说明服务前提，不宣称已验证外部运行结果。
3. 检查双语路径/章节/符号对齐、导航目标、旧页及锚点迁移、LLM 清单和生成内容覆盖。
4. 修改 Mermaid 后运行 `pnpm --dir wiki fix:mermaid` 并检查差异；运行 `pnpm --dir wiki build` 与 `git diff --check`。
5. 浏览器检查首页、简单包 Storage 与复杂包 Wow/React/Viewer、深链接、语言切换、搜索、深浅主题、键盘操作和移动导航。
6. 提交前运行仓库要求的 `pnpm test:unit`；报告实际通过与受阻项目。未经明确发布指令不部署。

完成标准：所有在本次公开基线内的 API 有可定位的参考说明，双语完整，新旧入口可用，示例验证与站点构建通过，浏览器阅读流程可用。

## 实施顺序

先确认本设计，再进入 writing-plans：建立路由和覆盖清单；完成 Fetcher 与 Storage 两种复杂度的样板；依次完成其余包及双语内容；重写教程和首页；接入最终导航/样式、迁移与 LLM 清单；完成验证。此顺序服务于一次完整交付，不把样板当作全部完成。

## 设计自审

- 分页来自当前公开模块边界，不按内部源码文件机械拆页。
- 内容重写、阅读结构与视觉属于同一站点范围；未混入 SDK 功能开发。
- 英中镜像、旧链接、生成文件和实际验证均有明确处理方式。
- 本文是设计方案；尚未声称 API 全量语义审计、站点实现或测试已完成。
