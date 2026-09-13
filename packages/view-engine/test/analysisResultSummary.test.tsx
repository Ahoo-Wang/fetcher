/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may obtain a copy at http://www.apache.org/licenses/LICENSE-2.0
 */
import { it, expect } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { AnalysisResultSummary } from '../src/analysis/AnalysisResultSummary.js';
import { FilterOperator } from '@ahoo-wang/fetcher-wow';
import type { AnalysisSession } from '../src/contracts/viewModel.js';
it('describes a compiled unconditional element scope as all records', () => {
  const all = {
    mode: 'simple' as const,
    root: {
      id: 'all',
      component: { name: 'builtin' },
      operator: FilterOperator.AND,
      children: [],
      props: {},
    },
  };
  const result = {
    config: {
      filters: all,
      dimensions: [],
      metrics: [],
      sort: [],
      limit: 10,
      scope: { id: 'items', filters: [all] },
      presentation: { layout: 'table', columns: [] },
    },
    plan: { query: { metrics: [], elements: [{ path: 'items' }] }, schema: [] },
    rows: [],
    receivedAt: 0,
  } as unknown as NonNullable<AnalysisSession['result']>;
  const html = renderToStaticMarkup(
    <AnalysisResultSummary
      result={result}
      definition={{ id: 'd', title: 'D', sourceId: 's', fields: [] }}
      compilers={{}}
    />,
  );
  expect(html).toContain('元素 1：全部记录');
});

it('describes executed metric filters and HAVING even when supplied by a compiler', () => {
  const result = {
    config: {
      filters: {
        mode: 'simple',
        root: {
          id: 'root',
          component: { name: 'builtin' },
          operator: FilterOperator.MATCH_ALL,
          props: {},
        },
      },
      dimensions: [],
      metrics: [
        {
          id: 'orders',
          alias: 'orders',
          title: '订单数',
          component: { name: 'custom' },
          props: {},
        },
      ],
      sort: [],
      limit: 100,
      presentation: { layout: 'table', columns: [] },
    },
    plan: {
      query: {
        metrics: [
          {
            type: 'COUNT',
            alias: 'orders',
            filter: { op: 'EQ', field: 'status', value: 'PAID' },
          },
        ],
        having: {
          type: 'CONDITION',
          metric: 'orders',
          operator: 'GTE',
          value: 100,
        },
      },
      schema: [
        {
          id: 'orders',
          alias: 'orders',
          title: '订单数',
          role: 'metric',
          valueType: 'number',
          nullable: false,
          aggregation: 'COUNT',
        },
      ],
    },
    rows: [],
    receivedAt: 0,
  } as unknown as NonNullable<AnalysisSession['result']>;
  const html = renderToStaticMarkup(
    <AnalysisResultSummary
      result={result}
      definition={{
        id: 'd',
        title: 'D',
        sourceId: 's',
        fields: [
          {
            field: 'status',
            label: '支付状态',
            type: 'string',
            options: [{ value: 'PAID', label: '已支付' }],
          },
        ],
      }}
      compilers={{}}
    />,
  );
  expect(html).toContain('订单数 统计条件：支付状态 等于 已支付');
  expect(html).toContain('结果筛选：订单数 大于等于 100');
  const nested = {
    ...result,
    plan: {
      ...result.plan,
      query: {
        ...result.plan.query,
        having: {
          type: 'AND',
          operands: [
            { type: 'BETWEEN', metric: 'orders', lower: 1, upper: 5 },
            {
              type: 'OR',
              operands: [
                { type: 'IN', metric: 'orders', values: [1, 3] },
                { type: 'IS_NULL', metric: 'orders' },
                { type: 'IS_NULL', metric: 'orders', negated: true },
              ],
            },
          ],
        },
      },
    },
  } as unknown as NonNullable<AnalysisSession['result']>;
  const nestedHtml = renderToStaticMarkup(
    <AnalysisResultSummary
      result={nested}
      definition={{ id: 'd', title: 'D', sourceId: 's', fields: [] }}
      compilers={{}}
    />,
  );
  for (const text of [
    '订单数 介于 1 至 5',
    '订单数 属于 [1、3]',
    '订单数 为空值',
    '订单数 非空值',
  ])
    expect(nestedHtml).toContain(text);
});
