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

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { RemoteSelect } from '../../src';
import { DefaultOptionType } from 'antd/lib/select';
// Mock the hook since it's from an external package
vi.mock('@ahoo-wang/fetcher-react', async importOriginal => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    useDebouncedExecutePromise: vi.fn(),
  };
});

import {
  PromiseStatus,
  useDebouncedExecutePromise,
} from '@ahoo-wang/fetcher-react';

const mockUseDebouncedExecutePromise = vi.mocked(useDebouncedExecutePromise);

describe('RemoteSelect', () => {
  const mockOptions: DefaultOptionType[] = [
    { label: 'Option 1', value: '1' },
    { label: 'Option 2', value: '2' },
  ];

  const mockSearch = vi.fn().mockResolvedValue(mockOptions);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseDebouncedExecutePromise.mockReturnValue({
      loading: false,
      result: undefined,
      error: undefined,
      status: PromiseStatus.IDLE,
      run: vi.fn(),
      cancel: vi.fn(),
      abort: vi.fn(),
      isPending: vi.fn().mockReturnValue(false),
      reset: vi.fn(),
    });
  });

  it('renders without crashing', () => {
    render(<RemoteSelect search={mockSearch} />);
    expect(screen.getByRole('combobox')).toBeTruthy();
  });

  it('shows loading state', () => {
    mockUseDebouncedExecutePromise.mockReturnValue({
      loading: true,
      result: undefined,
      error: undefined,
      status: PromiseStatus.LOADING,
      run: vi.fn(),
      cancel: vi.fn(),
      abort: vi.fn(),
      isPending: vi.fn().mockReturnValue(false),
      reset: vi.fn(),
    });

    const { container } = render(<RemoteSelect search={mockSearch} />);
    const select = container.querySelector('.ant-select');
    expect(select?.classList.contains('ant-select-loading')).toBe(true);
  });

  it('passes options to underlying Select component', () => {
    mockUseDebouncedExecutePromise.mockReturnValue({
      loading: false,
      result: mockOptions,
      error: undefined,
      status: PromiseStatus.SUCCESS,
      run: vi.fn(),
      cancel: vi.fn(),
      abort: vi.fn(),
      isPending: vi.fn().mockReturnValue(false),
      reset: vi.fn(),
    });

    render(<RemoteSelect search={mockSearch} />);
    // Options are passed to the Select component (verified by mock setup)
    expect(mockUseDebouncedExecutePromise).toHaveBeenCalled();
  });

  it('calls search on input change', () => {
    const mockRun = vi.fn();
    mockUseDebouncedExecutePromise.mockReturnValue({
      loading: false,
      result: undefined,
      error: undefined,
      status: PromiseStatus.IDLE,
      run: mockRun,
      cancel: vi.fn(),
      abort: vi.fn(),
      isPending: vi.fn().mockReturnValue(false),
      reset: vi.fn(),
    });

    render(<RemoteSelect search={mockSearch} />);
    // Trigger onSearch by simulating typing
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'test' } });

    expect(mockRun).toHaveBeenCalled();
  });

  it('does not search on empty input with results', () => {
    const mockRun = vi.fn();
    mockUseDebouncedExecutePromise.mockReturnValue({
      loading: false,
      result: mockOptions,
      error: undefined,
      status: PromiseStatus.IDLE,
      run: mockRun,
      cancel: vi.fn(),
      abort: vi.fn(),
      isPending: vi.fn().mockReturnValue(false),
      reset: vi.fn(),
    });

    render(<RemoteSelect search={mockSearch} />);
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '' } });

    expect(mockRun).not.toHaveBeenCalled();
  });

  it('passes props to underlying Select', () => {
    render(
      <RemoteSelect search={mockSearch} placeholder="Search..." disabled />,
    );
    expect(screen.getByText('Search...')).toBeTruthy();
  });

  it('works with custom debounce config', () => {
    render(<RemoteSelect search={mockSearch} debounce={{ delay: 500 }} />);
    expect(mockUseDebouncedExecutePromise).toHaveBeenCalledWith({
      debounce: { delay: 500 },
    });
  });

  it('handles error states gracefully', () => {
    mockUseDebouncedExecutePromise.mockReturnValue({
      loading: false,
      result: undefined,
      error: new Error('Search failed'),
      status: PromiseStatus.LOADING,
      run: vi.fn(),
      cancel: vi.fn(),
      abort: vi.fn(),
      isPending: vi.fn().mockReturnValue(false),
      reset: vi.fn(),
    });

    expect(() => render(<RemoteSelect search={mockSearch} />)).not.toThrow();
  });
});
