import { TopBarItemProps } from './types';
import { BarItem } from './BarItem';
import { Dropdown, MenuProps } from 'antd';
import { ColumnHeightOutlined } from '@ant-design/icons';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useEffect, useState } from 'react';

export interface ColumnHeightBarItemProps extends TopBarItemProps {
  defaultTableSize: SizeType;
  onChange?: (size: SizeType) => void;
}

export function ColumnHeightBarItem(props: ColumnHeightBarItemProps) {
  const { className, defaultTableSize, onChange } = props;

  const [tableSize, setTableSize] = useState<SizeType>(defaultTableSize);

  useEffect(() => {
    setTableSize(defaultTableSize);
  }, [defaultTableSize]);

  const items: MenuProps['items'] = [
    {
      key: 'middle',
      label: '标准',
    },
    {
      key: 'small',
      label: '紧凑',
    },
  ];

  const handleSelect = ({ key }: { key: string }) => {
    setTableSize(key as SizeType);
    onChange?.(key as SizeType);
  };

  return (
    <Dropdown
      className={className}
      menu={{
        items,
        selectable: true,
        defaultSelectedKeys: [tableSize || 'middle'],
        onSelect: handleSelect,
      }}
      trigger={['click']}
    >
      <div onClick={e => e.preventDefault()}>
        <BarItem icon={<ColumnHeightOutlined />} active={false} />
      </div>
    </Dropdown>
  );
}
