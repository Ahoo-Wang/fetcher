import { FetcherRequest } from './fetcher';

/**
 * 定义具有超时能力的接口
 */
export interface TimeoutCapable {
  /**
   * 请求超时
   * 当值为0时，表示不设置超时，默认值为 undefined
   */
  timeout?: number;
}

/**
 * 解析请求超时设置，优先使用请求级别的超时设置
 *
 * @param requestTimeout - 请求级别的超时设置
 * @param optionsTimeout - 配置级别的超时设置
 * @returns 解析后的超时设置
 */
export function resolveTimeout(
  requestTimeout?: number,
  optionsTimeout?: number,
): number | undefined {
  if (typeof requestTimeout !== 'undefined') {
    return requestTimeout;
  }
  return optionsTimeout;
}

/**
 * FetchTimeoutError 异常类
 * 当HTTP请求超时时抛出此异常
 */
export class FetchTimeoutError extends Error {
  url: string;
  request: FetcherRequest;

  constructor(url: string, request: FetcherRequest, timeout: number) {
    const message = `Request timeout of ${timeout}ms exceeded for ${request?.method || 'GET'} ${url}`;
    super(message);
    this.name = 'FetchTimeoutError';
    this.url = url;
    this.request = request;

    // 修复原型链
    Object.setPrototypeOf(this, FetchTimeoutError.prototype);
  }
}
