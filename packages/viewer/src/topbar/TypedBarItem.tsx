import { TypeCapable } from '../registry';
import { barItemRegistry } from './barItemRegistry';
import React, { useMemo } from 'react';
import { TopBarItemProps } from './types';

export type BarItemType = string;

export interface TypedTopBarItemProps
  extends TopBarItemProps, TypeCapable<BarItemType> {}

export function TypedBarItem(props: TypedTopBarItemProps) {
  const TopBarItemComponent = useMemo(() => {
    return barItemRegistry.get(props.type);
  }, [props.type]);

  if (!TopBarItemComponent) {
    return undefined;
  }

  const topBarItemProps = {
    ...props,
  };

  return React.createElement(TopBarItemComponent, topBarItemProps);
}

TypedBarItem.displayName = 'TypedBarItem';
