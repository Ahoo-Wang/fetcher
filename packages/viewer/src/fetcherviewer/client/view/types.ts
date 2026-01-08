import { PagedQuery } from "@ahoo-wang/fetcher-wow";
import { ActiveFilter } from '../../../filter';
import { ViewColumn, ViewSource, ViewType } from '../../../viewer';
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
 *   "title": "创建视图",
 *   "description": ""
 * }
 * ```
 */
export interface CreateView {
  columns: ViewColumn[];
  definitionId: string;
  filters: ActiveFilter[];
  name: string;
  /** - format: int32 */
  pageSize: number;
  pagedQuery: PagedQuery;
  /** - format: int32 */
  sort: number;
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
  columns: ViewColumn[];
  definitionId: string;
  filters: ActiveFilter[];
  name: string;
  /** - format: int32 */
  pageSize: number;
  pagedQuery: PagedQuery;
  /** - format: int32 */
  sort: number;
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
 *     "state.columns.name",
 *     "state.columns.sortOrder",
 *     "state.columns.visible",
 *     "state.columns.width",
 *     "state.definitionId",
 *     "state.filters",
 *     "state.filters.conditionOptions",
 *     "state.filters.field",
 *     "state.filters.field.format",
 *     "state.filters.field.label",
 *     "state.filters.field.name",
 *     "state.filters.field.type",
 *     "state.filters.label",
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
 *     "state.name",
 *     "state.pageSize",
 *     "state.pagedQuery",
 *     "state.pagedQuery.condition",
 *     "state.pagedQuery.condition.children",
 *     "state.pagedQuery.condition.children.children",
 *     "state.pagedQuery.condition.children.children.children",
 *     "state.pagedQuery.condition.children.children.field",
 *     "state.pagedQuery.condition.children.children.operator",
 *     "state.pagedQuery.condition.children.children.options",
 *     "state.pagedQuery.condition.children.children.value",
 *     "state.pagedQuery.condition.children.field",
 *     "state.pagedQuery.condition.children.operator",
 *     "state.pagedQuery.condition.children.options",
 *     "state.pagedQuery.condition.children.value",
 *     "state.pagedQuery.condition.field",
 *     "state.pagedQuery.condition.operator",
 *     "state.pagedQuery.condition.options",
 *     "state.pagedQuery.condition.value",
 *     "state.pagedQuery.pagination",
 *     "state.pagedQuery.pagination.index",
 *     "state.pagedQuery.pagination.size",
 *     "state.pagedQuery.projection",
 *     "state.pagedQuery.projection.exclude",
 *     "state.pagedQuery.projection.include",
 *     "state.pagedQuery.sort",
 *     "state.pagedQuery.sort.direction",
 *     "state.pagedQuery.sort.field",
 *     "state.sort",
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
    STATE_COLUMNS_NAME = `state.columns.name`,
    STATE_COLUMNS_SORT_ORDER = `state.columns.sortOrder`,
    STATE_COLUMNS_VISIBLE = `state.columns.visible`,
    STATE_COLUMNS_WIDTH = `state.columns.width`,
    STATE_DEFINITION_ID = `state.definitionId`,
    STATE_FILTERS = `state.filters`,
    STATE_FILTERS_CONDITION_OPTIONS = `state.filters.conditionOptions`,
    STATE_FILTERS_FIELD = `state.filters.field`,
    STATE_FILTERS_FIELD_FORMAT = `state.filters.field.format`,
    STATE_FILTERS_FIELD_LABEL = `state.filters.field.label`,
    STATE_FILTERS_FIELD_NAME = `state.filters.field.name`,
    STATE_FILTERS_FIELD_TYPE = `state.filters.field.type`,
    STATE_FILTERS_LABEL = `state.filters.label`,
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
    STATE_NAME = `state.name`,
    STATE_PAGE_SIZE = `state.pageSize`,
    STATE_PAGED_QUERY = `state.pagedQuery`,
    STATE_PAGED_QUERY_CONDITION = `state.pagedQuery.condition`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN = `state.pagedQuery.condition.children`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_CHILDREN = `state.pagedQuery.condition.children.children`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_CHILDREN_CHILDREN = `state.pagedQuery.condition.children.children.children`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_CHILDREN_FIELD = `state.pagedQuery.condition.children.children.field`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_CHILDREN_OPERATOR = `state.pagedQuery.condition.children.children.operator`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_CHILDREN_OPTIONS = `state.pagedQuery.condition.children.children.options`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_CHILDREN_VALUE = `state.pagedQuery.condition.children.children.value`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_FIELD = `state.pagedQuery.condition.children.field`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_OPERATOR = `state.pagedQuery.condition.children.operator`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_OPTIONS = `state.pagedQuery.condition.children.options`,
    STATE_PAGED_QUERY_CONDITION_CHILDREN_VALUE = `state.pagedQuery.condition.children.value`,
    STATE_PAGED_QUERY_CONDITION_FIELD = `state.pagedQuery.condition.field`,
    STATE_PAGED_QUERY_CONDITION_OPERATOR = `state.pagedQuery.condition.operator`,
    STATE_PAGED_QUERY_CONDITION_OPTIONS = `state.pagedQuery.condition.options`,
    STATE_PAGED_QUERY_CONDITION_VALUE = `state.pagedQuery.condition.value`,
    STATE_PAGED_QUERY_PAGINATION = `state.pagedQuery.pagination`,
    STATE_PAGED_QUERY_PAGINATION_INDEX = `state.pagedQuery.pagination.index`,
    STATE_PAGED_QUERY_PAGINATION_SIZE = `state.pagedQuery.pagination.size`,
    STATE_PAGED_QUERY_PROJECTION = `state.pagedQuery.projection`,
    STATE_PAGED_QUERY_PROJECTION_EXCLUDE = `state.pagedQuery.projection.exclude`,
    STATE_PAGED_QUERY_PROJECTION_INCLUDE = `state.pagedQuery.projection.include`,
    STATE_PAGED_QUERY_SORT = `state.pagedQuery.sort`,
    STATE_PAGED_QUERY_SORT_DIRECTION = `state.pagedQuery.sort.direction`,
    STATE_PAGED_QUERY_SORT_FIELD = `state.pagedQuery.sort.field`,
    STATE_SORT = `state.sort`,
    STATE_SOURCE = `state.source`,
    STATE_TABLE_SIZE = `state.tableSize`,
    STATE_TYPE = `state.type`
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
    columns: ViewColumn[];
    definitionId: string;
    filters: ActiveFilter[];
    name: string;
    /** - format: int32 */
    pageSize: number;
    pagedQuery: PagedQuery;
    /** - format: int32 */
    sort: number;
    source: ViewSource;
    tableSize: string;
    type: ViewType;
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
    columns: ViewColumn[];
    definitionId: string;
    filters: ActiveFilter[];
    name: string;
    /** - format: int32 */
    pageSize: number;
    pagedQuery: PagedQuery;
    /** - format: int32 */
    sort: number;
    source: ViewSource;
    tableSize: string;
    type: ViewType;
}
