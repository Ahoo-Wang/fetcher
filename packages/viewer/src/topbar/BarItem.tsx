import React from 'react';
import styles from './BarItem.module.css';

export interface BarItemProps {
  icon: React.ReactNode;
  active: boolean;
}

export function BarItem(props: BarItemProps) {
  const { icon, active } = props;

  return (
    <div className={`${styles.item} ${active ? styles.active : ''}`}>
      {icon}
    </div>
  );
}
