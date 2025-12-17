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
import { LinkProps } from 'antd/es/typography/Link';

const { Link } = Typography;

/**
 * Constant representing the type identifier for link cells.
 *
 * This constant is used to register and identify link cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for link-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'link'
 *
 * @example
 * ```tsx
 * import { typedCellRender, LINK_CELL_TYPE } from './table/cell';
 *
 * const linkRenderer = typedCellRender(LINK_CELL_TYPE, { href: '#' });
 * ```
 */
export const LINK_CELL_TYPE: string = 'link';

/**
 * Props for the LinkCell component, extending CellProps with string value type and LinkProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface LinkCellProps
 * @extends CellProps<string, RecordType, LinkProps>
 *
 * @example
 * ```tsx
 * interface Article {
 *   id: number;
 *   title: string;
 *   url: string;
 * }
 *
 * const props: LinkCellProps<Article> = {
 *   data: {
 *     value: "Read More",
 *     record: { id: 1, title: "Article Title", url: "https://example.com" },
 *     index: 0
 *   },
 *   attributes: { href: "https://example.com" }
 * };
 * ```
 */
export interface LinkCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  LinkProps
> {}

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const EMAIL_PREFIX = 'mailto:';

/**
 * Renders a link cell using Ant Design's Typography.Link component.
 *
 * This component displays clickable links in table cells with support for
 * various link formatting options provided by Ant Design's Typography.Link.
 * It handles the rendering of link content while allowing customization
 * through attributes like href, target, and other LinkProps.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the link cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The string value to display as the link text.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes to pass to Typography.Link component.
 * @returns A React element representing the link cell.
 *
 * @example
 * ```tsx
 * <LinkCell
 *   data={{
 *     value: "Visit Website",
 *     record: { id: 1, name: "Example", url: "https://example.com" },
 *     index: 0
 *   }}
 *   attributes={{
 *     href: "https://example.com",
 *     target: "_blank"
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript
 * interface LinkItem {
 *   id: number;
 *   text: string;
 *   href: string;
 * }
 *
 * <LinkCell<LinkItem>
 *   data={{
 *     value: "Click Here",
 *     record: { id: 1, text: "Click Here", href: "https://example.com" },
 *     index: 0
 *   }}
 *   attributes={{
 *     href: "https://example.com",
 *     style: { color: '#1890ff' }
 *   }}
 * />
 * ```
 */
export function LinkCell<RecordType = any>(props: LinkCellProps<RecordType>) {
  const isEmail = props.data.value && EMAIL_REGEX.test(props.data.value);
  const href =
    props.attributes?.href ??
    (isEmail ? `${EMAIL_PREFIX}${props.data.value}` : props.data.value);
  const linkProps = isEmail
    ? props.attributes
    : {
        ...props.attributes,
        ...(props.attributes?.target === undefined ? { target: '_blank' } : {}),
      };
  return (
    <Link href={href} {...linkProps}>
      {props.attributes?.children ?? props.data.value}
    </Link>
  );
}
