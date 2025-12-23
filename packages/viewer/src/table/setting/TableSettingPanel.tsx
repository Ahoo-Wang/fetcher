import React, { useState, useCallback } from 'react';
import { TableFieldItem } from './TableFieldItem';
import styles from './TableSettingPanel.module.css';
import { Space } from 'antd';
import { useTableStateContext, ViewColumn, ViewDefinition } from '../../viewer';

export interface TableSettingPanelProps {
  viewDefinition: ViewDefinition;
  className?: string;
}

interface DragState {
  index: number;
  group: 'fixed' | 'visible';
}

export function TableSettingPanel(props: TableSettingPanelProps) {
  const { viewDefinition } = props;
  const [dragState, setDragState] = useState<DragState | null>(null);

  const { columns, updateColumns } = useTableStateContext();

  const localColumns = columns.map((col, index) => {
    return {
      ...col,
      index,
    };
  });

  const fixedColumns = localColumns.filter(col => col.fixed);
  const visibleColumns = localColumns.filter(col => col.visible && !col.fixed);
  const hiddenColumns = localColumns.filter(col => !col.visible);

  const handleVisibilityChange = (index: number, visible: boolean) => {
    const newColumns = localColumns.map((col, i) =>
      i === index ? { ...col, visible } : col,
    );
    updateColumns(newColumns);
  };

  const handleDragStart = useCallback(
    (
      e: React.DragEvent<HTMLDivElement>,
      group: 'fixed' | 'visible',
      index: number,
    ) => {
      // Create custom drag image with desired styling
      const dragElement = e.currentTarget.cloneNode(true) as HTMLElement;
      dragElement.style.backgroundColor = '#F5F5F5';
      // dragElement.style.opacity = '0.9';
      dragElement.style.transform = 'scale(1.02)';
      dragElement.style.opacity = '1.0';
      dragElement.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
      dragElement.style.position = 'absolute';
      dragElement.style.top = '-1000px'; // Hide off-screen
      dragElement.style.width = `${e.currentTarget.clientWidth}px`;
      dragElement.style.height = `${e.currentTarget.clientHeight}px`;

      document.body.appendChild(dragElement);
      e.dataTransfer.setDragImage(
        dragElement,
        e.nativeEvent.offsetX,
        e.nativeEvent.offsetY,
      );

      // Remove the temporary element after drag starts
      setTimeout(() => document.body.removeChild(dragElement), 0);

      e.dataTransfer.effectAllowed = 'move';
      setDragState({ index, group });
    },
    [setDragState],
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDragEnd = useCallback(() => {
    setDragState(null);
  }, [setDragState]);

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    group: 'fixed' | 'visible',
    dragIndex: number,
  ) => {
    console.log('handleDrop', e.dataTransfer, group, dragIndex);
    if (!dragState) {
      return;
    }
    if (dragState.index === dragIndex) {
      return;
    }
    if (group === 'fixed' && fixedColumns.length >= 3) {
      return;
    }

    // const [draggedItem] = newColumns.splice(draggedIndex, 1);
    // newColumns.splice(dropIndex, 0, draggedItem);

    const targetIndex = group === 'fixed' ? dragIndex + 1 : dragIndex;
    const newColumns = [...localColumns];
    const [originItem] = newColumns.splice(dragState.index, 1);
    originItem.fixed = group === 'fixed';
    newColumns.splice(targetIndex, 0, originItem);
    newColumns.forEach((col, i) => (col.index = i));
    updateColumns(newColumns);
  };

  const renderDraggableItem = (
    column: ViewColumn & { index: number },
    group: 'fixed' | 'visible',
  ) => {
    const columnDefinition = viewDefinition.columns.find(
      col => col.dataIndex === column.dataIndex,
    );
    if (!columnDefinition) {
      return <></>;
    }

    return (
      <div
        className={`${styles.item} ${dragState?.index === column.index ? styles.dragging : ''}`}
        key={columnDefinition.dataIndex}
        draggable={!columnDefinition.primaryKey}
        onDragStart={e => handleDragStart(e, group, column.index)}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDrop={e => handleDrop(e, group, column.index)}
      >
        <TableFieldItem
          columnDefinition={columnDefinition}
          fixed={column.fixed || false}
          visible={column.visible}
          onVisibleChange={visible =>
            handleVisibilityChange(column.index, visible)
          }
        />
      </div>
    );
  };

  const renderStaticItem = (column: ViewColumn & { index: number }) => {
    const columnDefinition = viewDefinition.columns.find(
      col => col.dataIndex === column.dataIndex,
    );
    if (!columnDefinition) {
      return <></>;
    }

    return (
      <div className={styles.item} key={columnDefinition.dataIndex}>
        <TableFieldItem
          columnDefinition={columnDefinition}
          fixed={column.fixed || false}
          visible={column.visible}
          onVisibleChange={visible =>
            handleVisibilityChange(column.index, visible)
          }
        />
      </div>
    );
  };

  return (
    <Space size={0} orientation="vertical" style={{ display: 'flex' }}>
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
