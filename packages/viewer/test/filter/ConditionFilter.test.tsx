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

import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ConditionFilter } from '../../src';
import { conditionFilterRegistry } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

describe('ConditionFilter', () => {
  const mockProps = {
    type: 'test-type',
    field: {
      name: 'testField',
      label: 'Test Field',
      type: 'string',
    },
    label: {
      children: 'Test Label',
    },
    operator: {
      value: Operator.EQ,
      options: [],
    },
    value: {
      value: 'test',
      placeholder: 'Enter value',
    },
  };

  let mockFilter: any;

  beforeEach(() => {
    mockFilter = vi.fn(() => <div data-testid="mock-filter">Mock Filter</div>);
  });

  afterEach(() => {
    // Clean up registry
    conditionFilterRegistry.unregister('test-type');
    conditionFilterRegistry.unregister('registered-type');
    conditionFilterRegistry.unregister('type1');
    conditionFilterRegistry.unregister('type2');
  });

  it('renders registered filter component', () => {
    conditionFilterRegistry.register('test-type', mockFilter);

    render(<ConditionFilter {...mockProps} />);

    expect(screen.getByTestId('mock-filter')).toBeTruthy();
    expect(mockFilter).toHaveBeenCalledWith(mockProps, undefined);
  });

  it('passes through all props to registered component', () => {
    conditionFilterRegistry.register('test-type', mockFilter);

    const propsWithAttributes = {
      ...mockProps,
      attributes: { customProp: 'value' },
    };

    render(<ConditionFilter {...propsWithAttributes} />);

    expect(mockFilter).toHaveBeenCalledWith(propsWithAttributes, undefined);
  });

  it('renders FallbackConditionFilter for unregistered type', () => {
    render(<ConditionFilter {...mockProps} type="unregistered-type" />);

    expect(
      screen.getByText('Unsupported filter type:[unregistered-type]'),
    ).toBeTruthy();
  });

  it('handles different filter types dynamically', () => {
    const mockFilter2 = vi.fn(() => (
      <div data-testid="mock-filter-2">Mock Filter 2</div>
    ));

    conditionFilterRegistry.register('type1', mockFilter);
    conditionFilterRegistry.register('type2', mockFilter2);

    const { rerender } = render(
      <ConditionFilter {...mockProps} type="type1" />,
    );
    expect(screen.getByTestId('mock-filter')).toBeTruthy();

    rerender(<ConditionFilter {...mockProps} type="type2" />);
    expect(screen.getByTestId('mock-filter-2')).toBeTruthy();
  });

  it('maintains displayName for debugging', () => {
    expect(ConditionFilter.displayName).toBe('ConditionFilter');
  });
});
