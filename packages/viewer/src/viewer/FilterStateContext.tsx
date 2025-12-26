import { FilterStateReducerReturn } from './useFilterStateReducer';
import { createContext, ReactNode, useContext } from 'react';

/**
 * Filter State Context Type
 *
 * Represents the complete filter state management interface provided by the context.
 * This includes active filters, panel visibility, query conditions, and update functions.
 */
export type FilterStateContext = FilterStateReducerReturn;

/**
 * React Context for Filter State Management
 *
 * Provides a centralized way to manage filter state across the viewer component tree.
 * Components can access and modify filter state without prop drilling.
 *
 * @example
 * ```tsx
 * import { useFilterStateContext } from './FilterStateContext';
 *
 * function FilterButton() {
 *   const { showFilterPanel, updateShowFilterPanel } = useFilterStateContext();
 *
 *   return (
 *     <button onClick={() => updateShowFilterPanel(!showFilterPanel)}>
 *       {showFilterPanel ? 'Hide' : 'Show'} Filters
 *     </button>
 *   );
 * }
 * ```
 */
export const FilterStateContext = createContext<FilterStateContext | undefined>(
  undefined,
);

/**
 * Props for the FilterStateContextProvider component.
 *
 * Extends the FilterStateContext interface with React children for component composition.
 */
export interface FilterStateContextOptions extends FilterStateContext {
  /** Child components that will have access to the filter state context */
  children: ReactNode;
}

/**
 * Filter State Context Provider Component
 *
 * Provides filter state management to all descendant components in the React tree.
 * This component should wrap the parts of your application that need access to filter state.
 *
 * @param props - Provider configuration and child components
 * @param props.children - Components that will have access to filter state
 * @param props.activeFilters - Current active filter configurations
 * @param props.showFilterPanel - Whether the filter panel is visible
 * @param props.queryCondition - Current query condition for data filtering
 * @param props.updateActiveFilters - Function to update active filters
 * @param props.updateShowFilterPanel - Function to toggle filter panel visibility
 * @param props.updateQueryCondition - Function to update query conditions
 *
 * @example
 * ```tsx
 * import { FilterStateContextProvider } from './FilterStateContext';
 * import { useFilterState } from './useFilterStateReducer';
 *
 * function App() {
 *   // Initialize filter state management
 *   const filterState = useFilterState({
 *     initialFilters: [],
 *     initialCondition: {}
 *   });
 *
 *   return (
 *     <FilterStateContextProvider
 *       activeFilters={filterState.activeFilters}
 *       showFilterPanel={filterState.showFilterPanel}
 *       queryCondition={filterState.queryCondition}
 *       updateActiveFilters={filterState.updateActiveFilters}
 *       updateShowFilterPanel={filterState.updateShowFilterPanel}
 *       updateQueryCondition={filterState.updateQueryCondition}
 *     >
 *       <FilterableDataTable />
 *       <FilterPanel />
 *     </FilterStateContextProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Integration with Viewer component
 * function DataViewer({ definition, dataSource }) {
 *   const filterState = useFilterState({
 *     initialFilters: definition.filters || [],
 *     initialCondition: definition.condition || {}
 *   });
 *
 *   return (
 *     <FilterStateContextProvider {...filterState}>
 *       <Viewer
 *         definition={definition}
 *         dataSource={dataSource}
 *       />
 *     </FilterStateContextProvider>
 *   );
 * }
 * ```
 */
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

/**
 * Hook to Access Filter State Context
 *
 * Provides access to the filter state context within components.
 * Must be used within a FilterStateContextProvider component tree.
 *
 * @returns Filter state context with all filter management functions
 * @throws Error if used outside of FilterStateContextProvider
 *
 * @example
 * ```tsx
 * import { useFilterStateContext } from './FilterStateContext';
 *
 * function FilterControls() {
 *   const {
 *     activeFilters,
 *     showFilterPanel,
 *     queryCondition,
 *     updateActiveFilters,
 *     updateShowFilterPanel,
 *     updateQueryCondition
 *   } = useFilterStateContext();
 *
 *   const handleAddFilter = (newFilter) => {
 *     updateActiveFilters([...activeFilters, newFilter]);
 *   };
 *
 *   const handleTogglePanel = () => {
 *     updateShowFilterPanel(!showFilterPanel);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleTogglePanel}>
 *         {showFilterPanel ? 'Hide' : 'Show'} Filters
 *       </button>
 *       <FilterList
 *         filters={activeFilters}
 *         onAddFilter={handleAddFilter}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Error handling pattern
 * function SafeFilterComponent() {
 *   try {
 *     const filterState = useFilterStateContext();
 *     return <FilterUI {...filterState} />;
 *   } catch (error) {
 *     // Handle case where context is not available
 *     console.warn('FilterStateContext not found, using defaults');
 *     return <DefaultFilterUI />;
 *   }
 * }
 * ```
 */
export function useFilterStateContext(): FilterStateContext {
  const context = useContext(FilterStateContext);
  if (!context) {
    throw new Error(
      'useFilterStateContext must be used within a FilterStateContext',
    );
  }
  return context;
}
