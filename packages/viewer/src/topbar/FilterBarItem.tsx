import { TopBarItemProps } from './types';
import { useEffect, useState } from 'react';
import { BarItem } from './BarItem';
import { FilterOutlined } from '@ant-design/icons';

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
    <div className={className} style={style} onClick={handleClick}>
      <BarItem icon={<FilterOutlined />} active={active || false} />
    </div>
  );
}
