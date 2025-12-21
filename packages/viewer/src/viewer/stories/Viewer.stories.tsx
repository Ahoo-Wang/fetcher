import type { Meta, StoryObj } from '@storybook/react';

import { Viewer } from '../Viewer';
import { View, ViewColumn, ViewDefinition } from '../types';
import { ViewTableActionColumn } from '../../table';
import { Button } from 'antd';
import type { MaterializedSnapshot } from '@ahoo-wang/fetcher-wow';
import {
  COLUMN_HEIGHT_BAR_ITEM_TYPE,
  FILTER_BAR_ITEM_TYPE,
  REFRESH_DATA_BAR_ITEM_TYPE,
} from '../../topbar';
import { SHARE_LINK_BAR_ITEM_TYPE } from '../../topbar/ShareLinkBarItem';


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
  tags: ['autodocs']
};
const viewDefinition: ViewDefinition = {
  name: 'SKU成本',
  columns: [
    {
      title: '成本编号',
      dataIndex: 'state.id',
      primaryKey: true,
      type: 'id',
      attributes: {},
      sorter: { multiple: 1 },
    },
    {
      title: '供应商编号',
      dataIndex: 'state.businessPartnerId.id',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      title: '供应商名称',
      dataIndex: 'state.businessPartnerId.name',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      title: '供应商业务编号',
      dataIndex: 'state.businessPartnerId.bizId',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      title: 'SKU No.',
      dataIndex: 'state.skuId.code',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      title: '品牌名称',
      dataIndex: 'state.skuId.brandName',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: { multiple: 2 },
    },
    {
      title: 'SKU订货号',
      dataIndex: 'state.skuId.orderNo',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sorter: false,
    },
    {
      title: '成本数',
      dataIndex: 'state.costCount',
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
  dataSourceUrl: 'http://localhost:8080/tenant/mydao/sku_cost/snapshot/paged',
  internalCondition: {},
  checkable: true,
};

const columns: ViewColumn[] = [
  {
    dataIndex: 'state.id',
    fixed: true,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'state.businessPartnerId.id',
    fixed: false,
    visible: true,
    width: '500px',
  },
  {
    dataIndex: 'state.businessPartnerId.name',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'state.businessPartnerId.bizId',
    fixed: false,
    visible: true,
    width: '200px',
  },
  {
    dataIndex: 'state.skuId.code',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'state.skuId.brandName',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'state.skuId.orderNo',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'state.costCount',
    fixed: false,
    visible: true,
    width: '300px',
  },
];

const view: View = {
  id: '1',
  name: 'Custom View',
  filters: [
    {
      key: 'name',
      type: 'id',
      field: {
        name: 'state.id',
        label: '成本编号',
      },
    },
  ],
  columns: columns,
  tableSize: 'middle',
  condition: {},
  pageSize: 10,
};

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
    view: view,
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
      ]
    },
  },
};
