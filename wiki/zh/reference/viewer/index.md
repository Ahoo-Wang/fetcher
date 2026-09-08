---
title: 'Viewer Reference'
description: '@ahoo-wang/fetcher-viewer 5.0.0 API reference'
---

# Viewer

React 19 与 Ant Design 数据视图、保存视图控件及可选 Wow 远端集成。包声明 Node &gt;=18.20.8；浏览器 UI 需要清单声明的 React、Ant Design、Dayjs 和 Fetcher peers，按清单安装兼容版本。View 渲染传入数据，FetcherViewer 要求 viewer 服务契约。

## 安装

```sh
pnpm add @ahoo-wang/fetcher-viewer
```

同时满足 [package.json](https://github.com/Ahoo-Wang/fetcher/blob/main/packages/viewer/package.json#L1) 中的 peerDependencies；包版本基线为 5.0.0。

## 最小示例

```tsx
import { useActiveViewState } from '@ahoo-wang/fetcher-viewer';
export function PageControls() {
  const state = useActiveViewState({
    defaultColumns: [],
    defaultActiveFilters: [],
  });
  return (
    <section>
      <button onClick={() => state.setPage(state.page + 1)}>
        Page {state.page}
      </button>
      <button onClick={state.reset}>Reset</button>
    </section>
  );
}
```

## 专题

- [模型与状态所有权](/zh/reference/viewer/models-and-state)
- [View 与 Viewer 组合](/zh/reference/viewer/view-and-viewer)
- [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views)
- [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer)
- [过滤器与可编辑面板](/zh/reference/viewer/filters)
- [表格、列与单元格](/zh/reference/viewer/tables-and-cells)
- [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs)
- [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale)

## 公开符号索引 {#public-symbols}

| 符号                                      | 专题                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| `ACTIONS_CELL_TYPE`                       | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ACTIONS_CELL_TYPE)                           |
| `ACTION_CELL_TYPE`                        | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ACTION_CELL_TYPE)                            |
| `AVATAR_CELL_TYPE`                        | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-AVATAR_CELL_TYPE)                            |
| `ActionCell`                              | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ActionCell)                                  |
| `ActionCellProps`                         | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ActionCellProps)                             |
| `ActionItem`                              | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ActionItem)                                  |
| `ActionsCell`                             | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ActionsCell)                                 |
| `ActionsCellProps`                        | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ActionsCellProps)                            |
| `ActionsData`                             | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ActionsData)                                 |
| `ActiveFilter`                            | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-ActiveFilter)                                       |
| `AssemblyFilter`                          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AssemblyFilter)                                     |
| `AssemblyFilterProps`                     | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AssemblyFilterProps)                                |
| `AttributesCapable`                       | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-AttributesCapable)                           |
| `AutoRefreshBarItem`                      | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-AutoRefreshBarItem)                    |
| `AutoRefreshBarItemProps`                 | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-AutoRefreshBarItemProps)               |
| `AutoRefreshItem`                         | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-AutoRefreshItem)                       |
| `AvailableFilter`                         | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AvailableFilter)                                    |
| `AvailableFilterGroup`                    | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AvailableFilterGroup)                               |
| `AvailableFilterSelect`                   | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AvailableFilterSelect)                              |
| `AvailableFilterSelectModal`              | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AvailableFilterSelectModal)                         |
| `AvailableFilterSelectProps`              | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AvailableFilterSelectProps)                         |
| `AvailableFilterSelectRef`                | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AvailableFilterSelectRef)                           |
| `AvailableFiltersModalProps`              | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-AvailableFiltersModalProps)                         |
| `AvatarCell`                              | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-AvatarCell)                                  |
| `AvatarCellProps`                         | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-AvatarCellProps)                             |
| `BOOL_FILTER`                             | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-BOOL_FILTER)                                        |
| `BarItem`                                 | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-BarItem)                               |
| `BarItemProps`                            | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-BarItemProps)                          |
| `BatchActionsConfig`                      | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-BatchActionsConfig)                          |
| `BoolFilter`                              | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-BoolFilter)                                         |
| `CALENDAR_CELL_TYPE`                      | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CALENDAR_CELL_TYPE)                          |
| `CURRENCY_CELL_TYPE`                      | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CURRENCY_CELL_TYPE)                          |
| `CalendarFormats`                         | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CalendarFormats)                             |
| `CalendarTimeCell`                        | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CalendarTimeCell)                            |
| `CalendarTimeProps`                       | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CalendarTimeProps)                           |
| `CellComponent`                           | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CellComponent)                               |
| `CellData`                                | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CellData)                                    |
| `CellProps`                               | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CellProps)                                   |
| `CellRenderer`                            | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CellRenderer)                                |
| `CellType`                                | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CellType)                                    |
| `ColumnHeightBarItem`                     | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-ColumnHeightBarItem)                   |
| `ColumnHeightBarItemProps`                | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-ColumnHeightBarItemProps)              |
| `ColumnsCell`                             | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ColumnsCell)                                 |
| `ConditionValueParser`                    | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-ConditionValueParser)                               |
| `CreateView`                              | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-CreateView)                              |
| `CreateViewCommand`                       | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-CreateViewCommand)                       |
| `CurrencyAttributes`                      | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CurrencyAttributes)                          |
| `CurrencyCell`                            | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CurrencyCell)                                |
| `CurrencyCellProps`                       | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CurrencyCellProps)                           |
| `CurrencyFormatOptions`                   | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-CurrencyFormatOptions)                       |
| `DATETIME_CELL_TYPE`                      | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-DATETIME_CELL_TYPE)                          |
| `DEFAULT_CALENDAR_FORMATS`                | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-DEFAULT_CALENDAR_FORMATS)                    |
| `DEFAULT_CONDITION`                       | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-DEFAULT_CONDITION)                           |
| `DEFAULT_CURRENCY_FORMAT_OPTIONS`         | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-DEFAULT_CURRENCY_FORMAT_OPTIONS)             |
| `DEFAULT_DATE_TIME_FORMAT`                | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-DEFAULT_DATE_TIME_FORMAT)                    |
| `DataMonitorBarItem`                      | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-DataMonitorBarItem)                    |
| `DataMonitorBarItemProps`                 | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-DataMonitorBarItemProps)               |
| `DataSourceCapable`                       | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-DataSourceCapable)                           |
| `DateTimeCell`                            | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-DateTimeCell)                                |
| `DateTimeCellProps`                       | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-DateTimeCellProps)                           |
| `EditView`                                | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-EditView)                                |
| `EditViewCommand`                         | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-EditViewCommand)                         |
| `EditableFilterPanel`                     | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-EditableFilterPanel)                                |
| `EditableFilterPanelProps`                | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-EditableFilterPanelProps)                           |
| `ExtendedOperator`                        | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-ExtendedOperator)                                   |
| `FallbackFilter`                          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FallbackFilter)                                     |
| `FetcherViewer`                           | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-FetcherViewer)                           |
| `FetcherViewerProps`                      | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-FetcherViewerProps)                      |
| `FetcherViewerRef`                        | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-FetcherViewerRef)                        |
| `FieldDefinition`                         | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-FieldDefinition)                             |
| `FilterBarItem`                           | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-FilterBarItem)                         |
| `FilterBarItemProps`                      | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-FilterBarItemProps)                    |
| `FilterComponent`                         | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterComponent)                                    |
| `FilterField`                             | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterField)                                        |
| `FilterLabelProps`                        | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterLabelProps)                                   |
| `FilterMode`                              | [View 与 Viewer 组合](/zh/reference/viewer/view-and-viewer#api-FilterMode)                                |
| `FilterOperatorProps`                     | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterOperatorProps)                                |
| `FilterPanel`                             | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterPanel)                                        |
| `FilterPanelConditionCapableRef`          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterPanelConditionCapableRef)                     |
| `FilterPanelProps`                        | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterPanelProps)                                   |
| `FilterPanelRef`                          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterPanelRef)                                     |
| `FilterProps`                             | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterProps)                                        |
| `FilterRef`                               | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterRef)                                          |
| `FilterState`                             | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterState)                                        |
| `FilterType`                              | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterType)                                         |
| `FilterValue`                             | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterValue)                                        |
| `FilterValueConverter`                    | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterValueConverter)                               |
| `FilterValueProps`                        | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-FilterValueProps)                                   |
| `FullScreenProps`                         | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-FullScreenProps)                  |
| `Fullscreen`                              | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-Fullscreen)                       |
| `FullscreenBarItem`                       | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-FullscreenBarItem)                     |
| `FullscreenBarItemProps`                  | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-FullscreenBarItemProps)                |
| `GetRecordCountAction`                    | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-GetRecordCountAction)                        |
| `GetRecordCountActionCapable`             | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-GetRecordCountActionCapable)                 |
| `ID_FILTER`                               | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-ID_FILTER)                                          |
| `IMAGE_CELL_TYPE`                         | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-IMAGE_CELL_TYPE)                             |
| `IMAGE_GROUP_CELL_TYPE`                   | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-IMAGE_GROUP_CELL_TYPE)                       |
| `IdFilter`                                | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-IdFilter)                                           |
| `IdOnOperatorChangeValueConverter`        | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-IdOnOperatorChangeValueConverter)                   |
| `ImageCell`                               | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ImageCell)                                   |
| `ImageCellProps`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ImageCellProps)                              |
| `ImageGroupCell`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ImageGroupCell)                              |
| `ImageGroupCellProps`                     | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ImageGroupCellProps)                         |
| `KeyCapable`                              | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-KeyCapable)                                  |
| `LINK_CELL_TYPE`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-LINK_CELL_TYPE)                              |
| `LinkCell`                                | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-LinkCell)                                    |
| `LinkCellProps`                           | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-LinkCellProps)                               |
| `Locale`                                  | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-Locale)                                |
| `NUMBER_FILTER`                           | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-NUMBER_FILTER)                                      |
| `NumberFilter`                            | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-NumberFilter)                                       |
| `NumberOnOperatorChangeValueConverter`    | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-NumberOnOperatorChangeValueConverter)               |
| `NumberRange`                             | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-NumberRange)                      |
| `NumberRangeProps`                        | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-NumberRangeProps)                 |
| `NumberTagValueItemSerializer`            | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-NumberTagValueItemSerializer)     |
| `OPERATOR_zh_CN`                          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-OPERATOR_zh_CN)                                     |
| `OnChange`                                | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-OnChange)                                           |
| `OnOperatorChangeValueConverter`          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-OnOperatorChangeValueConverter)                     |
| `Optional`                                | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-Optional)                                    |
| `PRIMARY_KEY_CELL_TYPE`                   | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-PRIMARY_KEY_CELL_TYPE)                       |
| `Point`                                   | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-Point)                                 |
| `PrimaryKeyCell`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-PrimaryKeyCell)                              |
| `PrimaryKeyCellProps`                     | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-PrimaryKeyCellProps)                         |
| `PrimaryKeyClickHandlerCapable`           | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-PrimaryKeyClickHandlerCapable)               |
| `ReducerActionCapable`                    | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ReducerActionCapable)                        |
| `RefreshDataBarItem`                      | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-RefreshDataBarItem)                    |
| `RefreshDataBarItemProps`                 | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-RefreshDataBarItemProps)               |
| `RefreshDataEvent`                        | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-RefreshDataEvent)                      |
| `RefreshDataEventBusReturn`               | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-RefreshDataEventBusReturn)             |
| `RemoteSelect`                            | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-RemoteSelect)                     |
| `RemoteSelectProps`                       | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-RemoteSelectProps)                |
| `RemovableTypedFilter`                    | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-RemovableTypedFilter)                               |
| `RemovableTypedFilterProps`               | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-RemovableTypedFilterProps)                          |
| `SELECT_FILTER`                           | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-SELECT_FILTER)                                      |
| `SaveViewMethod`                          | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-SaveViewMethod)                              |
| `SaveViewModal`                           | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-SaveViewModal)                          |
| `SaveViewModalProps`                      | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-SaveViewModalProps)                     |
| `SecurityContext`                         | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-SecurityContext)                         |
| `SelectFilter`                            | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-SelectFilter)                                       |
| `SelectFilterValueProps`                  | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-SelectFilterValueProps)                             |
| `SelectOnOperatorChangeValueConverter`    | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-SelectOnOperatorChangeValueConverter)               |
| `SelectOperator`                          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-SelectOperator)                                     |
| `SelectOperatorLocale`                    | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-SelectOperatorLocale)                               |
| `ShareLinkBarItem`                        | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-ShareLinkBarItem)                      |
| `ShareLinkBarItemProps`                   | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-ShareLinkBarItemProps)                 |
| `StringTagValueItemSerializer`            | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-StringTagValueItemSerializer)     |
| `StyleCapable`                            | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-StyleCapable)                                |
| `TAGS_CELL_TYPE`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TAGS_CELL_TYPE)                              |
| `TAG_CELL_TYPE`                           | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TAG_CELL_TYPE)                               |
| `TEXT_CELL_TYPE`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TEXT_CELL_TYPE)                              |
| `TEXT_FILTER`                             | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-TEXT_FILTER)                                        |
| `TableFieldItem`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TableFieldItem)                              |
| `TableFieldItemProps`                     | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TableFieldItemProps)                         |
| `TableRecordType`                         | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-TableRecordType)                             |
| `TableSettingPanel`                       | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TableSettingPanel)                           |
| `TableSettingPanelProps`                  | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TableSettingPanelProps)                      |
| `TableSettingPanelRef`                    | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TableSettingPanelRef)                        |
| `TableSizeCapable`                        | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-TableSizeCapable)                            |
| `TagCell`                                 | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TagCell)                                     |
| `TagCellProps`                            | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TagCellProps)                                |
| `TagInput`                                | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-TagInput)                         |
| `TagInputProps`                           | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-TagInputProps)                    |
| `TagValueItemSerializer`                  | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-TagValueItemSerializer)           |
| `TagsCell`                                | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TagsCell)                                    |
| `TagsCellProps`                           | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TagsCellProps)                               |
| `TextCell`                                | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TextCell)                                    |
| `TextCellProps`                           | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-TextCellProps)                               |
| `TextFilter`                              | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-TextFilter)                                         |
| `TextOnOperatorChangeValueConverter`      | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-TextOnOperatorChangeValueConverter)                 |
| `TopBar`                                  | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-TopBar)                                |
| `TopBarActionItem`                        | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-TopBarActionItem)                            |
| `TopBarItemProps`                         | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-TopBarItemProps)                       |
| `TopBarProps`                             | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-TopBarProps)                           |
| `TopbarActionsCapable`                    | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-TopbarActionsCapable)                        |
| `TrueValidateValue`                       | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-TrueValidateValue)                                  |
| `TypeCapable`                             | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-TypeCapable)                      |
| `TypedComponentRegistry`                  | [注册表、输入与全屏按钮](/zh/reference/viewer/registries-and-inputs#api-TypedComponentRegistry)           |
| `TypedFilter`                             | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-TypedFilter)                                        |
| `TypedFilterProps`                        | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-TypedFilterProps)                                   |
| `UseActiveViewStateOptions`               | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-UseActiveViewStateOptions)                   |
| `UseActiveViewStateReturn`                | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-UseActiveViewStateReturn)                    |
| `UseFetchDataOptions`                     | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-UseFetchDataOptions)                     |
| `UseFetchDataReturn`                      | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-UseFetchDataReturn)                      |
| `UseFilterStateOptions`                   | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-UseFilterStateOptions)                              |
| `UseFilterStateReturn`                    | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-UseFilterStateReturn)                               |
| `UseLocaleReturn`                         | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-UseLocaleReturn)                       |
| `UseViewStateOptions`                     | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-UseViewStateOptions)                         |
| `UseViewStateReturn`                      | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-UseViewStateReturn)                          |
| `UseViewerDefinitionResult`               | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-UseViewerDefinitionResult)               |
| `UseViewerStateOptions`                   | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-UseViewerStateOptions)                       |
| `UseViewerStateReturn`                    | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-UseViewerStateReturn)                        |
| `UseViewerViewsResult`                    | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-UseViewerViewsResult)                    |
| `VIEWER_BOUNDED_CONTEXT_ALIAS`            | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-VIEWER_BOUNDED_CONTEXT_ALIAS)            |
| `ValidateValue`                           | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-ValidateValue)                                      |
| `ValueInputRender`                        | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-ValueInputRender)                                   |
| `View`                                    | [View 与 Viewer 组合](/zh/reference/viewer/view-and-viewer#api-View)                                      |
| `ViewAggregatedFields`                    | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewAggregatedFields)                    |
| `ViewChangeAction`                        | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewChangeAction)                            |
| `ViewColumn`                              | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewColumn)                                  |
| `ViewCommandClient`                       | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewCommandClient)                       |
| `ViewCommandEndpointPaths`                | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewCommandEndpointPaths)                |
| `ViewCreated`                             | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewCreated)                             |
| `ViewDefinition`                          | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewDefinition)                              |
| `ViewDomainEventType`                     | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewDomainEventType)                     |
| `ViewDomainEventTypeMapTitle`             | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewDomainEventTypeMapTitle)             |
| `ViewEdited`                              | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewEdited)                              |
| `ViewItem`                                | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewItem)                               |
| `ViewItemGroup`                           | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewItemGroup)                          |
| `ViewItemGroupProps`                      | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewItemGroupProps)                     |
| `ViewItemProps`                           | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewItemProps)                          |
| `ViewManageItem`                          | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewManageItem)                         |
| `ViewManageItemProps`                     | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewManageItemProps)                    |
| `ViewManageModal`                         | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewManageModal)                        |
| `ViewManageModalProps`                    | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewManageModalProps)                   |
| `ViewMutationAction`                      | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewMutationAction)                          |
| `ViewMutationActionsCapable`              | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewMutationActionsCapable)                  |
| `ViewPanel`                               | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewPanel)                              |
| `ViewPanelProps`                          | [已保存视图面板与持久化回调](/zh/reference/viewer/saved-views#api-ViewPanelProps)                         |
| `ViewProps`                               | [View 与 Viewer 组合](/zh/reference/viewer/view-and-viewer#api-ViewProps)                                 |
| `ViewRef`                                 | [View 与 Viewer 组合](/zh/reference/viewer/view-and-viewer#api-ViewRef)                                   |
| `ViewSnapshotTarget`                      | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewSnapshotTarget)                      |
| `ViewSource`                              | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewSource)                                  |
| `ViewState`                               | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewState)                                   |
| `ViewStreamCommandClient`                 | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewStreamCommandClient)                 |
| `ViewTable`                               | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ViewTable)                                   |
| `ViewTableActionColumn`                   | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ViewTableActionColumn)                       |
| `ViewTableProps`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ViewTableProps)                              |
| `ViewTableRef`                            | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ViewTableRef)                                |
| `ViewTableSetting`                        | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewTableSetting)                            |
| `ViewTableSettingCapable`                 | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewTableSettingCapable)                     |
| `ViewTableStateReturn`                    | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-ViewTableStateReturn)                        |
| `ViewType`                                | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-ViewType)                                    |
| `Viewer`                                  | [View 与 Viewer 组合](/zh/reference/viewer/view-and-viewer#api-Viewer)                                    |
| `ViewerDefinitionAggregatedFields`        | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewerDefinitionAggregatedFields)        |
| `ViewerDefinitionDomainEventType`         | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewerDefinitionDomainEventType)         |
| `ViewerDefinitionDomainEventTypeMapTitle` | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-ViewerDefinitionDomainEventTypeMapTitle) |
| `ViewerProps`                             | [View 与 Viewer 组合](/zh/reference/viewer/view-and-viewer#api-ViewerProps)                               |
| `ViewerRef`                               | [View 与 Viewer 组合](/zh/reference/viewer/view-and-viewer#api-ViewerRef)                                 |
| `cellRegistry`                            | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-cellRegistry)                                |
| `currentTimeZone`                         | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-currentTimeZone)                                    |
| `deepEqual`                               | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-deepEqual)                                   |
| `filterRegistry`                          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-filterRegistry)                                     |
| `format`                                  | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-format)                                      |
| `formatCurrency`                          | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-formatCurrency)                              |
| `isActionCellProps`                       | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-isActionCellProps)                           |
| `isNullOrUndefined`                       | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-isNullOrUndefined)                           |
| `isValidBetweenValue`                     | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-isValidBetweenValue)                                |
| `isValidImageSrc`                         | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-isValidImageSrc)                             |
| `isValidValue`                            | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-isValidValue)                                       |
| `mapToTableRecord`                        | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-mapToTableRecord)                            |
| `parseDayjs`                              | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-parseDayjs)                                  |
| `typedCellRender`                         | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-typedCellRender)                             |
| `useActiveViewState`                      | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-useActiveViewState)                          |
| `useFetchData`                            | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-useFetchData)                            |
| `useFilterState`                          | [过滤器与可编辑面板](/zh/reference/viewer/filters#api-useFilterState)                                     |
| `useLocale`                               | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-useLocale)                             |
| `useRefreshDataEventBus`                  | [工具栏、刷新与本地化](/zh/reference/viewer/toolbar-and-locale#api-useRefreshDataEventBus)                |
| `useViewState`                            | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-useViewState)                                |
| `useViewTableState`                       | [表格、列与单元格](/zh/reference/viewer/tables-and-cells#api-useViewTableState)                           |
| `useViewerDefinition`                     | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-useViewerDefinition)                     |
| `useViewerState`                          | [模型与状态所有权](/zh/reference/viewer/models-and-state#api-useViewerState)                              |
| `useViewerViews`                          | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-useViewerViews)                          |
| `viewQueryClientFactory`                  | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-viewQueryClientFactory)                  |
| `viewerDefinitionQueryClientFactory`      | [FetcherViewer 远端集成](/zh/reference/viewer/fetcher-viewer#api-viewerDefinitionQueryClientFactory)      |
