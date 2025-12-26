import { createContext, ReactNode, useContext } from 'react';
import { UseTableStateReducerReturn } from './useTableStateReducer';

/**
 * Table State Context Type
 *
 * Represents the complete table state management interface provided by the context.
 * Extends the table state reducer with data refresh functionality.
 */
export type TableStateContext = UseTableStateReducerReturn & {
  /** Function to refresh/reload table data */
  refreshData: () => void;
};

/**
 * React Context for Table State Management
 *
 * Provides centralized management of table-related state across the viewer component tree.
 * Includes column configurations, table sizing, and data refresh capabilities.
 *
 * @example
 * ```tsx
 * import { useTableStateContext } from './TableStateContext';
 *
 * function TableControls() {
 *   const { columns, tableSize, refreshData } = useTableStateContext();
 *
 *   return (
 *     <div>
 *       <button onClick={refreshData}>Refresh Data</button>
 *       <span>Table Size: {tableSize}</span>
 *       <span>Visible Columns: {columns.filter(c => c.visible).length}</span>
 *     </div>
 *   );
 * }
 * ```
 */
export const TableStateContext = createContext<TableStateContext | undefined>(
  undefined,
);

/**
 * Props for the TableStateContextProvider component.
 *
 * Extends the TableStateContext interface with React children for component composition.
 */
export interface TableStateContextOptions extends TableStateContext {
  /** Child components that will have access to the table state context */
  children: ReactNode;
}

/**
 * Table State Context Provider Component
 *
 * Provides table state management to all descendant components in the React tree.
 * This component should wrap the parts of your application that need access to table state.
 *
 * @param props - Provider configuration and child components
 * @param props.children - Components that will have access to table state
 * @param props.columns - Current column configurations with visibility and sizing
 * @param props.tableSize - Current table size (small, middle, large)
 * @param props.updateColumns - Function to update column configurations
 * @param props.updateTableSize - Function to change table size
 * @param props.refreshData - Function to refresh/reload table data
 *
 * @example
 * ```tsx
 * import { TableStateContextProvider } from './TableStateContext';
 * import { useTableState } from './useTableStateReducer';
 *
 * function DataTable({ definition, dataSource }) {
 *   // Initialize table state management
 *   const tableState = useTableState({
 *     initialColumns: definition.columns,
 *     initialTableSize: 'middle'
 *   });
 *
 *   const handleRefresh = async () => {
 *     // Fetch fresh data from API
 *     const newData = await fetchData();
 *     setDataSource(newData);
 *   };
 *
 *   return (
 *     <TableStateContextProvider
 *       columns={tableState.columns}
 *       tableSize={tableState.tableSize}
 *       updateColumns={tableState.updateColumns}
 *       updateTableSize={tableState.updateTableSize}
 *       refreshData={handleRefresh}
 *     >
 *       <ViewTable
 *         viewDefinition={definition}
 *         dataSource={dataSource}
 *       />
 *       <TableSettings />
 *       <RefreshButton />
 *     </TableStateContextProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Integration with Viewer component
 * function DataViewer({ definition, dataSource, onRefresh }) {
 *   const tableState = useTableState({
 *     initialColumns: definition.columns,
 *     initialTableSize: definition.tableSize || 'middle'
 *   });
 *
 *   return (
 *     <TableStateContextProvider
 *       columns={tableState.columns}
 *       tableSize={tableState.tableSize}
 *       updateColumns={tableState.updateColumns}
 *       updateTableSize={tableState.updateTableSize}
 *       refreshData={onRefresh}
 *     >
 *       <Viewer
 *         definition={definition}
 *         dataSource={dataSource}
 *       />
 *     </TableStateContextProvider>
 *   );
 * }
 * ```
 */
export function TableStateContextProvider({
  children,
  ...options
}: TableStateContextOptions) {
  return (
    <TableStateContext.Provider value={options}>
      {children}
    </TableStateContext.Provider>
  );
}

/**
 * Hook to Access Table State Context
 *
 * Provides access to the table state context within components.
 * Must be used within a TableStateContextProvider component tree.
 *
 * @returns Table state context with all table management functions
 * @throws Error if used outside of TableStateContextProvider
 *
 * @example
 * ```tsx
 * import { useTableStateContext } from './TableStateContext';
 *
 * function ColumnVisibilityToggle({ columnId }) {
 *   const { columns, updateColumns } = useTableStateContext();
 *
 *   const column = columns.find(c => c.dataIndex === columnId);
 *   const isVisible = column?.visible ?? true;
 *
 *   const handleToggle = () => {
 *     const updatedColumns = columns.map(c =>
 *       c.dataIndex === columnId
 *         ? { ...c, visible: !isVisible }
 *         : c
 *     );
 *     updateColumns(updatedColumns);
 *   };
 *
 *   return (
 *     <button onClick={handleToggle}>
 *       {isVisible ? 'Hide' : 'Show'} Column
 *     </button>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Table size controls
 * function TableSizeSelector() {
 *   const { tableSize, updateTableSize } = useTableStateContext();
 *
 *   return (
 *     <select
 *       value={tableSize}
 *       onChange={(e) => updateTableSize(e.target.value as SizeType)}
 *     >
 *       <option value="small">Small</option>
 *       <option value="middle">Medium</option>
 *       <option value="large">Large</option>
 *     </select>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Data refresh functionality
 * function RefreshControls() {
 *   const { refreshData } = useTableStateContext();
 *
 *   return (
 *     <div>
 *       <button onClick={refreshData}>Refresh Data</button>
 *       <AutoRefreshToggle />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Error handling pattern
 * function SafeTableComponent() {
 *   try {
 *     const tableState = useTableStateContext();
 *     return <TableUI {...tableState} />;
 *   } catch (error) {
 *     // Handle case where context is not available
 *     console.warn('TableStateContext not found, using defaults');
 *     return <DefaultTable />;
 *   }
 * }
 * ```
 */
export function useTableStateContext(): TableStateContext {
  const context = useContext(TableStateContext);
  if (!context) {
    throw new Error(
      'useTableStateContext must be used within a TableStateContextProvider',
    );
  }
  return context;
}
