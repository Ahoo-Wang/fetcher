import { createContext, ReactNode, useContext } from 'react';
import { UseTableStateReducerReturn } from './useTableStateReducer';

export type TableStateContext = UseTableStateReducerReturn & {
  refreshData: () => void;
};

export const TableStateContext = createContext<TableStateContext | undefined>(
  undefined,
);

export interface TableStateContextOptions extends TableStateContext {
  children: ReactNode;
}

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

export function useTableStateContext(): TableStateContext {
  const context = useContext(TableStateContext);
  if (!context) {
    throw new Error(
      'useTableStateContext must be used within a TableStateContextProvider',
    );
  }
  return context;
}
