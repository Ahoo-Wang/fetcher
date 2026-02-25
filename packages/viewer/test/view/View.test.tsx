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

import { describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import { View } from '../../src/view/View';
import { FieldDefinition, ViewColumn } from '../../src/viewer/types';
import { AvailableFilterGroup } from '../../src/filter/panel/AvailableFilterSelect';
import { pagedList } from '@ahoo-wang/fetcher-wow';
import { SizeType } from 'antd/es/config-provider/SizeContext';

vi.mock('../../src/hooks/useRefreshDataEventBus', () => ({
  useRefreshDataEventBus: vi.fn(() => ({
    publish: vi.fn().mockResolvedValue(undefined),
  })),
}));

vi.mock('../../src/locale/useLocale', () => ({
  useLocale: vi.fn(() => ({
    locale: {},
    setLocale: vi.fn(),
  })),
}));

interface User {
  id: number;
  name: string;
}

describe('View', () => {
  const fields: FieldDefinition[] = [
    { name: 'id', label: 'ID', type: 'text', primaryKey: true },
    { name: 'name', label: 'Name', type: 'text', primaryKey: false },
  ];

  const defaultColumns: ViewColumn[] = [
    { key: 'id', name: 'id', fixed: true, hidden: false },
    { key: 'name', name: 'name', fixed: false, hidden: false },
  ];

  const availableFilters: AvailableFilterGroup[] = [];

  const dataSource = pagedList<User>({
    list: [
      { id: 1, name: 'John' },
      { id: 2, name: 'Jane' },
    ],
    total: 2,
  });

  const defaultProps = {
    fields,
    availableFilters,
    dataSource,
    defaultColumns,
    defaultPage: 1,
    defaultPageSize: 10,
    defaultTableSize: 'middle' as SizeType,
    pagination: { defaultPageSize: 10 },
    showFilter: false,
    filterMode: 'normal' as const,
    enableRowSelection: false,
    viewTableSetting: false as const,
  };

  describe('rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(<View<User> {...defaultProps} />);

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with empty dataSource', () => {
      const emptyDataSource = pagedList<User>({
        list: [],
        total: 0,
      });

      const { container } = render(
        <View<User> {...defaultProps} dataSource={emptyDataSource} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('filterMode', () => {
    it('should render with filterMode none', () => {
      const { container } = render(
        <View<User> {...defaultProps} filterMode="none" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with filterMode normal', () => {
      const { container } = render(
        <View<User> {...defaultProps} filterMode="normal" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with filterMode editable', () => {
      const { container } = render(
        <View<User> {...defaultProps} filterMode="editable" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('showFilter', () => {
    it('should render with showFilter true', () => {
      const { container } = render(
        <View<User> {...defaultProps} showFilter={true} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should render with showFilter false', () => {
      const { container } = render(
        <View<User> {...defaultProps} showFilter={false} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should accept pagination false', () => {
      const { container } = render(
        <View<User> {...defaultProps} pagination={false} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept pagination object', () => {
      const { container } = render(
        <View<User>
          {...defaultProps}
          pagination={{ defaultPageSize: 20, pageSizeOptions: [10, 20, 50] }}
        />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('enableRowSelection', () => {
    it('should accept enableRowSelection true', () => {
      const { container } = render(
        <View<User> {...defaultProps} enableRowSelection={true} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept enableRowSelection false', () => {
      const { container } = render(
        <View<User> {...defaultProps} enableRowSelection={false} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('tableSize', () => {
    it('should accept defaultTableSize small', () => {
      const { container } = render(
        <View<User> {...defaultProps} defaultTableSize="small" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept defaultTableSize middle', () => {
      const { container } = render(
        <View<User> {...defaultProps} defaultTableSize="middle" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });

    it('should accept defaultTableSize large', () => {
      const { container } = render(
        <View<User> {...defaultProps} defaultTableSize="large" />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('onChange callback', () => {
    it('should accept onChange prop', () => {
      const onChange = vi.fn();

      const { container } = render(
        <View<User> {...defaultProps} onChange={onChange} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('onSelectedDataChange callback', () => {
    it('should accept onSelectedDataChange prop', () => {
      const onSelectedDataChange = vi.fn();

      const { container } = render(
        <View<User> {...defaultProps} onSelectedDataChange={onSelectedDataChange} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('onClickPrimaryKey callback', () => {
    it('should accept onClickPrimaryKey prop', () => {
      const onClickPrimaryKey = vi.fn();

      const { container } = render(
        <View<User> {...defaultProps} onClickPrimaryKey={onClickPrimaryKey} />,
      );

      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('ref', () => {
    it('should expose updateTableSize method via ref', () => {
      const ref = { current: null as any };

      render(<View<User> ref={ref} {...defaultProps} />);

      expect(ref.current).toHaveProperty('updateTableSize');
    });

    it('should expose reset method via ref', () => {
      const ref = { current: null as any };

      render(<View<User> ref={ref} {...defaultProps} />);

      expect(ref.current).toHaveProperty('reset');
    });

    it('should expose clearSelectedRowKeys method via ref', () => {
      const ref = { current: null as any };

      render(<View<User> ref={ref} {...defaultProps} />);

      expect(ref.current).toHaveProperty('clearSelectedRowKeys');
    });
  });
});
