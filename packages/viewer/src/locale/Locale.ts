
export interface Locale {
  personalView?: string;
  sharedView?: string;

  view?: {
    viewName?: string;
    viewType?: {
      name?: string;
      personal?: string;
      shared?: string;
    };
  };

  filterPanel?: {
    addFilterTitle?: string;
    searchButtonTitle?: string;
  };
  topBar?: {
    tableSize?: {
      middle?: string;
      small?: string;
    };
    autoRefresh?: {
      title?: string;
    };
  };

  selectedCountLabel?: string;

  createViewMethod?: {
    create?: string;
    saveAs?: string;
  }

  viewPanel?: {
    saveButton?: string;
    cancelButton?: string;
  }
}
