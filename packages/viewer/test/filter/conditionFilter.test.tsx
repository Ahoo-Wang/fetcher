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
import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { ConditionFilter } from '../../src';
import { conditionFilterRegistry } from '../../src';
import { Operator } from '@ahoo-wang/fetcher-wow';

describe('ConditionFilter', () => {
  const mockField = {
    name: 'testField',
    label: 'Test Field',
    type: 'string' as const,
  };

  const mockRef = React.createRef<any>();

  it('should throw error for unregistered filter type', () => {
    expect(() => {
      render(
        <ConditionFilter
          type="non-existent-type"
          field={mockField}
          operator={Operator.EQ}
          ref={mockRef}
        />,
      );
    }).toThrow('ConditionFilter type non-existent-type not found.');
  });

  it('should render without crashing when filter is registered', () => {
    // Create a simple mock component
    const MockComponent = () => (
      <div data-testid="mock-filter">Mock Filter</div>
    );

    conditionFilterRegistry.register('test-type', MockComponent);

    expect(() => {
      render(
        <ConditionFilter
          type="test-type"
          field={mockField}
          operator={Operator.EQ}
          ref={mockRef}
        />,
      );
    }).not.toThrow();

    // Clean up
    conditionFilterRegistry.unregister('test-type');
  });
});
