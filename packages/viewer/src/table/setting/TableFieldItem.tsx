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

import { Checkbox, Flex } from 'antd';
import { DragOutlined } from '@ant-design/icons';
import { FieldDefinition } from '../../viewer';

/**
 * Table Field Item Component
 *
 * A component that represents a single column field in a table settings panel.
 * It displays a checkbox for toggling column visibility and a drag handle for reordering.
 *
 * @param props - The properties for the TableFieldItem component
 * @param props.columnDefinition - The column definition including title and primary key flag
 * @param props.fixed - Whether the column is fixed and cannot be hidden
 * @param props.hidden - Whether the column is currently visible
 * @param props.onVisibleChange - Callback function triggered when visibility changes
 *
 * @returns A React element representing the table field item
 *
 * @example
 * ```tsx
 * <TableFieldItem
 *   columnDefinition={{
 *     title: 'Product Name',
 *     dataIndex: 'name',
 *     cell: { type: TEXT_CELL_TYPE },
 *     primaryKey: false
 *   }}
 *   fixed={false}
 *   visible={true}
 *   onVisibleChange={(hidden) => console.log('Visibility changed:', visible)}
 * />
 * ```
 */
export interface TableFieldItemProps {
  /** The column definition including title and primary key flag */
  columnDefinition: FieldDefinition;
  /** Whether the column is fixed and cannot be hidden */
  fixed: boolean;
  /** Whether the column is currently visible */
  hidden: boolean;
  /** Callback function triggered when visibility changes */
  onVisibleChange: (hidden: boolean) => void;
}

/**
 * Table Field Item Component
 *
 * Renders a single column field in the table settings panel with:
 * - Checkbox for visibility toggle
 * - Drag handle for reordering
 * - Primary key disabled state
 *
 * @param props - The properties for the component
 * @returns A React element displaying the field item
 */
export function TableFieldItem(props: TableFieldItemProps) {
  return (
    <Flex align="center" justify="space-between" style={{ width: '100%' }}>
      <Checkbox
        checked={!props.hidden}
        disabled={props.columnDefinition.primaryKey}
        onChange={e => props.onVisibleChange(!e.target.checked)}
      >
        {props.columnDefinition.label}
      </Checkbox>
      <DragOutlined />
    </Flex>
  );
}
