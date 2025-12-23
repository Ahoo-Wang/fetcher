import { View } from '../index';
import { Flex, Tag } from 'antd';
import { useDebouncedFetcherQuery } from '@ahoo-wang/fetcher-react';
import { Condition } from '@ahoo-wang/fetcher-wow';
import styles from './ViewPanel.module.css';

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
      <div>
        {view.name} {view.viewSource === 'SYSTEM' && <Tag>系统</Tag>}
      </div>
      {!active && <div>{result && result > 999 ? '999+' : result || 0}</div>}
    </Flex>
  );
}
