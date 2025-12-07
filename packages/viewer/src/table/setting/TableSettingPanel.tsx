import React, { useState, useCallback } from 'react';
import { ViewColumn } from '../types';
import { TableFieldItem } from './TableFieldItem';
import styles from './TableSettingPanel.module.css';
import { Space } from 'antd';

export interface TableSettingPanelProps {
  columns: (ViewColumn & { index: number })[];
  onColumnsChange: (columns: ViewColumn[]) => void;
  className?: string;
}

interface DragState {
  index: number;
  group: 'fixed' | 'visible';
}

export function TableSettingPanel(props: TableSettingPanelProps) {
  const { columns, onColumnsChange, className } = props;
  const [dragState, setDragState] = useState<DragState | null>(null);

  console.log('TableSettingPanel function');
  const fixedColumns = columns.filter(col => col.fixed);
  const visibleColumns = columns.filter(col => col.visible && !col.fixed);
  const hiddenColumns = columns.filter(col => !col.visible);

  const handleVisibilityChange = (index: number, visible: boolean) => {
    const newColumns = columns.map((col, i) =>
      i === index ? { ...col, visible } : col,
    );
    onColumnsChange(newColumns);
  };

  const handleDragStart = useCallback(
    (
      e: React.DragEvent<HTMLDivElement>,
      group: 'fixed' | 'visible',
      index: number,
    ) => {
      console.log('handleDragStart', e, index, group);

      // 拖拽样式
      console.log('e.currentTarget',e.currentTarget.clientWidth);
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
      e.dataTransfer.setDragImage(dragElement, e.nativeEvent.offsetX, e.nativeEvent.offsetY);

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
    console.log('handleDragEnd');
    setDragState(null);
  }, [setDragState]);

  const handleDrop = useCallback(
    (
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
      const newColumns = [...columns];
      console.log('origin columns', newColumns);
      const [originItem] = newColumns.splice(dragState.index, 1);
      console.log('origin item', originItem, newColumns);
      originItem.fixed = group === 'fixed';
      newColumns.splice(targetIndex, 0, originItem);
      console.log('final columns', newColumns);
      newColumns.forEach((col, i) => (col.index = i));
      console.log('re index columns', newColumns);
      onColumnsChange(newColumns);
    },
    [columns, dragState, fixedColumns, onColumnsChange],
  );

  const renderDraggableItem = (
    column: ViewColumn & { index: number },
    group: 'fixed' | 'visible',
  ) => (

    <div
      className={`${styles.item} ${dragState?.index === column.index ? styles.dragging : ''}`}
      key={column.columnDefinition.dataIndex}
      draggable={!column.columnDefinition.primaryKey}
      onDragStart={e => handleDragStart(e, group, column.index)}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDrop={e => handleDrop(e, group, column.index)}
    >
      <TableFieldItem
        columnDefinition={column.columnDefinition}
        fixed={column.fixed || false}
        visible={column.visible}
        onVisibleChange={visible =>
          handleVisibilityChange(column.index, visible)
        }
      />
    </div>
  );

  const renderStaticItem = (column: ViewColumn & { index: number }) => (
    <div className={styles.item} key={column.columnDefinition.dataIndex}>
      <TableFieldItem
        columnDefinition={column.columnDefinition}
        fixed={column.fixed || false}
        visible={column.visible}
        onVisibleChange={visible =>
          handleVisibilityChange(column.index, visible)
        }
      />
    </div>
  );

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
