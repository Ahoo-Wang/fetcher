import { Meta, StoryObj } from '@storybook/react-vite';
import { BarItem } from '../BarItem';
import { StarOutlined } from '@ant-design/icons';


const meta: Meta<typeof BarItem> = {
  title: 'Viewer/TopBar/BarItem',
  component: BarItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'BarItem',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    icon: {
      description: 'Icon',
      control: {
        type: 'text',
      },
    },
    active: {
      description: 'Default active',
      control: {
        type: 'boolean',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <StarOutlined />,
    active: true,
  },
};
