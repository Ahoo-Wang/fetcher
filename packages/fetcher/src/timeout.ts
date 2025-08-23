import { FetcherRequest } from './fetcher';
import { FetchExchange } from './interceptor';

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
  exchange: FetchExchange;

  constructor(exchange: FetchExchange, timeout: number) {
    const method = exchange.request?.method || 'GET';
    const message = `Request timeout of ${timeout}ms exceeded for ${method} ${exchange.url}`;
    super(message);
    this.name = 'FetchTimeoutError';
    this.exchange = exchange;

    // 修复原型链
    Object.setPrototypeOf(this, FetchTimeoutError.prototype);
  }
}
