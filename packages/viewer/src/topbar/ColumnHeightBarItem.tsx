import { TopBarItemProps } from './types';
import { BarItem } from './BarItem';
import { Dropdown, MenuProps } from 'antd';
import { ColumnHeightOutlined } from '@ant-design/icons';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { useTableStateContext } from '../viewer/TableStateContext';

export const COLUMN_HEIGHT_BAR_ITEM_TYPE: string = 'column-height';

export interface ColumnHeightBarItemProps extends TopBarItemProps {}

export function ColumnHeightBarItem(props: ColumnHeightBarItemProps) {
  const { className } = props;

  const { tableSize, updateTableSize } = useTableStateContext();

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
    updateTableSize(key as SizeType);
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
