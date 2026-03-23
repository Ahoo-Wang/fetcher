import { Meta, StoryObj } from '@storybook/react-vite';
import { AutoRefreshBarItem } from '../AutoRefreshBarItem';
import { useRefreshDataEventBus } from '../../hooks';
import { useState } from 'react';
import { Button, Space, Card } from 'antd';

const meta: Meta<typeof AutoRefreshBarItem> = {
  title: 'Viewer/TopBar/AutoRefreshBarItem',
  component: AutoRefreshBarItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'AutoRefreshBarItem - 自动刷新频率选择组件，使用 viewId 存储设置，使用 viewerDefinitionId 隔离刷新事件',
      },
    },
  },
  argTypes: {
    viewId: {
      description: '视图ID，用于存储和读取刷新设置',
      control: {
        type: 'text',
      },
    },
    viewerDefinitionId: {
      description: '视图定义ID，用于隔离刷新事件',
      control: {
        type: 'text',
      },
    },
    items: {
      description: '自定义刷新间隔选项',
      control: {
        type: 'object',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    viewId: 'default-view-id',
    viewerDefinitionId: 'default-viewer-definition-id',
  },
};

export const WithCustomItems: Story = {
  args: {
    viewId: 'custom-items-view-id',
    viewerDefinitionId: 'custom-items-viewer-def-id',
    items: [
      { label: '30 秒', key: '30s', refreshInterval: 30000 },
      { label: '1 分钟', key: '1', refreshInterval: 60000 },
      { label: '5 分钟', key: '5', refreshInterval: 300000 },
    ],
  },
};

export const WithSubscriberIsolation: Story = {
  render: () => {
    const Demo = () => {
      const [refreshCount1, setRefreshCount1] = useState(0);
      const [refreshCount2, setRefreshCount2] = useState(0);

      const viewer1 = useRefreshDataEventBus('viewer-definition-1');
      const viewer2 = useRefreshDataEventBus('viewer-definition-2');

      useState(() => {
        viewer1.subscribe({
          name: 'Viewer-Refresh-Data',
          handle: () => {
            setRefreshCount1(prev => prev + 1);
          },
        });
      });

      useState(() => {
        viewer2.subscribe({
          name: 'Viewer-Refresh-Data',
          handle: () => {
            setRefreshCount2(prev => prev + 1);
          },
        });
      });

      return (
        <Space direction="vertical" size="large">
          <Card title="AutoRefreshBarItem 事件隔离演示" size="small">
            <p>两个组件使用不同的 viewerDefinitionId，刷新事件互不影响</p>
          </Card>

          <Space>
            <AutoRefreshBarItem
              viewId="view-1"
              viewerDefinitionId="viewer-definition-1"
            />
            <AutoRefreshBarItem
              viewId="view-2"
              viewerDefinitionId="viewer-definition-2"
            />
          </Space>

          <Card title="刷新计数" size="small">
            <p>Viewer 1 刷新次数: {refreshCount1}</p>
            <p>Viewer 2 刷新次数: {refreshCount2}</p>
          </Card>
        </Space>
      );
    };

    return <Demo />;
  },
};
