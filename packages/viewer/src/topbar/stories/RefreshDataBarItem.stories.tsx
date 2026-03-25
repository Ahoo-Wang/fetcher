import { Meta, StoryObj } from '@storybook/react-vite';
import { RefreshDataBarItem } from '../RefreshDataBarItem';
import { useRefreshDataEventBus } from '../../hooks';
import { Button, Card, Space } from 'antd';
import { useEffect, useState } from 'react';

const meta: Meta<typeof RefreshDataBarItem> = {
  title: 'Viewer/TopBar/RefreshDataBarItem',
  component: RefreshDataBarItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'RefreshDataBarItem - 使用 subscriberId 来隔离不同视图的刷新事件',
      },
    },
  },
  argTypes: {
    viewerDefinitionId: {
      description: '视图定义唯一标识，用于隔离刷新事件',
      control: {
        type: 'text',
      },
    },
    style: {
      description: '自定义样式',
      control: {
        type: 'object',
      },
    },
    className: {
      description: '自定义类名',
      control: {
        type: 'text',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    viewerDefinitionId: 'default-viewer-definition-id',
  },
};

export const WithSubscriberIsolation: Story = {
  render: () => {
    const Demo = () => {
      const [refreshedViews, setRefreshedViews] = useState<string[]>([]);

      const viewer1 = useRefreshDataEventBus('viewer-definition-1');
      const viewer2 = useRefreshDataEventBus('viewer-definition-2');

      useEffect(() => {
        viewer1.subscribe({
          name: 'Viewer-Refresh-Data',
          handle: () => {
            setRefreshedViews(prev => [...prev, 'viewer-definition-1']);
          },
        });
      }, [viewer1]);

      useEffect(() => {
        viewer2.subscribe({
          name: 'Viewer-Refresh-Data',
          handle: () => {
            setRefreshedViews(prev => [...prev, 'viewer-definition-2']);
          },
        });
      }, [viewer2]);

      const handleRefreshViewer1 = async () => {
        await viewer1.publish('viewer-definition-1');
      };

      const handleRefreshViewer2 = async () => {
        await viewer2.publish('viewer-definition-2');
      };

      return (
        <Space direction="vertical" style={{ width: 400 }} size="large">
          <Card title="刷新事件隔离演示" size="small">
            <p>点击不同的刷新按钮，只会触发对应 viewerDefinitionId 的订阅者</p>
          </Card>

          <Space>
            <Button type="primary" onClick={handleRefreshViewer1}>
              刷新 Viewer 1 (viewer-definition-1)
            </Button>
            <Button type="primary" onClick={handleRefreshViewer2}>
              刷新 Viewer 2 (viewer-definition-2)
            </Button>
          </Space>

          <Card title="已刷新视图记录" size="small">
            {refreshedViews.length === 0 ? (
              <p style={{ color: '#999' }}>点击上方按钮触发刷新</p>
            ) : (
              <ul>
                {refreshedViews.map((view, index) => (
                  <li key={index}>{view}</li>
                ))}
              </ul>
            )}
          </Card>
        </Space>
      );
    };

    return <Demo />;
  },
};
