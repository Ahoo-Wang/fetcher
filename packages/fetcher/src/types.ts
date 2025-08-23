export interface BaseURLCapable {
  /**
   * 请求的 baseURL
   * 当值为空时，表示不设置 baseURL，默认值为 undefined
   */
  baseURL: string;
}

export interface HeadersCapable {
  /**
   * 请求头
   */
  headers?: Record<string, string>;
}

/**
 * HTTP方法枚举常量
 */
export enum HttpMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
  PATCH = 'PATCH',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export enum RequestField {
  METHOD = 'method',
  BODY = 'body',
}

export const ContentTypeHeader = 'Content-Type';

export enum ContentTypeValues {
  APPLICATION_JSON = 'application/json',
  TEXT_EVENT_STREAM = 'text/event-stream',
}
