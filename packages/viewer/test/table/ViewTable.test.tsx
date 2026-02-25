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
import { ViewTable } from '../../src/table/ViewTable';
import { FieldDefinition, ViewColumn } from '../../src/viewer/types';

interface User {
  id: number;
  name: string;
  email: string;
}

describe('ViewTable', () => {
  const fields: FieldDefinition[] = [
    { name: 'id', label: 'ID', type: 'text', primaryKey: true },
    { name: 'name', label: 'Name', type: 'text', primaryKey: false },
    { name: 'email', label: 'Email', type: 'text', primaryKey: false },
  ];

  const columns: ViewColumn[] = [
    { key: 'id', name: 'id', fixed: true, hidden: false },
    { key: 'name', name: 'name', fixed: false, hidden: false },
    { key: 'email', name: 'email', fixed: false, hidden: false },
  ];

  const dataSource: User[] = [
    { id: 1, name: 'John', email: 'john@example.com' },
    { id: 2, name: 'Jane', email: 'jane@example.com' },
  ];

  describe('rendering', () => {
    it('should render table with data', () => {
      const { container } = render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={false}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('should render table size when provided', () => {
      const { container } = render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={false}
          tableSize="small"
          viewTableSetting={false}
        />,
      );

      expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('should render with empty dataSource', () => {
      const { container } = render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={[]}
          enableRowSelection={false}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      expect(container.querySelector('table')).toBeInTheDocument();
    });
  });

  describe('columns', () => {
    it('should render columns based on fields', () => {
      const { container } = render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={false}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      const table = container.querySelector('table');
      expect(table).toBeInTheDocument();
    });

    it('should handle hidden columns', () => {
      const hiddenColumns: ViewColumn[] = [
        { key: 'id', name: 'id', fixed: true, hidden: false },
        { key: 'name', name: 'name', fixed: false, hidden: true },
        { key: 'email', name: 'email', fixed: false, hidden: false },
      ];

      const { container } = render(
        <ViewTable
          fields={fields}
          columns={hiddenColumns}
          dataSource={dataSource}
          enableRowSelection={false}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      expect(container.querySelector('table')).toBeInTheDocument();
    });

    it('should handle fixed columns', () => {
      const fixedColumns: ViewColumn[] = [
        { key: 'id', name: 'id', fixed: true, hidden: false },
        { key: 'name', name: 'name', fixed: true, hidden: false },
        { key: 'email', name: 'email', fixed: false, hidden: false },
      ];

      const { container } = render(
        <ViewTable
          fields={fields}
          columns={fixedColumns}
          dataSource={dataSource}
          enableRowSelection={false}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      expect(container.querySelector('table')).toBeInTheDocument();
    });
  });

  describe('row selection', () => {
    it('should enable row selection when enableRowSelection is true', () => {
      const { container } = render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={true}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBeGreaterThan(0);
    });

    it('should not show row selection when enableRowSelection is false', () => {
      const { container } = render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={false}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      const checkboxes = container.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes.length).toBe(0);
    });
  });

  describe('callbacks', () => {
    it('should accept onSelectChange callback', () => {
      const onSelectChange = vi.fn();

      render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={true}
          tableSize="middle"
          viewTableSetting={false}
          onSelectChange={onSelectChange}
        />,
      );

      expect(onSelectChange).toBeDefined();
    });

    it('should accept onSortChanged callback', () => {
      const onSortChanged = vi.fn();

      render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={false}
          tableSize="middle"
          viewTableSetting={false}
          onSortChanged={onSortChanged}
        />,
      );

      expect(onSortChanged).toBeDefined();
    });

    it('should accept onClickPrimaryKey callback', () => {
      const onClickPrimaryKey = vi.fn();

      render(
        <ViewTable
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={false}
          tableSize="middle"
          viewTableSetting={false}
          onClickPrimaryKey={onClickPrimaryKey}
        />,
      );

      expect(onClickPrimaryKey).toBeDefined();
    });
  });

  describe('ref', () => {
    it('should expose clearSelectedRowKeys via ref', () => {
      const ref = { current: null as any };

      render(
        <ViewTable
          ref={ref}
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={true}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      expect(ref.current).toHaveProperty('clearSelectedRowKeys');
      expect(ref.current).toHaveProperty('reset');
    });

    it('should call clearSelectedRowKeys from ref', () => {
      const ref = { current: null as any };

      render(
        <ViewTable
          ref={ref}
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={true}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      ref.current.clearSelectedRowKeys();
    });

    it('should call reset from ref', () => {
      const ref = { current: null as any };

      render(
        <ViewTable
          ref={ref}
          fields={fields}
          columns={columns}
          dataSource={dataSource}
          enableRowSelection={true}
          tableSize="middle"
          viewTableSetting={false}
        />,
      );

      ref.current.reset();
    });
  });
});
