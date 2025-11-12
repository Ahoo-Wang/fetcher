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

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CurrencyCell, CURRENCY_CELL_TYPE } from '../../../src';

describe('CurrencyCell', () => {
  it('should render formatted currency with default options', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥1,234.56')).toBeInTheDocument();
  });

  it('should render zero value', () => {
    const props = {
      data: {
        value: 0,
        record: { id: 1, amount: 0 },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥0.00')).toBeInTheDocument();
  });

  it('should render negative values', () => {
    const props = {
      data: {
        value: -1234.56,
        record: { id: 1, amount: -1234.56 },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('-¥1,234.56')).toBeInTheDocument();
  });

  it('should render with USD currency', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: { format: { currency: 'USD', locale: 'en-US' } },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('$1,234.56')).toBeInTheDocument();
  });

  it('should render with EUR currency', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: { format: { currency: 'EUR', locale: 'de-DE' } },
    };

    render(<CurrencyCell {...props} />);
    const element = screen.getByText(
      (content, element) =>
        content.includes('1.234,56') && content.includes('€'),
    );
    expect(element).toBeInTheDocument();
  });

  it('should render with custom decimal places', () => {
    const props = {
      data: {
        value: 1234.56789,
        record: { id: 1, amount: 1234.56789 },
        index: 0,
      },
      attributes: { format: { decimals: 3 } },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥1,234.568')).toBeInTheDocument();
  });

  it('should render without grouping separators', () => {
    const props = {
      data: {
        value: 1234567.89,
        record: { id: 1, amount: 1234567.89 },
        index: 0,
      },
      attributes: { format: { useGrouping: false } },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥1234567.89')).toBeInTheDocument();
  });

  it('should render with currency code display', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: {
        format: {
          currency: 'USD',
          currencyDisplay: 'code' as const,
          locale: 'en-US',
        },
      },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText(/USD.*1,234\.56/)).toBeInTheDocument();
  });

  it('should render with currency name display', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: {
        format: {
          currency: 'USD',
          currencyDisplay: 'name' as const,
          locale: 'en-US',
        },
      },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('1,234.56 US dollars')).toBeInTheDocument();
  });

  it('should render with EUR currency', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: { format: { currency: 'EUR', locale: 'de-DE' } },
    };

    render(<CurrencyCell {...props} />);
    const element = screen.getByText(
      (content, element) =>
        content.includes('1.234,56') && content.includes('€'),
    );
    expect(element).toBeInTheDocument();
  });

  it('should render with custom decimal places', () => {
    const props = {
      data: {
        value: 1234.56789,
        record: { id: 1, amount: 1234.56789 },
        index: 0,
      },
      attributes: { format: { decimals: 3 } },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥1,234.568')).toBeInTheDocument();
  });

  it('should render without grouping separators', () => {
    const props = {
      data: {
        value: 1234567.89,
        record: { id: 1, amount: 1234567.89 },
        index: 0,
      },
      attributes: { format: { useGrouping: false } },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥1234567.89')).toBeInTheDocument();
  });

  it('should render with currency code display', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: {
        format: {
          currency: 'USD',
          currencyDisplay: 'code' as const,
          locale: 'en-US',
        },
      },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText(/USD.*1,234\.56/)).toBeInTheDocument();
  });

  it('should render with currency name display', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: {
        format: {
          currency: 'USD',
          currencyDisplay: 'name' as const,
          locale: 'en-US',
        },
      },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('1,234.56 US dollars')).toBeInTheDocument();
  });

  it('should handle string values', () => {
    const props = {
      data: {
        value: '1234.56',
        record: { id: 1, amount: '1234.56' },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥1,234.56')).toBeInTheDocument();
  });

  it('should handle string values with currency symbols', () => {
    const props = {
      data: {
        value: '$1234.56',
        record: { id: 1, amount: '$1234.56' },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥1,234.56')).toBeInTheDocument();
  });

  it('should handle invalid values gracefully', () => {
    const props = {
      data: {
        value: NaN,
        record: { id: 1, amount: NaN },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should handle null values', () => {
    const props = {
      data: {
        value: null as any,
        record: { id: 1, amount: null },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should handle undefined values', () => {
    const props = {
      data: {
        value: undefined as any,
        record: { id: 1, amount: undefined },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('-')).toBeInTheDocument();
  });

  it('should apply text styling attributes', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: {
        style: { color: 'red', fontSize: '14px' },
        className: 'custom-currency',
      },
    };

    render(<CurrencyCell {...props} />);
    const textElement = screen.getByText('¥1,234.56');
    expect(textElement).toHaveClass('custom-currency');
    expect(textElement).toHaveStyle({
      color: 'rgb(255, 0, 0)',
      fontSize: '14px',
    });
  });

  it('should apply ellipsis attribute', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: { ellipsis: true },
    };

    render(<CurrencyCell {...props} />);
    const textElement = screen.getByText('¥1,234.56');
    expect(textElement).toHaveClass('ant-typography-ellipsis');
  });

  it('should handle large numbers', () => {
    const props = {
      data: {
        value: 999999999999.99,
        record: { id: 1, amount: 999999999999.99 },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥999,999,999,999.99')).toBeInTheDocument();
  });

  it('should handle very small numbers', () => {
    const props = {
      data: {
        value: 0.01,
        record: { id: 1, amount: 0.01 },
        index: 0,
      },
      attributes: {},
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('¥0.01')).toBeInTheDocument();
  });

  it('should combine currency formatting with text attributes', () => {
    const props = {
      data: {
        value: 1234.56,
        record: { id: 1, amount: 1234.56 },
        index: 0,
      },
      attributes: {
        format: {
          currency: 'EUR',
          locale: 'de-DE',
          decimals: 3,
          useGrouping: false,
        },
        ellipsis: true,
        style: { fontWeight: 'bold' },
        className: 'currency-cell',
      },
    };

    render(<CurrencyCell {...props} />);
    const textElement = screen.getByText(/1234.*€/);
    expect(textElement).toHaveClass('ant-typography-ellipsis');
    expect(textElement).toHaveClass('currency-cell');
    expect(textElement).toHaveStyle({ fontWeight: 'bold' });
  });

  it('should handle different record types', () => {
    interface Product {
      id: string;
      name: string;
      price: number;
    }

    const props: typeof CurrencyCell extends (props: infer P) => any
      ? P
      : never = {
      data: {
        value: 99.99,
        record: { id: 'prod-123', name: 'Widget', price: 99.99 } as Product,
        index: 2,
      },
      attributes: { format: { currency: 'USD', locale: 'en-US' } },
    };

    render(<CurrencyCell {...props} />);
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });

  it('should export CURRENCY_CELL_TYPE constant', () => {
    expect(CURRENCY_CELL_TYPE).toBe('currency');
  });
});
