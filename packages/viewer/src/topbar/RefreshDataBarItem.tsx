import { TopBarItemProps } from './types';
import { BarItem } from './BarItem';
import { ReloadOutlined } from '@ant-design/icons';
import { useRefreshDataEventBus } from '../';

export interface RefreshDataBarItemProps extends TopBarItemProps {}

export function RefreshDataBarItem(props: RefreshDataBarItemProps) {
  const { style, className } = props;

  const { publish } = useRefreshDataEventBus();

  const handleClick = async () => {
    await publish();
  };

  return (
    <div className={className} style={style} onClick={handleClick}>
      <BarItem icon={<ReloadOutlined />} active={false} />
    </div>
  );
}
