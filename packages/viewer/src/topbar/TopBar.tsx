import { barItemRegistry } from './barItemRegistry';
import { BarItemType, TypedBarItem } from './TypedBarItem';
import {
  BatchOperationConfig,
  TopBarActionItem,
  ViewManagement,
  ViewSource,
} from '../viewer';

import styles from './TopBar.module.css';
import { AutoRefreshBarItem } from './AutoRefreshBarItem';
import { Button, Divider, Dropdown, Flex, MenuProps, Space } from 'antd';
import {
  DownOutlined,
  FullscreenExitOutlined,
  FullscreenOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import React, { RefObject, useCallback } from 'react';
import { useFullscreen } from '@ahoo-wang/fetcher-react';
import { BarItem } from './BarItem';
import { Point } from './Point';
import { ActionItem, SaveViewMethod } from '../types';
import type { ItemType } from 'antd/es/menu/interface';

export interface TopBarPropsCapable<RecordType> {
  topBar: Omit<TopBarProps<RecordType>, 'title' | 'viewName'>;
}

export interface TopBarProps<RecordType> {
  title: string;
  viewName: string;
  viewSource: ViewSource;
  barItems: BarItemType[];
  fullscreenTarget?: RefObject<HTMLElement | null>;
  enableFullscreen?: boolean;

  batchOperationConfig?: BatchOperationConfig<RecordType>;

  primaryAction?: ActionItem<RecordType>;
  secondaryActions?: ActionItem<RecordType>[];

  viewChanged: boolean;
  viewManagement?: ViewManagement;
  onSaveView?: (method: SaveViewMethod) => void;
  onReset?: () => void;
  tableSelectedItems: RecordType[];

  showViewPanel: boolean;
  onViewPanelUnfold: () => void;
}

function renderMenuItem<RecordType>(
  item: TopBarActionItem<RecordType>,
  index: number,
  tableSelectedItems: RecordType[],
): ItemType {
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

const saveMethodItems: MenuProps['items'] = [
  {
    label: '覆盖当前视图',
    key: 'Update',
  },
  {
    label: '另存为新视图',
    key: 'SaveAs',
  },
];

export function TopBar<RecordType>(props: TopBarProps<RecordType>) {
  const {
    title,
    viewName,
    viewSource,
    barItems,
    fullscreenTarget,
    enableFullscreen,
    batchOperationConfig,
    primaryAction,
    secondaryActions,
    tableSelectedItems,
    showViewPanel,
    onViewPanelUnfold,
    viewChanged,
    onSaveView,
    onReset,
  } = props;

  let batchMenuItems: MenuProps['items'] = [];
  if (batchOperationConfig?.enabled) {
    batchMenuItems = batchOperationConfig!.actions.map(
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

  const handleMenuClick: MenuProps['onClick'] = e => {
    onSaveView?.(e.key as SaveViewMethod);
  };

  const menuProps = {
    items: saveMethodItems,
    onClick: handleMenuClick,
  };

  const handleReset = useCallback(() => {
    onReset?.();
  }, [onReset]);

  return (
    <>
      <Flex align="center" justify="space-between">
        <Flex gap="8px" align="center" className={styles.leftItems}>
          {!showViewPanel && (
            <>
              <div onClick={onViewPanelUnfold}>
                <BarItem icon={<MenuUnfoldOutlined />} active={false} />
              </div>
              <Divider orientation="vertical" />
              {title}
              <Point />
            </>
          )}
          {viewName}
          {viewChanged && (
            <>
              <div style={{ color: 'rgba(0,0,0,0.45)' }}>(已编辑)</div>
              {viewSource === 'SYSTEM' ? (
                <Button
                  type="default"
                  size="small"
                  onClick={() => onSaveView?.('SaveAs')}
                >
                  另存为
                </Button>
              ) : (
                <Dropdown menu={menuProps} trigger={['click']}>
                  <Button
                    size="small"
                    icon={<DownOutlined />}
                    iconPlacement="end"
                  >
                    保存
                  </Button>
                </Dropdown>
              )}
              <Button type="default" size="small" onClick={handleReset}>
                重置
              </Button>
            </>
          )}
        </Flex>
        <Flex gap="8px" align="center" className={styles.rightItems}>
          {barItems.map((barItem, index) => {
            const BarItemComponent = barItemRegistry.get(barItem);
            if (!BarItemComponent) {
              return null;
            }
            return <TypedBarItem type={barItem} key={index} />;
          })}
          <Divider orientation="vertical" />
          <AutoRefreshBarItem />
          {batchOperationConfig?.enabled && (
            <>
              <Divider orientation="vertical" />
              <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
                <Button icon={<DownOutlined />} iconPlacement="end">
                  {batchOperationConfig?.title && '批量操作'}
                </Button>
              </Dropdown>
            </>
          )}
          {primaryAction && (
            <>
              <Divider orientation="vertical" />
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
                    placement="bottomRight"
                  >
                    <Button type="primary" icon={<DownOutlined />} />
                  </Dropdown>
                )}
              </Space.Compact>
            </>
          )}
          {enableFullscreen && fullscreenTarget && (
            <>
              <Divider orientation="vertical" />
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
    </>
  );
}
