import { BarItem } from './BarItem';
import { TopBarItemProps } from './types';
import { LinkOutlined } from '@ant-design/icons';
import { message, Tooltip } from 'antd';

export interface ShareLinkBarItemProps extends TopBarItemProps {}

export function ShareLinkBarItem(props: ShareLinkBarItemProps) {
  const { className, style } = props;

  const [messageApi, contextHolder] = message.useMessage();

  const handleClick = async () => {
    const currentFullPath = window.location.href;
    try {
      await navigator.clipboard.writeText(currentFullPath);
      messageApi.success('链接复制成功');
    } catch (error) {
      console.error('Failed to copy: ', error);
      messageApi.error('链接复制失败');
    }
  };

  return (
    <>
      {contextHolder}
      <Tooltip placement="top" title="分享视图">
        <div className={className} style={style} onClick={handleClick}>
          <BarItem icon={<LinkOutlined />} active={false} />
        </div>
      </Tooltip>
    </>
  );
}
