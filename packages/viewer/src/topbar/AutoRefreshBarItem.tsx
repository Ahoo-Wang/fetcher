import { Button, Dropdown, MenuProps } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useEffect, useRef, useState } from 'react';
import { useLocale, useRefreshDataEventBus } from '../';

export interface AutoRefreshItem {
  label: string;
  key: string;
  refreshInterval: number;
}

export interface AutoRefreshBarItemProps {
  items?: AutoRefreshItem[];
}

const DefaultAutoRefreshItems = [
  {
    label: '1 分钟',
    key: '1',
    refreshInterval: 60 * 1000,
  },
  {
    label: '3 分钟',
    key: '3',
    refreshInterval: 3 * 60 * 1000,
  },
  {
    label: '5 分钟',
    key: '5',
    refreshInterval: 5 * 60 * 1000,
  },
];

const NeverRefreshItem: AutoRefreshItem = {
  label: '从不',
  key: '0',
  refreshInterval: 0,
};

export function AutoRefreshBarItem({
  items = DefaultAutoRefreshItems,
}: AutoRefreshBarItemProps) {
  const finalItems = [...items, NeverRefreshItem];

  const [selectedItem, setSelectedItem] =
    useState<AutoRefreshItem>(NeverRefreshItem);

  const intervalIdRef = useRef<number | null>(null);

  const { publish } = useRefreshDataEventBus();
  const { locale } = useLocale();

  const handleMenuClick: MenuProps['onClick'] = menuInfo => {
    const item = finalItems.find(i => i.key === menuInfo.key);
    if (item) {
      setSelectedItem(item);
    }
  };

  useEffect(() => {
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }
    if (selectedItem.refreshInterval > 0) {
      intervalIdRef.current = setInterval(async () => {
        await publish();
      }, selectedItem.refreshInterval);
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
    };
  }, [selectedItem, publish]);

  const menuItems: MenuProps['items'] = finalItems.map(i => ({
    key: i.key,
    label: i.label,
  }));

  const menuProps = {
    items: menuItems,
    onClick: handleMenuClick,
    selectable: true,
    defaultSelectedKeys: [selectedItem.key],
  };

  return (
    <Dropdown menu={menuProps} trigger={['click']}>
      <Button icon={<DownOutlined />} iconPlacement="end">
        {locale.topBar?.autoRefresh?.title || '刷新率'} ：{selectedItem.label}
      </Button>
    </Dropdown>
  );
}
