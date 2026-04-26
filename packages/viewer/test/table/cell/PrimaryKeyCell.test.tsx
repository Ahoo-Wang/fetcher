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

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PrimaryKeyCell } from '../../../src';

describe('PrimaryKeyCell', () => {
  it('应渲染主键值', () => {
    render(
      <PrimaryKeyCell
        data={{ value: '12345', record: { id: '12345' }, index: 0 }}
        attributes={{}}
      />
    );
    expect(screen.getByText('12345')).toBeInTheDocument();
  });

  it('onClick 回调应接收完整 record', async () => {
    const mockRecord = { id: '1', name: 'Test' };
    const onClick = vi.fn();
    const { container } = render(
      <PrimaryKeyCell
        data={{ value: '1', record: mockRecord, index: 0 }}
        attributes={{ onClick }}
      />
    );
    fireEvent.click(container.querySelector('a')!);
    expect(onClick).toHaveBeenCalledWith(mockRecord);
  });
});
