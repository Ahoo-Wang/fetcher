/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { RuntimeLimitError, withDeadline } from '../lib/runtimeLimits.js';
import type {
  CatalogState,
  PreferenceLoadState,
  ViewDefinition,
  ViewEngineOptions,
  ViewInstance,
  ViewInstanceSummary,
  ViewSession,
} from '../contracts/viewModel.js';
import { cloneSnapshot } from '../lib/types.js';
import { validateViewDefinition } from '../contracts/validation/definitionValidation.js';
import { validateViewInstance } from '../contracts/validation/instanceValidation.js';
import type { EngineScope } from './EngineScope.js';
import type { SessionStore } from './SessionStore.js';
import type { InstanceWork } from './InstanceWork.js';
import type { ViewQueries } from './ViewQueries.js';
import type { InstanceSource } from './InstanceSource.js';
import type { RecordSummaries } from '../record/engine/RecordSummaries.js';
import { copy, message, ownRecord } from '../lib/snapshot.js';
import {
  createSession,
  inheritEditingSession,
  withContent,
} from './sessionState.js';

const EMPTY_CATALOG: CatalogState = Object.freeze({
  status: 'idle',
  error: null,
  nextCursor: null,
  total: null,
  summaries: Object.freeze(Object.create(null) as Record<string, never>),
});
const EMPTY_PREFERENCE: PreferenceLoadState = Object.freeze({
  status: 'idle',
  error: null,
  revision: null,
});

/**
 * Loads the definition, the first catalog page and the personal preference independently,
 * opens sessions only on explicit navigation and owns navigation intent.
 */
export class ViewLoader {
  private readonly definitionId: string;
  private readonly initialInstanceId?: string;
  private loadController?: AbortController;
  /** Catalog order as loaded, before opened or created instances outside the pages. */
  private catalogIds: string[] = [];
  private catalogLoading?: AbortController;
  constructor(
    private readonly store: SessionStore,
    private readonly scope: EngineScope,
    private readonly source: InstanceSource,
    private readonly work: InstanceWork,
    private readonly queries: ViewQueries,
    private readonly summaries: RecordSummaries,
    options: ViewEngineOptions,
  ) {
    this.definitionId = options.definitionId;
    this.initialInstanceId = options.instanceId;
  }
  dispose(): void {
    this.loadController?.abort();
    this.catalogLoading?.abort();
  }

  async load(): Promise<void> {
    this.scope.assertActive();
    this.work.assertLoadable();
    const lifecycle = this.scope.restart();
    if (!this.scope.current(lifecycle)) return;
    // Reloading cannot prove whether an already dispatched creation committed.
    this.work.preserveCreates({
      ...this.store.getSnapshot().pendingCreates,
      ...this.store.getSnapshot().sessions,
    });
    this.work.clearDeletes();
    this.loadController?.abort();
    this.catalogLoading?.abort();
    if (!this.scope.current(lifecycle)) return;
    this.work.cancelReloads();
    if (!this.scope.current(lifecycle)) return;
    this.queries.reset();
    if (!this.scope.current(lifecycle)) return;
    const controller = new AbortController();
    this.loadController = controller;
    this.catalogIds = [];
    this.store.publish({
      status: 'loading',
      error: null,
      definition: null,
      instanceIds: [],
      selectedInstanceId: null,
      openingInstanceId: null,
      defaultInstanceId: null,
      sessions: Object.create(null),
      catalog: EMPTY_CATALOG,
      preference: EMPTY_PREFERENCE,
    });
    const current = () => this.scope.current(lifecycle);
    let definition: ViewDefinition;
    try {
      definition = await withDeadline(
        () => this.source.definition(controller.signal),
        this.store.limits.loadTimeoutMs,
        controller,
      );
      if (!current()) return;
      validateViewDefinition(definition);
      if (definition.id !== this.definitionId)
        throw new Error('返回的视图定义 ID 不匹配');
      this.source.validateLocal(definition);
    } catch (error) {
      if (!current()) return;
      controller.abort();
      if (!current()) return;
      this.scope.loading = false;
      this.store.publish({ status: 'error', error: message(error) });
      throw error;
    }
    this.scope.loading = false;
    const initialSelection = this.scope.selection;
    this.store.publish({
      status: 'ready',
      error: null,
      definition: copy(definition),
      catalog: { ...EMPTY_CATALOG, status: 'loading' },
      preference: {
        ...EMPTY_PREFERENCE,
        status: this.source.hasPreferencePort ? 'loading' : 'ready',
      },
    });
    // An explicit instance is point-read as soon as the definition is ready; the catalog and
    // the personal default keep loading in the background and never block it.
    const explicit =
      this.initialInstanceId === undefined
        ? undefined
        : this.openSession(this.initialInstanceId, lifecycle).then(
            followUp => ({ followUp, error: undefined }),
            (error: unknown) => ({ followUp: undefined, error }),
          );
    const [, preference] = await Promise.all([
      this.loadCatalogPage(definition, null, lifecycle, controller),
      this.loadPreference(lifecycle, controller),
    ]);
    if (!current()) return;
    this.restoreUnverifiedCreates(definition);
    if (!current()) return;
    if (explicit) {
      const opened = await explicit;
      if (!current()) return;
      if (opened.error !== undefined) {
        if (this.scope.selection === initialSelection)
          this.store.publish({
            error: message(opened.error),
            openingInstanceId: null,
          });
        return;
      }
      // A failed first query is session-scoped state (queryError), not a workspace error.
      await opened.followUp?.().catch(() => {});
      return;
    }
    const target =
      preference.status === 'ready' ? preference.defaultInstanceId : null;
    // A default that arrives after the user already navigated must not take the selection back.
    if (
      target === null ||
      this.scope.selection !== initialSelection ||
      this.store.getSnapshot().selectedInstanceId !== null
    )
      return;
    let followUp: (() => Promise<void>) | undefined;
    try {
      followUp = await this.openSession(target, lifecycle);
    } catch (error) {
      if (!current()) return;
      this.store.publish({ error: message(error), openingInstanceId: null });
      return;
    }
    await followUp?.().catch(() => {});
  }

  private async loadCatalogPage(
    definition: ViewDefinition,
    cursor: string | null,
    lifecycle: number,
    controller: AbortController,
  ): Promise<{ loaded: boolean; error?: unknown }> {
    const current = () =>
      this.scope.current(lifecycle) && !controller.signal.aborted;
    try {
      const page = await withDeadline(
        () => this.source.list(definition, cursor, controller.signal),
        this.store.limits.loadTimeoutMs,
        controller,
      );
      if (!current()) return { loaded: false };
      const summaries: Record<string, ViewInstanceSummary> = ownRecord(
        this.store.getSnapshot().catalog.summaries,
      );
      // The summary cache is bounded; a page that would overflow it is refused whole so that
      // nothing is silently hidden, and the caller sees the resource limit.
      const incoming = page.items.filter(
        item => !this.catalogIds.includes(item.id),
      );
      if (
        this.catalogIds.length + incoming.length >
        this.store.limits.maxCatalogSummaries
      )
        throw new RuntimeLimitError(
          'RESOURCE_LIMIT',
          '已加载的视图目录达到运行预算，请缩小目录范围后重新加载',
        );
      for (const item of page.items) {
        if (!this.catalogIds.includes(item.id)) {
          this.work.forgetDeleted(item.id);
          this.catalogIds.push(item.id);
        }
        summaries[item.id] = item;
      }
      const extras = this.store
        .getSnapshot()
        .instanceIds.filter(id => !this.catalogIds.includes(id));
      this.store.publish({
        instanceIds: [...this.catalogIds, ...extras],
        catalog: {
          status: 'ready',
          error: null,
          nextCursor: page.nextCursor,
          total: page.total ?? null,
          summaries,
        },
      });
      return { loaded: true };
    } catch (error) {
      if (!current()) return { loaded: false };
      this.store.publish({
        catalog: {
          ...this.store.getSnapshot().catalog,
          status: 'error',
          error: message(error),
        },
      });
      return { loaded: false, error };
    }
  }

  /** Appends the next catalog page; the loaded pages, sessions and selection are untouched. */
  async loadMoreInstances(): Promise<void> {
    const definition = this.store.definition();
    const catalog = this.store.getSnapshot().catalog;
    // A failed page keeps its continuation cursor so the same page can be retried.
    if (
      (catalog.status !== 'ready' && catalog.status !== 'error') ||
      catalog.nextCursor === null ||
      this.catalogLoading
    )
      return;
    if (this.catalogIds.length >= this.store.limits.maxCatalogSummaries)
      throw new RuntimeLimitError(
        'RESOURCE_LIMIT',
        '已加载的视图目录达到运行预算，请缩小目录范围后重新加载',
      );
    const lifecycle = this.scope.version;
    const controller = new AbortController();
    this.catalogLoading = controller;
    this.store.publish({ catalog: { ...catalog, status: 'loading' } });
    try {
      const outcome = await this.loadCatalogPage(
        definition,
        catalog.nextCursor,
        lifecycle,
        controller,
      );
      if (!outcome.loaded && this.scope.current(lifecycle)) {
        // The page failure keeps its own type (for example a RuntimeLimitError).
        const failure: unknown =
          outcome.error ??
          new Error(this.store.getSnapshot().catalog.error ?? '目录加载失败');
        throw failure;
      }
    } finally {
      if (this.catalogLoading === controller) this.catalogLoading = undefined;
    }
  }

  private async loadPreference(
    lifecycle: number,
    controller: AbortController,
  ): Promise<{ status: 'ready' | 'error'; defaultInstanceId: string | null }> {
    const current = () =>
      this.scope.current(lifecycle) && !controller.signal.aborted;
    try {
      const preference = await withDeadline(
        () => this.source.preference(controller.signal),
        this.store.limits.loadTimeoutMs,
        controller,
      );
      if (!current()) return { status: 'error', defaultInstanceId: null };
      this.store.publish({
        defaultInstanceId: preference.effectiveDefaultInstanceId,
        preference: {
          status: 'ready',
          error: null,
          revision: preference.revision,
        },
      });
      return {
        status: 'ready',
        defaultInstanceId: preference.effectiveDefaultInstanceId,
      };
    } catch (error) {
      if (!current()) return { status: 'error', defaultInstanceId: null };
      this.store.publish({
        preference: { status: 'error', error: message(error), revision: null },
      });
      return { status: 'error', defaultInstanceId: null };
    }
  }

  /** Uncertain creations survive a reload as recovery contexts, never as authoritative instances. */
  private restoreUnverifiedCreates(definition: ViewDefinition): void {
    const sessions: Record<string, ViewSession> = ownRecord(
      this.store.getSnapshot().sessions,
    );
    const pendingCreates: Record<string, ViewSession> = Object.create(null);
    const known = new Set(this.store.getSnapshot().instanceIds);
    for (const [id, request] of this.work.createEntries()) {
      if (!this.work.unverifiedCreate(id)) continue;
      const restored = createSession(
        cloneSnapshot<ViewInstance>(
          request.source.kind === 'record'
            ? {
                ...request.source.instance,
                config: {
                  ...request.source.instance.config,
                  filters: request.source.filterBaseline,
                },
              }
            : request.source.instance,
        ),
        definition,
        this.store.filterCompilers,
        this.store.analysisCompilers,
      );
      const listed = known.has(id);
      const recovery = {
        ...inheritEditingSession(
          cloneSnapshot<ViewInstance>(request.source.baseline),
          request.source.kind === 'record' && restored.kind === 'record'
            ? { ...request.source, appliedFilter: restored.appliedFilter }
            : request.source,
          definition,
          this.store.filterCompilers,
          withContent(request.source.instance, request.source.instance),
          this.store.analysisCompilers,
        ),
        requiresReload: true,
        writeError: listed
          ? '另存结果尚未核对，请重新加载核对'
          : '原视图已不在当前目录，另存结果仍需核对',
      };
      const retained =
        recovery.kind === 'dashboard' &&
        request.source.kind === 'dashboard' &&
        !request.source.persisted
          ? { ...recovery, persisted: false }
          : recovery;
      if (listed) sessions[id] = retained;
      else pendingCreates[id] = retained;
    }
    this.store.publish({ sessions, pendingCreates });
  }

  /** Point read of a saved instance without opening a session; validated against the current definition. */
  async loadSavedInstance(
    id: string,
    signal?: AbortSignal,
  ): Promise<ViewInstance> {
    const definition = this.store.definition();
    if (signal?.aborted) {
      // 原样透传调用方的取消原因，保持与 AbortSignal 的拒绝契约一致。
      const reason: unknown =
        signal.reason ?? new DOMException('Aborted', 'AbortError');
      throw reason;
    }
    const controller = new AbortController();
    signal?.addEventListener('abort', () => controller.abort(signal.reason), {
      once: true,
    });
    const instance = await withDeadline(
      () => this.source.load(id, controller.signal, definition),
      this.store.limits.loadTimeoutMs,
      controller,
    );
    validateViewInstance(instance, definition, id, false);
    return copy(instance);
  }

  selectInstance(id: string): Promise<void> {
    if (this.store.isPosition(id)) throw new Error('运行位置不属于实例导航');
    this.store.definition();
    return this.open(id, this.scope.version);
  }

  private async open(id: string, lifecycle: number): Promise<void> {
    const followUp = await this.openSession(id, lifecycle);
    await followUp?.();
  }

  /** Opens (point-loading if needed) and selects an instance; returns the query to run for it. */
  private async openSession(
    id: string,
    lifecycle: number,
  ): Promise<(() => Promise<void>) | undefined> {
    const definition = this.store.definition();
    const pending = this.store.findPendingCreate(id);
    if (pending) {
      if (!this.catalogIds.includes(id))
        throw new Error('另存结果待核对，请先重新加载核对');
      // The recovery context is the session to restore for a source still in the catalog.
      const pendingCreates = ownRecord(this.store.getSnapshot().pendingCreates);
      delete pendingCreates[id];
      const sessions = ownRecord(this.store.getSnapshot().sessions);
      sessions[id] = pending;
      this.store.publish({ pendingCreates, sessions });
    }
    const { selection, controller } = this.scope.beginSelection();
    const current = () =>
      this.scope.current(lifecycle) && this.scope.selection === selection;
    // A catalogued target behaves like an already known instance: its navigation supersedes
    // the previous instance's pending work at once. An unknown id keeps the workspace intact
    // until the read proves it exists.
    let cancelled = false;
    const known =
      this.store.find(id) !== undefined || this.catalogIds.includes(id);
    const leaving = this.store.getSnapshot().selectedInstanceId;
    if (known && leaving !== null && leaving !== id) {
      this.queries.cancel(leaving);
      if (!current()) return;
      if (this.summaries.hasPending(leaving))
        this.summaries.invalidate(leaving);
      if (!current()) return;
      cancelled = true;
    }
    if (!this.store.find(id)) {
      this.store.publish({ openingInstanceId: id, error: null });
      if (!current()) return;
      try {
        if (!this.source.canLoad) throw new Error(`无法加载实例：${id}`);
        const instance = await withDeadline(
          () => this.source.load(id, controller.signal, definition),
          this.store.limits.loadTimeoutMs,
          controller,
        );
        if (!current()) return;
        validateViewInstance(instance, definition, id, false);
        this.work.forgetDeleted(id);
        const state = this.store.getSnapshot();
        const sessions = ownRecord(state.sessions);
        sessions[id] = createSession(
          copy(instance),
          definition,
          this.store.filterCompilers,
          this.store.analysisCompilers,
        );
        this.store.publish({
          sessions,
          instanceIds: state.instanceIds.includes(id)
            ? state.instanceIds
            : [...state.instanceIds, id],
        });
      } catch (error) {
        if (!current()) return;
        this.scope.finishSelection(controller);
        this.store.publish({ error: message(error), openingInstanceId: null });
        throw error;
      }
    }
    if (!current()) return;
    this.scope.finishSelection(controller);
    const previousId = this.store.getSnapshot().selectedInstanceId;
    if (previousId === id) {
      if (this.store.getSnapshot().error !== null)
        this.store.publish({ error: null, openingInstanceId: null });
      else if (this.store.getSnapshot().openingInstanceId !== null)
        this.store.publish({ openingInstanceId: null });
      return undefined;
    }
    if (previousId !== null && !(cancelled && previousId === leaving)) {
      this.queries.cancel(previousId);
      if (!current()) return;
      if (this.summaries.hasPending(previousId))
        this.summaries.invalidate(previousId);
    }
    if (!current()) return;
    this.summaries.invalidate(id);
    if (!current()) return;
    const followUp = this.queries.followUp(id);
    this.store.publish({
      selectedInstanceId: id,
      openingInstanceId: null,
      error: null,
    });
    return current() ? followUp : undefined;
  }

  /** Catalog membership as loaded, used to place created or opened instances after the pages. */
  isCatalogued(id: string): boolean {
    return this.catalogIds.includes(id);
  }
  /** Drops an instance from the loaded catalog order after a committed delete. */
  forgetCatalogued(id: string): void {
    this.catalogIds = this.catalogIds.filter(item => item !== id);
  }
  /** Reorders loaded catalog IDs by an authoritative order; unknown IDs keep their relative place. */
  applyCatalogOrder(order: readonly string[]): void {
    const listed = this.catalogIds.filter(id => order.includes(id));
    const ranked = [...listed].sort(
      (a, b) => order.indexOf(a) - order.indexOf(b),
    );
    let index = 0;
    this.catalogIds = this.catalogIds.map(id =>
      order.includes(id) ? ranked[index++] : id,
    );
  }
  get catalogOrder(): readonly string[] {
    return this.catalogIds;
  }
  /** Places a newly created instance after the loaded pages. */
  addCatalogued(id: string): void {
    if (!this.catalogIds.includes(id)) this.catalogIds.push(id);
  }
}
