import { TopBarItemProps } from './types';
import { useEffect, useState } from 'react';
import { BarItem } from './BarItem';
import { FilterOutlined } from '@ant-design/icons';
import { Tooltip } from 'antd';

export interface FilterBarItemProps extends TopBarItemProps {
  defaultShowFilter: boolean;
  onChange?: (show: boolean) => void;
}

export function FilterBarItem(props: FilterBarItemProps) {
  const { style, className, defaultShowFilter, onChange } = props;

  const [active, setActive] = useState(defaultShowFilter);

  useEffect(() => {
    setActive(defaultShowFilter);
  }, [defaultShowFilter]);

  const handleClick = () => {
    setActive(!active);
    onChange?.(!active);
  };

  return (
    <Tooltip placement="top" title="过滤器">
      <div className={className} style={style} onClick={handleClick}>
        <BarItem icon={<FilterOutlined />} active={active || false} />
      </div>
    </Tooltip>
  );
}
