# View Engine 行为锁定结构优化实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在行为零变更约束下完成 view-engine 的质量护栏、分层修正、写路径分解、AnalysisEditor 拆分与增量类型导出。

**Architecture:** 纯重构：先立护栏（coverage thresholds + 类型检查 lint），再做纯文件移动（分层），再分解 `ViewPersistence.write`/`ViewReload.reloadInstance` 两个巨型方法并去重失败恢复，最后按编辑域拆分 `AnalysisEditor.tsx` 并导出命令命名类型。每任务独立提交，既有 158 个测试文件是行为规格。

**Tech Stack:** TypeScript 6 / Vitest 4 + v8 coverage / ESLint typescript-eslint / pnpm workspace / React 19（仅 Stage D 触及 tsx）。

**Spec:** `docs/superpowers/specs/2026-09-12-view-engine-structural-refactor-design.md`（行号锚定基线 `891f441a`；本计划在分支 `refactor/view-engine-structure` 上执行）。

## Global Constraints

- 行为与公共 API 零变更，纯增量除外；**不修改任何既有测试断言**。
- 每任务结束必须绿：`pnpm --filter @ahoo-wang/fetcher-view-engine exec vitest run --coverage.enabled=false`（下称"包测试"）；涉及构建产物的任务加跑 `pnpm --filter @ahoo-wang/fetcher-view-engine test:type`。
- 全部完成后根 `pnpm test:unit` 必须通过（Task 15）。
- 不引入状态机/流程框架；不以减少行数为目标（行数上限仅验收参照）。
- 不修改根 `tsconfig.json`、根构建配置；包级 `vitest.config.ts`/`eslint.config.js` 仅按本计划修改。
- 环境预检（执行前一次性）：`pnpm install && pnpm --filter @ahoo-wang/fetcher-view-engine... build`。本机曾因 node_modules 缺 `recharts`、dist 过期出现 8 个假失败；重建后基线全绿（158 文件 / 1427 通过 / 2 跳过）。
- coverage 基线（已实测）：Statements 96.21%、Branches 91.71%、Functions 97.23%、Lines 97.97%。
- 提交信息用 conventional commits，前缀 `refactor(view-engine):` / `test(view-engine):` / `feat(view-engine):`（Task 14 为纯增量 API）。

---

### Task 1: coverage thresholds 护栏

**Files:**
- Modify: `packages/view-engine/vitest.config.ts`（coverage 段，现仅 `include: ['src/**/*.{ts,tsx}']`）

**Interfaces:**
- Consumes: 无
- Produces: thresholds 常驻生效；后续所有任务的 `vitest run --coverage` 都受其约束

- [ ] **Step 1: 写入 thresholds**

将 `vitest.config.ts` 的 coverage 段改为（数字 = 实测基线取整，行/语句留 -1% 容差，规格 §3.1）：

```ts
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      thresholds: {
        statements: 95,
        branches: 91,
        functions: 97,
        lines: 96,
      },
    },
```

- [ ] **Step 2: 验证 thresholds 生效且不红**

Run: `cd packages/view-engine && npx vitest run --coverage --coverage.reporter=text-summary 2>&1 | tail -8`
Expected: `Test Files 158 passed (158)`，四个覆盖率数字均 ≥ 阈值，无 `ERROR: Coverage for … does not meet threshold`。

- [ ] **Step 3: Commit**

```bash
git add packages/view-engine/vitest.config.ts
git commit -m "test(view-engine): enforce coverage thresholds at measured baseline"
```

---

### Task 2: eslint 类型检查收紧（src 域）

**Files:**
- Modify: `packages/view-engine/eslint.config.js`

**Interfaces:**
- Consumes: 无
- Produces: `src/**` 永久受 strictTypeChecked 约束；test/ 不在 tsconfig 项目内，保持 recommended（不加测试 tsconfig，避免动构建配置）

- [ ] **Step 1: 启用 strictTypeChecked（仅 src 块）**

在 `tseslint.config(` 内、现有通配块之后追加一个更高优先级的 src 专属块（flat config 后者覆盖前者），并把现有块拆为两段：

```js
export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**'] },
  {
    // test/、dev/、examples/ 不在 tsconfig 项目内，保持非类型检查规则。
    files: ['test/**/*.{ts,tsx}', 'dev/**/*.{ts,tsx}', 'examples/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    ...reactLintConfig,
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    rules: {
      ...reactLintConfig.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [js.configs.recommended, ...tseslint.configs.strictTypeChecked],
    ...reactLintConfig,
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        projectService: true,
        tsconfigRootDir: fileURLToPath(new URL('.', import.meta.url)),
      },
    },
    rules: {
      ...reactLintConfig.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
);
```

- [ ] **Step 2: 统计发现项并按规格决策**

Run: `cd packages/view-engine && npx eslint src --max-warnings 0 2>&1 | tail -3`
- 若问题数 **≤ 50**：逐条就地修复（行为中性）或对该行精确 `// eslint-disable-next-line <rule>` 并附一句原因；**禁止文件级 disable**。
- 若问题数 **> 50**：将 src 块的 `strictTypeChecked` 降级为 `recommendedTypeChecked`，并在 rules 中追加：

```js
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
```

- [ ] **Step 3: 验证**

Run: `pnpm --filter @ahoo-wang/fetcher-view-engine lint:check && cd packages/view-engine && npx vitest run --coverage.enabled=false 2>&1 | tail -3`
Expected: lint 0 error；包测试全绿（158 通过）。

- [ ] **Step 4: Commit**

```bash
git add packages/view-engine/eslint.config.js packages/view-engine/src
git commit -m "refactor(view-engine): enable type-aware lint for src"
```

---

### Task 3: viewServiceContract 归位 contracts/

**Files:**
- Move: `packages/view-engine/src/record/viewServiceContract.ts` → `packages/view-engine/src/contracts/viewServiceContract.ts`
- Modify（import 路径）: `src/index.ts`、`src/contracts/ViewHost.ts`、`src/engine/{ViewEngine,InstanceWork,ViewPersistence}.ts`、`src/record/{StatefulViewHost,IndexedDBViewHost,MemoryViewHost}.ts`、`src/record/validation/{instanceValidation,definitionValidation}.ts`

**Interfaces:**
- Consumes: 无
- Produces: 公共导出面不变（`src/index.ts:68,74` 的 re-export 名单不动，仅路径改 `./contracts/viewServiceContract.js`）

- [ ] **Step 1: 移动并更新 import**

```bash
git mv packages/view-engine/src/record/viewServiceContract.ts packages/view-engine/src/contracts/viewServiceContract.ts
```

按引用方位置替换路径（共 11 处文件，用 `grep -rn "viewServiceContract" packages/view-engine/src --include='*.ts*'` 复核无遗漏）：

| 原写法（所在文件） | 改为 |
| --- | --- |
| `./viewServiceContract.js`（record/ 三个 host、StatefulViewHost） | `../contracts/viewServiceContract.js` |
| `../viewServiceContract.js`（record/validation/ 两个文件） | `../../contracts/viewServiceContract.js` |
| `../record/viewServiceContract.js`（contracts/ViewHost.ts、engine/ 三文件） | `./viewServiceContract.js`（ViewHost.ts）或 `../contracts/viewServiceContract.js`（engine/） |
| `./record/viewServiceContract.js`（src/index.ts 两处） | `./contracts/viewServiceContract.js` |

- [ ] **Step 2: 验证**

Run: `pnpm --filter @ahoo-wang/fetcher-view-engine test:type && cd packages/view-engine && npx vitest run --coverage.enabled=false test/architecture.test.ts 2>&1 | tail -3 && npx vitest run --coverage.enabled=false 2>&1 | tail -3`
Expected: 类型检查通过；架构测试（入口闭包/无环）通过；包测试全绿。

- [ ] **Step 3: Commit**

```bash
git add packages/view-engine/src
git commit -m "refactor(view-engine): move viewServiceContract to contracts layer"
```

---

### Task 4: runtimeLimits 下沉 lib/（解除 contracts→engine 倒置）

**Files:**
- Move: `packages/view-engine/src/engine/runtimeLimits.ts` → `packages/view-engine/src/lib/runtimeLimits.ts`
- Modify（import 路径）: `src/contracts/viewModel.ts`、`src/engine/{SessionStore,ViewEngine,ViewLoader,ViewReload,ViewManagement,ViewPersistence,sessionValidation}.ts`、`src/record/engine/{RecordQueries,RecordSummaries}.ts`、`src/analysis/AnalysisCommands.ts`、`test/runtimeLimits.test.ts`、`test/engine/runtimeBudget.test.ts`

**Interfaces:**
- Consumes: 无
- Produces: `contracts/viewModel.ts` 不再 import `engine/*`（倒置清零，规格 §8 验收项）

- [ ] **Step 1: 移动并更新 import**

```bash
git mv packages/view-engine/src/engine/runtimeLimits.ts packages/view-engine/src/lib/runtimeLimits.ts
```

替换规则（用 `grep -rn "runtimeLimits" packages/view-engine/src packages/view-engine/test --include='*.ts*'` 复核）：

| 原写法（所在位置） | 改为 |
| --- | --- |
| `./runtimeLimits.js`（engine/ 各文件、sessionValidation.ts） | `../lib/runtimeLimits.js` |
| `../engine/runtimeLimits.js`（contracts/viewModel.ts、analysis/AnalysisCommands.ts） | `../lib/runtimeLimits.js` |
| `../../engine/runtimeLimits.js`（record/engine/ 两文件） | `../../lib/runtimeLimits.js` |
| `../engine/runtimeLimits.js` 或 `../../engine/runtimeLimits.js`（两个测试文件，按其目录层级） | 对应 `../|../../lib/runtimeLimits.js` |

- [ ] **Step 2: 验证倒置清零**

Run: `grep -rn "from '.*engine/" packages/view-engine/src/contracts/ ; pnpm --filter @ahoo-wang/fetcher-view-engine test:type && cd packages/view-engine && npx vitest run --coverage.enabled=false test/architecture.test.ts test/runtimeLimits.test.ts test/engine/runtimeBudget.test.ts 2>&1 | tail -3`
Expected: grep 无输出（contracts 下无 engine 导入）；类型与三个测试文件全绿。

- [ ] **Step 3: Commit**

```bash
git add packages/view-engine/src packages/view-engine/test
git commit -m "refactor(view-engine): move runtimeLimits to lib, fix contracts inversion"
```

---

### Task 5: sessionValidation 更名消除双门面混淆

**Files:**
- Move: `packages/view-engine/src/engine/sessionValidation.ts` → `packages/view-engine/src/engine/sessionValidationCache.ts`
- Modify: 所有 `./sessionValidation.js` 引用（先 `grep -rn "sessionValidation" packages/view-engine/src` 确认清单；已知 `src/engine/sessionState.ts:15`）

**Interfaces:**
- Consumes: Task 4 的路径状态
- Produces: 导出名不变（`compileSessionFilter`/`configSizeIssues`），仅文件名变化；公共 API 不含该文件

- [ ] **Step 1: 更名并更新引用**

```bash
git mv packages/view-engine/src/engine/sessionValidation.ts packages/view-engine/src/engine/sessionValidationCache.ts
# 将 grep 到的每处 import 路径 ./sessionValidation.js 改为 ./sessionValidationCache.js
```

- [ ] **Step 2: 验证**

Run: `pnpm --filter @ahoo-wang/fetcher-view-engine test:type && cd packages/view-engine && npx vitest run --coverage.enabled=false 2>&1 | tail -3`
Expected: 全绿。

- [ ] **Step 3: Commit**

```bash
git add packages/view-engine/src
git commit -m "refactor(view-engine): rename sessionValidation to sessionValidationCache"
```

---

### Task 6: baselinePatch 帮助函数（TDD）

**Files:**
- Modify: `packages/view-engine/src/engine/sessionState.ts`（新增导出）
- Modify: `packages/view-engine/src/engine/ViewPersistence.ts:288-298`、`packages/view-engine/src/engine/ViewManagement.ts:99-109`
- Test: `packages/view-engine/test/engine/baselinePatch.test.ts`（新建）

**Interfaces:**
- Consumes: `withContent`（sessionState.ts 现有三重载，同文件）
- Produces: `baselinePatch(baseline: ViewInstance, local: DeepReadonly<ViewInstance>): RecordBaselinePatch | AnalysisBaselinePatch`——返回类型是**判别联合**（展开进 `store.patch` 时按分支分发，匹配 `SessionStore` 的 `RecordSessionPatch | AnalysisSessionPatch`）

- [ ] **Step 1: 写失败测试**

创建 `test/engine/baselinePatch.test.ts`（复用 `test/engine/fixtures.ts` 的 `instance()` 工厂，analysis 实例由其派生）：

```ts
import { describe, expect, it } from 'vitest';
import { baselinePatch, withContent } from '../../src/engine/sessionState.js';
import { instance } from './fixtures.js';

describe('baselinePatch', () => {
  it('returns a record-discriminated patch carrying baseline and merged content', () => {
    const baseline = instance('mine');
    const local = { ...baseline, title: '本地标题' };
    const patch = baselinePatch(baseline, local);
    expect(patch).toEqual({
      kind: 'record',
      baseline,
      instance: withContent(baseline, local),
    });
    expect(patch.kind).toBe('record');
  });

  it('returns an analysis-discriminated patch for analysis instances', () => {
    const record = instance('agg');
    const baseline = {
      ...record,
      kind: 'analysis' as const,
      config: {
        filters: record.config.filters,
        dimensions: [],
        metrics: [],
        sort: [],
        limit: 100,
        presentation: { layout: 'table' as const, columns: [] },
      },
    };
    const patch = baselinePatch(baseline, baseline);
    expect(patch.kind).toBe('analysis');
    expect(patch.baseline).toBe(baseline);
  });
});
```

- [ ] **Step 2: 确认 RED**

Run: `cd packages/view-engine && npx vitest run --coverage.enabled=false test/engine/baselinePatch.test.ts 2>&1 | tail -5`
Expected: FAIL——`baselinePatch` 未从 sessionState.js 导出。

- [ ] **Step 3: 实现（sessionState.ts，紧随 withContent 之后）**

```ts
/** A persisted result replaces the baseline; the discriminated union keeps store.patch narrowing. */
export function baselinePatch(
  baseline: DeepReadonly<RecordViewInstance> | RecordViewInstance,
  local: DeepReadonly<ViewInstance>,
): {
  kind: 'record';
  baseline: DeepReadonly<RecordViewInstance>;
  instance: DeepReadonly<RecordViewInstance>;
};
export function baselinePatch(
  baseline: DeepReadonly<AnalysisViewInstance> | AnalysisViewInstance,
  local: DeepReadonly<ViewInstance>,
): {
  kind: 'analysis';
  baseline: DeepReadonly<AnalysisViewInstance>;
  instance: DeepReadonly<AnalysisViewInstance>;
};
export function baselinePatch(
  baseline: DeepReadonly<ViewInstance>,
  local: DeepReadonly<ViewInstance>,
):
  | {
      kind: 'record';
      baseline: DeepReadonly<RecordViewInstance>;
      instance: DeepReadonly<RecordViewInstance>;
    }
  | {
      kind: 'analysis';
      baseline: DeepReadonly<AnalysisViewInstance>;
      instance: DeepReadonly<AnalysisViewInstance>;
    } {
  if (baseline.kind === 'record')
    return { kind: 'record', baseline, instance: withContent(baseline, local) };
  return {
    kind: 'analysis',
    baseline,
    instance: withContent(baseline, local),
  };
}
```

- [ ] **Step 4: 确认 GREEN，替换两处调用点**

Run: `npx vitest run --coverage.enabled=false test/engine/baselinePatch.test.ts 2>&1 | tail -3` → PASS。

调用点 1 — `ViewPersistence.ts`（原 285-303 的 else 分支）：

```ts
      } else
        this.work.finishWrite(id, token, () =>
          this.store.patch(id, {
            ...baselinePatch(saved, latest.instance),
            conflict: undefined,
            writeStatus: 'idle',
            writeError: null,
          }),
        );
```

调用点 2 — `ViewManagement.ts`（原 97-113，`local` 定义保持不变）：

```ts
      this.work.finishWrite(id, token, () =>
        this.store.patch(id, {
          ...baselinePatch(baseline, local),
          writeStatus: 'idle',
          writeError: null,
        }),
      );
```

两文件顶部 import 增加 `baselinePatch`（sessionState.js 的既有 import 语句内追加）。

- [ ] **Step 5: 回归并提交**

Run: `npx vitest run --coverage.enabled=false 2>&1 | tail -3`
Expected: 158 文件全绿。

```bash
git add packages/view-engine/src packages/view-engine/test
git commit -m "refactor(view-engine): extract baselinePatch session helper"
```

---

### Task 7: reconcileWriteFailure 统一失败恢复（TDD）

**Files:**
- Create: `packages/view-engine/src/engine/writeRecovery.ts`
- Modify: `ViewPersistence.ts`（catch，304-323）、`ViewManagement.ts`（rename catch 114-125、delete catch 325-338）、`ViewReload.ts`（catch 318-327）
- Test: `packages/view-engine/test/engine/writeRecovery.test.ts`（新建）

**Interfaces:**
- Consumes: `message()`（lib/snapshot.js）、`SessionStore.patch`、`InstanceWork.finishWrite/finishReload`
- Produces:

```ts
export function reconcileWriteFailure(
  error: unknown,
  options: {
    finish: (onSettled: () => void) => void;
    patch: () => void;
    beforePatch?: () => void;
  },
): never;
```

语义锚点：`beforePatch` 先于 `finish` 执行；`patch` 在 `finish` 的 onSettled 回调内执行；最后 `throw error`（`never`）。**货币守卫不进本函数**——四处守卫语义不同（write 的"作用域过期吞掉/令牌被替换则重抛"三态、rename/delete 的 `current()`、reload 的 `started &&` 变体），逐字保留在各调用点。

- [ ] **Step 1: 写失败测试**

创建 `test/engine/writeRecovery.test.ts`：

```ts
import { describe, expect, it, vi } from 'vitest';
import { reconcileWriteFailure } from '../../src/engine/writeRecovery.js';

describe('reconcileWriteFailure', () => {
  it('runs beforePatch, then patch inside finish, then rethrows the original error', () => {
    const order: string[] = [];
    const error = new Error('写入失败');
    expect(() =>
      reconcileWriteFailure(error, {
        finish: onSettled => {
          order.push('finish');
          onSettled();
        },
        patch: () => order.push('patch'),
        beforePatch: () => order.push('beforePatch'),
      }),
    ).toThrow(error);
    expect(order).toEqual(['beforePatch', 'finish', 'patch']);
  });

  it('works without beforePatch and always rethrows', () => {
    const finish = vi.fn(onSettled => onSettled());
    expect(() =>
      reconcileWriteFailure('boom', {
        finish,
        patch: () => {},
      }),
    ).toThrow('boom');
    expect(finish).toHaveBeenCalledOnce();
  });
});
```

注：被测签名 `finish: (onSettled: () => void) => void` 的 onSettled 即 `InstanceWork.finishWrite/finishReload` 的第三个 publish 参数；调用点的 `finish` 写作 `onSettled => this.work.finishWrite(id, token, onSettled)`。

- [ ] **Step 2: 确认 RED**

Run: `npx vitest run --coverage.enabled=false test/engine/writeRecovery.test.ts 2>&1 | tail -5`
Expected: FAIL——模块不存在。

- [ ] **Step 3: 实现 writeRecovery.ts**

```ts
import { message } from '../lib/snapshot.js';
import type { SessionStore } from './SessionStore.js';

/**
 * Shared write-failure landing: optional pre-action, finish the operation with
 * the failure patch, then rethrow. Callers keep their own currency guards and
 * compute `patch` from their own flags — only the ordering contract lives here.
 */
export function reconcileWriteFailure(
  error: unknown,
  options: {
    finish: (onSettled: () => void) => void;
    patch: () => void;
    beforePatch?: () => void;
  },
): never {
  options.beforePatch?.();
  options.finish(options.patch);
  throw error;
}

/** Convenience builder: patch body is `{ writeStatus idle, writeError, requiresReload? }`. */
export function writeFailurePatch(
  store: SessionStore,
  id: string,
  error: unknown,
  requiresReload: boolean,
): () => void {
  return () =>
    store.patch(id, {
      writeStatus: 'idle',
      writeError: message(error),
      ...(requiresReload ? { requiresReload: true } : {}),
    });
}
```

- [ ] **Step 4: 确认 GREEN 后替换四处 catch**

`ViewPersistence.ts` catch（原 304-323，**守卫逐字保留**）：

```ts
    } catch (error) {
      if (
        !this.scope.current(lifecycle) ||
        (this.work.writeToken(id) && this.work.writeToken(id) !== token)
      ) {
        if (this.scope.current(lifecycle)) throw error;
        return;
      }
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishWrite(id, token, onSettled),
        patch: writeFailurePatch(
          this.store,
          id,
          error,
          received ||
            Boolean(this.work.unverifiedCreate(id)) ||
            (dispatched && hasUnknownWriteOutcome(error)),
        ),
      });
    } finally {
```

（原 `throw error;` 由 helper 的 `never` 承接；`finally { this.work.finishWrite(id, token); }` 原样保留。）

`ViewManagement.renameInstance` catch（原 114-125）：

```ts
    } catch (error) {
      if (!current()) return;
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishWrite(id, token, onSettled),
        patch: writeFailurePatch(
          this.store,
          id,
          error,
          received || (dispatched && hasUnknownWriteOutcome(error)),
        ),
      });
    } finally {
```

`ViewManagement.deleteInstance` catch（原 325-338，`beforePatch` 承载 `markDeleteUnverified`）：

```ts
    } catch (error) {
      if (!current()) return;
      const unknownOutcome = dispatched && hasUnknownWriteOutcome(error);
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishWrite(id, token, onSettled),
        beforePatch: unknownOutcome
          ? () => this.work.markDeleteUnverified(id, session.baseline.revision)
          : undefined,
        patch: writeFailurePatch(this.store, id, error, unknownOutcome),
      });
    } finally {
```

`ViewReload.reloadInstance` catch（原 318-327，patch 仅 writeError）：

```ts
    } catch (error) {
      if (
        !this.scope.current(lifecycle) ||
        (started && this.work.reloadToken(id) !== controller)
      )
        return;
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishReload(id, controller, onSettled),
        patch: () => this.store.patch(id, { writeError: message(error) }),
      });
    } finally {
```

四个文件 import 增加 `reconcileWriteFailure`（`./writeRecovery.js`），`ViewPersistence`/`ViewManagement` 另加 `writeFailurePatch`；`message` 若不再被该文件其他位置使用则从既有 import 中移除（grep 确认后决定）。

- [ ] **Step 5: 回归并提交**

Run: `npx vitest run --coverage.enabled=false test/engine/writeRecovery.test.ts test/engine/writeRecovery.test.ts 2>/dev/null | tail -3; npx vitest run --coverage.enabled=false 2>&1 | tail -3`
Expected: 新测试 PASS；包测试全绿。

```bash
git add packages/view-engine/src packages/view-engine/test
git commit -m "refactor(view-engine): unify write failure reconciliation"
```

---

### Task 8: 分解 ViewPersistence.write（编排 ≤60 行）

**Files:**
- Modify: `packages/view-engine/src/engine/ViewPersistence.ts`

**Interfaces:**
- Consumes: Task 6/7 的 `baselinePatch`/`reconcileWriteFailure`
- Produces: 私有方法（不加导出）：`prepareWrite`、`dispatchWrite`、`reconcileCreate`、`reconcileSave`；模块级哨兵 `const WRITE_ABORT = Symbol()`；公共 `save/overwriteInstance/saveAs` 签名不变

**基线行号 → 目标方法映射（逐字搬运，仅以下粘合点新写）：**

| 基线行 | 去向 |
| --- | --- |
| 72-83（session 解析、flags、current 闭包） | 留在 `write()` 编排 |
| 85-125（validation/assertWritable/review/权限/scope/submitted 构建/validateViewInstance/knownIds） | `prepareWrite` → 返回 `{ submitted, knownIds }` |
| 126-132（beginWrite、状态 patch、`if (!current()) return;`、二次 assertConflictReview） | `dispatchWrite` 内 |
| 134-199（create/save 两条 withDeadline 分发 + UNKNOWN_OUTCOME + 失败 finishCreate 分支） | `dispatchWrite` → 返回 `ViewInstance` |
| 200-201（`if (!current()) return; received = true;`） | 留在编排（`received` 是编排层 flag） |
| 202-284（create 对账：receipt/ID/契约校验、选区迁移、isDeleted 短路、publish） | `reconcileCreate` → 返回 `string \| typeof WRITE_ABORT`（正常返回 createdId） |
| 285-303（save 对账：Task 6 已改写为 baselinePatch 版本） | `reconcileSave` |
| 304-327（catch/finally/return createdId） | 留在编排（Task 7 已改写 catch） |

- [ ] **Step 1: 按映射搬运并新写编排体**

`write()` 编排体（完整新代码；`prepareWrite`/`dispatchWrite`/`reconcileCreate`/`reconcileSave` 作为同类私有方法， bodies 来自上表行段的逐字搬运，仅把 `options`/`review`/`current`/`lifecycle`/`token`/`id` 通过参数与 `ctx` 传入）：

```ts
  private async write(
    options: { title: string; scope: SaveAsScope } | undefined,
    id?: string,
    review?: ViewInstanceConflict,
  ): Promise<string | undefined> {
    const session = this.store.session(id);
    id = session.instance.id;
    const lifecycle = this.scope.version;
    const token = Symbol();
    const selection = this.scope.selection;
    let received = false;
    let dispatched = false;
    const current = () =>
      this.scope.current(lifecycle) && this.work.writeToken(id) === token;
    const ctx = {
      id: () => id,
      lifecycle,
      token,
      current,
      selection: () => selection,
      dispatched: () => dispatched,
      setDispatched: () => {
        dispatched = true;
      },
    } as const;
    try {
      const prepared = this.prepareWrite(session, options, review);
      const result = await this.dispatchWrite(prepared, options, ctx);
      if (!current()) return;
      received = true;
      if (options) {
        const outcome = this.reconcileCreate(prepared, result, ctx);
        if (outcome === WRITE_ABORT) return;
        return outcome;
      }
      this.reconcileSave(result, ctx);
    } catch (error) {
      if (
        !this.scope.current(lifecycle) ||
        (this.work.writeToken(id) && this.work.writeToken(id) !== token)
      ) {
        if (this.scope.current(lifecycle)) throw error;
        return;
      }
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishWrite(id, token, onSettled),
        patch: writeFailurePatch(
          this.store,
          id,
          error,
          received ||
            Boolean(this.work.unverifiedCreate(id)) ||
            (dispatched && hasUnknownWriteOutcome(error)),
        ),
      });
    } finally {
      this.work.finishWrite(id, token);
    }
  }
```

（catch 块 = Task 7 Step 4 中 ViewPersistence catch 的最终版本，逐字保留于此。）

粘合规则：
- 模块级 `const WRITE_ABORT = Symbol();`（与 Task 9 的 `RELOAD_ABORT` 同模式，各自文件独立声明）。
- `dispatchWrite` 内原 156 行起的 `dispatched = true` 改为 `ctx.setDispatched()`；其余逐字。
- `reconcileCreate` 内原 218 行 `createdId = saved.id;` 变为局部 `const createdId = saved.id;`；原 234/236/240-242 的早退 `return` 改为 `return WRITE_ABORT`；方法末尾 `return createdId;`。原 253-262 的 isDeleted 分支返回 `WRITE_ABORT`。
- `reconcileSave(result, ctx)`：`latest` 取 `this.store.session(ctx.id())`，其余逐字（含 Task 6 的 `baselinePatch` 版本）。
- 原编排中 `createdId` 变量删除（由 reconcileCreate 返回值承载）。

- [ ] **Step 2: 回归**

Run: `npx vitest run --coverage.enabled=false test/engine/ 2>&1 | tail -3 && npx vitest run --coverage.enabled=false 2>&1 | tail -3`
Expected: engine 目录与全量全绿；`wc -l` 确认 `write` 方法 ≤60 行（`awk '/private async write/,/^  }$/' src/engine/ViewPersistence.ts | wc -l`）。

- [ ] **Step 3: Commit**

```bash
git add packages/view-engine/src/engine/ViewPersistence.ts
git commit -m "refactor(view-engine): decompose ViewPersistence.write into phases"
```

---

### Task 9: 分解 ViewReload.reloadInstance（编排 ≤60 行）

**Files:**
- Modify: `packages/view-engine/src/engine/ViewReload.ts`

**Interfaces:**
- Consumes: Task 7 的失败恢复
- Produces: 私有方法 `beginReloadGate`、`fetchReloadResult`、`validateReloadResult`、`reconcileUnverifiedCreate`、`reconcileReloadedInstance`；模块级哨兵 `const RELOAD_ABORT = Symbol()`；`canReloadInstance`/`useRemoteInstance` 不变

**要点：**

- 编排层新写货币闭包并对齐九处内联检查（语义相同者才收敛，规格 §5.2）：

```ts
    const stale = () =>
      !this.scope.current(lifecycle) ||
      this.work.reloadToken(id) !== controller;
```

基线 120、122-126、139-142、177-181、197-201、222-226 六处的 `!this.scope.current(lifecycle) || this.work.reloadToken(id) !== controller` 改为 `stale()`；**catch 守卫（318-323 的 `started &&` 变体）不收敛**，Task 7 版本原样保留。

**基线行号 → 目标方法映射：**

| 基线行 | 去向 |
| --- | --- |
| 97-105（session/lifecycle/controller/flags/selection） | 留在编排 |
| 107-126（unverified/existingBaseline/canReload/writeToken 冲突/beginReload/previous.abort/stale/queries.cancel） | `beginReloadGate` → 返回 `{ unverified, existingBaseline }` |
| 127-196（list 查找 / create 原请求重放 / 直接 load） | `fetchReloadResult` → 返回 `ViewInstance` |
| 197-201（stale 检查留编排体；validateViewInstance/kind 断言/copy/clearDelete） | `validateReloadResult`（202-211 逐字）→ 返回 `ViewInstance`（baseline） |
| 213-302（selectCopy 双查、rebase-or-inherit、pendingCreates 摘除、publish） | `reconcileUnverifiedCreate` → `string \| typeof RELOAD_ABORT`（返回 queryId 供编排触发 followUp） |
| 303-317（followUp + rebaseSession patch） | `reconcileReloadedInstance` → 返回 followUp |
| 318-331（catch（Task 7 版）/finally/`void followUp?.()`） | 留在编排（followUp 尾触发原时序：成功路径尾部、finally 之后） |

- [ ] **Step 1: 按映射搬运并新写编排体**

`reloadInstance()` 编排体（完整新代码；`stale` 必须先于 `ctx` 定义为捕获 `this` 的箭头函数，`followUp` 必须声明在 try 之外——原基线 331 行的触发点在 finally 之后，移入 try/finally 即改变时序，规格 §5.2 明令禁止）：

```ts
  async reloadInstance(id?: string): Promise<void> {
    const session = this.store.sessionForReload(id);
    id = session.instance.id;
    const lifecycle = this.scope.version;
    const definition = this.store.definition();
    const controller = new AbortController();
    let started = false;
    let queryId = id;
    let followUp: (() => Promise<void>) | undefined;
    const selection = this.scope.selection;
    const stale = () =>
      !this.scope.current(lifecycle) ||
      this.work.reloadToken(id) !== controller;
    const ctx = {
      id,
      lifecycle,
      controller,
      definition,
      selection,
      stale,
      markStarted: () => {
        started = true;
      },
      setQueryId: (next: string) => {
        queryId = next;
      },
      createFollowUp: () => this.queries.followUp(queryId, true),
    } as const;
    try {
      const gate = this.beginReloadGate(ctx);
      if (gate === RELOAD_ABORT) return;
      const baseline = this.validateReloadResult(
        await this.fetchReloadResult(gate, session, ctx),
        session,
        gate.unverified,
      );
      if (stale()) return;
      if (gate.unverified) {
        const outcome = this.reconcileUnverifiedCreate(
          gate,
          baseline,
          session,
          ctx,
        );
        if (outcome === RELOAD_ABORT) return;
        followUp = outcome;
      } else {
        followUp = this.reconcileReloadedInstance(baseline, ctx);
      }
    } catch (error) {
      if (
        !this.scope.current(lifecycle) ||
        (started && this.work.reloadToken(id) !== controller)
      )
        return;
      reconcileWriteFailure(error, {
        finish: onSettled => this.work.finishReload(id, controller, onSettled),
        patch: () => this.store.patch(id, { writeError: message(error) }),
      });
    } finally {
      this.work.finishReload(id, controller);
    }
    void followUp?.().catch(() => {});
  }
```

粘合规则：
- 模块级 `const RELOAD_ABORT = Symbol();`；`reconcileUnverifiedCreate` 内原 226/234/239 的早退 `return` 改为 `return RELOAD_ABORT`；原 275 行 `followUp = this.queries.followUp(queryId, true)` 改为 `return ctx.createFollowUp()`（其 `queryId` 经原 271 行 `ctx.setQueryId(baseline.id)` 回写）；原 276-302 的 `finishReload(id, controller, () => store.publish(...))` 原样保留在方法内。
- `beginReloadGate(ctx)`：原 107-118 逐字（其中 118 行 `started = true;` 改为 `ctx.markStarted();`），原 120 与 122-126 的内联货币检查改为 `if (ctx.stale()) return RELOAD_ABORT;`，成功返回 `{ unverified, existingBaseline }`。
- `fetchReloadResult(gate, session, ctx)`：原 127-196 逐字；其中 139-142、177-181 的内联货币检查改为 `if (ctx.stale()) return RELOAD_ABORT;`（await 之后的早退同样走哨兵）。
- `validateReloadResult(result, session, unverified)`：原 202-211 逐字。
- `reconcileReloadedInstance(baseline, ctx)`：原 303-317 逐字（followUp 创建改走 `ctx.createFollowUp()` 并 return）。
- catch 块 = Task 7 Step 4 中 ViewReload catch 的最终版本，逐字保留于此（`started` flag 由编排层持有，`ctx.markStarted` 在 `beginReloadGate` 内原 118 行位置回写）。

- [ ] **Step 2: 回归**

Run: `npx vitest run --coverage.enabled=false test/engine/ test/viewEngine.reload.test.ts 2>&1 | tail -3; npx vitest run --coverage.enabled=false 2>&1 | tail -3`
（若不存在 `viewEngine.reload.test.ts`，以 grep `reloadInstance` test/ 找到的测试文件为准。）
Expected: 全绿。

- [ ] **Step 3: Commit**

```bash
git add packages/view-engine/src/engine/ViewReload.ts
git commit -m "refactor(view-engine): decompose reloadInstance into phases"
```

---

### Task 10: 提取 analysisEditorLabels 与共享原子（Choice/Boundary）

**Files:**
- Create: `packages/view-engine/src/analysis/analysisEditorLabels.ts`
- Create: `packages/view-engine/src/analysis/AnalysisComponentChoice.tsx`
- Modify: `packages/view-engine/src/analysis/AnalysisEditor.tsx`

**Interfaces:**
- Produces（后 Task 11-13 复用，精确签名）:
  - `analysisEditorLabels.ts`: `export const groupNames: Record<Group, string>`、`export const names: Record<string, string>`、`export const dateLabels: Record<string, string>`、`export function analysisOutputs(value: DeepReadonly<AnalysisViewConfig>)`（基线 75-97、156-162 逐字，补必要 import）
  - `AnalysisComponentChoice.tsx`: `export function Choice(props: {label: string; caption?: string; value?: string; options: {value: string; label: string}[]; onChange(value: string): void; disabled?: boolean; invalid?: boolean})`（基线 122-154 逐字）与 `export class AnalysisEditorBoundary extends Component<{children: ReactNode}, {failed: boolean}>`（基线 98-121 逐字）

- [ ] **Step 1: 创建两个新文件并从 AnalysisEditor.tsx 删除对应行段**，AnalysisEditor.tsx 改为从新文件 import（`Choice`/`AnalysisEditorBoundary`/三个标签常量/`analysisOutputs`；`Group`/`Component`/`ReactNode` 等若仅被移走代码使用则从 import 清理）。
- [ ] **Step 2: 验证**

Run: `npx vitest run --coverage.enabled=false test/analysisEditor.test.tsx test/analysisControls.test.tsx 2>&1 | tail -3`
Expected: 全绿（25 个编辑器用例不动）。

- [ ] **Step 3: Commit**

```bash
git add packages/view-engine/src/analysis
git commit -m "refactor(view-engine): extract analysis editor labels and choice atoms"
```

---

### Task 11: 提取 AnalysisSortEditor

**Files:**
- Create: `packages/view-engine/src/analysis/AnalysisSortEditor.tsx`
- Modify: `packages/view-engine/src/analysis/AnalysisEditor.tsx`

**Interfaces:**
- Produces:

```tsx
export function AnalysisSortEditor(props: {
  value: DeepReadonly<AnalysisViewConfig>;
  context: AnalysisCompileContext;
  disabled: boolean;
  /** 父层持有 invalidLimit，供 details 的 open 计算使用；此处仅用于 aria-invalid。 */
  invalidLimit: boolean;
  update(patch: Partial<AnalysisViewConfig>): void;
}): ReactNode
```

- [ ] **Step 1: 搬运**基线 896-1005（排序 fieldset + 最多结果行数 label）到新组件；`sortOptions`/`nextSortOutput`（基线 825-841）与 `maxSort`/`maxLimit` 计算（817-816 一带）一并移入；`useId` 的 `limitHintId` 在组件内部生成。原 JSX 位置替换为：

```tsx
              <AnalysisSortEditor
                value={value}
                context={props.context}
                disabled={disabled}
                invalidLimit={invalidLimit}
                update={update}
              />
```

`invalidLimit`（818-823）与 `update`（826-828）留在 AnalysisEditor.tsx（details 的 `open={advancedOpen || invalidLimit}` 依赖前者）。
- [ ] **Step 2: 验证并提交**

Run: `npx vitest run --coverage.enabled=false test/analysisEditor.test.tsx 2>&1 | tail -3`（重点覆盖 `edits and removes result ordering`/`recomputes sort capacity` 等用例）

```bash
git add packages/view-engine/src/analysis
git commit -m "refactor(view-engine): extract AnalysisSortEditor"
```

---

### Task 12: 提取 AnalysisComponentForm（展开态编辑表单）

**Files:**
- Create: `packages/view-engine/src/analysis/AnalysisComponentForm.tsx`
- Modify: `packages/view-engine/src/analysis/AnalysisEditor.tsx`

**Interfaces:**
- Consumes: Task 10 的 `Choice`/`AnalysisEditorBoundary`/标签常量
- Produces:

```tsx
export function AnalysisComponentForm(props: {
  kind: 'dimensions' | 'metrics';
  title: string;
  role: 'dimension' | 'metric';
  item: AnalysisComponentConfig;
  index: number;
  label: string;
  value: DeepReadonly<AnalysisViewConfig>;
  context: AnalysisCompileContext;
  capability?: AnalysisCompileContext['capability']['fields'][number];
  choices: string[];
  fields: AnalysisCompileContext['fields'];
  issues: readonly FilterValidationError[];
  customEditor?: ComponentType<{
    value: AnalysisComponentConfig;
    context: AnalysisComponentCompileContext;
    disabled?: boolean;
    errors: readonly FilterValidationError[];
    onChange(next: AnalysisComponentConfig): void;
  }>;
  disabled: boolean;
  onUpdate(patch: Partial<AnalysisComponentConfig>): void;
  onRemove(): void;
  onClose(): void;
  onCustomChange(next: AnalysisComponentConfig): void;
}): ReactNode
```

- [ ] **Step 1: 搬运**基线 PopoverContent 的 `readyToEdit && (<>…</>)` 内块（423-771）到新组件：`update(index, …)` → `props.onUpdate(…)`；删除按钮 onClick 体（706-733 的 splice/sort 过滤/setExpandedId(null)/setOpenedIds 回收）→ `props.onRemove()`（该闭包留在 List，因为要动 `expandedId/openedIds` 状态与 `value`）；"完成编辑"按钮 → `props.onClose()`；CustomEditor 的 onChange 定靶逻辑（676-702，依赖 `latest.current`）→ `props.onCustomChange(next)`（闭包留在 List）。
- [ ] **Step 2:** List 的 PopoverContent 内替换为：

```tsx
                        {readyToEdit && (
                          <>
                            <PopoverTitle>{title}设置</PopoverTitle>
                            <div className="fve:grid fve:grid-cols-1 fve:gap-3">
                              <AnalysisComponentForm
                                kind={kind}
                                title={title}
                                role={role}
                                item={item}
                                index={index}
                                label={label}
                                value={value}
                                context={context}
                                capability={capability}
                                choices={choices}
                                fields={fields}
                                issues={issues}
                                customEditor={CustomEditor}
                                disabled={disabled}
                                onUpdate={patch => update(index, patch)}
                                onRemove={() => {
                                  /* 原 706-733 删除体逐字 */
                                }}
                                onClose={() => setExpandedId(null)}
                                onCustomChange={next => {
                                  /* 原 676-702 定靶逻辑逐字 */
                                }}
                              />
                            </div>
                            {component === 'numeric' && item.expression && ( …原 735-748 的 AnalysisExpressionEditor… )}
                            {component === 'any' && ( …原 749-753… )}
                            {capability?.unit && ( …原 754-758… )}
                            {issues.map((error, i) => ( …原 759-763… ))}
                            <Button variant="outline" onClick={() => setExpandedId(null)}>完成编辑</Button>
                          </>
                        )}
```

（表单后部的 ExpressionEditor/提示/issues/完成按钮不属表单域，留在 List——保持与基线 JSX 结构一一对应。）
- [ ] **Step 3: 验证并提交**

Run: `npx vitest run --coverage.enabled=false test/analysisEditor.test.tsx test/analysisControls.test.tsx test/analysisPresentationEditor.test.tsx 2>&1 | tail -3`

```bash
git add packages/view-engine/src/analysis
git commit -m "refactor(view-engine): extract AnalysisComponentForm"
```

---

### Task 13: 提取 AnalysisComponentList（收尾 ≤400 行）

**Files:**
- Create: `packages/view-engine/src/analysis/AnalysisComponentList.tsx`
- Modify: `packages/view-engine/src/analysis/AnalysisEditor.tsx`

**Interfaces:**
- Produces:

```tsx
export function AnalysisComponentList(
  props: AnalysisEditorProps & { kind: 'dimensions' | 'metrics' },
): ReactNode
```

`AnalysisEditorProps` 移至 `analysisReactTypes.ts`（或新建 `analysisEditorTypes.ts`）并 re-export，避免 List↔Editor 循环 import；`src/analysis/analysisReactTypes.ts` 已有 `AnalysisExtensions`，优先放此处（内部类型，不进公共入口）。

- [ ] **Step 1:** 将 ComponentList 残余（基线 164-810 的容器：fieldset/legend/order 指令、`change`/`update`/`useListOrder`/`latest` ref/`supportsGroup`/`choices`/`canAdd`、`<ol>` 项与 Popover 触发 chip、添加按钮 782-805）整体搬到 `AnalysisComponentList.tsx`；`AnalysisEditorProps` 类型迁移；`AnalysisEditor.tsx` 保留：OverlayScope + section + `AnalysisScopeEditor` + 两个 `<AnalysisComponentList kind=…>` + details（advancedOpen）+ AnalysisSortEditor + 残余错误 alert（1008-1018）。
- [ ] **Step 2: 验证结构目标**

Run: `wc -l packages/view-engine/src/analysis/AnalysisEditor.tsx && npx vitest run --coverage.enabled=false 2>&1 | tail -3 && pnpm --filter @ahoo-wang/fetcher-view-engine test:compiled 2>&1 | tail -3`
Expected: AnalysisEditor.tsx ≤ 400 行；普通与 compiled 模式全绿（渲染期 setState/OverlayScope 行为未变）。

- [ ] **Step 3: Commit**

```bash
git add packages/view-engine/src/analysis
git commit -m "refactor(view-engine): extract AnalysisComponentList, slim editor entry"
```

---

### Task 14: 增量 API——命令命名类型导出 + 文档同步

**Files:**
- Modify: `packages/view-engine/src/engine/ViewEngine.ts`（新增两个 interface + 两处返回类型标注）
- Modify: `packages/view-engine/src/index.ts`（`export type` 两行）
- Modify: `skills/fetcher-view-engine/references/api.md`、`wiki/reference/view-engine/symbols.md`、`wiki/zh/reference/view-engine/symbols.md`

**Interfaces:**
- Produces（纯增量；方法签名必须与现对象字面量逐字一致——来源 `ViewEngine.ts:312-352` 与 `370-456`）:

```ts
export interface AnalysisInstanceCommands {
  edit(
    updater: (
      config: DeepReadonly<AnalysisViewConfig>,
    ) => DeepReadonly<AnalysisViewConfig>,
  ): void;
  start(): { accepted: boolean; completion: Promise<void> };
  run(): Promise<void>;
  refresh(): Promise<void>;
  setFilterValidity(valid: boolean): void;
  setSort(sort: DeepReadonly<AnalysisViewConfig['sort']>): Promise<void>;
  clearSort(): void;
  restore(): void;
}

export interface RecordInstanceCommands {
  edit(updater: (config: DeepReadonly<RecordViewConfig>) => DeepReadonly<RecordViewConfig>): void;
  refreshSummary(): Promise<void>;
  applyFilter(): Promise<void>;
  setFilterDraft(draft: DeepReadonly<FilterConfiguration>, valid?: boolean): void;
  setFilterValidity(valid: boolean): void;
  setFilterMode(mode: FilterMode): void;
  setSort(sort: DeepReadonly<FieldSort[]>): Promise<void>;
  setLayout(layout: RecordPresentation['layout']): void;
  setCardConfig(card: DeepReadonly<RecordCardConfig>): void;
  setColumns(columns: DeepReadonly<RecordColumn[]>): void;
  setPage(index: number): Promise<void>;
  setPageSize(size: number): Promise<void>;
  nextPage(): Promise<void>;
  setSelection(keys: RecordKey[]): void;
  refresh(options?: { background?: boolean }): Promise<void>;
  retryQuery(): Promise<void>;
  restore(): Promise<void>;
}
```

**前置核对**：`analysis()` 的 `start` 当前返回 `this.analysisCommands.start(id)` 的结果（`{accepted, completion}`）——写 interface 前先 `grep -n "start(" packages/view-engine/src/analysis/AnalysisCommands.ts` 核对返回类型并照抄，不得臆造。

- [ ] **Step 1:** 在 ViewEngine.ts 定义两个 interface（置于类外、文件尾），`analysis(id)` 与 `record(id)` 签名标注返回类型 `: AnalysisInstanceCommands` / `: RecordInstanceCommands`；`src/index.ts` 追加：

```ts
export type {
  AnalysisInstanceCommands,
  RecordInstanceCommands,
} from './engine/ViewEngine.js';
```

- [ ] **Step 2: 文档同步**（仓库规则：公共 API 变更同改 api.md；双语 wiki symbols 同步）
  - `skills/fetcher-view-engine/references/api.md`：在"Commands and result ownership"对应小节（约 358 行、364 行）补一句：`engine.record(id)`/`engine.analysis(id)` 的返回类型名为 `RecordInstanceCommands`/`AnalysisInstanceCommands`（自本版本导出，便于宿主持有与文档化）。
  - `wiki/reference/view-engine/symbols.md` 与 `wiki/zh/reference/view-engine/symbols.md`：按该文件现有条目格式各加两行类型条目（含一行用途说明）。

- [ ] **Step 3: 验证**

Run: `pnpm --filter @ahoo-wang/fetcher-view-engine... build 2>&1 | tail -2 && pnpm --filter @ahoo-wang/fetcher-view-engine test:type && cd packages/view-engine && npx vitest run --coverage.enabled=false test/viewEngine.capabilities.test.ts test/architecture.test.ts 2>&1 | tail -3 && node scripts/verify-extension-contracts.mjs`
Expected: 构建（d.ts 含新导出）、类型、架构测试、契约脚本全过。

- [ ] **Step 4: Commit**

```bash
git add packages/view-engine/src skills/fetcher-view-engine/references/api.md wiki/reference/view-engine/symbols.md wiki/zh/reference/view-engine/symbols.md
git commit -m "feat(view-engine): export named instance command types"
```

---

### Task 15: 全链终验

**Files:** 无新改动（仅验证；若有残留问题，修复后单独提交）

- [ ] **Step 1: 包全链**

Run: `pnpm --filter @ahoo-wang/fetcher-view-engine test 2>&1 | tail -6`
Expected: coverage（含 thresholds）+ compiled + type 三段全过。

- [ ] **Step 2: 结构目标核对（规格 §8）**

Run:
```bash
awk '/private async write/,/^  }$/' packages/view-engine/src/engine/ViewPersistence.ts | wc -l
awk '/async reloadInstance/,/^  }$/' packages/view-engine/src/engine/ViewReload.ts | wc -l
wc -l packages/view-engine/src/analysis/AnalysisEditor.tsx
grep -rn "from '.*engine/" packages/view-engine/src/contracts/ | wc -l
git diff 891f441a --stat -- packages/view-engine/test | tail -2
```
Expected: write ≤60；reloadInstance ≤60；AnalysisEditor ≤400；contracts→engine 导入 = 0；test 目录 diff 仅含新增文件（`baselinePatch.test.ts`、`writeRecovery.test.ts`），**零断言修改**。

- [ ] **Step 3: lint 与根测试**

Run: `pnpm --filter @ahoo-wang/fetcher-view-engine lint:check && pnpm test:unit 2>&1 | tail -6`
Expected: 全绿。

- [ ] **Step 4: 终验提交（如无改动则跳过）**

```bash
git status --short  # 应为空
```
