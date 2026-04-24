import { BellOutlined } from '@ant-design/icons';
import { Tooltip, Popconfirm } from 'antd';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import { BarItem } from './BarItem';
import {
  useDataMonitor,
  type DataMonitorNotificationConfig,
} from '@ahoo-wang/fetcher-react';
import type { TopBarItemProps } from './types';

export interface DataMonitorBarItemProps extends TopBarItemProps {
  viewId: string;
  countUrl: string;
  viewName: string;
  condition: Condition;
  notification: DataMonitorNotificationConfig;
  interval?: number;
}

export function DataMonitorBarItem(props: DataMonitorBarItemProps) {
  const { viewId, countUrl, viewName, condition, notification, interval, ...rest } = props;

  const { isEnabled, toggle } = useDataMonitor({
    viewId,
    countUrl,
    viewName,
    condition,
    notification,
    interval,
  });

  return (
    <Tooltip placement="top" title={isEnabled ? '关闭数据监控' : '开启数据监控'}>
      <Popconfirm
        title={isEnabled ? '确认关闭数据监控？' : '确认开启数据监控？'}
        description={isEnabled ? '关闭后将不再接收数据变化通知' : '开启后将定期检测数据变化并通知'}
        onConfirm={toggle}
        okText="确认"
        cancelText="取消"
      >
        <div>
          <BarItem
            icon={<BellOutlined />}
            active={isEnabled}
            {...rest}
          />
        </div>
      </Popconfirm>
    </Tooltip>
  );
}
