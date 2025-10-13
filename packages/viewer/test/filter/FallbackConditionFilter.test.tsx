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
import { describe, expect, it } from 'vitest';
import { FallbackConditionFilter } from '../../src';

describe('FallbackConditionFilter', () => {
  it('renders without crashing', () => {
    const { container } = render(<FallbackConditionFilter type="unknown" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('displays the correct warning message', () => {
    render(<FallbackConditionFilter type="custom-type" />);
    expect(
      screen.getByText('Unsupported filter type:[custom-type]'),
    ).toBeTruthy();
  });

  it('renders as an Alert component', () => {
    const { container } = render(<FallbackConditionFilter type="test" />);
    const alert = container.querySelector('.ant-alert');
    expect(alert).toBeTruthy();
  });

  it('uses warning type and shows icon', () => {
    const { container } = render(<FallbackConditionFilter type="test" />);
    const alert = container.querySelector('.ant-alert');
    expect(alert?.classList.contains('ant-alert-warning')).toBe(true);
    expect(alert?.querySelector('.anticon')).toBeTruthy();
  });

  it('handles different type values', () => {
    const { rerender } = render(<FallbackConditionFilter type="type1" />);
    expect(screen.getByText('Unsupported filter type:[type1]')).toBeTruthy();

    rerender(<FallbackConditionFilter type="type2" />);
    expect(screen.getByText('Unsupported filter type:[type2]')).toBeTruthy();
  });
});
