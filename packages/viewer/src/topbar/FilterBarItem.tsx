import { TopBarItemProps } from './types';
import { useState } from 'react';
import { BarItem } from './BarItem';
import { FilterOutlined } from '@ant-design/icons';
import { useFilterStateContext } from '../viewer';

export const FILTER_BAR_ITEM_TYPE: string = 'filter';

export interface FilterBarItemProps extends TopBarItemProps {}

export function FilterBarItem(props: FilterBarItemProps) {
  const { style, className } = props;

  const { showFilterPanel, updateShowFilterPanel } = useFilterStateContext();

  const [active, setActive] = useState(showFilterPanel || false);

  const handleClick = () => {
    setActive(!active);
    updateShowFilterPanel(!active);
  };

  return (
    <div className={className} style={style} onClick={handleClick}>
      <BarItem icon={<FilterOutlined />} active={active || false} />
    </div>
  );
}
