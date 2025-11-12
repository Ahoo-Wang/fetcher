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
import {
  formatCurrency,
  DEFAULT_CURRENCY_FORMAT_OPTIONS,
  type CurrencyFormatOptions,
} from '../../../src';

describe('currencyFormatter', () => {
  describe('DEFAULT_CURRENCY_FORMAT_OPTIONS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_CURRENCY_FORMAT_OPTIONS).toEqual({
        currency: 'CNY',
        currencyDisplay: 'symbol',
        decimals: 2,
        locale: 'zh-CN',
        useGrouping: true,
        fallback: '-',
      });
    });
  });

  describe('formatCurrency - basic functionality', () => {
    it('should format positive numbers with default options', () => {
      const result = formatCurrency(1234.56);
      expect(result).toBe('¥1,234.56');
    });

    it('should format zero', () => {
      const result = formatCurrency(0);
      expect(result).toBe('¥0.00');
    });

    it('should format negative numbers', () => {
      const result = formatCurrency(-1234.56);
      expect(result).toBe('-¥1,234.56');
    });

    it('should format decimal numbers correctly', () => {
      const result = formatCurrency(123.456);
      expect(result).toBe('¥123.46'); // Rounded to 2 decimals
    });

    it('should format large numbers', () => {
      const result = formatCurrency(1234567.89);
      expect(result).toBe('¥1,234,567.89');
    });

    it('should format small decimal numbers', () => {
      const result = formatCurrency(0.01);
      expect(result).toBe('¥0.01');
    });
  });

  describe('formatCurrency - different currencies', () => {
    it('should format with USD currency', () => {
      const result = formatCurrency(1234.56, {
        currency: 'USD',
        locale: 'en-US',
      });
      expect(result).toBe('$1,234.56');
    });

    it('should format with EUR currency', () => {
      const result = formatCurrency(1234.56, {
        currency: 'EUR',
        locale: 'de-DE',
      });
      expect(result).toBe('1.234,56\u00A0€'); // Non-breaking space
    });

    it('should format with JPY currency', () => {
      const result = formatCurrency(1234, { currency: 'JPY', locale: 'ja-JP' });
      expect(result).toBe('￥1,234.00'); // JPY always shows decimals
    });

    it('should format with GBP currency', () => {
      const result = formatCurrency(1234.56, {
        currency: 'GBP',
        locale: 'en-GB',
      });
      expect(result).toBe('£1,234.56');
    });
  });

  describe('formatCurrency - different locales', () => {
    it('should format with en-US locale', () => {
      const result = formatCurrency(1234.56, { locale: 'en-US' });
      expect(result).toBe('CN¥1,234.56'); // en-US shows CNY with CN prefix
    });

    it('should format with zh-CN locale', () => {
      const result = formatCurrency(1234.56, { locale: 'zh-CN' });
      expect(result).toBe('¥1,234.56');
    });

    it('should format with de-DE locale', () => {
      const result = formatCurrency(1234.56, {
        currency: 'EUR',
        locale: 'de-DE',
      });
      expect(result).toBe('1.234,56\u00A0€'); // Non-breaking space
    });

    it('should format with ja-JP locale', () => {
      const result = formatCurrency(1234, { currency: 'JPY', locale: 'ja-JP' });
      expect(result).toBe('￥1,234.00'); // JPY always shows decimals
    });
  });

  describe('formatCurrency - decimal places', () => {
    it('should format with 0 decimals', () => {
      const result = formatCurrency(1234.56, { decimals: 0 });
      expect(result).toBe('¥1,235'); // Rounded
    });

    it('should format with 2 decimals (default)', () => {
      const result = formatCurrency(1234.567, { decimals: 2 });
      expect(result).toBe('¥1,234.57');
    });

    it('should format with 3 decimals', () => {
      const result = formatCurrency(1234.5678, { decimals: 3 });
      expect(result).toBe('¥1,234.568');
    });

    it('should format with 4 decimals', () => {
      const result = formatCurrency(1234.56789, { decimals: 4 });
      expect(result).toBe('¥1,234.5679');
    });

    it('should pad with zeros when needed', () => {
      const result = formatCurrency(1234, { decimals: 3 });
      expect(result).toBe('¥1,234.000');
    });
  });

  describe('formatCurrency - grouping', () => {
    it('should format with grouping enabled (default)', () => {
      const result = formatCurrency(1234567.89, { useGrouping: true });
      expect(result).toBe('¥1,234,567.89');
    });

    it('should format with grouping disabled', () => {
      const result = formatCurrency(1234567.89, { useGrouping: false });
      expect(result).toBe('¥1234567.89');
    });

    it('should handle small numbers without grouping', () => {
      const result = formatCurrency(123.45, { useGrouping: false });
      expect(result).toBe('¥123.45');
    });
  });

  describe('formatCurrency - currency display', () => {
    it('should format with symbol display', () => {
      const result = formatCurrency(1234.56, { currencyDisplay: 'symbol' });
      expect(result).toBe('¥1,234.56');
    });

    it('should format with code display', () => {
      const result = formatCurrency(1234.56, {
        currency: 'USD',
        currencyDisplay: 'code',
        locale: 'en-US',
      });
      expect(result).toBe('USD\u00A01,234.56'); // Non-breaking space
    });

    it('should format with name display', () => {
      const result = formatCurrency(1234.56, {
        currency: 'USD',
        currencyDisplay: 'name',
        locale: 'en-US',
      });
      expect(result).toBe('1,234.56 US dollars');
    });

    it('should format with narrowSymbol display', () => {
      const result = formatCurrency(1234.56, {
        currency: 'USD',
        currencyDisplay: 'narrowSymbol',
        locale: 'en-US',
      });
      expect(result).toBe('$1,234.56');
    });
  });

  describe('formatCurrency - string inputs', () => {
    it('should parse and format string numbers', () => {
      const result = formatCurrency('1234.56');
      expect(result).toBe('¥1,234.56');
    });

    it('should parse strings with currency symbols', () => {
      const result = formatCurrency('$1234.56');
      expect(result).toBe('¥1,234.56');
    });

    it('should parse strings with commas', () => {
      const result = formatCurrency('1,234.56');
      expect(result).toBe('¥1,234.56');
    });

    it('should parse strings with multiple commas', () => {
      const result = formatCurrency('1,234,567.89');
      expect(result).toBe('¥1,234,567.89');
    });

    it('should parse strings with spaces', () => {
      const result = formatCurrency(' 1234.56 ');
      expect(result).toBe('¥1,234.56');
    });

    it('should parse negative string numbers', () => {
      const result = formatCurrency('-1234.56');
      expect(result).toBe('-¥1,234.56');
    });

    it('should handle strings with mixed valid/invalid characters', () => {
      const result = formatCurrency('USD 1,234.56');
      expect(result).toBe('¥1,234.56'); // Keeps the comma for grouping
    });
  });

  describe('formatCurrency - invalid inputs', () => {
    it('should return fallback for null input', () => {
      const result = formatCurrency(null as any);
      expect(result).toBe('-');
    });

    it('should return fallback for undefined input', () => {
      const result = formatCurrency(undefined as any);
      expect(result).toBe('-');
    });

    it('should return fallback for NaN input', () => {
      const result = formatCurrency(NaN);
      expect(result).toBe('-');
    });

    it('should return fallback for positive Infinity', () => {
      const result = formatCurrency(Infinity);
      expect(result).toBe('-');
    });

    it('should return fallback for negative Infinity', () => {
      const result = formatCurrency(-Infinity);
      expect(result).toBe('-');
    });

    it('should return fallback for invalid string', () => {
      const result = formatCurrency('not-a-number');
      expect(result).toBe('-');
    });

    it('should return fallback for empty string', () => {
      const result = formatCurrency('');
      expect(result).toBe('-');
    });

    it('should return fallback for string with only non-numeric characters', () => {
      const result = formatCurrency('abc!@#');
      expect(result).toBe('-');
    });
  });

  describe('formatCurrency - fallback behavior', () => {
    it('should use custom fallback for invalid inputs', () => {
      const result = formatCurrency(NaN, { fallback: 'N/A' });
      expect(result).toBe('N/A');
    });

    it('should use custom fallback for null', () => {
      const result = formatCurrency(null as any, { fallback: 'Invalid' });
      expect(result).toBe('Invalid');
    });

    it('should use custom fallback for invalid string', () => {
      const result = formatCurrency('invalid', { fallback: 'Error' });
      expect(result).toBe('Error');
    });

    it('should use empty string as fallback', () => {
      const result = formatCurrency(NaN, { fallback: '' });
      expect(result).toBe('');
    });
  });

  describe('formatCurrency - edge case numbers', () => {
    it('should format very large numbers', () => {
      const result = formatCurrency(999999999999.99);
      expect(result).toBe('¥999,999,999,999.99');
    });

    it('should format very small positive numbers', () => {
      const result = formatCurrency(0.0001);
      expect(result).toBe('¥0.00'); // Rounded to 2 decimals
    });

    it('should format very small negative numbers', () => {
      const result = formatCurrency(-0.0001);
      expect(result).toBe('-¥0.00');
    });

    it('should format numbers close to zero', () => {
      const result = formatCurrency(0.0049);
      expect(result).toBe('¥0.00');
    });

    it('should format numbers requiring rounding up', () => {
      const result = formatCurrency(1.005);
      expect(result).toBe('¥1.01');
    });

    it('should format numbers requiring rounding down', () => {
      const result = formatCurrency(1.004);
      expect(result).toBe('¥1.00');
    });
  });

  describe('formatCurrency - invalid options', () => {
    it('should handle invalid currency code gracefully', () => {
      // Intl.NumberFormat throws for invalid currency codes
      expect(() => formatCurrency(1234.56, { currency: 'INVALID' })).toThrow(
        'Invalid currency code',
      );
    });

    it('should handle invalid locale gracefully', () => {
      // Intl.NumberFormat may throw or fallback for invalid locale
      expect(() =>
        formatCurrency(1234.56, { locale: 'invalid-locale' }),
      ).not.toThrow();
    });

    it('should handle negative decimals gracefully', () => {
      // Intl.NumberFormat throws for negative minimumFractionDigits
      expect(() => formatCurrency(1234.56, { decimals: -1 })).toThrow(
        'minimumFractionDigits value is out of range',
      );
    });
  });

  describe('formatCurrency - option combinations', () => {
    it('should handle all options combined', () => {
      const options: CurrencyFormatOptions = {
        currency: 'USD',
        currencyDisplay: 'code',
        decimals: 3,
        locale: 'en-US',
        useGrouping: false,
        fallback: 'ERROR',
      };
      const result = formatCurrency(1234.56789, options);
      expect(result).toBe('USD\u00A01234.568'); // Non-breaking space
    });

    it('should merge partial options with defaults', () => {
      const result = formatCurrency(1234.56, { currency: 'EUR' });
      // Should use EUR but keep other defaults (zh-CN locale, etc.)
      expect(result).toMatch(/€/); // Contains euro symbol
    });

    it('should handle empty options object', () => {
      const result = formatCurrency(1234.56, {});
      expect(result).toBe('¥1,234.56');
    });
  });

  describe('formatCurrency - type safety', () => {
    it('should accept number type', () => {
      const result = formatCurrency(1234.56);
      expect(typeof result).toBe('string');
    });

    it('should accept string type', () => {
      const result = formatCurrency('1234.56');
      expect(typeof result).toBe('string');
    });

    it('should return string type always', () => {
      expect(typeof formatCurrency(1234.56)).toBe('string');
      expect(typeof formatCurrency('1234.56')).toBe('string');
      expect(typeof formatCurrency(null as any)).toBe('string');
      expect(typeof formatCurrency(NaN)).toBe('string');
    });
  });
});
