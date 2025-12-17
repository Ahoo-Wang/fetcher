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
import { Empty, Image, Badge } from 'antd';
import { PreviewGroupProps } from 'antd/es/image/PreviewGroup';

/**
 * Constant representing the type identifier for image group cells.
 *
 * This constant is used to register and identify image group cell components
 * in the cell registry system. It should be used when creating typed
 * cell renderers for image group-based table cells.
 *
 * @constant
 * @type {string}
 * @default 'image-group'
 *
 * @example
 * ```tsx
 * import { typedCellRender, IMAGE_GROUP_CELL_TYPE } from './table/cell';
 *
 * const imageGroupRenderer = typedCellRender(IMAGE_GROUP_CELL_TYPE, {
 *   width: 50,
 *   height: 50
 * });
 * ```
 */
export const IMAGE_GROUP_CELL_TYPE: string = 'image-group';

/**
 * Props for the ImageGroupCell component, extending CellProps with string array value type and ImageProps attributes.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @interface ImageGroupCellProps
 * @extends CellProps<string[], RecordType, ImageProps>
 *
 * @example
 * ```tsx
 * interface Product {
 *   id: number;
 *   name: string;
 *   images: string[];
 * }
 *
 * const props: ImageGroupCellProps<Product> = {
 *   data: {
 *     value: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
 *     record: { id: 1, name: "Product A", images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"] },
 *     index: 0
 *   },
 *   attributes: {
 *     width: 80,
 *     height: 80,
 *     preview: true
 *   }
 * };
 * ```
 */
export interface ImageGroupCellProps<RecordType = any>
  extends CellProps<string[], RecordType, PreviewGroupProps> {}

/**
 * Renders an image group cell using Ant Design's Image.PreviewGroup component.
 *
 * This component displays multiple images in a group that can be previewed together,
 * allowing navigation between images. It handles null/undefined/empty arrays gracefully
 * by showing a placeholder.
 *
 * @template RecordType - The type of the record containing the cell data.
 * @param props - The props for the image group cell component.
 * @param props.data - The cell data containing value, record, and index.
 * @param props.data.value - The array of image URLs to display.
 * @param props.data.record - The full record object for context.
 * @param props.data.index - The index of the row in the table.
 * @param props.attributes - Optional attributes for the Image components.
 * @returns A React element representing the image group cell.
 *
 * @example
 * ```tsx
 * <ImageGroupCell
 *   data={{
 *     value: ["https://example.com/avatar1.jpg", "https://example.com/avatar2.jpg"],
 *     record: { id: 1, name: "John", avatars: ["https://example.com/avatar1.jpg", "https://example.com/avatar2.jpg"] },
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
 * // With fallback images
 * <ImageGroupCell
 *   data={{
 *     value: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"],
 *     record: { id: 1, title: "Product", images: ["https://example.com/image1.jpg", "https://example.com/image2.jpg"] },
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
 * interface Gallery {
 *   id: number;
 *   name: string;
 *   photos: string[];
 * }
 *
 * <ImageGroupCell<Gallery>
 *   data={{
 *     value: gallery.photos,
 *     record: gallery,
 *     index: 0
 *   }}
 *   attributes={{
 *     width: 64,
 *     height: 64,
 *     style: { borderRadius: '4px' }
 *   }}
 * />
 * ```
 */
export function ImageGroupCell<RecordType = any>(
  props: ImageGroupCellProps<RecordType>,
) {
  const { data, attributes = {} } = props;

  if (!data.value || !Array.isArray(data.value) || data.value.length === 0) {
    return <Empty description={null} />;
  }
  const hasMultipleImages = data.value.length > 1;
  const mainImageElement = (
    <Image src={data.value[0]} {...(attributes as any)} />
  );

  return (
    <Image.PreviewGroup items={data.value} {...attributes}>
      {hasMultipleImages ? (
        <Badge count={data.value.length}>{mainImageElement}</Badge>
      ) : (
        mainImageElement
      )}
    </Image.PreviewGroup>
  );
}
