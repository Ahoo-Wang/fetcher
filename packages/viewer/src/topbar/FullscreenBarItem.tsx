import { BarItem } from './BarItem';
import { Tooltip } from 'antd';
import type { UseFullscreenOptions } from '@ahoo-wang/fetcher-react';
import { useFullscreenContext } from '@ahoo-wang/fetcher-react';
import type { TopBarItemProps } from './types';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';

export interface FullscreenBarItemProps extends UseFullscreenOptions, TopBarItemProps {
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
      <div className={className} style={style} onClick={() => toggle(target?.current)}>
        <BarItem
          icon={fullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          active={fullscreen}
        />
      </div>
    </Tooltip>
  );
}
