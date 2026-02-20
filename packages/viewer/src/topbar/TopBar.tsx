import {
  TopBarActionItem,
  TopbarActionsCapable,
  ViewMutationActionsCapable,
  ViewSource,
  SaveViewMethod,
} from '../';
import styles from './TopBar.module.css';
import { Button, Divider, Dropdown, Flex, MenuProps, Space } from 'antd';
import { DownOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import React, { useCallback } from 'react';
import type { ItemType } from 'antd/es/menu/interface';
import {
  AutoRefreshBarItem,
  BarItem,
  Point,
  FilterBarItem,
  RefreshDataBarItem,
  ColumnHeightBarItem,
  ShareLinkBarItem,
} from './';
import { SizeType } from 'antd/es/config-provider/SizeContext';

export interface TopBarProps<RecordType>
  extends ViewMutationActionsCapable, TopbarActionsCapable<RecordType> {
  title: string;
  viewName: string;
  viewSource: ViewSource;

  viewChanged: boolean;
  onSaveAsView?: (method: SaveViewMethod) => void;
  onReset?: () => void;
  tableSelectedItems: RecordType[];

  showViewPanel: boolean;
  onShowViewPanelChange?: (showViewPanel: boolean) => void;

  showFilter: boolean;
  onShowFilterChange?: (show: boolean) => void;
  defaultTableSize: SizeType;
  onTableSizeChange?: (size: SizeType) => void;
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
    primaryAction,
    secondaryActions,
    batchActions,
    tableSelectedItems,
    showViewPanel,
    onShowViewPanelChange,
    viewChanged,
    onSaveAsView,
    onReset,
    showFilter,
    onShowFilterChange,
    defaultTableSize,
    onTableSizeChange,
  } = props;

  let batchMenuItems: MenuProps['items'] = [];
  if (batchActions?.enabled) {
    batchMenuItems = batchActions!.actions.map(
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

  const handleMenuClick: MenuProps['onClick'] = e => {
    onSaveAsView?.(e.key as SaveViewMethod);
  };

  const menuProps = {
    items: saveMethodItems,
    onClick: handleMenuClick,
  };

  const handleReset = useCallback(() => {
    onReset?.();
  }, [onReset]);

  const handleUnfoldClick = useCallback(() => {
    onShowViewPanelChange?.(true);
  }, [onShowViewPanelChange]);

  return (
    <>
      <Flex align="center" justify="space-between">
        <Flex gap="8px" align="center" className={styles.leftItems}>
          {!showViewPanel && (
            <>
              <div onClick={handleUnfoldClick}>
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
                  onClick={() => onSaveAsView?.('SaveAs')}
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
          <FilterBarItem
            defaultShowFilter={showFilter}
            onChange={onShowFilterChange}
          />
          <RefreshDataBarItem />
          <ColumnHeightBarItem
            defaultTableSize={defaultTableSize}
            onChange={onTableSizeChange}
          />
          <ShareLinkBarItem />
          <Divider orientation="vertical" />
          <AutoRefreshBarItem />
          {batchActions?.enabled && (
            <>
              <Divider orientation="vertical" />
              <Dropdown menu={{ items: batchMenuItems }} trigger={['click']}>
                <Button icon={<DownOutlined />} iconPlacement="end">
                  {batchActions?.title && '批量操作'}
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
        </Flex>
      </Flex>
    </>
  );
}
