import { TopBarItemProps } from './types';
import { useState } from 'react';
import { BarItem } from './BarItem';
import { FilterOutlined } from '@ant-design/icons';
import { useViewerSharedValue } from '../viewer';

export const FILTER_BAR_ITEM_TYPE: string = 'filter';

export interface FilterBarItemProps
  extends TopBarItemProps {}

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
