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
 *   currency: 'USD',
 *   decimals: 2
 * });
 * ```
 */
export const CURRENCY_CELL_TYPE = 'currency';

/**
 * Attributes for currency cell formatting, extending TextProps with currency-specific options.
 *
 * This interface combines Ant Design's TextProps for text styling with
 * a format property containing CurrencyFormatOptions for currency formatting configuration.
 *
 * @interface CurrencyAttributes
 * @extends TextProps
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
 *   style: { color: 'green' }
 * };
 * ```
 */
export interface CurrencyAttributes extends TextProps {
  format?: CurrencyFormatOptions;
}

/**
 * Props for the CurrencyCell component, extending CellProps with numeric value type and CurrencyAttributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface CurrencyCellProps
 * @extends CellProps<number | string, RecordType, CurrencyAttributes>
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
 *     currency: 'USD',
 *     decimals: 2,
 *     ellipsis: true
 *   }
 * };
 * ```
 */
export interface CurrencyCellProps<RecordType = any>
  extends CellProps<number | string, RecordType, CurrencyAttributes> {}

/**
 * Renders a currency cell using the formatCurrency function and Ant Design's Typography.Text component.
 *
 * This component displays numeric values formatted as currencies in table cells,
 * supporting various currencies, locales, and formatting options. It combines
 * the currency formatting capabilities with text styling options from Ant Design.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the currency cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The numeric or string value to format as currency.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes for currency formatting and text styling.
 * @returns A React element representing the formatted currency cell.
 *
 * @example
 * ```tsx
 * <CurrencyCell
 *   data={{
 *     value: 1234.56,
 *     record: { id: 1, name: "Product", price: 1234.56 },
 *     index: 0
 *   }}
 *   attributes={{
 *     currency: 'USD',
 *     decimals: 2,
 *     locale: 'en-US',
 *     ellipsis: true,
 *     style: { fontWeight: 'bold' }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript
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
 *     currency: 'EUR',
 *     currencyDisplay: 'code',
 *     decimals: 2
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // Using string values (automatically parsed)
 * <CurrencyCell
 *   data={{
 *     value: "1234.56",
 *     record: { id: 1, amount: "1234.56" },
 *     index: 0
 *   }}
 *   attributes={{
 *     currency: 'CNY',
 *     useGrouping: true
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
