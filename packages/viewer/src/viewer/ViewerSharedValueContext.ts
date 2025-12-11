import { createContext, useContext } from 'react';
import { ViewColumn, ViewDefinition } from './types';

const ViewerSharedValueContext = createContext({
  viewColumns: [] as ViewColumn[],

  setViewColumns: (viewColumns: ViewColumn[]) => {},
});

export const useViewerSharedValue = () => useContext(ViewerSharedValueContext);

export default ViewerSharedValueContext;
