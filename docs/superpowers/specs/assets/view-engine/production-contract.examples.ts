/** Compile-only consumer probes; none of this is a runtime implementation. */
import type {
  AnalysisConfig,
  AnalysisInstance,
  CreateInput,
  RecordConfig,
  ViewDefinition,
  ViewEngine,
  ViewSource,
} from './production-contract.js';
import { ViewEngine as EngineConstructor } from './production-contract.js';
import type { ViewHost } from './production-contract.js';
import type { QueryApi } from '@ahoo-wang/fetcher-wow';

declare const engine: ViewEngine;
declare const recordConfig: RecordConfig;
declare const analysisConfig: AnalysisConfig;
declare const analysisInstance: AnalysisInstance;
declare const aggregate: QueryApi<Record<string, unknown>>['aggregate'];

const analysisOnly: ViewDefinition = {
  id: 'sales',
  sourceId: 'sales',
  title: 'Sales',
  fields: [],
  analysis: { count: true, fields: [], defaultLimit: 100, maxLimit: 1000 },
};
const recordOnly: ViewDefinition = {
  id: 'orders',
  sourceId: 'orders',
  title: 'Orders',
  fields: [],
  record: { rowKey: 'id', layouts: ['table'] },
};
const mixed: ViewDefinition = {
  ...recordOnly,
  analysis: analysisOnly.analysis,
};
const aggregateOnly: ViewSource = { aggregate };
const createAnalysis: CreateInput = {
  definitionId: 'sales',
  kind: 'analysis',
  title: 'My sales',
  scope: { type: 'personal' },
  config: analysisConfig,
};
const localReadOnlyHost: ViewHost = {
  definition: { load: async () => analysisOnly },
  instance: {
    list: async () => ({
      instances: [analysisInstance],
      defaultInstanceId: analysisInstance.id,
    }),
    load: async () => analysisInstance,
  },
  permission: {
    load: async () => ({ revision: 0, instances: {}, reorder: false }),
    subscribe: () => () => {},
  },
  resolveSource: () => aggregateOnly,
};
const owned = new EngineConstructor({
  scopeKey: 'user-a',
  definitionId: 'sales',
  host: localReadOnlyHost,
});
owned.analysis('sales-report').run();

// @ts-expect-error A definition must declare at least one view capability.
const noCapabilities: ViewDefinition = {
  id: 'x',
  sourceId: 'x',
  title: 'x',
  fields: [],
};
// @ts-expect-error An empty source implements no query capability.
const emptySource: ViewSource = {};
// @ts-expect-error The discriminator must agree with its config.
const crossedCreate: CreateInput = {
  definitionId: 'x',
  kind: 'analysis',
  title: 'x',
  scope: { type: 'personal' },
  config: recordConfig,
};
// @ts-expect-error System instances cannot be created using user save-as.
engine.saveAs('x', { title: 'x', scope: { type: 'public', source: 'system' } });
// @ts-expect-error Analysis commands do not expose record pagination.
engine.analysis('x').page(2);
// @ts-expect-error Record commands do not expose analysis run.
engine.record('x').run();
// @ts-expect-error Shared persistence has no record paging method.
engine.page(1);
// @ts-expect-error A caller cannot mutate a published snapshot.
engine.analysis('x').getSnapshot().working.title = 'mutated';
engine.analysis('x').edit(working => {
  // @ts-expect-error An editor callback cannot mutate its input snapshot.
  working.title = 'mutated';
  return { title: 'new', config: analysisConfig };
});
// @ts-expect-error Server instances require revisions.
const noRevision: AnalysisInstance = {
  id: 'x',
  definitionId: 'sales',
  kind: 'analysis',
  title: 'x',
  scope: { type: 'personal' },
  config: analysisConfig,
};

const entry = engine.getSnapshot().entries.x;
if (entry.status === 'loaded' && entry.session.kind === 'analysis') {
  entry.session.working.config.metrics;
  // @ts-expect-error A narrowed analysis session has no record pagination config.
  entry.session.working.config.pagination;
}
void [
  mixed,
  aggregateOnly,
  createAnalysis,
  noCapabilities,
  emptySource,
  crossedCreate,
  noRevision,
  analysisInstance,
];
