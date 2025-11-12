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
import { Image, Typography } from 'antd';
import { ImageProps } from 'antd/es/image';

const { Text } = Typography;

/**
 * Constant representing the type identifier for image cells.
 *
 * This constant is used to register and identify image cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for image-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'image'
 *
 * @example
 * ```tsx
 * import { typedCellRender, IMAGE_CELL_TYPE } from './table/cell';
 *
 * const imageRenderer = typedCellRender(IMAGE_CELL_TYPE, {
 *   width: 50,
 *   height: 50
 * });
 * ```
 */
export const IMAGE_CELL_TYPE = 'image';

/**
 * Props for the ImageCell component, extending CellProps with string value type and ImageProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface ImageCellProps
 * @extends CellProps<string, RecordType, ImageProps>
 *
 * @example
 * ```tsx
 * interface Product {
 *   id: number;
 *   name: string;
 *   imageUrl: string;
 * }
 *
 * const props: ImageCellProps<Product> = {
 *   data: {
 *     value: "https://example.com/image.jpg",
 *     record: { id: 1, name: "Product A", imageUrl: "https://example.com/image.jpg" },
 *     index: 0
 *   },
 *   attributes: {
 *     width: 80,
 *     height: 80,
 *     alt: "Product image"
 *   }
 * };
 * ```
 */
export interface ImageCellProps<RecordType = any>
  extends CellProps<string, RecordType, ImageProps> {
}

/**
 * Renders an image cell using Ant Design's Image component.
 *
 * This component displays image URLs in table cells with support for
 * preview, fallback images, and all Image component features. It handles
 * null/undefined values gracefully by showing a placeholder.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the image cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The image URL string to display.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes for the Image component.
 * @returns A React element representing the image cell.
 *
 * @example
 * ```tsx
 * <ImageCell
 *   data={{
 *     value: "https://example.com/avatar.jpg",
 *     record: { id: 1, name: "John", avatar: "https://example.com/avatar.jpg" },
 *     index: 0
 *   }}
 *   attributes={{
 *     width: 40,
 *     height: 40,
 *     preview: true
 *   }}
 * />
 * ```
 *
 * @example
 * ```tsx
 * // With fallback image
 * <ImageCell
 *   data={{
 *     value: "https://example.com/image.jpg",
 *     record: { id: 1, title: "Product", imageUrl: "https://example.com/image.jpg" },
 *     index: 0
 *   }}
 *   attributes={{
 *     width: 100,
 *     height: 100,
 *     fallback: "https://example.com/placeholder.jpg"
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
 *   avatar: string;
 * }
 *
 * <ImageCell<User>
 *   data={{
 *     value: user.avatar,
 *     record: user,
 *     index: 0
 *   }}
 *   attributes={{
 *     width: 32,
 *     height: 32,
 *     style: { borderRadius: '50%' }
 *   }}
 * />
 * ```
 */
export function ImageCell<RecordType = any>(props: ImageCellProps<RecordType>) {
  const { data, attributes = {} } = props;

  if (!data.value) {
    return <Text>-</Text>;
  }

  return <Image src={data.value} {...attributes} />;
}
