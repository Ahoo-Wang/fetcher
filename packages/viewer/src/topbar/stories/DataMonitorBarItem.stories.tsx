import { Meta, StoryObj } from '@storybook/react-vite';
import { DataMonitorBarItem } from '../DataMonitorBarItem';
import { Button, Space, message, Card } from 'antd';
import { dataMonitorService } from '@ahoo-wang/fetcher-react';

const meta: Meta<typeof DataMonitorBarItem> = {
  title: 'Viewer/TopBar/DataMonitorBarItem',
  component: DataMonitorBarItem,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'DataMonitorBarItem - 数据监控开关组件，当开启时会定期调用 countUrl 检测数据总量变化，变化时发送浏览器通知。点击开关时会弹出 Popconfirm 确认框，确认后才激活监控。',
      },
    },
  },
  argTypes: {
    viewId: {
      description: '视图ID，用于唯一标识监控项',
      control: {
        type: 'text',
      },
    },
    countUrl: {
      description: '获取数据总数的接口地址',
      control: {
        type: 'text',
      },
    },
    viewName: {
      description: '视图名称，用于通知标题',
      control: {
        type: 'text',
      },
    },
    condition: {
      description: '当前视图的过滤条件',
      control: {
        type: 'object',
      },
    },
    notification: {
      description: '通知配置',
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
    countUrl: '/api/count',
    viewName: '采购单列表',
    condition: {},
    notification: {
      title: '视图[采购单列表]的数据已发生变化，请查看',
      navigationUrl: '/purchase-orders',
    },
  },
};

export const Enabled: Story = {
  args: {
    ...Default.args,
  },
  render: (args) => {
    return <DataMonitorBarItem {...args} />;
  },
};

export const WithCustomNotification: Story = {
  args: {
    viewId: 'custom-notification-view',
    countUrl: '/api/orders/count',
    viewName: '订单列表',
    condition: { status: 'pending' },
    notification: {
      title: '待处理订单数量有变化',
      navigationUrl: '/orders?status=pending',
    },
  },
};

export const MultipleViews: Story = {
  render: () => {
    return (
      <div style={{ display: 'flex', gap: '16px', padding: '16px' }}>
        <DataMonitorBarItem
          viewId="view-orders"
          countUrl="/api/orders/count"
          viewName="订单列表"
          condition={{ status: 'pending' }}
          notification={{
            title: '订单数据有变化',
            navigationUrl: '/orders',
          }}
        />
        <DataMonitorBarItem
          viewId="view-requirements"
          countUrl="/api/requirements/count"
          viewName={'需求列表'}
          condition={{ type: 'urgent' }}
          notification={{
            title: '紧急需求有变化',
            navigationUrl: '/requirements?type=urgent',
          }}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '多个 DataMonitorBarItem 可以同时存在，各自独立监控不同的视图',
      },
    },
  },
};

export const WithNotificationDemo: Story = {
  render: () => {
    const handleSimulateNotification = () => {
      // 模拟发送通知
      const notificationConfig = {
        title: '视图[采购单列表]的数据已发生变化，请查看',
        navigationUrl: '/purchase-orders',
      };

      // 直接调用 notificationCenter 发送通知
      import('@ahoo-wang/fetcher-react').then(({ notificationCenter }) => {
        notificationCenter.publish('browser', {
          title: notificationConfig.title,
          payload: {
            body: '当前共 42 条数据',
            icon: '/logo.png',
          },
          onClick: () => {
            window.focus();
            if (notificationConfig.navigationUrl) {
              window.location.href = notificationConfig.navigationUrl;
            }
          },
        });
        message.success('已发送浏览器通知！请查看浏览器通知。');
      });
    };

    return (
      <Card title="数据监控通知演示" style={{ width: 400 }}>
        <Space direction="vertical" size="middle">
          <p>点击下方按钮模拟数据变化，触发浏览器通知。</p>
          <DataMonitorBarItem
            viewId="demo-view"
            countUrl="/api/count"
            viewName="采购单列表"
            condition={{}}
            notification={{
              title: '视图[采购单列表]的数据已发生变化，请查看',
              navigationUrl: '/purchase-orders',
            }}
          />
          <Button type="primary" onClick={handleSimulateNotification}>
            模拟数据变化发送通知
          </Button>
        </Space>
      </Card>
    );
  },
  parameters: {
    docs: {
      description: {
        story: '演示模式：点击开关时会弹出 Popconfirm 确认框，确认后才激活监控。点击按钮可模拟数据变化，触发浏览器通知。',
      },
    },
  },
};
