import { BarItem } from './BarItem';
import { Tooltip } from 'antd';
import { useFullscreenContext } from '@ahoo-wang/fetcher-react';
import { TopBarItemProps } from './types';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';

export interface FullscreenBarItemProps extends TopBarItemProps {
  target?: HTMLElement;
}

export function FullscreenBarItem(props: FullscreenBarItemProps) {
  const { target, style, className } = props;
  const fullscreenState = useFullscreenContext();
  if (!fullscreenState) {
    return null;
  }
  const { fullscreen, toggle } = fullscreenState;
  return (
    <Tooltip placement="top" title="全屏">
      <div className={className} style={style} onClick={() => toggle(target)}>
        <BarItem
          icon={
            fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />
          }
          active={fullscreen}
        />
      </div>
    </Tooltip>
  );
}
