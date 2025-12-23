import type { Meta, StoryObj } from '@storybook/react';

import { ViewItem } from '../ViewItem';
import { View, ViewColumn } from '../../types';

const meta: Meta<typeof ViewItem> = {
  title: 'Viewer/Panel/ViewItem',
  component: ViewItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays a view item with its name, system tag if applicable, and count.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const sampleView: View = {
  id: '1',
  name: 'Sample View',
  viewType: 'PERSONAL',
  viewSource: 'CUSTOM',
  isDefault: false,
  filters: [],
  columns: [
    {
      dataIndex: 'id',
      fixed: false,
      visible: true,
    },
  ],
  tableSize: 'middle',
  condition: {},
  pageSize: 10,
};

const systemView: View = {
  ...sampleView,
  name: 'System View',
  viewSource: 'SYSTEM',
};

export const Default: Story = {
  args: {
    view: sampleView,
    countUrl: '/api/count',
    active: false,
  },
};

export const SystemView: Story = {
  args: {
    view: systemView,
    countUrl: '/api/count',
    active: true,
  },
};

export const ActiveView: Story = {
  args: {
    view: sampleView,
    countUrl: '/api/count',
    active: true,
  },
};
