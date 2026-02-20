import type { Meta, StoryObj } from '@storybook/react';

import { ViewItemGroup } from '../ViewItemGroup';
import { ViewState, ViewColumn } from '../../types';
import { Operator } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof ViewItemGroup> = {
  title: 'Viewer/Viewer/Panel/ViewItemGroup',
  component: ViewItemGroup,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A component that displays a group of view items, allowing selection of the active view.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

const createSampleView = (
  id: string,
  name: string,
  viewSource: 'SYSTEM' | 'CUSTOM' = 'CUSTOM',
): ViewState => ({
  id,
  name,
  type: 'PERSONAL',
  source: viewSource,
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
  pagedQuery: {
    condition: {
      operator: Operator.ALL,
    },
  },
  definitionId: '',
  pageSize: 0,
  sort: 0,
});

const sampleViews: ViewState[] = [
  createSampleView('1', 'Default View'),
  createSampleView('2', 'Custom View 1'),
  createSampleView('3', 'Custom View 2'),
];

const viewsWithSystem: ViewState[] = [
  createSampleView('1', 'Default View'),
  createSampleView('2', 'System View', 'SYSTEM'),
  createSampleView('3', 'Another Custom View'),
];

export const Default: Story = {
  args: {
    views: sampleViews,
    activeView: sampleViews[0],
    countUrl: '/api/count',
    onSwitchView: (view: ViewState) => console.log('View changed to:', view.name),
  },
};

export const WithSystemView: Story = {
  args: {
    views: viewsWithSystem,
    activeView: viewsWithSystem[1],
    countUrl: '/api/count',
    onSwitchView: (view: ViewState) => console.log('View changed to:', view.name),
  },
};

export const SingleView: Story = {
  args: {
    views: [sampleViews[0]],
    activeView: sampleViews[0],
    countUrl: '/api/count',
    onSwitchView: (view: ViewState) => console.log('View changed to:', view.name),
  },
};
