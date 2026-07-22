# 单元测试全面重构设计

**日期**: 2026-06-18
**状态**: Draft
**作者**: ZCode（架构师）+ Ahoo-Wang（owner 决策）

## 背景与动机

对 fetcher monorepo（12 包，~200 测试文件，~3000 测试用例）的深度审计发现：大量测试**没有提供回归保护**——它们是绿色的谎言。这不是风格瑕疵，而是系统性的测试失效。

### 审计发现的核心问题（按严重性）

#### P0：假测试——零回归保护

| 位置 | 问题 | 证据 |
|------|------|------|
| `fetcher/test/fetcher.test.ts:63-256` | 8 个 HTTP 方法测试 mock 掉 `interceptors.exchange`（被测对象本身），只验证"mock 返回了 mock"。把 `get()` 改成永远发 POST 测试仍全绿 | mock 实现后断言 `expect(response).toBe(mockResponse)` |
| `decorator/test/apiDecorator.test.ts:509-644` | `buildRequestExecutor` 测试断言全是 `toBeInstanceOf` + 注释"应合并优先级"——注释不是断言。即使优先级反过来也全绿 | 6 个用例，每个只有 `expect(requestExecutor).toBeInstanceOf(RequestExecutor)` |
| `generator/test/client/clientGenerator.test.ts:150,157,173` | `expect(true).toBe(true)` 占位 | 无任何生产代码调用 |
| `viewer/test/view/View.test.tsx`（271 行） | 17 处 `container.firstChild` 冒烟测试。传入 `onChange` 回调却从不触发、从不验证 | 所有用例只 `expect(container.firstChild).toBeInTheDocument()` |
| `viewer/test/topbar/TopBar.test.tsx:212-219` | `if (button)` 守卫——按钮找不到时测试**静默通过** | 找不到按钮则跳过整个断言块 |
| `react/test/core/useQuery.test.ts:19-21` | mock 掉 `useExecutePromise`（被测对象的核心依赖），断言"我 mock 的 A 被调用了" | `vi.mock('../../src/core/useExecutePromise')` |
| `cosec/test/tokenStorage.test.ts:58-87,181` | 同时 mock 序列化器 + spy 被测对象自身的 `get()`，双重架空真实逻辑 | `vi.spyOn(tokenStorage, 'get').mockReturnValue(...)` |

#### P1：隔离失效

- 全仓 vitest 配置无 `restoreMocks`/`clearMocks`/`unstubGlobals`
- fetcher/test/fetcher.test.ts 13 处手工 `mockRestore()`，无 afterEach
- generator/test/utils/sourceFiles.test.ts beforeEach 不清 mockProject（已知导致 mock 残留误判）
- cosec 4 个文件模块级 `vi.stubGlobal` 不还原
- react/viewer spyOn 大量未还原，跨文件污染

#### P2：过度 mock

- generator 40 处 vi.mock，含 mock 掉 `combineURLs`（路径拼接的真实逻辑被屏蔽，且断言把 mock 的错误双斜杠行为固化）
- react 27 处 vi.mock，整层依赖被 mock
- viewer 25 处 vi.mock

#### P3：脆弱断言与实现细节耦合

- 全仓 744 处 `toHaveBeenCalled`（react 独占 270），验证"调用了几次"而非"结果对不对"
- viewer 205 处依赖 `.ant-tag`/`.anticon-reload` 内部 class，antd 升级即全红
- decorator functionMetadata.test 通过 `@ts-expect-error` 测私有方法 `processHttpParam`

#### P4：组织问题

- 12 个测试文件 >600 行（最大 apiClientGenerator.test.ts 774 行）
- fetcher 8 文件各自复制 mockFetcher 定义；react 35 文件重复 renderHook 样板
- generator/wow 多处完全重复的测试块（copy-paste）
- wow 大量"字面量读回"测试（构造对象再断言自身属性）

#### P5：覆盖率盲区

- viewer vitest.config.ts `//TODO exclude` 把核心组件（Viewer/FetcherViewer/View/TopBar）全部排除出覆盖率
- openai 仅 1 测试文件，缺错误路径/提取器/取消测试
- openapi 纯类型包几乎无测试

## 架构原则（贯穿全程）

1. **测行为，不测实现**——断言可观察结果（HTTP method、URL、返回数据、DOM 内容），不断言内部调用次数/私有方法
2. **mock 最外层边界**——mock `fetch`/DOM API/文件系统/时钟，不 mock 被测对象的协作单元（如其依赖的其它 hook）
3. **测试独立隔离**——靠配置层 `restoreMocks/clearMocks/unstubGlobals` 保证，不靠手写清理
4. **YAGNI**——纯类型测试、字面量读回、`expect(true).toBe(true)` 全删，类型安全交给 tsc
5. **不留技术债**——每个重写的测试断言强度必须 ≥ 原版，且能在旧代码上复现真实回归；不允许"等价替换"式重写

## 重构策略：C（地基优先 + 按包深入）

```
阶段 1（全仓地基，1 PR）
  ├─ 1.1 统一清理配置
  └─ 1.2 删除零价值测试
        ↓
阶段 2（按包深入，每包 1 PR，并行推进）
  ├─ 2.1 fetcher
  ├─ 2.2 decorator
  ├─ 2.3 generator
  ├─ 2.4 react
  ├─ 2.5 viewer
  ├─ 2.6 cosec
  └─ 2.7 openai
        ↓
阶段 3（组织优化，1-2 PR）
```

## 阶段 1：地基修复（全仓一次性，低风险）

### 1.1 统一清理配置

所有包 `vitest.config.ts` 的 `test` 块新增：
```ts
clearMocks: true,      // 每测试前清 mock 调用记录
restoreMocks: true,    // 每测试前还原 spyOn 原始实现
unstubGlobals: true,   // 每测试前还原 vi.stubGlobal/stubEnv
```

加完后删除所有手写的 `afterEach(() => vi.restoreAllMocks/clearAllMocks/unstubAllGlobals)`（配置已自动处理）。

**验证标准**：加完配置后全仓测试仍全绿。若有红测试，说明它依赖泄漏——是 bug，需当场修。

### 1.2 删除零价值测试

| 文件 | 理由 |
|------|------|
| `fetcher/test/types.test.ts` | 字面量读回，tsc 覆盖 |
| `fetcher/test/orderedCapable.test.ts` | 同上 |
| `fetcher/test/resultExtractor.test.ts`（仅接口字面量部分） | 同上 |
| `wow/test/types/function.test.ts` | `expect(true).toBe(true)` |
| `wow/test/types/modeling.test.ts` | 同上 |
| `wow/test/commandResult.test.ts` | 整篇字面量读回（纯类型） |
| `wow/test/domainEventStream.test.ts` | 同上 |
| `wow/test/snapshot.test.ts` | 同上 |
| `wow/test/naming.test.ts` | 同上 |
| `wow/test/common.test.ts` | 同上 |
| `wow/test/endpoints.test.ts` | 同上 |
| `generator/test/client/clientGenerator.test.ts` 的 3 个占位用例（:150,:157,:173） | `expect(true).toBe(true)` |
| `generator/test/client/apiClientGenerator.test.ts` 重复 block（:546-610） | 与 :485-545 完全相同 |
| `generator/test/model/typeGenerator.test.ts` 重复 block（:664-705） | 与 :620-661 完全相同 |
| `wow/test/query/condition.test.ts` 重复 block（:99-108） | 与 :91-98 完全相同 |

**验证标准**：删除后各包 coverage 不下降（这些测试本就没覆盖生产代码）。

### 1.3 不在阶段 1 做

- 重写假测试（阶段 2）
- 降级过度 mock（阶段 2）
- 拆巨型文件（阶段 3）
- 弱断言升级（阶段 2/3）

## 阶段 2：按包深入重写

每个子阶段是独立 PR。所有重写遵循 TDD：**重写的测试必须先在旧代码上跑（或人为注入缺陷验证能捕捉），证明它有回归保护**。

### 2.1 fetcher（优先级：高）

**fetcher.test.ts 重写**：
- 删除 mock `interceptors.exchange` 的 8 个 HTTP 方法测试
- 改为 mock `globalThis.fetch`（边界），保留真实拦截器链
- 每个方法断言：传入 fetch 的 `init.method`、`init.url`、合并后的 headers、最终返回的 Response
- 参考范式：`namedFetcher.test.ts:78-83`（已正确 mock fetch 而非 exchange）

**interceptorManager.test.ts / interceptor.test.ts**：
- mock 拦截器改为有真实副作用（往 `exchange.attributes` 写入自己的名字 + order）
- 断言 `attributes` 的最终顺序数组，而非 `toHaveBeenCalledWith`
- 这样验证的是"按 order 排序执行"这一真实行为

**urlBuilder.test.ts:111-120**：
- 明确产品意图。若 null/undefined 应过滤（推荐），改测试为断言被剔除；当前测试把 `name=null&status=undefined` 字面量当期望，是 bug 固化

### 2.2 decorator（优先级：高）

**apiDecorator.test.ts 的 buildRequestExecutor（:509-644）重写**：
- 删除所有 `toBeInstanceOf` + 注释假断言
- 对每个"元数据合并"场景，执行 `requestExecutor.execute([...args])`，断言最终 request 的：
  - `basePath`（实例 vs 函数优先级）
  - `headers`（合并结果）
  - `timeout`（覆盖优先级）
- 参考范式：`requestExecutor.test.ts` 里已有 execute + 断言 request 的写法

**functionMetadata.test.ts**：
- 删除 5 处 `@ts-expect-error` 直接测私有 `processHttpParam` 的用例
- 用 `resolveExchangeInit([...])` + 断言 `request.headers`/`request.urlParams` 覆盖同样路径

**清理**：删除重复的 afterAll 块（apiDecorator:29-35 两个相同、requestExecutor:26-36 三个相同）

### 2.3 generator（优先级：高）

**降级 combineURLs mock**：
- `sourceFiles.test.ts:39-45` 和 `apiClientGenerator.test.ts:70-76` 删除 `combineURLs: vi.fn(...)`
- 让真实 combineURLs 跑
- 修正 `apiClientGenerator.test.ts:216` 等错误的双斜杠期望（`test-context//test` → `test-context/test`）

**generate() 类测试补断言**：
- `commandClientGenerator.test.ts:137-142`、`queryClientGenerator.test.ts:132-137`、`index.test.ts:139-170`
- 在 `generate()` 后断言子生成器的 `addClass`/`addImportDeclaration` 被以正确参数调用
- 参考范式：`commandClientGenerator.test.ts:151-154,207-221`（正确写法）

**隔离**：`typeGenerator.test.ts` 补 beforeEach clearAllMocks（配置层已覆盖，但该文件目前完全没有）

**修复 copy-paste bug**：`schemas.test.ts:131-136` 把 `isUnion` 测试误断言成 `isOneOf`

### 2.4 react（优先级：高）

**useQuery.test.ts 降级 mock**：
- 不再 `vi.mock('../../src/core/useExecutePromise')`
- 改用真实 `useExecutePromise` + mock 最外层的 execute provider
- 断言 hook 返回的 status/result/error，而非 `mockExecute` 调用次数

**wow 系列 5 个薄封装 hook**（useListQuery/useSingleQuery/useCountQuery/usePagedQuery/useListStreamQuery）：
- 不再 mock `useQuery`
- 用真实 `useQuery` + mock fetcher 层
- 纯透传 hook（若执行后断言只剩"调用了 useQuery"）→ 删除测试，保留类型导出校验

**弱断言升级**：69 处 `toHaveBeenCalled()` → `toHaveBeenCalledWith(具体参数)` + hook 返回状态断言

**清理**：`useFetcherQuery.test.ts:50-55` 删除重复的 afterEach 块

### 2.5 viewer（优先级：高）

**覆盖率修复**：
- `vitest.config.ts:28-33` 删除 `//TODO exclude` 的 4 个目录（filter/panel、viewer、fetcherviewer、view）
- 让核心组件回归覆盖率统计

**View.test.tsx / TopBar.test.tsx 重写**：
- 删除 17 处 `container.firstChild` 冒烟测试
- 每个 callback prop 测试：`fireEvent.click(...)` 触发真实交互 + `expect(callback).toHaveBeenCalledWith(具体参数)`
- 删除 `if (button)` 守卫，改 `screen.getByRole('button', { name: /重置/ })`（找不到即抛错）

**205 处 .ant-* class 断言替换**：
- 改用 testing-library 语义查询（`getByRole`/`getByText`/`getByLabelText`）
- 删除伪性能测试（TagCell.test 的 100 次 rerender）

**隔离**：FetcherViewer.test/TopBar.test/View.test 的 `vi.mock` 改用 `mockReset`（配置层 restoreMocks 已覆盖）

### 2.6 cosec（优先级：中）

**tokenStorage.test.ts**：
- 不再同时 mock 序列化器 + spy `get()`
- 用真实 `JwtCompositeToken`（构造合法 JWT 字符串），或让 mockStorage.getItem 返回真实序列化结果
- 让 `authenticated`/`currentUser` 走完整的"读 storage → 反序列化 → 判断"链路

**cosecRequestInterceptor.test.ts**：
- 删除 :302-325、:422-445 的手工 save/restore idGenerator
- 统一用顶部已有的 `vi.mock('../src/idGenerator')` + beforeEach mockReturnValue

**forbiddenErrorInterceptor.test.ts**：
- 删除名不副实的"内存/性能"测试（:380-401 的"not leak memory"只数调用次数不测内存）
- 把重复场景（concurrent/mixed status/chain）合并为表驱动 it.each

**spaceIdProvider.test.ts（738 行）**：
- 12 处 `toBeDefined` 构造器测试合并为参数化
- "各种 exchange 配置"用 it.each 表驱动

### 2.7 openai（优先级：中）

**补缺失测试**：
- 错误路径：4xx/5xx 响应、网络错误、`stream:false` 但返回 SSE、超时
- `completionStreamResultExtractor` 单测
- AbortSignal 取消测试
- apiKey/baseURL 配置校验

**隔离**：实例移入 beforeEach（当前在 describe 顶层共享）

## 阶段 3：组织优化

### 拆巨型文件（>600 行）

| 文件 | 行数 | 拆分方案 |
|------|------|---------|
| `generator/apiClientGenerator.test.ts` | 774 | 按关注点：resolveReturnType / resolveRequestType / groupOperations 各一文件 |
| `cosec/spaceIdProvider.test.ts` | 738 | 构造器 / exchange 配置 / 边界 各一文件 |
| `react/useImmerKeyStorage.test.ts` | 737 | 按 describe：without-default / with-default / stability / error / concurrent / type 各一文件 |
| `wow/condition.test.ts` | 729 | 按操作符：logical / comparison / string / array / date 各一文件 |
| `viewer/TagCell.test.tsx` | 707 | 按：render / interaction / edge-cases 各一文件 |
| `viewer/useFilterState.test.ts` | 701 | 按：init / update / reset / persistence 各一文件 |

### 常量枚举测试收敛

`wow/commandHttpHeaders.test.ts`（21 个逐字面量断言）、`operator.test.ts`、`error.test.ts` → 改为 `Object.entries(X).forEach(...)` 单循环断言。参考范式：`locale/en_US.test.ts:26-33`。

### 提取共享 test harness

- fetcher：提取共享的 `mockFetcher`/`mockRequest` 工厂到 `test/helpers.ts`
- react：提取共享的 `renderHook` + mock provider 样板到 `test/helpers.tsx`

## 验证策略

每个 PR 必须满足：
1. **全仓测试全绿**（CI 通过）
2. **coverage 不下降**（codecov/project pass）
3. **重写的测试能捕捉真实回归**——对 2.x 阶段，每个重写的测试要演示"在旧代码上人为注入缺陷会失败"（TDD 逆向验证）
4. **lint 通过**

## 不做的事（YAGNI）

- 不引入新的测试框架（继续 vitest + @testing-library/react + MSW）
- 不补 100% 覆盖率（聚焦有价值的路径，不追求指标）
- 不重写 eventbus/eventstream/storage 的测试（审计确认这三个包测试质量优秀）
- 不为 openapi 纯类型包补测试（tsc 覆盖）

## 风险与缓解

| 风险 | 缓解 |
|------|------|
| 删除测试导致 coverage 下降暴露真实未覆盖代码 | 阶段 1 删的是零价值测试，coverage 本就不计它们；阶段 2 重写会增强覆盖 |
| 重写测试引入 flaky | 配置层 restoreMocks 保证隔离；每个重写测试 TDD 验证 |
| viewer 语义查询改动大 | 单独 PR，先重写 View/TopBar 两个核心，验证范式后再推广 |
| 工作量大（数周） | 分 PR 推进，每个独立可合并；阶段 1 可立即交付价值 |
