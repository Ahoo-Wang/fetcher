/** Architecture contract specimen; not a package implementation or exported API. */
import type {
  FilterConfiguration,
  FilterFieldDefinition,
  FilterJsonValue,
} from '../../../../../packages/view-engine/src/filter/filterModel.js';
import type { DeepReadonly } from '../../../../../packages/view-engine/src/lib/types.js';
import type {
  AggregationQuery,
  FieldSort,
  QueryApi,
} from '@ahoo-wang/fetcher-wow';
import type { RecordPresentation } from '../../../../../packages/view-engine/src/contracts/viewModel.js';

export type ViewKind = 'record' | 'analysis';
export type Scope =
  { type: 'personal' } | { type: 'public'; source: 'system' | 'shared' };
export type CreateScope =
  { type: 'personal' } | { type: 'public'; source: 'shared' };
export type JsonOptions = Readonly<Record<string, FilterJsonValue>>;
export interface ComponentConfig {
  id: string;
  component: { name: string; options?: JsonOptions };
  props: JsonOptions;
}
export interface DimensionConfig extends ComponentConfig {
  field: string;
  alias: string;
  title: string;
}
export interface MetricConfig extends ComponentConfig {
  field?: string;
  alias: string;
  title: string;
}
export interface RecordConfig {
  filters: FilterConfiguration;
  sort: FieldSort[];
  pagination: { mode: 'paged' | 'cursor'; size: number };
  presentation: RecordPresentation;
}
export interface AnalysisConfig {
  filters: FilterConfiguration;
  dimensions: DimensionConfig[];
  metrics: MetricConfig[];
  sort: FieldSort[];
  limit: number;
  presentation: {
    layout: 'table';
    columns: { alias: string; width?: number }[];
  };
}
export interface InstanceIdentity {
  id: string;
  definitionId: string;
  kind: ViewKind;
  scope: Scope;
}
export interface RecordInstance extends InstanceIdentity {
  kind: 'record';
  title: string;
  revision: string;
  config: RecordConfig;
}
export interface AnalysisInstance extends InstanceIdentity {
  kind: 'analysis';
  title: string;
  revision: string;
  config: AnalysisConfig;
}
export type ViewInstance = RecordInstance | AnalysisInstance;
// Deliberately distributive: kind and config remain correlated.
export type CreateInput = ViewInstance extends infer I
  ? I extends ViewInstance
    ? Omit<I, 'id' | 'revision' | 'scope'> & { scope: CreateScope }
    : never
  : never;
export interface RecordCapability {
  rowKey: string;
  layouts: readonly ('table' | 'card')[];
}
export interface AnalysisCapability {
  count: boolean;
  fields: readonly {
    field: string;
    groups: readonly ('TERMS' | 'HISTOGRAM' | 'DATE_HISTOGRAM')[];
    functions: readonly ('SUM' | 'AVG' | 'MIN' | 'MAX')[];
    dateUnits?: readonly string[];
  }[];
  defaultLimit: number;
  maxLimit: number;
}
export type ViewDefinition = {
  id: string;
  sourceId: string;
  title: string;
  fields: readonly FilterFieldDefinition[];
  timeZone?: string;
} & (
  | { record: RecordCapability; analysis?: AnalysisCapability }
  | { record?: never; analysis: AnalysisCapability }
);
type SourceMethods = Pick<
  QueryApi<Record<string, unknown>>,
  'paged' | 'cursor' | 'aggregate'
>;
export type ViewSource = Partial<SourceMethods> &
  (
    | Pick<SourceMethods, 'paged'>
    | Pick<SourceMethods, 'cursor'>
    | Pick<SourceMethods, 'aggregate'>
  );
export interface Permissions {
  save: boolean;
  saveAsPersonal: boolean;
  saveAsShared: boolean;
  rename: boolean;
  delete: boolean;
}
export interface PermissionSnapshot {
  revision: number;
  instances: Readonly<Record<string, Permissions>>;
  reorder: boolean;
}
export interface WriteContext {
  requestId: string;
  signal: AbortSignal;
}
export interface ViewHost {
  definition: {
    load(id: string, signal: AbortSignal): Promise<ViewDefinition>;
  };
  instance: {
    list(
      definitionId: string,
      signal: AbortSignal,
    ): Promise<{ instances: ViewInstance[]; defaultInstanceId: string | null }>;
    load(id: string, signal: AbortSignal): Promise<ViewInstance>;
    save?(instance: ViewInstance, context: WriteContext): Promise<ViewInstance>;
    create?(
      instance: CreateInput,
      context: WriteContext,
    ): Promise<ViewInstance>;
    rename?(
      input: { id: string; title: string; revision: string },
      context: WriteContext,
    ): Promise<ViewInstance>;
    delete?(
      input: { id: string; revision: string },
      context: WriteContext,
    ): Promise<void>;
  };
  permission: {
    load(
      definitionId: string,
      signal: AbortSignal,
    ): Promise<PermissionSnapshot>;
    subscribe(listener: (snapshot: PermissionSnapshot) => void): () => void;
  };
  preference?: {
    saveOrder(
      definitionId: string,
      ids: readonly string[],
      context: WriteContext,
    ): Promise<void>;
  };
  resolveSource(
    sourceId: string,
    signal: AbortSignal,
  ): ViewSource | Promise<ViewSource>;
}
export type OperationResult<T = void> =
  | { status: 'completed'; value: T }
  | { status: 'cancelled'; reason: 'navigation' | 'disposed' | 'user' }
  | { status: 'superseded' };
export interface ValidationIssue {
  componentId?: string;
  path: string;
  code: string;
  message: string;
}
export interface Attempt<C> {
  operationId: string;
  submitted: Working<C>;
  queryKey: string;
  startedAt: number;
  state: 'running' | 'succeeded' | 'failed' | 'cancelled';
  error?: { code: string; message: string };
}
export type WriteAttempt = {
  operationId: string;
  requestId: string;
  submitted:
    | ViewInstance
    | CreateInput
    | { id: string; revision: string; title?: string };
} & (
  | { state: 'running' | 'succeeded' }
  | { state: 'rejected' | 'unknown'; error: { code: string; message: string } }
);
export interface RecordResult {
  kind: 'record';
  query:
    | Parameters<SourceMethods['paged']>[0]
    | Parameters<SourceMethods['cursor']>[0];
  rows: readonly Record<string, unknown>[];
  queryKey: string;
  receivedAt: number;
  pagination:
    | { mode: 'paged'; page: number; total: number }
    | { mode: 'cursor'; nextCursor: string | null };
}
export interface AnalysisResult {
  kind: 'analysis';
  query: AggregationQuery;
  queryKey: string;
  schema: readonly {
    alias: string;
    role: 'dimension' | 'metric';
    valueType: 'string' | 'number' | 'boolean';
    nullable: boolean;
  }[];
  rows: readonly Record<string, unknown>[];
  startedAt: number;
  receivedAt: number;
}
export interface Working<C> {
  title: string;
  config: C;
}
interface SessionBase<I extends ViewInstance, R> {
  saved: I;
  working: Working<I['config']>;
  validation: readonly ValidationIssue[];
  result: R | null;
  queryAttempt: Attempt<I['config']> | null;
  writeAttempt: WriteAttempt | null;
  conflict: { remote: I; comparedEditVersion: number } | null;
  editVersion: number;
  permissions: Permissions;
}
export type RecordSession = { kind: 'record' } & SessionBase<
  RecordInstance,
  RecordResult
>;
export type AnalysisSession = { kind: 'analysis' } & SessionBase<
  AnalysisInstance,
  AnalysisResult
>;
export type ViewSession = RecordSession | AnalysisSession;
export type ViewEntry =
  | { status: 'opening'; id: string }
  | {
      status: 'open-error';
      id: string;
      error: { code: string; message: string };
    }
  | { status: 'loaded'; session: ViewSession };
export interface EngineSnapshot {
  version: number;
  status: 'idle' | 'loading' | 'ready' | 'error' | 'disposed';
  error: { code: string; message: string } | null;
  definition: ViewDefinition | null;
  selectedId: string | null;
  entries: Readonly<Record<string, ViewEntry>>;
}
export interface RecordCommands {
  getSnapshot(): DeepReadonly<RecordSession>;
  edit(
    update: (
      working: DeepReadonly<Working<RecordConfig>>,
    ) => Working<RecordConfig>,
  ): void;
  query(): Promise<OperationResult>;
  page(index: number): Promise<OperationResult>;
  next(): Promise<OperationResult>;
  selectRows(ids: readonly (string | number)[]): void;
}
export interface AnalysisCommands {
  getSnapshot(): DeepReadonly<AnalysisSession>;
  edit(
    update: (
      working: DeepReadonly<Working<AnalysisConfig>>,
    ) => Working<AnalysisConfig>,
  ): void;
  run(): Promise<OperationResult>;
}
export interface RuntimeLimits {
  loadTimeoutMs: number;
  queryTimeoutMs: number;
  writeTimeoutMs: number;
  maxConcurrentQueries: number;
  maxRetainedResults: number;
  maxConfigBytes: number;
}
export interface DiagnosticEvent {
  operationId: string;
  kind?: ViewKind;
  operation:
    'load' | 'query' | 'save' | 'create' | 'rename' | 'delete' | 'reconcile';
  phase: 'started' | 'completed' | 'failed' | 'cancelled' | 'superseded';
  elapsedMs: number;
  errorCode?: string;
}
export interface EngineOptions {
  scopeKey: string;
  definitionId: string;
  host: ViewHost;
  limits?: Partial<RuntimeLimits>;
  onDiagnostic?(event: Readonly<DiagnosticEvent>): void;
}
export interface ViewEngine {
  getSnapshot(): DeepReadonly<EngineSnapshot>;
  subscribe(listener: () => void): () => void;
  load(): Promise<OperationResult>;
  select(id: string): Promise<OperationResult>;
  record(id: string): RecordCommands;
  analysis(id: string): AnalysisCommands;
  save(id: string): Promise<OperationResult>;
  saveAs(
    id: string,
    options: { title: string; scope: CreateScope },
  ): Promise<OperationResult<{ instanceId: string }>>;
  restore(id: string): void;
  reconcile(id: string): Promise<OperationResult>;
  resolveConflict(
    id: string,
    choice: 'use-remote' | 'overwrite',
    remoteRevision: string,
    editVersion: number,
  ): Promise<OperationResult>;
  rename(id: string, title: string): Promise<OperationResult>;
  delete(id: string): Promise<OperationResult>;
  dispose(): void;
}
// Ambient constructor only: consumers can type-check construction without an implementation.
export declare const ViewEngine: { new (options: EngineOptions): ViewEngine };
