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
import { StyleCapable } from '../../types';
import { and, Condition } from '@ahoo-wang/fetcher-wow';
import { Button, Col, Row, Space, ColProps } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useRefs } from '@ahoo-wang/fetcher-react';
import { RemovableTypedFilter } from './RemovableTypedFilter';
import { RowProps } from 'antd/es/grid/row';

export interface ActiveFilter
  extends Omit<TypedFilterProps, 'onChange' | 'ref'> {
  key: Key;
  onRemove?: () => void;
}

export interface FilterPanelProps {
  rowProps?: RowProps;
  colProps?: ColProps;
  actionColProps?: ColProps;
  filters: ActiveFilter[];
  actions?: React.ReactNode;
  onSearch?: (condition: Condition) => void;
  loading?: boolean;
}

export function FilterPanel(props: FilterPanelProps) {
  const {
    rowProps = { gutter: [8, 8], wrap: true },
    colProps = {
      xxl: 6,
      xl: 8,
      lg: 12,
      md: 12,
      sm: 24,
      xs: 24,
    },
    actionColProps = {
      span: 12,
    },
    filters,
    onSearch,
    actions,
    loading = false,
  } = props;
  const filterRefs = useRefs<FilterRef>();
  const handleSearch = () => {
    if (!onSearch) {
      return;
    }
    const conditions = Array.from(filterRefs.values())
      .map(ref => ref?.getValue()?.condition)
      .filter(Boolean);
    const finalCondition: Condition = and(...conditions);
    onSearch(finalCondition);
  };
  return (
    <>
      <Row {...rowProps}>
        {filters.map(filter => {
          return (
            <Col {...colProps}>
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
        <Col  {...actionColProps}>
          <Space>
            {actions}
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              Search
            </Button>
          </Space>
        </Col>
      </Row>
    </>
  );
}
