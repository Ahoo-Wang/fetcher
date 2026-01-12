import type { Meta, StoryObj } from '@storybook/react';

import { ViewItem } from '../ViewItem';
import { ViewState } from '../../types';
import { Operator } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof ViewItem> = {
  title: 'Viewer/Viewer/Panel/ViewItem',
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

const sampleView: ViewState = {
  id: '1',
  name: 'Sample View',
  type: 'PERSONAL',
  source: 'CUSTOM',
  isDefault: false,
  filters: [],
  columns: [
    {
      name: 'id',
      fixed: false,
      hidden: true,
    },
  ],
  tableSize: 'middle',
  sortId: 0,
  pagedQuery: {
    condition: {
      operator: Operator.ALL,
    }
  }
};

const systemView: ViewState = {
  ...sampleView,
  name: 'System View',
  source: 'SYSTEM',
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
