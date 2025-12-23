import { FilterStateReducerReturn } from './useFilterStateReducer';
import { createContext, ReactNode, useContext } from 'react';

export type FilterStateContext = FilterStateReducerReturn;

export const FilterStateContext = createContext<FilterStateContext | undefined>(
  undefined,
);

export interface FilterStateContextOptions extends FilterStateContext {
  children: ReactNode;
}

export function FilterStateContextProvider({
  children,
  ...options
}: FilterStateContextOptions) {
  return (
    <FilterStateContext.Provider value={{ ...options }}>
      {children}
    </FilterStateContext.Provider>
  );
}

export function useFilterStateContext(): FilterStateContext {
  const context = useContext(FilterStateContext);
  if (!context) {
    throw new Error(
      'useFilterStateContext must be used within a FilterStateContext',
    );
  }
  return context;
}
