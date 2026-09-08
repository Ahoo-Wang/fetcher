# Fetcher 文档内容映射

> 本表是 `docs/superpowers/specs/2026-09-08-docs-user-architecture-design.md` 的执行检查表，不进入 VitePress。事实基线为 `af08ee16fb14e259066a9c3b332a0e019c91f852` 的当前工作树。

## 使用规则

- 下表路径均以 `wiki/` 为根；每个英文路径都必须存在完全同职责的 `zh/` 镜像，API 标识符和显式锚点不翻译。已核对当前 93 个英文正文页均有对应中文页，中文也没有多出的正文页。
- 每个站点页面都必须包含非空 `title` 和 `description` frontmatter。
- 消费者环境按各包当前 `package.json` 分别说明；仓库开发工具链固定为 Node `>=20.20.2`、pnpm `10.34.5`，不得混写为消费者要求。
- `AGENTS.md` 与 `CLAUDE.md` 是维护指令，不是站点正文，不参与迁移。
- “合并并删除”表示正文并入列出的目标后删除旧文件；不保留重定向、兼容页、迁移页或旧章节索引。
- 新指南和参考之间只共享事实与相对 Markdown 链接；完整流程只在指南维护一份。

## 最终页面清单与读者完成标准

| 新路径                                      | 动作 | 读者任务 / 完成标准                                           |
| ------------------------------------------- | ---- | ------------------------------------------------------------- |
| `index.md`                                  | 重写 | 判断 Fetcher 是否适合当前任务，并进入“开始接入”或“评估架构”。 |
| `start/index.md`                            | 重写 | 按纯 HTTP、React 或 Viewer 前提选择起点。                     |
| `start/installation.md`                     | 重写 | 区分消费者与仓库开发环境，执行准确安装命令。                  |
| `start/first-request.md`                    | 重写 | 在明确文件中运行一次类型化请求，看到固定结果和失败分支。      |
| `start/first-view.md`                       | 新建 | 渲染真实行列，理解 `View` / `Viewer` 入口差异。               |
| `start/next-steps.md`                       | 新建 | 按下一项应用任务进入对应指南。                                |
| `guides/index.md`                           | 新建 | 按 HTTP、服务、流、React、Viewer、平台集成选择任务。          |
| `guides/http/index.md`                      | 新建 | 识别 HTTP 指南前提与任务顺序。                                |
| `guides/http/shared-client.md`              | 新建 | 配置并复用共享客户端。                                        |
| `guides/http/requests.md`                   | 新建 | 构造 URL、头和请求体。                                        |
| `guides/http/results.md`                    | 新建 | 选择并验证结果提取方式。                                      |
| `guides/http/failures.md`                   | 新建 | 区分 HTTP、传输和解析失败并处理它们。                         |
| `guides/http/cancellation.md`               | 新建 | 取消请求并设置超时，明确影响范围。                            |
| `guides/http/interceptors.md`               | 新建 | 在正确阶段扩展拦截器。                                        |
| `guides/services/index.md`                  | 新建 | 在声明式客户端与生成客户端之间选择。                          |
| `guides/services/declarative-client.md`     | 新建 | 声明服务方法并执行请求。                                      |
| `guides/services/generated-client.md`       | 新建 | 从实际 OpenAPI 输入生成、导入并调用客户端。                   |
| `guides/streaming/index.md`                 | 新建 | 选择 SSE 或 Chat 流任务并确认运行时能力。                     |
| `guides/streaming/sse.md`                   | 新建 | 读取 SSE，处理终止、取消和无效数据。                          |
| `guides/streaming/chat.md`                  | 新建 | 使用当前 OpenAI 包支持的 Chat 流。                            |
| `guides/react/index.md`                     | 新建 | 选择显式请求、查询、防抖或清理任务。                          |
| `guides/react/requests.md`                  | 新建 | 显式触发请求并展示加载、结果和错误。                          |
| `guides/react/queries.md`                   | 新建 | 按条件驱动查询并验证状态变化。                                |
| `guides/react/debounce.md`                  | 新建 | 对输入驱动请求防抖。                                          |
| `guides/react/cleanup.md`                   | 新建 | 在取消和卸载时正确清理资源。                                  |
| `guides/viewer/index.md`                    | 新建 | 按本地闭环到远端契约选择 Viewer 任务。                        |
| `guides/viewer/local-data.md`               | 新建 | 用本地确定性数据渲染表格。                                    |
| `guides/viewer/pagination-and-sorting.md`   | 新建 | 让分页与排序改变可观察结果。                                  |
| `guides/viewer/filters.md`                  | 新建 | 添加过滤并验证结果。                                          |
| `guides/viewer/saved-views.md`              | 新建 | 保存视图并说明持久化所有者。                                  |
| `guides/viewer/remote-data.md`              | 新建 | 在明确服务端契约下接入远端 Viewer。                           |
| `guides/integrations/index.md`              | 新建 | 识别 Wow、CoSec、存储/事件的附加契约。                        |
| `guides/integrations/wow.md`                | 新建 | 执行 Wow 命令与查询并理解服务端前提。                         |
| `guides/integrations/cosec.md`              | 新建 | 配置认证、刷新和资源归属。                                    |
| `guides/integrations/storage-and-events.md` | 新建 | 组合持久化与事件协作并清理监听。                              |
| `architecture/index.md`                     | 新建 | 判断适用问题、核心包边界与附加条件。                          |
| `architecture/package-boundaries.md`        | 新建 | 判断包依赖方向、构建时/运行时角色和 peer 依赖。               |
| `architecture/runtime-support.md`           | 新建 | 判断浏览器、Node、React 与 SSR 责任。                         |
| `architecture/request-lifecycle.md`         | 新建 | 追踪 exchange、拦截器、传输、错误与结果阶段。                 |
| `architecture/state-and-resources.md`       | 新建 | 确认客户端、Hook、Viewer、存储和总线的状态所有权。            |
| `architecture/failure-model.md`             | 新建 | 区分失败与取消，识别应用自备的重试/缓存策略。                 |
| `architecture/integration-decisions.md`     | 新建 | 选择直接/声明式/生成客户端、Viewer 层级及 Wow/CoSec。         |
| `examples/index.md`                         | 新建 | 选择可运行的 HTTP、React 或 Viewer 完整样例。                 |
| `examples/http.md`                          | 新建 | 运行本地 HTTP fixture，观察成功和失败。                       |
| `examples/react.md`                         | 新建 | 在 Storybook 操作加载、结果、错误和取消。                     |
| `examples/viewer.md`                        | 新建 | 在 Storybook 操作分页、排序、过滤和保存视图。                 |
| `skills/index.md` 及现有四个专题            | 重写 | 为 Agent 选择任务并得到输入、边界和验收要求。                 |
| `contributing/index.md` 及现有三个专题      | 重写 | 按当前开发、测试和文档规则维护仓库。                          |
| `reference/index.md`                        | 重写 | 按用途进入 12 个包参考。                                      |
| `reference/<package>/index.md`              | 重写 | 了解用途、安装前提、入口选择和专题导航。                      |
| `reference/<package>/<topic>.md`            | 重写 | 查询输入、默认值、结果、错误和生命周期。                      |
| `reference/<package>/symbols.md`            | 新建 | 从任一公开符号定位到唯一专题锚点。                            |

## 现有非参考页面逐页处理

| 旧路径                                  | 动作       | 新路径                                                                                                                                                               | 相关源码/事实                                                     |
| --------------------------------------- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| `index.md`                              | 重写       | `index.md`                                                                                                                                                           | 12 个包的 `package.json` 与根入口。                               |
| `start/index.md`                        | 重写       | `start/index.md`                                                                                                                                                     | 核心、React、Viewer 的消费者前提。                                |
| `start/installation.md`                 | 重写       | `start/installation.md`                                                                                                                                              | 根与各包 `package.json` engines、dependencies、peerDependencies。 |
| `start/first-request.md`                | 重写       | `start/first-request.md`                                                                                                                                             | `packages/fetcher/src/fetcher.ts`、HTTP 样例 fixture。            |
| `start/choose-packages.md`              | 合并并删除 | `start/index.md`、`start/next-steps.md`                                                                                                                              | 各包依赖和入口。                                                  |
| `learn/requests-and-results.md`         | 合并并删除 | `guides/http/requests.md`、`guides/http/results.md`                                                                                                                  | FetchRequest、ResultExtractor。                                   |
| `learn/interceptors-errors-timeouts.md` | 合并并删除 | `guides/http/interceptors.md`、`guides/http/failures.md`、`guides/http/cancellation.md`                                                                              | interceptor、timeout、validateStatus 实现。                       |
| `learn/request-lifecycle.md`            | 合并并删除 | `architecture/request-lifecycle.md`                                                                                                                                  | Fetcher 与 FetchExchange 调用链。                                 |
| `learn/streaming.md`                    | 合并并删除 | `guides/streaming/sse.md`、`architecture/failure-model.md`                                                                                                           | eventstream 转换与消费实现。                                      |
| `learn/react-data-flow.md`              | 合并并删除 | `guides/react/index.md`、`architecture/state-and-resources.md`                                                                                                       | React hooks 状态与清理实现。                                      |
| `recipes/declarative-services.md`       | 合并并删除 | `guides/services/declarative-client.md`                                                                                                                              | decorator 包。                                                    |
| `recipes/openapi-client.md`             | 合并并删除 | `guides/services/generated-client.md`                                                                                                                                | generator CLI、配置与生成实现。                                   |
| `recipes/openai-streaming.md`           | 合并并删除 | `guides/streaming/chat.md`                                                                                                                                           | openai 与 eventstream 包。                                        |
| `recipes/data-viewer.md`                | 合并并删除 | `guides/viewer/local-data.md`、`guides/viewer/pagination-and-sorting.md`、`guides/viewer/filters.md`、`guides/viewer/saved-views.md`、`guides/viewer/remote-data.md` | viewer 组件、hooks 与远端 clients。                               |
| `recipes/wow-cqrs.md`                   | 合并并删除 | `guides/integrations/wow.md`                                                                                                                                         | wow command/query clients。                                       |
| `recipes/cosec-authentication.md`       | 合并并删除 | `guides/integrations/cosec.md`                                                                                                                                       | CoSec 配置、token 刷新与拦截器。                                  |
| `recipes/state-and-events.md`           | 合并并删除 | `guides/integrations/storage-and-events.md`                                                                                                                          | storage、eventbus、React adapters。                               |
| `skills/index.md`                       | 重写       | `skills/index.md`                                                                                                                                                    | `skills/plugins.json` 与各 skill。                                |
| `skills/http-and-services.md`           | 重写       | 同路径                                                                                                                                                               | Fetcher、Decorator。                                              |
| `skills/openapi-and-generation.md`      | 重写       | 同路径                                                                                                                                                               | OpenAPI、Generator。                                              |
| `skills/streaming-and-openai.md`        | 重写       | 同路径                                                                                                                                                               | EventStream、OpenAI。                                             |
| `skills/react-and-integrations.md`      | 重写       | 同路径                                                                                                                                                               | React、Viewer、Wow、CoSec。                                       |
| `contributing/index.md`                 | 重写       | 同路径                                                                                                                                                               | 根脚本与工作区。                                                  |
| `contributing/development.md`           | 重写       | 同路径                                                                                                                                                               | 根及包级 AGENTS、package scripts。                                |
| `contributing/testing.md`               | 重写       | 同路径                                                                                                                                                               | Vitest、Storybook、wiki tests。                                   |
| `contributing/documentation.md`         | 重写       | 同路径                                                                                                                                                               | wiki AGENTS、生成脚本和双语规则。                                 |

## 现有参考页面逐页处理

`reference/index.md` 重写为包选择入口。下表每个 `{topic}` 表示该包当前 `referencePackages` 中除 `index` 外的每个实际专题；除 Wow shared-types.md 被职责专题替代并删除外，每个现有页面均重写在同路径，包入口的旧符号表迁入新增 `symbols.md`，因此没有参考正文无人负责。

| 包            | 当前专题（每项均“重写，同路径”）                                                                                                                     | 新增                                                                                                                                           | 主要源码入口                                                     |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| `fetcher`     | `client`、`requests`、`urls`、`results`、`interceptors`、`errors-and-cancellation`                                                                   | `symbols.md`                                                                                                                                   | `packages/fetcher/src/index.ts`                                  |
| `decorator`   | `services-and-endpoints`、`parameters`、`execution`                                                                                                  | `symbols.md`                                                                                                                                   | `packages/decorator/src/index.ts`                                |
| `eventbus`    | `events-and-delivery`、`broadcast-and-messengers`                                                                                                    | `symbols.md`                                                                                                                                   | `packages/eventbus/src/index.ts`                                 |
| `eventstream` | `sse-pipeline`、`json-and-results`、`consumption-and-cancellation`                                                                                   | `symbols.md`                                                                                                                                   | `packages/eventstream/src/index.ts`                              |
| `storage`     | `key-storage`、`serialization-and-runtime`                                                                                                           | `symbols.md`                                                                                                                                   | `packages/storage/src/index.ts`                                  |
| `openapi`     | `documents-and-operations`、`schemas-and-references`、`security-and-extensions`                                                                      | `symbols.md`                                                                                                                                   | `packages/openapi/src/index.ts`                                  |
| `generator`   | `cli`、`configuration`、`generated-output`、`programmatic-api`、`wow-discovery`                                                                      | `symbols.md`                                                                                                                                   | `packages/generator/src/index.ts`                                |
| `openai`      | `client-and-completions`、`streaming`                                                                                                                | `symbols.md`                                                                                                                                   | `packages/openai/src/index.ts`                                   |
| `cosec`       | `configuration`、`tokens-and-refresh`、`interceptors-and-attribution`                                                                                | `symbols.md`                                                                                                                                   | `packages/cosec/src/index.ts`                                    |
| `react`       | `fetcher-hooks`、`promise-and-query-state`、`api-hooks`、`debounce`、`storage-and-events`、`cosec`、`wow`、`monitoring-and-utilities`                | `symbols.md`                                                                                                                                   | `packages/react/src/index.ts`                                    |
| `wow`         | `configuration`、`commands`、`snapshot-queries`、`filters`、`query-options`、`cursor-queries`、`aggregations`、`events-and-history`                  | `symbols.md`、`identity-and-attribution.md`、`messages-and-state.md`、`errors-and-utilities.md`、`operator-locales.md`（删除 shared-types.md） | `packages/wow/src/index.ts`；另核对两个 locale subpath exports。 |
| `viewer`      | `models-and-state`、`view-and-viewer`、`saved-views`、`fetcher-viewer`、`filters`、`tables-and-cells`、`registries-and-inputs`、`toolbar-and-locale` | `symbols.md`                                                                                                                                   | `packages/viewer/src/index.ts`                                   |

每个包的 `index.md` 本身也执行“重写，同路径”；基线为 12 个入口加 54 个专题及 `reference/index.md`，共 67 个英文参考页；Task8 将 Wow 的一个 shared-types 专题替换为四个职责专题，目标增加三个专题。新增 12 个 `symbols.md` 不复制契约正文，只索引下面核对清单。

## 当前公开导出核对

核对算法：读取 `package.json#exports`，使用仓库已有 `packages/generator/node_modules/ts-morph` 从每个 `packages/<package>/src/index.ts` 执行 `getExportedDeclarations()`，递归解析 `export *`；再与当前包入口中的公开索引逐符号对表。专题路径沿用现有已验证归属，锚点保持当前显式锚点；后续把索引移动到 `symbols.md` 时不得改成无锚点的字母表。

12 个包均通过 `exports["."]` 暴露根入口。`@ahoo-wang/fetcher-wow` 另外暴露 `./query/locale/zh_CN` 和 `./query/locale/en_US`，分别来自 `packages/wow/src/query/locale/zh_CN.ts` 与 `en_US.ts`；它们归入 `reference/wow/operator-locales.md` 专题，并在 `reference/wow/symbols.md` 以“子路径入口”列出，不伪装成根入口具名符号。

### fetcher（95）

#### `reference/fetcher/results.md`

- 源码：`packages/fetcher/src/fetchExchange.ts`、`packages/fetcher/src/resultExtractor.ts`、`packages/fetcher/src/types.ts`
- 符号与目标锚点：`ArrayBufferResultExtractor` → `#arraybufferresultextractor`；`AttributesCapable` → `#attributescapable`；`BlobResultExtractor` → `#blobresultextractor`；`BytesResultExtractor` → `#bytesresultextractor`；`ExchangeResultExtractor` → `#exchangeresultextractor`；`FetchExchange` → `#fetchexchange`；`FetchExchangeInit` → `#fetchexchangeinit`；`JsonResultExtractor` → `#jsonresultextractor`；`PartialBy` → `#partialby`；`RemoveReadonlyFields` → `#removereadonlyfields`；`RequiredBy` → `#requiredby`；`ResponseResultExtractor` → `#responseresultextractor`；`ResultExtractor` → `#resultextractor`；`ResultExtractorCapable` → `#resultextractorcapable`；`ResultExtractors` → `#resultextractors`；`TextResultExtractor` → `#textresultextractor`。

#### `reference/fetcher/requests.md`

- 源码：`packages/fetcher/src/fetchRequest.ts`、`packages/fetcher/src/mergeRequest.ts`、`packages/fetcher/src/requestHeaders.ts`、`packages/fetcher/src/utils.ts`
- 符号与目标锚点：`BaseURLCapable` → `#baseurlcapable`；`CONTENT_TYPE_HEADER` → `#content_type_header`；`ContentTypeValues` → `#contenttypevalues`；`deleteHeader` → `#deleteheader`；`FetchRequest` → `#fetchrequest`；`FetchRequestInit` → `#fetchrequestinit`；`getHeader` → `#getheader`；`HttpMethod` → `#httpmethod`；`mergeHeaders` → `#mergeheaders`；`mergeRecords` → `#mergerecords`；`mergeRecordToMap` → `#mergerecordtomap`；`mergeRequest` → `#mergerequest`；`mergeRequestOptions` → `#mergerequestoptions`；`RequestBodyType` → `#requestbodytype`；`RequestHeaders` → `#requestheaders`；`RequestHeadersCapable` → `#requestheaderscapable`；`setHeader` → `#setheader`；`UrlParamsCapable` → `#urlparamscapable`。

#### `reference/fetcher/interceptors.md`

- 源码：`packages/fetcher/src/fetchInterceptor.ts`、`packages/fetcher/src/interceptor.ts`、`packages/fetcher/src/interceptorManager.ts`、`packages/fetcher/src/orderedCapable.ts`、`packages/fetcher/src/requestBodyInterceptor.ts`、`packages/fetcher/src/urlResolveInterceptor.ts`
- 符号与目标锚点：`BUILT_IN_INTERCEPTOR_ORDER_STEP` → `#built_in_interceptor_order_step`；`DEFAULT_INTERCEPTOR_ORDER_STEP` → `#default_interceptor_order_step`；`ErrorInterceptor` → `#errorinterceptor`；`FETCH_INTERCEPTOR_NAME` → `#fetch_interceptor_name`；`FETCH_INTERCEPTOR_ORDER` → `#fetch_interceptor_order`；`FetchInterceptor` → `#fetchinterceptor`；`Interceptor` → `#interceptor`；`InterceptorManager` → `#interceptormanager`；`InterceptorRegistry` → `#interceptorregistry`；`OrderedCapable` → `#orderedcapable`；`REQUEST_BODY_INTERCEPTOR_NAME` → `#request_body_interceptor_name`；`REQUEST_BODY_INTERCEPTOR_ORDER` → `#request_body_interceptor_order`；`RequestBodyInterceptor` → `#requestbodyinterceptor`；`RequestInterceptor` → `#requestinterceptor`；`ResponseInterceptor` → `#responseinterceptor`；`sortOrder` → `#sortorder`；`toSorted` → `#tosorted`；`URL_RESOLVE_INTERCEPTOR_NAME` → `#url_resolve_interceptor_name`；`URL_RESOLVE_INTERCEPTOR_ORDER` → `#url_resolve_interceptor_order`；`UrlResolveInterceptor` → `#urlresolveinterceptor`。

#### `reference/fetcher/urls.md`

- 源码：`packages/fetcher/src/urlBuilder.ts`、`packages/fetcher/src/urlTemplateResolver.ts`、`packages/fetcher/src/urls.ts`
- 符号与目标锚点：`combineURLs` → `#combineurls`；`expressUrlTemplateResolver` → `#expressurltemplateresolver-instance`；`ExpressUrlTemplateResolver` → `#expressurltemplateresolver`；`getUrlTemplateResolver` → `#geturltemplateresolver`；`isAbsoluteURL` → `#isabsoluteurl`；`uriTemplateResolver` → `#uritemplateresolver-instance`；`UriTemplateResolver` → `#uritemplateresolver`；`UrlBuilder` → `#urlbuilder`；`UrlBuilderCapable` → `#urlbuildercapable`；`UrlParams` → `#urlparams`；`urlTemplateRegexExtract` → `#urltemplateregexextract`；`urlTemplateRegexResolve` → `#urltemplateregexresolve`；`UrlTemplateResolver` → `#urltemplateresolver`；`UrlTemplateStyle` → `#urltemplatestyle`。

#### `reference/fetcher/client.md`

- 源码：`packages/fetcher/src/fetcher.ts`、`packages/fetcher/src/fetcherCapable.ts`、`packages/fetcher/src/fetcherRegistrar.ts`、`packages/fetcher/src/namedFetcher.ts`、`packages/fetcher/src/types.ts`
- 符号与目标锚点：`DEFAULT_FETCH_OPTIONS` → `#default_fetch_options`；`DEFAULT_FETCHER_NAME` → `#default_fetcher_name`；`DEFAULT_OPTIONS` → `#default_options`；`DEFAULT_REQUEST_OPTIONS` → `#default_request_options`；`fetcher` → `#fetcher-instance`；`Fetcher` → `#fetcher`；`FetcherCapable` → `#fetchercapable`；`FetcherConfigurer` → `#fetcherconfigurer`；`FetcherOptions` → `#fetcheroptions`；`fetcherRegistrar` → `#fetcherregistrar-instance`；`FetcherRegistrar` → `#fetcherregistrar`；`getFetcher` → `#getfetcher`；`NamedCapable` → `#namedcapable`；`NamedFetcher` → `#namedfetcher`；`RequestOptions` → `#requestoptions`。

#### `reference/fetcher/errors-and-cancellation.md`

- 源码：`packages/fetcher/src/fetcherError.ts`、`packages/fetcher/src/timeout.ts`、`packages/fetcher/src/validateStatusInterceptor.ts`
- 符号与目标锚点：`ExchangeError` → `#exchangeerror`；`FetcherError` → `#fetchererror`；`FetchTimeoutError` → `#fetchtimeouterror`；`HttpStatusValidationError` → `#httpstatusvalidationerror`；`IGNORE_VALIDATE_STATUS` → `#ignore_validate_status`；`resolveTimeout` → `#resolvetimeout`；`TimeoutCapable` → `#timeoutcapable`；`timeoutFetch` → `#timeoutfetch`；`VALIDATE_STATUS_INTERCEPTOR_NAME` → `#validate_status_interceptor_name`；`VALIDATE_STATUS_INTERCEPTOR_ORDER` → `#validate_status_interceptor_order`；`ValidateStatus` → `#validatestatus`；`ValidateStatusInterceptor` → `#validatestatusinterceptor`。

### decorator（39）

#### `reference/decorator/services-and-endpoints.md`

- 源码：`packages/decorator/src/apiDecorator.ts`、`packages/decorator/src/endpointDecorator.ts`、`packages/decorator/src/generated.ts`
- 符号与目标锚点：`api` → `#api`；`ApiMetadata` → `#apimetadata`；`ApiMetadataCapable` → `#apimetadatacapable`；`AutoGenerated` → `#autogenerated`；`autoGeneratedError` → `#autogeneratederror`；`del` → `#del`；`endpoint` → `#endpoint`；`EndpointMetadata` → `#endpointmetadata`；`get` → `#get`；`head` → `#head`；`MethodEndpointMetadata` → `#methodendpointmetadata`；`options` → `#options`；`patch` → `#patch`；`PathCapable` → `#pathcapable`；`post` → `#post`；`put` → `#put`。

#### `reference/decorator/execution.md`

- 源码：`packages/decorator/src/apiDecorator.ts`、`packages/decorator/src/endpointDecorator.ts`、`packages/decorator/src/endpointReturnTypeCapable.ts`、`packages/decorator/src/executeLifeCycle.ts`、`packages/decorator/src/functionMetadata.ts`、`packages/decorator/src/requestExecutor.ts`
- 符号与目标锚点：`API_METADATA_KEY` → `#api_metadata_key`；`buildRequestExecutor` → `#buildrequestexecutor`；`DECORATOR_METADATA_ATTRIBUTE_KEY` → `#decorator_metadata_attribute_key`；`DECORATOR_TARGET_ATTRIBUTE_KEY` → `#decorator_target_attribute_key`；`ENDPOINT_METADATA_KEY` → `#endpoint_metadata_key`；`EndpointReturnType` → `#endpointreturntype`；`EndpointReturnTypeCapable` → `#endpointreturntypecapable`；`ExecuteLifeCycle` → `#executelifecycle`；`FunctionMetadata` → `#functionmetadata`；`RequestExecutor` → `#requestexecutor`。

#### `reference/decorator/parameters.md`

- 源码：`packages/decorator/src/parameterDecorator.ts`、`packages/decorator/src/reflection.ts`
- 符号与目标锚点：`attribute` → `#attribute`；`body` → `#body`；`getParameterName` → `#getparametername`；`getParameterNames` → `#getparameternames`；`header` → `#header`；`parameter` → `#parameter`；`PARAMETER_METADATA_KEY` → `#parameter_metadata_key`；`ParameterMetadata` → `#parametermetadata`；`ParameterRequest` → `#parameterrequest`；`ParameterType` → `#parametertype`；`path` → `#path`；`query` → `#query`；`request` → `#request`。

### eventbus（22）

#### `reference/eventbus/events-and-delivery.md`

- 源码：`packages/eventbus/src/abstractTypedEventBus.ts`、`packages/eventbus/src/eventBus.ts`、`packages/eventbus/src/nameGenerator.ts`、`packages/eventbus/src/parallelTypedEventBus.ts`、`packages/eventbus/src/serialTypedEventBus.ts`、`packages/eventbus/src/typedEventBus.ts`、`packages/eventbus/src/types.ts`
- 符号与目标锚点：`AbstractTypedEventBus` → `#abstracttypedeventbus`；`DefaultNameGenerator` → `#defaultnamegenerator`；`EventBus` → `#eventbus`；`EventHandler` → `#eventhandler`；`EventType` → `#eventtype`；`nameGenerator` → `#namegenerator-instance`；`NameGenerator` → `#namegenerator`；`ParallelTypedEventBus` → `#paralleltypedeventbus`；`SerialTypedEventBus` → `#serialtypedeventbus`；`TypedEventBus` → `#typedeventbus`；`TypeEventBusSupplier` → `#typeeventbussupplier`。

#### `reference/eventbus/broadcast-and-messengers.md`

- 源码：`packages/eventbus/src/broadcastTypedEventBus.ts`、`packages/eventbus/src/messengers/broadcastChannelMessenger.ts`、`packages/eventbus/src/messengers/crossTabMessenger.ts`、`packages/eventbus/src/messengers/storageMessenger.ts`
- 符号与目标锚点：`BroadcastChannelMessenger` → `#broadcastchannelmessenger`；`BroadcastTypedEventBus` → `#broadcasttypedeventbus`；`BroadcastTypedEventBusOptions` → `#broadcasttypedeventbusoptions`；`createCrossTabMessenger` → `#createcrosstabmessenger`；`CrossTabMessageHandler` → `#crosstabmessagehandler`；`CrossTabMessenger` → `#crosstabmessenger`；`isBroadcastChannelSupported` → `#isbroadcastchannelsupported`；`isStorageEventSupported` → `#isstorageeventsupported`；`StorageMessage` → `#storagemessage`；`StorageMessenger` → `#storagemessenger`；`StorageMessengerOptions` → `#storagemessengeroptions`。

### eventstream（25）

#### `reference/eventstream/json-and-results.md`

- 源码：`packages/eventstream/src/eventStreamConverter.ts`、`packages/eventstream/src/eventStreamResultExtractor.ts`、`packages/eventstream/src/jsonServerSentEventTransformStream.ts`
- 符号与目标锚点：`EventStreamConvertError` → `#eventstreamconverterror`；`EventStreamResultExtractor` → `#eventstreamresultextractor`；`JsonEventStreamResultExtractor` → `#jsoneventstreamresultextractor`；`JsonServerSentEvent` → `#jsonserversentevent`；`JsonServerSentEventStream` → `#jsonserversenteventstream`；`JsonServerSentEventTransform` → `#jsonserversenteventtransform`；`JsonServerSentEventTransformStream` → `#jsonserversenteventtransformstream`；`TerminateDetector` → `#terminatedetector`；`toJsonServerSentEventStream` → `#tojsonserversenteventstream`。

#### `reference/eventstream/consumption-and-cancellation.md`

- 源码：`packages/eventstream/src/readableStreamAsyncIterable.ts`、`packages/eventstream/src/readableStreams.ts`、`packages/eventstream/src/safeTransformer.ts`、`packages/eventstream/src/streamController.ts`
- 符号与目标锚点：`isReadableStreamAsyncIterableSupported` → `#isreadablestreamasynciterablesupported`；`ReadableStreamAsyncIterable` → `#readablestreamasynciterable`；`safeEnqueue` → `#safeenqueue`；`safeError` → `#safeerror`；`safeTerminate` → `#safeterminate`；`SafeTransformer` → `#safetransformer`；`StreamController` → `#streamcontroller`；`TransformerPhase` → `#transformerphase`。

#### `reference/eventstream/sse-pipeline.md`

- 源码：`packages/eventstream/src/eventStreamConverter.ts`、`packages/eventstream/src/serverSentEventTransformStream.ts`、`packages/eventstream/src/textLineTransformStream.ts`
- 符号与目标锚点：`ServerSentEvent` → `#serversentevent`；`ServerSentEventFields` → `#serversenteventfields`；`ServerSentEventStream` → `#serversenteventstream`；`ServerSentEventTransformer` → `#serversenteventtransformer`；`ServerSentEventTransformStream` → `#serversenteventtransformstream`；`TextLineTransformer` → `#textlinetransformer`；`TextLineTransformStream` → `#textlinetransformstream`；`toServerSentEventStream` → `#toserversenteventstream`。

### storage（14）

#### `reference/storage/serialization-and-runtime.md`

- 源码：`packages/storage/src/env.ts`、`packages/storage/src/inMemoryStorage.ts`、`packages/storage/src/serializer.ts`
- 符号与目标锚点：`getStorage` → `#getstorage`；`identitySerializer` → `#identityserializer-instance`；`IdentitySerializer` → `#identityserializer`；`InMemoryStorage` → `#inmemorystorage`；`isBrowser` → `#isbrowser`；`jsonSerializer` → `#jsonserializer-instance`；`JsonSerializer` → `#jsonserializer`；`Serializer` → `#serializer`；`typedIdentitySerializer` → `#typedidentityserializer`。

#### `reference/storage/key-storage.md`

- 源码：`packages/storage/src/keyStorage.ts`
- 符号与目标锚点：`KeyStorage` → `#keystorage`；`KeyStorageOptions` → `#keystorageoptions`；`RemoveStorageListener` → `#removestoragelistener`；`StorageEvent` → `#storageevent`；`StorageListenable` → `#storagelistenable`。

### openapi（37）

#### `reference/openapi/documents-and-operations.md`

- 源码：`packages/openapi/src/base-types.ts`、`packages/openapi/src/info.ts`、`packages/openapi/src/openAPI.ts`、`packages/openapi/src/parameters.ts`、`packages/openapi/src/paths.ts`、`packages/openapi/src/responses.ts`、`packages/openapi/src/server.ts`、`packages/openapi/src/tags.ts`
- 符号与目标锚点：`Callback` → `#callback`；`Contact` → `#contact`；`Encoding` → `#encoding`；`Example` → `#example`；`ExternalDocumentation` → `#externaldocumentation`；`Header` → `#header`；`HTTPMethod` → `#httpmethod`；`Info` → `#info`；`License` → `#license`；`Link` → `#link`；`MediaType` → `#mediatype`；`OpenAPI` → `#openapi`；`Operation` → `#operation`；`Parameter` → `#parameter`；`ParameterLocation` → `#parameterlocation`；`PathItem` → `#pathitem`；`Paths` → `#paths`；`RequestBody` → `#requestbody`；`Response` → `#response`；`Responses` → `#responses`；`Server` → `#server`；`ServerVariable` → `#servervariable`；`Tag` → `#tag`。

#### `reference/openapi/security-and-extensions.md`

- 源码：`packages/openapi/src/extensions.ts`、`packages/openapi/src/security.ts`
- 符号与目标锚点：`CommonExtensions` → `#commonextensions`；`Extensible` → `#extensible`；`OAuthFlow` → `#oauthflow`；`OAuthFlows` → `#oauthflows`；`SecurityRequirement` → `#securityrequirement`；`SecurityScheme` → `#securityscheme`。

#### `reference/openapi/schemas-and-references.md`

- 源码：`packages/openapi/src/base-types.ts`、`packages/openapi/src/components.ts`、`packages/openapi/src/reference.ts`、`packages/openapi/src/schema.ts`
- 符号与目标锚点：`Components` → `#components`；`ComponentTypeMap` → `#componenttypemap`；`Discriminator` → `#discriminator`；`IsReference` → `#isreference`；`Reference` → `#reference`；`Schema` → `#schema`；`SchemaType` → `#schematype`；`XML` → `#xml`。

### generator（2）

#### `reference/generator/programmatic-api.md`

- 源码：`packages/generator/src/index.ts`
- 符号与目标锚点：`CodeGenerator` → `#codegenerator-api`；`DEFAULT_CONFIG_PATH` → `#default_config_path`。

### openai（13）

#### `reference/openai/client-and-completions.md`

- 源码：`packages/openai/src/chat/chatClient.ts`、`packages/openai/src/chat/types.ts`、`packages/openai/src/openai.ts`
- 符号与目标锚点：`ChatClient` → `#chatclient`；`ChatRequest` → `#chatrequest`；`ChatResponse` → `#chatresponse`；`ChatTool` → `#chattool`；`ChatToolChoice` → `#chattoolchoice`；`ChatToolFunction` → `#chattoolfunction`；`Choice` → `#choice`；`Message` → `#message`；`OpenAI` → `#openai`；`OpenAIOptions` → `#openaioptions`；`Usage` → `#usage`。

#### `reference/openai/streaming.md`

- 源码：`packages/openai/src/chat/completionStreamResultExtractor.ts`
- 符号与目标锚点：`CompletionStreamResultExtractor` → `#completionstreamresultextractor`；`DoneDetector` → `#donedetector`。

### cosec（72）

#### `reference/cosec/tokens-and-refresh.md`

- 源码：`packages/cosec/src/jwtToken.ts`、`packages/cosec/src/jwtTokenManager.ts`、`packages/cosec/src/jwts.ts`、`packages/cosec/src/tokenRefresher.ts`、`packages/cosec/src/tokenStorage.ts`
- 符号与目标锚点：`AccessToken` → `#accesstoken`；`CompositeToken` → `#compositetoken`；`CoSecJwtPayload` → `#cosecjwtpayload`；`CoSecTokenRefresher` → `#cosectokenrefresher`；`CoSecTokenRefresherOptions` → `#cosectokenrefresheroptions`；`DEFAULT_COSEC_TOKEN_KEY` → `#default_cosec_token_key`；`EarlyPeriodCapable` → `#earlyperiodcapable`；`IJwtToken` → `#ijwttoken`；`isTokenExpired` → `#istokenexpired`；`JwtCompositeToken` → `#jwtcompositetoken`；`jwtCompositeTokenSerializer` → `#jwtcompositetokenserializer-instance`；`JwtCompositeTokenSerializer` → `#jwtcompositetokenserializer`；`JwtPayload` → `#jwtpayload`；`JwtToken` → `#jwttoken`；`JwtTokenManager` → `#jwttokenmanager`；`parseJwtPayload` → `#parsejwtpayload`；`RefreshSessionChangedError` → `#refreshsessionchangederror`；`RefreshToken` → `#refreshtoken`；`RefreshTokenError` → `#refreshtokenerror`；`RefreshTokenStatusCapable` → `#refreshtokenstatuscapable`；`TokenRefresher` → `#tokenrefresher`；`TokenStorage` → `#tokenstorage-api`；`TokenStorageOptions` → `#tokenstorageoptions`。

#### `reference/cosec/configuration.md`

- 源码：`packages/cosec/src/cosecConfigurer.ts`、`packages/cosec/src/types.ts`
- 符号与目标锚点：`AppIdCapable` → `#appidcapable`；`CoSecConfig` → `#cosecconfig`；`CoSecConfigurer` → `#cosecconfigurer`；`CoSecOptions` → `#cosecoptions`；`DeviceIdStorageCapable` → `#deviceidstoragecapable`；`JwtTokenManagerCapable` → `#jwttokenmanagercapable`。

#### `reference/cosec/interceptors-and-attribution.md`

- 源码：`packages/cosec/src/authorizationRequestInterceptor.ts`、`packages/cosec/src/authorizationResponseInterceptor.ts`、`packages/cosec/src/cosecRequestInterceptor.ts`、`packages/cosec/src/deviceIdStorage.ts`、`packages/cosec/src/forbiddenErrorInterceptor.ts`、`packages/cosec/src/idGenerator.ts`、`packages/cosec/src/resourceAttributionRequestInterceptor.ts`、`packages/cosec/src/spaceIdProvider.ts`、`packages/cosec/src/types.ts`、`packages/cosec/src/unauthorizedErrorInterceptor.ts`
- 符号与目标锚点：`AUTHORIZATION_REQUEST_INTERCEPTOR_NAME` → `#authorization_request_interceptor_name`；`AUTHORIZATION_REQUEST_INTERCEPTOR_ORDER` → `#authorization_request_interceptor_order`；`AUTHORIZATION_RESPONSE_INTERCEPTOR_NAME` → `#authorization_response_interceptor_name`；`AUTHORIZATION_RESPONSE_INTERCEPTOR_ORDER` → `#authorization_response_interceptor_order`；`AUTHORIZATION_RESPONSE_MAX_RETRY` → `#authorization_response_max_retry`；`AuthorizationInterceptorOptions` → `#authorizationinterceptoroptions`；`AuthorizationRequestInterceptor` → `#authorizationrequestinterceptor`；`AuthorizationResponseInterceptor` → `#authorizationresponseinterceptor`；`AuthorizeResult` → `#authorizeresult`；`AuthorizeResults` → `#authorizeresults`；`COSEC_REQUEST_INTERCEPTOR_NAME` → `#cosec_request_interceptor_name`；`COSEC_REQUEST_INTERCEPTOR_ORDER` → `#cosec_request_interceptor_order`；`CoSecHeaders` → `#cosecheaders`；`CoSecRequestInterceptor` → `#cosecrequestinterceptor`；`CoSecRequestOptions` → `#cosecrequestoptions`；`DEFAULT_COSEC_DEVICE_ID_KEY` → `#default_cosec_device_id_key`；`DEFAULT_COSEC_SPACE_ID_KEY` → `#default_cosec_space_id_key`；`DefaultSpaceIdProvider` → `#defaultspaceidprovider`；`DeviceIdStorage` → `#deviceidstorage`；`DeviceIdStorageOptions` → `#deviceidstorageoptions`；`FORBIDDEN_ERROR_INTERCEPTOR_NAME` → `#forbidden_error_interceptor_name`；`FORBIDDEN_ERROR_INTERCEPTOR_ORDER` → `#forbidden_error_interceptor_order`；`ForbiddenErrorInterceptor` → `#forbiddenerrorinterceptor`；`ForbiddenErrorInterceptorOptions` → `#forbiddenerrorinterceptoroptions`；`idGenerator` → `#idgenerator-instance`；`IdGenerator` → `#idgenerator`；`IGNORE_REFRESH_TOKEN_ATTRIBUTE_KEY` → `#ignore_refresh_token_attribute_key`；`NanoIdGenerator` → `#nanoidgenerator`；`NoneSpaceIdProvider` → `#nonespaceidprovider`；`RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_NAME` → `#resource_attribution_request_interceptor_name`；`RESOURCE_ATTRIBUTION_REQUEST_INTERCEPTOR_ORDER` → `#resource_attribution_request_interceptor_order`；`ResourceAttributionOptions` → `#resourceattributionoptions`；`ResourceAttributionRequestInterceptor` → `#resourceattributionrequestinterceptor`；`ResponseCodes` → `#responsecodes`；`SpacedResourcePredicate` → `#spacedresourcepredicate`；`SpaceIdProvider` → `#spaceidprovider`；`SpaceIdProviderOptions` → `#spaceidprovideroptions`；`SpaceIdStorage` → `#spaceidstorage`；`SpaceIdStorageOptions` → `#spaceidstorageoptions`；`UNAUTHORIZED_ERROR_INTERCEPTOR_NAME` → `#unauthorized_error_interceptor_name`；`UNAUTHORIZED_ERROR_INTERCEPTOR_ORDER` → `#unauthorized_error_interceptor_order`；`UnauthorizedErrorInterceptor` → `#unauthorizederrorinterceptor`；`UnauthorizedErrorInterceptorOptions` → `#unauthorizederrorinterceptoroptions`。

### react（138）

#### `reference/react/monitoring-and-utilities.md`

- 源码：`packages/react/src/core/fullscreen/FullscreenContext.tsx`、`packages/react/src/core/fullscreen/useFullscreen.ts`、`packages/react/src/core/fullscreen/utils.ts`、`packages/react/src/core/useForceUpdate.ts`、`packages/react/src/core/useLatest.ts`、`packages/react/src/core/useMounted.ts`、`packages/react/src/core/useRefs.ts`、`packages/react/src/core/useRequestId.ts`、`packages/react/src/dataMonitor/DataMonitorService.ts`、`packages/react/src/dataMonitor/useDataMonitor.ts`、`packages/react/src/dataMonitor/useDataMonitorEventBus.ts`
- 符号与目标锚点：`addFullscreenChangeListener` → `#api-addFullscreenChangeListener`；`DataChangedEvent` → `#api-DataChangedEvent`；`dataMonitorEventBus` → `#api-dataMonitorEventBus`；`DataMonitorNotificationConfig` → `#api-DataMonitorNotificationConfig`；`dataMonitorService` → `#api-dataMonitorService`；`DataMonitorService` → `#api-DataMonitorService`；`enterFullscreen` → `#api-enterFullscreen`；`exitFullscreen` → `#api-exitFullscreen`；`FullscreenContext` → `#api-FullscreenContext`；`FullscreenContextValue` → `#api-FullscreenContextValue`；`FullscreenProvider` → `#api-FullscreenProvider`；`FullscreenProviderProps` → `#api-FullscreenProviderProps`；`getFullscreenElement` → `#api-getFullscreenElement`；`isFullscreen` → `#api-isFullscreen`；`removeFullscreenChangeListener` → `#api-removeFullscreenChangeListener`；`useDataMonitor` → `#api-useDataMonitor`；`useDataMonitorEventBus` → `#api-useDataMonitorEventBus`；`UseDataMonitorEventBusReturn` → `#api-UseDataMonitorEventBusReturn`；`UseDataMonitorOptions` → `#api-UseDataMonitorOptions`；`UseDataMonitorReturn` → `#api-UseDataMonitorReturn`；`useForceUpdate` → `#api-useForceUpdate`；`useFullscreen` → `#api-useFullscreen`；`useFullscreenContext` → `#api-useFullscreenContext`；`UseFullscreenOptions` → `#api-UseFullscreenOptions`；`UseFullscreenReturn` → `#api-UseFullscreenReturn`；`useLatest` → `#api-useLatest`；`useMounted` → `#api-useMounted`；`useRefs` → `#api-useRefs`；`UseRefsReturn` → `#api-UseRefsReturn`；`useRequestId` → `#api-useRequestId`；`UseRequestIdReturn` → `#api-UseRequestIdReturn`。

#### `reference/react/cosec.md`

- 源码：`packages/react/src/cosec/RefreshableRouteGuard.tsx`、`packages/react/src/cosec/RouteGuard.tsx`、`packages/react/src/cosec/SecurityContext.tsx`、`packages/react/src/cosec/useSecurity.ts`
- 符号与目标锚点：`ANONYMOUS_USER` → `#api-ANONYMOUS_USER`；`RefreshableRouteGuard` → `#api-RefreshableRouteGuard`；`RefreshableRouteGuardProps` → `#api-RefreshableRouteGuardProps`；`RouteGuard` → `#api-RouteGuard`；`RouteGuardProps` → `#api-RouteGuardProps`；`SecurityContext` → `#api-SecurityContext`；`SecurityContextOptions` → `#api-SecurityContextOptions`；`SecurityContextValue` → `#api-SecurityContextValue`；`SecurityProvider` → `#api-SecurityProvider`；`useSecurity` → `#api-useSecurity`；`useSecurityContext` → `#api-useSecurityContext`；`UseSecurityOptions` → `#api-UseSecurityOptions`；`UseSecurityReturn` → `#api-UseSecurityReturn`。

#### `reference/react/api-hooks.md`

- 源码：`packages/react/src/api/apiHooks.ts`、`packages/react/src/api/createExecuteApiHooks.ts`、`packages/react/src/api/createQueryApiHooks.ts`
- 符号与目标锚点：`APIHooks` → `#api-APIHooks`；`ApiHooksMapping` → `#api-ApiHooksMapping`；`ApiMethod` → `#api-ApiMethod`；`collectMethods` → `#api-collectMethods`；`CreateApiHooksOptions` → `#api-CreateApiHooksOptions`；`createExecuteApiHooks` → `#api-createExecuteApiHooks`；`CreateExecuteApiHooksOptions` → `#api-CreateExecuteApiHooksOptions`；`createQueryApiHooks` → `#api-createQueryApiHooks`；`CreateQueryApiHooksOptions` → `#api-CreateQueryApiHooksOptions`；`FunctionParameters` → `#api-FunctionParameters`；`FunctionReturnType` → `#api-FunctionReturnType`；`HookName` → `#api-HookName`；`IsPromiseFunction` → `#api-IsPromiseFunction`；`methodNameToHookName` → `#api-methodNameToHookName`；`OnBeforeExecuteCallback` → `#api-OnBeforeExecuteCallback`；`QueryAPIHooks` → `#api-QueryAPIHooks`；`QueryMethod` → `#api-QueryMethod`；`UseApiMethodExecuteOptions` → `#api-UseApiMethodExecuteOptions`；`UseApiMethodQueryOptions` → `#api-UseApiMethodQueryOptions`。

#### `reference/react/debounce.md`

- 源码：`packages/react/src/core/debounced/useDebouncedCallback.ts`、`packages/react/src/core/debounced/useDebouncedExecutePromise.ts`、`packages/react/src/core/debounced/useDebouncedQuery.ts`、`packages/react/src/fetcher/debounced/useDebouncedFetcher.ts`、`packages/react/src/fetcher/debounced/useDebouncedFetcherQuery.ts`
- 符号与目标锚点：`DebounceCapable` → `#api-DebounceCapable`；`useDebouncedCallback` → `#api-useDebouncedCallback`；`UseDebouncedCallbackOptions` → `#api-UseDebouncedCallbackOptions`；`UseDebouncedCallbackReturn` → `#api-UseDebouncedCallbackReturn`；`useDebouncedExecutePromise` → `#api-useDebouncedExecutePromise`；`UseDebouncedExecutePromiseOptions` → `#api-UseDebouncedExecutePromiseOptions`；`UseDebouncedExecutePromiseReturn` → `#api-UseDebouncedExecutePromiseReturn`；`useDebouncedFetcher` → `#api-useDebouncedFetcher`；`UseDebouncedFetcherOptions` → `#api-UseDebouncedFetcherOptions`；`useDebouncedFetcherQuery` → `#api-useDebouncedFetcherQuery`；`UseDebouncedFetcherQueryOptions` → `#api-UseDebouncedFetcherQueryOptions`；`UseDebouncedFetcherQueryReturn` → `#api-UseDebouncedFetcherQueryReturn`；`UseDebouncedFetcherReturn` → `#api-UseDebouncedFetcherReturn`；`useDebouncedQuery` → `#api-useDebouncedQuery`；`UseDebouncedQueryOptions` → `#api-UseDebouncedQueryOptions`；`UseDebouncedQueryReturn` → `#api-UseDebouncedQueryReturn`。

#### `reference/react/promise-and-query-state.md`

- 源码：`packages/react/src/core/useExecutePromise.ts`、`packages/react/src/core/usePromiseState.ts`、`packages/react/src/core/useQuery.ts`、`packages/react/src/core/useQueryState.ts`
- 符号与目标锚点：`isValidateQuery` → `#api-isValidateQuery`；`PromiseState` → `#api-PromiseState`；`PromiseStateCallbacks` → `#api-PromiseStateCallbacks`；`PromiseStatus` → `#api-PromiseStatus`；`PromiseSupplier` → `#api-PromiseSupplier`；`QueryOptions` → `#api-QueryOptions`；`useExecutePromise` → `#api-useExecutePromise`；`UseExecutePromiseOptions` → `#api-UseExecutePromiseOptions`；`UseExecutePromiseReturn` → `#api-UseExecutePromiseReturn`；`usePromiseState` → `#api-usePromiseState`；`UsePromiseStateOptions` → `#api-UsePromiseStateOptions`；`UsePromiseStateReturn` → `#api-UsePromiseStateReturn`；`useQuery` → `#api-useQuery`；`UseQueryOptions` → `#api-UseQueryOptions`；`UseQueryReturn` → `#api-UseQueryReturn`；`useQueryState` → `#api-useQueryState`；`UseQueryStateOptions` → `#api-UseQueryStateOptions`；`UseQueryStateReturn` → `#api-UseQueryStateReturn`。

#### `reference/react/wow.md`

- 源码：`packages/react/src/wow/fetcher/useFetcherCountQuery.ts`、`packages/react/src/wow/fetcher/useFetcherListQuery.ts`、`packages/react/src/wow/fetcher/useFetcherListStreamQuery.ts`、`packages/react/src/wow/fetcher/useFetcherPagedQuery.ts`、`packages/react/src/wow/fetcher/useFetcherSingleQuery.ts`、`packages/react/src/wow/useCountQuery.ts`、`packages/react/src/wow/useListQuery.ts`、`packages/react/src/wow/useListStreamQuery.ts`、`packages/react/src/wow/usePagedQuery.ts`、`packages/react/src/wow/useSingleQuery.ts`
- 符号与目标锚点：`useCountQuery` → `#api-useCountQuery`；`UseCountQueryOptions` → `#api-UseCountQueryOptions`；`UseCountQueryReturn` → `#api-UseCountQueryReturn`；`useFetcherCountQuery` → `#api-useFetcherCountQuery`；`UseFetcherCountQueryOptions` → `#api-UseFetcherCountQueryOptions`；`UseFetcherCountQueryReturn` → `#api-UseFetcherCountQueryReturn`；`useFetcherListQuery` → `#api-useFetcherListQuery`；`UseFetcherListQueryOptions` → `#api-UseFetcherListQueryOptions`；`UseFetcherListQueryReturn` → `#api-UseFetcherListQueryReturn`；`useFetcherListStreamQuery` → `#api-useFetcherListStreamQuery`；`UseFetcherListStreamQueryOptions` → `#api-UseFetcherListStreamQueryOptions`；`UseFetcherListStreamQueryReturn` → `#api-UseFetcherListStreamQueryReturn`；`useFetcherPagedQuery` → `#api-useFetcherPagedQuery`；`UseFetcherPagedQueryOptions` → `#api-UseFetcherPagedQueryOptions`；`UseFetcherPagedQueryReturn` → `#api-UseFetcherPagedQueryReturn`；`useFetcherSingleQuery` → `#api-useFetcherSingleQuery`；`UseFetcherSingleQueryOptions` → `#api-UseFetcherSingleQueryOptions`；`UseFetcherSingleQueryReturn` → `#api-UseFetcherSingleQueryReturn`；`useListQuery` → `#api-useListQuery`；`UseListQueryOptions` → `#api-UseListQueryOptions`；`UseListQueryReturn` → `#api-UseListQueryReturn`；`useListStreamQuery` → `#api-useListStreamQuery`；`UseListStreamQueryOptions` → `#api-UseListStreamQueryOptions`；`UseListStreamQueryReturn` → `#api-UseListStreamQueryReturn`；`usePagedQuery` → `#api-usePagedQuery`；`UsePagedQueryOptions` → `#api-UsePagedQueryOptions`；`UsePagedQueryReturn` → `#api-UsePagedQueryReturn`；`useSingleQuery` → `#api-useSingleQuery`；`UseSingleQueryOptions` → `#api-UseSingleQueryOptions`；`UseSingleQueryReturn` → `#api-UseSingleQueryReturn`。

#### `reference/react/storage-and-events.md`

- 源码：`packages/react/src/eventbus/useEventSubscription.ts`、`packages/react/src/storage/useImmerKeyStorage.ts`、`packages/react/src/storage/useKeyStorage.ts`
- 符号与目标锚点：`useEventSubscription` → `#api-useEventSubscription`；`UseEventSubscriptionOptions` → `#api-UseEventSubscriptionOptions`；`UseEventSubscriptionReturn` → `#api-UseEventSubscriptionReturn`；`useImmerKeyStorage` → `#api-useImmerKeyStorage`；`useKeyStorage` → `#api-useKeyStorage`。

#### `reference/react/fetcher-hooks.md`

- 源码：`packages/react/src/fetcher/useFetcher.ts`、`packages/react/src/fetcher/useFetcherQuery.ts`
- 符号与目标锚点：`useFetcher` → `#api-useFetcher`；`UseFetcherOptions` → `#api-UseFetcherOptions`；`useFetcherQuery` → `#api-useFetcherQuery`；`UseFetcherQueryOptions` → `#api-UseFetcherQueryOptions`；`UseFetcherQueryReturn` → `#api-UseFetcherQueryReturn`；`UseFetcherReturn` → `#api-UseFetcherReturn`。

### wow（248）

#### `reference/wow/identity-and-attribution.md`

- 动作：从 shared-types.md 按真实职责重写拆分；中英同步，旧页删除。
- 源码：`packages/wow/src/types/abac.ts`、`packages/wow/src/types/common.ts`、`packages/wow/src/types/endpoints.ts`、`packages/wow/src/types/modeling.ts`、`packages/wow/src/types/naming.ts`
- 符号与目标锚点：`AbacTagKey` → `#api-AbacTagKey`；`AbacTagValue` → `#api-AbacTagValue`；`AbacTags` → `#api-AbacTags`；`EMPTY_ABAC_TAGS` → `#api-EMPTY_ABAC_TAGS`；`WILDCARD_ABAC_TAG_VALUES` → `#api-WILDCARD_ABAC_TAG_VALUES`；`AbacTaggable` → `#api-AbacTaggable`；`ApplyAbacTags` → `#api-ApplyAbacTags`；`AbacTagsApplied` → `#api-AbacTagsApplied`；`Identifier` → `#api-Identifier`；`Version` → `#api-Version`；`UrlPathParams` → `#api-UrlPathParams`；`ResourceAttributionPathSpec` → `#api-ResourceAttributionPathSpec`；`AggregateNameCapable` → `#api-AggregateNameCapable`；`NamedAggregate` → `#api-NamedAggregate`；`AliasAggregate` → `#api-AliasAggregate`；`AggregateId` → `#api-AggregateId`；`AggregateIdCapable` → `#api-AggregateIdCapable`；`DEFAULT_OWNER_ID` → `#api-DEFAULT_OWNER_ID`；`OwnerId` → `#api-OwnerId`；`SpaceIdCapable` → `#api-SpaceIdCapable`；`TenantId` → `#api-TenantId`；`NamedBoundedContext` → `#api-NamedBoundedContext`；`AliasBoundedContext` → `#api-AliasBoundedContext`；`Named` → `#api-Named`；`DescriptionCapable` → `#api-DescriptionCapable`。

#### `reference/wow/messages-and-state.md`

- 动作：从 shared-types.md 按真实职责重写拆分；中英同步，旧页删除。
- 源码：`packages/wow/src/types/bi.ts`、`packages/wow/src/types/function.ts`、`packages/wow/src/types/messaging.ts`、`packages/wow/src/types/modeling.ts`
- 符号与目标锚点：`FunctionKind` → `#api-FunctionKind`；`FunctionInfo` → `#api-FunctionInfo`；`FunctionInfoCapable` → `#api-FunctionInfoCapable`；`BodyCapable` → `#api-BodyCapable`；`CreateTimeCapable` → `#api-CreateTimeCapable`；`DeletedCapable` → `#api-DeletedCapable`；`EventIdCapable` → `#api-EventIdCapable`；`EventTimeCapable` → `#api-EventTimeCapable`；`FirstEventTimeCapable` → `#api-FirstEventTimeCapable`；`FirstOperatorCapable` → `#api-FirstOperatorCapable`；`OperatorCapable` → `#api-OperatorCapable`；`SnapshotTimeCapable` → `#api-SnapshotTimeCapable`；`StateCapable` → `#api-StateCapable`；`MessageHeaderSqlType` → `#api-MessageHeaderSqlType`。

#### `reference/wow/errors-and-utilities.md`

- 动作：从 shared-types.md 按真实职责重写拆分；中英同步，旧页删除。
- 源码：`packages/wow/src/getPropertyValue.ts`、`packages/wow/src/query/types.ts`、`packages/wow/src/types/error.ts`
- 符号与目标锚点：`DynamicDocument` → `#api-DynamicDocument`；`DynamicDocumentArray` → `#api-DynamicDocumentArray`；`RecoverableType` → `#api-RecoverableType`；`BindingError` → `#api-BindingError`；`ErrorInfo` → `#api-ErrorInfo`；`ErrorCodes` → `#api-ErrorCodes`；`getPropertyValue` → `#api-getPropertyValue`。

#### `reference/wow/operator-locales.md`

- 动作：新增独立子路径入口说明，不计入根导出符号。
- 源码：`packages/wow/src/query/locale/en_US.ts`、`packages/wow/src/query/locale/zh_CN.ts`。
- 子路径与目标锚点：`./query/locale/en_US` → `#api-en_US`；`./query/locale/zh_CN` → `#api-zh_CN`。根类型 `OperatorLocale` 保留在 filters.md。

#### `reference/wow/filters.md`

- 源码：`packages/wow/src/query/condition.ts`、`packages/wow/src/query/filter.ts`、`packages/wow/src/query/locale/operatorLocale.ts`、`packages/wow/src/query/operator.ts`
- 符号与目标锚点：`active` → `#api-active`；`aggregateId` → `#api-aggregateId`；`aggregateIds` → `#api-aggregateIds`；`all` → `#api-all`；`allIn` → `#api-allIn`；`and` → `#api-and`；`beforeToday` → `#api-beforeToday`；`BeforeTodayFilter` → `#api-BeforeTodayFilter`；`between` → `#api-between`；`BetweenFilter` → `#api-BetweenFilter`；`CalendarFilter` → `#api-CalendarFilter`；`CollectionFilter` → `#api-CollectionFilter`；`ComparableFilterLiteral` → `#api-ComparableFilterLiteral`；`ComparisonFilter` → `#api-ComparisonFilter`；`Condition` → `#api-Condition`；`ConditionCapable` → `#api-ConditionCapable`；`ConditionOptionKey` → `#api-ConditionOptionKey`；`ConditionOptions` → `#api-ConditionOptions`；`contains` → `#api-contains`；`dateOptions` → `#api-dateOptions`；`DaysFilter` → `#api-DaysFilter`；`deleted` → `#api-deleted`；`DeletionFilter` → `#api-DeletionFilter`；`DeletionState` → `#api-DeletionState`；`earlierDays` → `#api-earlierDays`；`ElementFilterExpression` → `#api-ElementFilterExpression`；`ElementLogicalFilter` → `#api-ElementLogicalFilter`；`ElementMatchFilter` → `#api-ElementMatchFilter`；`elemMatch` → `#api-elemMatch`；`EMPTY_VALUE_OPERATORS` → `#api-EMPTY_VALUE_OPERATORS`；`endsWith` → `#api-endsWith`；`eq` → `#api-eq`；`EqualityFilter` → `#api-EqualityFilter`；`EqualityFilterValue` → `#api-EqualityFilterValue`；`exists` → `#api-exists`；`FieldPresenceFilter` → `#api-FieldPresenceFilter`；`filter` → `#api-filter`；`FilterCapable` → `#api-FilterCapable`；`FilterExpression` → `#api-FilterExpression`；`FilterLiteral` → `#api-FilterLiteral`；`FilterOperator` → `#api-FilterOperator`；`gt` → `#api-gt`；`gte` → `#api-gte`；`id` → `#api-id`；`ids` → `#api-ids`；`ignoreCaseOptions` → `#api-ignoreCaseOptions`；`isFalse` → `#api-isFalse`；`isIn` → `#api-isIn`；`isNull` → `#api-isNull`；`isTrue` → `#api-isTrue`；`isValidateCondition` → `#api-isValidateCondition`；`lastMonth` → `#api-lastMonth`；`lastWeek` → `#api-lastWeek`；`LOGICAL_OPERATORS` → `#api-LOGICAL_OPERATORS`；`LogicalField` → `#api-LogicalField`；`LogicalFilter` → `#api-LogicalFilter`；`lt` → `#api-lt`；`lte` → `#api-lte`；`match` → `#api-match`；`MatchFilter` → `#api-MatchFilter`；`MetadataFilter` → `#api-MetadataFilter`；`MetadataValueFilter` → `#api-MetadataValueFilter`；`MetadataValuesFilter` → `#api-MetadataValuesFilter`；`ne` → `#api-ne`；`nextWeek` → `#api-nextWeek`；`nor` → `#api-nor`；`notIn` → `#api-notIn`；`notNull` → `#api-notNull`；`Operator` → `#api-Operator`；`OperatorLocale` → `#api-OperatorLocale`；`or` → `#api-or`；`ownerId` → `#api-ownerId`；`QueryField` → `#api-QueryField`；`raw` → `#api-raw`；`recentDays` → `#api-recentDays`；`RelativeTimeFilterOptions` → `#api-RelativeTimeFilterOptions`；`SearchFilter` → `#api-SearchFilter`；`SearchFilterOptions` → `#api-SearchFilterOptions`；`SearchMode` → `#api-SearchMode`；`spaceId` → `#api-spaceId`；`startsWith` → `#api-startsWith`；`StringComparison` → `#api-StringComparison`；`StringFilter` → `#api-StringFilter`；`tenantId` → `#api-tenantId`；`thisMonth` → `#api-thisMonth`；`thisWeek` → `#api-thisWeek`；`TimeUnit` → `#api-TimeUnit`；`today` → `#api-today`；`tomorrow` → `#api-tomorrow`。

#### `reference/wow/configuration.md`

- 源码：`packages/wow/src/configuration/wowMetadata.ts`、`packages/wow/src/query/queryClients.ts`
- 符号与目标锚点：`Aggregate` → `#api-Aggregate`；`BoundedContext` → `#api-BoundedContext`；`createQueryApiMetadata` → `#api-createQueryApiMetadata`；`QueryClientFactory` → `#api-QueryClientFactory`；`QueryClientOptions` → `#api-QueryClientOptions`；`ScopesCapable` → `#api-ScopesCapable`；`WowMetadata` → `#api-WowMetadata`。

#### `reference/wow/aggregations.md`

- 源码：`packages/wow/src/query/aggregation.ts`
- 符号与目标锚点：`aggregation` → `#api-aggregation`；`AggregationDateUnit` → `#api-AggregationDateUnit`；`AggregationElement` → `#api-AggregationElement`；`AggregationExpression` → `#api-AggregationExpression`；`AggregationExpressionOperator` → `#api-AggregationExpressionOperator`；`AggregationExpressionType` → `#api-AggregationExpressionType`；`AggregationFunction` → `#api-AggregationFunction`；`AggregationGroup` → `#api-AggregationGroup`；`AggregationGroupType` → `#api-AggregationGroupType`；`AggregationMetric` → `#api-AggregationMetric`；`AggregationMetricType` → `#api-AggregationMetricType`；`AggregationQuery` → `#api-AggregationQuery`；`AnyAggregationMetric` → `#api-AnyAggregationMetric`；`BinaryAggregationExpression` → `#api-BinaryAggregationExpression`；`ConstantAggregationExpression` → `#api-ConstantAggregationExpression`；`CountAggregationMetric` → `#api-CountAggregationMetric`；`DateHistogramAggregationGroup` → `#api-DateHistogramAggregationGroup`；`DateHistogramAggregationOptions` → `#api-DateHistogramAggregationOptions`；`FieldAggregationExpression` → `#api-FieldAggregationExpression`；`HistogramAggregationGroup` → `#api-HistogramAggregationGroup`；`HistogramAggregationOptions` → `#api-HistogramAggregationOptions`；`NumericAggregationMetric` → `#api-NumericAggregationMetric`；`TermsAggregationGroup` → `#api-TermsAggregationGroup`。

#### `reference/wow/commands.md`

- 源码：`packages/wow/src/command/commandClient.ts`、`packages/wow/src/command/commandHeaders.ts`、`packages/wow/src/command/commandRequest.ts`、`packages/wow/src/command/commandResult.ts`、`packages/wow/src/command/types.ts`
- 符号与目标锚点：`ApplyResourceTags` → `#api-ApplyResourceTags`；`ApplyResourceTagsCommand` → `#api-ApplyResourceTagsCommand`；`BatchResult` → `#api-BatchResult`；`CommandBody` → `#api-CommandBody`；`CommandClient` → `#api-CommandClient`；`CommandHeaders` → `#api-CommandHeaders`；`CommandId` → `#api-CommandId`；`CommandRequest` → `#api-CommandRequest`；`CommandRequestHeaders` → `#api-CommandRequestHeaders`；`CommandResult` → `#api-CommandResult`；`CommandResultArray` → `#api-CommandResultArray`；`CommandResultCapable` → `#api-CommandResultCapable`；`CommandResultEventStream` → `#api-CommandResultEventStream`；`CommandStage` → `#api-CommandStage`；`CommandStageCapable` → `#api-CommandStageCapable`；`CommandUrlParams` → `#api-CommandUrlParams`；`CompensationTarget` → `#api-CompensationTarget`；`DeleteAggregate` → `#api-DeleteAggregate`；`DeleteAggregateCommand` → `#api-DeleteAggregateCommand`；`NullableAggregateVersionCapable` → `#api-NullableAggregateVersionCapable`；`RecoverAggregate` → `#api-RecoverAggregate`；`RecoverAggregateCommand` → `#api-RecoverAggregateCommand`；`RequestId` → `#api-RequestId`；`SignalTimeCapable` → `#api-SignalTimeCapable`；`WaitCommandIdCapable` → `#api-WaitCommandIdCapable`；`WaitSignal` → `#api-WaitSignal`。

#### `reference/wow/query-options.md`

- 源码：`packages/wow/src/query/pagination.ts`、`packages/wow/src/query/projection.ts`、`packages/wow/src/query/queryable.ts`、`packages/wow/src/query/sort.ts`
- 符号与目标锚点：`asc` → `#api-asc`；`DEFAULT_PAGINATION` → `#api-DEFAULT_PAGINATION`；`DEFAULT_PROJECTION` → `#api-DEFAULT_PROJECTION`；`defaultProjection` → `#api-defaultProjection`；`desc` → `#api-desc`；`EMPTY_PAGED_LIST` → `#api-EMPTY_PAGED_LIST`；`FieldSort` → `#api-FieldSort`；`FilterListQuery` → `#api-FilterListQuery`；`FilterPagedQuery` → `#api-FilterPagedQuery`；`FilterQueryable` → `#api-FilterQueryable`；`FilterSingleQuery` → `#api-FilterSingleQuery`；`listQuery` → `#api-listQuery`；`ListQuery` → `#api-ListQuery`；`ListQueryRequest` → `#api-ListQueryRequest`；`pagedList` → `#api-pagedList`；`PagedList` → `#api-PagedList`；`pagedQuery` → `#api-pagedQuery`；`PagedQuery` → `#api-PagedQuery`；`PagedQueryRequest` → `#api-PagedQueryRequest`；`pagination` → `#api-pagination`；`Pagination` → `#api-Pagination`；`projection` → `#api-projection`；`Projection` → `#api-Projection`；`ProjectionCapable` → `#api-ProjectionCapable`；`Queryable` → `#api-Queryable`；`singleQuery` → `#api-singleQuery`；`SingleQuery` → `#api-SingleQuery`；`SingleQueryRequest` → `#api-SingleQueryRequest`；`SortCapable` → `#api-SortCapable`；`SortDirection` → `#api-SortDirection`。

#### `reference/wow/cursor-queries.md`

- 源码：`packages/wow/src/query/cursorQuery.ts`
- 符号与目标锚点：`CursorPage` → `#api-CursorPage`；`cursorQuery` → `#api-cursorQuery`；`CursorQuery` → `#api-CursorQuery`；`DEFAULT_CURSOR_SIZE` → `#api-DEFAULT_CURSOR_SIZE`；`MAX_CURSOR_SIZE` → `#api-MAX_CURSOR_SIZE`；`MAX_CURSOR_SORT_FIELDS` → `#api-MAX_CURSOR_SORT_FIELDS`。

#### `reference/wow/events-and-history.md`

- 源码：`packages/wow/src/query/event/domainEventStream.ts`、`packages/wow/src/query/event/eventStreamQueryApi.ts`、`packages/wow/src/query/event/eventStreamQueryClient.ts`、`packages/wow/src/query/state/loadOwnerStateAggregateClient.ts`、`packages/wow/src/query/state/loadStateAggregateClient.ts`
- 符号与目标锚点：`DomainEvent` → `#api-DomainEvent`；`DomainEventStream` → `#api-DomainEventStream`；`DomainEventStreamHeader` → `#api-DomainEventStreamHeader`；`DomainEventStreamMetadataFields` → `#api-DomainEventStreamMetadataFields`；`EventStreamQueryApi` → `#api-EventStreamQueryApi`；`EventStreamQueryClient` → `#api-EventStreamQueryClient`；`EventStreamQueryEndpointPaths` → `#api-EventStreamQueryEndpointPaths`；`LoadOwnerStateAggregateClient` → `#api-LoadOwnerStateAggregateClient`；`LoadOwnerStateAggregateEndpointPaths` → `#api-LoadOwnerStateAggregateEndpointPaths`；`LoadStateAggregateClient` → `#api-LoadStateAggregateClient`；`LoadStateAggregateEndpointPaths` → `#api-LoadStateAggregateEndpointPaths`；`ReadableDomainEventStream` → `#api-ReadableDomainEventStream`；`StateEvent` → `#api-StateEvent`。

#### `reference/wow/snapshot-queries.md`

- 源码：`packages/wow/src/query/queryApi.ts`、`packages/wow/src/query/snapshot/snapshot.ts`、`packages/wow/src/query/snapshot/snapshotQueryApi.ts`、`packages/wow/src/query/snapshot/snapshotQueryClient.ts`
- 符号与目标锚点：`MaterializedSnapshot` → `#api-MaterializedSnapshot`；`MediumMaterializedSnapshot` → `#api-MediumMaterializedSnapshot`；`QueryApi` → `#api-QueryApi`；`SmallMaterializedSnapshot` → `#api-SmallMaterializedSnapshot`；`SnapshotMetadataFields` → `#api-SnapshotMetadataFields`；`SnapshotQueryApi` → `#api-SnapshotQueryApi`；`SnapshotQueryClient` → `#api-SnapshotQueryClient`；`SnapshotQueryEndpointPaths` → `#api-SnapshotQueryEndpointPaths`。

### viewer（263）

#### `reference/viewer/tables-and-cells.md`

- 源码：`packages/viewer/src/table/ViewTable.tsx`、`packages/viewer/src/table/cell/ActionCell.tsx`、`packages/viewer/src/table/cell/ActionsCell.tsx`、`packages/viewer/src/table/cell/AvatarCell.tsx`、`packages/viewer/src/table/cell/CalendarTime.tsx`、`packages/viewer/src/table/cell/CurrencyCell.tsx`、`packages/viewer/src/table/cell/DateTimeCell.tsx`、`packages/viewer/src/table/cell/ImageCell.tsx`、`packages/viewer/src/table/cell/ImageGroupCell.tsx`、`packages/viewer/src/table/cell/LinkCell.tsx`、`packages/viewer/src/table/cell/PrimaryKeyCell.tsx`、`packages/viewer/src/table/cell/TagCell.tsx`、`packages/viewer/src/table/cell/TagsCell.tsx`、`packages/viewer/src/table/cell/TextCell.tsx`、`packages/viewer/src/table/cell/TypedCell.tsx`、`packages/viewer/src/table/cell/cellRegistry.ts`、`packages/viewer/src/table/cell/currencyFormatter.ts`、`packages/viewer/src/table/cell/types.ts`、`packages/viewer/src/table/cell/utils.ts`、`packages/viewer/src/table/hooks/useViewTableState.ts`、`packages/viewer/src/table/setting/TableFieldItem.tsx`、`packages/viewer/src/table/setting/TableSettingPanel.tsx`、`packages/viewer/src/table/types.ts`
- 符号与目标锚点：`ACTION_CELL_TYPE` → `#api-ACTION_CELL_TYPE`；`ActionCell` → `#api-ActionCell`；`ActionCellProps` → `#api-ActionCellProps`；`ACTIONS_CELL_TYPE` → `#api-ACTIONS_CELL_TYPE`；`ActionsCell` → `#api-ActionsCell`；`ActionsCellProps` → `#api-ActionsCellProps`；`ActionsData` → `#api-ActionsData`；`AVATAR_CELL_TYPE` → `#api-AVATAR_CELL_TYPE`；`AvatarCell` → `#api-AvatarCell`；`AvatarCellProps` → `#api-AvatarCellProps`；`CALENDAR_CELL_TYPE` → `#api-CALENDAR_CELL_TYPE`；`CalendarFormats` → `#api-CalendarFormats`；`CalendarTimeCell` → `#api-CalendarTimeCell`；`CalendarTimeProps` → `#api-CalendarTimeProps`；`CellComponent` → `#api-CellComponent`；`CellData` → `#api-CellData`；`CellProps` → `#api-CellProps`；`cellRegistry` → `#api-cellRegistry`；`CellRenderer` → `#api-CellRenderer`；`CellType` → `#api-CellType`；`ColumnsCell` → `#api-ColumnsCell`；`CURRENCY_CELL_TYPE` → `#api-CURRENCY_CELL_TYPE`；`CurrencyAttributes` → `#api-CurrencyAttributes`；`CurrencyCell` → `#api-CurrencyCell`；`CurrencyCellProps` → `#api-CurrencyCellProps`；`CurrencyFormatOptions` → `#api-CurrencyFormatOptions`；`DATETIME_CELL_TYPE` → `#api-DATETIME_CELL_TYPE`；`DateTimeCell` → `#api-DateTimeCell`；`DateTimeCellProps` → `#api-DateTimeCellProps`；`DEFAULT_CALENDAR_FORMATS` → `#api-DEFAULT_CALENDAR_FORMATS`；`DEFAULT_CURRENCY_FORMAT_OPTIONS` → `#api-DEFAULT_CURRENCY_FORMAT_OPTIONS`；`DEFAULT_DATE_TIME_FORMAT` → `#api-DEFAULT_DATE_TIME_FORMAT`；`formatCurrency` → `#api-formatCurrency`；`IMAGE_CELL_TYPE` → `#api-IMAGE_CELL_TYPE`；`IMAGE_GROUP_CELL_TYPE` → `#api-IMAGE_GROUP_CELL_TYPE`；`ImageCell` → `#api-ImageCell`；`ImageCellProps` → `#api-ImageCellProps`；`ImageGroupCell` → `#api-ImageGroupCell`；`ImageGroupCellProps` → `#api-ImageGroupCellProps`；`isActionCellProps` → `#api-isActionCellProps`；`isNullOrUndefined` → `#api-isNullOrUndefined`；`isValidImageSrc` → `#api-isValidImageSrc`；`LINK_CELL_TYPE` → `#api-LINK_CELL_TYPE`；`LinkCell` → `#api-LinkCell`；`LinkCellProps` → `#api-LinkCellProps`；`parseDayjs` → `#api-parseDayjs`；`PRIMARY_KEY_CELL_TYPE` → `#api-PRIMARY_KEY_CELL_TYPE`；`PrimaryKeyCell` → `#api-PrimaryKeyCell`；`PrimaryKeyCellProps` → `#api-PrimaryKeyCellProps`；`TableFieldItem` → `#api-TableFieldItem`；`TableFieldItemProps` → `#api-TableFieldItemProps`；`TableSettingPanel` → `#api-TableSettingPanel`；`TableSettingPanelProps` → `#api-TableSettingPanelProps`；`TableSettingPanelRef` → `#api-TableSettingPanelRef`；`TAG_CELL_TYPE` → `#api-TAG_CELL_TYPE`；`TagCell` → `#api-TagCell`；`TagCellProps` → `#api-TagCellProps`；`TAGS_CELL_TYPE` → `#api-TAGS_CELL_TYPE`；`TagsCell` → `#api-TagsCell`；`TagsCellProps` → `#api-TagsCellProps`；`TEXT_CELL_TYPE` → `#api-TEXT_CELL_TYPE`；`TextCell` → `#api-TextCell`；`TextCellProps` → `#api-TextCellProps`；`typedCellRender` → `#api-typedCellRender`；`useViewTableState` → `#api-useViewTableState`；`ViewTable` → `#api-ViewTable`；`ViewTableActionColumn` → `#api-ViewTableActionColumn`；`ViewTableProps` → `#api-ViewTableProps`；`ViewTableRef` → `#api-ViewTableRef`；`ViewTableStateReturn` → `#api-ViewTableStateReturn`。

#### `reference/viewer/models-and-state.md`

- 源码：`packages/viewer/src/hooks/useActiveViewState.ts`、`packages/viewer/src/types.ts`、`packages/viewer/src/utils.ts`、`packages/viewer/src/view/hooks/useViewState.ts`、`packages/viewer/src/viewer/hooks/useViewerState.ts`、`packages/viewer/src/viewer/types.ts`
- 符号与目标锚点：`ActionItem` → `#api-ActionItem`；`AttributesCapable` → `#api-AttributesCapable`；`BatchActionsConfig` → `#api-BatchActionsConfig`；`DataSourceCapable` → `#api-DataSourceCapable`；`deepEqual` → `#api-deepEqual`；`DEFAULT_CONDITION` → `#api-DEFAULT_CONDITION`；`FieldDefinition` → `#api-FieldDefinition`；`format` → `#api-format`；`GetRecordCountAction` → `#api-GetRecordCountAction`；`GetRecordCountActionCapable` → `#api-GetRecordCountActionCapable`；`KeyCapable` → `#api-KeyCapable`；`mapToTableRecord` → `#api-mapToTableRecord`；`Optional` → `#api-Optional`；`PrimaryKeyClickHandlerCapable` → `#api-PrimaryKeyClickHandlerCapable`；`ReducerActionCapable` → `#api-ReducerActionCapable`；`SaveViewMethod` → `#api-SaveViewMethod`；`StyleCapable` → `#api-StyleCapable`；`TableRecordType` → `#api-TableRecordType`；`TableSizeCapable` → `#api-TableSizeCapable`；`TopBarActionItem` → `#api-TopBarActionItem`；`TopbarActionsCapable` → `#api-TopbarActionsCapable`；`useActiveViewState` → `#api-useActiveViewState`；`UseActiveViewStateOptions` → `#api-UseActiveViewStateOptions`；`UseActiveViewStateReturn` → `#api-UseActiveViewStateReturn`；`useViewerState` → `#api-useViewerState`；`UseViewerStateOptions` → `#api-UseViewerStateOptions`；`UseViewerStateReturn` → `#api-UseViewerStateReturn`；`useViewState` → `#api-useViewState`；`UseViewStateOptions` → `#api-UseViewStateOptions`；`UseViewStateReturn` → `#api-UseViewStateReturn`；`ViewChangeAction` → `#api-ViewChangeAction`；`ViewColumn` → `#api-ViewColumn`；`ViewDefinition` → `#api-ViewDefinition`；`ViewMutationAction` → `#api-ViewMutationAction`；`ViewMutationActionsCapable` → `#api-ViewMutationActionsCapable`；`ViewSource` → `#api-ViewSource`；`ViewState` → `#api-ViewState`；`ViewTableSetting` → `#api-ViewTableSetting`；`ViewTableSettingCapable` → `#api-ViewTableSettingCapable`；`ViewType` → `#api-ViewType`。

#### `reference/viewer/filters.md`

- 源码：`packages/viewer/src/filter/AssemblyFilter.tsx`、`packages/viewer/src/filter/BoolFilter.tsx`、`packages/viewer/src/filter/FallbackFilter.tsx`、`packages/viewer/src/filter/IdFilter.tsx`、`packages/viewer/src/filter/NumberFilter.tsx`、`packages/viewer/src/filter/SelectFilter.tsx`、`packages/viewer/src/filter/TextFilter.tsx`、`packages/viewer/src/filter/TypedFilter.tsx`、`packages/viewer/src/filter/filterRegistry.ts`、`packages/viewer/src/filter/operator/locale/operator.zh_CN.ts`、`packages/viewer/src/filter/operator/types.ts`、`packages/viewer/src/filter/panel/AvailableFilterSelect.tsx`、`packages/viewer/src/filter/panel/AvailableFilterSelectModal.tsx`、`packages/viewer/src/filter/panel/EditableFilterPanel.tsx`、`packages/viewer/src/filter/panel/FilterPanel.tsx`、`packages/viewer/src/filter/panel/RemovableTypedFilter.tsx`、`packages/viewer/src/filter/types.ts`、`packages/viewer/src/filter/useFilterState.ts`、`packages/viewer/src/filter/utils.ts`
- 符号与目标锚点：`ActiveFilter` → `#api-ActiveFilter`；`AssemblyFilter` → `#api-AssemblyFilter`；`AssemblyFilterProps` → `#api-AssemblyFilterProps`；`AvailableFilter` → `#api-AvailableFilter`；`AvailableFilterGroup` → `#api-AvailableFilterGroup`；`AvailableFilterSelect` → `#api-AvailableFilterSelect`；`AvailableFilterSelectModal` → `#api-AvailableFilterSelectModal`；`AvailableFilterSelectProps` → `#api-AvailableFilterSelectProps`；`AvailableFilterSelectRef` → `#api-AvailableFilterSelectRef`；`AvailableFiltersModalProps` → `#api-AvailableFiltersModalProps`；`BOOL_FILTER` → `#api-BOOL_FILTER`；`BoolFilter` → `#api-BoolFilter`；`ConditionValueParser` → `#api-ConditionValueParser`；`currentTimeZone` → `#api-currentTimeZone`；`EditableFilterPanel` → `#api-EditableFilterPanel`；`EditableFilterPanelProps` → `#api-EditableFilterPanelProps`；`ExtendedOperator` → `#api-ExtendedOperator`；`FallbackFilter` → `#api-FallbackFilter`；`FilterComponent` → `#api-FilterComponent`；`FilterField` → `#api-FilterField`；`FilterLabelProps` → `#api-FilterLabelProps`；`FilterOperatorProps` → `#api-FilterOperatorProps`；`FilterPanel` → `#api-FilterPanel`；`FilterPanelConditionCapableRef` → `#api-FilterPanelConditionCapableRef`；`FilterPanelProps` → `#api-FilterPanelProps`；`FilterPanelRef` → `#api-FilterPanelRef`；`FilterProps` → `#api-FilterProps`；`FilterRef` → `#api-FilterRef`；`filterRegistry` → `#api-filterRegistry`；`FilterState` → `#api-FilterState`；`FilterType` → `#api-FilterType`；`FilterValue` → `#api-FilterValue`；`FilterValueConverter` → `#api-FilterValueConverter`；`FilterValueProps` → `#api-FilterValueProps`；`ID_FILTER` → `#api-ID_FILTER`；`IdFilter` → `#api-IdFilter`；`IdOnOperatorChangeValueConverter` → `#api-IdOnOperatorChangeValueConverter`；`isValidBetweenValue` → `#api-isValidBetweenValue`；`isValidValue` → `#api-isValidValue`；`NUMBER_FILTER` → `#api-NUMBER_FILTER`；`NumberFilter` → `#api-NumberFilter`；`NumberOnOperatorChangeValueConverter` → `#api-NumberOnOperatorChangeValueConverter`；`OnChange` → `#api-OnChange`；`OnOperatorChangeValueConverter` → `#api-OnOperatorChangeValueConverter`；`OPERATOR_zh_CN` → `#api-OPERATOR_zh_CN`；`RemovableTypedFilter` → `#api-RemovableTypedFilter`；`RemovableTypedFilterProps` → `#api-RemovableTypedFilterProps`；`SELECT_FILTER` → `#api-SELECT_FILTER`；`SelectFilter` → `#api-SelectFilter`；`SelectFilterValueProps` → `#api-SelectFilterValueProps`；`SelectOnOperatorChangeValueConverter` → `#api-SelectOnOperatorChangeValueConverter`；`SelectOperator` → `#api-SelectOperator`；`SelectOperatorLocale` → `#api-SelectOperatorLocale`；`TEXT_FILTER` → `#api-TEXT_FILTER`；`TextFilter` → `#api-TextFilter`；`TextOnOperatorChangeValueConverter` → `#api-TextOnOperatorChangeValueConverter`；`TrueValidateValue` → `#api-TrueValidateValue`；`TypedFilter` → `#api-TypedFilter`；`TypedFilterProps` → `#api-TypedFilterProps`；`useFilterState` → `#api-useFilterState`；`UseFilterStateOptions` → `#api-UseFilterStateOptions`；`UseFilterStateReturn` → `#api-UseFilterStateReturn`；`ValidateValue` → `#api-ValidateValue`；`ValueInputRender` → `#api-ValueInputRender`。

#### `reference/viewer/toolbar-and-locale.md`

- 源码：`packages/viewer/src/hooks/useRefreshDataEventBus.ts`、`packages/viewer/src/locale/Locale.ts`、`packages/viewer/src/locale/useLocale.ts`、`packages/viewer/src/topbar/AutoRefreshBarItem.tsx`、`packages/viewer/src/topbar/BarItem.tsx`、`packages/viewer/src/topbar/ColumnHeightBarItem.tsx`、`packages/viewer/src/topbar/DataMonitorBarItem.tsx`、`packages/viewer/src/topbar/FilterBarItem.tsx`、`packages/viewer/src/topbar/FullscreenBarItem.tsx`、`packages/viewer/src/topbar/Point.tsx`、`packages/viewer/src/topbar/RefreshDataBarItem.tsx`、`packages/viewer/src/topbar/ShareLinkBarItem.tsx`、`packages/viewer/src/topbar/TopBar.tsx`、`packages/viewer/src/topbar/types.ts`
- 符号与目标锚点：`AutoRefreshBarItem` → `#api-AutoRefreshBarItem`；`AutoRefreshBarItemProps` → `#api-AutoRefreshBarItemProps`；`AutoRefreshItem` → `#api-AutoRefreshItem`；`BarItem` → `#api-BarItem`；`BarItemProps` → `#api-BarItemProps`；`ColumnHeightBarItem` → `#api-ColumnHeightBarItem`；`ColumnHeightBarItemProps` → `#api-ColumnHeightBarItemProps`；`DataMonitorBarItem` → `#api-DataMonitorBarItem`；`DataMonitorBarItemProps` → `#api-DataMonitorBarItemProps`；`FilterBarItem` → `#api-FilterBarItem`；`FilterBarItemProps` → `#api-FilterBarItemProps`；`FullscreenBarItem` → `#api-FullscreenBarItem`；`FullscreenBarItemProps` → `#api-FullscreenBarItemProps`；`Locale` → `#api-Locale`；`Point` → `#api-Point`；`RefreshDataBarItem` → `#api-RefreshDataBarItem`；`RefreshDataBarItemProps` → `#api-RefreshDataBarItemProps`；`RefreshDataEvent` → `#api-RefreshDataEvent`；`RefreshDataEventBusReturn` → `#api-RefreshDataEventBusReturn`；`ShareLinkBarItem` → `#api-ShareLinkBarItem`；`ShareLinkBarItemProps` → `#api-ShareLinkBarItemProps`；`TopBar` → `#api-TopBar`；`TopBarItemProps` → `#api-TopBarItemProps`；`TopBarProps` → `#api-TopBarProps`；`useLocale` → `#api-useLocale`；`UseLocaleReturn` → `#api-UseLocaleReturn`；`useRefreshDataEventBus` → `#api-useRefreshDataEventBus`。

#### `reference/viewer/fetcher-viewer.md`

- 源码：`packages/viewer/src/fetcherviewer/FetcherViewer.tsx`、`packages/viewer/src/fetcherviewer/client/boundedContext.ts`、`packages/viewer/src/fetcherviewer/client/types.ts`、`packages/viewer/src/fetcherviewer/client/view/commandClient.ts`、`packages/viewer/src/fetcherviewer/client/view/queryClient.ts`、`packages/viewer/src/fetcherviewer/client/view/types.ts`、`packages/viewer/src/fetcherviewer/client/viewer_definition/queryClient.ts`、`packages/viewer/src/fetcherviewer/client/viewer_definition/types.ts`、`packages/viewer/src/fetcherviewer/hooks/useFetchData.ts`、`packages/viewer/src/fetcherviewer/hooks/useViewerDefinition.ts`、`packages/viewer/src/fetcherviewer/hooks/useViewerViews.ts`
- 符号与目标锚点：`CreateView` → `#api-CreateView`；`CreateViewCommand` → `#api-CreateViewCommand`；`EditView` → `#api-EditView`；`EditViewCommand` → `#api-EditViewCommand`；`FetcherViewer` → `#api-FetcherViewer`；`FetcherViewerProps` → `#api-FetcherViewerProps`；`FetcherViewerRef` → `#api-FetcherViewerRef`；`SecurityContext` → `#api-SecurityContext`；`useFetchData` → `#api-useFetchData`；`UseFetchDataOptions` → `#api-UseFetchDataOptions`；`UseFetchDataReturn` → `#api-UseFetchDataReturn`；`useViewerDefinition` → `#api-useViewerDefinition`；`UseViewerDefinitionResult` → `#api-UseViewerDefinitionResult`；`useViewerViews` → `#api-useViewerViews`；`UseViewerViewsResult` → `#api-UseViewerViewsResult`；`ViewAggregatedFields` → `#api-ViewAggregatedFields`；`ViewCommandClient` → `#api-ViewCommandClient`；`ViewCommandEndpointPaths` → `#api-ViewCommandEndpointPaths`；`ViewCreated` → `#api-ViewCreated`；`ViewDomainEventType` → `#api-ViewDomainEventType`；`ViewDomainEventTypeMapTitle` → `#api-ViewDomainEventTypeMapTitle`；`ViewEdited` → `#api-ViewEdited`；`VIEWER_BOUNDED_CONTEXT_ALIAS` → `#api-VIEWER_BOUNDED_CONTEXT_ALIAS`；`ViewerDefinitionAggregatedFields` → `#api-ViewerDefinitionAggregatedFields`；`ViewerDefinitionDomainEventType` → `#api-ViewerDefinitionDomainEventType`；`ViewerDefinitionDomainEventTypeMapTitle` → `#api-ViewerDefinitionDomainEventTypeMapTitle`；`viewerDefinitionQueryClientFactory` → `#api-viewerDefinitionQueryClientFactory`；`viewQueryClientFactory` → `#api-viewQueryClientFactory`；`ViewSnapshotTarget` → `#api-ViewSnapshotTarget`；`ViewStreamCommandClient` → `#api-ViewStreamCommandClient`。

#### `reference/viewer/view-and-viewer.md`

- 源码：`packages/viewer/src/view/View.tsx`、`packages/viewer/src/viewer/Viewer.tsx`
- 符号与目标锚点：`FilterMode` → `#api-FilterMode`；`View` → `#api-View`；`Viewer` → `#api-Viewer`；`ViewerProps` → `#api-ViewerProps`；`ViewerRef` → `#api-ViewerRef`；`ViewProps` → `#api-ViewProps`；`ViewRef` → `#api-ViewRef`。

#### `reference/viewer/registries-and-inputs.md`

- 源码：`packages/viewer/src/components/NumberRange.tsx`、`packages/viewer/src/components/RemoteSelect.tsx`、`packages/viewer/src/components/TagInput.tsx`、`packages/viewer/src/components/fullscreen/Fullscreen.tsx`、`packages/viewer/src/registry/componentRegistry.ts`
- 符号与目标锚点：`Fullscreen` → `#api-Fullscreen`；`FullScreenProps` → `#api-FullScreenProps`；`NumberRange` → `#api-NumberRange`；`NumberRangeProps` → `#api-NumberRangeProps`；`NumberTagValueItemSerializer` → `#api-NumberTagValueItemSerializer`；`RemoteSelect` → `#api-RemoteSelect`；`RemoteSelectProps` → `#api-RemoteSelectProps`；`StringTagValueItemSerializer` → `#api-StringTagValueItemSerializer`；`TagInput` → `#api-TagInput`；`TagInputProps` → `#api-TagInputProps`；`TagValueItemSerializer` → `#api-TagValueItemSerializer`；`TypeCapable` → `#api-TypeCapable`；`TypedComponentRegistry` → `#api-TypedComponentRegistry`。

#### `reference/viewer/saved-views.md`

- 源码：`packages/viewer/src/viewer/panel/SaveViewModal.tsx`、`packages/viewer/src/viewer/panel/ViewItem.tsx`、`packages/viewer/src/viewer/panel/ViewItemGroup.tsx`、`packages/viewer/src/viewer/panel/ViewManageItem.tsx`、`packages/viewer/src/viewer/panel/ViewManageModal.tsx`、`packages/viewer/src/viewer/panel/ViewPanel.tsx`
- 符号与目标锚点：`SaveViewModal` → `#api-SaveViewModal`；`SaveViewModalProps` → `#api-SaveViewModalProps`；`ViewItem` → `#api-ViewItem`；`ViewItemGroup` → `#api-ViewItemGroup`；`ViewItemGroupProps` → `#api-ViewItemGroupProps`；`ViewItemProps` → `#api-ViewItemProps`；`ViewManageItem` → `#api-ViewManageItem`；`ViewManageItemProps` → `#api-ViewManageItemProps`；`ViewManageModal` → `#api-ViewManageModal`；`ViewManageModalProps` → `#api-ViewManageModalProps`；`ViewPanel` → `#api-ViewPanel`；`ViewPanelProps` → `#api-ViewPanelProps`。

核对总数：968

## Task8 复杂包最终专题顺序

- `react`：`index` → `fetcher-hooks` → `promise-and-query-state` → `api-hooks` → `debounce` → `wow` → `storage-and-events` → `cosec` → `monitoring-and-utilities` → `symbols`。
- `wow`：`index` → `configuration` → `commands` → `snapshot-queries` → `filters` → `query-options` → `cursor-queries` → `aggregations` → `events-and-history` → `identity-and-attribution` → `messages-and-state` → `errors-and-utilities` → `operator-locales` → `symbols`。
- `viewer`：`index` → `view-and-viewer` → `models-and-state` → `filters` → `tables-and-cells` → `saved-views` → `fetcher-viewer` → `registries-and-inputs` → `toolbar-and-locale` → `symbols`。

Wow 旧 shared-types 的所有 `api-*` 锚点均保持符号名，仅主题路径按以上三组调整；没有旧页、重定向或兼容索引。以上主题顺序供 Task9 manifest 整合。

## 最终验收（2026-09-08）

- 最终页面集合为 274 页（中英文各 137 页），12 包共 968 个根导出均映射到专题契约与符号锚点；Wow 另说明两个 locale 子路径。旧页面按映射删除，没有兼容页或重定向。
- 10 项实现任务完成。各项独立规格/质量审查及最终静态交叉审查均通过，无待处理实质问题。最终审查检查跨页契约、导航、双语、源码片段、LLM 和旧路由清理，没有重复逐字审计全部页面。
- `pnpm --dir wiki generate:llms`、`pnpm --dir wiki build` 通过；构建仅保留已有大 chunk 提示。文档 Node 测试 8/8、新 React/Viewer Storybook 测试 4/4、共享夹具影响的已有故事 10/10、`pnpm test:unit` 3825 个通过（12 包）；`git diff --check` 通过。
- 新构建预览 `http://127.0.0.1:4174` 的 Mermaid 既有浏览器回归 3/3 通过：阅读宽度、键盘退出和焦点恢复、修饰键滚轮缩放。首次验收因预览进程退出而失败，重启并刷新当前构建后通过，未放宽测试。
- CUA 实测桌面及 390px：首页→开始、架构、复杂 Viewer 参考，搜索 FetcherViewer 命中并定位 props 锚点，原生 details 展开，语言切换保持同一内容路径，深浅主题，移动端图展开/缩放/重置/Escape 退出。移动端正文及图退出后的整页宽度为 390px，无整页横向溢出。
- 键盘 Tab 可达 Skip to content，具有可见原生 outline；图退出恢复 Expand diagram 焦点和页面滚动。浅色实际正文链接为 #5a4bd6 / 白背景（6.15:1），深色 #a49bff / #0d1117（7.85:1）；主按钮白字 / #5a4bd6（6.15:1），深浅模式均保持。浏览器设备模拟已清除。
- 外部临时消费者按 HTTP 文档安装已发布 Fetcher 5.0.0，编译及真实成功/404 路径通过；停止服务后 ECONNREFUSED 非零退出。使用 Bundler 模块解析，未声称支持当前声明文件在 NodeNext 下编译。
- 外部 Viewer 消费者按 Vite React TS 文档安装全部 15 项 peer 图依赖，`tsc -b && vite build` 通过；真实浏览器验证 Ada/Lin 初页、Grace/Zoe 次页、Name 排序及 Active 过滤后总数 2。没有工作区别名或业务后端。React 手动取消等待 2 秒后仍 idle，无迟到结果覆盖。
- 仅修改文档、文档脚本/主题与 Storybook 示例及其共享夹具；SDK、依赖和根构建配置未变。未执行发布、提交、推送、PR 或合并。集成后端能力只按现有实现描述，不以示例测试声明真实服务端授权或一致性。

## 后续修订验收

- 全站主题最终改为 VitePress 默认主题，前述自定义颜色对比值仅记录最初验收，不代表最终配色。首页恢复 logo 与原生 features。
- 全站侧栏互通、包顺序固定、按路由/手机打开事件定位当前项；新增桌面/手机浏览器回归覆盖当前项可见、手动滚动不回弹及重开定位。
- React Cancellation 故事先执行成功请求再慢请求，旧实现未显示 loading 的断言先失败，修复后3个React故事通过。远端 Viewer 双语示例补 onSwitchView 数据加载。
- query=undefined 的保留旧查询与暂停/取消语义、Viewer 客户端渲染限制在双语正文澄清。搜索默认紧凑结果，参考右目录保留二级章节。
- 最新文档测试9/9、侧栏与Mermaid浏览器回归4/4、wiki构建、diff检查通过；当前项SPA跳转和紧凑搜索已实际浏览器检查。原独立审查后修订再次复审通过。
- 用户已授权PR；提交前再次运行全包单元测试。远端Viewer修复按源码契约验证，未声明真实业务后端已验收。
