import { Operator } from "@ahoo-wang/fetcher-wow";

/**
 * 标签能力接口
 * 提供标签访问能力
 * - key: viewer.view_definition.Field
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "description": "提供标签访问能力",
 *   "properties": {
 *     "attributes": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.StringObjectMap"
 *         }
 *       ],
 *       "description": "属性映射",
 *       "title": "属性"
 *     },
 *     "label": {
 *       "type": "string",
 *       "description": "标签",
 *       "title": "标签"
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "primaryKey": {
 *       "type": "boolean"
 *     },
 *     "sorter": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.SorterType"
 *         }
 *       ]
 *     }
 *   },
 *   "required": [
 *     "attributes",
 *     "label",
 *     "name",
 *     "primaryKey",
 *     "sorter"
 *   ],
 *   "title": "标签能力接口"
 * }
 * ```
 */
export interface Field {
  /**
   * 属性
   * 属性映射
   */
  attributes: (null | StringObjectMap);
  /**
   * 标签
   * 标签
   */
  label: string;
  name: string;
  type: string;
  primaryKey: boolean;
  sorter: (null | SorterType);
}

/**
 * 活跃过滤器
 * 活跃过滤器类，用于表示当前激活的过滤条件，包含字段、操作符和值等信息
 * - key: viewer.ActiveFilter
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "description": "活跃过滤器类，用于表示当前激活的过滤条件，包含字段、操作符和值等信息",
 *   "properties": {
 *     "conditionOptions": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.StringObjectMap"
 *         }
 *       ]
 *     },
 *     "field": {
 *       "$ref": "#/components/schemas/viewer.FilterField"
 *     },
 *     "label": {
 *       "type": "string",
 *       "description": "标签",
 *       "title": "标签"
 *     },
 *     "operator": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.FilterOperator"
 *         }
 *       ]
 *     },
 *     "type": {
 *       "type": "string",
 *       "description": "类型",
 *       "title": "类型"
 *     },
 *     "value": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.FilterValue"
 *         }
 *       ]
 *     }
 *   },
 *   "required": [
 *     "conditionOptions",
 *     "field",
 *     "label",
 *     "operator",
 *     "type",
 *     "value"
 *   ],
 *   "title": "活跃过滤器"
 * }
 * ```
 */
export interface ActiveFilter {
    conditionOptions: (null | StringObjectMap);
    field: FilterField;
    /**
     * 标签
     * 标签
     */
    label: string;
    operator: (null | FilterOperator);
    /**
     * 类型
     * 类型
     */
    type: string;
    value: (null | FilterValue);
}

/**
 * - key: viewer.ApiVersion
 * - schema:
 * ```json
 * {
 *   "type": "string",
 *   "enum": [
 *     "V2",
 *     "V3"
 *   ]
 * }
 * ```
 */
export enum ApiVersion {
    V2 = `V2`,
    V3 = `V3`
}

/**
 * 可用过滤器
 * 可用过滤器类，用于表示可用的过滤条件
 * - key: viewer.AvailableFilter
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "description": "可用过滤器类，用于表示可用的过滤条件",
 *   "properties": {
 *     "component": {
 *       "type": "string"
 *     },
 *     "field": {
 *       "$ref": "#/components/schemas/viewer.FilterField"
 *     },
 *     "operator": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.FilterOperator"
 *         }
 *       ]
 *     },
 *     "value": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.FilterValue"
 *         }
 *       ]
 *     }
 *   },
 *   "required": [
 *     "component",
 *     "field",
 *     "operator",
 *     "value"
 *   ],
 *   "title": "可用过滤器"
 * }
 * ```
 */
export interface AvailableFilter {
    component: string;
    field: FilterField;
    operator: (null | FilterOperator);
    value: (null | FilterValue);
}

/**
 * 可用过滤器组
 * 可用过滤器组类，用于表示一组可用的过滤条件
 * - key: viewer.AvailableFilterGroup
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "description": "可用过滤器组类，用于表示一组可用的过滤条件",
 *   "properties": {
 *     "filters": {
 *       "type": "array",
 *       "items": {
 *         "$ref": "#/components/schemas/viewer.AvailableFilter"
 *       }
 *     },
 *     "label": {
 *       "type": "string",
 *       "description": "标签",
 *       "title": "标签"
 *     }
 *   },
 *   "required": [
 *     "filters",
 *     "label"
 *   ],
 *   "title": "可用过滤器组"
 * }
 * ```
 */
export interface AvailableFilterGroup {
    filters: AvailableFilter[];
    /**
     * 标签
     * 标签
     */
    label: string;
}

/**
 * 过滤字段
 * 过滤字段类，用于表示过滤的字段信息
 * - key: viewer.FilterField
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "description": "过滤字段类，用于表示过滤的字段信息",
 *   "properties": {
 *     "format": {
 *       "type": [
 *         "string",
 *         "null"
 *       ]
 *     },
 *     "label": {
 *       "type": "string",
 *       "description": "标签",
 *       "title": "标签"
 *     },
 *     "name": {
 *       "type": "string"
 *     },
 *     "type": {
 *       "type": [
 *         "string",
 *         "null"
 *       ],
 *       "description": "可空类型",
 *       "title": "类型"
 *     }
 *   },
 *   "required": [
 *     "format",
 *     "label",
 *     "name",
 *     "type"
 *   ],
 *   "title": "过滤字段"
 * }
 * ```
 */
export interface FilterField {
    format: string | null;
    /**
     * 标签
     * 标签
     */
    label: string;
    name: string;
    /**
     * 类型
     * 可空类型
     */
    type: string | null;
}

/**
 * 过滤操作符
 * 过滤操作符类，用于表示过滤操作符的信息
 * - key: viewer.FilterOperator
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "description": "过滤操作符类，用于表示过滤操作符的信息",
 *   "properties": {
 *     "defaultOperator": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/wow.api.query.Operator"
 *         }
 *       ]
 *     },
 *     "locale": {
 *       "additionalProperties": {
 *         "type": "string"
 *       },
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.StringStringMap"
 *         }
 *       ]
 *     },
 *     "supportedOperators": {
 *       "type": [
 *         "array",
 *         "null"
 *       ],
 *       "items": {
 *         "$ref": "#/components/schemas/wow.api.query.Operator"
 *       }
 *     }
 *   },
 *   "title": "过滤操作符"
 * }
 * ```
 */
export interface FilterOperator {
    defaultOperator: (null | Operator);
    locale: (null | StringStringMap);
    supportedOperators: any | null;
}

/**
 * 过滤值
 * 过滤值类，用于表示过滤值的信息
 * - key: viewer.FilterValue
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "description": "过滤值类，用于表示过滤值的信息",
 *   "properties": {
 *     "className": {
 *       "type": [
 *         "string",
 *         "null"
 *       ],
 *       "description": "CSS类名",
 *       "title": "类名"
 *     },
 *     "defaultValue": {},
 *     "placeholder": {
 *       "type": [
 *         "string",
 *         "null"
 *       ]
 *     },
 *     "style": {
 *       "anyOf": [
 *         {
 *           "type": "null"
 *         },
 *         {
 *           "$ref": "#/components/schemas/viewer.StringObjectMap"
 *         }
 *       ],
 *       "description": "样式映射",
 *       "title": "样式"
 *     }
 *   },
 *   "required": [
 *     "className",
 *     "defaultValue",
 *     "placeholder",
 *     "style"
 *   ],
 *   "title": "过滤值"
 * }
 * ```
 */
export interface FilterValue {
    /**
     * 类名
     * CSS类名
     */
    className: string | null;
    defaultValue: any;
    placeholder: string | null;
    /**
     * 样式
     * 样式映射
     */
    style: (null | StringObjectMap);
}

/**
 * - key: viewer.Link
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "href": {
 *       "type": "string"
 *     },
 *     "templated": {
 *       "type": "boolean"
 *     }
 *   }
 * }
 * ```
 */
export interface Link {
    href: string;
    templated: boolean;
}

/**
 * - key: viewer.SecurityContext
 * - schema:
 * ```json
 * {
 *   "type": "object"
 * }
 * ```
 */
export type SecurityContext = Record<string, any>;

/**
 * 排序类型
 * 排序类型类，用于表示排序的类型信息
 * - key: viewer.SorterType
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "description": "排序类型类，用于表示排序的类型信息",
 *   "properties": {
 *     "multiple": {
 *       "type": "integer",
 *       "format": "int32"
 *     }
 *   },
 *   "required": [
 *     "multiple"
 *   ],
 *   "title": "排序类型"
 * }
 * ```
 */
export interface SorterType {
    /** - format: int32 */
    multiple: number;
}

/**
 * - key: viewer.StringLinkMap
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "additionalProperties": {
 *     "$ref": "#/components/schemas/viewer.Link"
 *   }
 * }
 * ```
 */
export type StringLinkMap = Record<string, Link>;
/**
 * - key: viewer.StringObjectMap
 * - schema:
 * ```json
 * {
 *   "type": "object"
 * }
 * ```
 */
export type StringObjectMap = Record<string, any>;
/**
 * - key: viewer.StringStringMap
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "additionalProperties": {
 *     "type": "string"
 *   }
 * }
 * ```
 */
export type StringStringMap = Record<string, string>;

/**
 * - key: viewer.WebServerNamespace
 * - schema:
 * ```json
 * {
 *   "type": "object",
 *   "properties": {
 *     "value": {
 *       "type": "string"
 *     }
 *   }
 * }
 * ```
 */
export interface WebServerNamespace {
    value: string;
}
