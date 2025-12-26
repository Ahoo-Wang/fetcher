import type { Meta, StoryObj } from '@storybook/react';

import { ViewPanel } from '../ViewPanel';
import { View } from '../../types';

const meta: Meta<typeof ViewPanel> = {
  title: 'Viewer/Panel/ViewPanel',
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
  viewType: 'PERSONAL' | 'SHARED' = 'PERSONAL',
  viewSource: 'SYSTEM' | 'CUSTOM' = 'CUSTOM',
): View => ({
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
      visible: true,
    },
  ],
  tableSize: 'middle',
  condition: {},
  pageSize: 10,
  sortId: 0,
});

const sampleViews: View[] = [
  createSampleView('1', 'My Personal View', 'PERSONAL'),
  createSampleView('2', 'Another Personal View', 'PERSONAL'),
  createSampleView('3', 'Team Public View', 'PUBLIC'),
  createSampleView('4', 'Company Public View', 'PUBLIC'),
  createSampleView('5', 'System Public View', 'PUBLIC', 'SYSTEM'),
];

export const Default: Story = {
  args: {
    aggregateName: 'aggregateName',
    views: sampleViews,
    activeView: sampleViews[0],
    countUrl: '/api/count',
    onViewChange: (view: View) => console.log('View changed to:', view.name),
  },
};

export const OnlyPersonalViews: Story = {
  args: {
    aggregateName: 'aggregateName',
    views: sampleViews.filter(v => v.type === 'PERSONAL'),
    activeView: sampleViews[0],
    countUrl: '/api/count',
    onViewChange: (view: View) => console.log('View changed to:', view.name),
  },
};

export const OnlyPublicViews: Story = {
  args: {
    aggregateName: 'aggregateName',
    views: sampleViews.filter(v => v.type === 'PUBLIC'),
    activeView: sampleViews[2],
    countUrl: '/api/count',
    onViewChange: (view: View) => console.log('View changed to:', view.name),
  },
};

export const SingleView: Story = {
  args: {
    views: [sampleViews[0]],
    activeView: sampleViews[0],
    countUrl: '/api/count',
    onViewChange: (view: View) => console.log('View changed to:', view.name),
  },
};
