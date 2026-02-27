/*
 * Copyright [2021-present] [ahoo wang <ahoowang@qq.com> (https://github.com/Ahoo-Wang)].
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *      http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { Key, RefAttributes, useImperativeHandle } from 'react';
import { TypedFilterProps } from '../TypedFilter';
import { FilterRef } from '../types';
import { and, Condition } from '@ahoo-wang/fetcher-wow';
import { Button, Col, Row, Space, ColProps, ButtonProps } from 'antd';
import { ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { useRefs } from '@ahoo-wang/fetcher-react';
import { RemovableTypedFilter } from './RemovableTypedFilter';
import { RowProps } from 'antd/es/grid/row';
import { useLocale } from '../../locale';

export interface ActiveFilter extends Omit<
  TypedFilterProps,
  'onChange' | 'ref'
> {
  key: Key;
  onRemove?: () => void;
}

export interface FilterPanelRef {
  /**
   * Triggers the search action using the current filter values.
   * Typically calls the `onSearch` callback with the composed filter condition.
   */
  search(): void;

  /**
   * Resets all filter values to their initial state.
   * Typically clears the filters and triggers any associated reset logic.
   */
  reset(): void;
}

export interface FilterPanelProps extends RefAttributes<FilterPanelRef> {
  row?: RowProps;
  col?: ColProps;
  actionsCol?: ColProps;
  filters: ActiveFilter[];
  actions?: React.ReactNode;
  onSearch?: (condition: Condition) => void;
  resetButton?: boolean | Omit<ButtonProps, 'onClick'>;
  searchButton?: Omit<ButtonProps, 'onClick'>;
}

const DEFAULT_ROW_PROPS: RowProps = {
  gutter: [8, 8],
  wrap: true,
};

const DEFAULT_COL_PROPS: ColProps = {
  xxl: 6,
  xl: 8,
  lg: 12,
  md: 12,
  sm: 24,
  xs: 24,
};

const DEFAULT_ACTIONS_COL_PROPS: ColProps = DEFAULT_COL_PROPS;

export function FilterPanel(props: FilterPanelProps) {
  const {
    ref,
    row = DEFAULT_ROW_PROPS,
    col = DEFAULT_COL_PROPS,
    actionsCol = DEFAULT_ACTIONS_COL_PROPS,
    filters,
    onSearch,
    actions,
    resetButton,
    searchButton,
  } = props;
  const filterRefs = useRefs<FilterRef>();

  const { locale } = useLocale();

  const latestCondition = () => {
    const conditions = Array.from(filterRefs.values())
      .map(ref => ref?.getValue()?.condition)
      .filter(Boolean);
    return and(...conditions);
  };

  const handleSearch = () => {
    if (!onSearch) {
      return;
    }
    const finalCondition = latestCondition();
    onSearch(finalCondition);
  };
  const handleReset = () => {
    for (const filterRef of filterRefs.values()) {
      filterRef.reset();
    }
  };
  useImperativeHandle<FilterPanelRef, FilterPanelRef>(ref, () => ({
    search: handleSearch,
    reset: handleReset,
  }));
  const showResetButton = resetButton !== false;
  const resetButtonProps = typeof resetButton === 'object' ? resetButton : {};
  return (
    <>
      <Row {...row} style={{ maxHeight: '128px', overflowY: 'auto' }}>
        {filters.map(filter => {
          return (
            <Col {...col} key={filter.key}>
              <RemovableTypedFilter
                {...filter}
                ref={filterRefs.register(filter.key)}
              ></RemovableTypedFilter>
            </Col>
          );
        })}
      </Row>
      <Row justify="end" style={{ marginTop: '16px' }}>
        <Col {...actionsCol} style={{ textAlign: 'right' }}>
          <Space.Compact>
            {actions}
            {showResetButton && (
              <Button
                icon={<ClearOutlined />}
                onClick={handleReset}
                {...resetButtonProps}
              >
                {resetButtonProps?.children || 'Reset'}
              </Button>
            )}
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              {...searchButton}
            >
              {searchButton?.children ||
                locale.filterPanel?.searchButtonTitle ||
                'Search'}
            </Button>
          </Space.Compact>
        </Col>
      </Row>
    </>
  );
}
