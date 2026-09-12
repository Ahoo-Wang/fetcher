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

import { filter, type FilterExpression } from '@ahoo-wang/fetcher-wow';
import type { ViewEngine } from '../engine/ViewEngine.js';
import type { SessionStore } from '../engine/SessionStore.js';
import type { DashboardCandidate, ViewHost } from '../contracts/ViewHost.js';
import type {
  ViewDefinition,
  ViewInstance,
  ViewSource,
} from '../contracts/viewModel.js';
import type { DeepReadonly } from '../lib/types.js';
import type {
  FilterConfiguration,
  FilterValidationError,
} from '../filter/filterModel.js';
import { compileFilterConfiguration } from '../filter/filterConfigurationCompiler.js';
import { withQueryScope } from '../filter/filterScope.js';
import { copy, sameJsonState, message } from '../lib/snapshot.js';
import { RequestRunner } from '../engine/RequestRunner.js';
import {
  ViewServiceError,
  encodeViewResourceId,
} from '../contracts/viewServiceContract.js';
import { validateViewDefinition } from '../contracts/validation/definitionValidation.js';
import { validateViewInstance } from '../contracts/validation/instanceValidation.js';
import { validateDashboardConfig } from './dashboardValidation.js';
import {
  compileDashboardScope,
  validateDashboardExpression,
} from './dashboardFilters.js';
import type {
  DashboardConfig,
  DashboardPanel,
  DashboardSession,
  DashboardTransforms,
} from './dashboardModel.js';

export type DashboardPosition = ReturnType<ViewEngine['openPosition']>;
export interface DashboardPanelSnapshot {
  readonly panelId: string;
  readonly status: 'loading' | 'ready' | 'blocked' | 'error' | 'suspended';
  readonly loading: boolean;
  readonly blocked: boolean;
  readonly error: string | null;
  readonly instance?: DeepReadonly<
    Exclude<ViewInstance, { kind: 'dashboard' }>
  >;
  readonly definition?: DeepReadonly<ViewDefinition>;
  readonly position?: DashboardPosition;
  readonly scopeVersion: number;
  readonly referenceVersion: number;
  readonly filterId?: string;
}
export interface DashboardSnapshot {
  readonly session: DashboardSession;
  readonly config: DeepReadonly<DashboardConfig>;
  readonly applied: DeepReadonly<DashboardConfig>;
  readonly pending: boolean;
  readonly active: boolean;
  readonly editable: boolean;
  readonly validation: readonly FilterValidationError[];
  readonly error: string | null;
  readonly panels: Readonly<Record<string, DashboardPanelSnapshot>>;
}
interface PanelState {
  panel: DeepReadonly<DashboardPanel>;
  retainedBytes?: number;
  definitionBytes?: number;
  retained?: DeepReadonly<Exclude<ViewInstance, { kind: 'dashboard' }>>;
  instance?: DashboardPanelSnapshot['instance'];
  definition?: DashboardPanelSnapshot['definition'];
  source?: ViewSource;
  position?: DashboardPosition;
  scope?: FilterExpression;
  scopeVersion: number;
  referenceVersion: number;
  generation: number;
  status: DashboardPanelSnapshot['status'];
  error: string | null;
  filterId?: string;
  loading?: Promise<void>;
}

class BindingError extends Error {
  constructor(
    readonly filterId: string,
    error: unknown,
  ) {
    super(message(error));
  }
}

/** Composes saved references; the engine's existing positions own every data request. */
export class DashboardRuntime {
  private config: DeepReadonly<DashboardConfig>;
  private applied: DeepReadonly<DashboardConfig>;
  private sessionConfig: DeepReadonly<DashboardConfig>;
  private editorEpoch: number;
  private active = false;
  private disposed = false;
  private readonly panels = new Map<string, PanelState>();
  private readonly listeners = new Set<() => void>();
  private readonly loads: RequestRunner;
  private readonly unsubscribe: () => void;
  private snapshot!: DashboardSnapshot;
  private error: string | null = null;
  private lifetime = 0;
  private applying = 0;
  private preparing = 0;
  private committing = false;
  private batching = false;

  constructor(
    private readonly engine: ViewEngine,
    private currentId: string,
    private readonly store: SessionStore,
    private readonly host: ViewHost,
    private readonly transforms: DashboardTransforms,
    private readonly update: <T>(updater: () => T) => T,
  ) {
    const session = this.session();
    this.config = this.applied = this.sessionConfig = session.instance.config;
    this.editorEpoch = session.editorEpoch;
    this.loads = new RequestRunner({
      maxConcurrent: 4,
      maxQueued: 24,
      maxTimeoutMs: store.limits.loadTimeoutMs,
    });
    this.reconcile();
    this.reserveMetadata();
    this.unsubscribe = store.subscribe(() => this.changed());
    this.publish();
  }
  private jsonBytes(value: unknown): number {
    return new TextEncoder().encode(JSON.stringify(value)).byteLength;
  }
  private reserveMetadata(
    config = this.config,
    applied = this.applied,
    candidate?: { entry: PanelState; bytes: number },
  ): void {
    let bytes =
      this.jsonBytes(config) +
      (config === applied ? 0 : this.jsonBytes(applied));
    for (const entry of this.panels.values()) {
      if (
        !config.panels.some(
          panel =>
            panel.id === entry.panel.id &&
            panel.instanceId === entry.panel.instanceId,
        )
      )
        continue;
      bytes +=
        candidate?.entry === entry
          ? candidate.bytes
          : (entry.retainedBytes ?? 0) + (entry.definitionBytes ?? 0);
    }
    this.store.reserveDashboardMetadata(this.id, bytes);
  }
  readonly identity = crypto.randomUUID();
  get id(): string {
    return this.currentId;
  }
  /** Engine-only identity handoff; the authoritative receipt must name this local draft. */
  adoptSavedDraft(id: string): void {
    const target = this.store.find(id);
    if (
      target?.kind !== 'dashboard' ||
      target.createdFromDraft !== this.id ||
      this.store.find(this.id)
    )
      throw new Error('创建身份迁移无效');
    this.store.transferDashboardOwnership(this.id, id);
    this.currentId = id;
    this.config = this.sessionConfig = target.instance.config;
    this.editorEpoch = target.editorEpoch;
    this.publish();
  }
  private session(): DashboardSession {
    const session = this.store.session(this.id);
    if (session.kind !== 'dashboard') throw new Error('实例不是仪表盘');
    return session;
  }
  private assert(): void {
    if (this.disposed) throw new Error('仪表盘运行已释放');
    this.session();
  }
  private editable(): boolean {
    const session = this.session();
    if (!session.persisted) {
      const permissions = this.host.permission?.getDefinition?.();
      return (
        (session.instance.scope.type === 'personal'
          ? permissions?.createPersonal
          : permissions?.createShared) === true
      );
    }
    const permissions = this.engine.getPermissions(this.id);
    return (
      permissions.save || permissions.saveAsPersonal || permissions.saveAsShared
    );
  }
  get definition(): DeepReadonly<ViewDefinition> {
    return this.store.definition();
  }
  get filterCompilers() {
    return this.engine.filterCompilers;
  }
  get canDiscover(): boolean {
    return !!this.host.dashboard?.search;
  }
  get canOpenOriginal(): boolean {
    return !!this.host.dashboard?.openOriginal;
  }
  async searchCandidates(
    input: { query: string; cursor?: string },
    signal?: AbortSignal,
  ): Promise<{ items: DashboardCandidate[]; nextCursor: string | null }> {
    this.assert();
    if (!this.host.dashboard?.search) throw new Error('宿主未提供候选发现');
    if (
      typeof input.query !== 'string' ||
      input.query.length > 512 ||
      (input.cursor !== undefined &&
        (typeof input.cursor !== 'string' || input.cursor.length > 4096))
    )
      throw new Error('候选查询参数无效');
    const lifetime = this.lifetime;
    const controller = new AbortController();
    const cancel = () => controller.abort();
    if (signal?.aborted) controller.abort();
    signal?.addEventListener('abort', cancel, { once: true });
    try {
      const result = await this.loads.submit({
        key: 'search',
        policy: 'queue',
        timeoutMs: this.store.limits.loadTimeoutMs,
        controller,
        run: signal => this.host.dashboard!.search!(input, signal),
      }).completion;
      if (this.disposed || this.lifetime !== lifetime)
        throw new Error('候选请求已失效');
      if (
        !result ||
        !Array.isArray(result.items) ||
        result.items.length > 100 ||
        (result.nextCursor !== null &&
          (typeof result.nextCursor !== 'string' ||
            result.nextCursor.length > 4096))
      )
        throw new Error('候选响应无效或超限');
      for (const item of result.items) {
        encodeViewResourceId(item.id);
        encodeViewResourceId(item.definitionId);
        if (
          typeof item.title !== 'string' ||
          !item.title.trim() ||
          item.title.length > 4096 ||
          (item.kind !== 'record' && item.kind !== 'analysis')
        )
          throw new Error('候选实例无效');
      }
      return copy(result);
    } finally {
      signal?.removeEventListener('abort', cancel);
    }
  }
  openOriginal(panelId: string): void {
    this.assert();
    const panel = this.panels.get(panelId);
    if (
      !this.active ||
      !panel?.instance ||
      !panel.definition ||
      !this.host.dashboard?.openOriginal
    )
      throw new Error('原视图当前不可访问');
    this.host.dashboard.openOriginal({
      instanceId: panel.instance.id,
      definitionId: panel.definition.id,
    });
  }
  setEditorValidity(key: string, valid: boolean): void {
    this.assert();
    if (
      typeof valid !== 'boolean' ||
      !/^(filter|transform):/.test(key) ||
      key.length > 4096
    )
      throw new Error('编辑器状态无效');
    const session = this.session();
    const known = this.config.filters.some(
      item =>
        key === `filter:${item.id}` ||
        item.bindings.some(
          binding =>
            binding.kind === 'transform' &&
            key === `transform:${item.id}:${binding.panelId}`,
        ),
    );
    if (!known) {
      if (valid) return;
      throw new Error('编辑器已经移除');
    }
    if ((session.editorValidity[key] ?? true) === valid) return;
    this.store.patch(this.id, {
      kind: 'dashboard',
      editorValidity: { ...session.editorValidity, [key]: valid },
    });
  }
  getSnapshot = (): DashboardSnapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    if (!this.disposed) this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private validation(
    config = this.config,
    includeEditors = true,
  ): FilterValidationError[] {
    try {
      validateDashboardConfig(config, true, this.store.limits.maxConfigBytes, {
        maxPanels: this.store.limits.maxDashboardPanels,
        maxFilters: this.store.limits.maxDashboardFilters,
      });
      const definition = this.store.definition();
      const errors = config.filters.flatMap(item => {
        const compiled = compileFilterConfiguration(
          item.filters,
          definition.fields,
          definition.allowedOperators,
          this.engine.filterCompilers,
          definition.timeZone,
        );
        return compiled.expression
          ? compiled.errors
          : [...compiled.errors, { id: item.id, message: '全局筛选无效' }];
      });
      return [
        ...errors,
        ...Object.entries(includeEditors ? this.session().editorValidity : {})
          .filter(([, valid]) => !valid)
          .map(([id]) => ({ id, message: '编辑输入无效' })),
      ];
    } catch (error) {
      return [{ id: 'dashboard', message: message(error) }];
    }
  }
  private publish(): void {
    if (this.disposed || this.batching) return;
    const panels = Object.fromEntries(
      [...this.panels].map(([id, entry]) => {
        const session = entry.position
          ? this.store.find(entry.position.identity.id)
          : undefined;
        const queryLoading =
          session &&
          session.kind !== 'dashboard' &&
          (session.queryStatus === 'loading' ||
            session.queryStatus === 'waiting');
        const queryError =
          session &&
          session.kind !== 'dashboard' &&
          session.queryStatus === 'error'
            ? session.queryError
            : null;
        return [
          id,
          Object.freeze({
            panelId: id,
            status: queryError ? ('error' as const) : entry.status,
            loading: entry.status === 'loading' || !!queryLoading,
            blocked: entry.status === 'blocked',
            error: entry.error ?? queryError,
            instance: entry.instance,
            definition: entry.definition,
            position: entry.position,
            scopeVersion: entry.scopeVersion,
            referenceVersion: entry.referenceVersion,
            filterId: entry.filterId,
          }),
        ];
      }),
    );
    this.snapshot = Object.freeze({
      session:
        (this.store.find(this.id) as DashboardSession | undefined) ??
        this.snapshot?.session,
      config: this.config,
      applied: this.applied,
      pending:
        !sameJsonState(this.config.filters, this.applied.filters) ||
        this.config.panels.some(
          panel =>
            !this.applied.panels.some(
              applied =>
                applied.id === panel.id &&
                applied.instanceId === panel.instanceId,
            ),
        ),
      active: this.active,
      editable:
        !!this.store.find(this.id) &&
        this.store.getSnapshot().status === 'ready' &&
        this.editable(),
      validation: Object.freeze(
        this.store.getSnapshot().status === 'ready' ? this.validation() : [],
      ),
      error: this.error,
      panels: Object.freeze(panels),
    });
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (error) {
        console.error('仪表盘订阅回调失败', error);
      }
    }
  }
  private changed(): void {
    if (
      this.disposed ||
      !this.store.find(this.id) ||
      this.store.getSnapshot().status !== 'ready'
    )
      return;
    const session = this.session();
    if (session.instance.config !== this.sessionConfig) {
      if (!sameJsonState(session.instance.config, this.sessionConfig)) {
        this.config = session.instance.config;
        this.reconcile();
      }
      this.sessionConfig = session.instance.config;
    }
    const restored = session.editorEpoch !== this.editorEpoch;
    this.editorEpoch = session.editorEpoch;
    this.publish();
    if (restored)
      void this.apply().catch(error => {
        this.error = message(error);
        this.publish();
      });
  }
  edit(
    updater: (
      config: DeepReadonly<DashboardConfig>,
    ) => DeepReadonly<DashboardConfig>,
  ): void {
    this.assert();
    if (!this.editable()) throw new Error('没有仪表盘配置编辑权限');
    const next = this.update(() => updater(this.config));
    const replaced = new Set(
      next.panels
        .filter(panel =>
          this.config.panels.some(
            old => old.id === panel.id && old.instanceId !== panel.instanceId,
          ),
        )
        .map(panel => panel.id),
    );
    const ids = new Set(next.panels.map(panel => panel.id));
    const removed = new Set(
      this.config.panels
        .filter(panel => !ids.has(panel.id))
        .map(panel => panel.id),
    );
    const config = copy({
      ...next,
      filters: next.filters.map(item => ({
        ...item,
        bindings: item.bindings.filter(
          binding =>
            !removed.has(binding.panelId) && !replaced.has(binding.panelId),
        ),
        excludedPanelIds: item.excludedPanelIds.filter(
          id => !removed.has(id) && !replaced.has(id),
        ),
      })),
    });
    validateDashboardConfig(config, false, this.store.limits.maxConfigBytes, {
      maxPanels: this.store.limits.maxDashboardPanels,
      maxFilters: this.store.limits.maxDashboardFilters,
    });
    this.updateConfig(config, true);
  }
  setFilter(id: string, filters: DeepReadonly<FilterConfiguration>): void {
    this.assert();
    if (!this.config.filters.some(item => item.id === id))
      throw new Error('筛选项不存在');
    const config = copy({
      ...this.config,
      filters: this.config.filters.map(item =>
        item.id === id ? { ...item, filters } : item,
      ),
    });
    validateDashboardConfig(config, false, this.store.limits.maxConfigBytes, {
      maxPanels: this.store.limits.maxDashboardPanels,
      maxFilters: this.store.limits.maxDashboardFilters,
    });
    this.updateConfig(config, this.editable());
  }
  private updateConfig(
    config: DeepReadonly<DashboardConfig>,
    persist: boolean,
  ): void {
    this.reserveMetadata(config);
    this.config = config;
    if (persist) {
      this.sessionConfig = config;
      const session = this.session();
      const editorValidity = Object.fromEntries(
        Object.entries(session.editorValidity).filter(([key]) =>
          config.filters.some(
            item =>
              key === `filter:${item.id}` ||
              item.bindings.some(
                binding =>
                  binding.kind === 'transform' &&
                  key === `transform:${item.id}:${binding.panelId}`,
              ),
          ),
        ),
      );
      this.store.patch(this.id, {
        kind: 'dashboard',
        instance: { ...session.instance, config },
        editorValidity,
      });
      this.sessionConfig = this.session().instance.config;
    }
    this.reconcile();
    this.publish();
    if (this.active)
      void this.prepare().catch(error => {
        this.error = message(error);
        this.publish();
      });
  }
  private close(entry: PanelState): void {
    entry.generation++;
    for (const stage of ['instance', 'definition', 'source'])
      this.loads.cancel(`panel:${entry.panel.id}:${stage}`);
    entry.loading = undefined;
    const position = entry.position;
    entry.position = undefined;
    entry.source = undefined;
    position?.dispose();
  }
  private reconcile(): void {
    for (const [id, entry] of this.panels) {
      const panel = this.config.panels.find(item => item.id === id);
      if (!panel || panel.instanceId !== entry.panel.instanceId) {
        this.panels.delete(id);
        this.close(entry);
        this.applied = copy({
          ...this.applied,
          panels: this.applied.panels.filter(item => item.id !== id),
          filters: this.applied.filters.map(item => ({
            ...item,
            bindings: item.bindings.filter(binding => binding.panelId !== id),
            excludedPanelIds: item.excludedPanelIds.filter(
              value => value !== id,
            ),
          })),
        });
      }
    }
    for (const panel of this.config.panels) {
      const entry = this.panels.get(panel.id);
      if (entry) entry.panel = panel;
      else
        this.panels.set(panel.id, {
          panel,
          generation: 0,
          referenceVersion: 0,
          scopeVersion: 0,
          status: 'suspended',
          error: null,
        });
    }
    if (!this.config.filters.length && !this.applied.filters.length)
      this.applied = copy({ ...this.applied, panels: this.config.panels });
  }
  private current(entry: PanelState, generation: number): boolean {
    return (
      !this.disposed &&
      this.active &&
      this.panels.get(entry.panel.id) === entry &&
      entry.generation === generation
    );
  }
  private block(entry: PanelState, error: unknown, denied = false): void {
    this.close(entry);
    entry.scope = undefined;
    entry.scopeVersion++;
    entry.status = 'blocked';
    entry.error = message(error);
    entry.filterId = error instanceof BindingError ? error.filterId : undefined;
    if (denied) {
      entry.instance = entry.retained = entry.definition = undefined;
      entry.retainedBytes = entry.definitionBytes = 0;
      this.reserveMetadata();
    }
    this.publish();
  }
  private async load(entry: PanelState, reload = false): Promise<void> {
    if (entry.loading) return entry.loading;
    const generation = ++entry.generation;
    entry.status = 'loading';
    entry.error = null;
    const request = <T>(
      stage: string,
      run: (signal: AbortSignal) => Promise<T> | T,
    ) =>
      this.loads.submit({
        key: `panel:${entry.panel.id}:${stage}`,
        policy: 'queue',
        timeoutMs: this.store.limits.loadTimeoutMs,
        run: async signal => {
          if (!this.current(entry, generation))
            throw new Error('引用加载已取消');
          return run(signal);
        },
      }).completion;
    const operation = Promise.resolve().then(async () => {
      if (!this.current(entry, generation)) return;
      if (!this.host.instance?.load || !this.host.definition?.load)
        throw new Error('宿主未提供引用加载服务');
      const loaded = await request('instance', signal =>
        this.host.instance!.load!(entry.panel.instanceId, signal),
      );
      if (!this.current(entry, generation)) return;
      if (loaded.id !== entry.panel.instanceId || loaded.kind === 'dashboard')
        throw new Error('引用身份无效或仪表盘嵌套');
      const definition = await request('definition', signal =>
        this.host.definition!.load!(loaded.definitionId, signal),
      );
      if (!this.current(entry, generation)) return;
      if (definition.id !== loaded.definitionId)
        throw new Error('引用定义身份无效');
      validateViewDefinition(definition);
      validateViewInstance(loaded, definition, entry.panel.instanceId);
      const instance = reload || !entry.retained ? loaded : entry.retained;
      validateViewInstance(instance, definition, entry.panel.instanceId);
      if (!definition.sourceId) throw new Error('引用缺少查询源');
      const source = await request('source', () =>
        this.host.resolveSource(definition.sourceId!),
      );
      if (!this.current(entry, generation)) return;
      const retainedBytes = this.jsonBytes(instance),
        definitionBytes = this.jsonBytes(definition);
      this.reserveMetadata(this.config, this.applied, {
        entry,
        bytes: retainedBytes + definitionBytes,
      });
      entry.retainedBytes = retainedBytes;
      entry.definitionBytes = definitionBytes;
      if (reload || !entry.retained) entry.referenceVersion++;
      entry.instance = entry.retained = copy(instance);
      entry.definition = copy(definition);
      entry.source = new Proxy(source, {
        get: (target, key) => {
          const value: unknown = Reflect.get(target, key, target);
          if (typeof value !== 'function') return value;
          return (...args: unknown[]) =>
            Promise.resolve()
              .then(() =>
                (value as (...args: unknown[]) => unknown).apply(target, args),
              )
              .catch((error: unknown) => {
                if (
                  !(
                    args[2] instanceof AbortController && args[2].signal.aborted
                  ) &&
                  this.current(entry, generation) &&
                  error instanceof ViewServiceError &&
                  error.code === 'FORBIDDEN'
                )
                  this.block(entry, error, true);
                throw error;
              });
        },
      });
      entry.status = 'ready';
    });
    entry.loading = operation
      .catch((error: unknown) => {
        if (this.current(entry, generation))
          this.block(
            entry,
            error,
            error instanceof ViewServiceError && error.code === 'FORBIDDEN',
          );
      })
      .finally(() => {
        if (entry.generation === generation) entry.loading = undefined;
        if (!this.disposed) this.publish();
      });
    this.publish();
    return entry.loading;
  }
  private scope(
    entry: PanelState,
    config: DeepReadonly<DashboardConfig>,
  ): FilterExpression {
    if (!entry.instance || !entry.definition)
      throw new Error(entry.error ?? '引用尚未加载');
    if (
      !config.panels.some(
        panel =>
          panel.id === entry.panel.id &&
          panel.instanceId === entry.panel.instanceId,
      )
    )
      throw new Error('面板等待配置并查询');
    const expressions = config.filters
      .filter(item => !item.excludedPanelIds.includes(entry.panel.id))
      .map(item => {
        try {
          return compileDashboardScope(
            item,
            entry.panel,
            this.store.definition(),
            entry.definition!,
            entry.instance!,
            this.transforms,
            this.engine.filterCompilers,
          );
        } catch (error) {
          throw new BindingError(item.id, error);
        }
      });
    const expression =
      expressions.length === 1
        ? expressions[0]
        : expressions.length
          ? filter.and(expressions)
          : filter.matchAll();
    validateDashboardExpression(expression, entry.definition);
    const own = compileFilterConfiguration(
      entry.instance.config.filters,
      entry.definition.fields,
      entry.definition.allowedOperators,
      this.engine.filterCompilers,
      entry.definition.timeZone,
    );
    if (own.errors.length || !own.expression)
      throw new Error('引用筛选配置无效');
    validateDashboardExpression(
      withQueryScope(own.expression, expression),
      entry.definition,
    );
    return expression;
  }
  private async execute(entry: PanelState): Promise<void> {
    const position = entry.position;
    if (!position || !this.active || this.disposed) return;
    entry.error = null;
    this.publish();
    if (!this.active || this.disposed || entry.position !== position) return;
    try {
      if (position.kind === 'record') await position.commands.refresh();
      else await position.commands.run();
    } catch (error) {
      if (entry.position === position && this.active && !this.disposed) {
        entry.error = message(error);
        this.publish();
      }
    }
  }
  private async commit(
    config: DeepReadonly<DashboardConfig>,
    apply: boolean,
  ): Promise<void> {
    const lifetime = this.lifetime;
    const decisions = [...this.panels.values()].map(entry => {
      try {
        return { entry, expression: this.scope(entry, config) };
      } catch (error) {
        return { entry, error };
      }
    });
    if (apply) this.reserveMetadata(this.config, config);
    this.batching = true;
    if (apply) this.applied = config;
    const changed: PanelState[] = [];
    for (const decision of decisions) {
      if (!this.active || this.disposed || lifetime !== this.lifetime) break;
      const { entry } = decision;
      const generation = entry.generation;
      if (this.panels.get(entry.panel.id) !== entry) continue;
      if (!decision.expression) {
        this.block(entry, decision.error);
        continue;
      }
      const unchanged =
        entry.position && sameJsonState(entry.scope, decision.expression);
      if (unchanged) continue;
      try {
        if (!entry.position) {
          if (!entry.instance || !entry.definition || !entry.source) continue;
          const opened = this.engine.openPosition(
            copy(entry.instance) as Exclude<
              ViewInstance,
              { kind: 'dashboard' }
            >,
            copy(entry.definition),
            { queryPolicy: 'queue', source: entry.source },
          );
          if (!this.current(entry, generation) || lifetime !== this.lifetime) {
            opened.dispose();
            break;
          }
          entry.position = opened;
        }
        this.store.registerDashboardPosition(
          entry.position.identity.id,
          this.id,
        );
        this.engine.setPositionScope(
          entry.position.identity.id,
          decision.expression,
        );
        if (!this.current(entry, generation) || lifetime !== this.lifetime)
          break;
        entry.scope = decision.expression;
        entry.scopeVersion++;
        entry.status = 'ready';
        entry.error = null;
        entry.filterId = undefined;
        changed.push(entry);
      } catch (error) {
        this.block(entry, error);
      }
    }
    this.batching = false;
    this.publish();
    await Promise.all(changed.map(entry => this.execute(entry)));
  }
  private async prepare(): Promise<void> {
    if (!this.active || this.disposed) return;
    const lifetime = this.lifetime;
    const preparation = ++this.preparing;
    await Promise.all(
      [...this.panels.values()]
        .filter(
          entry =>
            !entry.position && !entry.source && entry.status !== 'blocked',
        )
        .map(entry => this.load(entry)),
    );
    if (
      !this.active ||
      this.disposed ||
      this.committing ||
      this.preparing !== preparation ||
      this.lifetime !== lifetime
    )
      return;
    const issues = this.validation(this.applied, false);
    if (issues.length) {
      this.error = issues.map(issue => issue.message).join('；');
      for (const entry of this.panels.values()) this.block(entry, this.error);
      return;
    }
    await this.commit(this.applied, false);
  }
  assertSavable(): void {
    this.assert();
    const issues = this.validation();
    if (issues.length)
      throw new Error(issues.map(issue => issue.message).join('；'));
    for (const item of this.config.filters)
      for (const binding of item.bindings) {
        if (
          binding.kind === 'transform' &&
          !Object.prototype.hasOwnProperty.call(this.transforms, binding.name)
        )
          throw new Error(`缺少筛选转换器：${binding.name}`);
      }
    for (const entry of this.panels.values())
      if (entry.instance && entry.definition) this.scope(entry, this.config);
  }
  async apply(): Promise<void> {
    this.assert();
    const issues = this.validation();
    if (issues.length) {
      this.error = issues.map(issue => issue.message).join('；');
      this.publish();
      throw new Error(this.error);
    }
    const config = copy(this.config);
    const transaction = ++this.applying;
    ++this.preparing;
    this.committing = true;
    this.error = null;
    if (!this.active) {
      this.reserveMetadata(this.config, config);
      this.applied = config;
      this.committing = false;
      this.publish();
      return;
    }
    await Promise.all(
      [...this.panels.values()]
        .filter(entry => !entry.source)
        .map(entry => this.load(entry)),
    );
    if (!this.active || this.disposed || this.applying !== transaction) return;
    this.committing = false;
    await this.commit(config, true);
  }
  async refresh(panelId?: string): Promise<void> {
    this.assert();
    const entries = panelId
      ? [this.panels.get(panelId)].filter(
          (entry): entry is PanelState => !!entry,
        )
      : [...this.panels.values()];
    await Promise.all(entries.map(entry => this.execute(entry)));
  }
  async reloadReference(panelId: string): Promise<void> {
    this.assert();
    const entry = this.panels.get(panelId);
    if (!entry) throw new Error('面板不存在');
    this.close(entry);
    entry.instance = entry.definition = entry.retained = undefined;
    entry.scope = undefined;
    if (!this.active) {
      entry.status = 'suspended';
      this.publish();
      return;
    }
    await this.load(entry, true);
    if (this.active && !this.disposed) await this.commit(this.applied, false);
  }
  suspend(): void {
    if (this.disposed || !this.active) return;
    this.active = false;
    ++this.lifetime;
    this.loads.cancel('search');
    ++this.applying;
    for (const entry of this.panels.values()) {
      this.close(entry);
      entry.status = 'suspended';
      entry.instance = entry.definition = undefined;
      entry.definitionBytes = 0;
    }
    this.reserveMetadata();
    this.publish();
  }
  async resume(): Promise<void> {
    this.assert();
    if (this.active) return;
    this.active = true;
    this.committing = false;
    await this.prepare();
  }
  dispose(): void {
    if (this.disposed) return;
    this.suspend();
    this.disposed = true;
    this.unsubscribe();
    this.loads.dispose();
    this.panels.clear();
    this.store.releaseDashboardMetadata(this.id);
    this.listeners.clear();
  }
}
