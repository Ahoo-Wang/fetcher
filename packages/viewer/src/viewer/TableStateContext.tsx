/**
 * Context for managing table state including column visibility, table size, and related actions.
 *
 * This context provides access to table configuration and state management functions
 * that are consumed by various table components in the viewer package.
 *
 * @example
 * ```tsx
 * // Provider usage
 * <TableStateContextProvider
 *   columns={columns}
 *   tableSize={tableSize}
 *   updateColumns={updateColumns}
 *   updateTableSize={updateTableSize}
 * >
 *   <ViewTable {...props} />
 * </TableStateContextProvider>
 * ```
 */
import { createContext, ReactNode, useContext } from 'react';
import { UseTableStateReducerReturn } from './useTableStateReducer';

/**
 * Type representing the table state context values.
 * Extends UseTableStateReducerReturn with optional refreshData function.
 */
export type TableStateContext = UseTableStateReducerReturn & {
  refreshData?: () => void;
};

/**
 * React context for sharing table state across components.
 * This context is used to provide column configuration, table size settings,
 * and state update functions to child components.
 */
export const TableStateContext = createContext<TableStateContext | undefined>(
  undefined,
);

/**
 * Props for the TableStateContextProvider component.
 * Extends TableStateContext with children prop for React node composition.
 */
export interface TableStateContextOptions extends TableStateContext {
  children: ReactNode;
}

/**
 * Provider component that wraps table components with the table state context.
 *
 * This provider makes table configuration and state management functions
 * available to descendant components through React's context API.
 *
 * @param props - The props for the provider
 * @param props.children - The child components that will consume the context
 * @param props.columns - Current column configuration
 * @param props.tableSize - Current table size setting
 * @param props.updateColumns - Function to update column configuration
 * @param props.updateTableSize - Function to update table size
 * @param props.refreshData - Optional function to refresh table data
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
 * Custom hook to access the table state context.
 *
 * This hook provides convenient access to table configuration and state management
 * functions throughout the component hierarchy.
 *
 * @returns The current table state context values
 * @throws Error if used outside of a TableStateContextProvider
 *
 * @example
 * ```tsx
 * const { columns, tableSize, updateColumns, updateTableSize } = useTableStateContext();
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
