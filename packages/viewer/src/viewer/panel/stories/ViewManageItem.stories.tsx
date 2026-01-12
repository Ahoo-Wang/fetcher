import type { Meta, StoryObj } from '@storybook/react';

import { ViewManageItem } from '../ViewManageItem';
import { ViewState } from '../../types';
import { Operator } from '@ahoo-wang/fetcher-wow';
import { useState } from 'react';

const meta: Meta<typeof ViewManageItem> = {
  title: 'Viewer/Viewer/Panel/ViewManageItem',
  component: ViewManageItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A component for managing views with edit, save, cancel, and delete functionality. System views show edit/delete actions, while custom views display a system tag.',
      },
    },
  },
  argTypes: {
    editing: {
      control: { type: 'boolean' },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ViewManageItem>;

const sampleView: ViewState = {
  id: '1',
  name: 'My View',
  definitionId: 'def-1',
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
  pageSize: 20,
  sort: 0,
  pagedQuery: {
    condition: {
      operator: Operator.ALL,
    },
  },
};

const systemView: ViewState = {
  ...sampleView,
  id: '2',
  name: 'System View',
  source: 'SYSTEM',
};

const customView: ViewState = {
  ...sampleView,
  id: '3',
  name: 'Custom View',
  source: 'CUSTOM',
};

const sharedView: ViewState = {
  ...sampleView,
  id: '4',
  name: 'Shared View',
  type: 'SHARED',
  source: 'SYSTEM',
};

const ViewManageItemWrapper = (args: any) => {
  const [viewName, setViewName] = useState(args.view.name);
  const [editing, setEditing] = useState(args.editing);

  const handleEdit = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setViewName(args.view.name);
    setEditing(false);
  };

  const handleSave = (view: ViewState) => {
    console.log('Save view:', view);
    setViewName(view.name);
    setEditing(false);
  };

  const handleDelete = (view: ViewState) => {
    console.log('Delete view:', view);
  };

  return (
    <ViewManageItem
      {...args}
      view={{ ...args.view, name: viewName }}
      editing={editing}
      onEdit={handleEdit}
      onCancel={handleCancel}
      onSave={handleSave}
      onDelete={handleDelete}
    />
  );
};

export const Default: Story = {
  args: {
    view: sampleView,
    editing: false,
  },
  render: args => <ViewManageItemWrapper {...args} />,
};

export const Editing: Story = {
  args: {
    view: sampleView,
    editing: true,
  },
  render: args => <ViewManageItemWrapper {...args} />,
};

export const SystemViewWithActions: Story = {
  args: {
    view: systemView,
    editing: false,
  },
  render: args => <ViewManageItemWrapper {...args} />,
};

export const CustomViewWithTag: Story = {
  args: {
    view: customView,
    editing: false,
  },
  render: args => <ViewManageItemWrapper {...args} />,
};

export const CustomViewEditing: Story = {
  args: {
    view: customView,
    editing: true,
  },
  render: args => <ViewManageItemWrapper {...args} />,
};

export const SharedSystemView: Story = {
  args: {
    view: sharedView,
    editing: false,
  },
  render: args => <ViewManageItemWrapper {...args} />,
};

export const LongNameView: Story = {
  args: {
    view: {
      ...sampleView,
      name: 'This is a very long view name that might wrap to multiple lines',
    },
    editing: false,
  },
  render: args => <ViewManageItemWrapper {...args} />,
};
