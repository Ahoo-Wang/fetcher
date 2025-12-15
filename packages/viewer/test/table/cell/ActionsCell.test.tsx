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
import { ActionsCell, ActionsCellProps, ActionsData } from '../../../src';

describe('ActionsCell', () => {
  const mockClickHandler = vi.fn();

  const testRecord = { id: 1, name: 'Test Item' };

  const defaultActionsData: ActionsData = {
    primaryAction: {
      data: {
        value: 'Edit',
        record: testRecord,
        index: 0,
      },
      attributes: {
        onClick: mockClickHandler,
      },
    },
    secondaryActions: [
      {
        data: {
          value: 'Delete',
          record: testRecord,
          index: 0,
        },
        attributes: {
          onClick: mockClickHandler,
        },
      },
      {
        data: {
          value: 'Duplicate',
          record: testRecord,
          index: 0,
        },
        attributes: {
          onClick: mockClickHandler,
        },
      },
    ],
  };

  const defaultProps: ActionsCellProps = {
    data: {
      value: defaultActionsData,
      record: testRecord,
      index: 0,
    },
    attributes: {
      onClick: mockClickHandler,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders primary action button when only primary action is provided', () => {
    const propsWithOnlyPrimary: ActionsCellProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        value: {
          ...defaultActionsData,
          secondaryActions: [],
        },
      },
    };

    render(<ActionsCell {...propsWithOnlyPrimary} />);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.queryByText('More')).toBeNull();
  });

  it('renders primary action and dropdown when secondary actions are provided', () => {
    render(<ActionsCell {...defaultProps} />);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.getByText('More')).toBeTruthy();
  });

  it('renders custom more action title when provided', () => {
    const propsWithCustomTitle: ActionsCellProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        value: {
          ...defaultActionsData,
          moreActionTitle: 'Actions',
        },
      },
    };

    render(<ActionsCell {...propsWithCustomTitle} />);
    expect(screen.getByText('Actions')).toBeTruthy();
  });

  it('renders default "More" title when no custom title is provided', () => {
    render(<ActionsCell {...defaultProps} />);
    expect(screen.getByText('More')).toBeTruthy();
  });

  it('calls click handler with correct parameters when primary action is clicked', () => {
    render(<ActionsCell {...defaultProps} />);
    const primaryButton = screen.getByRole('button', { name: 'Edit' });
    fireEvent.click(primaryButton);

    expect(mockClickHandler).toHaveBeenCalledWith(testRecord);
    expect(mockClickHandler).toHaveBeenCalledTimes(1);
  });

  it('renders dropdown trigger when secondary actions are present', () => {
    render(<ActionsCell {...defaultProps} />);
    expect(screen.getByText('More')).toBeTruthy();
  });

  it('renders dropdown trigger for multiple secondary actions', () => {
    render(<ActionsCell {...defaultProps} />);
    expect(screen.getByText('More')).toBeTruthy();
  });

  it('renders dropdown trigger for single secondary action', () => {
    const propsWithSingleSecondary: ActionsCellProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        value: {
          primaryAction: {
            data: {
              value: 'Edit',
              record: testRecord,
              index: 0,
            },
            attributes: {
              onClick: mockClickHandler,
            },
          },
          secondaryActions: [
            {
              data: {
                value: 'Delete',
                record: testRecord,
                index: 0,
              },
              attributes: {
                onClick: mockClickHandler,
              },
            },
          ],
        },
      },
    };

    render(<ActionsCell {...propsWithSingleSecondary} />);
    expect(screen.getByText('More')).toBeTruthy();
  });

  it('passes record data correctly to click handler for primary action', () => {
    const complexRecord = {
      id: 42,
      name: 'Complex Item',
      nested: { prop: 'value' },
      array: [1, 2, 3],
    };

    const propsWithComplexRecord: ActionsCellProps<typeof complexRecord> = {
      data: {
        value: {
          primaryAction: {
            data: {
              value: 'View',
              record: complexRecord,
              index: 5,
            },
            attributes: {
              onClick: mockClickHandler,
            },
          },
          secondaryActions: [],
        },
        record: complexRecord,
        index: 5,
      },
      attributes: {
        onClick: mockClickHandler,
      },
    };

    render(<ActionsCell {...propsWithComplexRecord} />);

    // Test primary action
    const primaryButton = screen.getByRole('button', { name: 'View' });
    fireEvent.click(primaryButton);
    expect(mockClickHandler).toHaveBeenCalledWith(complexRecord);
  });

  it('handles empty secondary actions array gracefully', () => {
    const propsWithEmptySecondary: ActionsCellProps = {
      ...defaultProps,
      data: {
        ...defaultProps.data,
        value: {
          primaryAction: {
            data: {
              value: 'Edit',
              record: testRecord,
              index: 0,
            },
            attributes: {
              onClick: mockClickHandler,
            },
          },
          secondaryActions: [],
        },
      },
    };

    render(<ActionsCell {...propsWithEmptySecondary} />);
    expect(screen.getByRole('button', { name: 'Edit' })).toBeTruthy();
    expect(screen.queryByText('More')).toBeNull();
  });
});
