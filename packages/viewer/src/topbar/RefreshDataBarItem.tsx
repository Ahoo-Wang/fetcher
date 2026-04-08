import type { TopBarItemProps } from './types';
import { BarItem } from './BarItem';
import { ReloadOutlined } from '@ant-design/icons';
import { useRefreshDataEventBus } from '../';
import { Tooltip } from 'antd';

export interface RefreshDataBarItemProps extends TopBarItemProps {
  viewerDefinitionId?: string;
}

export function RefreshDataBarItem(props: RefreshDataBarItemProps) {
  const { style, className, viewerDefinitionId } = props;

  const { publish } = useRefreshDataEventBus(viewerDefinitionId);

  const handleClick = async () => {
    await publish(viewerDefinitionId);
  };

  return (
    <Tooltip placement="top" title="刷新">
      <div className={className} style={style} onClick={handleClick}>
        <BarItem icon={<ReloadOutlined />} active={false} />
      </div>
    </Tooltip>
  );
}
