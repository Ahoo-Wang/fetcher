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

import { Checkbox } from 'antd';
import { DragOutlined } from '@ant-design/icons';

/**
 * Table Field Item Component
 *
 * A component that represents a single column field in a table settings panel.
 * It displays a checkbox for toggling column visibility and a drag handle for reordering.
 *
 * @param props - The properties for the TableFieldItem component
 * @param props.columnDefinition - The column definition including title and primary key flag
 * @param props.fixed - Whether the column is fixed and cannot be hidden
 * @param props.visible - Whether the column is currently visible
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
 *   onVisibleChange={(visible) => console.log('Visibility changed:', visible)}
 * />
 * ```
 */
export interface TableFieldItemProps {
  /** The column definition including title and primary key flag */
  columnDefinition: {
    /** The display title of the column */
    title: string;
    /** The data index for the column */
    dataIndex: string;
    /** The cell configuration for the column */
    cell: any;
    /** Whether this column is a primary key */
    primaryKey: boolean;
  };
  /** Whether the column is fixed and cannot be hidden */
  fixed: boolean;
  /** Whether the column is currently visible */
  visible: boolean;
  /** Callback function triggered when visibility changes */
  onVisibleChange: (visible: boolean) => void;
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
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <Checkbox
          defaultChecked={props.visible}
          disabled={props.columnDefinition.primaryKey}
          onChange={e => props.onVisibleChange(e.target.checked)}
        >
          {props.columnDefinition.title}
        </Checkbox>
        <DragOutlined />
      </div>
    </>
  );
}
