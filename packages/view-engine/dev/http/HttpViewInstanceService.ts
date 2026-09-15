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

import { encodeViewResourceId } from './protocol.js';
import type {
  ConfigurationWriteContext,
  ListOptions,
  Page,
  ReadOptions,
  ViewCreateInput,
  ViewDeleteReceipt,
  ViewInstance,
  ViewInstanceService,
  ViewInstanceSummary,
  WriteContext,
  WriteObservation,
} from '@ahoo-wang/fetcher-view-engine';
import type { HttpViewTransport } from './HttpViewTransport.js';

function definitionRevision(revision: string | undefined): HeadersInit {
  return revision
    ? { 'X-Definition-Revision': encodeURIComponent(revision) }
    : {};
}

export class HttpViewInstanceService implements ViewInstanceService {
  constructor(private readonly transport: HttpViewTransport) {}
  readonly list = async (
    id: string,
    options: ListOptions = {},
  ): Promise<Page<ViewInstanceSummary>> => {
    this.transport.assertDefinition(id);
    const search = new URLSearchParams();
    if (options.query) search.set('query', options.query);
    if (options.cursor) search.set('cursor', options.cursor);
    if (options.limit !== undefined) search.set('limit', String(options.limit));
    if (options.readFence) search.set('readFence', options.readFence);
    const query = search.toString();
    return this.transport.request<Page<ViewInstanceSummary>>(
      `/instances${query ? `?${query}` : ''}`,
      'GET',
      undefined,
      options.signal,
    );
  };
  readonly load = async (
    id: string,
    options: ReadOptions = {},
  ): Promise<ViewInstance> => {
    const query = options.readFence
      ? `?readFence=${encodeURIComponent(options.readFence)}`
      : '';
    return this.transport.request<ViewInstance>(
      `/instances/${encodeViewResourceId(id)}${query}`,
      'GET',
      undefined,
      options.signal,
    );
  };
  readonly create = async (
    instance: ViewCreateInput,
    context: ConfigurationWriteContext,
  ): Promise<WriteObservation<ViewInstance>> => {
    return this.transport.write<ViewInstance>(
      '/instances',
      'POST',
      instance,
      context.signal,
      {
        ...this.transport.requestIdentity(context.requestId),
        ...definitionRevision(context.definitionRevision),
      },
    );
  };
  readonly save = async (
    instance: ViewInstance,
    context: ConfigurationWriteContext,
  ): Promise<WriteObservation<ViewInstance>> => {
    return this.transport.write<ViewInstance>(
      `/instances/${encodeViewResourceId(instance.id)}`,
      'PUT',
      instance,
      context.signal,
      {
        ...this.transport.revision(instance.revision),
        ...this.transport.requestIdentity(context.requestId),
        ...definitionRevision(context.definitionRevision),
      },
    );
  };
  readonly rename = async (
    id: string,
    title: string,
    expectedRevision: string,
    context: WriteContext,
  ): Promise<WriteObservation<ViewInstance>> => {
    return this.transport.write<ViewInstance>(
      `/instances/${encodeViewResourceId(id)}/name`,
      'PATCH',
      { title },
      context.signal,
      {
        ...this.transport.revision(expectedRevision),
        ...this.transport.requestIdentity(context.requestId),
      },
    );
  };
  readonly delete = async (
    id: string,
    expectedRevision: string,
    context: WriteContext,
  ): Promise<WriteObservation<ViewDeleteReceipt>> => {
    return this.transport.write<ViewDeleteReceipt>(
      `/instances/${encodeViewResourceId(id)}`,
      'DELETE',
      undefined,
      context.signal,
      {
        ...this.transport.revision(expectedRevision),
        ...this.transport.requestIdentity(context.requestId),
      },
    );
  };
}
