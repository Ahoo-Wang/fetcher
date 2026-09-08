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

import { copy } from '../lib/snapshot.js';
import { sameFilterState } from '../filter/filterTree.js';
import type {
  ViewDefinition,
  ViewHost,
  ViewInstance,
  ViewInstanceList,
  ViewInstancePermissions,
} from './recordModel.js';
import {
  ViewServiceError,
  VIEW_SERVICE_STATUS,
  type ViewCreateContext,
  type ViewPermissionSnapshot,
  type ViewServiceErrorCode,
} from './viewServiceContract.js';

export interface HttpViewHostOptions {
  /** Service root, e.g. https://example.test/view-service/ (never embeds credentials). */
  baseUrl: string;
  definitionId: string;
  resolveSource: ViewHost['resolveSource'];
  /** Authentication comes from the application; no client-supplied owner field is sent. */
  headers?: () => HeadersInit;
  fetch?: typeof fetch;
  timeoutMs?: number;
}
/** REST transport only; runtime components and record clients remain application-owned. */
export class HttpViewHost implements ViewHost {
  private readonly options: HttpViewHostOptions;
  private readonly root: string;
  private permissions: ViewPermissionSnapshot = {
    revision: -1,
    instances: {},
    reorder: false,
  };
  private requestSequence = 0;
  private permissionFence = 0;
  private readonly listeners = new Set<() => void>();
  constructor(options: HttpViewHostOptions) {
    const root = new URL(options.baseUrl);
    if (
      !['http:', 'https:'].includes(root.protocol) ||
      root.username ||
      root.password ||
      root.search ||
      root.hash
    )
      throw new ViewServiceError(
        'INVALID_ARGUMENT',
        'baseUrl 必须是无凭据的 HTTP 服务地址',
      );
    if (
      typeof options.definitionId !== 'string' ||
      !options.definitionId.trim() ||
      (options.timeoutMs !== undefined &&
        (!Number.isFinite(options.timeoutMs) || options.timeoutMs <= 0))
    )
      throw new ViewServiceError(
        'INVALID_ARGUMENT',
        'definitionId 或 timeoutMs 无效',
      );
    this.root = `${root.href.replace(/\/$/, '')}/definitions/${encodeURIComponent(options.definitionId)}`;
    this.options = { ...options };
  }
  async loadDefinition(
    id: string,
    signal?: AbortSignal,
  ): Promise<ViewDefinition> {
    this.assertDefinition(id);
    return this.request('', 'GET', undefined, signal);
  }
  async listInstances(
    id: string,
    signal?: AbortSignal,
  ): Promise<ViewInstanceList> {
    this.assertDefinition(id);
    return this.request('/instances', 'GET', undefined, signal);
  }
  async loadInstance(id: string, signal?: AbortSignal): Promise<ViewInstance> {
    return this.request(
      `/instances/${encodeURIComponent(id)}`,
      'GET',
      undefined,
      signal,
    );
  }
  async createInstance(
    instance: Omit<ViewInstance, 'id' | 'revision'>,
    context: ViewCreateContext,
  ): Promise<ViewInstance> {
    if (typeof context?.requestId !== 'string' || !context.requestId.trim())
      return Promise.reject(
        new ViewServiceError('INVALID_ARGUMENT', '创建必须提供 requestId'),
      );
    return this.request('/instances', 'POST', instance, context.signal, {
      'Idempotency-Key': context.requestId,
    });
  }
  async saveInstance(instance: ViewInstance): Promise<ViewInstance> {
    return this.request(
      `/instances/${encodeURIComponent(instance.id)}`,
      'PUT',
      instance,
      undefined,
      this.revision(instance.revision),
    );
  }
  async renameInstance(
    id: string,
    title: string,
    revision?: string,
  ): Promise<ViewInstance> {
    return this.request(
      `/instances/${encodeURIComponent(id)}/name`,
      'PATCH',
      { title },
      undefined,
      this.revision(revision),
    );
  }
  async deleteInstance(id: string, revision?: string): Promise<void> {
    await this.request(
      `/instances/${encodeURIComponent(id)}`,
      'DELETE',
      undefined,
      undefined,
      this.revision(revision),
    );
  }
  async saveInstanceOrder(id: string, instanceIds: string[]): Promise<void> {
    this.assertDefinition(id);
    await this.request('/order', 'PUT', { instanceIds });
  }
  resolveSource(id: string) {
    return this.options.resolveSource(id);
  }
  getInstancePermissions(instance: ViewInstance): ViewInstancePermissions {
    return Object.prototype.hasOwnProperty.call(
      this.permissions.instances,
      instance.id,
    )
      ? this.permissions.instances[instance.id]
      : {
          save: false,
          rename: false,
          delete: false,
          saveAsPersonal: false,
          saveAsShared: false,
        };
  }
  getDefinitionPermissions() {
    return { reorder: this.permissions.reorder };
  }
  subscribePermissions = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  async refreshPermissions(signal?: AbortSignal): Promise<void> {
    await this.request('/permissions', 'GET', undefined, signal);
  }

  private assertDefinition(id: string): void {
    if (id !== this.options.definitionId)
      throw new ViewServiceError('NOT_FOUND', '视图定义不存在');
  }
  private revision(revision?: string): HeadersInit {
    if (!revision)
      throw new ViewServiceError(
        'PRECONDITION_REQUIRED',
        '写入需要当前 revision，请重新加载',
      );
    return { 'If-Match': JSON.stringify(revision) };
  }
  private acceptPermissions(value: unknown): void {
    const next = value as ViewPermissionSnapshot;
    if (
      !next ||
      !Number.isSafeInteger(next.revision) ||
      next.revision < 0 ||
      typeof next.reorder !== 'boolean' ||
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
      next.revision < this.permissions.revision ||
      sameFilterState(next, this.permissions)
    )
      return;
    this.permissions = copy(next);
    this.listeners.forEach(listener => listener());
  }
  private async request<T>(
    path: string,
    method: string,
    body?: unknown,
    signal?: AbortSignal,
    extraHeaders?: HeadersInit,
  ): Promise<T> {
    signal?.throwIfAborted();
    const sequence = ++this.requestSequence;
    const writing = method !== 'GET';
    const timeout = AbortSignal.timeout(this.options.timeoutMs ?? 10000);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const headers = new Headers(this.options.headers?.());
    headers.set('Accept', 'application/json');
    new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    const payload = body === undefined ? undefined : JSON.stringify(copy(body));
    let response: Response;
    let envelope: {
      data?: T;
      permissions?: unknown;
      error?: { code?: string; message?: string };
    };
    try {
      response = await (this.options.fetch ?? globalThis.fetch)(
        this.root + path,
        { method, headers, body: payload, signal: requestSignal },
      );
      envelope = await response.json();
    } catch {
      if (writing)
        throw new ViewServiceError(
          'UNKNOWN_OUTCOME',
          '写入结果未知，请使用同一请求重试或重新加载核对',
        );
      if (signal?.aborted) throw signal.reason;
      throw new ViewServiceError('UNAVAILABLE', '视图服务请求失败或超时');
    }
    if (!envelope || typeof envelope !== 'object')
      throw new ViewServiceError(
        writing ? 'UNKNOWN_OUTCOME' : 'UNAVAILABLE',
        '视图服务响应无效',
      );
    if (response.status === 401) {
      this.permissionFence = Math.max(this.permissionFence, sequence);
      this.permissions = copy({
        revision: this.permissions.revision,
        instances: {},
        reorder: false,
      });
      this.listeners.forEach(listener => listener());
    }
    if (envelope.permissions && sequence > this.permissionFence)
      this.acceptPermissions(envelope.permissions);
    if (!response.ok) {
      const code = envelope.error?.code;
      if (
        code &&
        Object.prototype.hasOwnProperty.call(VIEW_SERVICE_STATUS, code) &&
        VIEW_SERVICE_STATUS[code as ViewServiceErrorCode] === response.status
      )
        throw new ViewServiceError(
          code as ViewServiceErrorCode,
          envelope.error?.message ?? code,
        );
      throw new ViewServiceError(
        writing ? 'UNKNOWN_OUTCOME' : 'UNAVAILABLE',
        `视图服务返回 ${response.status}`,
      );
    }
    if (
      !envelope.permissions ||
      !Object.prototype.hasOwnProperty.call(envelope, 'data')
    )
      throw new ViewServiceError(
        writing ? 'UNKNOWN_OUTCOME' : 'UNAVAILABLE',
        '视图服务响应缺少 data 或 permissions',
      );
    return envelope.data as T;
  }
}
