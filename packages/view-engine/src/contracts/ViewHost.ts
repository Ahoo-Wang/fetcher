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
  ViewDefinition,
  ViewDefinitionPermissions,
  ViewInstance,
  ViewInstancePermissions,
  ViewInstanceSummary,
  ViewSource,
  ViewCreateInput,
} from './viewModel.js';
import type {
  ConfigurationWriteContext,
  ListOptions,
  OperationReference,
  Page,
  PreferenceState,
  ReadOptions,
  ViewDeleteReceipt,
  ViewOrderChange,
  WriteContext,
  WriteObservation,
  WritePrecondition,
} from './viewServiceContract.js';

/** Definition reads only; definition maintenance is a separate, controlled management facade. */
export interface ViewDefinitionService {
  load?(definitionId: string, options?: ReadOptions): Promise<ViewDefinition>;
}
/**
 * Saved view content. The service enforces ownership, permissions and revisions.
 * Catalog pages carry summaries; a full instance is always a separate point read.
 */
export interface ViewInstanceService {
  list?(
    definitionId: string,
    options?: ListOptions,
  ): Promise<Page<ViewInstanceSummary>>;
  load?(instanceId: string, options?: ReadOptions): Promise<ViewInstance>;
  create?(
    input: ViewCreateInput,
    context: ConfigurationWriteContext,
  ): Promise<WriteObservation<ViewInstance>>;
  save?(
    instance: ViewInstance,
    context: ConfigurationWriteContext,
  ): Promise<WriteObservation<ViewInstance>>;
  rename?(
    instanceId: string,
    title: string,
    expectedRevision: string,
    context: WriteContext,
  ): Promise<WriteObservation<ViewInstance>>;
  delete?(
    instanceId: string,
    expectedRevision: string,
    context: WriteContext,
  ): Promise<WriteObservation<ViewDeleteReceipt>>;
}
/** Current user's personal preferences for one definition; never changes shared view content. */
export interface ViewPreferenceService {
  load?(definitionId: string, options?: ReadOptions): Promise<PreferenceState>;
  saveOrder?(
    definitionId: string,
    change: ViewOrderChange,
    precondition: WritePrecondition,
    context: WriteContext,
  ): Promise<WriteObservation<PreferenceState>>;
  saveDefault?(
    definitionId: string,
    instanceId: string | null,
    precondition: WritePrecondition,
    context: WriteContext,
  ): Promise<WriteObservation<PreferenceState>>;
}
/**
 * Synchronous, host-accepted permission results. The engine never fetches permissions;
 * the host or application loads, caches and orders them, then notifies through subscribe.
 */
export interface ViewPermissionService {
  getInstance?(instance: ViewInstanceSummary): ViewInstancePermissions;
  getDefinition?(): ViewDefinitionPermissions;
  subscribe?(listener: () => void): () => void;
}
/** Read-only reconciliation of an earlier write by its original identity; never replays. */
export interface ViewOperationService {
  reconcile?(
    reference: OperationReference,
    options?: ReadOptions,
  ): Promise<WriteObservation<unknown>>;
}
export interface DashboardCandidate {
  id: string;
  definitionId: string;
  title: string;
  kind: 'record' | 'analysis';
}
export interface DashboardHost {
  search?(
    input: { query: string; cursor?: string },
    signal?: AbortSignal,
  ): Promise<{ items: DashboardCandidate[]; nextCursor: string | null }>;
  openOriginal?(reference: { instanceId: string; definitionId: string }): void;
}
/** Composition facade within one fixed access scope; each service is independently replaceable. */
export interface ViewHost {
  dashboard?: DashboardHost;
  definition?: ViewDefinitionService;
  instance?: ViewInstanceService;
  preference?: ViewPreferenceService;
  permission?: ViewPermissionService;
  operation?: ViewOperationService;
  /** Local runtime bridge. This is not a view-service REST operation. */
  resolveSource(sourceId: string): ViewSource | Promise<ViewSource>;
}
