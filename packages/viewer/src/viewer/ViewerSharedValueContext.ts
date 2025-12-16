import { createContext, useContext } from 'react';
import { ViewColumn } from './types';
import type { SizeType } from 'antd/es/config-provider/SizeContext';

const ViewerSharedValueContext = createContext({
  aggregateName: '',
  viewName: '',
  viewColumns: [] as ViewColumn[],
  setViewColumns: (viewColumns: ViewColumn[]) => {},

  showFilterPanel: true,
  setShowFilterPanel: (showFilterPanel: boolean) => {},

  refreshData: () => {},

  tableSize: 'middle' as SizeType,
  setTableSize: (size: SizeType) => {},
});

export const useViewerSharedValue = () => useContext(ViewerSharedValueContext);

export default ViewerSharedValueContext;
