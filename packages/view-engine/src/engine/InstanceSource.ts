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
  type ViewDefinition,
  type ViewEngineOptions,
  type ViewInstance,
  type ViewInstanceSummary,
} from '../contracts/viewModel.js';
import type { ViewHost } from '../contracts/ViewHost.js';
import {
  readInstancePage,
  readLocalInstances,
} from '../contracts/validation/instanceValidation.js';
import { readPreferenceState } from '../contracts/validation/preferenceValidation.js';
import {
  ViewServiceError,
  type Page,
  type PreferenceState,
} from '../contracts/viewServiceContract.js';
import { copy } from '../lib/snapshot.js';

/**
 * Read side of one engine: either the caller supplied the definition/catalog locally
 * or the host ports are consulted. Local inputs are copied once and validated against
 * the definition when first used.
 */
export class InstanceSource {
  private readonly localDefinition?: ViewDefinition;
  private readonly localInstances?: readonly ViewInstance[];
  readonly localDefault: string | null;
  readonly inputError?: unknown;
  private validated?: readonly ViewInstance[];
  constructor(
    private readonly host: ViewHost,
    readonly definitionId: string,
    options: Pick<
      ViewEngineOptions,
      'definition' | 'instances' | 'defaultInstanceId'
    >,
  ) {
    this.localDefault = options.defaultInstanceId ?? null;
    try {
      this.localDefinition =
        options.definition === undefined ? undefined : copy(options.definition);
      this.localInstances =
        options.instances === undefined ? undefined : copy(options.instances);
    } catch (error) {
      this.inputError = error;
    }
  }

  get hasLocalCatalog(): boolean {
    return this.localInstances !== undefined;
  }
  get canList(): boolean {
    return (
      this.hasLocalCatalog || typeof this.host.instance?.list === 'function'
    );
  }
  get canLoad(): boolean {
    return (
      this.hasLocalCatalog || typeof this.host.instance?.load === 'function'
    );
  }
  /** A host preference port is authoritative; otherwise the caller-declared default applies. */
  get hasPreferencePort(): boolean {
    return (
      !this.hasLocalCatalog && typeof this.host.preference?.load === 'function'
    );
  }

  definition(signal: AbortSignal): Promise<ViewDefinition> {
    // eslint-disable-next-line @typescript-eslint/only-throw-error
    if (this.inputError) throw this.inputError;
    if (this.localDefinition !== undefined)
      return Promise.resolve(this.localDefinition);
    if (!this.host.definition?.load)
      throw new Error('缺少视图定义或 definition.load');
    return this.host.definition.load(this.definitionId, { signal });
  }

  /** Caller-supplied inputs are programming errors when invalid; surface them before any load completes. */
  validateLocal(definition: ViewDefinition): void {
    if (this.hasLocalCatalog) this.localCatalog(definition);
  }

  private localCatalog(definition: ViewDefinition): readonly ViewInstance[] {
    if (!this.validated) {
      this.validated = readLocalInstances(this.localInstances, definition);
      if (
        this.localDefault !== null &&
        !this.validated.some(item => item.id === this.localDefault)
      )
        throw new Error('默认视图必须为本地实例中的 ID 或 null');
    }
    return this.validated;
  }

  async list(
    definition: ViewDefinition,
    cursor: string | null,
    signal: AbortSignal,
  ): Promise<Page<ViewInstanceSummary>> {
    if (this.hasLocalCatalog) {
      const items = this.localCatalog(definition).map(summaryOf);
      return { items, nextCursor: null, total: items.length };
    }
    if (!this.host.instance?.list)
      throw new Error('缺少实例目录或 instance.list');
    const page = await this.host.instance.list(this.definitionId, {
      cursor,
      signal,
    });
    return readInstancePage(page, definition);
  }

  /** Raw point read; callers validate against their definition and expected identity. */
  async load(
    id: string,
    signal: AbortSignal,
    definition?: ViewDefinition,
  ): Promise<ViewInstance> {
    if (this.hasLocalCatalog) {
      if (!definition) throw new Error('本地实例需要视图定义');
      const found = this.localCatalog(definition).find(item => item.id === id);
      if (!found)
        throw new ViewServiceError('NOT_FOUND', `无法加载实例：${id}`);
      return copy(found);
    }
    if (!this.host.instance?.load) throw new Error(`无法加载实例：${id}`);
    return this.host.instance.load(id, { signal });
  }

  async preference(signal: AbortSignal): Promise<PreferenceState> {
    if (!this.hasPreferencePort)
      return {
        revision: null,
        order: [],
        defaultInstanceId: this.localDefault,
        effectiveDefaultInstanceId: this.localDefault,
      };
    return readPreferenceState(
      await this.host.preference!.load!(this.definitionId, { signal }),
    );
  }
}
