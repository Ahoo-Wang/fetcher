import { View } from '../index';
import { Flex, Tag } from 'antd';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';
import { Condition } from '@ahoo-wang/fetcher-wow';
import styles from './ViewPanel.module.less';

export interface ViewItemProps {
  view: View;
  countUrl: string;
  active: boolean;
}

export function ViewItem(props: ViewItemProps) {
  const { view, countUrl, active } = props;
  const { result } = useDebouncedFetcherQuery<Condition, number>({
    url: countUrl,
    initialQuery: view.condition,
    debounce: {
      delay: 300,
      leading: true,
    },
    autoExecute: true,
  });

  return (
    <Flex
      align="center"
      justify="space-between"
      className={`${styles.viewItem} ${active ? styles.active : ''}`}
    >
      <div className={styles.viewName}>
        {/* 核心：用 data-tooltip 存储完整文本，配合 CSS 显示 */}
        <span className={styles.viewNameText} data-tooltip={view.name}>
          {view.name}
        </span>
        {view.viewSource === 'SYSTEM' && (
          <Tag className={styles.viewNameTag}>系统</Tag>
        )}
      </div>
      {!active && <div>{result && result > 999 ? '999+' : result || 0}</div>}
    </Flex>
  );
}
