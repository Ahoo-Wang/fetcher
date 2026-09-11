/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { expect, it } from 'vitest';
import { aggregation, AggregationFunction } from '@ahoo-wang/fetcher-wow';
import type { AnalysisPlan } from '../src/analysis/analysisModel.js';
import {
  initialDisplayMapping,
  suitableVisualizations,
} from '../src/analysis/analysisDisplaySelection.js';
import { projectAnalysis } from '../src/analysis/analysisProjection.js';
const plan: AnalysisPlan = {
  query: {
    metrics: [aggregation.sum(aggregation.field('amount'), 'amount')],
    groupBy: [
      aggregation.terms('product', 'product'),
      aggregation.terms('channel', 'channel'),
    ],
  },
  schema: [
    {
      id: 'product',
      alias: 'product',
      title: '商品',
      role: 'dimension',
      valueType: 'string',
      nullable: false,
    },
    {
      id: 'channel',
      alias: 'channel',
      title: '渠道',
      role: 'dimension',
      valueType: 'string',
      nullable: false,
    },
    {
      id: 'amount',
      alias: 'amount',
      title: '销售额',
      role: 'metric',
      valueType: 'number',
      nullable: false,
      aggregation: AggregationFunction.SUM,
    },
  ],
};
it('leaves ambiguous axes unselected while identifying usable chart types without mutating data', () => {
  const rows = [{ product: 'P1', channel: 'web', amount: 3 }];
  const next = initialDisplayMapping(
    { layout: 'table', columns: [] },
    plan,
    'bar',
  );
  expect(next).toMatchObject({ x: '', series: '', metrics: ['amount'] });
  expect(projectAnalysis(plan, rows, next).issues.length).toBeGreaterThan(0);
  expect(suitableVisualizations(plan, rows).map(item => item.value)).toContain(
    'bar',
  );
  expect(
    suitableVisualizations(plan, rows).map(item => item.value),
  ).not.toContain('pie');
  expect(rows).toEqual([{ product: 'P1', channel: 'web', amount: 3 }]);
});
it('initializes only unique mappings and preserves an explicit saved selection', () => {
  const unique = {
    ...plan,
    schema: plan.schema.filter(column => column.alias !== 'channel'),
  };
  expect(
    initialDisplayMapping({ layout: 'table', columns: [] }, unique, 'bar'),
  ).toMatchObject({ x: 'product', metrics: ['amount'] });
  const multiple = {
    ...unique,
    schema: [
      ...unique.schema,
      { ...plan.schema[2], id: 'other', alias: 'other' },
    ],
  };
  expect(
    initialDisplayMapping({ layout: 'table', columns: [] }, multiple, 'bar')
      .metrics,
  ).toEqual([]);
  expect(
    initialDisplayMapping(
      { layout: 'table', columns: [], metrics: ['other'] },
      multiple,
      'bar',
    ).metrics,
  ).toEqual(['other']);
});
