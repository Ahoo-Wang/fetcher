import type { TopBarItemProps } from './types';
import { BarItem } from './BarItem';
import type { MenuProps } from 'antd';
import { Dropdown, Tooltip } from 'antd';
import { ColumnHeightOutlined } from '@ant-design/icons';
import type { SizeType } from 'antd/es/config-provider/SizeContext';
import { useState } from 'react';
import { useLocale } from '../locale';

export interface ColumnHeightBarItemProps extends TopBarItemProps {
  defaultTableSize: SizeType;
  onChange?: (size: SizeType) => void;
}

export function ColumnHeightBarItem(props: ColumnHeightBarItemProps) {
  const { className, defaultTableSize, onChange } = props;

  const [tableSize, setTableSize] = useState<SizeType>(defaultTableSize);
  const [prevDefaultTableSize, setPrevDefaultTableSize] =
    useState(defaultTableSize);

  const { locale } = useLocale();

  // 监听 defaultTableSize 变化，同步 tableSize（在渲染阶段调整，避免在 effect 中调用 setState）
  if (defaultTableSize !== prevDefaultTableSize) {
    setPrevDefaultTableSize(defaultTableSize);
    setTableSize(defaultTableSize);
  }

  const items: MenuProps['items'] = [
    {
      key: 'middle',
      label: locale.topBar?.tableSize?.middle || '标准',
    },
    {
      key: 'small',
      label: locale.topBar?.tableSize?.small || '紧凑',
    },
  ];

  const handleSelect = ({ key }: { key: string }) => {
    setTableSize(key as SizeType);
    onChange?.(key as SizeType);
  };

  return (
    <Tooltip placement="top" title="行高">
      <Dropdown
        className={className}
        menu={{
          items,
          selectable: true,
          defaultSelectedKeys: [tableSize || 'middle'],
          onSelect: handleSelect,
        }}
        trigger={['click']}
        placement="bottom"
      >
        <div onClick={e => e.preventDefault()}>
          <BarItem icon={<ColumnHeightOutlined />} active={false} />
        </div>
      </Dropdown>
    </Tooltip>
  );
}
