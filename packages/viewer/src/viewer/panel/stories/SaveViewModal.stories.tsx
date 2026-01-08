import type { Meta, StoryObj } from '@storybook/react';

import { SaveViewModal } from '../';
import { useState } from 'react';
import { Button } from 'antd';

const meta: Meta<typeof SaveViewModal> = {
  title: 'Viewer/Viewer/Panel/SaveViewModal',
  component: SaveViewModal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A modal component for saving views with options for personal or shared view types.',
      },
    },
  },
  argTypes: {
    mode: {
      control: { type: 'radio' },
      options: ['Create', 'SaveAs'],
    },
    open: {
      control: { type: 'boolean' },
    },
  },
};

const ModalWrapper = (args: any)=> {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'Create' | 'SaveAs'>('Create');

  const onCancel = () => {
    setOpen(false);
  }

  return (
    <>
      <Button onClick={() => { setOpen(true); setMode('Create'); }}>Open Create Modal</Button>
      <Button onClick={() => { setOpen(true); setMode('SaveAs'); }}>Open SaveAs Modal</Button>

      <SaveViewModal mode={mode} open={open} onSaveView={args.onSaveView} onCancel={onCancel} />
    </>
  )


}

export default meta;

type Story = StoryObj<typeof SaveViewModal>;

export const CreateMode: Story = {
  args: {
    mode: 'Create',
    open: false,
    onSaveView: (name, type) => console.log('Save view:', name, type),
    onCancel: () => console.log('Cancel'),
  },
  render: (args) => <ModalWrapper {...args} />,
};

