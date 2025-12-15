import { TopBarItemProps } from './types';
import { RefAttributes, useState } from 'react';
import { BarItem, BarItemRef } from './BarItem';
import { FilterOutlined } from '@ant-design/icons';
import { useViewerSharedValue } from '../viewer';

export const FILTER_BAR_ITEM_TYPE: string = 'filter';

export interface FilterBarItemProps
  extends TopBarItemProps, RefAttributes<BarItemRef> {}

export function FilterBarItem(props: FilterBarItemProps) {
  const { style, className } = props;

  const { showFilterPanel, setShowFilterPanel } = useViewerSharedValue();

  const [active, setActive] = useState(showFilterPanel || false);

  const handleClick = () => {
    setActive(!active);
    setShowFilterPanel(!active);
  };

  return (
    <div className={className} style={style} onClick={handleClick}>
      <BarItem icon={<FilterOutlined />} active={active || false} />
    </div>
  );
}
