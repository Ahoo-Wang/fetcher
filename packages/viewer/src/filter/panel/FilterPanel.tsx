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

import React, { Key } from 'react';
import { TypedFilterProps } from '../TypedFilter';
import { FilterRef } from '../types';
import { and, Condition } from '@ahoo-wang/fetcher-wow';
import { Button, Col, Row, Space, ColProps, ButtonProps } from 'antd';
import { ClearOutlined, SearchOutlined } from '@ant-design/icons';
import { useRefs } from '@ahoo-wang/fetcher-react';
import { RemovableTypedFilter } from './RemovableTypedFilter';
import { RowProps } from 'antd/es/grid/row';

export interface ActiveFilter
  extends Omit<TypedFilterProps, 'onChange' | 'ref'> {
  key: Key;
  onRemove?: () => void;
}

export interface FilterPanelProps {
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

const DEFAULT_ACTIONS_COL_PROPS: ColProps = {
  span: 12,
};

export function FilterPanel(props: FilterPanelProps) {
  const {
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
  const onSearchHandler = () => {
    if (!onSearch) {
      return;
    }
    const conditions = Array.from(filterRefs.values())
      .map(ref => ref?.getValue()?.condition)
      .filter(Boolean);
    const finalCondition: Condition = and(...conditions);
    onSearch(finalCondition);
  };
  const onResetHandler = () => {
    for (const filterRef of filterRefs.values()) {
      filterRef.reset();
    }
  };
  const showResetButton = resetButton !== false;
  const resetButtonProps = typeof resetButton === 'object' ? resetButton : {};
  return (
    <>
      <Row {...row}>
        {filters.map(filter => {
          return (
            <Col {...col} key={filter.key}>
              <RemovableTypedFilter
                key={filter.key}
                type={filter.type}
                field={filter.field}
                operator={filter.operator}
                value={filter.value}
                onRemove={filter.onRemove}
                ref={filterRefs.register(filter.key)}
              ></RemovableTypedFilter>
            </Col>
          );
        })}
        <Col  {...actionsCol}>
          <Space.Compact>
            {actions}
            {showResetButton && (
              <Button
                icon={<ClearOutlined />}
                onClick={onResetHandler}
                {...resetButtonProps}
              >
                {resetButtonProps?.children || 'Reset'}
              </Button>
            )}
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={onSearchHandler}
              { ...searchButton }
            >
              {searchButton?.children || 'Search'}
            </Button>
          </Space.Compact>
        </Col>
      </Row>
    </>
  );
}
