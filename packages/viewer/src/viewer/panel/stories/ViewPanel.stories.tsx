import type { Meta, StoryObj } from '@storybook/react';

import { ViewPanel } from '../ViewPanel';
import { ViewState, ViewSource, ViewType } from '../../types';
import { Operator } from '@ahoo-wang/fetcher-wow';

const meta: Meta<typeof ViewPanel> = {
  title: 'Viewer/Viewer/Panel/ViewPanel',
  component: ViewPanel,
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

export default meta;

type Story = StoryObj<typeof meta>;

const createSampleView = (
  id: string,
  name: string,
  viewType: ViewType = 'PERSONAL',
  viewSource: ViewSource = 'CUSTOM',
): ViewState => ({
  id,
  name,
  type: viewType,
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
  createSampleView('1', 'My Personal View', 'PERSONAL'),
  createSampleView('2', 'Another Personal View', 'PERSONAL'),
  createSampleView('3', 'Team Public View', 'SHARED'),
  createSampleView('4', 'Company Public View', 'SHARED'),
  createSampleView('5', 'System Public View', 'SHARED', 'SYSTEM'),
];

export const Default: Story = {
  args: {
    name: 'aggregateName',
    views: sampleViews,
    activeView: sampleViews[0],
    countUrl: '/api/count',
    onSwitchView: (view: ViewState) => console.log('View changed to:', view.name),
  },
};

export const OnlyPersonalViews: Story = {
  args: {
    name: 'aggregateName',
    views: sampleViews.filter(v => v.type === 'PERSONAL'),
    activeView: sampleViews[0],
    countUrl: '/api/count',
    onSwitchView: (view: ViewState) => console.log('View changed to:', view.name),
  },
};

export const OnlyPublicViews: Story = {
  args: {
    name: 'aggregateName',
    views: sampleViews.filter(v => v.type === 'SHARED'),
    activeView: sampleViews[2],
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
