import { UrlBuilder } from './urlBuilder';
import { FetchTimeoutError, resolveTimeout, TimeoutCapable } from './timeout';
import {
  BaseURLCapable,
  ContentTypeHeader,
  ContentTypeValues,
  HeadersCapable,
  HttpMethod,
  RequestField,
} from './types';
import { FetcherInterceptors, FetchExchange } from './interceptor';
import { RequestBodyInterceptor } from './requestBodyInterceptor';

/**
 * Fetcher配置选项接口
 */
export interface FetcherOptions
  extends BaseURLCapable,
    HeadersCapable,
    TimeoutCapable {
}

const defaultHeaders: Record<string, string> = {
  [ContentTypeHeader]: ContentTypeValues.APPLICATION_JSON,
};

const defaultOptions: FetcherOptions = {
  baseURL: '',
  headers: defaultHeaders,
};

/**
 * Fetcher请求选项接口
 */
export interface FetcherRequest
  extends TimeoutCapable,
    Omit<RequestInit, 'body'> {
  pathParams?: Record<string, any>;
  queryParams?: Record<string, any>;
  body?: BodyInit | Record<string, any> | null;
}

/**
 * HTTP请求客户端类，支持URL构建、超时控制等功能
 *
 * @example
 * const fetcher = new Fetcher({ baseURL: 'https://api.example.com' });
 * const response = await fetcher.fetch('/users/{id}', {
 *   pathParams: { id: 123 },
 *   queryParams: { filter: 'active' },
 *   timeout: 5000
 * });
 */
export class Fetcher implements HeadersCapable, TimeoutCapable {
  headers?: Record<string, string> = defaultHeaders;
  timeout?: number;
  private urlBuilder: UrlBuilder;
  interceptors: FetcherInterceptors = new FetcherInterceptors();

  /**
   * 创建Fetcher实例
   *
   * @param options - Fetcher配置选项
   */
  constructor(options: FetcherOptions = defaultOptions) {
    this.urlBuilder = new UrlBuilder(options.baseURL);
    if (options.headers !== undefined) {
      this.headers = options.headers;
    }
    this.timeout = options.timeout;
    this.interceptors.request.use(new RequestBodyInterceptor());
  }

  /**
   * 发起HTTP请求
   *
   * @param url - 请求URL路径
   * @param request - 请求选项，包括路径参数、查询参数等
   * @returns Promise<Response> HTTP响应
   */
  async fetch(url: string, request: FetcherRequest = {}): Promise<Response> {
    // 合并默认请求头和请求级请求头
    const mergedHeaders = {
      ...(this.headers || {}),
      ...(request.headers || {}),
    };
    // 合并请求选项
    const fetchRequest: FetcherRequest = {
      ...request,
      headers:
        Object.keys(mergedHeaders).length > 0 ? mergedHeaders : undefined,
    };
    const finalUrl = this.urlBuilder.build(
      url,
      request.pathParams,
      request.queryParams,
    );
    let exchange: FetchExchange = {
      fetcher: this,
      url: finalUrl,
      request: fetchRequest,
      response: undefined,
      error: undefined,
    };
    try {
      // Apply request interceptors
      exchange = await this.interceptors.request.intercept(exchange);
      exchange.response = await this.timeoutFetch(exchange);
      // Apply response interceptors
      exchange = await this.interceptors.response.intercept(exchange);
      return exchange.response!!;
    } catch (error) {
      // Apply error interceptors
      exchange.error = error;
      exchange = await this.interceptors.error.intercept(exchange);
      if (exchange.response) {
        return exchange.response;
      }
      throw exchange.error;
    }
  }

  /**
   * 带超时控制的HTTP请求方法
   *
   * 该方法使用Promise.race来实现超时控制，同时发起fetch请求和超时Promise，
   * 当任一Promise完成时，会返回其结果或抛出异常。
   *
   * @param exchange
   * @returns Promise<Response> HTTP响应Promise
   * @throws FetchTimeoutError 当请求超时时抛出
   */
  private async timeoutFetch(exchange: FetchExchange) {
    // Extract timeout from request
    const url = exchange.url;
    const request = exchange.request;
    const requestTimeout = request.timeout;
    const timeout = resolveTimeout(requestTimeout, this.timeout);
    if (!timeout) {
      // @ts-ignore
      return fetch(url, request);
    }

    const controller = new AbortController();
    // 创建新的请求对象，避免修改原始请求对象
    const fetchRequest = {
      ...request,
      signal: controller.signal,
    };

    let timerId: ReturnType<typeof setTimeout> | null = null;
    const timeoutPromise = new Promise<Response>((_, reject) => {
      timerId = setTimeout(() => {
        // 清理定时器资源并处理超时错误
        if (timerId) {
          clearTimeout(timerId);
        }
        const error = new FetchTimeoutError(
          exchange,
          timeout,
        );
        controller.abort(error);
        reject(error);
      }, timeout);
    });

    try {
      // @ts-ignore
      return await Promise.race([fetch(url, fetchRequest), timeoutPromise]);
    } finally {
      // 清理定时器资源
      if (timerId) {
        clearTimeout(timerId);
      }
    }
  }

  /**
   * 发起GET请求
   *
   * @param url - 请求URL路径
   * @param request - 请求选项，包括路径参数、查询参数等
   * @returns Promise<Response> HTTP响应
   */
  async get(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD | RequestField.BODY> = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method: HttpMethod.GET,
    });
  }

  /**
   * 发起POST请求
   *
   * @param url - 请求URL路径
   * @param request - 请求选项，包括路径参数、查询参数、请求体等
   * @returns Promise<Response> HTTP响应
   */
  async post(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD> = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method: HttpMethod.POST,
    });
  }

  /**
   * 发起PUT请求
   *
   * @param url - 请求URL路径
   * @param request - 请求选项，包括路径参数、查询参数、请求体等
   * @returns Promise<Response> HTTP响应
   */
  async put(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD> = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method: HttpMethod.PUT,
    });
  }

  /**
   * 发起DELETE请求
   *
   * @param url - 请求URL路径
   * @param request - 请求选项，包括路径参数、查询参数等
   * @returns Promise<Response> HTTP响应
   */
  async delete(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD> = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method: HttpMethod.DELETE,
    });
  }

  /**
   * 发起PATCH请求
   *
   * @param url - 请求URL路径
   * @param request - 请求选项，包括路径参数、查询参数、请求体等
   * @returns Promise<Response> HTTP响应
   */
  async patch(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD> = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method: HttpMethod.PATCH,
    });
  }

  /**
   * 发起HEAD请求
   *
   * @param url - 请求URL路径
   * @param request - 请求选项，包括路径参数、查询参数等
   * @returns Promise<Response> HTTP响应
   */
  async head(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD | RequestField.BODY> = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method: HttpMethod.HEAD,
    });
  }

  /**
   * 发起OPTIONS请求
   *
   * @param url - 请求URL路径
   * @param request - 请求选项，包括路径参数、查询参数等
   * @returns Promise<Response> HTTP响应
   */
  async options(
    url: string,
    request: Omit<FetcherRequest, RequestField.METHOD | RequestField.BODY> = {},
  ): Promise<Response> {
    return this.fetch(url, {
      ...request,
      method: HttpMethod.OPTIONS,
    });
  }
}
