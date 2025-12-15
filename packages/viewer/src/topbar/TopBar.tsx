import { barItemRegistry } from './barItemRegistry';
import { BarItemType, TypedBarItem } from './TypedBarItem';
import { FILTER_BAR_ITEM_TYPE } from './FilterBarItem';
import { useViewerSharedValue } from '../viewer';

import styles from './TopBar.module.css';
import { Space } from 'antd';

export interface TopBarProps {
  barItems: BarItemType[];
}

export function TopBar(props: TopBarProps) {
  const { barItems } = props;

  const { aggregateName, viewName } = useViewerSharedValue();

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div style={{ lineHeight: '32px' }}>
        {aggregateName} | {viewName}
      </div>
      <Space>
        {barItems.map((barItem, index) => {
          const BarItemComponent = barItemRegistry.get(barItem);
          if (!BarItemComponent) {
            return null;
          }
          return <TypedBarItem type={barItem} key={index} />;
        })}
      </Space>
    </div>
  );
}
