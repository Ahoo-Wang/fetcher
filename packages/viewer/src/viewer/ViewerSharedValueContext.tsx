import { createContext, ReactNode, useContext } from 'react';
import { View } from './types';
import { ViewActions } from './Viewer';



export interface ViewerSharedValue {
  aggregateName: string;
  view: View;
  actions: ViewActions;

  showFilterPanel: boolean;
  setShowFilterPanel: (showFilterPanel: boolean) => void;

  refreshData: () => void;
}

export type ViewerSharedValueContext = ViewerSharedValue;

export const ViewerSharedValueContext = createContext<
  ViewerSharedValueContext | undefined
>(undefined);

export interface ViewerSharedValueOptions extends ViewerSharedValue {
  children: ReactNode;
}

export function ViewerSharedValueProvider({
  children,
  ...options
}: ViewerSharedValueOptions) {
  return (
    <ViewerSharedValueContext.Provider value={options}>
      {children}
    </ViewerSharedValueContext.Provider>
  );
}

export function useViewerSharedValue(): ViewerSharedValueContext {
  const context = useContext(ViewerSharedValueContext);
  if (!context) {
    throw new Error('can not load ViewerSharedValueContext');
  }
  return context;
}
