import { FetchExchange, Interceptor } from './interceptor';
import { ContentTypeHeader, ContentTypeValues } from './types';

/**
 * 请求体拦截器，负责将普通对象转换为JSON字符串
 */
export class RequestBodyInterceptor implements Interceptor {
  /**
   * 尝试转换请求体为合法的 fetch API body 类型
   *
   * 根据 Fetch API 规范，body 可以是多种类型，但对于普通对象，需要转换为 JSON 字符串
   * https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#setting_a_body
   *
   * 支持的类型:
   *   - a string
   *   - ArrayBuffer
   *   - TypedArray
   *   - DataView
   *   - Blob
   *   - File
   *   - URLSearchParams
   *   - FormData
   *   - ReadableStream
   *
   * 对于不支持的 object 类型（如普通对象），将自动转换为 JSON 字符串
   *
   * @param exchange
   * @returns 转换后的请求
   */
  intercept(exchange: FetchExchange): FetchExchange {
    const request = exchange.request;
    // 如果没有请求体，直接返回
    if (request.body === undefined || request.body === null) {
      return exchange;
    }

    // 如果请求体不是对象，直接返回
    if (typeof request.body !== 'object') {
      return exchange;
    }

    // 检查是否为支持的类型
    if (
      request.body instanceof ArrayBuffer ||
      ArrayBuffer.isView(request.body) || // 包括 TypedArray 和 DataView
      request.body instanceof Blob ||
      request.body instanceof File ||
      request.body instanceof URLSearchParams ||
      request.body instanceof FormData ||
      request.body instanceof ReadableStream
    ) {
      return exchange;
    }

    // 对于普通对象，转换为 JSON 字符串
    // 同时确保 Content-Type 头部设置为 application/json
    const modifiedRequest = { ...request };
    modifiedRequest.body = JSON.stringify(request.body);

    // 设置 Content-Type 头部
    if (!modifiedRequest.headers) {
      modifiedRequest.headers = {};
    }

    // 只有在没有显式设置 Content-Type 时才设置默认值
    const headers = modifiedRequest.headers as Record<string, string>;
    if (!headers[ContentTypeHeader]) {
      headers[ContentTypeHeader] = ContentTypeValues.APPLICATION_JSON;
    }

    return { ...exchange, request: modifiedRequest };
  }
}
