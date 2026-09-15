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

import { encodeViewResourceId, VIEW_SERVICE_STATUS } from './protocol.js';
import { copy } from '../../src/lib/snapshot.js';
import { HttpViewPermissionService } from './HttpViewPermissionService.js';

import {
  ViewServiceError,
  isViewServiceErrorCode,
  readWriteObservation,
  type ViewServiceErrorCode,
  type WriteObservation,
} from '@ahoo-wang/fetcher-view-engine';

export interface HttpViewTransportOptions {
  baseUrl: string;
  definitionId: string;
  headers?: () => HeadersInit;
  fetch?: typeof fetch;
  timeoutMs?: number;
}

interface Envelope {
  data?: unknown;
  permissions?: unknown;
  error?: { code?: string; message?: string };
}

/** REST transport only; runtime components and record clients remain application-owned. */
export class HttpViewTransport {
  readonly permission: HttpViewPermissionService;

  private readonly options: HttpViewTransportOptions;
  private readonly root: string;

  private requestSequence = 0;
  private permissionFence = 0;

  constructor(options: HttpViewTransportOptions) {
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
    this.root = `${root.href.replace(/\/$/, '')}/definitions/${encodeViewResourceId(options.definitionId)}`;
    this.options = { ...options };
    this.permission = new HttpViewPermissionService(this);
  }

  assertDefinition(id: string): void {
    encodeViewResourceId(id);
    if (id !== this.options.definitionId)
      throw new ViewServiceError('NOT_FOUND', '视图定义不存在');
  }
  revision(revision?: string): HeadersInit {
    if (!revision)
      throw new ViewServiceError(
        'PRECONDITION_REQUIRED',
        '写入需要当前 revision，请重新加载',
      );
    return { 'If-Match': JSON.stringify(revision) };
  }
  requestIdentity(requestId: string | undefined): HeadersInit {
    if (typeof requestId !== 'string' || !requestId.trim())
      throw new ViewServiceError('INVALID_ARGUMENT', '写入必须提供 requestId');
    // Header values must be ISO-8859-1; the identity itself may be any string.
    return { 'Idempotency-Key': encodeURIComponent(requestId) };
  }

  private async exchange(
    path: string,
    method: string,
    body: unknown,
    signal: AbortSignal | undefined,
    extraHeaders: HeadersInit | undefined,
  ): Promise<{ response: Response; envelope: Envelope | undefined }> {
    signal?.throwIfAborted();
    const sequence = ++this.requestSequence;
    const timeout = AbortSignal.timeout(this.options.timeoutMs ?? 10000);
    const requestSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;
    const headers = new Headers(this.options.headers?.());
    headers.set('Accept', 'application/json');
    new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    const payload = body === undefined ? undefined : JSON.stringify(copy(body));
    const response = await (this.options.fetch ?? globalThis.fetch)(
      this.root + path,
      { method, headers, body: payload, signal: requestSignal },
    );
    if (response.status === 401) {
      this.permissionFence = Math.max(this.permissionFence, sequence);
      this.permission.clear();
      await response.body?.cancel().catch(() => {});
      return { response, envelope: undefined };
    }
    const envelope = (await response.json()) as Envelope;
    if (
      envelope &&
      typeof envelope === 'object' &&
      envelope.permissions &&
      sequence > this.permissionFence
    )
      this.permission.acceptSnapshot(envelope.permissions);
    return { response, envelope };
  }

  /** Reads reject with a structured error; the caller keeps its current state. */
  async request<T>(
    path: string,
    method: string,
    body?: unknown,
    signal?: AbortSignal,
    extraHeaders?: HeadersInit,
  ): Promise<T> {
    let exchange: Awaited<ReturnType<HttpViewTransport['exchange']>>;
    try {
      exchange = await this.exchange(path, method, body, signal, extraHeaders);
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      throw new ViewServiceError(
        'UNAVAILABLE',
        error instanceof ViewServiceError
          ? error.message
          : '视图服务请求失败或超时',
      );
    }
    const { response, envelope } = exchange;
    if (response.status === 401)
      throw new ViewServiceError(
        'UNAUTHENTICATED',
        '登录状态已失效，请重新登录',
      );
    if (!envelope || typeof envelope !== 'object')
      throw new ViewServiceError('UNAVAILABLE', '视图服务响应无效');
    if (!response.ok) {
      const code = envelope.error?.code;
      if (
        isViewServiceErrorCode(code) &&
        VIEW_SERVICE_STATUS[code] === response.status
      )
        throw new ViewServiceError(code, envelope.error?.message ?? code);
      throw new ViewServiceError(
        'UNAVAILABLE',
        `视图服务返回 ${response.status}`,
      );
    }
    if (
      !envelope.permissions ||
      !Object.prototype.hasOwnProperty.call(envelope, 'data')
    )
      throw new ViewServiceError(
        'UNAVAILABLE',
        '视图服务响应缺少 data 或 permissions',
      );
    return envelope.data as T;
  }

  /**
   * Writes always resolve to an observation: the service's own outcome when the body is
   * intact, a definite rejection when authentication or validation failed before dispatch,
   * and `unknown` whenever the network or the response shape leaves the outcome unproven.
   */
  async write<T>(
    path: string,
    method: string,
    body: unknown,
    signal: AbortSignal | undefined,
    extraHeaders: HeadersInit,
  ): Promise<WriteObservation<T>> {
    let exchange: Awaited<ReturnType<HttpViewTransport['exchange']>>;
    try {
      exchange = await this.exchange(path, method, body, signal, extraHeaders);
    } catch (error) {
      if (signal?.aborted) throw signal.reason;
      return {
        outcome: 'unknown',
        issue: {
          code: 'UNKNOWN_OUTCOME',
          message:
            error instanceof ViewServiceError
              ? error.message
              : '写入结果未知，请使用同一请求核对或重试',
        },
      };
    }
    const { response, envelope } = exchange;
    if (response.status === 401)
      return {
        outcome: 'rejected',
        issue: {
          code: 'UNAUTHENTICATED',
          message: '登录状态已失效，请重新登录',
        },
      };
    if (envelope && typeof envelope === 'object' && envelope.data) {
      try {
        const observation = readWriteObservation<T>(envelope.data);
        // A 4xx must carry a rejection; anything else contradicting the status is unproven.
        if (
          (observation.outcome === 'rejected') ===
          (response.status >= 400 && response.status < 500)
        )
          return observation;
      } catch {
        /* Fall through to the status-based interpretation. */
      }
    }
    const code = envelope?.error?.code;
    if (
      response.status >= 400 &&
      response.status < 500 &&
      isViewServiceErrorCode(code) &&
      VIEW_SERVICE_STATUS[code] === response.status
    )
      return {
        outcome: 'rejected',
        issue: {
          code: code as ViewServiceErrorCode,
          message: envelope?.error?.message ?? code,
        },
      };
    return {
      outcome: 'unknown',
      issue: {
        code: 'UNKNOWN_OUTCOME',
        message: `视图服务返回 ${response.status}，写入结果待核对`,
      },
    };
  }
}
