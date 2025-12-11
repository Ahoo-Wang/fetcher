import type { Meta, StoryObj } from '@storybook/react';

import { Viewer } from '../Viewer';
import { ViewColumn, ViewDefinition } from '../types';
import { ViewTableActionColumn } from '../../table';
import { Operator } from '@ahoo-wang/fetcher-wow';

export interface Product {
  id: string;
  name: string;
  price: number;
  productModel: string;
  orderNo: string;
  brandName: string;
  category: string;
  level: string;
  createdAt: number;
}

const meta: Meta = {
  title: 'Viewer',
  component: Viewer,
  tags: ['autodocs'],
};
const viewDefinition: ViewDefinition = {
  name: '',
  columns: [
    {
      title: 'ID',
      dataIndex: 'id',
      primaryKey: true,
      type: 'id',
      attributes: {},
      sortable: false,
    },
    {
      title: '名称',
      dataIndex: 'name',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sortable: false,
    },
    {
      title: '价格',
      dataIndex: 'price',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sortable: false,
    },
    {
      title: '型号',
      dataIndex: 'productModel',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sortable: false,
    },
    {
      title: '订货号',
      dataIndex: 'orderNo',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sortable: false,
    },
    {
      title: '品牌名称',
      dataIndex: 'brandName',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sortable: false,
    },
    {
      title: '分类',
      dataIndex: 'category',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sortable: false,
    },
    {
      title: '级别',
      dataIndex: 'level',
      primaryKey: false,
      type: 'text',
      attributes: {},
      sortable: false,
    },
    {
      title: '创建日期',
      dataIndex: 'createdAt',
      primaryKey: false,
      type: 'datetime',
      attributes: {
        format: 'YYYY-MM-DD',
      },
      sortable: false,
    },
    {
      title: '状态',
      dataIndex: 'status',
      primaryKey: false,
      type: 'status',
      attributes: {
        statusEnum: {},
      },
      sortable: false,
    },
  ],
  availableFilters: [
    {
      label: 'Basic Filters',
      filters: [
        {
          field: {
            name: 'id',
            label: 'ID',
            type: 'string',
          },
          component: 'id',
        },
        {
          field: {
            name: 'name',
            label: 'Name',
            type: 'string',
          },
          component: 'text',
        },
        {
          field: {
            name: 'age',
            label: 'Age',
            type: 'number',
          },
          component: 'number',
        },
        {
          field: {
            name: 'email',
            label: 'Email',
            type: 'string',
          },
          component: 'text',
        },
        {
          field: {
            name: 'isActive',
            label: 'Is Active',
            type: 'bool',
          },
          component: 'bool',
        },
      ],
    },
    {
      label: 'Advanced Filters',
      filters: [
        {
          field: {
            name: 'status',
            label: 'Status',
            type: 'string',
          },
          component: 'select',
        },
        {
          field: {
            name: 'department',
            label: 'Department',
            type: 'string',
          },
          component: 'text',
        },
        {
          field: {
            name: 'createdAt',
            label: 'Created At',
            type: 'datetime',
          },
          component: 'datetime',
        },
      ],
    },
  ],
};

const columns: ViewColumn[] = [
  {
    dataIndex: 'id',
    fixed: true,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'name',
    fixed: false,
    visible: true,
    width: '500px',
  },
  {
    dataIndex: 'price',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'productModel',
    fixed: false,
    visible: true,
    width: '500px',
  },
  {
    dataIndex: 'orderNo',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'brandName',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'category',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'level',
    fixed: false,
    visible: true,
    width: '300px',
  },
  {
    dataIndex: 'createdAt',
    fixed: false,
    visible: true,
    width: '300px',
  },
];

const actionColumn: ViewTableActionColumn<Product> = {
  title: 'More',
  dataIndex: 'id',
  configurable: true,
  actions: record => {
    if (record.id === '1') {
      return {
        primaryAction: {
          data: { value: 'Edit', record, index: 0 },
          attributes: { onClick: () => console.log('Edit', record) },
        },
        moreActionTitle: 'Options',
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

const dataSource: Product[] = [
  {
    id: '1',
    name: 'John Doe',
    price: 100,
    productModel: 'MODEL_A',
    orderNo: '0001',
    brandName: 'Sick 西克',
    category: '电感式接近开关',
    level: 'A',
    createdAt: 1764518400000,
  },
  {
    id: '2',
    name: 'John Doe',
    price: 100,
    productModel: 'MODEL_B',
    orderNo: '0002',
    brandName: 'Sick 西克',
    category: '电感式接近开关',
    level: 'A',
    createdAt: 1764864000000,
  },
];

export const Default: Story = {
  args: {
    name: 'users',
    view: {
      id: 'a1',
      name: 'my product',
      columns: columns,
      filters:  [
        {
          key: 'name',
          type: 'text',
          field: {
            name: 'name',
            label: 'Name',
            type: 'string',
          },
          operator: {
            defaultValue: Operator.EQ,
          },
          value: {
            defaultValue: 'test',
          },
        },
      ],
    },
    definition: viewDefinition,
    list: dataSource,
    total: 10,
    actionColumn: actionColumn,
  },
};
