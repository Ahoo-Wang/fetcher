# Wow Analysis Aggregation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让分析视图完整支持 Wow 扩展聚合协议，并通过五项对抗性问题对应的行为回归。

**Architecture:** 沿用现有配置、编译、查询和展示链路，扩展现有能力与草稿类型。字段表达式、指标引用和结果筛选分别编译，统一复验内置与扩展输出；展示格式不决定统计可加性。

**Tech Stack:** TypeScript strict/ES modules、React、现有 Base UI/shadcn、Intl.NumberFormat、Fetcher Wow、Vitest、Storybook/Playwright。

**Spec:** `docs/superpowers/specs/2026-09-13-wow-analysis-aggregation-design.md`（用户已确认）。

## Global Constraints

- 不增加依赖、不修改构建配置、不另建分析引擎。
- 前端不重算派生值、不自行补桶、不对分组结果做二次汇总。
- 新增能力未声明时关闭。
- 普通指标表达式整请求累计最多 256 个节点，每棵树深度最多 8。
- 派生表达式整请求单独累计最多 256 个节点，深度最多 8。
- HAVING 后端深度最多 8；前端额外限制 256 节点，不冒称为后端节点限制。
- 分组 32、指标 64、有效排序 32、元素链 5、结果 10000；宿主只能收紧。
- 提交前按仓库要求运行 pnpm test:unit；不以 mock 测试代替真实服务验证。
- 当前根 package.json：版本 5.0.0、Node >=20.20.2、pnpm 10.34.5；执行前复核，不新增版本兼容层。
- 读取适用 AGENTS.md；公共 API 同步 skills API 引用和中英文 wiki；不手改生成的 llms 文件。
- 在现有隔离工作树执行，先核对分支与 main 起点，保留设计文档及用户修改。用户选择执行方式前不启动实现或子代理。
- 步骤按依赖串行推进。每项独立跑红/绿回归；不为中间类型改动反复跑全仓测试。最终全仓通过后才能提交，发布、合并另需授权。

## 文件职责与依赖

以 `packages/view-engine/` 为包根，以下路径均相对于仓库根。

| 文件                                                                                                                    | 职责                                                   |
| ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `src/analysis/analysisModel.ts`（包内）                                                                                 | 持久化草稿、服务/字段能力、结果列契约                  |
| `src/analysis/wowAnalysis.ts`（包内）                                                                                   | Schema 字段投影与显式服务能力传入                      |
| `src/contracts/validation/definitionValidation.ts`、`src/analysis/analysisConfigurationValidation.ts`（包内）           | 结构、类型和能力入口准入                               |
| 新增 `src/analysis/analysisExpressions.ts`（包内）                                                                      | 普通表达式和派生树遍历、预算、数字文本解析             |
| 新增 `src/analysis/analysisHaving.ts`（包内）                                                                           | 结果筛选 ID → alias 编译与校验                         |
| 新增 `src/analysis/analysisMetricFilter.ts`（包内）                                                                     | 指标位置的筛选上下文及已编译谓词复验                   |
| `src/analysis/analysisCompiler.ts`（包内）                                                                              | 组织完整请求与输出 schema，复验扩展贡献                |
| `src/analysis/analysisProjection.ts`、`analysisResult.ts`、`analysisFormatting.ts`（包内同目录）                        | 图表语义、响应准入、格式                               |
| 新增 `src/analysis/AnalysisMetricEditor.tsx`、`AnalysisDerivedExpressionEditor.tsx`、`AnalysisHavingEditor.tsx`（包内） | 指标选项、派生公式、结果筛选，各自拥有真实编辑职责     |
| `src/analysis/AnalysisEditor.tsx`（包内）                                                                               | 原有卡片列表、排序与页面编排；不再内嵌所有指标属性编辑 |

新增模块均为内部实现，只有模型类型经现有 index 导出。复用原有卡片容器和拖拽，不为指标另建一套列表；不新增接口工厂、配置注册器或公式求值器。

## Task 1：配置、能力与 Schema 适配

**Files:** 修改 `packages/view-engine/src/analysis/analysisModel.ts`、`wowAnalysis.ts`、`analysisConfigurationValidation.ts`、`analysisCompiler.ts` 中的 `analysisScopeContext`；修改 `packages/view-engine/src/contracts/validation/definitionValidation.ts`、`packages/view-engine/src/index.ts`、`skills/fetcher-view-engine/references/api.md`。测试在 `packages/view-engine/test/wowAnalysis.test.ts`、`analysisAdmission.test.ts`、`analysisCompiler.test.ts`。

**Interfaces:** 沿用 `adaptWowAnalysisSchema(schema: unknown, options?: WowAnalysisSchemaOptions): WowAnalysisSchema`、`analysisScopeContext(config, context): AnalysisCompileContext`。模型新增如下声明，后续任务必须使用相同字段名：

```ts
export interface AnalysisFeatures {
  distinctCount?: boolean;
  percentile?: boolean;
  metricFilters?: boolean;
  derived?: boolean;
  having?: boolean;
  missingKey?: boolean;
  dense?: boolean;
}
// AnalysisCapability 增加 features?: AnalysisFeatures。
// AnalysisCapability.fields 的每项增加 distinctCount?: boolean、percentile?: boolean。
// WowAnalysisSchemaOptions 增加 features?: AnalysisFeatures。
// AnalysisComponentConfig 增加 filters?: FilterConfiguration、
// derivedExpression?: AnalysisDerivedExpression。
// AnalysisViewConfig 增加 having?: AnalysisHavingExpression。
// 派生格式存于已有 props.displayFormat: 'number' | 'percent'，省略为 number。
export type AnalysisDerivedExpression =
  | { type: DerivedExpressionType.METRIC_REF; metricId: string }
  | { type: DerivedExpressionType.CONSTANT; value: number | string }
  | {
      type: DerivedExpressionType.BINARY;
      operator: AggregationExpressionOperator;
      left: AnalysisDerivedExpression;
      right: AnalysisDerivedExpression;
    };
export type AnalysisHavingExpression =
  | {
      id: string;
      type: HavingExpressionType.CONDITION;
      metricId: string;
      operator: ComparisonOperator;
      value: number | string;
    }
  | {
      id: string;
      type: HavingExpressionType.BETWEEN;
      metricId: string;
      lower: number | string;
      upper: number | string;
    }
  | {
      id: string;
      type: HavingExpressionType.IN;
      metricId: string;
      values: (number | string)[];
    }
  | {
      id: string;
      type: HavingExpressionType.IS_NULL;
      metricId: string;
      negated?: boolean;
    }
  | {
      id: string;
      type: HavingExpressionType.AND | HavingExpressionType.OR;
      operands: AnalysisHavingExpression[];
    };
```

- [ ] 在现有 `analysisCompiler.test.ts` 中使用该文件的 `config`、`context` 加入作用域能力用例；保持测试输入完全独立于其他 test 文件：

```ts
it('keeps service features while using scoped field capabilities', () => {
  const scopedContext = {
    ...context,
    capability: {
      ...context.capability,
      features: { derived: true, percentile: false },
      scopes: [
        {
          id: 'items',
          label: '明细',
          elements: [{ path: 'items', fields: [] }],
          fields: [],
          capability: { fields: [], count: true },
        },
      ],
    },
  };
  const result = analysisScopeContext(
    { ...config, scope: { id: 'items', filters: [config.filters] } },
    scopedContext,
  );
  expect(result.capability.features).toEqual({
    derived: true,
    percentile: false,
  });
  expect(result.fields).toEqual([]);
});
```

- [ ] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/analysisCompiler.test.ts -t 'keeps service features'`，确认因 features 丢失而失败。
- [ ] 增加上述模型；能力入口只接受布尔值，不做 truthy 转换；复用已有 `validateFilterConfigurationStructure` 检查指标筛选草稿，语义留给编译器。派生/HAVING 容器必须结构可渲染，允许空数字文本和失效 ID；拒绝畸形树、重复 HAVING 节点 ID、循环/非 JSON 值。
- [ ] Scope 只替换字段、count、expressions，服务 features 来自外层 context；限制仍来自根能力。Schema 适配器将宿主 features 原样复制到根能力；字段 distinctCount 根据 TERMS/NUMERIC 标量能力映射，percentile 根据 NUMERIC 数值能力映射，编译时另检查服务开关。

```ts
capability: {
  ...scope.capability,
  features: context.capability.features,
  limits: context.capability.limits,
}
```

- [ ] 在 `wowAnalysis.test.ts` 现有 Schema fixture 上断言：不传 features 时不能凭 Schema 启用服务能力；开启时字段投影保持 masked、union、数组排除策略。`analysisAdmission.test.ts` 加入 `features.derived = 'true'`、字段 `percentile = 1` 拒绝断言。
- [ ] 跑上述三个测试文件和 `pnpm --filter @ahoo-wang/fetcher-view-engine test:type`，期望通过；同步新增导出类型的技能引用。

## Task 2：基础指标、指标过滤、分桶与共享预算

**Files:** 新增 `packages/view-engine/src/analysis/analysisExpressions.ts`、`analysisMetricFilter.ts`；修改同目录 `analysisCompiler.ts`、`analysisModel.ts`；测试 `packages/view-engine/test/analysisCompiler.test.ts`、`analysisAdmission.test.ts`。

**Interfaces:** `compileAnalysis(config, context): AnalysisCompileResult` 保持不变。现有公开 `compileAnalysisExpression` 保留导出入口，内部委托新遍历函数；内部契约如下：

```ts
export interface AnalysisExpressionBudget {
  nodes: number;
}
export type AnalysisExpressionPolicy =
  | { kind: 'numeric'; function: AggregationFunction }
  | { kind: 'distinct-count' }
  | { kind: 'percentile' };
export function compileAnalysisValueExpression(
  expression: DeepReadonly<AnalysisNumericExpression>,
  policy: AnalysisExpressionPolicy,
  context: AnalysisCompileContext,
  budget: AnalysisExpressionBudget,
): AggregationExpression;
export function analysisMetricFilterContext(
  context: AnalysisCompileContext,
): AnalysisCompileContext;
export function validateAnalysisMetricFilter(
  expression: FilterExpression,
  context: AnalysisCompileContext,
): void;
```

- [ ] 在现有 `analysisCompiler.test.ts` 加入字符串去重请求用例：

```ts
it('compiles distinct string fields without numeric function permission', () => {
  const c = {
    ...context,
    capability: {
      ...context.capability,
      features: { distinctCount: true },
      fields: context.capability.fields.map(f => ({
        ...f,
        distinctCount: f.field === 'state',
      })),
    },
  };
  const result = compileAnalysis(
    {
      ...config,
      metrics: [
        {
          id: 'customers',
          component: { name: 'distinct-count' },
          field: 'state',
          alias: 'customers',
          title: '客户数',
          props: {},
        },
      ],
    },
    c,
  );
  expect(result.errors).toEqual([]);
  expect(result.plan?.query.metrics).toEqual([
    aggregation.distinctCount(aggregation.field('state'), 'customers'),
  ]);
});
```

- [ ] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/analysisCompiler.test.ts -t 'distinct string'`，期望因组件不支持而失败。
- [ ] 新增 builtin `distinct-count` 和 `percentile`；后者参数使用 `props.percentile`。通过 `aggregation.distinctCount`、`aggregation.percentile` 构造 JSON；结果列 aggregation 增加 DISTINCT_COUNT/PERCENTILE，DISTINCT_COUNT 为 number、不可空、format=count，PERCENTILE 为 number、可空。
- [ ] 普通表达式按 policy 验证：distinct 根 FIELD 可为合法 TERMS/NUMERIC 标量；进入 BINARY 后字段必须为 number 且具备当前 distinctCount 字段能力；percentile 要求 number 及 percentile 字段能力；numeric 使用原函数权限。数值常量沿用原严格文本语法和 Number.isFinite，不允许空白转零。
- [ ] 每次 `compileAnalysis` 建立一个普通表达式 budget，所有实际入请求的普通表达式贡献共用它。先用局部预算解析内置草稿，再对最终重建的贡献累计请求预算，避免将同一树计数两次；扩展输出经过同一最终检查。

```ts
if (++budget.nodes > 256 || depth > 8) {
  throw new TypeError('分析表达式超出请求预算（256 节点、8 层）');
}
```

- [ ] 指标 filters 用现有 `compileFilterConfiguration` 编译；将允许操作符收紧为现有集合与指标白名单的交集。复用过滤协议解析/遍历，对已编译表达式递归校验标量字段、逻辑节点、根元数据操作的作用域；拒绝 SEARCH/ELEMENT_MATCH。指标过滤只能附加到非 DERIVED，不能覆盖根 filter。检查自定义输出谓词，不能忽略或静默丢弃其语义；如果配置与自定义贡献都声明谓词，只有语义一致才接受，否则报告冲突。
- [ ] terms 传递 `props.missingKey`，验证字符串字段和服务开关；date-histogram 传递 `props.dense`，验证布尔、服务开关、唯一维度、时区和粒度。省略选项不写入 JSON；显式 false 合法，不当作缺失处理。
- [ ] 增加预算反例构造器及断言，使用现有 config/context，开启 expressions 并给 amount 对应权限：

```ts
function tree(depth: number): AnalysisNumericExpression {
  return depth === 1
    ? { type: AggregationExpressionType.CONSTANT, value: 1 }
    : {
        type: AggregationExpressionType.BINARY,
        operator: AggregationExpressionOperator.ADD,
        left: tree(depth - 1),
        right: tree(depth - 1),
      };
}
// tree(8) 为 255 节点。单个通过，两个同请求被拒绝；
// 普通指标再加一个单节点为 256，通过；再加一个为 257，拒绝。
```

- [ ] 增加非数字 percentile（含空文本、0/100/Infinity）、同名根/明细字段隔离、扩展输出禁止操作符、false/缺失服务能力、非法 missingKey/dense 的参数化测试。运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/analysisCompiler.test.ts test/analysisAdmission.test.ts`，期望全部通过。

## Task 3：派生指标与稳定 ID 的结果筛选

**Files:** 修改 `packages/view-engine/src/analysis/analysisExpressions.ts`、`analysisCompiler.ts`、`analysisModel.ts`；新增 `packages/view-engine/src/analysis/analysisHaving.ts`；测试 `packages/view-engine/test/analysisCompiler.test.ts`。

**Interfaces:** 引用表值直接复用 `AggregationMetric`，避免缓存另一份可变 alias 信息。

```ts
export function compileAnalysisDerivedExpression(
  expression: DeepReadonly<AnalysisDerivedExpression>,
  metricsById: ReadonlyMap<string, AggregationMetric>,
  budget: AnalysisExpressionBudget,
): DerivedExpression;
export function compileAnalysisHaving(
  expression: DeepReadonly<AnalysisHavingExpression>,
  metricsById: ReadonlyMap<string, AggregationMetric>,
): HavingExpression;
```

- [ ] 在现有编译测试文件添加 COUNT 与派生指标，alias 变更后按 ID 解析：

```ts
it('resolves derived references by stable ID after alias changes', () => {
  const result = compileAnalysis(
    {
      ...config,
      metrics: [
        { ...config.metrics[0], alias: 'renamed_orders' },
        {
          id: 'copy',
          component: { name: 'derived' },
          alias: 'copy',
          title: '副本',
          props: {},
          derivedExpression: {
            type: DerivedExpressionType.METRIC_REF,
            metricId: 'count',
          },
        },
      ],
    },
    {
      ...context,
      capability: { ...context.capability, features: { derived: true } },
    },
  );
  expect(result.errors).toEqual([]);
  expect(result.plan?.query.metrics[1]).toEqual({
    type: AggregationMetricType.DERIVED,
    alias: 'copy',
    expression: {
      type: DerivedExpressionType.METRIC_REF,
      metric: 'renamed_orders',
    },
  });
});
```

- [ ] 跑 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/analysisCompiler.test.ts -t 'stable ID'`，确认失败。
- [ ] 顺序编译指标，在指标成功复验后才放入 Map。DERIVED 仅能看到前置 Map，ANY 命中也拒绝；派生输出使用 `aggregation.derived`，不得带 field、普通 expression 或 filters。扩展 DERIVED 的 wire alias 也必须检查前向/ANY 限制和独立 256 节点预算。
- [ ] 所有指标编译完成后编译 HAVING，要求 features.having 和至少一个分组。ID 转 alias 后移除 UI id/metricId；比较与枚举严格校验，IS_NULL negated 必须为 boolean；递归 AND/OR，深度 8、前端节点 256，集合不能为空，区间 lower <= upper。

```ts
const target = metricsById.get(node.metricId);
if (!target || target.type === AggregationMetricType.ANY) {
  throw new TypeError('结果筛选引用的指标已失效或不支持筛选');
}
// CONDITION 的输出：
const output = {
  type: HavingExpressionType.CONDITION,
  metric: target.alias,
  operator: node.operator,
  value: parsedValue,
};
```

- [ ] 增加派生链、自引用、前向引用、删除后复用 alias、ANY、维度 ID、双树预算测试；HAVING 增加 alias 改名、后置派生指标、无分组、空集合、反向区间和非法 boolean。断言全部为编译 errors 且没有 plan，不静默删除坏条件。
- [ ] 运行 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/analysisCompiler.test.ts` 及 `pnpm --filter @ahoo-wang/fetcher-view-engine test:type`。期望通过，更新技能引用中新的 wire 映射与预算语义。

## Task 4：结果语义、单位、格式与图表准入

**Files:** 修改 `packages/view-engine/src/analysis/analysisCompiler.ts`、`analysisResult.ts`、`analysisProjection.ts`、`analysisFormatting.ts`、`AnalysisResultSummary.tsx`、`AnalysisChart.tsx`；测试 `packages/view-engine/test/analysisResult.test.ts`、`analysisProjection.test.ts`、`analysisFormatting.test.ts`、`analysisCompiler.test.ts`。

**Interfaces:** 保持 `validateAnalysisResult(rows, plan)`、`projectAnalysis(plan, rows, presentation)`、`formatAnalysisValue(value, column, timeZone?)` 不变。`AnalysisResultColumn.aggregation` 扩展为 COUNT/ANY/DISTINCT_COUNT/PERCENTILE/DERIVED 与原 AggregationFunction 联合。

- [ ] 在 `analysisProjection.test.ts` 中复用 `column`、`plan`，追加可加性反例：

```ts
it('rejects distinct counts in pie even with count formatting', () => {
  const p = plan([
    column('channel', 'dimension', 'string'),
    {
      ...column('customers', 'metric'),
      aggregation: 'DISTINCT_COUNT',
      format: 'count',
    },
  ]);
  const result = projectAnalysis(
    p,
    [
      { channel: 'A', customers: 1 },
      { channel: 'B', customers: 1 },
    ],
    { layout: 'pie', columns: [] },
  );
  expect(result.issues.length).toBeGreaterThan(0);
});
```

- [ ] 跑 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/analysisProjection.test.ts -t 'distinct counts'`，期望失败。
- [ ] 堆叠/占比判断只接受聚合类型 SUM/COUNT，删除 format=count 的授权分支。COUNT 和 DISTINCT_COUNT 的整数准入按 aggregation 判定；显示格式不额外约束 DERIVED/PERCENTILE 只能整数。所有相关判断搜索覆盖：

```sh
rg -n "format === 'count'|aggregation === 'COUNT'|aggregation !== 'COUNT'" packages/view-engine/src/analysis
```

- [ ] COUNT/去重空桶接受 0、拒绝 null/负数/小数/非安全整数；其他数值指标允许 null，拒绝非有限响应。派生常量结果保留服务端值，不在前端重算。
- [ ] 编译 schema 的单位：STDDEV 沿用表达式单位，VARIANCE 为 `u·u`；去重无源字段单位；派生按引用指标及四则运算复用既有单位规则。不能推断时省略，不增加单位代数库。
- [ ] `props.displayFormat` 仅在 DERIVED 接受 number/percent：percent 要求无明确物理单位，输出 numberFormat `{ style: 'percent', maximumFractionDigits: 2 }`。普通派生不继承引用字段 numberFormat；VARIANCE 丢弃表示原单位的 currency/unit/percent 格式，保留合法精度设置。百分位/STDDEV 只在维持原单位时沿用源格式。
- [ ] 在格式与结果测试中断言 null 显示无值、0.25 百分比显示 25%、原始值不变、方差不显示原货币单位；补齐 DISTINCT_COUNT 的近似性说明和 P95 的近似统计说明。跑四个受影响测试文件，期望全部通过。

## Task 5：可操作的指标、公式与结果筛选编辑器

**Files:** 新增 `packages/view-engine/src/analysis/AnalysisMetricEditor.tsx`、`AnalysisDerivedExpressionEditor.tsx`、`AnalysisHavingEditor.tsx`；修改同目录 `AnalysisEditor.tsx`、`AnalysisExpressionEditor.tsx`、`analysisEditorLabels.ts`、`AnalysisResultSummary.tsx`。测试 `packages/view-engine/test/analysisEditor.test.tsx`、`analysisControls.test.tsx`；新增 `packages/view-engine/test/analysisHavingEditor.test.tsx`。

**Interfaces:** 新组件为内部模块，不增加公共 React 导出。`AnalysisMetricEditor` 接收单个组件及前置指标，完整回传单项配置；顶层页面拥有列表/顺序。递归编辑器接口固定如下：

```ts
interface AnalysisDerivedExpressionEditorProps {
  value: DeepReadonly<AnalysisDerivedExpression>;
  metrics: DeepReadonly<readonly AnalysisComponentConfig[]>;
  onChange(value: AnalysisDerivedExpression): void;
  label: string;
  disabled?: boolean;
  depth?: number;
}
interface AnalysisHavingEditorProps {
  value?: DeepReadonly<AnalysisHavingExpression>;
  metrics: DeepReadonly<readonly AnalysisComponentConfig[]>;
  onChange(value: AnalysisHavingExpression | undefined): void;
  disabled?: boolean;
  errors?: readonly FilterValidationError[];
}
// AnalysisMetricEditor 使用现有 AnalysisComponentEditorProps，增加
// previousMetrics: DeepReadonly<readonly AnalysisComponentConfig[]>。
```

- [ ] 先在新 `analysisHavingEditor.test.tsx` 写直接交互用例，补齐 React Testing Library 和 Vitest import/cleanup：

```tsx
it('keeps incomplete result-filter input as a draft', () => {
  const onChange = vi.fn();
  render(
    <AnalysisHavingEditor
      value={{
        id: 'h1',
        type: HavingExpressionType.CONDITION,
        metricId: 'count',
        operator: ComparisonOperator.GTE,
        value: 100,
      }}
      metrics={[
        {
          id: 'count',
          alias: 'orders',
          title: '订单数',
          component: { name: 'count' },
          props: {},
        },
      ]}
      onChange={onChange}
    />,
  );
  fireEvent.change(screen.getByLabelText('结果筛选 h1 数值'), {
    target: { value: '' },
  });
  expect(onChange).toHaveBeenLastCalledWith(
    expect.objectContaining({ value: '' }),
  );
});
```

- [ ] 跑 `pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run test/analysisHavingEditor.test.tsx`，确认新组件缺失导致失败。
- [ ] 先将现有指标选项从 AnalysisEditor 移到 AnalysisMetricEditor，保持卡片、扩展注册与 drag-and-drop 容器原位置；跑原 analysisEditor 测试保护行为。随后增加 distinct-count、percentile、derived 选项，不复制整套列表。
- [ ] 基础指标复用指标受限 context 的现有过滤编辑器；函数/字段/公式选择取决于当前指标 policy。P50/P95/P99 为设置 props.percentile 的快捷操作，仍提供文本输入。DERIVED 仅显示前置非 ANY 指标并保存 ID，数字/百分比选择写 props.displayFormat。
- [ ] 派生公式复用 Input/FilterSelect/运算符选项，递归使用明确的派生类型，不引入求值。HAVING 显示业务指标名、比较/区间/集合/空值、全部/任一条件；删除根节点传 undefined，新节点使用现有 ID 生成工具。保持空文本，不按逗号拆成隐式 0；IN 用独立值输入列表。
- [ ] 日期补桶、缺失桶键与结果筛选的跨项限制交给编译器持续验证；UI 显示失效原因及修复入口，不在卸载时吞掉错误。说明“明细范围统计的是明细记录”“缺失值与同名桶合并”“结果筛选可能移除空桶”。
- [ ] alias 保持当前 UI 稳定策略，本次不新增 alias 编辑入口；验证改标题不变 alias。程序化改 alias 后派生/HAVING 仍正确解析 ID，失效排序/展示绑定不能偷偷重绑；如果实现碰到已有可修改 alias 的入口，按 spec 在同一次 onChange 映射排序/展示引用。
- [ ] 扩展测试覆盖所有节点类型的编辑/删除、disabled、键盘选择、重排导致失效引用、关闭重开仍保留无效草稿；跑三个受影响测试文件及 `pnpm --filter @ahoo-wang/fetcher-view-engine test:type`，期望通过。

## Task 6：生命周期、Storybook 与公共文档验收

**Files:** 修改 `packages/view-engine/test/analysisEngine.test.ts`、`analysisViewFailure.test.tsx`、`analysisView.test.tsx`；修改 `stories/view-engine/Analysis.stories.tsx`、`Analysis.test.stories.tsx`、`AnalysisCharts.test.stories.tsx`；修改 `skills/fetcher-view-engine/references/api.md`、`wiki/reference/view-engine/models.md`、`components.md`、`symbols.md` 和相同的 `wiki/zh/reference/view-engine/` 文件。需要新增共享 story 数据时，仅在 `stories/view-engine/` 新增 `analysisAggregationFixture.ts`，提供固定输入/响应，不写前端聚合求值器。

**Interfaces:** `source.aggregate(query, options, controller)`、ViewEngine 保存/恢复与 AnalysisCommands 查询接口保持原样。fixture 的响应明确标注模拟数据，只用于前端契约与交互验收。

- [ ] 在现有 engine 测试 fixture 中添加派生/HAVING/指标过滤配置，复用现有保存、关闭、打开步骤，比较完整 config 和数据源收到的 query；不能只比较显示标题。新用例必须断言最终 query 的 having 使用 alias，保存的 config 使用 metricId。

```ts
it('persists metric IDs and executes aliases after reopening', async () => {
  let saved: AnalysisViewInstance = structuredClone(instance);
  saved.config = {
    ...config,
    dimensions: [
      {
        id: 'state',
        component: { name: 'terms' },
        field: 'state',
        alias: 'channel',
        title: '渠道',
        props: {},
      },
    ],
    metrics: [config.metrics[0]],
    having: {
      id: 'h1',
      type: HavingExpressionType.CONDITION,
      metricId: 'count',
      operator: ComparisonOperator.GTE,
      value: 1,
    },
  };
  const aggregate = vi.fn(async (_query: AggregationQuery) => [
    { channel: 'A', orders: 2 },
  ]);
  const makeEngine = () =>
    new ViewEngine({
      definitionId: definition.id,
      definition: {
        ...definition,
        analysis: { ...context.capability, features: { having: true } },
      },
      instances: { instances: [saved], defaultInstanceId: saved.id },
      host: {
        resolveSource: () => ({ aggregate }),
        instance: {
          save: async value => {
            if (value.kind !== 'analysis') throw new Error('expected analysis');
            saved = { ...value, revision: '2' };
            return saved;
          },
        },
        permission: {
          getInstance: () => ({
            save: true,
            saveAsPersonal: true,
            saveAsShared: false,
          }),
        },
      },
    });
  const engine = makeEngine();
  await engine.load();
  engine.analysis(saved.id).edit(value => ({ ...value, limit: 50 }));
  await engine.save(saved.id);
  engine.dispose();
  const reopened = makeEngine();
  await reopened.load();
  expect(reopened.getSnapshot().sessions[saved.id].instance.config).toEqual(
    saved.config,
  );
  const query = aggregate.mock.calls.at(-1)![0];
  expect(query.having).toMatchObject({ metric: 'orders' });
  expect(query.having).not.toHaveProperty('metricId');
  expect(saved.config.having).toMatchObject({ metricId: 'count' });
  reopened.dispose();
});
```

- [ ] 在现有 failure/取消用例中改变新草稿的派生格式和 HAVING，返回旧请求/让新请求失败：旧结果的 config/plan 必须保持旧格式与旧筛选，取消/替换后的结果不得发布。首次运行新增用例，确认确实覆盖新的配置字段而非仅重跑旧用例。
- [ ] Storybook 添加“渠道订单分析”完整故事：订单数、已支付数、客户去重、金额 P95、支付率、订单数 >=100 的结果筛选；能力开关显式设置。测试通过按钮/输入完成配置，断言 aggregate 请求及表格内容，不只截图。
- [ ] 在图表故事验证去重配 count 格式的饼图/堆叠禁用，普通柱状图可展示；null 和比例显示正确。窄屏 390px、键盘、禁用态按现有故事规范检查；不创建新的性能预算。
- [ ] 读取 wiki/AGENTS.md，文档写出新增配置类型、ID→alias 规则、服务能力开关、三个筛选位置、表达式预算、分桶限制、近似统计与格式/可加性区别。新符号对应 skills 引用与英文/中文同步，核对 index 导出，生成符号使用仓库现有流程。
- [ ] 运行以下最终检查，记录每条退出码和失败原因，不因构建通过而宣称部署可用：

```sh
pnpm --filter @ahoo-wang/fetcher-view-engine... build
pnpm --filter @ahoo-wang/fetcher-view-engine test
pnpm test:storybook stories/view-engine/Analysis.test.stories.tsx stories/view-engine/AnalysisCharts.test.stories.tsx
pnpm lint:view-engine
pnpm --dir wiki build
pnpm test:unit
git diff --check
```

- [ ] 最后重新核对五项对抗性问题，每项报告对应测试及结果；确认没有新增依赖、构建修改或无关 API 重构。对当前改动文件做 Prettier 定向检查，不运行全仓写入格式化。
- [ ] 如果需要提交，只有上述提交前检查全部通过才能创建 conventional commit；本计划不默认授权 push、PR 合并或部署。未配置真实 Mongo/ES 服务则明确写“后端运行验证未执行”，保留源码对齐与前端测试结论的边界。

## 自审覆盖表

| 设计要求/对抗性发现                    | 实施与验收      |
| -------------------------------------- | --------------- |
| 新能力显式开启、明细继承、安全结构准入 | Task 1、2       |
| 字符串去重不能借用数值权限             | Task 2          |
| 指标过滤专属作用域、扩展输出复验       | Task 2          |
| 整请求普通/派生预算、HAVING 前端预算   | Task 2、3       |
| 稳定 ID、禁止同 alias 重绑             | Task 3、5、6    |
| count 格式不代表可加、空值与单位       | Task 4、6       |
| dense/missingKey、HAVING 顺序与说明    | Task 2、3、5、6 |
| 可访问交互、草稿保留、失败旧结果       | Task 5、6       |
| 公共契约、技能、双语文档、全仓检查     | Task 1、3、6    |

计划仅新增有实际职责的内部模块；没有新数据源协议、公式执行引擎、自动拓扑排序或跨仓接口迁移。实施时发现协议证据与本文不一致，应先修正假设并说明影响，不用兼容补丁绕过。

## 执行结果（2026-09-13）

六项任务已实施。上面的步骤保留为原计划；实际验证记录如下：

- 配置/能力、共享编译、稳定引用、指标筛选、结果语义及编辑器均已接入；未增加项目依赖或修改构建配置。
- 独立只读审查发现并修复两项问题：仅 TERMS 的数值编号不能用于去重算术；HAVING 子节点错误保留真实节点 ID 并行内显示。修复反例先失败，再通过，复核确认有效。
- 受影响包及依赖构建通过；`pnpm test:unit` 全仓通过。view-engine 普通与 React 编译模式各 1,725 项通过、3 项跳过；类型和扩展契约检查通过。覆盖率：语句 95.41%、分支 91.47%、函数 97.21%、行 97.29%。
- Chromium Storybook 分析/图表回归 5 项通过；390px 实际浏览器发现弹层越界，修正为按可用高度滚动后验证无横向溢出、完成按钮可达；随后相关 React 编译模式交互 51 项及浏览器 5 项再次通过。
- `pnpm lint:view-engine`、双语 wiki 构建、11 项文档一致性测试、定向格式及 diff 检查通过。符号索引和 llms 由仓库脚本生成。
- Chromium 默认缓存为 root 所有，测试运行时安装在 `/tmp/fetcher-analysis-browsers`；浏览器命令使用 `PLAYWRIGHT_BROWSERS_PATH=/tmp/fetcher-analysis-browsers`。没有更改系统缓存权限。
- 真实 Mongo/ES 服务验证未执行；Storybook 固定响应明确标注为模拟，统计协议以本地 Wow `fd1b3cd46` 源码为依据。
- 上述开发验证在未提交工作区完成；后续按用户授权创建 PR，部署和合并不在本次范围内。
