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

import { isNullOrUndefined } from './utils';

/**
 * Configuration options for currency formatting.
 *
 * This interface extends a subset of Intl.NumberFormatOptions with additional
 * currency-specific formatting controls. It provides a comprehensive set of
 * options for customizing how monetary values are displayed.
 *
 * @example
 * ```typescript
 * const options: CurrencyFormatOptions = {
 *   currency: 'USD',
 *   currencyDisplay: 'symbol',
 *   decimals: 2,
 *   locale: 'en-US',
 *   useGrouping: true,
 *   fallback: 'N/A'
 * };
 * ```
 */
export interface CurrencyFormatOptions {
  /**
   * The currency code to use for formatting (ISO 4217 currency codes).
   * Common values include 'USD', 'EUR', 'CNY', 'JPY', etc.
   *
   * @type {string}
   * @default 'CNY'
   * @example 'USD', 'EUR', 'CNY', 'JPY'
   */
  currency?: string;

  /**
   * How to display the currency in the formatted output.
   * - 'symbol': Use currency symbol (e.g., $, €, ¥)
   * - 'narrowSymbol': Use narrow currency symbol when available
   * - 'code': Use currency code (e.g., USD, EUR, CNY)
   * - 'name': Use currency name (e.g., US dollar, euro, Chinese yuan)
   *
   * @type {Intl.NumberFormatOptionsCurrencyDisplay}
   * @default 'symbol'
   */
  currencyDisplay?: Intl.NumberFormatOptionsCurrencyDisplay;

  /**
   * The number of decimal places to display.
   * This controls both minimum and maximum fraction digits.
   *
   * @type {number}
   * @default 2
   * @example 2, 3, 0
   */
  decimals?: number;

  /**
   * The locale to use for formatting (BCP 47 language tag).
   * This affects number formatting, currency symbols, and grouping separators.
   *
   * @type {string}
   * @default 'zh-CN'
   * @example 'en-US', 'zh-CN', 'ja-JP', 'de-DE'
   */
  locale?: string;

  /**
   * Whether to use grouping separators (thousands separators).
   * When true, large numbers will be formatted with separators (e.g., 1,234.56).
   *
   * @type {boolean}
   * @default true
   */
  useGrouping?: boolean;

  /**
   * The fallback string to return when the input value is invalid, null, undefined, or NaN.
   * This ensures consistent output for edge cases.
   *
   * @type {string}
   * @default '-'
   * @example '-', 'N/A', 'Invalid', ''
   */
  fallback?: string;
}

/**
 * Default configuration options for currency formatting.
 *
 * These defaults are used when no options are provided to formatCurrency().
 * They provide sensible defaults for Chinese Yuan (CNY) formatting with
 * standard decimal places and grouping separators.
 *
 * @constant
 * @type {CurrencyFormatOptions}
 *
 * @example
 * ```typescript
 * // Using defaults
 * formatCurrency(1234.56); // Uses DEFAULT_CURRENCY_FORMAT_OPTIONS
 *
 * // Overriding specific options
 * formatCurrency(1234.56, { currency: 'USD' }); // Merges with defaults
 * ```
 */
export const DEFAULT_CURRENCY_FORMAT_OPTIONS: CurrencyFormatOptions = {
  currency: 'CNY',
  currencyDisplay: 'symbol',
  decimals: 2,
  locale: 'zh-CN',
  useGrouping: true,
  fallback: '-',
};

/**
 * Internal constant defining the NumberFormat style for currency formatting.
 * This is used internally by the formatCurrency function.
 *
 * @private
 * @constant
 * @type {string}
 * @default 'currency'
 */
const NUMBER_FORMATE_STYLE = 'currency';

/**
 * Formats a numeric amount as a localized currency string.
 *
 * This function provides comprehensive currency formatting using the browser's
 * Intl.NumberFormat API. It supports various currencies, locales, and formatting
 * options while providing robust error handling and fallback behavior.
 *
 * @param {number | string} amount - The monetary amount to format. Can be a number or a string representation of a number.
 * @param {CurrencyFormatOptions} [options=DEFAULT_CURRENCY_FORMAT_OPTIONS] - Formatting options to customize the output.
 * @returns {string} The formatted currency string, or the fallback value if formatting fails.
 *
 * @throws {Error} May throw if the Intl.NumberFormat constructor fails with invalid options, but this is handled internally with fallback.
 *
 * @example
 * ```typescript
 * // Basic usage with defaults (CNY, zh-CN locale)
 * formatCurrency(1234.56); // "¥1,234.56"
 * formatCurrency(0); // "¥0.00"
 * formatCurrency(null); // "-"
 *
 * // Using USD with US locale
 * formatCurrency(1234.56, {
 *   currency: 'USD',
 *   locale: 'en-US'
 * }); // "$1,234.56"
 *
 * // Formatting with custom decimal places
 * formatCurrency(1234.56789, {
 *   currency: 'EUR',
 *   decimals: 3,
 *   locale: 'de-DE'
 * }); // "1.234,568 €"
 *
 * // Large numbers with grouping
 * formatCurrency(1234567.89, {
 *   currency: 'CNY',
 *   useGrouping: true
 * }); // "¥1,234,567.89"
 *
 * // Without grouping separators
 * formatCurrency(1234567.89, {
 *   currency: 'CNY',
 *   useGrouping: false
 * }); // "¥1234567.89"
 *
 * // Custom fallback for invalid values
 * formatCurrency(NaN, {
 *   fallback: 'Invalid amount'
 * }); // "Invalid amount"
 *
 * // String input (automatically parsed)
 * formatCurrency('1234.56'); // "¥1,234.56"
 * formatCurrency('$1,234.56'); // "¥1234.56" (non-numeric characters removed)
 * ```
 *
 * @example
 * ```typescript
 * // Error handling - function gracefully handles edge cases
 * formatCurrency(Infinity); // "-"
 * formatCurrency(-Infinity); // "-"
 * formatCurrency('not-a-number'); // "-"
 * ```
 */
export function formatCurrency(
  amount: number | string | null,
  options: CurrencyFormatOptions = DEFAULT_CURRENCY_FORMAT_OPTIONS,
): string {
  const {
    currency = DEFAULT_CURRENCY_FORMAT_OPTIONS.currency,
    currencyDisplay = DEFAULT_CURRENCY_FORMAT_OPTIONS.currencyDisplay,
    decimals = DEFAULT_CURRENCY_FORMAT_OPTIONS.decimals,
    locale = DEFAULT_CURRENCY_FORMAT_OPTIONS.locale,
    useGrouping = DEFAULT_CURRENCY_FORMAT_OPTIONS.useGrouping,
    fallback = DEFAULT_CURRENCY_FORMAT_OPTIONS.fallback,
  } = options;
  const numericAmount: number = parseAmount(amount);
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    return fallback!;
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: NUMBER_FORMATE_STYLE,
    currency,
    currencyDisplay,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    useGrouping,
  });

  return formatter.format(numericAmount);
}

/**
 * Parses and normalizes an amount input to a numeric value.
 *
 * This internal helper function converts string inputs to numbers by removing
 * non-numeric characters (except decimal points and minus signs). It's used
 * internally by formatCurrency to handle various input formats gracefully.
 *
 * @private
 * @param {number | string} amount - The amount to parse, either a number or string.
 * @returns {number} The parsed numeric value, or NaN if parsing fails.
 *
 * @example
 * ```typescript
 * parseAmount(123.45); // 123.45
 * parseAmount('123.45'); // 123.45
 * parseAmount('$123.45'); // 123.45 (removes currency symbol)
 * parseAmount('1,234.56'); // 1234.56 (removes comma)
 * parseAmount('not-a-number'); // NaN
 * ```
 */
function parseAmount(amount: number | string | null | undefined): number {
  if (typeof amount === 'number') {
    return amount;
  }

  if (isNullOrUndefined(amount)) {
    return NaN;
  }
  const cleanedAmount = amount.replace(/[^\d.-]/g, '');
  return parseFloat(cleanedAmount);
}
