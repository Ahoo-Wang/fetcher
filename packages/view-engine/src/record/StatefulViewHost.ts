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

import {
  summaryOf,
  type ViewCreateInput,
  type ViewDefinition,
  type ViewDefinitionPermissions,
  type ViewInstance,
  type ViewInstancePermissions,
  type ViewInstanceSummary,
} from '../contracts/viewModel.js';
import type { ViewHost } from '../contracts/ViewHost.js';
import {
  createViewInput,
  validateLocalViewState,
  type ServiceState,
  type StoredInstance,
  type StoredPreference,
  type StoredReceipt,
} from './localViewState.js';
import { copy, message, sameJsonState } from '../lib/snapshot.js';
import { validateViewDefinition } from '../contracts/validation/definitionValidation.js';
import {
  readLocalInstances,
  validateViewInstance,
} from '../contracts/validation/instanceValidation.js';
import {
  ViewServiceError,
  applyOrderChange,
  encodeViewResourceId,
  type ConfigurationWriteContext,
  type ListOptions,
  type OperationReference,
  type Page,
  type PreferenceState,
  type ReadOptions,
  type ViewDeleteReceipt,
  type ViewOrderChange,
  type WriteContext,
  type WriteObservation,
  type WritePrecondition,
} from '../contracts/viewServiceContract.js';

export interface StatefulViewHostOptions {
  /** Trusted service/tenant namespace, independent of the current user. */
  serviceKey: string;
  /** Trusted current user identity; never take this from a write payload. */
  scopeKey: string;
  definition: ViewDefinition;
  /** Seed instances: public ones are shared, personal ones are copied for each new user. */
  instances: readonly ViewInstance[];
  /** Host-declared starting view for users without a preference document. */
  defaultInstanceId?: string | null;
  resolveSource: ViewHost['resolveSource'];
  instancePermissions?: (
    instance: ViewInstanceSummary,
  ) => ViewInstancePermissions;
  canReorder?: () => boolean;
  canSetDefault?: () => boolean;
  definitionPermissions?: () => {
    createPersonal: boolean;
    createShared: boolean;
  };
}
export interface ViewStateChange<T> {
  result: T;
  value?: string | null;
}
export type ViewStateTransaction = <T>(
  key: string,
  change: (raw: string | null | undefined) => ViewStateChange<T>,
  signal?: AbortSignal,
) => Promise<T>;

const DEFAULT_PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

interface CatalogCursor {
  offset: number;
  query: string;
  preference: string | null;
  /** Catalog membership version; any instance write since the page was read expires the cursor. */
  catalog: number;
}
function encodeCursor(cursor: CatalogCursor): string {
  return btoa(
    String.fromCharCode(...new TextEncoder().encode(JSON.stringify(cursor))),
  );
}
function decodeCursor(value: unknown): CatalogCursor {
  try {
    if (typeof value !== 'string' || !value) throw new Error();
    const bytes = Uint8Array.from(atob(value), char => char.charCodeAt(0));
    const parsed: unknown = JSON.parse(new TextDecoder().decode(bytes));
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      !Number.isSafeInteger((parsed as CatalogCursor).offset) ||
      (parsed as CatalogCursor).offset < 0 ||
      typeof (parsed as CatalogCursor).query !== 'string' ||
      !Number.isSafeInteger((parsed as CatalogCursor).catalog) ||
      !(
        (parsed as CatalogCursor).preference === null ||
        typeof (parsed as CatalogCursor).preference === 'string'
      )
    )
      throw new Error();
    return parsed as CatalogCursor;
  } catch {
    throw new ViewServiceError('CURSOR_EXPIRED', '目录游标无效或已过期');
  }
}

interface WriteRequest {
  resource: StoredReceipt['resource'];
  action: StoredReceipt['action'];
  targetId: string | null;
  input: unknown;
  context: WriteContext;
}

/** Shared view-domain behavior for the actual memory and IndexedDB stores. Not a public storage adapter. */
export abstract class StatefulViewHost implements ViewHost {
  readonly definition = {
    // async 仅为满足 Promise 契约；本地定义读取无异步步骤。
    // eslint-disable-next-line @typescript-eslint/require-await
    load: async (
      id: string,
      options?: ReadOptions,
    ): Promise<ViewDefinition> => {
      options?.signal?.throwIfAborted();
      this.assertDefinition(id);
      return structuredClone(this.storedDefinition);
    },
  };
  readonly instance = {
    list: async (
      id: string,
      options: ListOptions = {},
    ): Promise<Page<ViewInstanceSummary>> => {
      this.assertDefinition(id);
      const query = options.query ?? '';
      if (typeof query !== 'string')
        throw new ViewServiceError(
          'INVALID_ARGUMENT',
          '目录搜索词必须是字符串',
        );
      const limit = options.limit ?? DEFAULT_PAGE_SIZE;
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_PAGE_SIZE)
        throw new ViewServiceError(
          'INVALID_ARGUMENT',
          `目录分页大小必须在 1 到 ${MAX_PAGE_SIZE} 之间`,
        );
      return this.transaction(
        state => {
          const preference = this.preferenceOf(state)?.revision ?? null;
          const catalog = state.catalogRevision;
          const cursor =
            options.cursor == null
              ? { offset: 0, query, preference, catalog }
              : decodeCursor(options.cursor);
          if (
            cursor.query !== query ||
            cursor.preference !== preference ||
            cursor.catalog !== catalog
          )
            throw new ViewServiceError(
              'CURSOR_EXPIRED',
              '目录内容、条件或个人顺序已变化，请重新加载目录',
            );
          const needle = query.trim().toLocaleLowerCase();
          const matched = this.ordered(state, this.options.scopeKey).filter(
            item => !needle || item.title.toLocaleLowerCase().includes(needle),
          );
          const items = matched
            .slice(cursor.offset, cursor.offset + limit)
            .map(item => summaryOf(this.dto(item)));
          const end = cursor.offset + items.length;
          return {
            items,
            nextCursor:
              end < matched.length
                ? encodeCursor({ offset: end, query, preference, catalog })
                : null,
            total: matched.length,
          };
        },
        false,
        options.signal,
      );
    },
    load: async (id: string, options?: ReadOptions): Promise<ViewInstance> => {
      return this.transaction(
        state => this.dto(this.find(state, id)),
        false,
        options?.signal,
      );
    },
    create: async (
      input: ViewCreateInput,
      context: ConfigurationWriteContext,
    ): Promise<WriteObservation<ViewInstance>> => {
      if (!input || typeof input !== 'object' || Array.isArray(input))
        throw new ViewServiceError(
          'INVALID_ARGUMENT',
          '创建正文必须为视图对象',
        );
      const body = createViewInput(input);
      return this.write<ViewInstance>(
        {
          resource: 'instance',
          action: 'create',
          targetId: null,
          input: {
            body,
            definitionRevision: context?.definitionRevision ?? null,
          },
          context,
        },
        state => {
          this.assertDefinitionRevision(context.definitionRevision);
          const candidate = {
            ...copy(body),
            id: crypto.randomUUID(),
            revision: crypto.randomUUID(),
          };
          this.validate(candidate);
          if (
            candidate.scope.type === 'public' &&
            candidate.scope.source === 'system'
          )
            throw new ViewServiceError(
              'FORBIDDEN',
              '系统视图只能通过初始配置提供',
            );
          const allowed =
            candidate.kind === 'dashboard'
              ? {
                  saveAsPersonal:
                    this.permission.getDefinition().createPersonal === true,
                  saveAsShared:
                    this.permission.getDefinition().createShared === true,
                }
              : this.permission.getInstance(summaryOf(candidate));
          if (
            !(candidate.scope.type === 'personal'
              ? allowed.saveAsPersonal
              : allowed.saveAsShared)
          )
            throw new ViewServiceError('FORBIDDEN', '没有创建视图权限');
          state.instances.push({
            ...candidate,
            ownerKey:
              candidate.scope.type === 'personal'
                ? this.options.scopeKey
                : null,
          });
          state.catalogRevision += 1;
          return { value: this.dto(candidate), revision: candidate.revision };
        },
      );
    },
    save: async (
      instance: ViewInstance,
      context: ConfigurationWriteContext,
    ): Promise<WriteObservation<ViewInstance>> => {
      return this.write<ViewInstance>(
        {
          resource: 'instance',
          action: 'save',
          targetId:
            instance &&
            typeof instance === 'object' &&
            typeof instance.id === 'string'
              ? instance.id
              : null,
          input: {
            instance,
            definitionRevision: context?.definitionRevision ?? null,
          },
          context,
        },
        state => {
          this.validate(instance);
          this.assertDefinitionRevision(context.definitionRevision);
          const previous = this.writable(
            state,
            instance.id,
            instance.revision,
            'save',
          );
          if (previous.kind !== instance.kind)
            throw new ViewServiceError(
              'INVALID_ARGUMENT',
              '保存不能改变视图类型',
            );
          if (!sameJsonState(previous.scope, instance.scope))
            throw new ViewServiceError(
              'INVALID_ARGUMENT',
              '保存不能改变视图可见范围，请另存为',
            );
          const saved = {
            ...copy(this.dto(instance)),
            ownerKey: previous.ownerKey,
            revision: crypto.randomUUID(),
          };
          state.instances[state.instances.indexOf(previous)] = saved;
          state.catalogRevision += 1;
          return { value: this.dto(saved), revision: saved.revision };
        },
      );
    },
    rename: async (
      id: string,
      title: string,
      expectedRevision: string,
      context: WriteContext,
    ): Promise<WriteObservation<ViewInstance>> => {
      return this.write<ViewInstance>(
        {
          resource: 'instance',
          action: 'rename',
          targetId: typeof id === 'string' ? id : null,
          input: { title, expectedRevision },
          context,
        },
        state => {
          const previous = this.writable(state, id, expectedRevision, 'rename');
          const next = {
            ...previous,
            title: typeof title === 'string' ? title.trim() : title,
            revision: crypto.randomUUID(),
          };
          this.validate(next);
          state.instances[state.instances.indexOf(previous)] = next;
          state.catalogRevision += 1;
          return { value: this.dto(next), revision: next.revision };
        },
      );
    },
    delete: async (
      id: string,
      expectedRevision: string,
      context: WriteContext,
    ): Promise<WriteObservation<ViewDeleteReceipt>> => {
      return this.write<ViewDeleteReceipt>(
        {
          resource: 'instance',
          action: 'delete',
          targetId: typeof id === 'string' ? id : null,
          input: { expectedRevision },
          context,
        },
        state => {
          encodeViewResourceId(id);
          const previous = this.writable(state, id, expectedRevision, 'delete');
          state.instances.splice(state.instances.indexOf(previous), 1);
          state.catalogRevision += 1;
          const revision = crypto.randomUUID();
          return { value: { id, revision }, revision };
        },
      );
    },
  };
  readonly permission = {
    getInstance: (
      instance: ViewInstanceSummary,
    ): Required<ViewInstancePermissions> => {
      const system =
        instance.scope.type === 'public' && instance.scope.source === 'system';
      const policy = this.options.instancePermissions?.(
        structuredClone(instance),
      ) ?? {
        save: true,
        rename: true,
        delete: true,
        saveAsPersonal: true,
        saveAsShared: true,
      };
      return {
        save: !system && policy.save === true,
        rename: !system && policy.rename === true,
        delete: !system && policy.delete === true,
        saveAsPersonal: policy.saveAsPersonal === true,
        saveAsShared: policy.saveAsShared === true,
      };
    },
    getDefinition: (): Required<ViewDefinitionPermissions> => {
      return {
        reorder: this.options.canReorder?.() ?? true,
        setDefault: this.options.canSetDefault?.() ?? true,
        createPersonal:
          this.options.definitionPermissions?.().createPersonal === true,
        createShared:
          this.options.definitionPermissions?.().createShared === true,
      };
    },
    subscribe: (listener: () => void): (() => void) => {
      this.permissionListeners.add(listener);
      return () => {
        this.permissionListeners.delete(listener);
      };
    },
  };
  readonly preference = {
    load: async (
      id: string,
      options?: ReadOptions,
    ): Promise<PreferenceState> => {
      this.assertDefinition(id);
      return this.transaction(
        state => this.preferenceState(state),
        false,
        options?.signal,
      );
    },
    saveOrder: async (
      id: string,
      change: ViewOrderChange,
      precondition: WritePrecondition,
      context: WriteContext,
    ): Promise<WriteObservation<PreferenceState>> => {
      return this.write<PreferenceState>(
        {
          resource: 'preference',
          action: 'saveOrder',
          targetId: id,
          input: { change, precondition },
          context,
        },
        state => {
          this.assertDefinition(id);
          if (!this.permission.getDefinition().reorder)
            throw new ViewServiceError('FORBIDDEN', '没有视图排序权限');
          if (
            !change ||
            typeof change !== 'object' ||
            !Array.isArray(change.scopeInstanceIds) ||
            !Array.isArray(change.orderedInstanceIds)
          )
            throw new ViewServiceError(
              'INVALID_ARGUMENT',
              '排序必须提供作用集合与目标顺序',
            );
          const visible = new Set(this.visible(state).map(item => item.id));
          for (const item of change.scopeInstanceIds)
            if (typeof item !== 'string' || !visible.has(item))
              throw new ViewServiceError(
                'NOT_FOUND',
                '排序作用集合包含不可见的视图，请重新加载目录',
              );
          const current = this.checkedPreference(state, precondition);
          const next: StoredPreference = {
            revision: crypto.randomUUID(),
            order: applyOrderChange(current?.order ?? [], change),
            defaultInstanceId: current?.defaultInstanceId ?? null,
          };
          this.storePreference(state, next);
          return {
            value: this.preferenceState(state),
            revision: next.revision,
          };
        },
      );
    },
    saveDefault: async (
      id: string,
      instanceId: string | null,
      precondition: WritePrecondition,
      context: WriteContext,
    ): Promise<WriteObservation<PreferenceState>> => {
      return this.write<PreferenceState>(
        {
          resource: 'preference',
          action: 'saveDefault',
          targetId: id,
          input: { instanceId, precondition },
          context,
        },
        state => {
          this.assertDefinition(id);
          if (!this.permission.getDefinition().setDefault)
            throw new ViewServiceError('FORBIDDEN', '没有默认视图权限');
          if (instanceId !== null) this.find(state, instanceId);
          const current = this.checkedPreference(state, precondition);
          const next: StoredPreference = {
            revision: crypto.randomUUID(),
            order: current?.order ?? [],
            defaultInstanceId: instanceId,
          };
          this.storePreference(state, next);
          return {
            value: this.preferenceState(state),
            revision: next.revision,
          };
        },
      );
    },
  };
  readonly operation = {
    reconcile: async (
      reference: OperationReference,
      options?: ReadOptions,
    ): Promise<WriteObservation<unknown>> => {
      if (
        !reference ||
        (reference.resource !== 'instance' &&
          reference.resource !== 'preference') ||
        typeof reference.requestId !== 'string' ||
        !reference.requestId.trim()
      )
        throw new ViewServiceError('INVALID_ARGUMENT', '操作引用无效');
      this.assertDefinition(reference.definitionId);
      return this.transaction(
        state => {
          const receipt =
            state.receipts[
              this.receiptKey(reference.resource, reference.requestId)
            ];
          if (
            !receipt ||
            (reference.targetId !== undefined &&
              receipt.targetId !== null &&
              receipt.targetId !== reference.targetId)
          )
            return {
              outcome: 'unknown',
              issue: { code: 'NOT_FOUND', message: '尚未找到该请求的回执' },
            };
          return copy(receipt.observation);
        },
        false,
        options?.signal,
      );
    },
  };
  readonly storageKey: string;
  private readonly storedDefinition: ViewDefinition;
  private readonly seeds: readonly ViewInstance[];
  private readonly seedDefault: string | null;
  private readonly options: StatefulViewHostOptions;
  private readonly permissionListeners = new Set<() => void>();

  protected constructor(
    options: StatefulViewHostOptions,
    private readonly transact: ViewStateTransaction,
  ) {
    if (
      ![options.scopeKey, options.serviceKey].every(
        value => typeof value === 'string' && value.trim(),
      )
    )
      throw new ViewServiceError(
        'INVALID_ARGUMENT',
        'serviceKey 和 scopeKey 不能为空',
      );
    this.storedDefinition = copy(options.definition);
    validateViewDefinition(this.storedDefinition);
    try {
      this.seeds = copy(
        readLocalInstances(options.instances, this.storedDefinition),
      );
      const seedDefault = options.defaultInstanceId ?? null;
      if (
        seedDefault !== null &&
        (typeof seedDefault !== 'string' ||
          !this.seeds.some(item => item.id === seedDefault))
      )
        throw new Error('默认视图必须为初始实例中的 ID 或 null');
      this.seedDefault = seedDefault;
    } catch (error) {
      throw new ViewServiceError('INVALID_ARGUMENT', message(error));
    }
    this.options = { ...options };
    this.storageKey = `fve:views:${JSON.stringify([options.serviceKey, this.storedDefinition.id])}`;
  }

  resolveSource(id: string) {
    if (id !== this.storedDefinition.sourceId)
      throw new ViewServiceError('NOT_FOUND', '视图数据源不存在');
    return this.options.resolveSource(id);
  }

  /** Notify engines that the policy callbacks would now answer differently. */
  publishPermissions(): void {
    this.permissionListeners.forEach(listener => listener());
  }

  /** Administrative fixture reset for this service/definition, across its users. Not a REST operation. */
  async reset(): Promise<void> {
    await this.transact(this.storageKey, () => ({
      value: null,
      result: undefined,
    }));
  }

  private assertDefinition(id: string): void {
    encodeViewResourceId(id);
    if (id !== this.storedDefinition.id)
      throw new ViewServiceError('NOT_FOUND', '视图定义不存在');
  }
  private assertDefinitionRevision(revision: string | undefined): void {
    if (
      revision !== undefined &&
      this.storedDefinition.revision !== undefined &&
      revision !== this.storedDefinition.revision
    )
      throw new ViewServiceError(
        'DEFINITION_CHANGED',
        '视图定义已更新，请按当前定义重新校验后保存',
      );
  }
  private dto({
    id,
    definitionId,
    kind,
    title,
    scope,
    revision,
    config,
  }: ViewInstance): ViewInstance {
    return {
      id,
      definitionId,
      kind,
      title,
      scope,
      revision,
      config,
    } as ViewInstance;
  }
  private visible(state: ServiceState, scopeKey = this.options.scopeKey) {
    return state.instances.filter(
      item => item.ownerKey === null || item.ownerKey === scopeKey,
    );
  }
  /** Seed order first, then creation order; the base before any personal ordering. */
  private baseOrder(state: ServiceState, scopeKey: string): StoredInstance[] {
    const visible = this.visible(state, scopeKey);
    const seedIndex = new Map(
      this.seeds.map((item, index) => [item.id, index]),
    );
    return [...visible].sort((a, b) => {
      const left = seedIndex.get(a.id) ?? Number.POSITIVE_INFINITY;
      const right = seedIndex.get(b.id) ?? Number.POSITIVE_INFINITY;
      return left === right
        ? visible.indexOf(a) - visible.indexOf(b)
        : left - right;
    });
  }
  /** Own-property read: a scope key such as `constructor` must not resolve through the prototype. */
  private preferenceOf(
    state: ServiceState,
    scopeKey = this.options.scopeKey,
  ): StoredPreference | undefined {
    return Object.prototype.hasOwnProperty.call(state.preferences, scopeKey)
      ? state.preferences[scopeKey]
      : undefined;
  }
  private storePreference(state: ServiceState, next: StoredPreference): void {
    Object.defineProperty(state.preferences, this.options.scopeKey, {
      value: next,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  private ordered(state: ServiceState, scopeKey: string): StoredInstance[] {
    const base = this.baseOrder(state, scopeKey);
    const explicit = this.preferenceOf(state, scopeKey)?.order ?? [];
    return [
      ...explicit.flatMap(id => base.filter(item => item.id === id)),
      ...base.filter(item => !explicit.includes(item.id)),
    ];
  }
  private preferenceState(state: ServiceState): PreferenceState {
    const stored = this.preferenceOf(state);
    const defaultInstanceId = stored
      ? stored.defaultInstanceId
      : this.seedDefault;
    const visible = this.visible(state);
    return {
      revision: stored?.revision ?? null,
      order: [...(stored?.order ?? [])],
      defaultInstanceId,
      effectiveDefaultInstanceId:
        defaultInstanceId !== null &&
        visible.some(item => item.id === defaultInstanceId)
          ? defaultInstanceId
          : null,
    };
  }
  private checkedPreference(
    state: ServiceState,
    precondition: WritePrecondition,
  ): StoredPreference | undefined {
    const current = this.preferenceOf(state);
    if (!precondition || typeof precondition !== 'object')
      throw new ViewServiceError(
        'PRECONDITION_REQUIRED',
        '偏好写入需要 absent 或 matches 前提',
      );
    if (precondition.type === 'absent') {
      if (current)
        throw new ViewServiceError(
          'REVISION_CONFLICT',
          '个人偏好已存在，请重新加载后再修改',
        );
      return undefined;
    }
    if (
      precondition.type !== 'matches' ||
      typeof precondition.revision !== 'string' ||
      !precondition.revision
    )
      throw new ViewServiceError(
        'PRECONDITION_REQUIRED',
        '偏好写入需要 absent 或 matches 前提',
      );
    if (!current || current.revision !== precondition.revision)
      throw new ViewServiceError(
        'REVISION_CONFLICT',
        '个人偏好已被更新，请重新加载',
      );
    return current;
  }
  private find(state: ServiceState, id: string): StoredInstance {
    encodeViewResourceId(id);
    const instance = this.visible(state).find(item => item.id === id);
    if (!instance) throw new ViewServiceError('NOT_FOUND', `视图 ${id} 不存在`);
    return instance;
  }
  private writable(
    state: ServiceState,
    id: string,
    revision: string | undefined,
    action: 'save' | 'rename' | 'delete',
  ): StoredInstance {
    const instance = this.find(state, id);
    if (!this.permission.getInstance(summaryOf(this.dto(instance)))[action])
      throw new ViewServiceError(
        'FORBIDDEN',
        '系统视图或未授权视图不能修改或删除',
      );
    if (!revision)
      throw new ViewServiceError(
        'PRECONDITION_REQUIRED',
        '写入需要当前 revision，请重新加载',
      );
    if (instance.revision !== revision)
      throw new ViewServiceError(
        'REVISION_CONFLICT',
        '视图已被更新，请重新加载',
      );
    return instance;
  }
  private validate(value: unknown): void {
    try {
      validateViewInstance(value, this.storedDefinition);
    } catch (error) {
      throw new ViewServiceError('INVALID_ARGUMENT', message(error));
    }
  }
  /** The grant an action needed when it was accepted, evaluated against the current policy. */
  private assertReplayAllowed(receipt: StoredReceipt): void {
    const definition = this.permission.getDefinition();
    if (receipt.resource === 'preference') {
      const allowed =
        receipt.action === 'saveOrder'
          ? definition.reorder
          : definition.setDefault;
      if (!allowed)
        throw new ViewServiceError(
          'FORBIDDEN',
          '当前主体不再拥有此偏好操作权限',
        );
      return;
    }
    const value =
      receipt.observation.outcome === 'committed'
        ? (receipt.observation.value as { id?: unknown; scope?: unknown })
        : undefined;
    const target =
      value && typeof value === 'object' && typeof value.id === 'string'
        ? (value as ViewInstance)
        : undefined;
    if (!target) return;
    if (receipt.action === 'delete') {
      // A delete receipt only names the id; the instance is gone, so no scope check applies.
      return;
    }
    const grants = this.permission.getInstance(summaryOf(target));
    const allowed =
      receipt.action === 'create'
        ? target.kind === 'dashboard'
          ? target.scope.type === 'personal'
            ? definition.createPersonal
            : definition.createShared
          : target.scope.type === 'personal'
            ? grants.saveAsPersonal
            : grants.saveAsShared
        : receipt.action === 'save'
          ? grants.save
          : receipt.action === 'rename'
            ? grants.rename
            : true;
    if (!allowed)
      throw new ViewServiceError('FORBIDDEN', '当前主体不再拥有此写入权限');
  }
  private receiptKey(resource: StoredReceipt['resource'], requestId: string) {
    return JSON.stringify([this.options.scopeKey, resource, requestId]);
  }
  private readState(raw: string | null | undefined): {
    state: ServiceState;
    seeded: boolean;
  } {
    let state: ServiceState;
    try {
      state =
        raw == null
          ? {
              instances: this.seeds
                .filter(item => item.scope.type === 'public')
                .map(item => ({
                  ...item,
                  ownerKey: null,
                  revision: crypto.randomUUID(),
                })),
              seeded: [],
              catalogRevision: 0,
              preferences: {},
              receipts: {},
            }
          : JSON.parse(raw);
      validateLocalViewState(state, this.storedDefinition);
    } catch (error) {
      throw new ViewServiceError('CORRUPT_STATE', message(error));
    }
    let seeded = raw == null;
    if (!state.seeded.includes(this.options.scopeKey)) {
      state.instances.push(
        ...this.seeds
          .filter(item => item.scope.type === 'personal')
          .map(item => ({
            ...structuredClone(item),
            ownerKey: this.options.scopeKey,
            revision: crypto.randomUUID(),
          })),
      );
      state.seeded = [...state.seeded, this.options.scopeKey];
      seeded = true;
    }
    // Visibility must never contain a public/private ID collision.
    if (
      new Set(this.visible(state).map(item => item.id)).size !==
      this.visible(state).length
    )
      throw new ViewServiceError('CORRUPT_STATE', '可见实例 ID 重复');
    return { state, seeded };
  }
  private transaction<T>(
    operation: (state: ServiceState) => T,
    write: boolean,
    signal?: AbortSignal,
  ): Promise<T> {
    return this.transact(
      this.storageKey,
      raw => {
        signal?.throwIfAborted();
        const { state, seeded } = this.readState(raw);
        const result = operation(state);
        return {
          result: structuredClone(result),
          value: write || seeded ? JSON.stringify(copy(state)) : undefined,
        };
      },
      signal,
    );
  }
  /**
   * Every write is idempotent by (scope, resource, requestId): a replay with the same input
   * returns the stored receipt, a different input is rejected, and expected domain failures
   * become `rejected` observations without persisting anything.
   */
  private write<T>(
    request: WriteRequest,
    operation: (state: ServiceState) => { value: T; revision: string },
  ): Promise<WriteObservation<T>> {
    const { context } = request;
    if (
      !context ||
      typeof context.requestId !== 'string' ||
      !context.requestId.trim()
    )
      return Promise.reject(
        new ViewServiceError('INVALID_ARGUMENT', '写入必须提供 requestId'),
      );
    return this.transact<WriteObservation<T>>(
      this.storageKey,
      raw => {
        context.signal?.throwIfAborted();
        let state: ServiceState;
        try {
          state = this.readState(raw).state;
        } catch (error) {
          return { result: rejection<T>(error) };
        }
        const key = this.receiptKey(request.resource, context.requestId);
        const previous = state.receipts[key];
        if (previous) {
          if (
            previous.action !== request.action ||
            !sameJsonState(previous.input, request.input)
          )
            return {
              result: rejection<T>(
                new ViewServiceError(
                  'CONFLICT',
                  'requestId 已用于不同的写入内容',
                ),
              ),
            };
          // A stored receipt is still gated by the caller's current grants.
          try {
            this.assertReplayAllowed(previous);
          } catch (error) {
            if (!(error instanceof ViewServiceError)) throw error;
            return { result: rejection<T>(error) };
          }
          return { result: copy(previous.observation) as WriteObservation<T> };
        }
        let observation: WriteObservation<T>;
        try {
          const { value, revision } = operation(state);
          observation = {
            outcome: 'committed',
            value,
            revision,
            visibility: 'visible',
          };
        } catch (error) {
          if (!(error instanceof ViewServiceError)) throw error;
          return { result: rejection<T>(error) };
        }
        const created = (observation as { value: unknown }).value;
        state.receipts = {
          ...state.receipts,
          [key]: {
            resource: request.resource,
            action: request.action,
            // A create has no target before the write; afterwards the receipt names the created id.
            targetId:
              request.targetId ??
              (created &&
              typeof created === 'object' &&
              typeof (created as { id?: unknown }).id === 'string'
                ? (created as { id: string }).id
                : null),
            input: copy(request.input),
            observation: copy(observation),
          },
        };
        return {
          result: structuredClone(observation),
          value: JSON.stringify(copy(state)),
        };
      },
      context.signal,
    ).catch((error: unknown) => {
      // A local store that fails to persist has not committed; only cancellation propagates.
      if (
        error instanceof ViewServiceError &&
        (error.code === 'UNAVAILABLE' || error.code === 'CORRUPT_STATE')
      )
        return rejection<T>(error);
      throw error;
    });
  }
}

function rejection<T>(error: unknown): WriteObservation<T> {
  const issue =
    error instanceof ViewServiceError
      ? { code: error.code, message: error.message }
      : { code: 'UNAVAILABLE' as const, message: message(error) };
  return { outcome: 'rejected', issue };
}
