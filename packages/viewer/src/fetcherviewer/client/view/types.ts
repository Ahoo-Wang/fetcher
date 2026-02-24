import { Condition, FieldSort } from '@ahoo-wang/fetcher-wow';
import { ActiveFilter, ViewColumn, ViewSource } from '../../../';
import { SizeType } from 'antd/es/config-provider/SizeContext';

/**
 * 创建视图
 * - key: viewer.view.CreateView
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "columns": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.view.ViewColumn"
 *       }
 *     },
 *     "condition": {
 *       "$ref": "#/components/schemas/wow.api.query.Condition"
 *     },
 *     "definitionId": {
 *       "type": "string"
 *     },
 *     "filters": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.ActiveFilter"
 *       }
 *     },
 *     "internalCondition": {
 *       "$ref": "#/components/schemas/wow.api.query.Condition"
 *     },
 *     "isDefault": {
 *       "type": "boolean"
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "pageSize": {
 *       "type": "integer",
 *       "format": "int32"
 *     },
 *     "sorter": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.view.SorterResult"
 *       }
 *     },
 *     "source": {
 *       "$ref": "#/components/schemas/viewer.view.ViewSource"
 *     },
 *     "tableSize": {
 *       "type": "string"
 *     }
 *   },
 *   "required": [
 *     "columns",
 *     "condition",
 *     "definitionId",
 *     "filters",
 *     "internalCondition",
 *     "isDefault",
 *     "name",
 *     "pageSize",
 *     "sorter",
 *     "source",
 *     "tableSize"
 *   ],
 *   "title": "创建视图",
 *   "description": ""
 * }
 * ```
 */
export interface CreateView {
  name: string;
  definitionId: string;
  columns: ViewColumn[];
  filters: ActiveFilter[];
  isDefault: boolean;
  condition?: Condition;
  internalCondition?: Condition;
  pageSize: number;
  sorter?: FieldSort[];
  source: ViewSource;
  tableSize: SizeType;
}

/**
 * 修改视图
 * - key: viewer.view.EditView
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "columns": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.view.ViewColumn"
 *       }
 *     },
 *     "definitionId": {
 *       "type": "string"
 *     },
 *     "filters": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.ActiveFilter"
 *       }
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "pageSize": {
 *       "type": "integer",
 *       "format": "int32"
 *     },
 *     "pagedQuery": {
 *       "$ref": "#/components/schemas/wow.api.query.PagedQuery"
 *     },
 *     "sort": {
 *       "type": "integer",
 *       "format": "int32"
 *     },
 *     "source": {
 *       "$ref": "#/components/schemas/viewer.view.ViewSource"
 *     },
 *     "tableSize": {
 *       "type": "string"
 *     }
 *   },
 *   "required": [
 *     "columns",
 *     "definitionId",
 *     "filters",
 *     "name",
 *     "pageSize",
 *     "pagedQuery",
 *     "sort",
 *     "source",
 *     "tableSize"
 *   ],
 *   "title": "修改视图",
 *   "description": ""
 * }
 * ```
 */
export interface EditView {
  name: string;
  definitionId: string;
  columns: ViewColumn[];
  filters: ActiveFilter[];
  isDefault: boolean;
  condition?: Condition;
  internalCondition?: Condition;
  pageSize: number;
  sorter?: FieldSort[];
  source: ViewSource;
  tableSize: SizeType;
}

/**
 * 视图已创建
 * - key: viewer.view.ViewCreated
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "columns": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.view.ViewColumn"
 *       }
 *     },
 *     "definitionId": {
 *       "type": "string"
 *     },
 *     "filters": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.ActiveFilter"
 *       }
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "pageSize": {
 *       "type": "integer",
 *       "format": "int32"
 *     },
 *     "pagedQuery": {
 *       "$ref": "#/components/schemas/wow.api.query.PagedQuery"
 *     },
 *     "sort": {
 *       "type": "integer",
 *       "format": "int32"
 *     },
 *     "source": {
 *       "$ref": "#/components/schemas/viewer.view.ViewSource"
 *     },
 *     "tableSize": {
 *       "type": "string"
 *     },
 *     "type": {
 *       "$ref": "#/components/schemas/viewer.view.ViewType"
 *     }
 *   },
 *   "required": [
 *     "columns",
 *     "definitionId",
 *     "filters",
 *     "name",
 *     "pageSize",
 *     "pagedQuery",
 *     "sort",
 *     "source",
 *     "tableSize",
 *     "type"
 *   ],
 *   "title": "视图已创建"
 * }
 * ```
 */
export interface ViewCreated {
  name: string;
  definitionId: string;
  columns: ViewColumn[];
  filters: ActiveFilter[];
  isDefault: boolean;
  condition: Condition;
  internalCondition: Condition;
  pageSize: number;
  sorter: FieldSort[];
  source: ViewSource;
  tableSize: SizeType;
}

/**
 * 视图已修改
 * - key: viewer.view.ViewEdited
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "columns": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.view.ViewColumn"
 *       }
 *     },
 *     "definitionId": {
 *       "type": "string"
 *     },
 *     "filters": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.ActiveFilter"
 *       }
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "pageSize": {
 *       "type": "integer",
 *       "format": "int32"
 *     },
 *     "pagedQuery": {
 *       "$ref": "#/components/schemas/wow.api.query.PagedQuery"
 *     },
 *     "sort": {
 *       "type": "integer",
 *       "format": "int32"
 *     },
 *     "source": {
 *       "$ref": "#/components/schemas/viewer.view.ViewSource"
 *     },
 *     "tableSize": {
 *       "type": "string"
 *     },
 *     "type": {
 *       "$ref": "#/components/schemas/viewer.view.ViewType"
 *     }
 *   },
 *   "required": [
 *     "columns",
 *     "definitionId",
 *     "filters",
 *     "name",
 *     "pageSize",
 *     "pagedQuery",
 *     "sort",
 *     "source",
 *     "tableSize",
 *     "type"
 *   ],
 *   "title": "视图已修改"
 * }
 * ```
 */
export interface ViewEdited {
  name: string;
  definitionId: string;
  columns: ViewColumn[];
  filters: ActiveFilter[];
  isDefault: boolean;
  condition: Condition;
  internalCondition: Condition;
  pageSize: number;
  sorter: FieldSort[];
  source: ViewSource;
  tableSize: SizeType;
}

/**
 * - key: viewer.view.ViewAggregatedFields
 * - schema:
 * ```json
 * {
 *   "type": "string",
 *   "enum": [
 *     "",
 *     "aggregateId",
 *     "tenantId",
 *     "ownerId",
 *     "version",
 *     "eventId",
 *     "firstOperator",
 *     "operator",
 *     "firstEventTime",
 *     "eventTime",
 *     "deleted",
 *     "state",
 *     "state.columns",
 *     "state.columns.fixed",
 *     "state.columns.hidden",
 *     "state.columns.name",
 *     "state.columns.sortOrder",
 *     "state.columns.width",
 *     "state.condition",
 *     "state.condition.children",
 *     "state.condition.children.children",
 *     "state.condition.children.children.children",
 *     "state.condition.children.children.children.children",
 *     "state.condition.children.children.children.field",
 *     "state.condition.children.children.children.operator",
 *     "state.condition.children.children.children.options",
 *     "state.condition.children.children.children.value",
 *     "state.condition.children.children.field",
 *     "state.condition.children.children.operator",
 *     "state.condition.children.children.options",
 *     "state.condition.children.children.value",
 *     "state.condition.children.field",
 *     "state.condition.children.operator",
 *     "state.condition.children.options",
 *     "state.condition.children.value",
 *     "state.condition.field",
 *     "state.condition.operator",
 *     "state.condition.options",
 *     "state.condition.value",
 *     "state.definitionId",
 *     "state.filters",
 *     "state.filters.conditionOptions",
 *     "state.filters.field",
 *     "state.filters.field.format",
 *     "state.filters.field.label",
 *     "state.filters.field.name",
 *     "state.filters.field.type",
 *     "state.filters.key",
 *     "state.filters.label",
 *     "state.filters.label.className",
 *     "state.filters.label.style",
 *     "state.filters.operator",
 *     "state.filters.operator.defaultOperator",
 *     "state.filters.operator.locale",
 *     "state.filters.operator.supportedOperators",
 *     "state.filters.type",
 *     "state.filters.value",
 *     "state.filters.value.className",
 *     "state.filters.value.defaultValue",
 *     "state.filters.value.placeholder",
 *     "state.filters.value.style",
 *     "state.id",
 *     "state.internalCondition",
 *     "state.internalCondition.children",
 *     "state.internalCondition.children.children",
 *     "state.internalCondition.children.children.children",
 *     "state.internalCondition.children.children.children.children",
 *     "state.internalCondition.children.children.children.field",
 *     "state.internalCondition.children.children.children.operator",
 *     "state.internalCondition.children.children.children.options",
 *     "state.internalCondition.children.children.children.value",
 *     "state.internalCondition.children.children.field",
 *     "state.internalCondition.children.children.operator",
 *     "state.internalCondition.children.children.options",
 *     "state.internalCondition.children.children.value",
 *     "state.internalCondition.children.field",
 *     "state.internalCondition.children.operator",
 *     "state.internalCondition.children.options",
 *     "state.internalCondition.children.value",
 *     "state.internalCondition.field",
 *     "state.internalCondition.operator",
 *     "state.internalCondition.options",
 *     "state.internalCondition.value",
 *     "state.isDefault",
 *     "state.name",
 *     "state.pageSize",
 *     "state.sorter",
 *     "state.sorter.columnKey",
 *     "state.sorter.field",
 *     "state.sorter.order",
 *     "state.source",
 *     "state.tableSize",
 *     "state.type"
 *   ]
 * }
 * ```
 */
export enum ViewAggregatedFields {
  AGGREGATE_ID = `aggregateId`,
  TENANT_ID = `tenantId`,
  OWNER_ID = `ownerId`,
  VERSION = `version`,
  EVENT_ID = `eventId`,
  FIRST_OPERATOR = `firstOperator`,
  OPERATOR = `operator`,
  FIRST_EVENT_TIME = `firstEventTime`,
  EVENT_TIME = `eventTime`,
  DELETED = `deleted`,
  STATE = `state`,
  STATE_COLUMNS = `state.columns`,
  STATE_COLUMNS_FIXED = `state.columns.fixed`,
  STATE_COLUMNS_HIDDEN = `state.columns.hidden`,
  STATE_COLUMNS_NAME = `state.columns.name`,
  STATE_COLUMNS_SORT_ORDER = `state.columns.sortOrder`,
  STATE_COLUMNS_WIDTH = `state.columns.width`,
  STATE_CONDITION = `state.condition`,
  STATE_CONDITION_CHILDREN = `state.condition.children`,
  STATE_CONDITION_CHILDREN_CHILDREN = `state.condition.children.children`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN = `state.condition.children.children.children`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_CHILDREN = `state.condition.children.children.children.children`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_FIELD = `state.condition.children.children.children.field`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_OPERATOR = `state.condition.children.children.children.operator`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_OPTIONS = `state.condition.children.children.children.options`,
  STATE_CONDITION_CHILDREN_CHILDREN_CHILDREN_VALUE = `state.condition.children.children.children.value`,
  STATE_CONDITION_CHILDREN_CHILDREN_FIELD = `state.condition.children.children.field`,
  STATE_CONDITION_CHILDREN_CHILDREN_OPERATOR = `state.condition.children.children.operator`,
  STATE_CONDITION_CHILDREN_CHILDREN_OPTIONS = `state.condition.children.children.options`,
  STATE_CONDITION_CHILDREN_CHILDREN_VALUE = `state.condition.children.children.value`,
  STATE_CONDITION_CHILDREN_FIELD = `state.condition.children.field`,
  STATE_CONDITION_CHILDREN_OPERATOR = `state.condition.children.operator`,
  STATE_CONDITION_CHILDREN_OPTIONS = `state.condition.children.options`,
  STATE_CONDITION_CHILDREN_VALUE = `state.condition.children.value`,
  STATE_CONDITION_FIELD = `state.condition.field`,
  STATE_CONDITION_OPERATOR = `state.condition.operator`,
  STATE_CONDITION_OPTIONS = `state.condition.options`,
  STATE_CONDITION_VALUE = `state.condition.value`,
  STATE_DEFINITION_ID = `state.definitionId`,
  STATE_FILTERS = `state.filters`,
  STATE_FILTERS_CONDITION_OPTIONS = `state.filters.conditionOptions`,
  STATE_FILTERS_FIELD = `state.filters.field`,
  STATE_FILTERS_FIELD_FORMAT = `state.filters.field.format`,
  STATE_FILTERS_FIELD_LABEL = `state.filters.field.label`,
  STATE_FILTERS_FIELD_NAME = `state.filters.field.name`,
  STATE_FILTERS_FIELD_TYPE = `state.filters.field.type`,
  STATE_FILTERS_KEY = `state.filters.key`,
  STATE_FILTERS_LABEL = `state.filters.label`,
  STATE_FILTERS_LABEL_CLASS_NAME = `state.filters.label.className`,
  STATE_FILTERS_LABEL_STYLE = `state.filters.label.style`,
  STATE_FILTERS_OPERATOR = `state.filters.operator`,
  STATE_FILTERS_OPERATOR_DEFAULT_OPERATOR = `state.filters.operator.defaultOperator`,
  STATE_FILTERS_OPERATOR_LOCALE = `state.filters.operator.locale`,
  STATE_FILTERS_OPERATOR_SUPPORTED_OPERATORS = `state.filters.operator.supportedOperators`,
  STATE_FILTERS_TYPE = `state.filters.type`,
  STATE_FILTERS_VALUE = `state.filters.value`,
  STATE_FILTERS_VALUE_CLASS_NAME = `state.filters.value.className`,
  STATE_FILTERS_VALUE_DEFAULT_VALUE = `state.filters.value.defaultValue`,
  STATE_FILTERS_VALUE_PLACEHOLDER = `state.filters.value.placeholder`,
  STATE_FILTERS_VALUE_STYLE = `state.filters.value.style`,
  STATE_ID = `state.id`,
  STATE_INTERNAL_CONDITION = `state.internalCondition`,
  STATE_INTERNAL_CONDITION_CHILDREN = `state.internalCondition.children`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN = `state.internalCondition.children.children`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN = `state.internalCondition.children.children.children`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_CHILDREN = `state.internalCondition.children.children.children.children`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_FIELD = `state.internalCondition.children.children.children.field`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_OPERATOR = `state.internalCondition.children.children.children.operator`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_OPTIONS = `state.internalCondition.children.children.children.options`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_CHILDREN_VALUE = `state.internalCondition.children.children.children.value`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_FIELD = `state.internalCondition.children.children.field`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_OPERATOR = `state.internalCondition.children.children.operator`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_OPTIONS = `state.internalCondition.children.children.options`,
  STATE_INTERNAL_CONDITION_CHILDREN_CHILDREN_VALUE = `state.internalCondition.children.children.value`,
  STATE_INTERNAL_CONDITION_CHILDREN_FIELD = `state.internalCondition.children.field`,
  STATE_INTERNAL_CONDITION_CHILDREN_OPERATOR = `state.internalCondition.children.operator`,
  STATE_INTERNAL_CONDITION_CHILDREN_OPTIONS = `state.internalCondition.children.options`,
  STATE_INTERNAL_CONDITION_CHILDREN_VALUE = `state.internalCondition.children.value`,
  STATE_INTERNAL_CONDITION_FIELD = `state.internalCondition.field`,
  STATE_INTERNAL_CONDITION_OPERATOR = `state.internalCondition.operator`,
  STATE_INTERNAL_CONDITION_OPTIONS = `state.internalCondition.options`,
  STATE_INTERNAL_CONDITION_VALUE = `state.internalCondition.value`,
  STATE_IS_DEFAULT = `state.isDefault`,
  STATE_NAME = `state.name`,
  STATE_PAGE_SIZE = `state.pageSize`,
  STATE_SORTER = `state.sorter`,
  STATE_SORTER_COLUMN_KEY = `state.sorter.columnKey`,
  STATE_SORTER_FIELD = `state.sorter.field`,
  STATE_SORTER_ORDER = `state.sorter.order`,
  STATE_SOURCE = `state.source`,
  STATE_TABLE_SIZE = `state.tableSize`,
  STATE_TYPE = `state.type`,
}
