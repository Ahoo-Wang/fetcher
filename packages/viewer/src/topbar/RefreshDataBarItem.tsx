import { TopBarItemProps } from './types';
import { BarItem } from './BarItem';
import { ReloadOutlined } from '@ant-design/icons';
import { useViewerSharedValue } from '../viewer';

export const REFRESH_DATA_BAR_ITEM_TYPE: string = 'refresh_data';

export interface RefreshDataBarItemProps
  extends TopBarItemProps {}

export function RefreshDataBarItem(props: RefreshDataBarItemProps) {
  const { style, className } = props;

  const { refreshData } = useViewerSharedValue();

  const handleClick = () => {
    refreshData();
  };

  return (
    <div className={className} style={style} onClick={handleClick}>
      <BarItem icon={<ReloadOutlined />} active={false} />
    </div>
  );
}
