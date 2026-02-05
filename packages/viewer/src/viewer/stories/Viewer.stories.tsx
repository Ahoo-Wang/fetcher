import type { Meta, StoryObj } from '@storybook/react';

import { Viewer, ViewerProps } from '../Viewer';
import {
  View,
  ViewColumn,
  ViewDefinition,
  ViewType,
  ViewSource,
} from '../types';
import { ViewTableActionColumn } from '../../table';
import { Button } from 'antd';
import {
  all,
  eq,
  id,
  MaterializedSnapshot,
  Operator,
  PagedQuery,
} from '@ahoo-wang/fetcher-wow';
import {
  COLUMN_HEIGHT_BAR_ITEM_TYPE,
  FILTER_BAR_ITEM_TYPE,
  REFRESH_DATA_BAR_ITEM_TYPE,
  SHARE_LINK_BAR_ITEM_TYPE,
} from '../../topbar';
import { ActiveFilter } from '../../filter';
import { ViewManageItem, ViewPanel } from '../panel';
import { TableRecordType } from '../../types';
import { useEffect, useState } from 'react';
import { useExecutePromise, useFetcher } from '@ahoo-wang/fetcher-react';
import { ResultExtractors } from '@ahoo-wang/fetcher';

export interface BusinessPartnerId {
  bizId: string;
  id: string;
  name: string;
}

export interface IntRange {
  start: number;
  end: number;
}

export enum DeliveryTimeType {
  NONE = `NONE`,
  SPOT = `SPOT`,
  PROXY_SPOT = `PROXY_SPOT`,
  FORWARD = `FORWARD`,
}

export interface DeliveryTime {
  deliveryCycle: IntRange;
  type: DeliveryTimeType;
}

export interface CostPrice {
  costPrice: number;
  costSource: string;
  deliveryTime: DeliveryTime;
  expiryDate: number;
  modifiedTime: number;
  moq: number;
  remark: string;
}

export interface SkuId {
  bizId: string;
  brandId: string;
  brandName: string;
  code: string;
  id: string;
  isComposite: boolean;
  orderNo: string;
}

export interface SkuCostState {
  readonly businessPartnerId: BusinessPartnerId;
  costPrices: CostPrice[];
  readonly skuId: SkuId;
  readonly costCount: number;
  readonly hasCost: boolean;
  readonly id: string;
  readonly isComposite: boolean;
  readonly latestCostPrice: CostPrice;
}

const meta: Meta<typeof Viewer<MaterializedSnapshot<SkuCostState>>> = {
  title: 'Viewer/Viewer/Viewer',
  component: Viewer,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A panel component that displays personal and public views in collapsible sections.',
      },
    },
  },
};

const viewDefinition: ViewDefinition = {
  id: 'sku-cost',
  name: 'SKU成本',
  fields: [
    {
      label: '成本编号',
      name: 'state.id',
      primaryKey: true,
      type: 'id',
      attributes: {},
      sorter: { multiple: 1 },
    },
    {
      label: '供应商编号',
      name: 'state.businessPartnerId.id',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      label: '供应商名称',
      name: 'state.businessPartnerId.name',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      label: '供应商业务编号',
      name: 'state.businessPartnerId.bizId',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      label: 'SKU No.',
      name: 'state.skuId.code',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      label: '品牌名称',
      name: 'state.skuId.brandName',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: { multiple: 2 },
    },
    {
      label: 'SKU订货号',
      name: 'state.skuId.orderNo',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      label: '成本数',
      name: 'state.costCount',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
  ],
  availableFilters: [
    {
      label: 'Basic Filters',
      filters: [
        {
          field: {
            name: 'state.id',
            label: '成本编号',
          },
          component: 'id',
        },
        {
          field: {
            name: 'state.businessPartnerId.name',
            label: '供应商名称',
          },
          component: 'text',
        },
        {
          field: {
            name: 'state.skuId.code',
            label: 'SKU No.',
          },
          component: 'text',
        },
        {
          field: {
            name: 'state.skuId.orderNo',
            label: 'SKU订货号',
          },
          component: 'text',
        },
        {
          field: {
            name: 'state.skuId.brandName',
            label: '品牌名称',
          },
          component: 'text',
        },
        {
          field: {
            name: 'state.costCount',
            label: '成本数',
          },
          component: 'number',
        },
      ],
    },
  ],
  dataUrl:
    'http://procurement-service.dev.svc.cluster.local/tenant/mydao/sku_cost/snapshot/paged',
  countUrl:
    'http://procurement-service.dev.svc.cluster.local/tenant/mydao/sku_cost/snapshot/count',
};

const columns: ViewColumn[] = [
  {
    name: 'state.id',
    fixed: true,
    hidden: false,
    width: '300px',
  },
  {
    name: 'state.businessPartnerId.id',
    fixed: false,
    hidden: false,
    width: '500px',
  },
  {
    name: 'state.businessPartnerId.name',
    fixed: false,
    hidden: false,
    width: '300px',
  },
  {
    name: 'state.businessPartnerId.bizId',
    fixed: false,
    hidden: false,
    width: '200px',
  },
  {
    name: 'state.skuId.code',
    fixed: false,
    hidden: false,
    width: '300px',
  },
  {
    name: 'state.skuId.brandName',
    fixed: false,
    hidden: false,
    width: '300px',
  },
  {
    name: 'state.skuId.orderNo',
    fixed: false,
    hidden: false,
    width: '300px',
  },
  {
    name: 'state.costCount',
    fixed: false,
    hidden: false,
    width: '300px',
  },
];

const createSampleView = (
  id: string,
  name: string,
  viewType: ViewType = 'PERSONAL',
  viewSource: ViewSource = 'CUSTOM',
  filters: ActiveFilter[] = [
    {
      key: 'state.id',
      type: 'id',
      field: {
        name: 'state.id',
        label: '成本编号',
      },
      value: {
        defaultValue: undefined,
      },
      operator: {
        defaultValue: undefined,
      },
    },
    {
      key: 'state.skuId.code',
      type: 'text',
      field: {
        name: 'state.skuId.code',
        label: 'SKU No.',
      },
      value: {
        defaultValue: undefined,
      },
      operator: {
        defaultValue: undefined,
      },
    },
    {
      key: 'state.skuId.brandName',
      type: 'text',
      field: {
        name: 'state.skuId.brandName',
        label: '品牌',
      },
      value: {
        defaultValue: undefined,
      },
      operator: {
        defaultValue: undefined,
      },
    },
  ],
): View => ({
  id,
  name,
  definitionId: '',
  type: viewType,
  source: viewSource,
  isDefault: false,
  filters: filters,
  columns: columns,
  tableSize: 'middle',
  pagedQuery: {
    condition: {
      operator: Operator.ALL,
    },
    pagination: {
      index: 1,
      size: 10,
    },
  },
  pageSize: 0,
  sort: 0,
});

const sampleViews: View[] = [
  createSampleView('1', 'My Personal View', 'PERSONAL'),
  createSampleView('2', 'Another Personal View', 'PERSONAL', 'CUSTOM', [
    {
      key: 'id',
      type: 'id',
      field: {
        name: 'state.id',
        label: '成本编号',
      },
      value: {
        defaultValue: undefined,
      },
      operator: {
        defaultValue: undefined,
      },
    },
    {
      key: 'brandName',
      type: 'text',
      field: {
        name: 'state.skuId.brandName',
        label: '品牌名称',
      },
      value: {
        defaultValue: undefined,
      },
      operator: {
        defaultValue: undefined,
      },
    },
  ]),
  createSampleView('3', 'Team Public View', 'SHARED'),
  createSampleView('4', 'Company Public View', 'SHARED'),
  createSampleView('5', 'System Public View', 'SHARED', 'SYSTEM'),
];

const actionColumn: ViewTableActionColumn<
  TableRecordType<MaterializedSnapshot<SkuCostState>>
> = {
  title: 'More',
  dataIndex: 'id',
  configurable: true,
  actions: record => {
    if (record.state?.id === '3S98-SK-190TH') {
      return {
        primaryAction: record => (
          <Button type="link" onClick={() => console.log('View', record)}>
            Custom Action
          </Button>
        ),
        moreActionTitle: 'More',
        secondaryActions: [],
      };
    } else {
      return {
        primaryAction: {
          data: { value: 'Edit', record, index: 0 },
          attributes: { onClick: () => console.log('Edit', record) },
        },
        moreActionTitle: '更多',
        secondaryActions: [
          {
            key: 'delete',
            data: { value: 'Delete', record, index: 1 },
            attributes: { onClick: () => console.log('Delete', record) },
          },
        ],
      };
    }
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const ViewerWrapper = (
  args: ViewerProps<MaterializedSnapshot<SkuCostState>>,
) => {
  const viewResult: View[] = [
    {
      id: '0V6OiaTU00em003',
      name: '全部采购订单',
      definitionId: 'purchase-order',
      type: 'SHARED',
      source: 'SYSTEM',
      columns: [
        {
          name: 'state.id',
          fixed: false,
          width: '140px',
          sortOrder: null,
          hidden: true,
        },
        {
          name: 'state.status',
          fixed: false,
          hidden: true,
          width: '120px',
          sortOrder: null,
        },
      ],
      filters: [
        {
          type: 'id',
          field: {
            name: 'state.id',
            label: '采购订单编号',
          },
          key: 'state.id',
        },
        {
          type: 'select',
          field: {
            name: 'state.status',
            label: '订单状态',
          },
          key: 'state.status',
        },
        {
          type: 'select',
          field: {
            name: 'state.name',
            label: '订单',
          },
          key: 'state.name',
        },
      ],
      tableSize: 'middle',
      pageSize: 20,
      sort: 1,
      pagedQuery: {
        projection: {},
        pagination: {
          index: 1,
          size: 10,
        },
        condition: all(),
      },
      isDefault: true,
    },
  ];

  const definitionResult: ViewDefinition = {
    id: 'purchase-order',
    name: '采购订单管理',
    fields: [
      {
        label: '采购订单编号',
        name: 'state.id',
        primaryKey: true,
        sorter: null,
        attributes: null,
        type: 'id',
      },
      {
        label: '订单状态',
        name: 'state.status',
        primaryKey: false,
        sorter: null,
        attributes: null,
        type: 'text',
      },
    ],
    availableFilters: [
      {
        label: '基本信息',
        filters: [
          {
            field: {
              name: 'state.id',
              label: '采购订单编号',
            },
            component: 'id',
          },

          {
            field: {
              name: 'state.status',
              label: '订单状态',
            },
            component: 'select',
          },
        ],
      },
    ],
    dataUrl: '/procurement/tenant/mydao/purchase_order/snapshot/paged',
    countUrl: '/procurement/tenant/mydao/purchase_order/snapshot/count',
  };

  if (definitionResult && viewResult) {
    return (
      <div>
        <Viewer<MaterializedSnapshot<SkuCostState>>
          {...args}
          views={viewResult}
          definition={definitionResult}
        ></Viewer>
      </div>
    );
  }

  return null;
};

export const Default: Story = {
  args: {
    views: sampleViews,
    defaultView: sampleViews[0],
    actionColumn: actionColumn,
    supportedTopbarItems: [
      FILTER_BAR_ITEM_TYPE,
      REFRESH_DATA_BAR_ITEM_TYPE,
      COLUMN_HEIGHT_BAR_ITEM_TYPE,
      SHARE_LINK_BAR_ITEM_TYPE,
    ],
    viewManagement: {
      enabled: false,
    },
    batchOperationConfig: {
      enabled: true,
      title: 'Batch Operate',
      actions: [
        {
          title: 'Bulk Delete',
          onClick: (items: MaterializedSnapshot<SkuCostState>[]) => {
            console.log('Bulk Delete', items);
          },
        },
      ],
    },
    primaryAction: {
      title: 'Primary Button',
      onClick: (items: MaterializedSnapshot<SkuCostState>[]) => {
        console.log('Primary Button', items);
      },
    },
    secondaryActions: [
      {
        title: 'Secondary Button',
        onClick: (items: MaterializedSnapshot<SkuCostState>[]) => {
          console.log('Secondary Button', items);
        },
      },
    ],
    onClickPrimaryKey: (
      id: string,
      record: MaterializedSnapshot<SkuCostState>,
    ) => {
      console.log('Click Primary Key', id, record);
    },
    dataSource: [],
    onLoadData: pagedQuery => {
      console.log('Load data with query:', pagedQuery);
    },
  } satisfies Story['args'],
  render: args => <ViewerWrapper {...args} />,
};

export const Empty: Story = {
  args: {
    ...Default.args,
    dataSource: [],
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithViewManagement: Story = {
  args: {
    ...Default.args,
    viewManagement: {
      enabled: true,
      onCreateView: (view: View) => console.log('Create view:', view),
      onDeleteView: (view: View) => console.log('Delete view:', view),
      onUpdateView: (view: View) => console.log('Update view:', view),
    },
  },
  render: args => <ViewerWrapper {...args} />,
};

export const SmallTableSize: Story = {
  args: {
    ...Default.args,
    views: sampleViews.map(v => ({ ...v, tableSize: 'small' as const })),
  },
  render: args => <ViewerWrapper {...args} />,
};

export const LargeTableSize: Story = {
  args: {
    ...Default.args,
    views: sampleViews.map(v => ({ ...v, tableSize: 'large' as const })),
  },
  render: args => <ViewerWrapper {...args} />,
};

export const NoBatchOperations: Story = {
  args: {
    ...Default.args,
    batchOperationConfig: undefined,
  },
  render: args => <ViewerWrapper {...args} />,
};

export const NoTopBarItems: Story = {
  args: {
    ...Default.args,
    supportedTopbarItems: [],
  },
  render: args => <ViewerWrapper {...args} />,
};

export const OnlyFilterAndRefresh: Story = {
  args: {
    ...Default.args,
    supportedTopbarItems: [FILTER_BAR_ITEM_TYPE, REFRESH_DATA_BAR_ITEM_TYPE],
  },
  render: args => <ViewerWrapper {...args} />,
};

export const WithInitialFilters: Story = {
  args: {
    ...Default.args,
    views: [
      createSampleView('1', 'Filtered View', 'PERSONAL', 'CUSTOM', [
        {
          key: 'brandName',
          type: 'text',
          field: {
            name: 'state.skuId.brandName',
            label: '品牌名称',
          },
          value: {
            defaultValue: 'Nike',
          },
          operator: {
            defaultValue: Operator.CONTAINS,
          },
        },
      ]),
      ...sampleViews.slice(1),
    ],
  },
  render: args => <ViewerWrapper {...args} />,
};

export const SinglePersonalView: Story = {
  args: {
    ...Default.args,
    views: [createSampleView('1', 'My Only View', 'PERSONAL')],
  },
  render: args => <ViewerWrapper {...args} />,
};

export const MultipleSharedViews: Story = {
  args: {
    ...Default.args,
    views: [
      createSampleView('1', 'Team Dashboard', 'SHARED', 'CUSTOM'),
      createSampleView('2', 'Department Overview', 'SHARED', 'CUSTOM'),
      createSampleView('3', 'Company Report', 'SHARED', 'SYSTEM'),
    ],
  },
  render: args => <ViewerWrapper {...args} />,
};
