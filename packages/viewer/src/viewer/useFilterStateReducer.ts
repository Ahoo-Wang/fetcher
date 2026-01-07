import { ReducerActionCapable } from '../types';
import { useCallback, useReducer } from 'react';

/**
 * Filter State Interface
 *
 * Represents the complete state of the filter system including active filters,
 * query conditions, and UI panel visibility.
 */
export interface FilterState {
  /** Whether the filter panel is currently visible */
  showFilterPanel: boolean;
}

/**
 * Filter State Reducer Action Types
 *
 * Defines the available actions that can be dispatched to update filter state.
 */
export type FilterStateReducerActionType =
  | 'UPDATE_ACTIVE_FILTERS' // Update the list of active filters
  | 'UPDATE_SHOW_FILTER_PANEL' // Show/hide the filter panel
  | 'UPDATE_QUERY_CONDITION'; // Update the query condition

/**
 * Filter State Reducer Action Interface
 *
 * Extends the base reducer action interface with filter-specific action types.
 */
export interface FilterStateReducerAction extends ReducerActionCapable<FilterStateReducerActionType> {}

/**
 * Filter State Reducer Return Interface
 *
 * Defines the return type of the useFilterStateReducer hook, providing
 * access to current state and state update functions.
 */
export interface FilterStateReducerReturn {
  /** Current filter panel visibility state */
  showFilterPanel: boolean;
  /** Function to show/hide the filter panel */
  updateShowFilterPanel: (showFilterPanel: boolean) => void;
}

/**
 * Filter State Reducer Function
 *
 * Pure reducer function that handles state updates for the filter system.
 * Processes actions to update different aspects of filter state immutably.
 *
 * @param state - Current filter state
 * @param action - Action to process with type and payload
 * @returns New filter state after applying the action
 */
const filterStateReducer = (
  state: FilterState,
  action: FilterStateReducerAction,
): FilterState => {
  switch (action.type) {
    case 'UPDATE_SHOW_FILTER_PANEL':
      return { ...state, showFilterPanel: action.payload };
    default:
      return state;
  }
};

/**
 * Filter State Reducer Hook
 *
 * Custom React hook that provides filter state management using useReducer.
 * Manages active filters, query conditions, and filter panel visibility with
 * optimized callback functions for performance.
 *
 * @param state - Initial filter state configuration
 * @param state.activeFilters - Initial array of active filters
 * @param state.queryCondition - Initial query condition
 * @param state.showFilterPanel - Initial filter panel visibility
 * @returns Filter state management interface with current state and update functions
 *
 * @example
 * ```tsx
 * import { useFilterStateReducer } from './useFilterStateReducer';
 * import type { ActiveFilter } from '../filter';
 * import type { Condition } from '@ahoo-wang/fetcher-wow';
 *
 * function FilterableComponent() {
 *   const filterState = useFilterStateReducer({
 *     activeFilters: [],
 *     queryCondition: {},
 *     showFilterPanel: false
 *   });
 *
 *   const {
 *     activeFilters,
 *     showFilterPanel,
 *     queryCondition,
 *     updateActiveFilters,
 *     updateShowFilterPanel,
 *     updateQueryCondition
 *   } = filterState;
 *
 *   const handleAddFilter = (newFilter: ActiveFilter) => {
 *     updateActiveFilters([...activeFilters, newFilter]);
 *   };
 *
 *   const handleTogglePanel = () => {
 *     updateShowFilterPanel(!showFilterPanel);
 *   };
 *
 *   const handleConditionChange = (newCondition: Condition) => {
 *     updateQueryCondition(newCondition);
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleTogglePanel}>
 *         {showFilterPanel ? 'Hide' : 'Show'} Filters
 *       </button>
 *       <FilterPanel
 *         filters={activeFilters}
 *         onChange={updateActiveFilters}
 *         visible={showFilterPanel}
 *       />
 *       <DataTable
 *         condition={queryCondition}
 *         onConditionChange={handleConditionChange}
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
 *   const filterState = useFilterStateReducer({
 *     activeFilters: viewDefinition.filters || [],
 *     queryCondition: viewDefinition.condition || {},
 *     showFilterPanel: false
 *   });
 *
 *   // Use filter state in Viewer
 *   return (
 *     <FilterStateContextProvider {...filterState}>
 *       <Viewer definition={viewDefinition} />
 *     </FilterStateContextProvider>
 *   );
 * }
 * ```
 *
 * @example
 * ```tsx
 * // Advanced filter management
 * function AdvancedFilterManager() {
 *   const filterState = useFilterStateReducer({
 *     activeFilters: [],
 *     queryCondition: {},
 *     showFilterPanel: true
 *   });
 *
 *   const clearAllFilters = useCallback(() => {
 *     filterState.updateActiveFilters([]);
 *     filterState.updateQueryCondition({});
 *   }, [filterState]);
 *
 *   const hasActiveFilters = filterState.activeFilters.length > 0;
 *
 *   return (
 *     <div>
 *       <FilterControls
 *         filters={filterState.activeFilters}
 *         onChange={filterState.updateActiveFilters}
 *         visible={filterState.showFilterPanel}
 *         onToggle={filterState.updateShowFilterPanel}
 *       />
 *       {hasActiveFilters && (
 *         <button onClick={clearAllFilters}>
 *           Clear All Filters ({filterState.activeFilters.length})
 *         </button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useFilterStateReducer(
  state: FilterState,
): FilterStateReducerReturn {
  /**
   * useReducer hook for managing filter state.
   *
   * Uses a reducer pattern for predictable state updates and better performance
   * with complex state transitions. The reducer ensures immutable state updates.
   */
  const [filterState, dispatch] = useReducer<
    FilterState,
    [FilterStateReducerAction]
  >(filterStateReducer, state);

  /**
   * Update filter panel visibility callback.
   *
   * Memoized with useCallback for performance. Controls whether the filter panel
   * is shown or hidden in the UI.
   */
  const updateShowFilterPanel = useCallback((showFilterPanel: boolean) => {
    dispatch({ type: 'UPDATE_SHOW_FILTER_PANEL', payload: showFilterPanel });
  }, []);

  /**
   * Return the complete filter state management interface.
   *
   * Provides current state values and memoized update functions for optimal performance.
   */
  return {
    showFilterPanel: filterState.showFilterPanel,
    updateShowFilterPanel,
  };
}
