import { BarItem } from './BarItem';
import { Tooltip } from 'antd';
import { useFullscreen, UseFullscreenOptions } from '@ahoo-wang/fetcher-react';
import { TopBarItemProps } from './types';
import { FullscreenExitOutlined, FullscreenOutlined } from '@ant-design/icons';

export interface FullscreenBarItemProps extends TopBarItemProps, UseFullscreenOptions {
}

export function FullscreenBarItem(props: FullscreenBarItemProps) {
  const { style, className, target, onChange } = props;
  const { isFullscreen, toggle } = useFullscreen({
    target,
    onChange,
  });
  return (
    <Tooltip placement="top" title="全屏">
      <div className={className} style={style} onClick={toggle}>
        <BarItem
          icon={isFullscreen ? <FullscreenExitOutlined /> : <FullscreenOutlined />}
          active={false}
        />
      </div>
    </Tooltip>
  );
}
