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

import type {
  OperationReference,
  PreferenceState,
  ReadOptions,
  ViewOperationService,
  ViewOrderChange,
  ViewPreferenceService,
  WriteContext,
  WriteObservation,
  WritePrecondition,
} from '@ahoo-wang/fetcher-view-engine';
import { encodeViewResourceId } from './protocol.js';
import type { HttpViewTransport } from './HttpViewTransport.js';

export class HttpViewPreferenceService implements ViewPreferenceService {
  constructor(private readonly transport: HttpViewTransport) {}
  readonly load = async (
    id: string,
    options: ReadOptions = {},
  ): Promise<PreferenceState> => {
    this.transport.assertDefinition(id);
    const query = options.readFence
      ? `?readFence=${encodeURIComponent(options.readFence)}`
      : '';
    return this.transport.request<PreferenceState>(
      `/preferences${query}`,
      'GET',
      undefined,
      options.signal,
    );
  };
  readonly saveOrder = async (
    id: string,
    change: ViewOrderChange,
    precondition: WritePrecondition,
    context: WriteContext,
  ): Promise<WriteObservation<PreferenceState>> => {
    this.transport.assertDefinition(id);
    return this.transport.write<PreferenceState>(
      '/preferences/order',
      'PUT',
      { change, precondition },
      context.signal,
      this.transport.requestIdentity(context.requestId),
    );
  };
  readonly saveDefault = async (
    id: string,
    instanceId: string | null,
    precondition: WritePrecondition,
    context: WriteContext,
  ): Promise<WriteObservation<PreferenceState>> => {
    this.transport.assertDefinition(id);
    return this.transport.write<PreferenceState>(
      '/preferences/default',
      'PUT',
      { instanceId, precondition },
      context.signal,
      this.transport.requestIdentity(context.requestId),
    );
  };
}

/** Read-only reconciliation of an earlier write by its request identity. */
export class HttpViewOperationService implements ViewOperationService {
  constructor(private readonly transport: HttpViewTransport) {}
  readonly reconcile = async (
    reference: OperationReference,
    options: ReadOptions = {},
  ): Promise<WriteObservation<unknown>> => {
    this.transport.assertDefinition(reference.definitionId);
    const search = new URLSearchParams();
    if (reference.targetId) search.set('targetId', reference.targetId);
    if (options.readFence) search.set('readFence', options.readFence);
    const query = search.toString();
    return this.transport.request<WriteObservation<unknown>>(
      `/operations/${reference.resource}/${encodeViewResourceId(reference.requestId)}${query ? `?${query}` : ''}`,
      'GET',
      undefined,
      options.signal,
    );
  };
}
