/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { expect, it } from 'vitest';
import {
  aggregation,
  FilterOperator,
  AggregationGroupType,
  AggregationFunction,
  AggregationDateUnit,
} from '@ahoo-wang/fetcher-wow';
import {
  validateViewDefinition,
  validateViewInstance,
  createFilterConfiguration,
  ViewEngine,
} from '../src/index.js';
import type { ViewDefinition, AnalysisViewInstance } from '../src/index.js';
const definition: ViewDefinition = {
  id: 'analysis',
  title: 'Analysis',
  sourceId: 'source',
  fields: [{ field: 'state', label: 'State', type: 'string' }],
  analysis: {
    count: true,
    fields: [
      { field: 'state', groups: [AggregationGroupType.TERMS], functions: [] },
    ],
  },
};
const instance: AnalysisViewInstance = {
  id: 'a',
  definitionId: 'analysis',
  title: 'A',
  kind: 'analysis',
  scope: { type: 'personal' },
  revision: '1',
  config: {
    dimensions: [],
    metrics: [
      {
        id: 'count',
        alias: 'n',
        title: 'Count',
        component: { name: 'count' },
        props: {},
      },
    ],
    sort: [],
    limit: 100,
    filters: createFilterConfiguration({
      id: 'all',
      component: { name: 'builtin' },
      operator: FilterOperator.MATCH_ALL,
      props: {},
    }),
    presentation: { layout: 'table', columns: [] },
  },
};
it.each([
  { fields: [null] },
  { fields: [{ field: 'state' }] },
  { fields: [{ field: 'state', groups: ['wrong'], functions: [] }] },
  { fields: [{ field: 'state', groups: [], functions: ['wrong'] }] },
  {
    fields: [
      { field: 'state', groups: [], functions: [], dateUnits: ['wrong'] },
    ],
  },
  { fields: [{ field: 'state', groups: [], functions: [], any: 1 }] },
  { expressions: 1 },
  { scopes: {} },
  { scopes: [null] },
  { limits: { maxGroups: 33 } },
  { limits: { maxMetrics: 0 } },
  { limits: { maxSort: '32' } },
  { limits: { maxLimit: Infinity } },
  {
    scopes: [
      {
        id: 'x',
        label: 'X',
        elements: [],
        fields: [],
        capability: { count: true, fields: [] },
      },
    ],
  },
  {
    fields: [
      { field: 'state', groups: [], functions: [] },
      { field: 'state', groups: [], functions: [] },
    ],
  },
])('rejects malformed analysis capability before publication: %j', patch => {
  expect(() =>
    validateViewDefinition({
      ...definition,
      analysis: { ...definition.analysis, ...patch },
    }),
  ).toThrow();
});
it('admits scoped numeric capabilities with formatting and tightened limits', () => {
  const numeric = {
    field: 'amount',
    groups: [AggregationGroupType.HISTOGRAM],
    functions: [AggregationFunction.SUM],
    dateUnits: [AggregationDateUnit.DAY],
    any: true,
    unit: 'CNY',
    numberFormat: { maximumFractionDigits: 2 },
  };
  expect(() =>
    validateViewDefinition({
      ...definition,
      analysis: {
        count: true,
        fields: [numeric],
        expressions: true,
        limits: { maxGroups: 2, maxMetrics: 3 },
        scopes: [
          {
            id: 'items',
            label: 'Items',
            elements: [{ path: 'items', fields: [] }],
            fields: [],
            capability: { count: true, fields: [numeric] },
          },
        ],
      },
    }),
  ).not.toThrow();
});
it.each([
  { dimensions: [null] },
  { metrics: ['bad'] },
  { metrics: [{ id: 'x', alias: 'x', title: 'X', props: {} }] },
  { metrics: [{ ...instance.config.metrics[0], props: null }] },
  { sort: [null] },
  { sort: [{ alias: 'n', direction: 'wrong' }] },
  { scope: { id: 'x', filters: null } },
  { dimensions: [{ ...instance.config.metrics[0], label: null }] },
])(
  'rejects malformed analysis components even with semantic validation disabled: %j',
  patch => {
    expect(() =>
      validateViewInstance(
        { ...instance, config: { ...instance.config, ...patch } },
        definition,
        undefined,
        false,
      ),
    ).toThrow();
  },
);
it('keeps structurally valid incomplete drafts recoverable', () => {
  expect(() =>
    validateViewInstance(
      {
        ...instance,
        config: {
          ...instance.config,
          limit: '-',
          metrics: [
            {
              ...instance.config.metrics[0],
              component: { name: 'unknown-extension' },
              title: '',
              alias: '',
            },
          ],
        },
      },
      definition,
      undefined,
      false,
    ),
  ).not.toThrow();
});
it('snapshots analysis compiler functions rather than retaining mutable entries', () => {
  const original = () => aggregation.count('n');
  const compiler = { compile: original };
  const engine = new ViewEngine({
    definitionId: definition.id,
    definition,
    host: {},
    analysisCompilers: { custom: compiler },
  });
  try {
    compiler.compile = () => aggregation.count('changed');
    expect(engine.analysisCompilers.custom.compile).toBe(original);
    expect(Object.isFrozen(engine.analysisCompilers.custom)).toBe(true);
  } finally {
    engine.dispose();
  }
});
