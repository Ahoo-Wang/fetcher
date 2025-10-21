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

import React, { useState, useCallback, useMemo } from 'react';
import { TypedFilter } from './TypedFilter';
import { FilterValue, FilterField } from './types';
import { Condition, Operator } from '@ahoo-wang/fetcher-wow';
import { Card, Button, Space, Typography, Divider, Empty } from 'antd';

const { Title, Text } = Typography;

export interface FilterItem {
  id: string;
  field: FilterField;
  type: string;
  value?: FilterValue;
}

export interface FilterPanelProps {
  /** 可用的过滤字段配置 */
  availableFields: FilterField[];
  /** 当前激活的过滤器列表 */
  filters?: FilterItem[];
  /** 过滤器变化回调 */
  onFiltersChange?: (filters: FilterItem[]) => void;
  /** 过滤结果变化回调 */
  onFilterChange?: (conditions: Condition[]) => void;
  /** 面板标题 */
  title?: string;
  /** 是否可折叠 */
  collapsible?: boolean;
  /** 默认展开状态 */
  defaultExpanded?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * 过滤器面板组件
 *
 * 提供统一的过滤器管理界面，支持动态添加/移除过滤器，
 * 组合过滤条件，并提供友好的用户交互体验。
 */
export function FilterPanel({
  availableFields,
  filters: externalFilters = [],
  onFiltersChange,
  onFilterChange,
  title = '过滤条件',
  collapsible = false,
  defaultExpanded = true,
  style,
  className,
}: FilterPanelProps) {
  const [internalFilters, setInternalFilters] =
    useState<FilterItem[]>(externalFilters);
  const [expanded, setExpanded] = useState(defaultExpanded);

  // 使用外部状态或内部状态
  const filters = onFiltersChange ? externalFilters : internalFilters;
  const setFilters = onFiltersChange || setInternalFilters;

  // 生成唯一ID
  const generateId = useCallback(() => {
    return `filter_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // 添加新过滤器
  const addFilter = useCallback(() => {
    if (availableFields.length === 0) return;

    const firstAvailableField = availableFields[0];
    const newFilter: FilterItem = {
      id: generateId(),
      field: firstAvailableField,
      type: firstAvailableField.type,
    };

    setFilters([...filters, newFilter]);
  }, [availableFields, filters, generateId, setFilters]);

  // 移除过滤器
  const removeFilter = useCallback(
    (filterId: string) => {
      const newFilters = filters.filter(f => f.id !== filterId);
      setFilters(newFilters);
    },
    [filters, setFilters],
  );

  // 更新过滤器值
  const updateFilterValue = useCallback(
    (filterId: string, value?: FilterValue) => {
      const newFilters = filters.map(f =>
        f.id === filterId ? { ...f, value } : f,
      );
      setFilters(newFilters);
    },
    [filters, setFilters],
  );

  // 清空所有过滤器
  const clearAllFilters = useCallback(() => {
    setFilters([]);
  }, [setFilters]);

  // 获取未使用的字段
  const unusedFields = useMemo(() => {
    const usedFieldNames = filters.map(f => f.field.name);
    return availableFields.filter(
      field => !usedFieldNames.includes(field.name),
    );
  }, [availableFields, filters]);

  // 获取有效的过滤条件
  const validConditions = useMemo(() => {
    return filters
      .map(f => f.value?.condition)
      .filter((condition): condition is Condition => condition !== undefined);
  }, [filters]);

  // 当过滤条件变化时通知父组件
  React.useEffect(() => {
    onFilterChange?.(validConditions);
  }, [validConditions, onFilterChange]);

  // 切换展开状态
  const toggleExpanded = useCallback(() => {
    setExpanded(!expanded);
  }, [expanded]);

  // 如果没有可用字段，显示空状态
  if (availableFields.length === 0) {
    return (
      <Card style={style} className={className}>
        <Empty
          description="暂无可用的过滤字段"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      </Card>
    );
  }

  const headerContent = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space>
        <Title level={5} style={{ margin: 0 }}>
          {title}
        </Title>
        {validConditions.length > 0 && (
          <Text type="secondary">({validConditions.length} 个有效条件)</Text>
        )}
      </Space>
      <Space>
        {filters.length > 0 && (
          <Button type="text" size="small" onClick={clearAllFilters}>
            清空
          </Button>
        )}
        {unusedFields.length > 0 && (
          <Button type="primary" size="small" onClick={addFilter}>
            添加过滤器
          </Button>
        )}
        {collapsible && (
          <Button type="text" size="small" onClick={toggleExpanded}>
            {expanded ? '收起' : '展开'}
          </Button>
        )}
      </Space>
    </Space>
  );

  return (
    <Card
      style={style}
      className={className}
      title={headerContent}
      size="small"
    >
      {(!collapsible || expanded) && (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {filters.length === 0 ? (
            <Empty
              description="暂无过滤条件，点击上方按钮添加"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          ) : (
            filters.map((filter, index) => (
              <div key={filter.id}>
                <Space
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <TypedFilter
                      type={filter.type}
                      field={filter.field}
                      label={{ children: filter.field.label }}
                      operator={{ defaultValue: Operator.EQ, options: [] }}
                      value={{
                        defaultValue: filter.value?.condition?.value,
                        placeholder: '输入值',
                      }}
                      onChange={value => updateFilterValue(filter.id, value)}
                    />
                  </div>
                  <Button
                    type="text"
                    danger
                    size="small"
                    onClick={() => removeFilter(filter.id)}
                    style={{ marginTop: 4 }}
                  >
                    删除
                  </Button>
                </Space>
                {index < filters.length - 1 && (
                  <Divider style={{ margin: '12px 0' }} />
                )}
              </div>
            ))
          )}
        </Space>
      )}
    </Card>
  );
}

FilterPanel.displayName = 'FilterPanel';
