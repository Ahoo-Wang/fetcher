import type { Meta, StoryObj } from '@storybook/react';

import { Viewer } from '../Viewer';
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
  MaterializedSnapshot,
  Operator,
} from '@ahoo-wang/fetcher-wow';
import {
  COLUMN_HEIGHT_BAR_ITEM_TYPE,
  FILTER_BAR_ITEM_TYPE,
  REFRESH_DATA_BAR_ITEM_TYPE,
  SHARE_LINK_BAR_ITEM_TYPE,
} from '../../topbar';
import { ActiveFilter } from '../../filter';

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

const meta: Meta = {
  title: 'Viewer',
  component: Viewer,
  tags: ['autodocs'],
};

const viewDefinition: ViewDefinition = {
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
  internalCondition: {},
  checkable: true,
};

const columns: ViewColumn[] = [
  {
    name: 'state.id',
    fixed: true,
    visible: true,
    width: '300px',
  },
  {
    name: 'state.businessPartnerId.id',
    fixed: false,
    visible: true,
    width: '500px',
  },
  {
    name: 'state.businessPartnerId.name',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    name: 'state.businessPartnerId.bizId',
    fixed: false,
    visible: true,
    width: '200px',
  },
  {
    name: 'state.skuId.code',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    name: 'state.skuId.brandName',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    name: 'state.skuId.orderNo',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    name: 'state.costCount',
    fixed: false,
    visible: true,
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
      key: 'name',
      type: 'id',
      field: {
        name: 'state.id',
        label: '成本编号',
      },
    },
  ],
): View => ({
  id,
  name,
  type: viewType,
  source: viewSource,
  isDefault: false,
  filters: filters,
  columns: columns,
  tableSize: 'middle',
  condition: {},
  pageSize: 10,
  sortId: 0,
  pagedQuery: {
    condition: {
      operator: Operator.ALL,
    },
  },
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
    },
    {
      key: 'brandName',
      type: 'text',
      field: {
        name: 'state.skuId.brandName',
        label: '品牌名称',
      },
    },
  ]),
  createSampleView('3', 'Team Public View', 'SHARED'),
  createSampleView('4', 'Company Public View', 'SHARED'),
  createSampleView('5', 'System Public View', 'SHARED', 'SYSTEM'),
];

const actionColumn: ViewTableActionColumn<MaterializedSnapshot<SkuCostState>> =
  {
    title: 'More',
    dataIndex: 'id',
    configurable: true,
    actions: record => {
      if (record.state.id === '3S98-SK-190TH') {
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

export const Default: Story = {
  args: {
    name: 'users',
    views: sampleViews,
    definition: viewDefinition,
    actionColumn: actionColumn,
    topBar: {
      barItems: [
        FILTER_BAR_ITEM_TYPE,
        REFRESH_DATA_BAR_ITEM_TYPE,
        COLUMN_HEIGHT_BAR_ITEM_TYPE,
        SHARE_LINK_BAR_ITEM_TYPE,
      ],
      enableFullscreen: true,
      bulkOperationName: 'Bulk',
      bulkActions: [
        {
          title: 'Bulk Delete',
          onClick: (items: MaterializedSnapshot<SkuCostState>[]) => {
            console.log('Bulk Delete', items);
          },
        },
      ],
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
    },
  },
};
