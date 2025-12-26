import { ViewColumn } from './types';
import { ReducerActionCapable } from '../types';
import { useCallback, useReducer } from 'react';
import { SizeType } from 'antd/es/config-provider/SizeContext';

/**
 * Table State Interface
 *
 * Represents the complete state of the table system including column configurations
 * and table sizing preferences.
 */
export interface TableState {
  /** Array of column configurations with visibility, width, and positioning */
  columns: ViewColumn[];
  /** Table size preference (small, middle, large) following Ant Design conventions */
  tableSize: SizeType;
}

/**
 * Table State Reducer Action Types
 *
 * Defines the available actions that can be dispatched to update table state.
 */
export type TableStateReducerActionType =
  | 'UPDATE_COLUMNS' // Update the column configurations array
  | 'UPDATE_TABLE_SIZE'; // Change the table size preference

/**
 * Table State Reducer Action Interface
 *
 * Extends the base reducer action interface with table-specific action types.
 */
export interface TableStateReducerAction extends ReducerActionCapable<TableStateReducerActionType> {}

/**
 * Table State Reducer Return Interface
 *
 * Defines the return type of the useTableStateReducer hook, providing
 * access to current state and state update functions.
 */
export interface UseTableStateReducerReturn {
  /** Current array of column configurations */
  columns: ViewColumn[];
  /** Current table size setting */
  tableSize: SizeType;
  /** Function to update the columns configuration array */
  updateColumns: (columns: ViewColumn[]) => void;
  /** Function to change the table size */
  updateTableSize: (tableSize: SizeType) => void;
}

/**
 * Table State Reducer Function
 *
 * Pure reducer function that handles state updates for the table system.
 * Processes actions to update column configurations and table sizing immutably.
 *
 * @param state - Current table state
 * @param action - Action to process with type and payload
 * @returns New table state after applying the action
 */
const tableStateReducer = (
  state: TableState,
  action: TableStateReducerAction,
): TableState => {
  switch (action.type) {
    case 'UPDATE_COLUMNS':
      return { ...state, columns: action.payload };
    case 'UPDATE_TABLE_SIZE':
      return { ...state, tableSize: action.payload };
    default:
      return state;
  }
};

/**
 * Table State Reducer Hook
 *
 * Custom React hook that provides table state management using useReducer.
 * Manages column configurations and table sizing with optimized callback functions
 * for performance and prevents unnecessary re-renders.
 *
 * @param state - Initial table state configuration
 * @param state.columns - Initial array of column configurations
 * @param state.tableSize - Initial table size preference
 * @returns Table state management interface with current state and update functions
 *
 * @example
 * ```tsx
 * import { useTableStateReducer } from './useTableStateReducer';
 * import type { ViewColumn } from './types';
 * import type { SizeType } from 'antd/es/config-provider/SizeContext';
 *
 * function TableManager() {
 *   const tableState = useTableStateReducer({
 *     columns: [
 *       { dataIndex: 'id', fixed: false, visible: true, width: '100px' },
 *       { dataIndex: 'name', fixed: false, visible: true, width: '200px' },
 *       { dataIndex: 'email', fixed: false, visible: false }
 *     ],
 *     tableSize: 'middle'
 *   });
 *
 *   const {
 *     columns,
 *     tableSize,
 *     updateColumns,
 *     updateTableSize
 *   } = tableState;
 *
 *   const handleColumnVisibilityChange = (columnId: string, visible: boolean) => {
 *     const updatedColumns = columns.map(col =>
 *       col.dataIndex === columnId
 *         ? { ...col, visible }
 *         : col
 *     );
 *     updateColumns(updatedColumns);
 *   };
 *
 *   const handleSizeChange = (newSize: SizeType) => {
 *     updateTableSize(newSize);
 *   };
 *
 *   return (
 *     <div>
 *       <TableSizeSelector
 *         currentSize={tableSize}
 *         onChange={handleSizeChange}
 *       />
 *       <ColumnManager
 *         columns={columns}
 *         onVisibilityChange={handleColumnVisibilityChange}
 *       />
 *       <ViewTable
 *         columns={columns}
 *         tableSize={tableSize}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Integration with Viewer component
 * function DataViewer({ viewDefinition }) {
 *   const tableState = useTableStateReducer({
 *     columns: viewDefinition.columns,
 *     tableSize: viewDefinition.tableSize || 'middle'
 *   });
 *
 *   // Use table state in Viewer
 *   return (
 *     <TableStateContextProvider
 *       columns={tableState.columns}
 *       tableSize={tableState.tableSize}
 *       updateColumns={tableState.updateColumns}
 *       updateTableSize={tableState.updateTableSize}
 *       refreshData={() => handleRefresh()}
 *     >
 *       <Viewer definition={viewDefinition} />
 *     </TableStateContextProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Advanced column management
 * function AdvancedTableController() {
 *   const tableState = useTableStateReducer({
 *     columns: [],
 *     tableSize: 'middle'
 *   });
 *
 *   const addColumn = useCallback((newColumn: ViewColumn) => {
 *     tableState.updateColumns([...tableState.columns, newColumn]);
 *   }, [tableState]);
 *
 *   const removeColumn = useCallback((columnId: string) => {
 *     const filteredColumns = tableState.columns.filter(
 *       col => col.dataIndex !== columnId
 *     );
 *     tableState.updateColumns(filteredColumns);
 *   }, [tableState]);
 *
 *   const reorderColumns = useCallback((fromIndex: number, toIndex: number) => {
 *     const newColumns = [...tableState.columns];
 *     const [movedColumn] = newColumns.splice(fromIndex, 1);
 *     newColumns.splice(toIndex, 0, movedColumn);
 *     tableState.updateColumns(newColumns);
 *   }, [tableState]);
 *
 *   return (
 *     <div>
 *       <ColumnList
 *         columns={tableState.columns}
 *         onAdd={addColumn}
 *         onRemove={removeColumn}
 *         onReorder={reorderColumns}
 *       />
 *       <TableSizeControls
 *         size={tableState.tableSize}
 *         onChange={tableState.updateTableSize}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export function useTableStateReducer(
  state: TableState,
): UseTableStateReducerReturn {
  /**
   * useReducer hook for managing table state.
   *
   * Uses a reducer pattern for predictable state updates and better performance
   * with complex state transitions. The reducer ensures immutable state updates.
   */
  const [tableState, dispatch] = useReducer<
    TableState,
    [TableStateReducerAction]
  >(tableStateReducer, state);

  /**
   * Update columns callback.
   *
   * Memoized with useCallback to prevent unnecessary re-renders in consuming components.
   * Dispatches an action to update the columns configuration array.
   */
  const updateColumns = useCallback((columns: ViewColumn[]) => {
    dispatch({ type: 'UPDATE_COLUMNS', payload: columns });
  }, []);

  /**
   * Update table size callback.
   *
   * Memoized with useCallback for performance. Updates the table size preference
   * that affects the overall table appearance and spacing.
   */
  const updateTableSize = useCallback((tableSize: SizeType) => {
    dispatch({ type: 'UPDATE_TABLE_SIZE', payload: tableSize });
  }, []);

  /**
   * Return the complete table state management interface.
   *
   * Provides current state values and memoized update functions for optimal performance.
   */
  return {
    columns: tableState.columns,
    tableSize: tableState.tableSize,
    updateColumns,
    updateTableSize,
  };
}
