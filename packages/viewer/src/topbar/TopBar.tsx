import { barItemRegistry } from './barItemRegistry';
import { BarItemType, TypedBarItem } from './TypedBarItem';
import { TopBarActionItem, useViewerSharedValue } from '../viewer';

import { Delimiter } from './Delimiter';

import styles from './TopBar.module.css';
import { AutoRefreshBarItem } from './AutoRefreshBarItem';
import { Button, Dropdown, Flex, MenuProps, Space } from 'antd';
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { RefObject, useCallback } from 'react';
import { useFullscreen } from '@ahoo-wang/fetcher-react';
import { BarItem } from './BarItem';
import { Point } from './Point';

export interface TopBarPropsCapable<RecordType> {
  topBar: TopBarProps<RecordType>;
}

export interface TopBarProps<RecordType> {
  barItems: BarItemType[];
  fullscreenTarget?: RefObject<HTMLElement | null>;
  enableFullscreen?: boolean;

  bulkOperationName?: string;
  bulkActions: TopBarActionItem<RecordType>[];

  primaryAction?: TopBarActionItem<RecordType>;
  secondaryActions?: TopBarActionItem<RecordType>[];

  tableSelectedItems: RecordType[];
}

function renderMenuItem<RecordType>(
  item: TopBarActionItem<RecordType>,
  index: number,
  tableSelectedItems: RecordType[],
) {
  if (item.render) {
    return {
      key: index,
      label: item.render(tableSelectedItems),
    };
  } else {
    return {
      key: index,
      label: (
        <Button
          type="link"
          {...item.attributes}
          onClick={() => item.onClick?.(tableSelectedItems)}
        >
          {item.title}
        </Button>
      ),
    };
  }
}

export function TopBar<RecordType>(props: TopBarProps<RecordType>) {
  const {
    barItems,
    fullscreenTarget,
    enableFullscreen,
    bulkOperationName,
    bulkActions,
    primaryAction,
    secondaryActions,
    tableSelectedItems,
  } = props;
  const { aggregateName, view } = useViewerSharedValue();

  let bulkMenuItems: MenuProps['items'] = [];
  if (bulkActions?.length) {
    bulkMenuItems = bulkActions.map(
      (action: TopBarActionItem<RecordType>, index: number) => {
        return renderMenuItem(action, index, tableSelectedItems);
      },
    );
  }

  let secondaryMenuItems: MenuProps['items'] = [];
  if (secondaryActions?.length) {
    secondaryMenuItems = secondaryActions.map(
      (action: TopBarActionItem<RecordType>, index: number) => {
        return renderMenuItem(action, index, tableSelectedItems);
      },
    );
  }

  const { isFullscreen, toggle } = useFullscreen({ target: fullscreenTarget });

  const handleFullscreenClick = useCallback(() => {
    toggle().then();
  }, [toggle]);

  return (
    <Flex align="center" justify="space-between">
      <Flex gap="8px" align="center" className={styles.leftItems}>
        <div>
          <BarItem icon={<MenuUnfoldOutlined />} active={false} />
        </div>
        <Delimiter />
        {aggregateName}
        <Point />
        {view.name}
      </Flex>
      <Flex gap="8px" align="center" className={styles.rightItems}>
        {barItems.map((barItem, index) => {
          const BarItemComponent = barItemRegistry.get(barItem);
          if (!BarItemComponent) {
            return null;
          }
          return <TypedBarItem type={barItem} key={index} />;
        })}
        <Delimiter />
        <AutoRefreshBarItem />
        {bulkMenuItems.length > 0 && (
          <>
            <Delimiter />
            <Dropdown menu={{ items: bulkMenuItems }} trigger={['click']}>
              <Button icon={<DownOutlined />} iconPlacement="end">
                {bulkOperationName && '批量操作'}
              </Button>
            </Dropdown>
          </>
        )}
        {primaryAction && (
          <>
            <Delimiter />
            <Space.Compact>
              {primaryAction.render ? (
                primaryAction.render(tableSelectedItems)
              ) : (
                <Button
                  type="primary"
                  {...primaryAction.attributes}
                  onClick={() => primaryAction.onClick?.(tableSelectedItems)}
                >
                  {primaryAction.title}
                </Button>
              )}
              {secondaryMenuItems.length > 0 && (
                <Dropdown
                  menu={{ items: secondaryMenuItems }}
                  trigger={['click']}
                >
                  <Button type="primary" icon={<DownOutlined />} />
                </Dropdown>
              )}
            </Space.Compact>
          </>
        )}
        {enableFullscreen && fullscreenTarget && (
          <>
            <Delimiter />
            <div onClick={handleFullscreenClick}>
              <BarItem
                icon={
                  isFullscreen ? (
                    <FullscreenExitOutlined />
                  ) : (
                    <FullscreenOutlined />
                  )
                }
                active={false}
              />
            </div>
          </>
        )}
      </Flex>
    </Flex>
  );
}
