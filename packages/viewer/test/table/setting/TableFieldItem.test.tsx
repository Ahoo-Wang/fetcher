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
import { TableFieldItem, FieldDefinition } from '../../../src';

describe('TableFieldItem', () => {
  const defaultFieldDefinition: FieldDefinition = {
    name: 'name',
    label: 'Name',
    type: 'text',
    primaryKey: false,
  };

  describe('rendering', () => {
    it('should render field label', () => {
      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={false}
          hidden={false}
          onVisibleChange={vi.fn()}
        />,
      );

      expect(screen.getByText('Name')).toBeInTheDocument();
    });

    it('should render drag icon', () => {
      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={false}
          hidden={false}
          onVisibleChange={vi.fn()}
        />,
      );

      expect(screen.getByRole('img')).toBeInTheDocument();
    });
  });

  describe('checkbox state', () => {
    it('should render unchecked checkbox when hidden is true', () => {
      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={false}
          hidden={true}
          onVisibleChange={vi.fn()}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });

    it('should render checked checkbox when hidden is false', () => {
      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={false}
          hidden={false}
          onVisibleChange={vi.fn()}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should be disabled when column is primary key', () => {
      const primaryKeyField: FieldDefinition = {
        ...defaultFieldDefinition,
        primaryKey: true,
      };

      render(
        <TableFieldItem
          columnDefinition={primaryKeyField}
          fixed={false}
          hidden={false}
          onVisibleChange={vi.fn()}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeDisabled();
    });

    it('should not be disabled when column is not primary key', () => {
      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={false}
          hidden={false}
          onVisibleChange={vi.fn()}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeDisabled();
    });
  });

  describe('onVisibleChange callback', () => {
    it('should call onVisibleChange with true when checkbox is unchecked', () => {
      const onVisibleChange = vi.fn();

      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={false}
          hidden={false}
          onVisibleChange={onVisibleChange}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onVisibleChange).toHaveBeenCalledWith(true);
    });

    it('should call onVisibleChange with false when checkbox is checked', () => {
      const onVisibleChange = vi.fn();

      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={false}
          hidden={true}
          onVisibleChange={onVisibleChange}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onVisibleChange).toHaveBeenCalledWith(false);
    });

    it('should not call onVisibleChange when checkbox is disabled', () => {
      const onVisibleChange = vi.fn();

      const primaryKeyField: FieldDefinition = {
        ...defaultFieldDefinition,
        primaryKey: true,
      };

      render(
        <TableFieldItem
          columnDefinition={primaryKeyField}
          fixed={false}
          hidden={false}
          onVisibleChange={onVisibleChange}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      fireEvent.click(checkbox);

      expect(onVisibleChange).not.toHaveBeenCalled();
    });
  });

  describe('fixed prop', () => {
    it('should render correctly when fixed is true', () => {
      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={true}
          hidden={false}
          onVisibleChange={vi.fn()}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).toBeChecked();
    });

    it('should render correctly when fixed is false', () => {
      render(
        <TableFieldItem
          columnDefinition={defaultFieldDefinition}
          fixed={false}
          hidden={true}
          onVisibleChange={vi.fn()}
        />,
      );

      const checkbox = screen.getByRole('checkbox');
      expect(checkbox).not.toBeChecked();
    });
  });
});
