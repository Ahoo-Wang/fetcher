import { BarItem } from './BarItem';
import { Tooltip } from 'antd';
import { useFullscreenContext } from '@ahoo-wang/fetcher-react';
import { TopBarItemProps } from './types';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';

export interface FullscreenBarItemProps extends TopBarItemProps {
}

export function FullscreenBarItem(props: FullscreenBarItemProps) {
  const { style, className } = props;
  const { isFullscreen, toggle } = useFullscreenContext();
  return (
    <Tooltip placement="top" title="全屏">
      <div className={className} style={style} onClick={toggle}>
        <BarItem
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          active={isFullscreen}
        />
      </div>
    </Tooltip>
  );
}
