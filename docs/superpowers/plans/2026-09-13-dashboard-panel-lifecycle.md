# Dashboard Panel Lifecycle Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans in the current session, as selected by the user. Steps use checkbox syntax for tracking.

**Goal:** Give panel references and query positions a single lifecycle owner without introducing a library.

**Architecture:** DashboardPanelRuntime privately owns the lifecycle of one immutable panel/reference identity. DashboardRuntime coordinates configuration and applied scope using panel commands and read-only snapshots. Existing RequestRunner, DataViewPosition and aggregate budgets remain authoritative.

**Tech Stack:** TypeScript, existing Fetcher view engine, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-13-dashboard-panel-lifecycle-design.md`

## Global Constraints

- Package version 5.0.0, Node >=20.20.2, pnpm 10.34.5.
- No dependency, build configuration or public API change.
- Current session sequential execution; one PR, CI/review then squash merge.
- Preserve the four pre-existing untracked dashboard documents.
- Run heavy build/test/browser checks serially. Before every commit root `pnpm test:unit` must pass.

## Task 1: Encapsulate panel lifecycle and verify runtime boundaries

**Files:**

- Create `packages/view-engine/src/dashboard/DashboardPanelRuntime.ts`: private panel resources and transitions; panel snapshot type.
- Modify `packages/view-engine/src/dashboard/DashboardRuntime.ts`: replace mutable PanelState records with owners; retain config/scope orchestration and re-export the existing snapshot type.
- Modify `packages/view-engine/test/dashboard/recovery.test.ts`: ignored-abort replacement at instance and definition loading boundaries.
- Create `packages/view-engine/test/dashboard/reload.test.ts`: reset observer replacement, overlapping same-owner reloads, parallel sibling reloads and prompt settlement of obsolete reloads.
- Create `docs/superpowers/reviews/2026-09-13-dashboard-panel-lifecycle.md`: actual validation and architecture results.

**Interfaces:**

- `DashboardPanelRuntime` consumes immutable `id`/`instanceId`, existing engine/store/host/loader, and activity/publication/budget callbacks.
- `getSnapshot(): DashboardPanelSnapshot`, `metadataBytes: number`, `needsPreparation: boolean` are read-only observations.
- `load(): Promise<void>` deduplicates current loading and skips an existing resolver; `applyScope(expression: FilterExpression, dashboardId: string): boolean` returns whether the position needs execution.
- `refresh(): Promise<void>`, `block(error: unknown, filterId?: string): void`, `reloadReference(ready: () => Promise<void>): Promise<void>`, `suspend(): void`, `dispose(): void` own all resource and status mutations.

- [x] Run baseline dashboard runtime/recovery/resources/embedding tests.
- [x] Add a deferred host-load probe: start panel `a` at `child`, replace with `other`, wait for `other` to query, then settle the old success/FORBIDDEN; assert the new position remains successful and only one position session survives. Run with the gate at instance and definition boundaries.

```ts
it.each([
  ['instance', false],
  ['instance', true],
  ['definition', false],
  ['definition', true],
] as const)(
  'isolates a same-ID replacement from obsolete %s completion (denied: %s)',
  async (stage, denied) => {
    const oldInstance = deferred<ReturnType<typeof instance>>();
    const oldDefinition = deferred<typeof definition>();
    let oldSignal: AbortSignal | undefined;
    const load = vi.fn(async (id: string, signal?: AbortSignal) => {
      if (id === 'child' && stage === 'instance') {
        oldSignal = signal;
        return oldInstance.promise;
      }
      return { ...instance(id), definitionId: id };
    });
    const loadDefinition = vi.fn(async (id: string, signal?: AbortSignal) => {
      if (id === 'child') {
        oldSignal = signal;
        return oldDefinition.promise;
      }
      return { ...definition, id };
    });
    const { engine, paged } = dashboardSetup(
      { ...configured(), filters: [] },
      {
        instance: { load, save: async value => value },
        definition: { load: loadDefinition },
      },
    );
    try {
      await engine.load();
      const runtime = engine.dashboard('dashboard');
      await vi.waitFor(() =>
        expect(
          stage === 'instance' ? load : loadDefinition,
        ).toHaveBeenCalledOnce(),
      );
      expect(oldSignal?.aborted).toBe(false);
      runtime.edit(config => ({
        ...config,
        panels: config.panels.map(panel => ({ ...panel, instanceId: 'other' })),
      }));
      expect(oldSignal?.aborted).toBe(true);
      await vi.waitFor(() => expect(paged).toHaveBeenCalledOnce());
      const position = runtime.getSnapshot().panels.a.position!;
      const gate = stage === 'instance' ? oldInstance : oldDefinition;
      if (denied)
        gate.reject(new ViewServiceError('FORBIDDEN', 'obsolete owner'));
      else if (stage === 'instance')
        oldInstance.resolve({ ...instance('child'), definitionId: 'child' });
      else oldDefinition.resolve({ ...definition, id: 'child' });
      await new Promise(resolve => setTimeout(resolve, 10));
      expect(runtime.getSnapshot().panels.a).toMatchObject({
        status: 'ready',
        instance: { id: 'other' },
        position,
      });
      expect(position.getSnapshot().queryStatus).toBe('success');
      expect(
        Object.keys(engine.getSnapshot().sessions).filter(id =>
          id.startsWith('position:'),
        ),
      ).toEqual([position.identity.id]);
      expect(paged).toHaveBeenCalledOnce();
    } finally {
      engine.dispose();
    }
  },
);
```

- [x] Introduce the internal owner; move load/close/block/query/position transitions. Group loaded reference metadata, remove duplicated stored panel geometry, and keep generation checking private.
- [x] Update runtime reconciliation to dispose replaced owners, retain unchanged owners, and instantiate new ones. Replace direct field writes with commands and snapshot reads.
- [x] Keep batch scope decisions in runtime; call `applyScope` per owner and refresh only changed positions after publication. A reference reload uses a generation-guarded owner callback to commit only that owner; capture invalidation before notifying observers. Invalidate owners before any callback that can reenter.
- [x] Run focused tests, then check a deliberate stale-owner mutation against the new deferred-host tests; restore immediately and rerun. Fix any observed regression at the ownership boundary.
- [x] Measure before/after combined runtime production size and inspect every parent-to-panel interaction. Reject mere forwarding or duplicated state.
- [x] Run affected dependency/package build, root tests with CI concurrency, lint/format, and Storybook interactions. Obtain independent read-only review and resolve findings.

```sh
pnpm --filter @ahoo-wang/fetcher-view-engine... build
VITEST_MAX_WORKERS=2 npm_config_workspace_concurrency=1 pnpm test:unit
pnpm lint:view-engine
pnpm test:storybook
git diff --check
```

- [x] Record local validation and prepare scoped files and the PR description.

Delivery: commit scoped files, create PR, inspect all CI and review threads, squash
merge only the validated head, then synchronize this worktree to main. The PR records
the final remote checks and merge status.
