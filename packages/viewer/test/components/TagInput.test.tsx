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
import { TagInput } from '../../src';

describe('TagInput', () => {
  it('renders without crashing', () => {
    const { container } = render(<TagInput />);
    expect(container.firstChild).toBeTruthy();
  });

  it('applies default props correctly', () => {
    const { container } = render(<TagInput />);
    const select = container.querySelector('.ant-select');
    expect(select).toBeTruthy();
    expect(select?.classList.contains('ant-select-multiple')).toBe(true);
  });

  it('accepts custom token separators', () => {
    const customSeparators = ['|'];
    const { container } = render(
      <TagInput tokenSeparators={customSeparators} />,
    );
    expect(container.firstChild).toBeTruthy();
  });

  it('allows clear by default', () => {
    const { container } = render(<TagInput />);
    const select = container.querySelector('.ant-select');
    expect(select?.classList.contains('ant-select-allow-clear')).toBe(true);
  });

  it('passes through other props', () => {
    render(<TagInput placeholder="Enter tags" />);
    expect(screen.getByText('Enter tags')).toBeTruthy();
  });
});
