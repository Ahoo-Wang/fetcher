import React, { RefAttributes, useImperativeHandle, useState } from 'react';
import styles from './BarItem.module.css';

export interface BarItemRef {
  toggle: () => void;
}

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
