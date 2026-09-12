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
import '@ahoo-wang/fetcher-view-engine/styles.css';
import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import {
  AggregationFunction,
  AggregationGroupType,
  FilterOperator,
} from '@ahoo-wang/fetcher-wow';
import {
  MemoryViewHost,
  createFilterConfiguration,
  type ViewDefinition,
  type ViewInstance,
  type DashboardViewInstance,
  type ViewHost,
} from '@ahoo-wang/fetcher-view-engine';
import { useViewEngine, ViewPage } from '@ahoo-wang/fetcher-view-engine/react';
import { createOrderSource } from '../../packages/view-engine/examples/react/sales-order/querySource.js';

const fields = [
  { field: 'id', label: '编号', type: 'string' as const },
  { field: 'region', label: '区域', type: 'string' as const },
  { field: 'amount', label: '金额 / 数量', type: 'number' as const },
];
const root: ViewDefinition = {
  id: 'overview',
  title: '业务观察台',
  fields,
  dashboard: true,
};
const definitions: ViewDefinition[] = ['订单', '客户', '库存'].map(
  (title, index) => ({
    id: `business-${index}`,
    title,
    sourceId: `source-${index}`,
    fields,
    record: { rowKey: 'id', allowedLayouts: ['table'] },
    analysis: {
      count: true,
      fields: [
        {
          field: 'region',
          groups: [AggregationGroupType.TERMS],
          functions: [],
        },
        { field: 'amount', groups: [], functions: [AggregationFunction.SUM] },
      ],
    },
  }),
);
const filters = createFilterConfiguration({
  id: 'all',
  component: { name: 'builtin' },
  operator: FilterOperator.MATCH_ALL,
  props: {},
});
const children: ViewInstance[] = definitions.map((definition, index) => ({
  id: `saved-${index}`,
  definitionId: definition.id,
  title: `${definition.title}明细`,
  kind: 'record',
  revision: '1',
  scope: { type: 'personal' },
  config: {
    filters,
    sort: [],
    pagination: { mode: 'paged', size: 10 },
    presentation: {
      layout: 'table',
      table: {
        columns: fields.map(field => ({
          id: field.field,
          kind: 'field',
          field: field.field,
        })),
      },
    },
  },
}));
children.push({
  id: 'regional-total',
  definitionId: definitions[0].id,
  title: '区域销售总额',
  kind: 'analysis',
  revision: '1',
  scope: { type: 'personal' },
  config: {
    filters,
    dimensions: [
      {
        id: 'region',
        component: { name: 'terms' },
        field: 'region',
        alias: 'region',
        title: '区域',
        props: {},
      },
    ],
    metrics: [
      {
        id: 'total',
        component: { name: 'numeric' },
        field: 'amount',
        alias: 'total',
        title: '金额合计',
        props: { function: AggregationFunction.SUM },
      },
    ],
    sort: [],
    limit: 100,
    presentation: { layout: 'table', columns: [] },
  },
});
const dashboard: DashboardViewInstance = {
  id: 'sales',
  definitionId: root.id,
  title: '销售概览',
  kind: 'dashboard',
  revision: '1',
  scope: { type: 'personal' },
  config: {
    schemaVersion: 1,
    panels: [
      {
        id: 'orders',
        instanceId: 'saved-0',
        layout: { x: 0, y: 0, w: 6, h: 18 },
      },
      {
        id: 'customers',
        instanceId: 'saved-1',
        layout: { x: 6, y: 0, w: 6, h: 18 },
      },
      {
        id: 'stock',
        instanceId: 'saved-2',
        layout: { x: 0, y: 18, w: 6, h: 18 },
      },
      {
        id: 'analysis',
        instanceId: 'regional-total',
        layout: { x: 6, y: 18, w: 6, h: 18 },
      },
    ],
    filters: [],
  },
};
function DashboardExample({
  empty = false,
  readOnly = false,
  saveAsOnly = false,
  missingReference = false,
}: {
  empty?: boolean;
  readOnly?: boolean;
  saveAsOnly?: boolean;
  missingReference?: boolean;
}) {
  const [host] = useState<ViewHost>(() => {
    const source = createOrderSource(() =>
      Array.from({ length: 25 }, (_, index) => ({
        id: `SO-${index + 1}`,
        region: index % 2 ? '华南' : '华东',
        amount: (index + 1) * 120,
      })),
    );
    const memory = new MemoryViewHost({
      definition: root,
      instances: {
        instances: empty ? [] : [dashboard],
        defaultInstanceId: empty ? null : dashboard.id,
      },
      serviceKey: 'dashboard-story',
      scopeKey: 'reader',
      supportedFormats: { record: true, analysis: true, dashboard: 1 },
      resolveSource: () => source,
      definitionPermissions: () => ({
        createPersonal: !readOnly && !saveAsOnly,
        createShared: !readOnly && !saveAsOnly,
      }),
      instancePermissions: () => ({
        save: !readOnly && !saveAsOnly,
        saveAsPersonal: !readOnly,
        saveAsShared: !readOnly,
        rename: !readOnly,
        delete: !readOnly,
      }),
    });
    return {
      ...memory,
      permission: memory.permission,
      preference: memory.preference,
      definition: {
        load: (id, signal) => {
          const found = definitions.find(definition => definition.id === id);
          return found
            ? Promise.resolve(found)
            : memory.definition.load(id, signal);
        },
      },
      instance: {
        ...memory.instance,
        load: (id, signal) => {
          if (missingReference && id === 'saved-2')
            return Promise.reject(new Error('库存视图已停用，请替换引用'));
          const found = children.find(instance => instance.id === id);
          return found
            ? Promise.resolve(found)
            : memory.instance.load(id, signal);
        },
      },
      resolveSource: () => source,
      dashboard: {
        search: ({ query, cursor }) => {
          const matches = children.filter(instance =>
            instance.title.includes(query),
          );
          const start = Number(cursor ?? 0);
          return Promise.resolve({
            items: matches.slice(start, start + 2).map(instance => ({
              id: instance.id,
              definitionId: instance.definitionId,
              title: instance.title,
              kind: instance.kind as 'record' | 'analysis',
            })),
            nextCursor: start + 2 < matches.length ? String(start + 2) : null,
          });
        },
        openOriginal: reference => {
          window.alert(
            `宿主编辑入口：${reference.definitionId} / ${reference.instanceId}`,
          );
        },
      },
    };
  });
  const binding = useViewEngine({
    scopeKey: 'dashboard-story',
    definitionId: root.id,
    host,
  });
  return <ViewPage {...binding} />;
}
const meta = {
  id: 'view-engine-dashboard',
  title: 'View Engine/数据视图/仪表盘',
  component: DashboardExample,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof DashboardExample>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Overview: Story = { name: '跨定义记录与分析' };
export const FirstDashboard: Story = {
  name: '从空白创建',
  args: { empty: true },
};
export const SaveAsOnly: Story = {
  name: '仅另存权限',
  args: { saveAsOnly: true },
};
export const ReadOnly: Story = { name: '只读浏览', args: { readOnly: true } };
export const MissingReference: Story = {
  name: '失效引用与修复',
  args: { missingReference: true },
};
export const Dark: Story = {
  name: '深色主题',
  decorators: [
    Story => (
      <div className="dark fve:min-h-screen fve:bg-background fve:text-foreground">
        <Story />
      </div>
    ),
  ],
};
