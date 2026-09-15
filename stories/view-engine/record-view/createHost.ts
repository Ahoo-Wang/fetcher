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

import type { AggregationQuery } from '@ahoo-wang/fetcher-wow';
import {
  ViewServiceError,
  applyOrderChange,
  committedWrite,
  rejectedWrite,
  summaryOf,
  type PreferenceState,
  type ViewHost,
  type ViewInstance,
  type WriteObservation,
  type WritePrecondition,
} from '@ahoo-wang/fetcher-view-engine';
import type { DemoQuery, ScenarioOptions } from './demoTypes.js';
import { definition, makeInstances, pause } from './fixtures.js';
import { createOrderSource } from './querySource.js';

/** Expected domain failures become rejected observations; anything else is a transport failure. */
function attempt<T>(
  operation: () => { value: T; revision: string },
): WriteObservation<T> {
  try {
    const { value, revision } = operation();
    return committedWrite(value, revision);
  } catch (error) {
    if (error instanceof ViewServiceError)
      return rejectedWrite(error.code, error.message);
    throw error;
  }
}

export function createHost(
  options: ScenarioOptions,
  onQuery: (method: 'paged' | 'cursor', request: DemoQuery) => void,
  onWrite: (
    operation: 'save' | 'create' | 'delete' | 'rename',
    instance: ViewInstance,
  ) => void,
  onSummary: (query: AggregationQuery) => void,
  onOrder: (ids: string[]) => void,
) {
  const {
    mode = 'paged',
    failFirstDelete = false,
    summaries = false,
    saveOnly = false,
    pageSize = 5,
    local,
  } = options;
  const { source, customerOptions, createOrder, processOrders } =
    createOrderSource(options, onQuery, onSummary);
  const initialInstances = makeInstances(
    mode,
    summaries,
    pageSize,
    options.initialFilter,
  );
  const saved = new Map(
    initialInstances.instances.map(instance => [
      instance.id,
      structuredClone(instance),
    ]),
  );
  let instanceOrder = [...saved.keys()];
  // The single user's preference document; no revision until the first preference write.
  let preference: {
    revision: string | null;
    defaultInstanceId: string | null;
  } = { revision: null, defaultInstanceId: initialInstances.defaultInstanceId };
  let preferenceRevision = 0;
  let failNextDelete = failFirstDelete;
  let nextInstance = 1;
  const createReceipts = new Map<
    string,
    { body: string; result: ViewInstance }
  >();

  function assertDefinition(id: string) {
    if (id !== definition.id) throw new Error('订单视图定义不存在。');
  }
  function loadInstance(id: string) {
    const instance = saved.get(id);
    if (!instance)
      throw new ViewServiceError('NOT_FOUND', `视图 ${id} 不存在。`);
    return structuredClone(instance);
  }
  function visibleOrder() {
    return instanceOrder.filter(id => saved.has(id));
  }
  function preferenceState(): PreferenceState {
    const { defaultInstanceId } = preference;
    return {
      revision: preference.revision,
      order: visibleOrder(),
      defaultInstanceId,
      effectiveDefaultInstanceId:
        defaultInstanceId !== null && saved.has(defaultInstanceId)
          ? defaultInstanceId
          : null,
    };
  }
  function checkPrecondition(precondition: WritePrecondition) {
    if (precondition.type === 'absent') {
      if (preference.revision !== null)
        throw new ViewServiceError(
          'REVISION_CONFLICT',
          '个人偏好已存在，请重新加载后再修改。',
        );
      return;
    }
    if (precondition.revision !== preference.revision)
      throw new ViewServiceError(
        'REVISION_CONFLICT',
        '个人偏好已被更新，请重新加载。',
      );
  }
  function commitPreference() {
    const revision = `preference-${++preferenceRevision}`;
    preference = { ...preference, revision };
    return { value: preferenceState(), revision };
  }
  const host: ViewHost = {
    ...(!local && {
      definition: {
        async load(id: string) {
          assertDefinition(id);
          return structuredClone(definition);
        },
      },
    }),
    resolveSource(id) {
      if (id !== definition.sourceId) throw new Error('订单数据源不存在。');
      return source;
    },
    permission: {
      getInstance(instance) {
        return {
          save:
            instance.scope.type === 'personal' ||
            instance.scope.source === 'shared',
          saveAsPersonal: !saveOnly,
          saveAsShared: !saveOnly,
          rename:
            !saveOnly &&
            (instance.scope.type === 'personal' ||
              instance.scope.source === 'shared'),
          delete:
            !saveOnly &&
            (instance.scope.type === 'personal' ||
              instance.scope.source === 'shared'),
        };
      },
      getDefinition() {
        return { reorder: true, setDefault: true };
      },
    },
    instance: {
      ...(!local && {
        async list(id: string, listOptions?: { query?: string }) {
          assertDefinition(id);
          const needle = (listOptions?.query ?? '').trim().toLocaleLowerCase();
          const items = visibleOrder()
            .map(loadInstance)
            .filter(
              instance =>
                !needle || instance.title.toLocaleLowerCase().includes(needle),
            )
            .map(summaryOf);
          return { items, nextCursor: null, total: items.length };
        },
        async load(id: string) {
          return loadInstance(id);
        },
      }),
      async rename(id, title, revision) {
        await pause();
        return attempt(() => {
          const previous = loadInstance(id);
          if (
            previous.scope.type === 'public' &&
            previous.scope.source === 'system'
          )
            throw new ViewServiceError('FORBIDDEN', '系统视图不能编辑名称。');
          if (revision !== previous.revision)
            throw new ViewServiceError(
              'REVISION_CONFLICT',
              '视图已被更新，请重新加载。',
            );
          const updated = {
            ...previous,
            title,
            revision: String(Number(previous.revision) + 1),
          };
          saved.set(id, updated);
          onWrite('rename', structuredClone(updated));
          return {
            value: structuredClone(updated),
            revision: updated.revision,
          };
        });
      },
      async delete(id, revision) {
        await pause();
        return attempt(() => {
          const previous = saved.get(id);
          if (previous) {
            if (
              previous.scope.type === 'public' &&
              previous.scope.source === 'system'
            )
              throw new ViewServiceError('FORBIDDEN', '系统视图不能删除。');
            if (revision !== previous.revision)
              throw new ViewServiceError(
                'REVISION_CONFLICT',
                '视图已被更新，请重新加载后再删除。',
              );
            if (failNextDelete) {
              failNextDelete = false;
              throw new ViewServiceError('CONFLICT', '删除失败，请重试。');
            }
            saved.delete(id);
            instanceOrder = instanceOrder.filter(value => value !== id);
            onWrite('delete', structuredClone(previous));
          }
          // The receipt only records the deletion; the personal default is a separate preference.
          const receipt = { id, revision: crypto.randomUUID() };
          return { value: receipt, revision: receipt.revision };
        });
      },
      async save(instance) {
        await pause();
        return attempt(() => {
          const previous = loadInstance(instance.id);
          if (instance.revision !== previous.revision)
            throw new ViewServiceError(
              'REVISION_CONFLICT',
              '视图已被更新，请重新加载后再保存。',
            );
          const updated = {
            ...structuredClone(instance),
            revision: String(Number(previous.revision) + 1),
          };
          saved.set(updated.id, updated);
          onWrite('save', structuredClone(updated));
          return {
            value: structuredClone(updated),
            revision: updated.revision,
          };
        });
      },
      async create(instance, { requestId }) {
        await pause();
        const body = JSON.stringify(instance);
        const previous = createReceipts.get(requestId);
        if (previous) {
          if (previous.body !== body)
            return rejectedWrite('CONFLICT', '创建请求标识已用于不同内容');
          return committedWrite(
            structuredClone(previous.result),
            previous.result.revision,
          );
        }
        const created = {
          ...structuredClone(instance),
          id: `orders-copy-${nextInstance++}`,
          revision: '1',
        };
        saved.set(created.id, created);
        instanceOrder.push(created.id);
        createReceipts.set(requestId, {
          body,
          result: structuredClone(created),
        });
        onWrite('create', structuredClone(created));
        return committedWrite(structuredClone(created), created.revision);
      },
    },
    preference: {
      ...(!local && {
        async load(definitionId: string) {
          assertDefinition(definitionId);
          return preferenceState();
        },
        async saveDefault(
          definitionId: string,
          id: string | null,
          precondition: WritePrecondition,
        ) {
          await pause();
          return attempt(() => {
            assertDefinition(definitionId);
            if (id !== null) loadInstance(id);
            checkPrecondition(precondition);
            preference = { ...preference, defaultInstanceId: id };
            return commitPreference();
          });
        },
      }),
      async saveOrder(definitionId, change, precondition) {
        await pause();
        return attempt(() => {
          assertDefinition(definitionId);
          if (change.scopeInstanceIds.some(id => !saved.has(id)))
            throw new ViewServiceError(
              'NOT_FOUND',
              '可用视图已变化，请重新加载。',
            );
          checkPrecondition(precondition);
          instanceOrder = applyOrderChange(visibleOrder(), change);
          onOrder([...instanceOrder]);
          return commitPreference();
        });
      },
    },
  };
  return {
    host,
    initialInstances,
    customerOptions,
    createOrder,
    processOrders,
  };
}
