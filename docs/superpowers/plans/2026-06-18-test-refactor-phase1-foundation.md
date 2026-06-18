# 测试重构 阶段 1：地基修复 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 一次性修复全仓 12 包的测试隔离地基（vitest 清理配置），并删除零价值的占位/字面量读回测试——为阶段 2 的重写提供干净的、可信的隔离基础。

**Architecture:** 两个独立动作。(1) 在所有包的 `vitest.config.ts` 加 `clearMocks`/`restoreMocks`/`unstubGlobals`，让 vitest 在每个测试后自动清理 mock 调用记录、还原 spyOn 实现、还原全局 stub——这是"地基"，消灭 ~60% 的跨测试泄漏。(2) 删除 13 类零价值测试文件/用例（纯类型字面量读回、`expect(true).toBe(true)`、完全重复的 block）——它们不覆盖任何生产代码，删除只降低噪音。

**Tech Stack:** vitest（内置 `clearMocks`/`restoreMocks`/`unstubGlobals` 配置项）

**Spec:** `docs/superpowers/specs/2026-06-18-test-refactor-design.md` 阶段 1

---

## 文件结构

### 修改的文件（vitest 配置）

每个包的 `vitest.config.ts` 的 `test:` 块新增三项配置。共 12 个文件：
- `packages/fetcher/vitest.config.ts`
- `packages/decorator/vitest.config.ts`
- `packages/cosec/vitest.config.ts`
- `packages/eventbus/vitest.config.ts`
- `packages/eventstream/vitest.config.ts`
- `packages/openai/vitest.config.ts`
- `packages/openapi/vitest.config.ts`
- `packages/generator/vitest.config.ts`
- `packages/react/vitest.config.ts`
- `packages/storage/vitest.config.ts`
- `packages/wow/vitest.config.ts`
- `packages/viewer/vitest.config.ts`

### 删除的文件（零价值测试）

- `packages/fetcher/test/types.test.ts`（3 用例，字面量读回）
- `packages/fetcher/test/orderedCapable.test.ts`（10 用例，字面量读回）
- `packages/wow/test/types/function.test.ts`（2 用例，`expect(true).toBe(true)`）
- `packages/wow/test/types/modeling.test.ts`（1 用例，`expect(true).toBe(true)`）
- `packages/wow/test/types/naming.test.ts`（2 用例，字面量读回）
- `packages/wow/test/types/common.test.ts`（2 用例，字面量读回）
- `packages/wow/test/types/endpoints.test.ts`（4 用例，字面量读回）
- `packages/wow/test/command/commandResult.test.ts`（3 用例，字面量读回）
- `packages/wow/test/query/event/domainEventStream.test.ts`（3 用例，字面量读回）
- `packages/wow/test/query/snapshot/snapshot.test.ts`（3 用例，字面量读回）

### 删除的用例（在保留的文件内）

- `packages/fetcher/test/resultExtractor.test.ts` 的 `describe('ResultExtractor')` 块（:21-28，字面量读回）——保留 `describe('ResultExtractors')` 块（行为测试）
- `packages/generator/test/client/clientGenerator.test.ts` 的 3 个 `expect(true).toBe(true)` 用例（:150,:157,:173）
- `packages/generator/test/client/apiClientGenerator.test.ts` 的重复 block（:546-610，与 :485-545 完全相同）
- `packages/generator/test/model/typeGenerator.test.ts` 的重复 block（:664-705，与 :620-661 完全相同）
- `packages/wow/test/query/condition.test.ts` 的重复 block（:99-108，与 :91-98 完全相同）

---

## Task 1: 创建工作分支

**Files:**
- 无（git 操作）

- [ ] **Step 1: 从 main 创建分支**

```bash
cd /Users/ahoo/work/ahoo-git/fetcher
git checkout main
git pull origin main
git checkout -b refactor/test-foundation-phase1
```

- [ ] **Step 2: 确认基线测试全绿**

Run: `pnpm -r --filter='./packages/*' exec vitest run --reporter=dot 2>&1 | grep -E "Test Files|Tests "`
Expected: 所有包全部 passed（这是起点基线，重构后必须仍全绿）

---

## Task 2: 给所有 12 包加 vitest 清理配置

**Files:**
- Modify: 所有 `packages/*/vitest.config.ts`

**注意：** 每个 vitest.config.ts 的 `test:` 块结构可能不同。统一在 `test:` 对象内加这三项。先读一个样本了解结构。

- [ ] **Step 1: 读 fetcher 的 vitest.config.ts 了解结构**

Run: `cat packages/fetcher/vitest.config.ts`
观察 `test:` 块的现有字段（如 `globals`、`environment`、`coverage` 等）。

- [ ] **Step 2: 修改 fetcher/vitest.config.ts**

在 `test:` 对象内加（与现有字段并列，保持字母序或就近）：
```ts
    clearMocks: true,
    restoreMocks: true,
    unstubGlobals: true,
```

- [ ] **Step 3: 跑 fetcher 测试确认仍全绿**

Run: `cd packages/fetcher && npx vitest run`
Expected: 全部 passed。若有失败，记录失败的测试——它依赖 mock 泄漏，是 bug，需在该任务内修复（让它在隔离下正确运行）。

- [ ] **Step 4: 对其余 11 个包重复 Step 2**

对 decorator、cosec、eventbus、eventstream、openai、openapi、generator、react、storage、wow、viewer 各自：
- 读该包 `vitest.config.ts`
- 在 `test:` 块加同样的三项配置
- 跑该包 `npx vitest run` 确认全绿（或记录需修复的泄漏依赖测试）

- [ ] **Step 5: 全仓测试确认**

Run（串行，避免 CPU 打满）:
```bash
for pkg in fetcher decorator cosec eventbus eventstream openai openapi generator react storage wow viewer; do
  echo "=== $pkg ==="
  pnpm --filter "@ahoo-wang/fetcher-$pkg" exec vitest run --reporter=dot 2>&1 | grep -E "Test Files|Tests " | head -2
done
# fetcher 核心包名不带后缀
pnpm --filter "@ahoo-wang/fetcher" exec vitest run --reporter=dot 2>&1 | grep -E "Test Files|Tests " | head -2
```
Expected: 全部 passed。任何因加配置而红的测试都是泄漏 bug——必须修复（通常是把测试内对 spy/mock 的隐式跨用例依赖改为自包含）。

- [ ] **Step 6: 提交**

```bash
git add packages/*/vitest.config.ts
# 若 Step 3-5 修复了泄漏依赖测试，一并 add 那些测试文件
git commit -m "test: add restoreMocks/clearMocks/unstubGlobals to all packages

Auto-cleanup of mock call records, spy restoration, and global stubs
after every test. Eliminates ~60% of cross-test leakage. Any test that
broke was depending on leaked state — fixed to be self-contained."
```

---

## Task 3: 删除零价值测试文件（整文件删除）

**Files:**
- Delete: 10 个文件（见上文"删除的文件"清单）

**先验证再删**：每个文件删除前，确认它只含字面量读回/`expect(true).toBe(true)`，不含对生产函数的行为调用。

- [ ] **Step 1: 验证 fetcher 的两个字面量测试文件**

Run:
```bash
cat packages/fetcher/test/types.test.ts
cat packages/fetcher/test/orderedCapable.test.ts
```
确认：构造接口字面量对象 → 断言该对象的字段等于刚赋的值。无任何 src 生产函数调用。

- [ ] **Step 2: 删除 fetcher 的两个文件**

```bash
git rm packages/fetcher/test/types.test.ts packages/fetcher/test/orderedCapable.test.ts
```

- [ ] **Step 3: 跑 fetcher 测试确认删除无影响**

Run: `cd packages/fetcher && npx vitest run`
Expected: 全绿（删除的测试本就没覆盖生产代码）。

- [ ] **Step 4: 验证并删除 wow 的 8 个字面量/占位测试文件**

```bash
# 先逐一验证（cat 确认是字面量读回或 expect(true)）
for f in \
  packages/wow/test/types/function.test.ts \
  packages/wow/test/types/modeling.test.ts \
  packages/wow/test/types/naming.test.ts \
  packages/wow/test/types/common.test.ts \
  packages/wow/test/types/endpoints.test.ts \
  packages/wow/test/command/commandResult.test.ts \
  packages/wow/test/query/event/domainEventStream.test.ts \
  packages/wow/test/query/snapshot/snapshot.test.ts; do
  echo "=== $f ==="
  cat "$f"
done
```
确认每个都是字面量读回或 `expect(true).toBe(true)`，无生产函数行为调用。

```bash
git rm \
  packages/wow/test/types/function.test.ts \
  packages/wow/test/types/modeling.test.ts \
  packages/wow/test/types/naming.test.ts \
  packages/wow/test/types/common.test.ts \
  packages/wow/test/types/endpoints.test.ts \
  packages/wow/test/command/commandResult.test.ts \
  packages/wow/test/query/event/domainEventStream.test.ts \
  packages/wow/test/query/snapshot/snapshot.test.ts
```

- [ ] **Step 5: 跑 wow 测试确认删除无影响**

Run: `cd packages/wow && npx vitest run`
Expected: 全绿。

- [ ] **Step 6: 提交**

```bash
git commit -m "test: remove zero-value literal-readback and placeholder tests

Deleted 10 files (~36 cases) that only constructed interface literals and
asserted the values just assigned, or used expect(true).toBe(true). They
covered no production behavior — type safety is already enforced by tsc.
Removing them improves signal-to-noise for the remaining suite."
```

---

## Task 4: 删除文件内的零价值用例和重复 block

**Files:**
- Modify: `packages/fetcher/test/resultExtractor.test.ts`
- Modify: `packages/generator/test/client/clientGenerator.test.ts`
- Modify: `packages/generator/test/client/apiClientGenerator.test.ts`
- Modify: `packages/generator/test/model/typeGenerator.test.ts`
- Modify: `packages/wow/test/query/condition.test.ts`

- [ ] **Step 1: 删除 resultExtractor.test.ts 的字面量 describe 块**

读 `packages/fetcher/test/resultExtractor.test.ts`，定位 `describe('ResultExtractor', ...)` 块（约 :21-28，构造 `ResultExtractor` 类型字面量）。删除该 describe 块，保留 `describe('ResultExtractors', ...)` 块（行为测试）。

- [ ] **Step 2: 跑 fetcher 测试确认**

Run: `cd packages/fetcher && npx vitest run test/resultExtractor.test.ts`
Expected: 全绿（保留的 ResultExtractors 行为测试仍在）。

- [ ] **Step 3: 删除 clientGenerator.test.ts 的 3 个占位用例**

读 `packages/generator/test/client/clientGenerator.test.ts`，定位 :150、:157、:173 的 `expect(true).toBe(true)` 用例。删除这 3 个 `it(...)` 块。

- [ ] **Step 4: 删除 apiClientGenerator.test.ts 的重复 block**

读 `packages/generator/test/client/apiClientGenerator.test.ts`，定位 :546 与 :485（标题都是 `'should handle event stream with array reference schema'`），以及 :588 与 :522（`'should handle event stream with non-array schema'`）。删除 :546 和 :588 起始的重复 `it(...)` 块（保留 :485 和 :522）。

- [ ] **Step 5: 删除 typeGenerator.test.ts 的重复 block**

读 `packages/generator/test/model/typeGenerator.test.ts`，定位 :620 与 :664（标题 `'should add index signature when additionalProperties is a schema'` 完全相同）。删除 :664 起始的重复 `it(...)` 块（保留 :620）。

- [ ] **Step 6: 删除 condition.test.ts 的重复 block**

读 `packages/wow/test/query/condition.test.ts`，定位 :91 与 :99（标题 `'should return options object when ignoreCase is defined'` 完全相同）。删除 :99 起始的重复 `it(...)` 块（保留 :91）。

- [ ] **Step 7: 跑 generator + wow 测试确认**

Run:
```bash
cd packages/generator && npx vitest run test/client/clientGenerator.test.ts test/client/apiClientGenerator.test.ts test/model/typeGenerator.test.ts
cd packages/wow && npx vitest run test/query/condition.test.ts
```
Expected: 全绿（删除的是重复/占位，保留的是原唯一用例）。

- [ ] **Step 8: 提交**

```bash
git add packages/fetcher/test/resultExtractor.test.ts \
  packages/generator/test/client/clientGenerator.test.ts \
  packages/generator/test/client/apiClientGenerator.test.ts \
  packages/generator/test/model/typeGenerator.test.ts \
  packages/wow/test/query/condition.test.ts
git commit -m "test: remove placeholder cases and duplicate test blocks

- fetcher/resultExtractor: drop the literal-readback ResultExtractor
  describe block (kept the behavioral ResultExtractors tests).
- generator/clientGenerator: remove 3 expect(true).toBe(true) placeholders.
- generator/apiClientGenerator: remove 2 duplicated it blocks (identical
  titles + bodies with earlier cases).
- generator/typeGenerator: remove 1 duplicated it block.
- wow/condition: remove 1 duplicated it block."
```

---

## Task 5: 全仓验证 + 推送 + PR

- [ ] **Step 1: 全仓测试（串行）**

Run:
```bash
pnpm -r --filter='./packages/*' exec vitest run --reporter=dot 2>&1 | grep -E "Test Files|Tests "
```
Expected: 全部 passed。记录总测试数（应比基线少 ~50，因为删了零价值用例）。

- [ ] **Step 2: coverage 确认不下降**

Run（对改动涉及的包）:
```bash
pnpm --filter "@ahoo-wang/fetcher" exec vitest run --coverage 2>&1 | grep "All files"
pnpm --filter "@ahoo-wang/fetcher-wow" exec vitest run --coverage 2>&1 | grep "All files"
pnpm --filter "@ahoo-wang/fetcher-generator" exec vitest run --coverage 2>&1 | grep "All files"
```
Expected: 覆盖率不下降（删除的测试不计入生产代码覆盖）。

- [ ] **Step 3: lint 确认**

Run:
```bash
for pkg in fetcher decorator cosec generator react viewer wow; do
  pnpm --filter "@ahoo-wang/fetcher-$pkg" exec eslint src test --quiet 2>&1 | grep -v baseline | head
done
pnpm --filter "@ahoo-wang/fetcher" exec eslint src test --quiet 2>&1 | grep -v baseline | head
```
Expected: 无 error。

- [ ] **Step 4: 推送 + 开 PR**

```bash
git push -u origin refactor/test-foundation-phase1
gh pr create \
  --base main \
  --head refactor/test-foundation-phase1 \
  --title "test: foundation phase — isolation config + remove zero-value tests" \
  --body "Phase 1 of the test refactor (spec: docs/superpowers/specs/2026-06-18-test-refactor-design.md).

## Changes
- Added clearMocks/restoreMocks/unstubGlobals to all 12 packages' vitest.config.ts (auto-cleanup after every test).
- Removed 10 zero-value test files (~36 cases): literal-readback and expect(true).toBe(true) placeholders that covered no production behavior.
- Removed placeholder cases and duplicate test blocks in 5 files.

## Verification
- All packages pass (test count reduced by ~50, all were zero-value).
- Coverage does not drop (deleted tests covered no production code).

This is the foundation for phase 2 (per-package rewrite of fake tests)."
```

---

## Self-Review

**Spec coverage（阶段 1）**:
- ✅ 1.1 统一清理配置 → Task 2
- ✅ 1.2 删除零价值测试 → Task 3（整文件）+ Task 4（文件内用例/block）
- ✅ 不做阶段 2 内容 → plan 未包含重写/降级 mock/拆文件

**Placeholder scan**: 无 TBD/TODO/placeholder。每个 Step 都有具体命令或代码。

**Type consistency**: 无类型定义（本阶段是配置 + 删除，无新代码）。

**风险点**:
- Task 2 Step 3/5 可能因加配置暴露泄漏依赖测试——plan 已明确"必须修复，不能跳过"
- Task 3 删除前必须 cat 验证（plan 已要求逐一确认）
