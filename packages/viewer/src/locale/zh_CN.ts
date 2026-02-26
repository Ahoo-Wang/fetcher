import { Locale } from './Locale';

const localeValues: Locale = {
  personalView: '个人视图',
  sharedView: '共享视图',

  view: {
    viewName: '视图名称',
    viewType: {
      name: '视图类型',
      personal: '个人',
      shared: '共享'
    }
  },

  filterPanel: {
    addFilterTitle: '添加过滤器',
    searchButtonTitle: '搜索',
  },

  topBar: {
    tableSize: {
      middle: '标准',
      small: '紧凑'
    },
    autoRefresh: {
      title: '自动刷新'
    }
  },

  selectedCountLabel: "已选择 %@ 条数据",
  createViewMethod: {
    create: '创建视图',
    saveAs: '另存为新视图'
  },
  viewPanel: {
    saveButton: '保存',
    cancelButton: '取消',
  }
};

export default localeValues;
