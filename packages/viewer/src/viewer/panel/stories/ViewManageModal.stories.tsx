import type { Meta, StoryObj } from '@storybook/react';

import { ViewManageModal } from '../';
import { ViewState } from '../../types';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';
import { Button } from 'antd';

const meta: Meta<typeof ViewManageModal> = {
  title: 'Viewer/Viewer/Panel/ViewManageModal',
  component: ViewManageModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A modal component for managing views, allowing users to edit, delete, and view system or custom views.',
      },
    },
  },
  argTypes: {
    viewType: {
      control: { type: 'radio' },
      options: ['PERSONAL', 'SHARED'],
    },
    open: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ViewManageModal>;

const createView = (
  id: string,
  name: string,
  source: 'CUSTOM' | 'SYSTEM',
): ViewState => ({
  id,
  name,
  definitionId: 'def-1',
  type: 'PERSONAL',
  source,
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
  pageSize: 20,
  sort: 0,
  pagedQuery: {
    condition: {
      operator: Operator.ALL,
    },
  },
});

const personalViews: ViewState[] = [
  createView('1', 'My Default View', 'SYSTEM'),
  createView('2', 'Analytics View', 'CUSTOM'),
  createView('3', 'Recent Items', 'CUSTOM'),
];

const sharedViews: ViewState[] = [
  createView('4', 'All Items', 'SYSTEM'),
  createView('5', 'Recent Updates', 'SYSTEM'),
  createView('6', 'Archived', 'SYSTEM'),
];

const mixedViews: ViewState[] = [
  createView('7', 'Personal Dashboard', 'CUSTOM'),
  createView('8', 'Team Overview', 'SYSTEM'),
  createView('9', 'My Filters', 'CUSTOM'),
];

const emptyViews: ViewState[] = [];

const ViewManageModalWrapper = (args: any) => {
  const [open, setOpen] = useState(args.open);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <>
      <Button onClick={handleOpen}>Open View Manage Modal</Button>
      <ViewManageModal {...args} open={open} onCancel={handleClose} />
    </>
  );
};

export const PERSONALViews: Story = {
  args: {
    viewType: 'PERSONAL',
    views: personalViews,
    open: false,
  },
  render: args => <ViewManageModalWrapper {...args} />,
};

export const SharedViews: Story = {
  args: {
    viewType: 'SHARED',
    views: sharedViews,
    open: false,
  },
  render: args => <ViewManageModalWrapper {...args} />,
};

export const MixedViews: Story = {
  args: {
    viewType: 'PERSONAL',
    views: mixedViews,
    open: false,
  },
  render: args => <ViewManageModalWrapper {...args} />,
};

export const EmptyViews: Story = {
  args: {
    viewType: 'PERSONAL',
    views: emptyViews,
    open: false,
  },
  render: args => <ViewManageModalWrapper {...args} />,
};

export const WithEditCallback: Story = {
  args: {
    viewType: 'PERSONAL',
    views: personalViews,
    open: false,
    onEditViewName: view => console.log('Edit view:', view),
  },
  render: args => <ViewManageModalWrapper {...args} />,
};

export const WithDeleteCallback: Story = {
  args: {
    viewType: 'PERSONAL',
    views: sharedViews,
    open: false,
    onDeleteView: view => console.log('Delete view:', view),
  },
  render: args => <ViewManageModalWrapper {...args} />,
};

export const OpenModal: Story = {
  args: {
    viewType: 'PERSONAL',
    views: personalViews,
    open: true,
  },
  render: args => <ViewManageModalWrapper {...args} />,
};

export const ManyViews: Story = {
  args: {
    viewType: 'PERSONAL',
    views: Array.from({ length: 10 }, (_, i) =>
      createView(
        `${i}`,
        `View Number ${i + 1}`,
        i % 3 === 0 ? 'SYSTEM' : 'CUSTOM',
      ),
    ),
    open: false,
  },
  render: args => <ViewManageModalWrapper {...args} />,
};
