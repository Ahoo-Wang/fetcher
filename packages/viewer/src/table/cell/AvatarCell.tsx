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
import { Avatar } from 'antd';
import { AvatarProps } from 'antd/es/avatar';
import { isValidImageSrc } from './utils';

/**
 * Constant representing the type identifier for avatar cells.
 *
 * This constant is used to register and identify avatar cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for avatar-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'avatar'
 *
 * @example
 * ```tsx
 * import { typedCellRender, AVATAR_CELL_TYPE } from './table/cell';
 *
 * const avatarRenderer = typedCellRender(AVATAR_CELL_TYPE, {
 *   size: 32
 * });
 * ```
 */
export const AVATAR_CELL_TYPE: string = 'avatar';

/**
 * Props for the AvatarCell component, extending CellProps with string value type and AvatarProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface AvatarCellProps
 * @extends CellProps<string, RecordType, AvatarProps>
 *
 * @example
 * ```tsx
 * interface User {
 *   id: number;
 *   name: string;
 *   avatarUrl: string;
 * }
 *
 * const props: AvatarCellProps<User> = {
 *   data: {
 *     value: "https://example.com/avatar.jpg",
 *     record: { id: 1, name: "John", avatarUrl: "https://example.com/avatar.jpg" },
 *     index: 0
 *   },
 *   attributes: {
 *     size: 40,
 *     alt: "User avatar"
 *   }
 * };
 * ```
 */
export interface AvatarCellProps<RecordType = any> extends CellProps<
  string,
  RecordType,
  AvatarProps
> {}

/**
 * Renders an avatar cell using Ant Design's Avatar component.
 *
 * This component displays user avatars in table cells with support for
 * images, fallback text, and all Avatar component features. It handles
 * null/undefined values gracefully by showing initials from the record name.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the avatar cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The avatar URL string or name to display.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes for the Avatar component.
 * @returns A React element representing the avatar cell.
 *
 * @example
 * ```tsx
 * <AvatarCell
 *   data={{
 *     value: "https://example.com/avatar.jpg",
 *     record: { id: 1, name: "John", avatar: "https://example.com/avatar.jpg" },
 *     index: 0
 *   }}
 *   attributes={{
 *     size: 32
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With fallback to initials
 * <AvatarCell
 *   data={{
 *     value: "John Doe",
 *     record: { id: 1, name: "John Doe" },
 *     index: 0
 *   }}
 *   attributes={{
 *     size: 40,
 *     style: { backgroundColor: '#1890ff' }
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With TypeScript
 * interface User {
 *   id: number;
 *   name: string;
 *   avatar?: string;
 * }
 *
 * <AvatarCell<User>
 *   data={{
 *     value: user.avatar || user.name,
 *     record: user,
 *     index: 0
 *   }}
 *   attributes={{
 *     size: 24
 *   }}
 * />
 * ```
 */
export function AvatarCell<RecordType = any>(
  props: AvatarCellProps<RecordType>,
) {
  const { data, attributes = {} } = props;

  if (!data.value) {
    return <Avatar {...attributes} />;
  }

  // If value is a valid image source, use it as src
  if (isValidImageSrc(data.value)) {
    return <Avatar src={data.value} {...attributes} />;
  }

  // Otherwise, use as text (initials or name)
  return <Avatar {...attributes}>{data.value}</Avatar>;
}
