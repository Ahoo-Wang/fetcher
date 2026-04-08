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

import type { Key, RefAttributes} from 'react';
import React, { useImperativeHandle } from 'react';
import type { TypedFilterProps } from '../TypedFilter';
import type { FilterRef } from '../types';
import type { Condition } from '@ahoo-wang/fetcher-wow';
import { and } from '@ahoo-wang/fetcher-wow';
import type { ColProps, ButtonProps } from 'antd';
import { Button, Col, Row, Space } from 'antd';
import { ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { useRefs } from '@ahoo-wang/fetcher-react';
import { RemovableTypedFilter } from './RemovableTypedFilter';
import type { RowProps } from 'antd/es/grid/row';
import { useLocale } from '../../locale';

export interface ActiveFilter extends Omit<
  TypedFilterProps,
  'onChange' | 'ref'
> {
  key: Key;
  onRemove?: () => void;
}

export interface FilterPanelConditionCapableRef {
  /**
   * Retrieves the current filter condition composed from all active filters in the panel.
   * Returns a Condition object that can be used for data queries, exports, or other operations
   * that require the current filter state.
   * @returns The composed Condition object representing all active filter values.
   */
  getCondition(): Condition | undefined;
}

export interface FilterPanelRef extends FilterPanelConditionCapableRef {
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
  onSearch?: (
    finalCondition: Condition,
    activeFilterValues: Map<Key, Condition>,
  ) => void;
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

  const getCondition = () => {
    const conditions: Condition[] = [];
    const activeFilterValues = new Map<Key, Condition>();
    for (const entry of filterRefs.entries()) {
      const key = entry[0];
      const condition = entry[1].getValue()?.condition;
      if (condition) {
        conditions.push(condition);
        activeFilterValues.set(key, condition);
      }
    }
    const finalCondition = and(...conditions);
    return {
      finalCondition,
      activeFilterValues,
    };
  };

  const handleSearch = () => {
    if (!onSearch) {
      return;
    }
    const { finalCondition, activeFilterValues } = getCondition();
    onSearch(finalCondition, activeFilterValues);
  };
  const handleReset = () => {
    for (const filterRef of filterRefs.values()) {
      filterRef.reset();
    }
  };
  useImperativeHandle<FilterPanelRef, FilterPanelRef>(ref, () => ({
    search: handleSearch,
    reset: handleReset,
    getCondition(): Condition {
      const { finalCondition } = getCondition();
      return finalCondition;
    },
  }));
  const handleEnter = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.nativeEvent.isComposing) {
      return;
    }
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  const showResetButton = resetButton !== false;
  const resetButtonProps = typeof resetButton === 'object' ? resetButton : {};
  return (
    <>
      <Row
        style={{ maxHeight: '128px', overflowY: 'auto' }}
        onKeyUp={handleEnter}
        {...row}
      >
        {filters.map(filter => {
          return (
            <Col {...col} key={filter.key}>
              <RemovableTypedFilter
                {...filter}
                key={filter.key}
                ref={filterRefs.register(filter.key)}
              ></RemovableTypedFilter>
            </Col>
          );
        })}
      </Row>
      <Row justify="end" style={{ marginTop: '16px' }}>
        <Col style={{ textAlign: 'right' }} {...actionsCol}>
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
