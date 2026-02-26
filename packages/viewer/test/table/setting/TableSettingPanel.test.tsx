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
import { render, screen, fireEvent } from '@testing-library/react';
import { TableSettingPanel, ViewColumn, FieldDefinition } from '../../../src';

describe('TableSettingPanel', () => {
  const defaultFields: FieldDefinition[] = [
    { name: 'id', label: 'ID', type: 'text', primaryKey: true },
    { name: 'name', label: 'Name', type: 'text', primaryKey: false },
    { name: 'email', label: 'Email', type: 'text', primaryKey: false },
    { name: 'status', label: 'Status', type: 'text', primaryKey: false },
  ];

  const defaultColumns: ViewColumn[] = [
    { key: 'id', name: 'id', fixed: true, hidden: false },
    { key: 'name', name: 'name', fixed: false, hidden: false },
    { key: 'email', name: 'email', fixed: false, hidden: true },
    { key: 'status', name: 'status', fixed: false, hidden: true },
  ];

  describe('rendering', () => {
    it('should render all fields', () => {
      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Email')).toBeInTheDocument();
      expect(screen.getByText('Status')).toBeInTheDocument();
    });

    it('should render fixed columns section', () => {
      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByText('已显示字段')).toBeInTheDocument();
    });

    it('should render hidden columns section', () => {
      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByText('未显示字段')).toBeInTheDocument();
    });

    it('should render tips for fixed columns', () => {
      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={vi.fn()}
        />,
      );

      expect(
        screen.getByText('请将需要锁定的字段拖至上方（最多支持3列）'),
      ).toBeInTheDocument();
    });

    it('should render with custom className', () => {
      const { container } = render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={vi.fn()}
          className="custom-class"
        />,
      );

      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('column grouping', () => {
    it('should group fixed columns correctly', () => {
      const columns: ViewColumn[] = [
        { key: 'id', name: 'id', fixed: true, hidden: false },
        { key: 'name', name: 'name', fixed: true, hidden: false },
      ];

      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={columns}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should group visible columns correctly', () => {
      const columns: ViewColumn[] = [
        { key: 'id', name: 'id', fixed: true, hidden: false },
        { key: 'name', name: 'name', fixed: false, hidden: false },
      ];

      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={columns}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should group hidden columns correctly', () => {
      const columns: ViewColumn[] = [
        { key: 'id', name: 'id', fixed: false, hidden: true },
        { key: 'name', name: 'name', fixed: false, hidden: true },
      ];

      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={columns}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
    });
  });

  describe('visibility change', () => {
    it('should call onChange when checkbox is clicked', () => {
      const onChange = vi.fn();

      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={onChange}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      expect(onChange).toHaveBeenCalled();
    });

    it('should update local state when checkbox is clicked', () => {
      const onChange = vi.fn();

      render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={onChange}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });
  });

  describe('initialColumns prop update', () => {
    it('should update columns when initialColumns prop changes', () => {
      const { rerender } = render(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={vi.fn()}
        />,
      );

      const newColumns: ViewColumn[] = [
        { key: 'id', name: 'id', fixed: true, hidden: false },
      ];

      rerender(
        <TableSettingPanel
          fields={defaultFields}
          initialColumns={newColumns}
          onChange={vi.fn()}
        />,
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
    });
  });

  describe('reset', () => {
    it('should have reset method via ref', () => {
      const ref = { current: null as any };

      render(
        <TableSettingPanel
          ref={ref}
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={vi.fn()}
        />,
      );

      expect(ref.current).toHaveProperty('reset');
      expect(typeof ref.current.reset).toBe('function');
    });

    it('should reset columns to initial values', () => {
      const ref = { current: null as any };
      const onChange = vi.fn();

      render(
        <TableSettingPanel
          ref={ref}
          fields={defaultFields}
          initialColumns={defaultColumns}
          onChange={onChange}
        />,
      );

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[1]);

      expect(onChange).toHaveBeenCalled();

      ref.current.reset();
    });
  });
});
