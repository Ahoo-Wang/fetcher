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

import type { FilterCompilerRegistry } from '../../filter/filterModel.js';
import type { DeepReadonly } from '../../lib/types.js';
import type {
  RecordSession,
  ViewEngineState,
  ViewInstance,
} from '../recordModel.js';
import { validateViewInstance } from '../recordValidation.js';
import type { EngineScope } from './EngineScope.js';
import { copy, freeze } from './recordSnapshot.js';
import { deriveSession } from './sessionState.js';

/** Sole owner of published immutable session state and subscriptions. */
export class SessionStore {
  private state: ViewEngineState = freeze({
    status: 'idle',
    error: null,
    definition: null,
    instanceIds: [],
    selectedInstanceId: null,
    sessions: Object.create(null),
  });
  private readonly listeners = new Set<() => void>();
  constructor(
    private readonly scope: EngineScope,
    readonly filterCompilers: FilterCompilerRegistry,
  ) {}

  getSnapshot = (): ViewEngineState => this.state;
  subscribe = (listener: () => void): (() => void) => {
    if (!this.scope.disposed) this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  publish(patch: Partial<ViewEngineState>): void {
    if (this.scope.disposed) return;
    this.state = freeze({ ...this.state, ...patch });
    this.listeners.forEach(listener => {
      try {
        listener();
      } catch (error) {
        console.error('视图状态订阅回调失败', error);
      }
    });
  }

  patch(id: string, patch: Partial<RecordSession>): void {
    const session = this.find(id);
    if (!session || this.scope.disposed) return;
    this.publish({
      sessions: {
        ...this.state.sessions,
        [id]: deriveSession(
          { ...session, ...patch },
          this.definition(),
          this.filterCompilers,
          session,
        ),
      },
    });
  }

  find(id: string): RecordSession | undefined {
    return Object.prototype.hasOwnProperty.call(this.state.sessions, id)
      ? this.state.sessions[id]
      : undefined;
  }

  definition(): NonNullable<ViewEngineState['definition']> {
    this.scope.assertActive();
    if (!this.state.definition) throw new Error('视图定义尚未加载');
    return this.state.definition;
  }

  session(id = this.state.selectedInstanceId): RecordSession {
    this.scope.assertActive();
    if (id === null || !this.find(id))
      throw new Error('请先选择有效的视图实例');
    return this.find(id)!;
  }

  updateInstance(
    session: RecordSession,
    instance: DeepReadonly<ViewInstance>,
    patch: Partial<RecordSession> = {},
  ): void {
    validateViewInstance(instance, this.definition(), session.instance.id);
    this.patch(session.instance.id, { ...patch, instance: copy(instance) });
  }

  dispose(): void {
    this.listeners.clear();
  }
}
