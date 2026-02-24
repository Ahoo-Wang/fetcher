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

import React, {
  useState,
  useCallback,
  useEffect,
  RefAttributes,
  useImperativeHandle,
} from 'react';
import { TableFieldItem } from './TableFieldItem';
import styles from './TableSettingPanel.module.css';
import { Space } from 'antd';
import { ViewColumn, FieldDefinition } from '../../viewer';

export interface TableSettingPanelRef {
  reset(): void;
}

/**
 * Props for the TableSettingPanel component.
 * This component provides a UI for managing table column settings including
 * visibility toggles and drag-and-drop reordering.
 */
export interface TableSettingPanelProps extends RefAttributes<TableSettingPanelRef> {
  initialColumns: ViewColumn[];
  onChange?: (columns: ViewColumn[]) => void;

  fields: FieldDefinition[];
  /** Optional CSS class name for additional styling */
  className?: string;
}

/**
 * Internal state for tracking drag operations.
 * Used to manage the drag-and-drop functionality for reordering columns.
 */
interface DragState {
  /** The index of the column being dragged */
  index: number;
  /** The group ('fixed' or 'visible') where the drag originated */
  group: 'fixed' | 'visible';
}

/**
 * Table Setting Panel Component
 *
 * A comprehensive UI component for managing table column settings. It provides:
 * - Column visibility toggles via checkboxes
 * - Drag-and-drop reordering of columns
 * - Fixed column management (up to 3 fixed columns)
 * - Visual grouping of columns by state (fixed, visible, hidden)
 *
 * The component integrates with the table state context to persist changes
 * and works within the broader Viewer ecosystem for data table management.
 *
 * @param props - The component props
 * @returns A React element representing the table settings panel
 */
export function TableSettingPanel(props: TableSettingPanelProps) {
  const { ref, fields, initialColumns, onChange, className } = props;

  // State for tracking the current drag operation
  const [dragState, setDragState] = useState<DragState | null>(null);

  const [columns, setColumns] = useState(initialColumns);

  useEffect(() => {
    setColumns(initialColumns);
  }, [initialColumns]);

  // Add index information to each column for easier manipulation
  // This creates a local copy with sequential indices for drag/drop operations
  const localColumns = columns.map((col, index) => {
    return {
      ...col,
      index,
    };
  });

  // Categorize columns into different groups for rendering
  // Fixed columns are always visible and locked to the left side of the table
  const fixedColumns = localColumns.filter(col => col.fixed);

  // Visible columns are shown in the table but can be reordered
  const visibleColumns = localColumns.filter(col => !col.hidden && !col.fixed);

  // Hidden columns are not displayed in the table but can be made visible
  const hiddenColumns = localColumns.filter(col => col.hidden);

  /**
   * Handles changes to column visibility.
   * When a user toggles a column's visibility checkbox, this function
   * updates the column state and persists the change through the context.
   *
   * @param index - The index of the column being changed
   * @param hidden - The new visibility state
   */
  const handleVisibilityChange = (index: number, hidden: boolean) => {
    const newColumns = localColumns.map((col, i) =>
      i === index ? { ...col, hidden: hidden } : col,
    );
    setColumns(newColumns);
    onChange?.(newColumns);
  };

  /**
   * Handles the start of a drag operation.
   * Creates a custom drag image for better visual feedback and initializes
   * the drag state to track which column is being moved.
   *
   * @param e - The drag start event
   * @param group - The group ('fixed' or 'visible') where the drag started
   * @param index - The index of the column being dragged
   */
  const handleDragStart = useCallback(
    (
      e: React.DragEvent<HTMLDivElement>,
      group: 'fixed' | 'visible',
      index: number,
    ) => {
      // Create a custom drag image with enhanced styling for better UX
      const dragElement = e.currentTarget.cloneNode(true) as HTMLElement;
      dragElement.style.backgroundColor = '#F5F5F5'; // Light background
      dragElement.style.transform = 'scale(1.02)'; // Slight scale up
      dragElement.style.opacity = '1.0'; // Full opacity
      dragElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)'; // Subtle shadow
      dragElement.style.position = 'absolute';
      dragElement.style.top = '-1000px'; // Hide off-screen initially
      dragElement.style.width = `${e.currentTarget.clientWidth}px`;
      dragElement.style.height = `${e.currentTarget.clientHeight}px`;

      // Add the custom drag image to the DOM and set it as the drag image
      document.body.appendChild(dragElement);
      e.dataTransfer.setDragImage(
        dragElement,
        e.nativeEvent.offsetX, // Use mouse position relative to element
        e.nativeEvent.offsetY,
      );

      // Clean up the temporary element after drag starts
      setTimeout(() => document.body.removeChild(dragElement), 0);

      // Configure drag operation
      e.dataTransfer.effectAllowed = 'move';
      setDragState({ index, group });
    },
    [setDragState],
  );

  /**
   * Handles drag over events to allow dropping.
   * This is required to enable drop zones - without it, drop events won't fire.
   *
   * @param e - The drag over event
   */
  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); // Allow drop
    e.dataTransfer.dropEffect = 'move'; // Show move cursor
  }, []);

  /**
   * Handles the end of a drag operation.
   * Cleans up the drag state regardless of whether the drop was successful.
   */
  const handleDragEnd = useCallback(() => {
    setDragState(null);
  }, [setDragState]);

  /**
   * Handles the drop event when a column is dropped onto a new position.
   * Performs validation and reorders columns based on the drop location.
   *
   * @param _e - The drop event
   * @param group - The target group ('fixed' or 'visible') for the drop
   * @param dragIndex - The index within the target group where the drop occurred
   */
  const handleDrop = (
    _e: React.DragEvent<HTMLDivElement>,
    group: 'fixed' | 'visible',
    dragIndex: number,
  ) => {
    // Early returns for invalid drop conditions
    if (!dragState) {
      return; // No active drag operation
    }
    if (dragState.index === dragIndex) {
      return; // Dropped on itself
    }
    if (group === 'fixed' && fixedColumns.length >= 3) {
      return; // Fixed column limit reached (max 3)
    }

    // Calculate the target index in the overall columns array
    // Fixed columns are inserted at the beginning, visible columns in their section
    const targetIndex = group === 'fixed' ? dragIndex + 1 : dragIndex;

    // Perform the reordering operation
    const newColumns = [...localColumns];
    const [draggedItem] = newColumns.splice(dragState.index, 1); // Remove dragged item
    draggedItem.fixed = group === 'fixed'; // Update fixed state based on target group
    newColumns.splice(targetIndex, 0, draggedItem); // Insert at new position

    // Update indices for all columns to maintain consistency
    newColumns.forEach((col, i) => (col.index = i));

    // Persist the changes through the context
    setColumns(newColumns);
    onChange?.(newColumns);
  };

  /**
   * Renders a draggable column item for fixed or visible columns.
   * These items can be reordered via drag-and-drop and have visibility toggles.
   *
   * @param column - The column data with index information
   * @param group - The group ('fixed' or 'visible') this item belongs to
   * @returns A React element for the draggable column item
   */
  const renderDraggableItem = (
    column: ViewColumn & { index: number },
    group: 'fixed' | 'visible',
  ) => {
    // Find the column definition from the view definition
    // This provides metadata like title, primary key status, etc.
    const columnDefinition = fields.find(col => col.name === column.name);
    if (!columnDefinition) {
      return <></>; // Column not found in definition
    }

    return (
      <div
        className={`${styles.item} ${dragState?.index === column.index ? styles.dragging : ''}`}
        key={columnDefinition.name}
        draggable={!columnDefinition.primaryKey} // Primary key columns cannot be reordered
        onDragStart={e => handleDragStart(e, group, column.index)}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={e => handleDrop(e, group, column.index)}
      >
        <TableFieldItem
          columnDefinition={columnDefinition}
          fixed={column.fixed || false}
          hidden={column.hidden}
          onVisibleChange={visible =>
            handleVisibilityChange(column.index, visible)
          }
        />
      </div>
    );
  };

  /**
   * Renders a static (non-draggable) column item for hidden columns.
   * Hidden columns can only be made visible, not reordered via drag-and-drop.
   *
   * @param column - The column data with index information
   * @returns A React element for the static column item
   */
  const renderStaticItem = (column: ViewColumn & { index: number }) => {
    // Find the column definition from the view definition
    const columnDefinition = fields.find(col => col.name === column.name);
    if (!columnDefinition) {
      return <></>; // Column not found in definition
    }

    return (
      <div className={styles.item} key={columnDefinition.name}>
        <TableFieldItem
          columnDefinition={columnDefinition}
          fixed={column.fixed || false}
          hidden={column.hidden}
          onVisibleChange={hidden =>
            handleVisibilityChange(column.index, hidden)
          }
        />
      </div>
    );
  };

  useImperativeHandle(ref, () => ({
    reset: () => {
      setColumns(props.initialColumns);
    },
  }));

  return (
    <Space
      size={0}
      orientation="vertical"
      style={{ display: 'flex' }}
      className={className}
    >
      <div className={styles.groupTitle}>已显示字段</div>
      {fixedColumns.map(column => renderDraggableItem(column, 'fixed'))}
      <div className={styles.tips}>
        请将需要锁定的字段拖至上方（最多支持3列）
      </div>
      {visibleColumns.map(column => renderDraggableItem(column, 'visible'))}
      <div className={styles.groupTitle}>未显示字段</div>
      {hiddenColumns.map(column => renderStaticItem(column))}
    </Space>
  );
}
