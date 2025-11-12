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

import { CellProps } from './types';
import { Typography } from 'antd';
import { TextProps } from 'antd/es/typography/Text';
import { formatCurrency, CurrencyFormatOptions } from './currencyFormatter';

const { Text } = Typography;

/**
 * Constant representing the type identifier for currency cells.
 *
 * This constant is used to register and identify currency cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for currency-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'currency'
 *
 * @example
 * ```tsx
 * import { typedCellRender, CURRENCY_CELL_TYPE } from './table/cell';
 *
 * const currencyRenderer = typedCellRender(CURRENCY_CELL_TYPE, {
 *   format: {
 *     currency: 'USD',
 *     decimals: 2,
 *     locale: 'en-US'
 *   },
 *   style: { fontWeight: 'bold' }
 * });
 * ```
 *
 * @example
 * ```tsx
 * // Using with cell registry
 * import { cellRegistry, CURRENCY_CELL_TYPE } from './table/cell';
 *
 * const CurrencyCellComponent = cellRegistry.get(CURRENCY_CELL_TYPE);
 * if (CurrencyCellComponent) {
 *   // Use the component for rendering currency cells
 * }
 * ```
 */
export const CURRENCY_CELL_TYPE = 'currency';

/**
 * Attributes for currency cell formatting, extending TextProps with currency-specific options.
 *
 * This interface combines Ant Design's TextProps for text styling with
 * a format property containing CurrencyFormatOptions for currency formatting configuration.
 * The format property is optional and allows customization of how currency values are displayed.
 *
 * @interface CurrencyAttributes
 * @extends TextProps
 *
 * @property {CurrencyFormatOptions} [format] - Optional currency formatting options.
 *   When not provided, uses default currency formatting (CNY, zh-CN locale, 2 decimals).
 * @property {boolean} [ellipsis] - Whether to truncate text with ellipsis when it overflows.
 * @property {React.CSSProperties} [style] - Custom CSS styles to apply to the text element.
 * @property {string} [className] - Additional CSS class names to apply to the text element.
 * @property {React.ReactNode} [children] - Custom content to display instead of the formatted currency value.
 *
 * @example
 * ```tsx
 * const attributes: CurrencyAttributes = {
 *   format: {
 *     currency: 'USD',
 *     currencyDisplay: 'symbol',
 *     decimals: 2,
 *     locale: 'en-US',
 *     useGrouping: true
 *   },
 *   ellipsis: true,
 *   style: { color: 'green', fontWeight: 'bold' },
 *   className: 'currency-text'
 * };
 * ```
 *
 * @example
 * ```tsx
 * // Using only text styling without currency formatting
 * const attributes: CurrencyAttributes = {
 *   style: { color: 'red' },
 *   ellipsis: true
 * };
 * ```
 */
export interface CurrencyAttributes extends TextProps {
  format?: CurrencyFormatOptions;
}

/**
 * Props for the CurrencyCell component, extending CellProps with numeric value type and CurrencyAttributes.
 *
 * This interface defines the complete props structure for the CurrencyCell component,
 * combining cell data with optional formatting and styling attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface CurrencyCellProps
 * @extends CellProps<number | string, RecordType, CurrencyAttributes>
 *
 * @property {CellData<number | string, RecordType>} data - The cell data containing the value to format.
 * @property {CurrencyAttributes} [attributes] - Optional attributes for currency formatting and text styling.
 *
 * @example
 * ```tsx
 * interface Product {
 *   id: number;
 *   name: string;
 *   price: number;
 * }
 *
 * const props: CurrencyCellProps<Product> = {
 *   data: {
 *     value: 1234.56,
 *     record: { id: 1, name: "Widget", price: 1234.56 },
 *     index: 0
 *   },
 *   attributes: {
 *     format: {
 *       currency: 'USD',
 *       decimals: 2,
 *       locale: 'en-US'
 *     },
 *     ellipsis: true,
 *     style: { fontWeight: 'bold' }
 *   }
 * };
 * ```
 *
 * @example
 * ```tsx
 * // With string values (automatically parsed)
 * const props: CurrencyCellProps = {
 *   data: {
 *     value: "999.99",
 *     record: { id: 1, amount: "999.99" },
 *     index: 0
 *   },
 *   attributes: {
 *     format: {
 *       currency: 'EUR',
 *       currencyDisplay: 'code'
 *     }
 *   }
 * };
 * ```
 */
export interface CurrencyCellProps<RecordType = any>
  extends CellProps<number | string, RecordType, CurrencyAttributes> {}

/**
 * Renders a currency cell using the formatCurrency function and Ant Design's Typography.Text component.
 *
 * This component displays numeric values formatted as localized currency strings in table cells.
 * It supports various currencies, locales, decimal precision, and formatting options while
 * providing text styling capabilities through Ant Design's Typography.Text component.
 *
 * The component automatically handles invalid values (null, undefined, NaN, Infinity) by
 * displaying a fallback string, and supports both numeric and string inputs that are
 * automatically parsed.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param {CurrencyCellProps<RecordType>} props - The props for the currency cell component.
 * @param {CellData<number | string, RecordType>} props.data - The cell data containing value, record, and index.
 * @param {number | string} props.data.value - The numeric or string value to format as currency.
 *   String values are automatically parsed, removing non-numeric characters except decimal points and minus signs.
 * @param {RecordType} props.data.record - The full record object providing context for the cell.
 * @param {number} props.data.index - The zero-based index of the row in the table.
 * @param {CurrencyAttributes} [props.attributes] - Optional attributes for currency formatting and text styling.
 * @param {CurrencyFormatOptions} [props.attributes.format] - Currency formatting options including currency code, locale, decimals, etc.
 * @param {boolean} [props.attributes.ellipsis] - Whether to truncate text with ellipsis when it overflows.
 * @param {React.CSSProperties} [props.attributes.style] - Custom CSS styles to apply to the text element.
 * @param {string} [props.attributes.className] - Additional CSS class names to apply to the text element.
 * @param {React.ReactNode} [props.attributes.children] - Custom content to display instead of the formatted currency value.
 * @returns {React.ReactElement} A React element representing the formatted currency cell using Typography.Text.
 *
 * @throws {Error} This component does not throw errors directly, but may propagate errors from the formatCurrency function
 *   if invalid currency codes or locales are provided in the format options.
 *
 * @example
 * ```tsx
 * // Basic usage with USD formatting
 * <CurrencyCell
 *   data={{
 *     value: 1234.56,
 *     record: { id: 1, name: "Product", price: 1234.56 },
 *     index: 0
 *   }}
 *   attributes={{
 *     format: {
 *       currency: 'USD',
 *       decimals: 2,
 *       locale: 'en-US'
 *     },
 *     ellipsis: true,
 *     style: { fontWeight: 'bold' }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript and EUR currency
 * interface Transaction {
 *   id: string;
 *   amount: number;
 *   currency: string;
 * }
 *
 * <CurrencyCell<Transaction>
 *   data={{
 *     value: 999.99,
 *     record: { id: "tx-123", amount: 999.99, currency: "EUR" },
 *     index: 0
 *   }}
 *   attributes={{
 *     format: {
 *       currency: 'EUR',
 *       currencyDisplay: 'code',
 *       decimals: 2,
 *       locale: 'de-DE'
 *     },
 *     style: { color: 'green' }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Using string values (automatically parsed)
 * <CurrencyCell
 *   data={{
 *     value: "1,234.56",
 *     record: { id: 1, amount: "1,234.56" },
 *     index: 0
 *   }}
 *   attributes={{
 *     format: {
 *       currency: 'CNY',
 *       useGrouping: true
 *     }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Handling invalid values (displays fallback)
 * <CurrencyCell
 *   data={{
 *     value: NaN,
 *     record: { id: 1, amount: NaN },
 *     index: 0
 *   }}
 *   attributes={{
 *     format: {
 *       currency: 'USD',
 *       fallback: 'N/A'
 *     }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Custom content override
 * <CurrencyCell
 *   data={{
 *     value: 100,
 *     record: { id: 1, amount: 100 },
 *     index: 0
 *   }}
 *   attributes={{
 *     format: { currency: 'USD' },
 *     children: <span style={{ color: 'red' }}>Custom Content</span>
 *   }}
 * />
 * ```
 */
export function CurrencyCell<RecordType = any>(
  props: CurrencyCellProps<RecordType>,
) {
  const { data, attributes = {} } = props;
  const { format, ...textProps } = attributes;
  const formattedValue = formatCurrency(data.value, format);
  return <Text {...textProps}>{textProps.children ?? formattedValue}</Text>;
}
