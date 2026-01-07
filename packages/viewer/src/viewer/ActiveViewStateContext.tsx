import { ActiveViewStateReducerReturn } from './useActiveViewStateReducer';
import { createContext, ReactNode, useContext } from 'react';

export type ActiveViewStateContext = ActiveViewStateReducerReturn;

export const ActiveViewStateContext = createContext<
  ActiveViewStateContext | undefined
>(undefined);

export interface ActiveViewStateContextOptions extends ActiveViewStateContext {
  children: ReactNode;
}

export function ActiveViewStateContextProvider({
  children,
  ...options
}: ActiveViewStateContextOptions) {
  return (
    <ActiveViewStateContext.Provider value={{ ...options }}>
      {children}
    </ActiveViewStateContext.Provider>
  );
}

export function useActiveViewStateContext(): ActiveViewStateContext {
  const context = useContext(ActiveViewStateContext);
  if (!context) {
    throw new Error(
      'useActiveViewStateContext must be used within a ActiveViewStateContextProvider',
    );
  }
  return context;
}
