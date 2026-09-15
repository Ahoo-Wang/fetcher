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

import { copy, sameJsonState } from '../../src/lib/snapshot.js';

import type {
  ViewDefinitionPermissions,
  ViewInstancePermissions,
  ViewInstanceSummary,
  ViewPermissionService,
} from '@ahoo-wang/fetcher-view-engine';
import { ViewServiceError } from '@ahoo-wang/fetcher-view-engine';
import type { HttpViewTransport } from './HttpViewTransport.js';

/** Wire shape of the service's permission projection; not part of the ViewHost contract. */
export interface HttpPermissionSnapshot {
  /** Monotonic authority revision; stale responses cannot restore revoked grants. */
  revision: number;
  instances: Record<string, Required<ViewInstancePermissions>>;
  reorder: boolean;
  setDefault: boolean;
  createPersonal?: boolean;
  createShared?: boolean;
}

/**
 * Host-accepted permission results for the engine plus the application's refresh entry.
 * The engine only reads the synchronous getters; the application decides when to refresh.
 */
export class HttpViewPermissionService implements ViewPermissionService {
  constructor(private readonly transport: HttpViewTransport) {}
  readonly getInstance = (
    instance: ViewInstanceSummary,
  ): ViewInstancePermissions => {
    return Object.prototype.hasOwnProperty.call(
      this.permissionSnapshot.instances,
      instance.id,
    )
      ? this.permissionSnapshot.instances[instance.id]
      : {
          save: false,
          rename: false,
          delete: false,
          saveAsPersonal: false,
          saveAsShared: false,
        };
  };
  readonly getDefinition = (): Required<ViewDefinitionPermissions> => {
    return {
      reorder: this.permissionSnapshot.reorder,
      setDefault: this.permissionSnapshot.setDefault,
      createPersonal: this.permissionSnapshot.createPersonal === true,
      createShared: this.permissionSnapshot.createShared === true,
    };
  };
  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  /** Application-driven refresh after an authority-change event; the engine never calls this. */
  readonly refresh = async (signal?: AbortSignal): Promise<void> => {
    await this.transport.request('/permissions', 'GET', undefined, signal);
  };
  /** Clear cached grants after an HTTP session rejection; keep the authority version. */
  clear(): void {
    this.permissionSnapshot = copy({
      revision: this.permissionSnapshot.revision,
      instances: {},
      reorder: false,
      setDefault: false,
    });
    this.listeners.forEach(listener => listener());
  }
  private permissionSnapshot: HttpPermissionSnapshot = {
    revision: -1,
    instances: {},
    reorder: false,
    setDefault: false,
  };
  private readonly listeners = new Set<() => void>();
  acceptSnapshot(value: unknown): void {
    const next = value as HttpPermissionSnapshot;
    if (
      !next ||
      !Number.isSafeInteger(next.revision) ||
      next.revision < 0 ||
      typeof next.reorder !== 'boolean' ||
      typeof next.setDefault !== 'boolean' ||
      (next.createPersonal !== undefined &&
        typeof next.createPersonal !== 'boolean') ||
      (next.createShared !== undefined &&
        typeof next.createShared !== 'boolean') ||
      !next.instances ||
      typeof next.instances !== 'object' ||
      Array.isArray(next.instances)
    )
      throw new ViewServiceError('UNAVAILABLE', '服务权限响应无效');
    for (const permission of Object.values(next.instances))
      if (
        !permission ||
        !['save', 'rename', 'delete', 'saveAsPersonal', 'saveAsShared'].every(
          key =>
            typeof permission[key as keyof ViewInstancePermissions] ===
            'boolean',
        )
      )
        throw new ViewServiceError('UNAVAILABLE', '服务实例权限无效');
    if (
      next.revision < this.permissionSnapshot.revision ||
      sameJsonState(next, this.permissionSnapshot)
    )
      return;
    this.permissionSnapshot = copy(next);
    this.listeners.forEach(listener => listener());
  }
}
